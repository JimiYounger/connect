// src/features/analytics/components/DailyEngagementChart.tsx

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface DailyEngagementData {
  date: string
  totalViews: number
  uniqueViewers: number
  uniqueVideosWatched: number
  avgCompletionRate: number
}

interface DailyEngagementChartProps {
  data: DailyEngagementData[]
  isLoading?: boolean
}

const LoadingChart = () => (
  <div className="h-80 flex items-center justify-center">
    <div className="animate-pulse space-y-4 w-full px-4">
      <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
      <div className="h-64 bg-slate-100 rounded"></div>
    </div>
  </div>
)

const EmptyChart = () => (
  <div className="h-80 flex flex-col items-center justify-center text-center">
    <TrendingUp className="w-12 h-12 text-gray-300 mb-3" />
    <p className="text-gray-500">No engagement data available</p>
    <p className="text-sm text-gray-400 mt-1">Data will appear once users start watching videos</p>
  </div>
)

export function DailyEngagementChart({ data, isLoading }: DailyEngagementChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Daily Engagement</h3>
          <p className="text-sm text-gray-600">Video library usage over time</p>
        </div>
        <LoadingChart />
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Daily Engagement</h3>
          <p className="text-sm text-gray-600">Video library usage over time</p>
        </div>
        <EmptyChart />
      </Card>
    )
  }

  // Transform data for display
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    avgCompletionRate: Math.round(item.avgCompletionRate * 100) / 100 // Round to 2 decimal places
  }))

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Daily Engagement</h3>
        <p className="text-sm text-gray-600">Video library usage over time</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            stroke="#94a3b8"
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
                uniqueVideosWatched: 'Videos Watched',
                avgCompletionRate: 'Avg Completion %'
              }
              return [value, labels[name] || name]
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="totalViews" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Total Views"
            activeDot={{ r: 6, fill: '#3b82f6' }}
          />
          <Line 
            type="monotone" 
            dataKey="uniqueViewers" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Unique Viewers"
            activeDot={{ r: 6, fill: '#10b981' }}
          />
          <Line 
            type="monotone" 
            dataKey="avgCompletionRate" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="Avg Completion %"
            activeDot={{ r: 6, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        {data.length > 0 && (
          <>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Views</p>
              <p className="text-lg font-semibold text-blue-700">
                {data.reduce((sum, item) => sum + item.totalViews, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Unique Viewers</p>
              <p className="text-lg font-semibold text-green-700">
                {Math.max(...data.map(item => item.uniqueViewers)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-600 font-medium">Avg Completion</p>
              <p className="text-lg font-semibold text-amber-700">
                {Math.round((data.reduce((sum, item) => sum + item.avgCompletionRate, 0) / data.length) * 100) / 100}%
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}