'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  MapPin,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Minus,
  Loader2,
  X,
  User
} from 'lucide-react';
import { useState } from 'react';
import type { ForecastSummary, AreaSummary } from '../../types';

interface RegionDetailModalProps {
  region: string | null;
  data: ForecastSummary | null;
  previousWeekData?: ForecastSummary;
  isOpen: boolean;
  onClose: () => void;
  onAreaClick?: (area: AreaSummary) => void;
}

// Helper components from AreaForecastTable
interface TrendCellProps {
  currentValue: number;
  previousValue?: number;
  showPercentage?: boolean;
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

interface ForecastAccuracyProps {
  actual?: number;
  forecast?: number;
  accuracy?: 'above' | 'hit' | 'below' | null;
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

export function RegionDetailModal({ region, data, previousWeekData, isOpen, onClose, onAreaClick }: RegionDetailModalProps) {
  const [loadingAreaId, setLoadingAreaId] = useState<string | null>(null);

  if (!region || !data) return null;

  // Filter areas for this region
  const regionAreas = data.by_area.filter(area => area.region === region);
  const completedAreas = regionAreas.filter(area => area.has_submitted);
  const pendingAreas = regionAreas.filter(area => !area.has_submitted);

  // Get previous week data for each area
  const getPreviousWeekArea = (currentArea: AreaSummary) => {
    return previousWeekData?.by_area.find(
      a => a.area === currentArea.area && a.region === currentArea.region
    );
  };

  const handleAreaClick = (area: AreaSummary) => {
    if (!area.has_submitted || !onAreaClick) return;

    const areaId = `${area.area}-${area.region}`;
    setLoadingAreaId(areaId);

    try {
      onAreaClick(area);
    } finally {
      setLoadingAreaId(null);
    }
  };

  // Calculate regional totals
  const regionTotals = {
    sales_forecast: regionAreas.reduce((sum, area) => sum + (area.has_submitted ? area.sales_forecast : 0), 0),
    lead_forecast: regionAreas.reduce((sum, area) => sum + (area.has_submitted ? area.lead_forecast : 0), 0),
    stretch_goal: regionAreas.reduce((sum, area) => sum + (area.has_submitted ? area.stretch_goal : 0), 0)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="h-full flex flex-col">
          <DialogHeader className="p-4 md:p-6 pt-[max(1rem,env(safe-area-inset-top))] border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl" style={{ backgroundColor: '#61B2DC20' }}>
                  <MapPin className="h-5 w-5 md:h-6 md:w-6" style={{ color: '#61B2DC' }} />
                </div>
                <div>
                  <DialogTitle className="text-lg md:text-2xl font-bold text-black tracking-tight">
                    {region} Region Details
                  </DialogTitle>
                  <p className="text-sm md:text-base text-gray-600 font-medium">
                    {completedAreas.length} of {regionAreas.length} areas completed • Week of {new Date(data.week_of + 'T12:00:00').toLocaleDateString()}
                  </p>
                </div>
              </div>
              {/* Explicit close button for PWA compatibility */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full hover:bg-gray-100 touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">

        <div className="space-y-6">
          {/* Regional Summary */}
          <div className="grid grid-cols-3 gap-2 md:gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
              <div className="text-center">
                <TrendingUp className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-2 md:mb-3" style={{ color: '#61B2DC' }} />
                <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Sales</p>
                <p className="text-lg md:text-3xl font-bold text-black">
                  {new Intl.NumberFormat('en-US').format(regionTotals.sales_forecast)}
                </p>
              </div>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
              <div className="text-center">
                <Users className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-green-600" />
                <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Leads</p>
                <p className="text-lg md:text-3xl font-bold text-black">
                  {new Intl.NumberFormat('en-US').format(regionTotals.lead_forecast)}
                </p>
              </div>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
              <div className="text-center">
                <CheckCircle className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-purple-600" />
                <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Complete</p>
                <p className="text-lg md:text-3xl font-bold text-black">
                  {((completedAreas.length / regionAreas.length) * 100).toFixed(1)}%
                </p>
              </div>
            </Card>
          </div>

          {/* Completed Areas */}
          {completedAreas.length > 0 && (
            <div>
              <h3 className="text-lg md:text-xl font-bold text-black mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                Completed Areas ({completedAreas.length})
              </h3>
              <div className="space-y-3">
                {completedAreas.map((area) => {
                  const previousWeek = getPreviousWeekArea(area);
                  const areaId = `${area.area}-${area.region}`;
                  const isLoading = loadingAreaId === areaId;
                  const isClickable = area.has_submitted && onAreaClick;

                  return (
                    <Card
                      key={areaId}
                      className={`bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl transition-all duration-300 ${
                        isClickable
                          ? 'hover:shadow-2xl hover:scale-[1.01] cursor-pointer'
                          : ''
                      } ${isLoading ? 'bg-blue-50/80' : ''}`}
                      onClick={() => handleAreaClick(area)}
                    >
                      <div className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <h4 className="text-lg font-bold text-black">{area.area}</h4>
                              {area.submitted_at && (
                                <p className="text-xs text-gray-500 font-medium">
                                  Submitted {new Date(area.submitted_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {isLoading && (
                              <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#61B2DC' }} />
                            )}
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200 rounded-xl px-2.5 py-1.5">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative">
                                {area.submitter_user_key ? (
                                  <Image
                                    src={`https://plpower.link/${area.submitter_user_key}.pic`}
                                    alt={area.submitter_name || 'Submitter'}
                                    width={20}
                                    height={20}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                ) : null}
                                <User className={`fallback-icon h-3 w-3 mx-auto mt-1 ${area.submitter_user_key ? 'hidden' : 'block'}`} style={{ color: '#61B2DC' }} />
                              </div>
                              <div className="flex flex-col items-start">
                                <span className="font-semibold text-xs leading-tight">
                                  {area.submitter_name || 'Unknown'}
                                </span>
                                <span className="text-[10px] leading-tight opacity-75">Submitted</span>
                              </div>
                            </div>
                          </Badge>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Last Week Performance */}
                          <div className="bg-gray-50/50 rounded-xl p-3">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Last Week</h5>
                            <ForecastAccuracy
                              actual={area.last_week_sales}
                              forecast={area.last_week_sales_forecast}
                              accuracy={area.forecast_accuracy}
                            />
                          </div>

                          {/* Scheduled Leads */}
                          <div className="bg-gray-50/50 rounded-xl p-3">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Scheduled</h5>
                            <div className="text-right">
                              {area.scheduled_leads !== undefined ? (
                                <span className="text-xl font-bold text-black">
                                  {new Intl.NumberFormat('en-US').format(area.scheduled_leads)}
                                </span>
                              ) : (
                                <span className="text-xl font-bold text-gray-400">—</span>
                              )}
                            </div>
                          </div>

                          {/* Lead Forecast */}
                          <div className="bg-gray-50/50 rounded-xl p-3">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Lead Forecast</h5>
                            <TrendCell
                              currentValue={area.lead_forecast}
                              previousValue={previousWeek?.lead_forecast}
                            />
                          </div>

                          {/* Sales Forecast */}
                          <div className="bg-gray-50/50 rounded-xl p-3">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Sales Forecast</h5>
                            <TrendCell
                              currentValue={area.sales_forecast}
                              previousValue={previousWeek?.sales_forecast}
                            />
                          </div>
                        </div>

                        {/* Stretch Goal Banner */}
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Stretch Goal</h5>
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
            </div>
          )}

          {/* Pending Areas */}
          {pendingAreas.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-3">
                <Clock className="h-6 w-6 text-orange-600" />
                Pending Areas ({pendingAreas.length})
              </h3>
              <div className="grid gap-4">
                {pendingAreas.map((area) => (
                  <Card key={`${area.area}-${area.region}`} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h4 className="text-lg font-bold text-black">{area.area}</h4>
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 rounded-xl px-3 py-1.5 font-semibold">
                          <Clock className="h-4 w-4 mr-2" />
                          Pending
                        </Badge>
                      </div>
                      <p className="text-gray-600 font-medium">
                        Forecast not yet submitted
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No areas message */}
          {regionAreas.length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-black">
                    No Areas Found
                  </h3>
                  <p className="text-gray-600 font-medium">
                    No areas found for the {region} region for this week.
                  </p>
                </div>
              </div>
            </Card>
          )}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}