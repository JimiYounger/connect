'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  MapPin,
  Eye
} from 'lucide-react';
import type { ForecastSummary, AreaSummary } from '../../types';

interface AreaBreakdownGridProps {
  data: ForecastSummary;
  onAreaClick?: (area: AreaSummary) => void;
}

interface AreaCardProps {
  area: AreaSummary;
  onAreaClick?: (area: AreaSummary) => void;
}

function AreaCard({ area, onAreaClick }: AreaCardProps) {
  const getStatusColor = (hasSubmitted: boolean) => {
    return hasSubmitted
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getStatusIcon = (hasSubmitted: boolean) => {
    return hasSubmitted
      ? <CheckCircle className="h-4 w-4" />
      : <Clock className="h-4 w-4" />;
  };

  const getStatusText = (hasSubmitted: boolean) => {
    return hasSubmitted ? 'Submitted' : 'Pending';
  };

  const getTrendIcon = (change?: number) => {
    if (!change || change === 0) return null;
    return change > 0
      ? <TrendingUp className="h-4 w-4 text-green-600" />
      : <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendText = (change?: number) => {
    if (!change || change === 0) return 'No change';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getTrendColor = (change?: number) => {
    if (!change || change === 0) return 'text-gray-600';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border hover:border-blue-200"
          onClick={() => onAreaClick?.(area)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{area.area}</h3>
              <p className="text-sm text-gray-600">{area.region}</p>
              {area.submitted_at && (
                <p className="text-xs text-gray-500">
                  Submitted {new Date(area.submitted_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(area.has_submitted)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(area.has_submitted)}
                <span className="text-xs">{getStatusText(area.has_submitted)}</span>
              </div>
            </Badge>
          </div>
        </div>

        {/* Forecast Numbers */}
        {area.has_submitted && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Sales</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(area.sales_forecast)}
                </p>
                {area.week_over_week_sales_change !== undefined && (
                  <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(area.week_over_week_sales_change)}`}>
                    {getTrendIcon(area.week_over_week_sales_change)}
                    <span>{getTrendText(area.week_over_week_sales_change)}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-600">Leads</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(area.lead_forecast)}
                </p>
                {area.week_over_week_leads_change !== undefined && (
                  <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(area.week_over_week_leads_change)}`}>
                    {getTrendIcon(area.week_over_week_leads_change)}
                    <span>{getTrendText(area.week_over_week_leads_change)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onAreaClick?.(area);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </>
        )}

        {/* Pending State */}
        {!area.has_submitted && (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 mx-auto text-orange-400 mb-2" />
            <p className="text-sm text-gray-600">Awaiting forecast submission</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function AreaBreakdownGrid({ data, onAreaClick }: AreaBreakdownGridProps) {
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'area' | 'sales' | 'status'>('area');

  const filteredAreas = data.by_area.filter(area => {
    if (filter === 'submitted') return area.has_submitted;
    if (filter === 'pending') return !area.has_submitted;
    return true;
  });

  const sortedAreas = [...filteredAreas].sort((a, b) => {
    switch (sortBy) {
      case 'sales':
        return b.sales_forecast - a.sales_forecast;
      case 'status':
        return Number(b.has_submitted) - Number(a.has_submitted);
      case 'area':
      default:
        return a.area.localeCompare(b.area);
    }
  });

  const submittedCount = data.by_area.filter(area => area.has_submitted).length;
  const pendingCount = data.by_area.length - submittedCount;

  if (data.by_area.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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

        <div className="flex items-center gap-4">
          {/* Filter Buttons */}
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

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'area' | 'sales' | 'status')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="area">Sort by Area</option>
            <option value="sales">Sort by Sales</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedAreas.map((area) => (
          <AreaCard
            key={`${area.area}-${area.region}`}
            area={area}
            onAreaClick={onAreaClick}
          />
        ))}
      </div>

      {/* No results message */}
      {sortedAreas.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No areas match your filter
          </h3>
          <p className="text-gray-600">
            Try adjusting your filter or sort criteria.
          </p>
        </Card>
      )}
    </div>
  );
}