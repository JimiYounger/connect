'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Minus,
  Loader2
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

  const handleAreaClick = async (area: AreaSummary) => {
    if (!area.has_submitted || !onAreaClick) return;

    const areaId = `${area.area}-${area.region}`;
    setLoadingAreaId(areaId);

    try {
      await onAreaClick(area);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {region} Region Details
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {completedAreas.length} of {regionAreas.length} areas completed • Week of {new Date(data.week_of + 'T12:00:00').toLocaleDateString()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Regional Summary */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <TrendingUp className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-gray-600">Sales Forecast</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(regionTotals.sales_forecast)}
                </p>
              </div>
              <div>
                <Users className="h-4 w-4 mx-auto text-green-600 mb-1" />
                <p className="text-xs text-gray-600">Lead Forecast</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(regionTotals.lead_forecast)}
                </p>
              </div>
              <div>
                <CheckCircle className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                <p className="text-xs text-gray-600">Completion Rate</p>
                <p className="text-lg font-bold text-gray-900">
                  {((completedAreas.length / regionAreas.length) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Completed Areas */}
          {completedAreas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Areas ({completedAreas.length})
              </h3>
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Area</TableHead>
                        <TableHead className="text-right w-40">Last Week Performance</TableHead>
                        <TableHead className="text-right w-28">Scheduled Leads</TableHead>
                        <TableHead className="text-right w-28">Lead Forecast</TableHead>
                        <TableHead className="text-right w-32">Sales Forecast</TableHead>
                        <TableHead className="text-right w-24">Stretch Goal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedAreas.map((area) => {
                        const previousWeek = getPreviousWeekArea(area);
                        const areaId = `${area.area}-${area.region}`;
                        const isLoading = loadingAreaId === areaId;
                        const isClickable = area.has_submitted && onAreaClick;

                        return (
                          <TableRow
                            key={areaId}
                            className={`transition-colors ${
                              isClickable
                                ? 'hover:bg-gray-50 cursor-pointer'
                                : 'hover:bg-gray-25'
                            } ${isLoading ? 'bg-blue-50' : ''}`}
                            onClick={() => handleAreaClick(area)}
                          >
                            {/* Area */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium text-gray-900">{area.area}</div>
                                  {area.submitted_at && (
                                    <div className="text-xs text-gray-500">
                                      Submitted {new Date(area.submitted_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                {isLoading && (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                )}
                              </div>
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
                              {area.scheduled_leads !== undefined ? (
                                <span className="font-medium">
                                  {new Intl.NumberFormat('en-US').format(area.scheduled_leads)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>

                            {/* Lead Forecast */}
                            <TableCell className="text-right">
                              <TrendCell
                                currentValue={area.lead_forecast}
                                previousValue={previousWeek?.lead_forecast}
                              />
                            </TableCell>

                            {/* Sales Forecast */}
                            <TableCell className="text-right">
                              <TrendCell
                                currentValue={area.sales_forecast}
                                previousValue={previousWeek?.sales_forecast}
                              />
                            </TableCell>

                            {/* Stretch Goal */}
                            <TableCell className="text-right">
                              <span className="font-medium text-purple-600">
                                {new Intl.NumberFormat('en-US').format(area.stretch_goal)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {/* Pending Areas */}
          {pendingAreas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Pending Areas ({pendingAreas.length})
              </h3>
              <div className="grid gap-3">
                {pendingAreas.map((area) => (
                  <Card key={`${area.area}-${area.region}`} className="p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{area.area}</h4>
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
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
            <Card className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Areas Found
              </h3>
              <p className="text-gray-600">
                No areas found for the {region} region for this week.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}