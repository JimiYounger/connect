'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Calendar,
  User,
  TrendingUp,
  Users,
  Target,
  Brain,
  AlertTriangle,
  UserCheck,
  UserX,
  Gift,
  ClipboardList
} from 'lucide-react';
import type { AreaDetailView, PeopleTextAnswer } from '../../types';

interface AreaDetailModalProps {
  area: AreaDetailView | null;
  isOpen: boolean;
  onClose: () => void;
}

function SectionCard({
  title,
  icon,
  children,
  className = ''
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function PeopleWithTextRenderer({
  data,
  icon,
  badgeClassName = "bg-gray-100 text-gray-800 border-gray-200"
}: {
  data: string[] | PeopleTextAnswer;
  icon: React.ReactNode;
  badgeClassName?: string;
}) {
  // Handle string array (people only)
  if (Array.isArray(data)) {
    return (
      <div className="flex flex-wrap gap-1">
        {data.map((person, index) => (
          <Badge key={index} className={`${badgeClassName} text-xs`}>
            {icon}
            {person}
          </Badge>
        ))}
      </div>
    );
  }

  // Handle PeopleTextAnswer (people + text)
  return (
    <div className="space-y-3">
      {data.people.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.people.map((person, index) => (
            <Badge key={index} className={`${badgeClassName} text-xs`}>
              {icon}
              {person}
            </Badge>
          ))}
        </div>
      )}
      {data.text && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm font-medium text-blue-900 mb-2">Management Plan</p>
          <p className="text-sm text-blue-800 leading-relaxed">{data.text}</p>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, trend }: { label: string; value: string | number; trend?: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">
          {typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value}
        </span>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({trend > 0 ? '+' : ''}{trend.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
}

export function AreaDetailModal({ area, isOpen, onClose }: AreaDetailModalProps) {
  if (!area) return null;

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
                {area.area} Forecast Details
              </DialogTitle>
              <p className="text-sm text-gray-600">{area.region} Region</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <Calendar className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-gray-600">Week Of</p>
                <p className="text-sm font-medium">
                  {new Date(area.week_of + 'T12:00:00').toLocaleDateString()}
                </p>
              </div>
              {area.submitted_at && (
                <div>
                  <User className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-gray-600">Submitted</p>
                  <p className="text-sm font-medium">
                    {new Date(area.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {area.manager_info && (
                <div>
                  <User className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-gray-600">Manager</p>
                  <p className="text-sm font-medium">{area.manager_info.name}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Forecast Numbers */}
          <SectionCard
            title="Forecast Numbers"
            icon={<Target className="h-5 w-5 text-blue-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(area.forecast_numbers?.sales_forecast || 0)}
                </p>
                <p className="text-sm text-gray-600">Sales Forecast</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(area.forecast_numbers?.lead_forecast || 0)}
                </p>
                <p className="text-sm text-gray-600">Lead Forecast</p>
              </div>
              <div className="text-center">
                <Target className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(area.forecast_numbers?.stretch_goal || 0)}
                </p>
                <p className="text-sm text-gray-600">Stretch Goal</p>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Status */}
            <SectionCard
              title="Team Status"
              icon={<Users className="h-5 w-5 text-blue-600" />}
            >
              <div className="space-y-4">
                {area.team_status?.unavailable_people && (
                  (Array.isArray(area.team_status.unavailable_people) && area.team_status.unavailable_people.length > 0) ||
                  (!Array.isArray(area.team_status.unavailable_people) && (area.team_status.unavailable_people.people.length > 0 || area.team_status.unavailable_people.text))
                ) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Unavailable This Week</p>
                    <PeopleWithTextRenderer
                      data={area.team_status.unavailable_people}
                      icon={<UserX className="h-3 w-3 mr-1" />}
                      badgeClassName="bg-red-100 text-red-800 border-red-200"
                    />
                  </div>
                )}

                {area.team_status?.coaching_needed && (
                  (Array.isArray(area.team_status.coaching_needed) && area.team_status.coaching_needed.length > 0) ||
                  (!Array.isArray(area.team_status.coaching_needed) && (area.team_status.coaching_needed.people.length > 0 || area.team_status.coaching_needed.text))
                ) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Coaching Needed</p>
                    <PeopleWithTextRenderer
                      data={area.team_status.coaching_needed}
                      icon={<UserCheck className="h-3 w-3 mr-1" />}
                      badgeClassName="bg-yellow-100 text-yellow-800 border-yellow-200"
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Leadership Intuition */}
            <SectionCard
              title="Leadership Intuition"
              icon={<Brain className="h-5 w-5 text-blue-600" />}
            >
              <div className="space-y-4">
                {area.leadership_intuition?.team_state_of_mind && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Team State of Mind</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {area.leadership_intuition.team_state_of_mind}
                    </p>
                  </div>
                )}

                {area.leadership_intuition?.weather_impact && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Weather Impact</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {area.leadership_intuition.weather_impact}
                    </p>
                  </div>
                )}

                {area.leadership_intuition?.personal_challenges && (
                  (Array.isArray(area.leadership_intuition.personal_challenges) && area.leadership_intuition.personal_challenges.length > 0) ||
                  (!Array.isArray(area.leadership_intuition.personal_challenges) && (area.leadership_intuition.personal_challenges.people.length > 0 || area.leadership_intuition.personal_challenges.text))
                ) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Personal Challenges</p>
                    <PeopleWithTextRenderer
                      data={area.leadership_intuition.personal_challenges}
                      icon={<AlertTriangle className="h-3 w-3 mr-1" />}
                      badgeClassName="bg-orange-100 text-orange-800 border-orange-200"
                    />
                  </div>
                )}

                {area.leadership_intuition?.struggling_reps && (
                  (Array.isArray(area.leadership_intuition.struggling_reps) && area.leadership_intuition.struggling_reps.length > 0) ||
                  (!Array.isArray(area.leadership_intuition.struggling_reps) && (area.leadership_intuition.struggling_reps.people.length > 0 || area.leadership_intuition.struggling_reps.text))
                ) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Struggling Reps</p>
                    <PeopleWithTextRenderer
                      data={area.leadership_intuition.struggling_reps}
                      icon={<UserX className="h-3 w-3 mr-1" />}
                      badgeClassName="bg-red-100 text-red-800 border-red-200"
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Past Performance */}
            <SectionCard
              title="Past Performance"
              icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            >
              <div className="space-y-3">
                {area.past_performance?.last_week_sales && (
                  <MetricRow
                    label="Last Week Sales"
                    value={area.past_performance.last_week_sales}
                  />
                )}
                {area.past_performance?.performance_factors && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Performance Factors</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {area.past_performance.performance_factors}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Opportunities */}
            <SectionCard
              title="Actual Opportunities"
              icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
            >
              <div className="space-y-3">
                {area.opportunities?.scheduled_leads && (
                  <MetricRow
                    label="Scheduled Leads"
                    value={area.opportunities.scheduled_leads}
                  />
                )}
                {area.opportunities?.upcoming_appointments && (
                  <MetricRow
                    label="Upcoming Appointments"
                    value={area.opportunities.upcoming_appointments}
                  />
                )}
              </div>
            </SectionCard>
          </div>

          {/* Incentives */}
          <SectionCard
            title="Incentives"
            icon={<Gift className="h-5 w-5 text-blue-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {area.incentives?.current_incentives && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Incentives</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {area.incentives.current_incentives}
                  </p>
                </div>
              )}

              {area.incentives?.planned_incentives && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Planned Incentives</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {area.incentives.planned_incentives}
                  </p>
                </div>
              )}

            </div>
          </SectionCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}