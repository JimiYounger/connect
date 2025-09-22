'use client';

import Image from 'next/image';
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
import type { AreaDetailView, PeopleTextAnswer, PersonWithAvatar } from '../../types';

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
    <Card className={`bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: '#61B2DC20' }}>
          <div style={{ color: '#61B2DC' }}>
            {icon}
          </div>
        </div>
        <h3 className="text-lg font-bold text-black tracking-tight">{title}</h3>
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
  data: PersonWithAvatar[] | PeopleTextAnswer;
  icon: React.ReactNode;
  badgeClassName?: string;
}) {
  // Handle PersonWithAvatar array (people only with avatars)
  if (Array.isArray(data)) {
    return (
      <div className="flex flex-wrap gap-1">
        {data.map((person, index) => (
          <Badge key={index} className={`${badgeClassName} text-xs flex items-center gap-1`}>
            <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative">
              {person.user_key ? (
                <Image
                  src={`https://plpower.link/${person.user_key}.pic`}
                  alt={person.name}
                  width={16}
                  height={16}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
              ) : null}
              <div className={`fallback-icon w-full h-full flex items-center justify-center ${person.user_key ? 'hidden' : 'block'}`} style={{ color: '#61B2DC' }}>
                {icon}
              </div>
            </div>
            {person.name}
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
            <Badge key={index} className={`${badgeClassName} text-xs flex items-center gap-1`}>
              <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative">
                {person.user_key ? (
                  <Image
                    src={`https://plpower.link/${person.user_key}.pic`}
                    alt={person.name}
                    width={16}
                    height={16}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className={`fallback-icon w-full h-full flex items-center justify-center ${person.user_key ? 'hidden' : 'block'}`} style={{ color: '#61B2DC' }}>
                  {icon}
                </div>
              </div>
              {person.name}
            </Badge>
          ))}
        </div>
      )}
      {data.text && (
        <div className="bg-blue-50/80 border-l-4 border-blue-400 p-4 rounded-2xl">
          <p className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wide">Management Plan</p>
          <p className="text-sm text-blue-800 leading-relaxed font-medium">{data.text}</p>
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
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="h-full flex flex-col">
          <DialogHeader className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-xl" style={{ backgroundColor: '#61B2DC20' }}>
                <MapPin className="h-5 w-5 md:h-6 md:w-6" style={{ color: '#61B2DC' }} />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-2xl font-bold text-black tracking-tight">
                  {area.area} Forecast Details
                </DialogTitle>
                <p className="text-sm md:text-base text-gray-600 font-medium">{area.region} Region</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-3 gap-2 md:gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
              <div className="text-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-2" style={{ color: '#61B2DC' }} />
                <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Week Of</p>
                <p className="text-sm md:text-lg font-bold text-black">
                  {new Date(area.week_of + 'T12:00:00').toLocaleDateString()}
                </p>
              </div>
            </Card>
            {area.submitted_at && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
                <div className="text-center">
                  <User className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-2" style={{ color: '#61B2DC' }} />
                  <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Submitted</p>
                  <p className="text-sm md:text-lg font-bold text-black">
                    {new Date(area.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            )}
            {area.manager_info && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
                <div className="text-center">
                  <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Submitted By</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative">
                      {area.manager_info.user_key ? (
                        <Image
                          src={`https://plpower.link/${area.manager_info.user_key}.pic`}
                          alt={area.manager_info.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <User className={`fallback-icon h-3 w-3 md:h-4 md:w-4 mx-auto mt-1.5 md:mt-2 ${area.manager_info.user_key ? 'hidden' : 'block'}`} style={{ color: '#61B2DC' }} />
                    </div>
                    <p className="text-sm md:text-lg font-bold text-black">{area.manager_info.name}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Forecast Numbers */}
          <div>
            <h3 className="text-lg md:text-xl font-bold text-black mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-xl" style={{ backgroundColor: '#61B2DC20' }}>
                <Target className="h-4 w-4 md:h-5 md:w-5" style={{ color: '#61B2DC' }} />
              </div>
              Forecast Numbers
            </h3>
            <div className="grid grid-cols-3 gap-2 md:gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 md:h-10 md:w-10 mx-auto mb-2 md:mb-3" style={{ color: '#61B2DC' }} />
                  <p className="text-lg md:text-3xl font-bold text-black">
                    {new Intl.NumberFormat('en-US').format(area.forecast_numbers?.sales_forecast || 0)}
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mt-1 md:mt-2">Sales</p>
                </div>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
                <div className="text-center">
                  <Users className="h-6 w-6 md:h-10 md:w-10 mx-auto mb-2 md:mb-3 text-green-600" />
                  <p className="text-lg md:text-3xl font-bold text-black">
                    {new Intl.NumberFormat('en-US').format(area.forecast_numbers?.lead_forecast || 0)}
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mt-1 md:mt-2">Leads</p>
                </div>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-3 md:p-6">
                <div className="text-center">
                  <Target className="h-6 w-6 md:h-10 md:w-10 mx-auto mb-2 md:mb-3 text-purple-600" />
                  <p className="text-lg md:text-3xl font-bold text-black">
                    {new Intl.NumberFormat('en-US').format(area.forecast_numbers?.stretch_goal || 0)}
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mt-1 md:mt-2">Stretch</p>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Status */}
            <SectionCard
              title="Team Status"
              icon={<Users className="h-5 w-5" />}
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
              icon={<Brain className="h-5 w-5" />}
            >
              <div className="space-y-4">
                {area.leadership_intuition?.team_state_of_mind && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Team State of Mind</p>
                    <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl font-medium">
                      {area.leadership_intuition.team_state_of_mind}
                    </p>
                  </div>
                )}

                {area.leadership_intuition?.weather_impact && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Weather Impact</p>
                    <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl font-medium">
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
              icon={<TrendingUp className="h-5 w-5" />}
            >
              <div className="space-y-4">
                {area.past_performance?.last_week_sales && (
                  <MetricRow
                    label="Last Week Sales"
                    value={area.past_performance.last_week_sales}
                  />
                )}
                {area.past_performance?.performance_factors && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Performance Factors</p>
                    <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl font-medium leading-relaxed">
                      {area.past_performance.performance_factors}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Opportunities */}
            <SectionCard
              title="Actual Opportunities"
              icon={<ClipboardList className="h-5 w-5" />}
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
            icon={<Gift className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {area.incentives?.current_incentives && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Current Incentives</p>
                  <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl font-medium leading-relaxed">
                    {area.incentives.current_incentives}
                  </p>
                </div>
              )}

              {area.incentives?.planned_incentives && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Planned Incentives</p>
                  <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl font-medium leading-relaxed">
                    {area.incentives.planned_incentives}
                  </p>
                </div>
              )}

            </div>
          </SectionCard>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}