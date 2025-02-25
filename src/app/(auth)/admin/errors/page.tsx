  // src/app/(auth)/admin/errors/page.tsx

"use client"

import { ErrorLog } from '@/lib/types/errors'
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

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [filteredErrors, setFilteredErrors] = useState<ErrorLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const { toast } = useToast()

  const fetchErrors = useCallback(async () => {
    try {
      const res = await fetch('/api/view-errors', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch errors')
      const data = await res.json()
      console.log('Raw error data:', data.errors)
      
      // Parse the errors if they're strings
      const parsedErrors = data.errors.map((error: string | ErrorLog) => {
        if (typeof error === 'string') {
          try {
            const parsed = JSON.parse(error)
            console.log('Parsed error:', parsed)
            return parsed as ErrorLog
          } catch {
            console.error('Failed to parse error:', error)
            return null
          }
        }
        return error
      }).filter((error: ErrorLog | null): error is ErrorLog => error !== null)
      
      console.log('After parsing:', parsedErrors)
      
      // Add validation/transformation to ensure each error has required fields
      const validatedErrors = parsedErrors.map((error: ErrorLog) => ({
        id: error.id || crypto.randomUUID(),
        message: error.message || 'Unknown error',
        severity: error.severity || 'high',
        source: error.source || 'unknown',
        timestamp: error.timestamp || Date.now(),
        stack: error.stack,
        context: error.context,
      }))
      
      console.log('Final validated errors:', validatedErrors)
      setErrors(validatedErrors)
      setFilteredErrors(validatedErrors)
    } catch (err) {
      console.error('Error fetching errors:', err instanceof Error ? err.message : err)
      toast({
        title: "Error",
        description: "Failed to fetch errors",
        variant: "destructive",
      })
    }
  }, [toast])

  // Fetch errors
  useEffect(() => {
    fetchErrors()
  }, [fetchErrors])

  // Apply filters
  useEffect(() => {
    let filtered = errors

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(error => 
        error.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        error.stack?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(error => error.severity === severityFilter)
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(error => 
        error.source && error.source.toLowerCase() === sourceFilter.toLowerCase()
      )
    }

    // Date range filter
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(error => {
        const errorDate = new Date(error.timestamp)
        // Set start date to beginning of day (00:00:00)
        const startDate = new Date(dateRange.from)
        startDate.setHours(0, 0, 0, 0)
        
        // Set end date to end of day (23:59:59.999)
        const endDate = new Date(dateRange.to)
        endDate.setHours(23, 59, 59, 999)
        
        return errorDate >= startDate && errorDate <= endDate
      })
    }

    setFilteredErrors(filtered)
  }, [searchQuery, severityFilter, sourceFilter, dateRange, errors])

  const criticalCount = errors.filter(e => e.severity === 'critical').length
  const clientCount = errors.filter(e => e.source && e.source.toLowerCase() === 'client').length
  const serverCount = errors.filter(e => e.source && e.source.toLowerCase() === 'server').length

  const clearAllErrors = async () => {
    try {
      const res = await fetch('/api/clear-errors', {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to clear errors')
      
      await fetchErrors() // Refresh the list
      
      toast({
        title: "Success",
        description: "All errors have been cleared",
      })
    } catch (err) {
      console.error('Failed to clear errors:', err)
      toast({
        title: "Error",
        description: "Failed to clear errors",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze application errors
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={fetchErrors}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            onClick={clearAllErrors}
            disabled={errors.length === 0}
          >
            Clear All Errors
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <Badge variant="outline">{errors.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errors.length}</div>
            <p className="text-xs text-muted-foreground">
              All recorded errors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <Badge variant="destructive">{criticalCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              High priority issues
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Errors</CardTitle>
            <Badge variant="secondary">{clientCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
            <p className="text-xs text-muted-foreground">
              Frontend related errors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Errors</CardTitle>
            <Badge variant="outline">{serverCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverCount}</div>
            <p className="text-xs text-muted-foreground">
              Backend related errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Input
                placeholder="Search errors..."
                className="max-w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <DateRangePicker onChange={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <div className="space-y-4">
        {filteredErrors.map((error) => (
          <Card key={error.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{error.message}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(error.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={error.severity === 'high' ? 'destructive' : 'outline'}>
                    {error.severity}
                  </Badge>
                  <Badge variant="secondary">
                    {error.source}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                {error.context && (
                  <AccordionItem key={`${error.id}-context`} value={`${error.id}-context`}>
                    <AccordionTrigger className="px-6 py-3">
                      Context Details
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-3">
                      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <pre className="text-sm">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {error.stack && (
                  <AccordionItem key={`${error.id}-stack`} value={`${error.id}-stack`}>
                    <AccordionTrigger className="px-6 py-3">
                      Stack Trace
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-3">
                      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 