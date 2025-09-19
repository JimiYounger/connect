'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  AlertTriangle,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import type { ForecastSummary, PendingArea } from '../../types';

interface PendingSubmissionsProps {
  data: ForecastSummary;
  onSendReminder?: (area: string, region: string) => void;
}

interface PendingAreaCardProps {
  area: PendingArea;
  onSendReminder?: (area: string, region: string) => void;
}

function PendingAreaCard({ area, onSendReminder }: PendingAreaCardProps) {
  const getUrgencyColor = (daysOverdue?: number) => {
    if (!daysOverdue || daysOverdue <= 0) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (daysOverdue <= 2) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getUrgencyIcon = (daysOverdue?: number) => {
    if (!daysOverdue || daysOverdue <= 0) {
      return <Clock className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getUrgencyText = (daysOverdue?: number) => {
    if (!daysOverdue || daysOverdue <= 0) {
      return 'Due Soon';
    }
    if (daysOverdue === 1) {
      return '1 Day Overdue';
    }
    return `${daysOverdue} Days Overdue`;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{area.area}</h4>
            <p className="text-sm text-gray-600">{area.region}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getUrgencyColor(area.days_overdue)}>
            <div className="flex items-center gap-1">
              {getUrgencyIcon(area.days_overdue)}
              <span className="text-xs">{getUrgencyText(area.days_overdue)}</span>
            </div>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendReminder?.(area.area, area.region)}
            className="ml-2"
          >
            <Mail className="h-4 w-4 mr-1" />
            Remind
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RegionPendingGroup({
  region,
  areas,
  onSendReminder
}: {
  region: string;
  areas: PendingArea[];
  onSendReminder?: (area: string, region: string) => void;
}) {
  const overdueForecast = areas.filter(area => (area.days_overdue || 0) > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{region}</h4>
        <div className="flex items-center gap-2">
          {overdueForecast.length > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {overdueForecast.length} overdue
            </Badge>
          )}
          <Badge variant="secondary">
            {areas.length} pending
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {areas.map((area, index) => (
          <PendingAreaCard
            key={`${area.area}-${area.region}-${index}`}
            area={area}
            onSendReminder={onSendReminder}
          />
        ))}
      </div>
    </div>
  );
}

export function PendingSubmissions({ data, onSendReminder }: PendingSubmissionsProps) {
  const handleSendReminder = (area: string, region: string) => {
    // TODO: Implement reminder functionality
    console.log('Send reminder to:', area, region);
    onSendReminder?.(area, region);
  };

  const handleSendAllReminders = () => {
    // TODO: Implement bulk reminder functionality
    console.log('Send reminders to all pending areas');
    data.pending_areas.forEach(area => {
      onSendReminder?.(area.area, area.region);
    });
  };

  // Group pending areas by region
  const pendingByRegion = data.pending_areas.reduce((acc, area) => {
    if (!acc[area.region]) {
      acc[area.region] = [];
    }
    acc[area.region].push(area);
    return acc;
  }, {} as Record<string, PendingArea[]>);

  const overdueCount = data.pending_areas.filter(area => (area.days_overdue || 0) > 0).length;
  const dueSoonCount = data.pending_areas.length - overdueCount;

  if (data.pending_areas.length === 0) {
    return (
      <Card className="p-8 text-center bg-green-50 border-green-200">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-green-900 mb-2">
          All Areas Submitted! 🎉
        </h3>
        <p className="text-green-700">
          Every area has submitted their forecast for this week.
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
            Pending Submissions
          </h2>
          <p className="text-sm text-gray-600">
            {data.pending_areas.length} areas haven&apos;t submitted yet
            {overdueCount > 0 && (
              <span className="text-red-600 font-medium ml-1">
                • {overdueCount} overdue
              </span>
            )}
          </p>
        </div>

        {data.pending_areas.length > 0 && (
          <Button
            variant="outline"
            onClick={handleSendAllReminders}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Send All Reminders
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {data.pending_areas.length}
          </p>
          <p className="text-sm text-gray-600">Total Pending</p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {overdueCount}
          </p>
          <p className="text-sm text-gray-600">Overdue</p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {dueSoonCount}
          </p>
          <p className="text-sm text-gray-600">Due Soon</p>
        </Card>

        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {Object.keys(pendingByRegion).length}
          </p>
          <p className="text-sm text-gray-600">Regions Affected</p>
        </Card>
      </div>

      {/* Pending Areas by Region */}
      <Card className="p-6">
        <div className="space-y-6">
          {Object.entries(pendingByRegion)
            .sort(([, areasA], [, areasB]) => {
              // Sort regions by urgency (most overdue first)
              const maxOverdueA = Math.max(...areasA.map(a => a.days_overdue || 0));
              const maxOverdueB = Math.max(...areasB.map(a => a.days_overdue || 0));
              return maxOverdueB - maxOverdueA;
            })
            .map(([region, areas]) => (
              <RegionPendingGroup
                key={region}
                region={region}
                areas={areas.sort((a, b) => (b.days_overdue || 0) - (a.days_overdue || 0))}
                onSendReminder={handleSendReminder}
              />
            ))}
        </div>
      </Card>
    </div>
  );
}