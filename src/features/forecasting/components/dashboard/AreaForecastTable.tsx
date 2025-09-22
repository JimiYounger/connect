'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronUp,
  ChevronDown,
  Minus,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Loader2,
  TrendingUp
} from 'lucide-react';
import type { ForecastSummary, AreaSummary } from '../../types';

interface AreaForecastTableProps {
  data: ForecastSummary;
  previousWeekData?: ForecastSummary;
  onAreaClick?: (area: AreaSummary) => void;
}

interface TrendCellProps {
  currentValue: number;
  previousValue?: number;
  showPercentage?: boolean;
}

interface ForecastAccuracyProps {
  actual?: number;
  forecast?: number;
  accuracy?: 'above' | 'hit' | 'below' | null;
}

function TrendCell({ currentValue, previousValue, showPercentage = false }: TrendCellProps) {
  const formattedValue = new Intl.NumberFormat('en-US').format(currentValue);

  if (previousValue === undefined || previousValue === 0) {
    return <span className="font-medium">{formattedValue}</span>;
  }

  const change = currentValue - previousValue;
  const percentChange = ((change / previousValue) * 100).toFixed(1);
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className="text-right space-y-1">
      <div className="flex items-center justify-end gap-2">
        <span className="font-medium">{formattedValue}</span>
        <div className={`flex items-center gap-1 text-xs ${
          isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isNeutral ? (
            <Minus className="h-3 w-3" />
          ) : isPositive ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {showPercentage ? `${percentChange}%` : Math.abs(change).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function ForecastAccuracy({ actual, forecast, accuracy }: ForecastAccuracyProps) {
  // If we have actual sales but no forecast data, just show the actual number
  if (actual && actual > 0 && (!forecast || !accuracy)) {
    return (
      <div className="text-right space-y-1">
        <span className="font-medium">{new Intl.NumberFormat('en-US').format(actual)}</span>
        <div className="text-xs text-gray-500">No forecast data</div>
      </div>
    );
  }

  // If we have neither actual nor forecast data
  if (!actual || !forecast || !accuracy) {
    return <span className="text-gray-400">—</span>;
  }

  const variance = ((actual - forecast) / forecast * 100).toFixed(1);
  const formattedActual = new Intl.NumberFormat('en-US').format(actual);
  const formattedForecast = new Intl.NumberFormat('en-US').format(forecast);

  const getAccuracyColor = (acc: string) => {
    switch (acc) {
      case 'above': return 'text-green-600 bg-green-50';
      case 'hit': return 'text-blue-600 bg-blue-50';
      case 'below': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAccuracyIcon = (acc: string) => {
    switch (acc) {
      case 'above': return <ChevronUp className="h-3 w-3" />;
      case 'hit': return <CheckCircle className="h-3 w-3" />;
      case 'below': return <ChevronDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div className="text-right space-y-1">
      <div className="flex items-center justify-end gap-2">
        <span className="font-medium">{formattedActual}</span>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getAccuracyColor(accuracy)}`}>
          {getAccuracyIcon(accuracy)}
          <span className="hidden sm:inline">{accuracy.charAt(0).toUpperCase() + accuracy.slice(1)}</span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        vs {formattedForecast} ({Number(variance) > 0 ? '+' : ''}{variance}%)
      </div>
    </div>
  );
}

export function AreaForecastTable({ data, previousWeekData, onAreaClick }: AreaForecastTableProps) {
  const [sortField, setSortField] = useState<'area' | 'sales' | 'leads' | 'status'>('area');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending'>('all');
  const [loadingAreaId, setLoadingAreaId] = useState<string | null>(null);

  // Get previous week data for each area
  const getPreviousWeekArea = (currentArea: AreaSummary) => {
    return previousWeekData?.by_area.find(
      a => a.area === currentArea.area && a.region === currentArea.region
    );
  };

  // Filter areas
  const filteredAreas = data.by_area.filter(area => {
    if (filter === 'submitted') return area.has_submitted;
    if (filter === 'pending') return !area.has_submitted;
    return true;
  });

  // Sort areas
  const sortedAreas = [...filteredAreas].sort((a, b) => {
    let compareValue = 0;

    switch (sortField) {
      case 'sales':
        compareValue = a.sales_forecast - b.sales_forecast;
        break;
      case 'leads':
        compareValue = a.lead_forecast - b.lead_forecast;
        break;
      case 'status':
        compareValue = Number(a.has_submitted) - Number(b.has_submitted);
        break;
      case 'area':
      default:
        compareValue = a.area.localeCompare(b.area);
        break;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = async (area: AreaSummary) => {
    if (!area.has_submitted || !onAreaClick) return;

    const areaId = `${area.area}-${area.region}`;
    setLoadingAreaId(areaId);

    try {
      await onAreaClick(area);
    } finally {
      setLoadingAreaId(null);
    }
  };

  const submittedCount = data.by_area.filter(area => area.has_submitted).length;
  const pendingCount = data.by_area.length - submittedCount;

  if (data.by_area.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-black">
              No Area Data
            </h3>
            <p className="text-gray-600 font-medium">
              Area breakdown will appear once forecast submissions are received.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-black tracking-tight">
                Area Forecasts
              </h2>
              <p className="text-gray-600 font-medium">
                {submittedCount} submitted • {pendingCount} pending
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={`rounded-2xl font-semibold transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-black text-white hover:bg-gray-800 shadow-lg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                mobileOptimized
              >
                All ({data.by_area.length})
              </Button>
              <Button
                variant={filter === 'submitted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('submitted')}
                className={`rounded-2xl font-semibold transition-all duration-200 ${
                  filter === 'submitted'
                    ? 'bg-black text-white hover:bg-gray-800 shadow-lg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                mobileOptimized
              >
                Submitted ({submittedCount})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className={`rounded-2xl font-semibold transition-all duration-200 ${
                  filter === 'pending'
                    ? 'bg-black text-white hover:bg-gray-800 shadow-lg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                mobileOptimized
              >
                Pending ({pendingCount})
              </Button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-600">Sort by:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('area')}
                className={`rounded-xl text-xs font-medium transition-all duration-200 ${
                  sortField === 'area'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                mobileOptimized
              >
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Area {sortField === 'area' && (sortDirection === 'desc' ? '↓' : '↑')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('status')}
                className={`rounded-xl text-xs font-medium transition-all duration-200 ${
                  sortField === 'status'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                mobileOptimized
              >
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Status {sortField === 'status' && (sortDirection === 'desc' ? '↓' : '↑')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('leads')}
                className={`rounded-xl text-xs font-medium transition-all duration-200 ${
                  sortField === 'leads'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                mobileOptimized
              >
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Leads {sortField === 'leads' && (sortDirection === 'desc' ? '↓' : '↑')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('sales')}
                className={`rounded-xl text-xs font-medium transition-all duration-200 ${
                  sortField === 'sales'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                mobileOptimized
              >
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Sales {sortField === 'sales' && (sortDirection === 'desc' ? '↓' : '↑')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile-First Area Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
        {sortedAreas.map((area) => {
          const previousWeek = getPreviousWeekArea(area);
          const areaId = `${area.area}-${area.region}`;
          const isLoading = loadingAreaId === areaId;

          // Pending areas get a compact layout
          if (!area.has_submitted) {
            return (
              <Card
                key={areaId}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl opacity-75"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-black">{area.area}</h3>
                        <p className="text-sm text-gray-600 font-medium">{area.region}</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 rounded-xl px-3 py-1.5 font-semibold">
                      <Clock className="h-4 w-4 mr-2" />
                      Pending
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          }

          // Submitted areas get the full layout but more compact
          return (
            <Card
              key={areaId}
              className={`bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-pointer ${
                isLoading ? 'bg-blue-50/80' : ''
              }`}
              onClick={() => handleRowClick(area)}
            >
              <div className="p-4 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-black tracking-tight">{area.area}</h3>
                      <p className="text-sm text-gray-600 font-medium">{area.region}</p>
                    </div>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#61B2DC' }} />
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 rounded-xl px-3 py-1.5 font-semibold">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submitted
                  </Badge>
                </div>

                {/* Compact Metrics Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Last Week Performance */}
                  <div className="bg-gray-50/50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Last Week</h4>
                    <ForecastAccuracy
                      actual={area.last_week_sales}
                      forecast={area.last_week_sales_forecast}
                      accuracy={area.forecast_accuracy}
                    />
                  </div>

                  {/* Scheduled Leads */}
                  <div className="bg-gray-50/50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Scheduled</h4>
                    <div className="text-right">
                      <span className="text-xl font-bold text-black">
                        {area.scheduled_leads !== undefined
                          ? new Intl.NumberFormat('en-US').format(area.scheduled_leads)
                          : '—'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Forecast Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Lead Forecast */}
                  <div className="bg-gray-50/50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Lead Forecast</h4>
                    <TrendCell
                      currentValue={area.lead_forecast}
                      previousValue={previousWeek?.lead_forecast}
                    />
                  </div>

                  {/* Sales Forecast */}
                  <div className="bg-gray-50/50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Sales Forecast</h4>
                    <TrendCell
                      currentValue={area.sales_forecast}
                      previousValue={previousWeek?.sales_forecast}
                    />
                  </div>
                </div>

                {/* Stretch Goal Banner */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Stretch Goal</h4>
                    <span className="text-xl font-bold text-purple-700">
                      {new Intl.NumberFormat('en-US').format(area.stretch_goal)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* No results message */}
      {sortedAreas.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-black">
                No areas match your filter
              </h3>
              <p className="text-gray-600 font-medium">
                Try adjusting your filter criteria to see more results.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}