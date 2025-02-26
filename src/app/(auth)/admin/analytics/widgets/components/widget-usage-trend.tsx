import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WidgetUsageTrendProps {
  data: Array<{
    date: string;
    views: number;
    interactions: number;
  }>;
  timeframe: 'day' | 'week' | 'month';
}

export function WidgetUsageTrend({ data, timeframe }: WidgetUsageTrendProps) {
  // Format the x-axis label based on timeframe
  const getXAxisTickFormatter = () => {
    switch (timeframe) {
      case 'day':
        return (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      case 'week':
        return (value: string) => `Week ${value}`;
      case 'month':
        return (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      default:
        return (value: string) => value;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={getXAxisTickFormatter()}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
          name="Views"
        />
        <Line
          type="monotone"
          dataKey="interactions"
          stroke="#82ca9d"
          name="Interactions"
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 