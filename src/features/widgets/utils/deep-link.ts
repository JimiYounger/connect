// my-app/src/features/widgets/utils/deep-link.ts

/**
 * Deep linking functionality for redirect widgets
 * Enables opening mobile apps via deep links with web fallback
 */

/**
 * Type definition for deep link configuration
 */
export interface DeepLinkConfig {
  enabled: boolean;
  iosScheme?: string;
  androidPackage?: string;
  webFallbackUrl: string;
}

/**
 * Common app presets for deep linking
 */
export const APP_PRESETS = {
  gmail: {
    name: 'Gmail',
    iosScheme: 'googlegmail://',
    androidPackage: 'com.google.android.gm',
  },
  salesforce: {
    name: 'Salesforce',
    iosScheme: 'salesforce://',
    androidPackage: 'com.salesforce.chatter',
  },
  outlook: {
    name: 'Outlook',
    iosScheme: 'ms-outlook://',
    androidPackage: 'com.microsoft.office.outlook',
  },
  teams: {
    name: 'Microsoft Teams',
    iosScheme: 'msteams://',
    androidPackage: 'com.microsoft.teams',
  },
  zoom: {
    name: 'Zoom',
    iosScheme: 'zoomus://',
    androidPackage: 'us.zoom.videomeetings',
  },
  slack: {
    name: 'Slack',
    iosScheme: 'slack://',
    androidPackage: 'com.Slack',
  },
} as const;

export type AppPreset = keyof typeof APP_PRESETS;

/**
 * Check if the current device is iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Check if the current device is Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

/**
 * Check if the current device is mobile
 */
export const isMobile = (): boolean => {
  return isIOS() || isAndroid();
};

/**
 * Open a deep link with fallback to web URL if app isn't installed
 * 
 * @param config Deep link configuration
 * @param timeout Timeout in ms before falling back to web URL (default: 2000ms)
 * @returns Promise that resolves when navigation occurs
 */
export const openDeepLink = async (
  config: DeepLinkConfig,
  timeout: number = 2000
): Promise<void> => {
  if (!config.enabled || !isMobile()) {
    // If deep linking is disabled or not on mobile, use web fallback directly
    window.open(config.webFallbackUrl, '_blank');
    return;
  }

  return new Promise((resolve) => {
    // Store current time to check if we navigated away
    const start = Date.now();
    let deepLinkUrl: string | null = null;
    
    // Set up timeout for fallback
    const fallbackTimeout = setTimeout(() => {
      // Only fallback if we're still on this page
      if (document.hidden || Date.now() - start > timeout + 500) {
        return;
      }
      
      // If we're still here after timeout, app wasn't opened
      window.open(config.webFallbackUrl, '_blank');
      resolve();
    }, timeout);

    // Determine which deep link to use based on platform
    if (isIOS() && config.iosScheme) {
      deepLinkUrl = config.iosScheme;
    } else if (isAndroid() && config.androidPackage) {
      deepLinkUrl = `intent://#Intent;scheme=https;package=${config.androidPackage};end`;
    }

    // If we have a deep link URL, try to open it
    if (deepLinkUrl) {
      // Create iframe for iOS (more reliable than window.location)
      if (isIOS()) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = deepLinkUrl;
        document.body.appendChild(iframe);
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      } else {
        // For Android, we use window.location
        window.location.href = deepLinkUrl;
      }
    } else {
      // No deep link available, use web fallback
      window.open(config.webFallbackUrl, '_blank');
      clearTimeout(fallbackTimeout);
      resolve();
    }
    
    // Handle visibility change (app opened successfully)
    const visibilityChangeHandler = () => {
      if (document.hidden) {
        clearTimeout(fallbackTimeout);
        resolve();
      }
    };
    
    document.addEventListener('visibilitychange', visibilityChangeHandler);
    
    // Clean up after timeout
    setTimeout(() => {
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
    }, timeout + 1000);
  });
};