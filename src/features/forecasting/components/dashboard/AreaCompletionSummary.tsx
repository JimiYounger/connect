'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div className="p-4 md:p-6 space-y-2 md:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs md:text-sm font-semibold tracking-wide text-gray-600 uppercase mb-1 md:mb-2">{title}</p>
            <div className="flex flex-col items-center md:flex-row md:items-baseline gap-1 md:gap-3">
              <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-black">
                {formattedValue}{suffix}
              </h3>
              {trend && (
                <span
                  className={`text-xs md:text-sm font-bold flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                    trend.isPositive
                      ? 'text-green-700 bg-green-100'
                      : 'text-red-700 bg-red-100'
                  }`}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
                  ) : (
                    <TrendingDown className="h-2 w-2 md:h-3 md:w-3" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs md:text-sm font-medium text-gray-500 mt-1 md:mt-2 hidden md:block">{description}</p>
            )}
          </div>
          {icon && (
            <div className="ml-2 md:ml-4 p-2 md:p-4 rounded-xl hidden md:block" style={{ backgroundColor: '#61B2DC20' }}>
              <div style={{ color: '#61B2DC' }}>
                {icon}
              </div>
            </div>
          )}
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
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
          Weekly Forecast Overview
        </h2>
        <p className="text-gray-600 font-medium">
          Week of {new Date(data.week_of + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* All Metrics in One Row */}
      <div className="grid grid-cols-4 gap-2 md:gap-6">
        {/* Area Completion */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="p-4 md:p-6 space-y-2 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs md:text-sm font-semibold tracking-wide text-gray-600 uppercase mb-1 md:mb-2">
                  <span className="md:hidden">Areas</span>
                  <span className="hidden md:inline">Area Completion</span>
                </p>
                <p className="text-xl md:text-3xl lg:text-4xl font-bold text-black">
                  {data.completion_stats.completed_areas} <span className="text-gray-400 text-sm md:text-xl">of</span> {data.completion_stats.total_areas}
                </p>
                <p className="text-xs md:text-sm font-medium text-gray-500 mt-1 md:mt-2 hidden md:block">Areas submitted</p>
              </div>
            </div>
          </div>
        </Card>
        {/* Sales Forecast */}
        <MetricCard
          title="Sales"
          value={data.sales_forecast}
          icon={null}
          description="Total projected sales"
          trend={salesTrend}
        />

        {/* Lead Forecast */}
        <MetricCard
          title="Leads"
          value={data.lead_forecast}
          icon={null}
          description="Expected new leads"
          trend={leadsTrend}
        />

        {/* Stretch Goal */}
        <MetricCard
          title="Stretch"
          value={data.stretch_goal}
          icon={null}
          description="Total stretch target"
        />
      </div>

      {/* Regional Completion Summary */}
      {data.completion_stats.by_region.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-bold text-black">Completion by Region</h3>
            <div className="space-y-4">
              {data.completion_stats.by_region.map((region) => (
                <div
                  key={region.region}
                  className={`p-4 rounded-2xl transition-all duration-200 ${
                    onRegionClick
                      ? 'hover:bg-gray-50 cursor-pointer transform hover:scale-102 active:scale-98'
                      : 'bg-gray-50/50'
                  }`}
                  onClick={() => onRegionClick?.(region.region)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-black text-lg">
                      {region.region}
                    </span>
                    <span className="font-bold text-gray-600">
                      {region.completed_areas}/{region.total_areas}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${region.completion_rate}%`,
                        backgroundColor: '#61B2DC'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}