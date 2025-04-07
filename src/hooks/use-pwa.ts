import { useEffect, useState } from 'react';

export function usePwaMode() {
  const [isPwa, setIsPwa] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check for standalone mode (PWA)
    const isPwaStandalone = 
      // @ts-ignore - navigator.standalone exists on iOS Safari but not in the type definitions
      typeof window !== 'undefined' && (window.navigator.standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches);
    
    // Check for iOS
    const isIOSDevice = typeof window !== 'undefined' && 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      // @ts-ignore - MSStream is used to detect IE on Windows Phone
      !window.MSStream;
    
    // Check for Android
    const isAndroidDevice = typeof window !== 'undefined' && 
      /Android/.test(navigator.userAgent);
    
    setIsPwa(isPwaStandalone);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    
    // Add debug logging
    if (isPwaStandalone) {
      console.log('Running in PWA mode');
      if (isIOSDevice) console.log('iOS PWA detected');
      if (isAndroidDevice) console.log('Android PWA detected');
    }
  }, []);

  return { isPwa, isIOS, isAndroid };
} 