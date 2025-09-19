'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronUp,
  ChevronDown,
  Minus,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Loader2
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
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Area Data
        </h3>
        <p className="text-gray-600">
          Area breakdown will appear once forecast submissions are received.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Area Forecasts
          </h2>
          <p className="text-sm text-gray-600">
            {submittedCount} submitted • {pendingCount} pending
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({data.by_area.length})
          </Button>
          <Button
            variant={filter === 'submitted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('submitted')}
          >
            Submitted ({submittedCount})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('area')}
                >
                  <div className="flex items-center gap-1">
                    Area / Region
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="text-right w-40">Last Week Performance</TableHead>
                <TableHead className="text-right w-28">Scheduled Leads</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 text-right w-28"
                  onClick={() => handleSort('leads')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Lead Forecast
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 text-right w-32"
                  onClick={() => handleSort('sales')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Sales Forecast
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="text-right w-24">Stretch Goal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAreas.map((area) => {
                const previousWeek = getPreviousWeekArea(area);
                const areaId = `${area.area}-${area.region}`;
                const isLoading = loadingAreaId === areaId;
                const isClickable = area.has_submitted;

                return (
                  <TableRow
                    key={areaId}
                    className={`transition-colors ${
                      isClickable
                        ? 'hover:bg-gray-50 cursor-pointer'
                        : 'hover:bg-gray-25'
                    } ${isLoading ? 'bg-blue-50' : ''}`}
                    onClick={() => handleRowClick(area)}
                  >
                    {/* Area/Region */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900">{area.area}</div>
                          <div className="text-sm text-gray-500">{area.region}</div>
                        </div>
                        {isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {area.has_submitted ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>

                    {/* Last Week Performance */}
                    <TableCell className="text-right">
                      <ForecastAccuracy
                        actual={area.last_week_sales}
                        forecast={area.last_week_sales_forecast}
                        accuracy={area.forecast_accuracy}
                      />
                    </TableCell>

                    {/* Scheduled Leads */}
                    <TableCell className="text-right">
                      {area.has_submitted && area.scheduled_leads !== undefined ? (
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US').format(area.scheduled_leads)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                    {/* Lead Forecast */}
                    <TableCell className="text-right">
                      {area.has_submitted ? (
                        <TrendCell
                          currentValue={area.lead_forecast}
                          previousValue={previousWeek?.lead_forecast}
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                    {/* Sales Forecast */}
                    <TableCell className="text-right">
                      {area.has_submitted ? (
                        <TrendCell
                          currentValue={area.sales_forecast}
                          previousValue={previousWeek?.sales_forecast}
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                    {/* Stretch Goal */}
                    <TableCell className="text-right">
                      {area.has_submitted ? (
                        <span className="font-medium text-purple-600">
                          {new Intl.NumberFormat('en-US').format(area.stretch_goal)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* No results message */}
      {sortedAreas.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No areas match your filter
          </h3>
          <p className="text-gray-600">
            Try adjusting your filter criteria.
          </p>
        </Card>
      )}
    </div>
  );
}