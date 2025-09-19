'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, TrendingUp } from 'lucide-react';
import { AreaCompletionSummary } from './AreaCompletionSummary';
import { AreaForecastTable } from './AreaForecastTable';
import { AreaDetailModal } from './AreaDetailModal';
import { RegionDetailModal } from './RegionDetailModal';
import type { ForecastSummary, AreaSummary, AreaDetailView } from '../../types';

// Helper to get Monday - consistent with survey submission logic
function getMonday(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// Helper to get next Monday - matches survey submission logic
function getNextMonday(date = new Date()): string {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Days to add to get to next Monday
  let daysToAdd;
  if (dayOfWeek === 0) { // Sunday
    daysToAdd = 1;
  } else if (dayOfWeek === 1) { // Monday
    daysToAdd = 7; // Next Monday, not today
  } else { // Tuesday through Saturday
    daysToAdd = 8 - dayOfWeek;
  }

  d.setDate(d.getDate() + daysToAdd);
  d.setHours(0, 0, 0, 0);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

// Generate past and future weeks for selector - simple offset approach
function getAvailableWeeks(): { value: string; label: string; isFuture: boolean }[] {
  const weeks = [];
  const nextMonday = getNextMonday();

  // Generate weeks from -8 to +4 relative to current forecast week
  for (let offset = -8; offset <= 4; offset++) {
    const weekDate = new Date(nextMonday);
    weekDate.setDate(weekDate.getDate() + (offset * 7));
    const mondayStr = getMonday(weekDate);

    const label = new Date(mondayStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const isCurrent = offset === 0;
    const isFuture = offset > 0;
    const weekLabel = isCurrent ?
      `Week of ${label} (Current)` :
      `Week of ${label}`;

    weeks.push({
      value: mondayStr,
      label: weekLabel,
      isFuture
    });
  }

  return weeks;
}

export function ForecastDashboard() {
  const [selectedWeek, setSelectedWeek] = useState(getNextMonday());
  const [selectedArea, setSelectedArea] = useState<AreaDetailView | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const availableWeeks = getAvailableWeeks();

  // Fetch dashboard data
  const { data: forecastData, isLoading, error, refetch } = useQuery({
    queryKey: ['forecast-dashboard', selectedWeek],
    queryFn: async (): Promise<ForecastSummary> => {
      const response = await fetch(`/api/forecast/dashboard?week_of=${selectedWeek}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    }
  });

  // Fetch previous week data for comparison
  const { data: previousWeekData } = useQuery({
    queryKey: ['forecast-dashboard-previous', selectedWeek],
    queryFn: async (): Promise<ForecastSummary | null> => {
      const currentDate = new Date(selectedWeek + 'T12:00:00');
      const previousWeek = new Date(currentDate);
      previousWeek.setDate(previousWeek.getDate() - 7);
      const previousWeekStr = getMonday(previousWeek);

      try {
        const response = await fetch(`/api/forecast/dashboard?week_of=${previousWeekStr}`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!forecastData
  });

  const handleWeekChange = (week: string) => {
    setSelectedWeek(week);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export functionality to be implemented');
  };

  const handleAreaClick = async (area: AreaSummary) => {
    // TODO: Fetch detailed area data
    try {
      const response = await fetch(`/api/forecast/area-detail?area=${encodeURIComponent(area.area)}&region=${encodeURIComponent(area.region)}&week_of=${selectedWeek}`);
      if (response.ok) {
        const areaDetail: AreaDetailView = await response.json();
        setSelectedArea(areaDetail);
      }
    } catch (error) {
      console.error('Failed to fetch area details:', error);
    }
  };


  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
  };

  // Check if selected week is in the future
  const selectedWeekInfo = availableWeeks.find(w => w.value === selectedWeek);
  const isViewingFuture = selectedWeekInfo?.isFuture || false;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <TrendingUp className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Failed to load forecast data'}
          </p>
          <Button onClick={handleRefresh} className="w-full">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Sales Forecast Dashboard
                </h1>
                {isViewingFuture && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Future Week
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Executive overview of weekly forecasts{isViewingFuture ? ' (upcoming week)' : ''}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Week Selector */}
              <Select value={selectedWeek} onValueChange={handleWeekChange}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week.value} value={week.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{week.label}</span>
                        {week.isFuture && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Future
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-6">
            {/* Loading Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : forecastData ? (
          <div className="space-y-8">
            {/* Area Completion Summary */}
            <AreaCompletionSummary
              data={forecastData}
              previousWeekData={previousWeekData || undefined}
              onRegionClick={handleRegionClick}
            />


            {/* Area Forecast Table */}
            <AreaForecastTable
              data={forecastData}
              previousWeekData={previousWeekData || undefined}
              onAreaClick={handleAreaClick}
            />

            {/* Area Detail Modal */}
            <AreaDetailModal
              area={selectedArea}
              isOpen={!!selectedArea}
              onClose={() => setSelectedArea(null)}
            />

            {/* Region Detail Modal */}
            <RegionDetailModal
              region={selectedRegion}
              data={forecastData}
              previousWeekData={previousWeekData || undefined}
              isOpen={!!selectedRegion}
              onClose={() => setSelectedRegion(null)}
              onAreaClick={handleAreaClick}
            />

            {/* No data message */}
            {forecastData.total_responses === 0 && forecastData.pending_areas?.length === 0 && (
              <Card className="p-8 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Data Available
                </h3>
                <p className="text-gray-600">
                  No areas found for this week. This could mean the forecast period hasn&apos;t started yet or there are no active areas.
                </p>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}