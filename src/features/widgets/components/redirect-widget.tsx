// my-app/src/features/widgets/components/redirect-widget.tsx

import React from 'react';
import { RedirectWidgetProps } from '../types';

export const RedirectWidget: React.FC<RedirectWidgetProps> = ({ 
  widget, 
  configuration, 
  onInteraction 
}) => {
  const handleClick = () => {
    if (configuration?.redirectUrl) {
      // Log the interaction
      onInteraction?.('click');
      
      // Perform redirect based on configuration
      if (configuration.settings?.openInNewTab) {
        window.open(configuration.redirectUrl, '_blank');
      } else {
        window.location.href = configuration.redirectUrl;
      }
    }
  };

  return (
    <div 
      className="p-4 rounded-md shadow-sm bg-white cursor-pointer hover:shadow-md transition-all"
      onClick={handleClick}
      style={configuration?.styles ? { ...configuration.styles } : {}}
    >
      <h3 className="text-lg font-semibold">{configuration?.title || widget.name}</h3>
      {configuration?.subtitle && (
        <p className="text-sm text-gray-600">{configuration.subtitle}</p>
      )}
      {configuration?.description && (
        <p className="mt-2 text-gray-700">{configuration.description}</p>
      )}
      <div className="mt-3 text-blue-600 text-sm font-medium">
        Click to navigate →
      </div>
    </div>
  );
};

// Register this component with the registry
import { widgetRegistry } from '../registry';
import { WidgetType } from '../types';

widgetRegistry.register(WidgetType.REDIRECT, RedirectWidget); 