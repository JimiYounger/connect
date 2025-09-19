'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, Target, Users, Zap } from 'lucide-react';
import type { ForecastSummary } from '../../types';

interface MetricsSummaryProps {
  data: ForecastSummary;
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
                <TrendingUp
                  className={`h-4 w-4 ${
                    trend.isPositive ? '' : 'rotate-180'
                  }`}
                />
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

export function MetricsSummary({ data }: MetricsSummaryProps) {
  // Calculate forecast vs stretch goal percentage
  const stretchAttainment = data.stretch_goal > 0 ?
    (data.sales_forecast / data.stretch_goal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Executive Summary
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
          <p className="text-sm text-gray-600">Responses Received</p>
          <p className="text-2xl font-bold text-gray-900">{data.total_responses}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Forecast */}
        <MetricCard
          title="Sales Forecast"
          value={data.sales_forecast}
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          description="Total projected sales"
        />

        {/* Lead Forecast */}
        <MetricCard
          title="Lead Forecast"
          value={data.lead_forecast}
          icon={<Users className="h-6 w-6 text-green-600" />}
          description="Expected new leads"
        />

        {/* Stretch Goal */}
        <MetricCard
          title="Stretch Goal"
          value={data.stretch_goal}
          icon={<Target className="h-6 w-6 text-purple-600" />}
          description="Ambitious sales target"
        />

        {/* Stretch Attainment */}
        <MetricCard
          title="Goal Attainment"
          value={Math.round(stretchAttainment)}
          suffix="%"
          icon={<Zap className="h-6 w-6 text-orange-600" />}
          description="Forecast vs stretch goal"
        />
      </div>

      {/* Summary Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">Quick Insights</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <strong>{data.total_responses}</strong> managers submitted forecasts across{' '}
                <strong>{data.by_region.length}</strong> regions
              </p>
              {stretchAttainment >= 100 ? (
                <p className="text-green-700">
                  🎯 Forecast exceeds stretch goals by {Math.round(stretchAttainment - 100)}%
                </p>
              ) : stretchAttainment >= 80 ? (
                <p className="text-blue-700">
                  📈 Forecast at {Math.round(stretchAttainment)}% of stretch goals
                </p>
              ) : (
                <p className="text-orange-700">
                  ⚠️ Forecast below stretch goals - opportunity for improvement
                </p>
              )}
              {data.sales_forecast > 0 && data.lead_forecast > 0 && (
                <p>
                  Lead-to-sales ratio: {Math.round((data.sales_forecast / data.lead_forecast) * 100)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}