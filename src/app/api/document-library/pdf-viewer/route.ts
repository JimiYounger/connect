import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Fetch the PDF content first
    console.log('Fetching PDF from URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch PDF:', response.status, response.statusText);
      return NextResponse.json({ 
        error: `Failed to fetch PDF: ${response.status} ${response.statusText}` 
      }, { status: 500 });
    }
    
    // Get the PDF data as ArrayBuffer
    const pdfData = await response.arrayBuffer();
    
    // Convert to base64 for embedding in the HTML
    const base64Data = Buffer.from(pdfData).toString('base64');
    const dataUri = `data:application/pdf;base64,${base64Data}`;
    
    console.log('PDF fetched successfully, size:', pdfData.byteLength);

    // Create a customized HTML page using PDF.js with a limited toolbar
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secure Document Viewer</title>
        
        <!-- PDF.js stylesheets -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf_viewer.min.css" integrity="sha512-VYsoUnChapJ+FPQmOfQQK8Vf3HEtYJcCFJGXUwOhgGJpM7iANsszCcRG9+zG4QLLg0YSKfhEZYgGOjNI78NJQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: #e0e0e0;
          }
          
          #toolbar {
            background-color: #2d2d2d;
            color: white;
            padding: 6px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            z-index: 10;
            position: sticky;
            top: 0;
          }
          
          #page-controls {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          #pageNumber {
            width: 40px;
            text-align: center;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 3px;
            padding: 3px;
          }
          
          #zoom-controls {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 3px;
          }
          
          button:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          #viewerContainer {
            flex: 1;
            overflow: auto;
            background-color: #e0e0e0;
            display: flex;
            justify-content: center;
            position: relative;
          }
          
          #viewer {
            position: relative;
            background-color: #e0e0e0;
            min-height: 100%;
            padding: 10px 0;
          }
          
          .page {
            margin: 10px auto;
            background-color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: relative;
          }
          
          .loadingInProgress #viewer {
            display: none;
          }
          
          #loading {
            display: none;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            background-color: #e0e0e0;
          }
          
          .loadingInProgress #loading {
            display: flex;
          }
          
          canvas {
            display: block;
            margin: 0 auto;
          }
          
          /* Ensure the HTML and document both have the same background */
          html {
            background-color: #e0e0e0;
          }
          
          #backgroundLayer {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #e0e0e0;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div id="toolbar">
          <div id="page-controls">
            <button id="previous" title="Previous Page">◀</button>
            <span>
              <input type="text" id="pageNumber" class="toolbarField pageNumber" value="1" size="4" min="1">
              <span id="numPages">/</span>
            </span>
            <button id="next" title="Next Page">▶</button>
          </div>
          
          <div id="zoom-controls">
            <button id="zoomOut" title="Zoom Out">−</button>
            <span id="scaleSelect">100%</span>
            <button id="zoomIn" title="Zoom In">+</button>
          </div>
        </div>
        
        <div id="viewerContainer">
          <div id="viewer" class="pdfViewer"></div>
          <div id="loading">Loading document...</div>
          <div id="backgroundLayer" class="absolute inset-0 bg-[#e0e0e0] -z-10"></div>
        </div>
          
        <!-- PDF.js scripts -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js" integrity="sha512-ZsHGIr+zYoMpJR+M0ynk0jH7U2V/S0F/2AEPFi5imeXl2EPx2HxM4TDNQG73jUvYGQWpa0hkQCHJtksOEbXLYg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        
        <script>
          document.body.classList.add('loadingInProgress');
          console.log('PDF Viewer initializing...');
          
          // Notify parent window about events
          function notifyParent(type, message) {
            try {
              window.parent.postMessage({ type, message }, '*');
            } catch (e) {
              console.error('Failed to communicate with parent window:', e);
            }
          }
          
          // Load the PDF.js library
          let pdfjsLib;
          
          function loadPdfJs() {
            // First check if already loaded
            if (window.pdfjsLib) {
              pdfjsLib = window.pdfjsLib;
              initPdfViewer();
              return;
            }

            // Otherwise load from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            script.onload = function() {
              console.log('PDF.js library loaded via script tag');
              
              // Set worker path
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
              
              pdfjsLib = window.pdfjsLib;
              initPdfViewer();
            };
            script.onerror = function(e) {
              console.error('Failed to load PDF.js library', e);
              document.getElementById('loading').textContent = 'Error: PDF.js library failed to load';
              document.getElementById('loading').style.display = 'flex';
              notifyParent('pdf-error', 'PDF.js library failed to load');
            };
            document.head.appendChild(script);
          }
          
          // Initialize PDF viewer once library is loaded
          function initPdfViewer() {
            const pdfDataUri = "${dataUri}";
            console.log('Using embedded PDF data');
            
            let pdfDoc = null;
            let pageNum = 1;
            let pageRendering = false;
            let pageNumPending = null;
            let scale = 1.0;
            
            const container = document.getElementById('viewerContainer');
            const viewer = document.getElementById('viewer');
            const loading = document.getElementById('loading');
            
            // Disable right-click on the viewer to prevent easy downloading
            container.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              return false;
            });
            
            function renderPage(num) {
              pageRendering = true;
              console.log('Rendering page', num);
              
              // Remove any existing pages
              while (viewer.firstChild) {
                viewer.removeChild(viewer.firstChild);
              }
              
              pdfDoc.getPage(num).then(function(page) {
                console.log('Page loaded successfully');
                const viewport = page.getViewport({ scale });
                
                // Create a page div
                const pageDiv = document.createElement('div');
                pageDiv.className = 'page';
                pageDiv.style.width = viewport.width + 'px';
                pageDiv.style.height = viewport.height + 'px';
                viewer.appendChild(pageDiv);
                
                // Create a canvas for page rendering
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                pageDiv.appendChild(canvas);
                
                // Render the page
                const renderContext = {
                  canvasContext: context,
                  viewport: viewport,
                  background: 'white'
                };
                
                const renderTask = page.render(renderContext);
                
                // Wait for rendering to finish
                renderTask.promise.then(function() {
                  console.log('Page rendered successfully');
                  pageRendering = false;
                  if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                  } else {
                    document.body.classList.remove('loadingInProgress');
                  }
                }).catch(function(error) {
                  console.error('Error rendering page:', error);
                  loading.textContent = 'Error rendering page: ' + error.message;
                  loading.style.display = 'flex';
                });
              }).catch(function(error) {
                console.error('Error getting page:', error);
                loading.textContent = 'Error getting page: ' + error.message;
                loading.style.display = 'flex';
              });
              
              // Update page counters
              document.getElementById('pageNumber').value = num;
            }
            
            function queueRenderPage(num) {
              if (pageRendering) {
                pageNumPending = num;
              } else {
                renderPage(num);
              }
            }
            
            function onPrevPage() {
              if (pageNum <= 1) {
                return;
              }
              pageNum--;
              queueRenderPage(pageNum);
            }
            
            function onNextPage() {
              if (pageNum >= pdfDoc.numPages) {
                return;
              }
              pageNum++;
              queueRenderPage(pageNum);
            }
            
            function zoomIn() {
              scale += 0.1;
              document.getElementById('scaleSelect').textContent = Math.round(scale * 100) + '%';
              queueRenderPage(pageNum);
            }
            
            function zoomOut() {
              if (scale <= 0.2) return;
              scale -= 0.1;
              document.getElementById('scaleSelect').textContent = Math.round(scale * 100) + '%';
              queueRenderPage(pageNum);
            }
            
            // Set up loading timeout to detect issues
            const loadingTimeout = setTimeout(() => {
              console.warn('PDF loading taking longer than expected');
              loading.textContent = 'Loading is taking longer than expected...';
            }, 5000);
            
            // Try to load the PDF from the data URI
            try {
              const pdfData = atob(pdfDataUri.split(',')[1]);
              const loadingTask = pdfjsLib.getDocument({
                data: pdfData,
                cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/cmaps/',
                cMapPacked: true,
              });
              
              loadingTask.promise.then(function(pdfDoc_) {
                clearTimeout(loadingTimeout);
                console.log('PDF document loaded successfully');
                pdfDoc = pdfDoc_;
                document.getElementById('numPages').textContent = '/ ' + pdfDoc.numPages;
                
                // Initial render
                renderPage(pageNum);
                
                // Notify parent that PDF is loaded
                notifyParent('pdf-loaded', 'PDF loaded successfully');
              }).catch(function(error) {
                clearTimeout(loadingTimeout);
                console.error('Error loading PDF:', error);
                document.body.classList.remove('loadingInProgress');
                loading.textContent = 'Error loading document: ' + error.message;
                loading.style.display = 'flex';
                
                // Notify parent about the error
                notifyParent('pdf-error', error.message || 'Failed to load PDF');
              });
            } catch (error) {
              clearTimeout(loadingTimeout);
              console.error('Error decoding PDF data:', error);
              document.body.classList.remove('loadingInProgress');
              loading.textContent = 'Error decoding document data';
              loading.style.display = 'flex';
              notifyParent('pdf-error', 'Error decoding document data');
            }
            
            // Button event listeners
            document.getElementById('previous').addEventListener('click', onPrevPage);
            document.getElementById('next').addEventListener('click', onNextPage);
            document.getElementById('zoomIn').addEventListener('click', zoomIn);
            document.getElementById('zoomOut').addEventListener('click', zoomOut);
            
            // Page number input handling
            document.getElementById('pageNumber').addEventListener('change', function() {
              const newPageNum = parseInt(this.value);
              if (newPageNum && newPageNum > 0 && newPageNum <= pdfDoc.numPages) {
                pageNum = newPageNum;
                queueRenderPage(pageNum);
              } else {
                this.value = pageNum;
              }
            });
          }
          
          // Start the process
          loadPdfJs();
        </script>
      </body>
      </html>
    `;

    // Return the HTML with appropriate content type
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error in PDF viewer route:', error);
    return NextResponse.json({ 
      error: 'Error processing PDF',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 