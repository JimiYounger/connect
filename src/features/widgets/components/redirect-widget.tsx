// my-app/src/features/widgets/components/redirect-widget.tsx

import React from 'react';
import { RedirectWidgetProps } from '../types';
import { processDynamicUrl } from './widget-renderer';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { WidgetService } from '../services/widget-service';
import { isMobile, openDeepLink, isIOS, isAndroid, getAppStoreLinks, DeepLinkConfig, canUseNativeDeepLinks } from '../utils/deep-link';

const widgetService = new WidgetService();

export const RedirectWidget: React.FC<RedirectWidgetProps> = ({
  widget,
  configuration,
  onInteraction,
}) => {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const userId = session?.user?.id;
  
  // Extract styles and configuration
  const styles = configuration?.styles || {};
  const backgroundColor = styles.backgroundColor || '#C6FC36';
  const titleColor = styles.titleColor || '#000000';
  const textColor = styles.textColor || '#000000';
  const borderRadius = styles.borderRadius || '8px';
  const padding = styles.padding || '16px';
  const thumbnailUrl = widget.thumbnail_url;
  const isCircle = widget.shape === 'circle';
  
  const handleRedirectClick = async () => {
    if (!configuration?.redirectUrl) return;
    
    // Process the URL with user data
    const processedUrl = processDynamicUrl(configuration.redirectUrl, profile);
    
    // Track the click if needed
    if (widget.id && userId) {
      widgetService.trackWidgetInteraction(widget.id, userId, 'click');
      if (onInteraction) {
        onInteraction('click');
      }
    }
    
    // Check for deep link configuration
    const deepLinkConfig = configuration?.deepLink;
    
    if (deepLinkConfig?.enabled && isMobile()) {
      // Determine the appropriate fallback URL based on device
      let fallbackUrl = processDynamicUrl(deepLinkConfig.webFallbackUrl || processedUrl, profile);
      let shouldUseAppStore = false;
      
      // Cast to DeepLinkConfig to access newer properties
      const config = deepLinkConfig as DeepLinkConfig;
      
      // First check for direct app store URLs
      if (isIOS() && 'iosAppStoreUrl' in config && config.iosAppStoreUrl) {
        fallbackUrl = config.iosAppStoreUrl;
        shouldUseAppStore = true;
      } else if (isAndroid() && 'androidAppStoreUrl' in config && config.androidAppStoreUrl) {
        fallbackUrl = config.androidAppStoreUrl;
        shouldUseAppStore = true;
      } 
      // Fall back to legacy app store IDs if direct URLs aren't available
      else if (isIOS() && deepLinkConfig.iosAppStoreId) {
        const storeLinks = getAppStoreLinks(deepLinkConfig.iosAppStoreId);
        fallbackUrl = storeLinks.ios;
        shouldUseAppStore = true;
      } else if (isAndroid() && deepLinkConfig.androidAppStoreId) {
        const storeLinks = getAppStoreLinks(deepLinkConfig.androidAppStoreId);
        fallbackUrl = storeLinks.android;
        shouldUseAppStore = true;
      }
      
      // If we can't use deep links and have app store URL, use it directly
      if (!canUseNativeDeepLinks() && shouldUseAppStore) {
        window.open(fallbackUrl, '_blank');
        return;
      }
      
      // Use deep linking with the determined fallback URL
      await openDeepLink({
        ...deepLinkConfig,
        webFallbackUrl: fallbackUrl
      });
    } else {
      // Standard web redirect
      window.open(processedUrl, '_blank');
    }
  };
  
  return (
    <div 
      className="redirect-widget w-full h-full cursor-pointer"
      onClick={handleRedirectClick}
      style={{
        backgroundColor: thumbnailUrl ? 'transparent' : backgroundColor,
        backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: isCircle ? '50%' : borderRadius,
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isCircle ? 'center' : 'flex-end',
        alignItems: isCircle ? 'center' : 'flex-start',
        textAlign: isCircle ? 'center' : 'left',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
      }}
    >
      {!thumbnailUrl && (
        <div 
          className={`flex flex-col w-full ${isCircle ? 'items-center pb-0' : 'items-start pb-4'}`}
        >
          {configuration?.title && (
            <h3 
              className="font-semibold text-2xl md:text-3xl" 
              style={{ color: titleColor }}
            >
              {configuration.title}
            </h3>
          )}
          
          {configuration?.subtitle && (
            <p 
              className="text-lg" 
              style={{ color: textColor }}
            >
              {configuration.subtitle}
            </p>
          )}
          
          {configuration?.description && (
            <p 
              className="text-sm mt-1" 
              style={{ color: textColor }}
            >
              {configuration.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RedirectWidget;

// Register this component with the registry
import { widgetRegistry } from '../registry';
import { WidgetType } from '../types';

widgetRegistry.register(WidgetType.REDIRECT, RedirectWidget);