"use client"

import { ActivityLog, ActivityType, ActivityStatus } from '@/lib/types/activity'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { RefreshCw } from "lucide-react"
import { useState, useEffect, useCallback } from 'react'
import { useToast } from "@/hooks/use-toast"

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const { toast } = useToast()

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/view-activities', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch activities')
      const data = await res.json()
      setActivities(data.activities)
      setFilteredActivities(data.activities)
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast({
        title: "Error",
        description: "Failed to fetch activities",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Apply filters
  useEffect(() => {
    let filtered = activities

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(activity => 
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.userId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter)
    }

    // Date range filter
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp)
        const startDate = new Date(dateRange.from)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(dateRange.to)
        endDate.setHours(23, 59, 59, 999)
        return activityDate >= startDate && activityDate <= endDate
      })
    }

    setFilteredActivities(filtered)
  }, [searchQuery, typeFilter, statusFilter, dateRange, activities])

  const authCount = activities.filter(a => a.type === ActivityType.USER_AUTH).length
  const userCount = activities.filter(a => a.type === ActivityType.CONTENT_ACCESS).length
  const systemCount = activities.filter(a => a.type === ActivityType.SYSTEM_EVENT).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze user and system activities
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchActivities}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Badge variant="outline">{activities.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">All recorded activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Activities</CardTitle>
            <Badge variant="secondary">{authCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authCount}</div>
            <p className="text-xs text-muted-foreground">Authentication events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Activities</CardTitle>
            <Badge variant="secondary">{userCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">Content access events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Activities</CardTitle>
            <Badge variant="outline">{systemCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemCount}</div>
            <p className="text-xs text-muted-foreground">System events</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Input
                placeholder="Search activities..."
                className="max-w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(ActivityType).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ActivityStatus).map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <DateRangePicker onChange={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <Card key={activity.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{activity.action}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    activity.status === ActivityStatus.SUCCESS ? 'default' :
                    activity.status === ActivityStatus.FAILURE ? 'destructive' :
                    activity.status === ActivityStatus.WARNING ? 'secondary' :
                    'outline'
                  }>
                    {activity.status}
                  </Badge>
                  <Badge variant="secondary">
                    {activity.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                <AccordionItem value="details">
                  <AccordionTrigger className="px-6 py-3">
                    Activity Details
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-3">
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                      <div className="space-y-4">
                        {(activity.userId || activity.userEmail) && (
                          <div className="space-y-2">
                            <h4 className="font-medium">User Information</h4>
                            <div className="text-sm text-muted-foreground">
                              {activity.userEmail && <p>Email: {activity.userEmail}</p>}
                              {activity.userId && <p>User ID: {activity.userId}</p>}
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <h4 className="font-medium">Details</h4>
                          <pre className="text-sm whitespace-pre-wrap">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                        {activity.metadata && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Metadata</h4>
                            <div className="text-sm text-muted-foreground">
                              <p>IP: {activity.metadata.ip}</p>
                              <p>Path: {activity.metadata.path}</p>
                              <p>Method: {activity.metadata.method}</p>
                              <p>User Agent: {activity.metadata.userAgent}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 