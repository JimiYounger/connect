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
  iosAppStoreId?: string;       // Legacy app store ID (deprecated)
  androidAppStoreId?: string;   // Legacy app store ID (deprecated)
  iosAppStoreUrl?: string;      // Direct iOS App Store URL (preferred)
  androidAppStoreUrl?: string;  // Direct Android Play Store URL (preferred)
  preset?: AppPreset;
}

/**
 * Common app presets for deep linking
 */
export const APP_PRESETS = {
  gmail: {
    name: 'Gmail',
    iosScheme: 'googlegmail://',
    androidPackage: 'com.google.android.gm',
    iosAppStoreUrl: 'https://apps.apple.com/us/app/gmail-email-by-google/id422689480',
    androidAppStoreUrl: 'https://play.google.com/store/apps/details?id=com.google.android.gm',
  },
  salesforce: {
    name: 'Salesforce',
    iosScheme: 'salesforce://',
    androidPackage: 'com.salesforce.chatter',
    iosAppStoreUrl: 'https://apps.apple.com/us/app/salesforce/id404249815',
    androidAppStoreUrl: 'https://play.google.com/store/apps/details?id=com.salesforce.chatter',
  },
  outlook: {
    name: 'Outlook',
    iosScheme: 'ms-outlook://',
    androidPackage: 'com.microsoft.office.outlook',
    iosAppStoreUrl: 'https://apps.apple.com/us/app/microsoft-outlook/id951937596',
    androidAppStoreUrl: 'https://play.google.com/store/apps/details?id=com.microsoft.office.outlook',
  },
  teams: {
    name: 'Microsoft Teams',
    iosScheme: 'msteams://',
    androidPackage: 'com.microsoft.teams',
    iosAppStoreUrl: 'https://apps.apple.com/us/app/microsoft-teams/id1113153706',
    androidAppStoreUrl: 'https://play.google.com/store/apps/details?id=com.microsoft.teams',
  },
  zoom: {
    name: 'Zoom',
    iosScheme: 'zoomus://',
    androidPackage: 'us.zoom.videomeetings',
    iosAppStoreUrl: 'https://apps.apple.com/us/app/zoom-one-platform-to-connect/id546505307',
    androidAppStoreUrl: 'https://play.google.com/store/apps/details?id=us.zoom.videomeetings',
  },
  slack: {
    name: 'Slack',
    iosScheme: 'slack://',
    androidPackage: 'com.Slack',
    iosAppStoreUrl: 'https://apps.apple.com/us/app/slack-for-desktop/id803453959',
    androidAppStoreUrl: 'https://play.google.com/store/apps/details?id=com.Slack',
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
// Add type definition for Safari's navigator extension
interface SafariNavigator extends Navigator {
  standalone?: boolean;
}

/**
 * Check if running in a PWA context
 */
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         // Use type assertion to handle Safari's standalone property
         (window.navigator as SafariNavigator).standalone === true;
};

/**
 * Check if running in Safari
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Android');
};

/**
 * Check if deep linking is likely to work in the current environment
 */
export const canUseNativeDeepLinks = (): boolean => {
  // Deep links have limitations in:
  // 1. PWAs on iOS
  // 2. Safari browser
  if (isPWA() && isIOS()) return false;
  if (isSafari()) return false;
  
  return true;
};

/**
 * Log deep linking debug info to console
 */
const logDeepLinkDebug = (config: DeepLinkConfig, message: string): void => {
  console.info(
    `[Deep Link Debug] ${message}\n`,
    `- Environment: ${isPWA() ? 'PWA' : 'Browser'}\n`,
    `- Platform: ${isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'Desktop'}\n`,
    `- Safari: ${isSafari() ? 'Yes' : 'No'}\n`,
    `- Can use native deep links: ${canUseNativeDeepLinks() ? 'Yes' : 'No'}\n`,
    `- Config:`, config
  );
};

export const openDeepLink = async (
  config: DeepLinkConfig,
  timeout: number = 2000
): Promise<void> => {
  // If deep linking is disabled, just use web fallback
  if (!config.enabled) {
    logDeepLinkDebug(config, "Deep linking disabled, using web fallback");
    window.open(config.webFallbackUrl, '_blank');
    return;
  }

  // Always log the attempt for debugging
  logDeepLinkDebug(config, "Attempting to use deep link");
  
  // Skip deep linking in Safari to avoid the "invalid address" error message
  if (isSafari()) {
    logDeepLinkDebug(config, "Safari detected, skipping deep link and using fallback directly");
    window.open(config.webFallbackUrl, '_blank');
    return;
  }
  
  // Use a shorter timeout for other environments with limited deep link support
  if (!canUseNativeDeepLinks()) {
    logDeepLinkDebug(config, "Environment has limited deep link support, using shorter timeout");
    timeout = 500; // Use a shorter timeout
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
      
      logDeepLinkDebug(config, "Timeout - app not opened, using web fallback");
      
      // If we're still here after timeout, app wasn't opened
      window.open(config.webFallbackUrl, '_blank');
      resolve();
    }, timeout);

    // Determine which deep link to use based on platform
    if (isIOS() && config.iosScheme) {
      // Use the direct URI scheme for iOS
      deepLinkUrl = config.iosScheme;
    } else if (isAndroid() && config.androidPackage) {
      // Generate intent URL for Android
      deepLinkUrl = `intent://#Intent;package=${config.androidPackage};scheme=https;end`;
    }

    if (!deepLinkUrl) {
      // No deep link URL available, use web fallback
      logDeepLinkDebug(config, "No deep link URL available, using web fallback");
      window.open(config.webFallbackUrl, '_blank');
      clearTimeout(fallbackTimeout);
      resolve();
      return;
    }

    try {
      logDeepLinkDebug(config, `Using deep link URL: ${deepLinkUrl}`);

      // The key is direct user interaction
      // Create and trigger a clickable element to launch the deep link
      const a = document.createElement('a');
      a.href = deepLinkUrl;
      a.style.display = 'none';
      a.setAttribute('target', '_blank'); // Important for iOS
      a.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(a);
      
      // Click the element to trigger the deep link with user interaction
      a.click();
      
      // For iOS, we also try the iframe method
      if (isIOS()) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = deepLinkUrl;
        document.body.appendChild(iframe);
        
        // Clean up after short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          document.body.removeChild(a);
        }, 100);
      } else {
        // Clean up the element after clicking
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error opening deep link:", error);
      window.open(config.webFallbackUrl, '_blank');
      clearTimeout(fallbackTimeout);
      resolve();
    }
    
    // Handle visibility change (app opened successfully)
    const visibilityChangeHandler = () => {
      if (document.hidden) {
        logDeepLinkDebug(config, "Visibility changed - app likely opened");
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

/**
 * Creates a direct app store link for an app
 * @param appId The app ID in the stores 
 * @returns Object with app store links
 */
export const getAppStoreLinks = (appId: string) => {
  return {
    ios: `https://apps.apple.com/app/id${appId}`,
    android: `https://play.google.com/store/apps/details?id=${appId}`
  };
};