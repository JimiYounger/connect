'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MapPin, TrendingUp, Users, Target } from 'lucide-react';
import type { ForecastSummary, RegionSummary, AreaSummary } from '../../types';

interface RegionalBreakdownProps {
  data: ForecastSummary;
}

interface RegionCardProps {
  region: RegionSummary;
  areas: AreaSummary[];
  onViewDetails: (region: string) => void;
}

function RegionCard({ region, areas, onViewDetails }: RegionCardProps) {
  const goalAttainment = region.stretch_goal > 0 ?
    (region.sales_forecast / region.stretch_goal) * 100 : 0;

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPerformanceText = (percentage: number) => {
    if (percentage >= 100) return 'Exceeding';
    if (percentage >= 80) return 'On Track';
    if (percentage >= 60) return 'At Risk';
    return 'Underperforming';
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border hover:border-blue-200"
          onClick={() => onViewDetails(region.region)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{region.region}</h3>
              <p className="text-sm text-gray-600">
                {region.response_count} response{region.response_count !== 1 ? 's' : ''}
                {areas.length > 0 && ` • ${areas.length} area${areas.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPerformanceColor(goalAttainment)}>
              {getPerformanceText(goalAttainment)}
            </Badge>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Sales</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('en-US').format(region.sales_forecast)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Leads</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('en-US').format(region.lead_forecast)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Goal</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat('en-US').format(region.stretch_goal)}
            </p>
          </div>
        </div>

        {/* Goal Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Goal Attainment</span>
            <span className="font-medium text-gray-900">
              {Math.round(goalAttainment)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                goalAttainment >= 100 ? 'bg-green-500' :
                goalAttainment >= 80 ? 'bg-blue-500' :
                goalAttainment >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(goalAttainment, 100)}%` }}
            />
          </div>
        </div>

        {/* Areas Preview */}
        {areas.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Areas:</p>
            <div className="flex flex-wrap gap-1">
              {areas.slice(0, 3).map((area) => (
                <Badge key={area.area} variant="secondary" className="text-xs">
                  {area.area}
                </Badge>
              ))}
              {areas.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{areas.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function RegionalBreakdown({ data }: RegionalBreakdownProps) {
  const [_selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const handleViewDetails = (region: string) => {
    // TODO: Implement drill-down modal or navigation
    console.log('View details for region:', region);
    setSelectedRegion(region);
  };

  const sortedRegions = [...data.by_region].sort((a, b) => b.sales_forecast - a.sales_forecast);

  if (data.by_region.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Regional Data
        </h3>
        <p className="text-gray-600">
          Regional breakdown will appear once forecast submissions include region information.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Regional Performance
          </h2>
          <p className="text-sm text-gray-600">
            Forecast breakdown by region
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All Areas
        </Button>
      </div>

      {/* Regional Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRegions.map((region) => {
          // Get areas for this region
          const regionAreas = data.by_area.filter(area => area.region === region.region);

          return (
            <RegionCard
              key={region.region}
              region={region}
              areas={regionAreas}
              onViewDetails={handleViewDetails}
            />
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="p-6 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Regions</p>
            <p className="text-2xl font-bold text-gray-900">{data.by_region.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Sales/Region</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.by_region.length > 0 ?
                new Intl.NumberFormat('en-US').format(
                  Math.round(data.sales_forecast / data.by_region.length)
                ) : '0'
              }
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Top Performer</p>
            <p className="text-2xl font-bold text-green-600">
              {sortedRegions[0]?.region || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.total_responses > 0 ? '100%' : '0%'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}