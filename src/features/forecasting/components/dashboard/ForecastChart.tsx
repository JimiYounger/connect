'use client';

import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { ForecastSummary } from '../../types';

interface ForecastChartProps {
  data: ForecastSummary;
  title?: string;
}

export function ForecastChart({ data, title = "Regional Forecast Overview" }: ForecastChartProps) {
  // Prepare chart data from regional breakdown
  const chartData = data.by_region.map(region => ({
    region: region.region,
    sales: region.sales_forecast,
    leads: region.lead_forecast,
    stretch: region.stretch_goal,
    responses: region.response_count
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{`${label} Region`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${new Intl.NumberFormat('en-US').format(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <BarChart3 size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Chart Data
        </h3>
        <p className="text-gray-600">
          Chart will appear once regional forecast data is available.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          Forecast vs stretch goals by region
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="region"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="sales"
              name="Sales Forecast"
              fill="#3B82F6"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="stretch"
              name="Stretch Goal"
              fill="#10B981"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="leads"
              name="Lead Forecast"
              fill="#8B5CF6"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Summary */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Highest Sales</p>
            <p className="font-semibold text-blue-600">
              {chartData.reduce((max, region) =>
                region.sales > max.sales ? region : max, chartData[0])?.region || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Most Leads</p>
            <p className="font-semibold text-purple-600">
              {chartData.reduce((max, region) =>
                region.leads > max.leads ? region : max, chartData[0])?.region || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Highest Goals</p>
            <p className="font-semibold text-green-600">
              {chartData.reduce((max, region) =>
                region.stretch > max.stretch ? region : max, chartData[0])?.region || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}