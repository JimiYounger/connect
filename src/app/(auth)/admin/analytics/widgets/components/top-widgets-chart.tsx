import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopWidgetsChartProps {
  data: Array<{
    name: string;
    views: number;
    interactions: number;
  }>;
}

export function TopWidgetsChart({ data }: TopWidgetsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="views" fill="#8884d8" name="Views" />
        <Bar dataKey="interactions" fill="#82ca9d" name="Interactions" />
      </BarChart>
    </ResponsiveContainer>
  );
} 