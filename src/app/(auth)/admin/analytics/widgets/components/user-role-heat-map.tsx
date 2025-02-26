import React from 'react';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, Scatter, ScatterChart, ZAxis, Cell } from 'recharts';

interface UserRoleHeatMapProps {
  data: Array<{
    role: string;
    widgetType: string;
    value: number;
    z: number;
  }>;
}

export function UserRoleHeatMap({ data }: UserRoleHeatMapProps) {
  // Get unique roles and widget types for axes
  const roles = Array.from(new Set(data.map(item => item.role)));
  const widgetTypes = Array.from(new Set(data.map(item => item.widgetType)));
  
  // Map string values to numeric positions for the scatter plot
  const rolePositions = roles.reduce((acc, role, index) => {
    acc[role] = index;
    return acc;
  }, {} as Record<string, number>);
  
  const widgetTypePositions = widgetTypes.reduce((acc, type, index) => {
    acc[type] = index;
    return acc;
  }, {} as Record<string, number>);
  
  // Transform data for the scatter plot
  const transformedData = data.map(item => ({
    x: widgetTypePositions[item.widgetType],
    y: rolePositions[item.role],
    z: item.z,
    value: item.value,
    role: item.role,
    widgetType: item.widgetType
  }));
  
  // Generate color based on value (heat)
  const getColor = (value: number) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const intensity = Math.min(255, Math.round((value / maxValue) * 255));
    return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
      >
        <XAxis 
          type="number" 
          dataKey="x" 
          name="Widget Type" 
          domain={[0, widgetTypes.length - 1]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => widgetTypes[value] || ''}
          label={{ value: 'Widget Type', position: 'insideBottom', offset: -20 }}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="User Role" 
          domain={[0, roles.length - 1]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => roles[value] || ''}
          label={{ value: 'User Role', angle: -90, position: 'insideLeft' }}
        />
        <ZAxis 
          type="number" 
          dataKey="z" 
          range={[50, 500]} 
        />
        <Tooltip 
          formatter={(value, name, props) => {
            if (name === 'value') return [`${value} interactions`, 'Count'];
            return [value, name];
          }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-2 border rounded shadow-sm">
                  <p className="font-semibold">{data.role} + {data.widgetType}</p>
                  <p>Interactions: {data.value}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Scatter 
          name="User Role Engagement" 
          data={transformedData} 
          fill="#8884d8"
        >
          {transformedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
} 