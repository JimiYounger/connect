'use client';

import { useEffect } from 'react';

export default function PWAInstallPrompt() {
  useEffect(() => {
    // PWA installation prompt
    let deferredPrompt: any;
    
    const handleBeforeInstallPrompt = (e: Event) => {
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
    };
    
    const showInstallPrompt = () => {
      // Only create the prompt if not already in the DOM
      if (!document.getElementById('pwa-install-prompt')) {
        const promptContainer = document.createElement('div');
        promptContainer.id = 'pwa-install-prompt';
        promptContainer.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #181818;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          max-width: 90%;
          width: 360px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        `;
        
        // Create content
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: bold; font-size: 18px;';
        title.textContent = 'Add to Home Screen';
        
        const description = document.createElement('div');
        description.style.cssText = 'font-size: 14px; margin-top: 8px; margin-bottom: 16px;';
        description.textContent = 'Install Connect for the best experience with offline access and faster loading times.';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px;';
        
        const installButton = document.createElement('button');
        installButton.textContent = 'Install';
        installButton.style.cssText = `
          background-color: #5c67de;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: bold;
          cursor: pointer;
        `;
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Not Now';
        cancelButton.style.cssText = `
          background-color: transparent;
          color: #999;
          border: none;
          padding: 8px 16px;
          cursor: pointer;
        `;
        
        const dismissPrompt = () => {
          if (document.getElementById('pwa-install-prompt')) {
            document.body.removeChild(promptContainer);
          }
        };
        
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
    };
    
    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Show custom iOS installation prompt since they don't support beforeinstallprompt
    if (isIOS && isSafari && !(window.navigator as any).standalone) {
      // Wait a bit before showing the prompt
      setTimeout(() => {
        const hasPromptBeenShown = localStorage.getItem('iosPromptShown');
        const lastPromptTime = localStorage.getItem('iosPromptTime');
        const currentTime = Date.now();
        const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
        
        if (!hasPromptBeenShown || !lastPromptTime || (currentTime - parseInt(lastPromptTime, 10) > oneWeekInMs)) {
          const iosPrompt = document.createElement('div');
          iosPrompt.id = 'ios-install-prompt';
          iosPrompt.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #181818;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            width: 360px;
            max-width: 90%;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
          `;
          
          const title = document.createElement('div');
          title.style.cssText = 'font-weight: bold; font-size: 18px;';
          title.textContent = 'Add to Home Screen';
          
          const description = document.createElement('div');
          description.style.cssText = 'font-size: 14px; margin-top: 8px; margin-bottom: 8px;';
          description.innerHTML = '<p>To install Connect on your device:</p><ol style="padding-left: 20px; margin-top: 8px;"><li>Tap the <strong>Share</strong> button</li><li>Scroll down and select <strong>Add to Home Screen</strong></li></ol>';
          
          const closeButton = document.createElement('button');
          closeButton.textContent = 'Got it';
          closeButton.style.cssText = `
            align-self: flex-end;
            background-color: #5c67de;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            margin-top: 8px;
            font-weight: bold;
            cursor: pointer;
          `;
          
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
    
    // Add event listener for PWA install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}