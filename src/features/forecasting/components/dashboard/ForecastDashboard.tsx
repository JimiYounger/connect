'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileSelect } from '@/components/ui/mobile-select';
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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
        {/* Athletic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gray-100/30 to-gray-200/20" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-gray-200/40 to-transparent rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-tl from-gray-300/30 to-transparent rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: '6s', animationDelay: '2s' }} />

        <Card className="w-full max-w-md bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-3xl relative z-10">
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-black">
                Unable to Load Dashboard
              </h2>
              <p className="text-gray-600 font-medium">
                {error.message || 'Failed to load forecast data'}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-2xl"
              mobileOptimized
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Athletic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gray-100/30 to-gray-200/20" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-gray-200/40 to-transparent rounded-full blur-3xl animate-pulse"
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-tl from-gray-300/30 to-transparent rounded-full blur-3xl animate-pulse"
           style={{ animationDuration: '6s', animationDelay: '2s' }} />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                    Forecast Dashboard
                  </h1>
                  {isViewingFuture && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: '#61B2DC' }}
                    >
                      Future Week
                    </span>
                  )}
                </div>
                <p className="text-gray-600 font-medium">
                  Executive overview of weekly forecasts{isViewingFuture ? ' (upcoming week)' : ''}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Week Selector */}
                <div className="sm:min-w-[280px] relative z-[60]">
                  <MobileSelect
                    options={availableWeeks.map((week) => ({
                      value: week.value,
                      label: week.isFuture ? `${week.label} (Future)` : week.label
                    }))}
                    value={selectedWeek}
                    onChange={handleWeekChange}
                    placeholder="Select week"
                    className="w-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 border-black/20 text-black hover:bg-black hover:text-white rounded-2xl px-4 py-2"
                    mobileOptimized
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="flex items-center gap-2 border-black/20 text-black hover:bg-black hover:text-white rounded-2xl px-4 py-2"
                    mobileOptimized
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px] relative">
              {/* Athletic Loading with Dashboard Background */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  {/* Outer Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-gray-200 h-16 w-16" />

                  {/* Dynamic Progress Ring */}
                  <div className="rounded-full border-2 border-transparent h-16 w-16 animate-spin" style={{ borderTopColor: '#61B2DC' }} />

                  {/* Inner Pulse */}
                  <div className="absolute inset-3 rounded-full bg-gray-100 animate-pulse" />
                </div>

                {/* Premium Typography */}
                <div className="text-center space-y-2 mt-6">
                  <div className="text-lg font-bold tracking-wide text-black">
                    Loading forecast data
                  </div>

                  {/* Dynamic Dots */}
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-1 h-1 bg-black rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-black rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-1 h-1 bg-black rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>

                {/* Athletic Progress Bar */}
                <div className="w-48 h-1 bg-gray-200 rounded-full mt-6 overflow-hidden">
                  <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: '#61B2DC', width: '60%' }} />
                </div>
              </div>
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
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-black">
                      No Data Available
                    </h3>
                    <p className="text-gray-600 font-medium">
                      No areas found for this week. This could mean the forecast period hasn&apos;t started yet or there are no active areas.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}