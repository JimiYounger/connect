'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import type { ForecastSummary } from '../../types';

interface AreaCompletionSummaryProps {
  data: ForecastSummary;
  previousWeekData?: ForecastSummary;
  onRegionClick?: (region: string) => void;
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, icon, suffix = '', description, trend }: MetricCardProps) {
  const formattedValue = new Intl.NumberFormat('en-US').format(value);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">
              {formattedValue}{suffix}
            </h3>
            {trend && (
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="ml-4 p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function AreaCompletionSummary({ data, previousWeekData, onRegionClick }: AreaCompletionSummaryProps) {
  // Calculate week-over-week changes
  const salesTrend = previousWeekData ? {
    value: Math.round(((data.sales_forecast - previousWeekData.sales_forecast) / previousWeekData.sales_forecast) * 100),
    isPositive: data.sales_forecast >= previousWeekData.sales_forecast
  } : undefined;

  const leadsTrend = previousWeekData ? {
    value: Math.round(((data.lead_forecast - previousWeekData.lead_forecast) / previousWeekData.lead_forecast) * 100),
    isPositive: data.lead_forecast >= previousWeekData.lead_forecast
  } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Weekly Forecast Overview
          </h2>
          <p className="text-sm text-gray-600">
            Week of {new Date(data.week_of + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Area Completion</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.completion_stats.completed_areas} of {data.completion_stats.total_areas}
          </p>
        </div>
      </div>

      {/* Forecast Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Forecast */}
        <MetricCard
          title="Sales Forecast"
          value={data.sales_forecast}
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          description="Total projected sales"
          trend={salesTrend}
        />

        {/* Lead Forecast */}
        <MetricCard
          title="Lead Forecast"
          value={data.lead_forecast}
          icon={<Users className="h-6 w-6 text-green-600" />}
          description="Expected new leads"
          trend={leadsTrend}
        />

        {/* Stretch Goal */}
        <MetricCard
          title="Stretch Goal"
          value={data.stretch_goal}
          icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
          description="Total stretch target"
        />
      </div>

      {/* Regional Completion Summary */}
      {data.completion_stats.by_region.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Completion by Region</h3>
          <div className="space-y-3">
            {data.completion_stats.by_region.map((region) => (
              <div
                key={region.region}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  onRegionClick ? 'hover:bg-gray-50 cursor-pointer' : ''
                }`}
                onClick={() => onRegionClick?.(region.region)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {region.region}
                    </span>
                    <span className="text-sm text-gray-600">
                      {region.completed_areas}/{region.total_areas}
                    </span>
                  </div>
                  <Progress
                    value={region.completion_rate}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}