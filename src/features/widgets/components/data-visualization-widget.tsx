// my-app/src/features/widgets/components/data-visualization-widget.tsx

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DataVisualizationWidgetProps, WidgetType } from '../types';
import { withStandardWidget } from './base-widget';
import { widgetRegistry } from '../registry';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`);
  }
  return response.json();
};

// Type for the configuration of chart colors
interface ChartColors {
  primary: string;
  secondary?: string;
  background?: string;
  axis?: string;
  text?: string;
  grid?: string;
  colors?: string[];
}

// Default color scheme
const defaultColors: ChartColors = {
  primary: '#3b82f6', // blue-500
  secondary: '#93c5fd', // blue-300
  background: 'transparent',
  axis: '#94a3b8', // slate-400
  text: '#334155', // slate-700
  grid: '#e2e8f0', // slate-200
  colors: [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
  ]
};

// Component for displaying loading state
const ChartLoading: React.FC<{ height: number }> = ({ height }) => (
  <div 
    className="flex items-center justify-center"
    style={{ height: `${height}px` }}
  >
    <div className="animate-pulse space-y-4 w-full px-4">
      <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
      <div className="h-40 bg-slate-100 rounded"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
    </div>
  </div>
);

// Component for displaying error state
const ChartError: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="p-4 border border-red-100 bg-red-50 rounded-md text-center">
    <p className="text-red-500 mb-2">Failed to load chart data</p>
    <p className="text-sm text-red-400 mb-3">{error.message}</p>
    <button 
      onClick={retry}
      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Component for displaying empty data state
const EmptyChart: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="text-gray-500">{message || 'No data available'}</p>
  </div>
);

// Type for pie chart label props
interface PieChartLabelProps {
  name: string;
  percent: number;
}

/**
 * Component for visualizing data with different chart types
 */
const DataVisualizationWidget: React.FC<DataVisualizationWidgetProps> = ({
  widget,
  configuration,
  width: _containerWidth,
  height,
  onInteraction
}) => {
  // Extract configuration values
  const {
    dataSource,
    refreshInterval = 0,
    chartType = 'bar',
  } = configuration || {};

  // State for tracking data processing
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Color settings
  const chartColors: ChartColors = useMemo(() => {
    const userColors = configuration?.settings?.colors as ChartColors | undefined;
    return { ...defaultColors, ...userColors };
  }, [configuration?.settings?.colors]);

  // Data fetching with SWR
  const { data, error, isLoading, mutate } = useSWR(
    dataSource,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: refreshInterval ? refreshInterval * 1000 : undefined,
      onSuccess: () => {
        onInteraction?.('data_loaded');
      },
      onError: () => {
        onInteraction?.('data_error');
      }
    }
  );

  // Set up refresh interval if specified
  useEffect(() => {
    if (!refreshInterval) return;
    
    const intervalId = setInterval(() => {
      mutate();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, mutate]);

  // Process data based on chart type and schema
  const processedData = useMemo(() => {
    if (!data) return null;
    setIsProcessing(true);
    
    try {
      // Simple parsing of data based on expected format
      // In a real app, you'd have more sophisticated transformation logic
      let chartData = data;
      
      // Apply any transformations based on configuration
      if (configuration?.settings?.dataTransform) {
        const transform = configuration.settings.dataTransform as string;
        if (transform === 'flatten') {
          // Example transformation: flatten nested data
          chartData = Array.isArray(data) ? data : [data];
        } else if (transform === 'aggregate') {
          // Example transformation: aggregate data points
          // This would be implemented based on specific requirements
        }
      }
      
      setIsProcessing(false);
      return Array.isArray(chartData) ? chartData : [];
    } catch (err) {
      console.error('Error processing chart data:', err);
      setIsProcessing(false);
      return [];
    }
  }, [data, configuration?.settings?.dataTransform]);

  // Determine loading state
  const showLoading = isLoading || isProcessing;
  
  // Chart dimensions accounting for title and padding
  const chartHeight = height - 60; // Adjust for title and padding
  
  // Function to render chart based on type
  const renderChart = () => {
    if (showLoading) {
      return <ChartLoading height={chartHeight} />;
    }
    
    if (error) {
      return <ChartError error={error} retry={() => mutate()} />;
    }
    
    if (!processedData || processedData.length === 0) {
      return <EmptyChart message={configuration?.settings?.emptyMessage as string} />;
    }
    
    // Get data key from configuration or use default
    const dataKey = (configuration?.settings?.dataKey as string) || 'value';
    const nameKey = (configuration?.settings?.nameKey as string) || 'name';
    
    // Render different chart types based on configuration
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={processedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey={nameKey} 
                tick={{ fill: chartColors.text }}
                stroke={chartColors.axis}
              />
              <YAxis
                tick={{ fill: chartColors.text }}
                stroke={chartColors.axis}
              />
              <Tooltip />
              <Bar dataKey={dataKey} fill={chartColors.primary} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={processedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey={nameKey} 
                tick={{ fill: chartColors.text }}
                stroke={chartColors.axis}
              />
              <YAxis
                tick={{ fill: chartColors.text }}
                stroke={chartColors.axis}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={chartColors.primary} 
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill={chartColors.primary}
                dataKey={dataKey}
                nameKey={nameKey}
                label={({ name, percent }: PieChartLabelProps) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={chartColors.colors?.[index % (chartColors.colors?.length || 1)] || chartColors.primary}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return <EmptyChart message={`Unsupported chart type: ${chartType}`} />;
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <h3 className="text-lg font-medium">
          {configuration?.title || widget.name}
        </h3>
        {configuration?.subtitle && (
          <p className="text-sm text-gray-500">{configuration.subtitle}</p>
        )}
      </div>
      
      <div className="flex-grow overflow-hidden">
        {renderChart()}
      </div>
      
      {refreshInterval > 0 && !showLoading && (
        <div className="text-xs text-right p-1 text-gray-400">
          Auto-refreshes every {refreshInterval} seconds
          <button 
            onClick={() => mutate()} 
            className="ml-2 text-blue-500 hover:text-blue-700"
            aria-label="Refresh data"
          >
            ⟳
          </button>
        </div>
      )}
    </div>
  );
};

// Apply the widget base HOC
const EnhancedDataVisualizationWidget = withStandardWidget(DataVisualizationWidget);

// Register the widget with the registry
widgetRegistry.register(WidgetType.DATA_VISUALIZATION, EnhancedDataVisualizationWidget);

export default EnhancedDataVisualizationWidget; 