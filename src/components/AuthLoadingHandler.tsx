'use client';

import { useEffect } from 'react';

export default function AuthLoadingHandler() {
  useEffect(() => {
    // Check if we're in auth loading state
    if (localStorage.getItem('auth_loading') === 'true') {
      document.body.classList.add('loading');
    }
    
    // Listen for page load to properly handle auth redirects
    const handleLoad = () => {
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
    };

    window.addEventListener('load', handleLoad);
    
    // Run immediately in case load event already fired
    handleLoad();
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return null;
}