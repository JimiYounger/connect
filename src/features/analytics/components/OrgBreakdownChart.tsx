// src/features/analytics/components/OrgBreakdownChart.tsx

import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'

interface OrgBreakdownData {
  orgLevel: 'region' | 'area' | 'team'
  orgValue: string
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  lastWatched: string | null
}

interface OrgBreakdownChartProps {
  data: OrgBreakdownData[]
  isLoading?: boolean
  onOrgClick?: (orgLevel: string, orgValue: string) => void
}

type ChartType = 'bar' | 'pie'
type ViewType = 'region' | 'area' | 'team' | 'all'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const LoadingChart = () => (
  <div className="h-96 flex items-center justify-center">
    <div className="animate-pulse space-y-4 w-full px-4">
      <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
      <div className="h-80 bg-slate-100 rounded"></div>
    </div>
  </div>
)

const EmptyChart = () => (
  <div className="h-96 flex flex-col items-center justify-center text-center">
    <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
    <p className="text-gray-500">No organizational data available</p>
    <p className="text-sm text-gray-400 mt-1">Data will appear once users from different teams watch this video</p>
  </div>
)

export function OrgBreakdownChart({ data, isLoading, onOrgClick }: OrgBreakdownChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [viewType, setViewType] = useState<ViewType>('all')

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Organizational Breakdown</h3>
          <p className="text-sm text-gray-600">Video engagement by organizational structure</p>
        </div>
        <LoadingChart />
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Organizational Breakdown</h3>
          <p className="text-sm text-gray-600">Video engagement by organizational structure</p>
        </div>
        <EmptyChart />
      </Card>
    )
  }

  // Filter data based on view type
  const filteredData = viewType === 'all' ? data : data.filter(item => item.orgLevel === viewType)
  
  // Prepare chart data
  const chartData = filteredData.map(item => ({
    ...item,
    name: item.orgValue,
    completionRate: Math.round(item.avgCompletionRate * 100) / 100,
    efficiency: item.uniqueViewers > 0 ? Math.round((item.avgCompletionRate / 100) * item.uniqueViewers) : 0
  }))

  // Calculate summary stats - use only one organizational level to avoid double counting
  // When showing "all levels", use team-level data as it's most granular and avoids double counting
  // Exclude empty team names to match the overview statistics
  const summaryData = viewType === 'all' 
    ? filteredData.filter(item => item.orgLevel === 'team' && item.orgValue !== '')
    : filteredData
  
  const totalViews = summaryData.reduce((sum, item) => sum + item.totalViews, 0)
  const totalUniqueViewers = summaryData.reduce((sum, item) => sum + item.uniqueViewers, 0)
  const avgCompletion = summaryData.length > 0 ? 
    summaryData.reduce((sum, item) => sum + item.avgCompletionRate, 0) / summaryData.length : 0

  // Group data by org level for stats
  const regionCount = data.filter(item => item.orgLevel === 'region').length
  const areaCount = data.filter(item => item.orgLevel === 'area').length
  const teamCount = data.filter(item => item.orgLevel === 'team').length

  const handleBarClick = (data: any) => {
    if (onOrgClick && data) {
      const orgItem = filteredData.find(item => item.orgValue === data.name)
      if (orgItem) {
        onOrgClick(orgItem.orgLevel, orgItem.orgValue)
      }
    }
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#64748b', fontSize: 12 }}
          stroke="#94a3b8"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          stroke="#94a3b8"
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value: any, name: string) => {
            const labels: Record<string, string> = {
              totalViews: 'Total Views',
              uniqueViewers: 'Unique Viewers',
              completionRate: 'Completion Rate %'
            }
            return [value, labels[name] || name]
          }}
        />
        <Legend />
        <Bar 
          dataKey="totalViews" 
          fill="#3b82f6" 
          name="Total Views"
          onClick={handleBarClick}
          style={{ cursor: onOrgClick ? 'pointer' : 'default' }}
        />
        <Bar 
          dataKey="uniqueViewers" 
          fill="#10b981" 
          name="Unique Viewers"
          onClick={handleBarClick}
          style={{ cursor: onOrgClick ? 'pointer' : 'default' }}
        />
        <Bar 
          dataKey="completionRate" 
          fill="#f59e0b" 
          name="Completion Rate %"
          onClick={handleBarClick}
          style={{ cursor: onOrgClick ? 'pointer' : 'default' }}
        />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="totalViews"
          nameKey="name"
          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, i) => (
            <Cell 
              key={`cell-${i}`} 
              fill={COLORS[i % COLORS.length]}
              style={{ cursor: onOrgClick ? 'pointer' : 'default' }}
              onClick={() => handleBarClick(entry)}
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: any) => [value, 'Views']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Organizational Breakdown</h3>
            <p className="text-sm text-gray-600">Video engagement by organizational structure</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Bar
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
            >
              <PieChartIcon className="w-4 h-4 mr-1" />
              Pie
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={viewType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('all')}
          >
            All Levels
          </Button>
          {regionCount > 0 && (
            <Button
              variant={viewType === 'region' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('region')}
            >
              Regions ({regionCount})
            </Button>
          )}
          {areaCount > 0 && (
            <Button
              variant={viewType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('area')}
            >
              Areas ({areaCount})
            </Button>
          )}
          {teamCount > 0 && (
            <Button
              variant={viewType === 'team' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('team')}
            >
              Teams ({teamCount})
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
            <div className="text-sm text-blue-700">
              {viewType === 'all' ? 'Team-Level Views' : 'Total Views'}
            </div>
            {viewType === 'all' && (
              <div className="text-xs text-blue-600 mt-1">
                (Team level to avoid double counting)
              </div>
            )}
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalUniqueViewers.toLocaleString()}</div>
            <div className="text-sm text-green-700">
              {viewType === 'all' ? 'Team-Level Viewers' : 'Unique Viewers'}
            </div>
            {viewType === 'all' && (
              <div className="text-xs text-green-600 mt-1">
                (Team level to avoid double counting)
              </div>
            )}
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">{Math.round(avgCompletion)}%</div>
            <div className="text-sm text-amber-700">Avg Completion</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        {chartType === 'bar' ? renderBarChart() : renderPieChart()}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2">Organization</th>
              <th className="text-left py-3 px-2">Level</th>
              <th className="text-right py-3 px-2">Views</th>
              <th className="text-right py-3 px-2">Unique Viewers</th>
              <th className="text-right py-3 px-2">Completion %</th>
              <th className="text-left py-3 px-2">Last Watched</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, _index) => (
              <tr 
                key={`${item.orgLevel}-${item.orgValue}`}
                className={`border-b border-gray-100 hover:bg-gray-50 ${onOrgClick ? 'cursor-pointer' : ''}`}
                onClick={() => onOrgClick?.(item.orgLevel, item.orgValue)}
              >
                <td className="py-3 px-2 font-medium">{item.orgValue}</td>
                <td className="py-3 px-2">
                  <Badge variant="outline" className="text-xs">
                    {item.orgLevel}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-right">{item.totalViews.toLocaleString()}</td>
                <td className="py-3 px-2 text-right">{item.uniqueViewers.toLocaleString()}</td>
                <td className="py-3 px-2 text-right">{Math.round(item.avgCompletionRate)}%</td>
                <td className="py-3 px-2">
                  {item.lastWatched ? new Date(item.lastWatched).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onOrgClick && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Click on any row or chart element to drill down into user details
        </div>
      )}
    </Card>
  )
}