// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google'
import { Providers } from '@/providers/providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Connect by Purelight",
  description: "Everything You Need In One Place",
  openGraph: {
    title: "Connect by Purelight",
    description: "Everything You Need In One Place",
    url: "https://plpconnect.com",
    images: [
      {
        url: "https://ucarecdn.com/43907444-0ddb-4271-a3ec-c28ab182b972/-/preview/1000x1000/",
        width: 1000,
        height: 1000,
        alt: "Connect Thumbnail",
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Connect by Purelight",
    description: "Everything You Need In One Place",
    images: [
      "https://ucarecdn.com/43907444-0ddb-4271-a3ec-c28ab182b972/-/preview/1000x1000/"
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS: Custom Home Screen Icon & App Title */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="Connect" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

        {/* Android: Link to Manifest & Set Theme Color */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        {/* iOS PWA fixes */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Complete iOS PWA scrolling fix
            const isPwa = window.navigator.standalone;
            
            // Detect standalone mode (PWA)
            if (isPwa) {
              document.documentElement.classList.add('pwa-mode');
              
              // Fix iOS Safari viewport issues
              const viewport = document.querySelector('meta[name="viewport"]');
              if (viewport) {
                viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
              }
            }
            
            // Track touch start position
            let startY = 0;
            
            // Capture the start position on touch
            document.addEventListener('touchstart', function(e) {
              startY = e.touches[0].clientY;
            }, { passive: true });
            
            // Handle touch movement to prevent pull-to-refresh only at the top
            document.addEventListener('touchmove', function(e) {
              if (isPwa) {
                const y = e.touches[0].clientY;
                const mainContent = document.getElementById('pwa-main-content');
                const scrollTop = mainContent ? mainContent.scrollTop : 0;
                
                // Only prevent default when at the top of content and pulling down
                if (scrollTop <= 0 && y > startY) {
                  e.preventDefault();
                }
              }
            }, { passive: false });
            
            // Fix scrolling for PWA content
            function enableScrolling() {
              if (isPwa) {
                const mainEl = document.getElementById('pwa-main-content');
                if (mainEl) {
                  // Clear previous styles
                  mainEl.style.cssText = '';
                  
                  // Core styles for native iOS-like scrolling
                  mainEl.style.position = 'absolute';
                  mainEl.style.top = '0';
                  mainEl.style.left = '0';
                  mainEl.style.right = '0';
                  mainEl.style.bottom = '0';
                  mainEl.style.width = '100%';
                  mainEl.style.height = '100%';
                  mainEl.style.overflow = 'scroll'; // Change to scroll instead of auto
                  mainEl.style.WebkitOverflowScrolling = 'touch'; // Critical for momentum scrolling
                  mainEl.style.paddingTop = 'env(safe-area-inset-top)';
                  mainEl.style.paddingBottom = 'calc(env(safe-area-inset-bottom) + 20px)'; // Add extra padding
                  mainEl.style.backgroundColor = '#000000';
                  
                  // Fix body
                  document.body.style.position = 'fixed';
                  document.body.style.top = '0';
                  document.body.style.left = '0';
                  document.body.style.right = '0';
                  document.body.style.bottom = '0';
                  document.body.style.width = '100%';
                  document.body.style.height = '100%';
                  document.body.style.overflow = 'hidden';
                  
                  // Setup resize listener for viewport changes
                  const resizeObserver = new ResizeObserver(() => {
                    mainEl.style.height = '100%';
                    mainEl.style.paddingBottom = 'calc(env(safe-area-inset-bottom) + 20px)';
                  });
                  resizeObserver.observe(document.documentElement);
                }
              } else {
                // For regular browser mode
                const mainEl = document.getElementById('pwa-main-content');
                if (mainEl) {
                  mainEl.style.cssText = '';
                  mainEl.style.height = 'auto';
                  mainEl.style.minHeight = '100vh';
                  mainEl.style.overflow = 'visible';
                  mainEl.style.width = '100%';
                  
                  document.body.style.position = '';
                  document.body.style.overflow = '';
                  document.body.style.height = '';
                }
              }
            }
            
            // Make absolutely sure the PWA scrolling is applied
            if (isPwa) {
              // Apply immediately
              enableScrolling();
              
              // Apply after DOM loads
              document.addEventListener('DOMContentLoaded', enableScrolling);
              
              // Apply after all resources load
              window.addEventListener('load', enableScrolling);
            }

            // Make sure viewport height is correct on iOS
            const setAppHeight = () => {
              document.documentElement.style.setProperty('--app-height', \`\${window.innerHeight}px\`);
            };
            window.addEventListener('resize', setAppHeight);
            setAppHeight();
          `
        }} />
        <style>{`
          .auth-loading { display: none; }
          .auth-content { opacity: 1; }
          .loading .auth-loading { display: block; }
          .loading .auth-content { opacity: 0; }
        `}</style>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Check if we're in auth loading state
                if (localStorage.getItem('auth_loading') === 'true') {
                  document.body.classList.add('loading');
                }
                
                // Listen for page load to properly handle auth redirects
                window.addEventListener('load', function() {
                  // If we're on the dashboard page and we were in a loading state
                  if (window.location.pathname.includes('/dashboard') && localStorage.getItem('auth_loading') === 'true') {
                    // Clear the loading state
                    localStorage.removeItem('auth_loading');
                    document.body.classList.remove('loading');
                  }
                  
                  // If we're redirected to home with a ?error or ?redirectedFrom parameter
                  if (window.location.pathname === '/' && 
                      (window.location.search.includes('error') || window.location.search.includes('redirectedFrom'))) {
                    // Clear loading state as something went wrong
                    localStorage.removeItem('auth_loading');
                    document.body.classList.remove('loading');
                  }
                });
              } catch (e) {
                console.error('Auth loading script error:', e);
              }
            })();
          `
        }} />
        
        {/* PWA Install Prompt */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // PWA installation prompt
              let deferredPrompt;
              const promptContainer = document.createElement('div');
              
              window.addEventListener('beforeinstallprompt', (e) => {
                // Prevent the mini-infobar from appearing on mobile
                e.preventDefault();
                // Stash the event so it can be triggered later
                deferredPrompt = e;
                
                // Check if user has previously dismissed the prompt
                const hasPromptBeenShown = localStorage.getItem('pwaPromptShown');
                const lastPromptTime = localStorage.getItem('pwaPromptTime');
                const currentTime = Date.now();
                const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
                
                // Only show if not previously shown or it's been more than a week
                if (!hasPromptBeenShown || !lastPromptTime || (currentTime - parseInt(lastPromptTime, 10) > oneWeekInMs)) {
                  // Wait a bit before showing the prompt
                  setTimeout(() => {
                    showInstallPrompt();
                  }, 3000);
                }
              });
              
              function showInstallPrompt() {
                // Only create the prompt if not already in the DOM
                if (!document.getElementById('pwa-install-prompt')) {
                  // Create the prompt UI
                  promptContainer.id = 'pwa-install-prompt';
                  promptContainer.style.position = 'fixed';
                  promptContainer.style.bottom = '20px';
                  promptContainer.style.left = '50%';
                  promptContainer.style.transform = 'translateX(-50%)';
                  promptContainer.style.backgroundColor = '#181818';
                  promptContainer.style.borderRadius = '12px';
                  promptContainer.style.padding = '16px';
                  promptContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                  promptContainer.style.maxWidth = '90%';
                  promptContainer.style.width = '360px';
                  promptContainer.style.zIndex = '9999';
                  promptContainer.style.display = 'flex';
                  promptContainer.style.flexDirection = 'column';
                  promptContainer.style.color = 'white';
                  promptContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                  
                  // Create content
                  const title = document.createElement('div');
                  title.style.fontWeight = 'bold';
                  title.style.fontSize = '18px';
                  title.textContent = 'Add to Home Screen';
                  
                  const description = document.createElement('div');
                  description.style.fontSize = '14px';
                  description.style.marginTop = '8px';
                  description.style.marginBottom = '16px';
                  description.textContent = 'Install Connect for the best experience with offline access and faster loading times.';
                  
                  const buttonContainer = document.createElement('div');
                  buttonContainer.style.display = 'flex';
                  buttonContainer.style.justifyContent = 'flex-end';
                  buttonContainer.style.gap = '12px';
                  
                  const installButton = document.createElement('button');
                  installButton.textContent = 'Install';
                  installButton.style.backgroundColor = '#5c67de';
                  installButton.style.color = 'white';
                  installButton.style.border = 'none';
                  installButton.style.borderRadius = '6px';
                  installButton.style.padding = '8px 16px';
                  installButton.style.fontWeight = 'bold';
                  installButton.style.cursor = 'pointer';
                  
                  const cancelButton = document.createElement('button');
                  cancelButton.textContent = 'Not Now';
                  cancelButton.style.backgroundColor = 'transparent';
                  cancelButton.style.color = '#999';
                  cancelButton.style.border = 'none';
                  cancelButton.style.padding = '8px 16px';
                  cancelButton.style.cursor = 'pointer';
                  
                  // Add event listeners
                  installButton.addEventListener('click', async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      console.log('User choice:', outcome);
                      deferredPrompt = null;
                    }
                    dismissPrompt();
                  });
                  
                  cancelButton.addEventListener('click', () => {
                    dismissPrompt();
                  });
                  
                  // Add items to the DOM
                  buttonContainer.appendChild(cancelButton);
                  buttonContainer.appendChild(installButton);
                  
                  promptContainer.appendChild(title);
                  promptContainer.appendChild(description);
                  promptContainer.appendChild(buttonContainer);
                  
                  document.body.appendChild(promptContainer);
                  
                  // Record that we've shown the prompt
                  localStorage.setItem('pwaPromptShown', 'true');
                  localStorage.setItem('pwaPromptTime', Date.now().toString());
                }
              }
              
              function dismissPrompt() {
                if (document.getElementById('pwa-install-prompt')) {
                  document.body.removeChild(promptContainer);
                }
              }
              
              // Detect iOS Safari
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
              const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
              
              // Show custom iOS installation prompt since they don't support beforeinstallprompt
              if (isIOS && isSafari && !navigator.standalone) {
                // Wait a bit before showing the prompt
                setTimeout(() => {
                  const hasPromptBeenShown = localStorage.getItem('iosPromptShown');
                  const lastPromptTime = localStorage.getItem('iosPromptTime');
                  const currentTime = Date.now();
                  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
                  
                  if (!hasPromptBeenShown || !lastPromptTime || (currentTime - parseInt(lastPromptTime, 10) > oneWeekInMs)) {
                    const iosPrompt = document.createElement('div');
                    iosPrompt.id = 'ios-install-prompt';
                    iosPrompt.style.position = 'fixed';
                    iosPrompt.style.bottom = '20px';
                    iosPrompt.style.left = '50%';
                    iosPrompt.style.transform = 'translateX(-50%)';
                    iosPrompt.style.backgroundColor = '#181818';
                    iosPrompt.style.borderRadius = '12px';
                    iosPrompt.style.padding = '16px';
                    iosPrompt.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                    iosPrompt.style.width = '360px';
                    iosPrompt.style.maxWidth = '90%';
                    iosPrompt.style.zIndex = '9999';
                    iosPrompt.style.display = 'flex';
                    iosPrompt.style.flexDirection = 'column';
                    iosPrompt.style.color = 'white';
                    iosPrompt.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                    
                    const title = document.createElement('div');
                    title.style.fontWeight = 'bold';
                    title.style.fontSize = '18px';
                    title.textContent = 'Add to Home Screen';
                    
                    const description = document.createElement('div');
                    description.style.fontSize = '14px';
                    description.style.marginTop = '8px';
                    description.style.marginBottom = '8px';
                    description.innerHTML = '<p>To install Connect on your device:</p><ol style="padding-left: 20px; margin-top: 8px;"><li>Tap the <strong>Share</strong> button</li><li>Scroll down and select <strong>Add to Home Screen</strong></li></ol>';
                    
                    const closeButton = document.createElement('button');
                    closeButton.textContent = 'Got it';
                    closeButton.style.alignSelf = 'flex-end';
                    closeButton.style.backgroundColor = '#5c67de';
                    closeButton.style.color = 'white';
                    closeButton.style.border = 'none';
                    closeButton.style.borderRadius = '6px';
                    closeButton.style.padding = '8px 16px';
                    closeButton.style.marginTop = '8px';
                    closeButton.style.fontWeight = 'bold';
                    closeButton.style.cursor = 'pointer';
                    
                    closeButton.addEventListener('click', () => {
                      document.body.removeChild(iosPrompt);
                      localStorage.setItem('iosPromptShown', 'true');
                      localStorage.setItem('iosPromptTime', Date.now().toString());
                    });
                    
                    iosPrompt.appendChild(title);
                    iosPrompt.appendChild(description);
                    iosPrompt.appendChild(closeButton);
                    
                    document.body.appendChild(iosPrompt);
                  }
                }, 3000);
              }
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col ${inter.className}`}
        style={{
          backgroundColor: '#000000',
          overflow: 'hidden'
        }}
      >
        <Providers>
          <main id="pwa-main-content" className="flex-1 w-full bg-black text-black">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
