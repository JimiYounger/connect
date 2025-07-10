'use client';

import { useEffect } from 'react';

export default function PWAHandler() {
  useEffect(() => {
    // PWA detection and handling
    const isPwa = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    let wasPwaBeforePause = false;
    
    // Initial PWA detection
    if (isPwa) {
      console.log("PWA mode detected - applying PWA layout");
      document.documentElement.classList.add('pwa-mode');
      
      // Fix iOS Safari viewport issues
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }
      
      // Store PWA state persistently
      sessionStorage.setItem('was_pwa_mode', 'true');
      localStorage.setItem('pwa_mode_detected', 'true');
    }
    
    // Try to detect PWA from previous sessions
    if (!isPwa && (sessionStorage.getItem('was_pwa_mode') === 'true' || localStorage.getItem('pwa_mode_detected') === 'true')) {
      console.log("Previously detected as PWA - restoring PWA layout");
      document.documentElement.classList.add('pwa-mode');
    }
    
    // Enhanced PWA Layout setup
    function setupPwaLayout() {
      const isPwaActive = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
      wasPwaBeforePause = sessionStorage.getItem('was_pwa_mode') === 'true' || localStorage.getItem('pwa_mode_detected') === 'true';
      
      // Apply PWA mode if currently in PWA or was in PWA before
      if (isPwaActive || wasPwaBeforePause) {
        console.log("Setting up PWA layout", { isPwaActive, wasPwaBeforePause });
        document.documentElement.classList.add('pwa-mode');
        
        const mainEl = document.getElementById('pwa-main-content');
        if (mainEl) {
          // Configure main content container
          mainEl.classList.add('pwa-active-content');
          (mainEl.style as any).webkitOverflowScrolling = 'touch';
        
          // Ensure navigation items can be clicked
          const navElems = document.querySelectorAll('.nav-menu-positioner, .nav-logo-positioner');
          navElems.forEach(navElem => {
            (navElem as HTMLElement).style.pointerEvents = 'auto';
            
            // Process all clickable elements
            const clickableElements = navElem.querySelectorAll('a, button');
            clickableElements.forEach(el => {
              const element = el as HTMLElement;
              // Ensure the element can receive touch events
              element.style.pointerEvents = 'auto';
              element.style.cursor = 'pointer';
              element.style.touchAction = 'manipulation';
              
              // Remove click delay on mobile
              (element.style as any).tapHighlightColor = 'transparent';
              (element.style as any).webkitTapHighlightColor = 'transparent';
              
              // Add active state visual feedback
              element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
              });
              
              element.addEventListener('touchend', function() {
                this.style.opacity = '1';
              });
            });
          });
          
          // Handle visibility changes to fix iOS issues
          const visibilityHandler = () => {
            if (document.visibilityState === 'visible') {
              // Force recalculation of navigation layout when app resumes
              setTimeout(() => {
                const navWrapper = document.querySelector('.navigation-wrapper');
                if (navWrapper) {
                  const navElement = navWrapper as HTMLElement;
                  // This subtle manipulation forces a layout recalculation
                  navElement.style.display = 'none';
                  void navElement.offsetHeight; // Force reflow
                  navElement.style.display = '';
                }
              }, 100);
            }
          };
          
          document.addEventListener('visibilitychange', visibilityHandler);
          
          // Cleanup function
          return () => {
            document.removeEventListener('visibilitychange', visibilityHandler);
          };
        }
      }
    }
    
    // Apply PWA setup with multiple trigger points
    if (isPwa || sessionStorage.getItem('was_pwa_mode') === 'true' || localStorage.getItem('pwa_mode_detected') === 'true') {
      // Run immediately
      setupPwaLayout();
      
      // Run when window is resized
      const resizeHandler = () => setupPwaLayout();
      window.addEventListener('resize', resizeHandler);
      
      // Run when app resumes from background
      const visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          console.log("Visibility changed to visible - reapplying PWA layout");
          setupPwaLayout();
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
      
      // Run on orientation change
      const orientationHandler = () => {
        console.log("Orientation changed - reapplying PWA layout");
        // Apply after a delay to ensure new dimensions are correct
        setTimeout(setupPwaLayout, 100);
        setTimeout(setupPwaLayout, 500);
      };
      window.addEventListener('orientationchange', orientationHandler);
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', resizeHandler);
        document.removeEventListener('visibilitychange', visibilityHandler);
        window.removeEventListener('orientationchange', orientationHandler);
      };
    }
  }, []);

  return null; // No DOM output
}