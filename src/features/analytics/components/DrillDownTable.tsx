// src/features/analytics/components/DrillDownTable.tsx

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  User, 
  CheckCircle, 
  Download,
  Filter,
  SortAsc,
  SortDesc 
} from 'lucide-react'

interface UserDetail {
  userId: string
  firstName: string
  lastName: string
  email: string
  region: string
  area: string
  team: string
  watchedSeconds: number
  percentComplete: number
  completed: boolean
  lastWatched: string
}

interface DrillDownTableProps {
  users: UserDetail[]
  isLoading?: boolean
  orgFilters?: {
    region?: string
    area?: string
    team?: string
  }
  onExport?: () => void
}

type SortField = 'name' | 'team' | 'watchedSeconds' | 'percentComplete' | 'lastWatched'
type SortDirection = 'asc' | 'desc'

const LoadingTable = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
)

const EmptyTable = () => (
  <div className="text-center py-12">
    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-500">No user data available</p>
    <p className="text-sm text-gray-400 mt-1">Users will appear here once they watch this video</p>
  </div>
)

export function DrillDownTable({ 
  users, 
  isLoading, 
  orgFilters, 
  onExport 
}: DrillDownTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('lastWatched')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [_showFilters, setShowFilters] = useState(false)

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">User Details</h3>
          <p className="text-sm text-gray-600">Individual user viewing data</p>
        </div>
        <LoadingTable />
      </Card>
    )
  }

  if (!users || users.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">User Details</h3>
          <p className="text-sm text-gray-600">Individual user viewing data</p>
        </div>
        <EmptyTable />
      </Card>
    )
  }

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = !searchTerm || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.team.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
          break
        case 'team':
          aValue = a.team.toLowerCase()
          bValue = b.team.toLowerCase()
          break
        case 'watchedSeconds':
          aValue = a.watchedSeconds
          bValue = b.watchedSeconds
          break
        case 'percentComplete':
          aValue = a.percentComplete
          bValue = b.percentComplete
          break
        case 'lastWatched':
          aValue = new Date(a.lastWatched).getTime()
          bValue = new Date(b.lastWatched).getTime()
          break
        default:
          return 0
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getCompletionBadge = (percentComplete: number, completed: boolean) => {
    if (completed) {
      return (
        <Badge className="bg-green-100 text-green-700 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    } else if (percentComplete >= 80) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">Nearly Done</Badge>
    } else if (percentComplete >= 50) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">In Progress</Badge>
    } else if (percentComplete > 0) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">Started</Badge>
    } else {
      return <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">Not Started</Badge>
    }
  }

  // Calculate summary stats
  const totalUsers = filteredUsers.length
  const completedUsers = filteredUsers.filter(u => u.completed).length
  const avgCompletion = totalUsers > 0 ? 
    filteredUsers.reduce((sum, u) => sum + u.percentComplete, 0) / totalUsers : 0
  const totalWatchTime = filteredUsers.reduce((sum, u) => sum + u.watchedSeconds, 0)

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">User Details</h3>
            <p className="text-sm text-gray-600">Individual user viewing data</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!_showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Applied Filters */}
        {orgFilters && (orgFilters.region || orgFilters.area || orgFilters.team) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-blue-700">Filtered by:</span>
              {orgFilters.region && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Region: {orgFilters.region}
                </Badge>
              )}
              {orgFilters.area && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Area: {orgFilters.area}
                </Badge>
              )}
              {orgFilters.team && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Team: {orgFilters.team}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search users by name, email, or team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">{totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedUsers}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{Math.round(avgCompletion)}%</div>
            <div className="text-sm text-blue-700">Avg Completion</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatDuration(totalWatchTime)}</div>
            <div className="text-sm text-purple-700">Total Watch Time</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="text-left py-3 px-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  User
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="text-left py-3 px-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('team')}
              >
                <div className="flex items-center gap-1">
                  Organization
                  {getSortIcon('team')}
                </div>
              </th>
              <th 
                className="text-right py-3 px-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('watchedSeconds')}
              >
                <div className="flex items-center justify-end gap-1">
                  Watch Time
                  {getSortIcon('watchedSeconds')}
                </div>
              </th>
              <th 
                className="text-right py-3 px-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('percentComplete')}
              >
                <div className="flex items-center justify-end gap-1">
                  Completion
                  {getSortIcon('percentComplete')}
                </div>
              </th>
              <th className="text-center py-3 px-2">Status</th>
              <th 
                className="text-left py-3 px-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('lastWatched')}
              >
                <div className="flex items-center gap-1">
                  Last Watched
                  {getSortIcon('lastWatched')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.userId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="space-y-1">
                    {user.region && <div className="text-xs text-gray-600">Region: {user.region}</div>}
                    {user.area && <div className="text-xs text-gray-600">Area: {user.area}</div>}
                    {user.team && <div className="text-xs font-medium">Team: {user.team}</div>}
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="font-medium">{formatDuration(user.watchedSeconds)}</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(user.percentComplete)}% watched
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="text-lg font-semibold">{Math.round(user.percentComplete)}%</div>
                </td>
                <td className="py-3 px-2 text-center">
                  {getCompletionBadge(user.percentComplete, user.completed)}
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm">
                    {new Date(user.lastWatched).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(user.lastWatched).toLocaleTimeString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found matching &ldquo;{searchTerm}&rdquo;</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="mt-2"
          >
            Clear Search
          </Button>
        </div>
      )}
    </Card>
  )
}