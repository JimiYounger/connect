import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { analyticsService } from '@/features/widgets/services/analytics-service';
import { widgetService } from '@/features/widgets/services/widget-service';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface WidgetDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetId: string;
  dateRange: { from: Date; to: Date };
}

export function WidgetDetailsModal({ open, onOpenChange, widgetId, dateRange }: WidgetDetailsModalProps) {
  const [widget, setWidget] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (open && widgetId) {
      const fetchWidgetDetails = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          // Fetch widget details
          const { data: widgetData, error: widgetError } = await widgetService.getWidgetById(widgetId);
          
          if (widgetError) throw widgetError;
          
          // Fetch detailed analytics for this widget
          const { data: analyticsData, error: analyticsError } = await analyticsService.getWidgetDetailedAnalytics(
            widgetId, 
            { 
              from: dateRange.from.toISOString(), 
              to: dateRange.to.toISOString() 
            }
          );
          
          if (analyticsError) throw analyticsError;
          
          setWidget(widgetData);
          setAnalytics(analyticsData);
        } catch (err) {
          console.error('Error fetching widget details:', err);
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchWidgetDetails();
    }
  }, [open, widgetId, dateRange]);
  
  const handleExportCSV = () => {
    if (!analytics) return;
    
    analyticsService.exportWidgetAnalyticsCSV(widgetId, dateRange);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {widget ? (
              <>
                <span>{widget.name}</span>
                <Badge variant="outline">{widget.widget_type}</Badge>
              </>
            ) : (
              'Widget Details'
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed analytics for this widget
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
            <p>Error loading widget details: {error.message}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Interactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalInteractions.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Interaction Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(analytics.interactionRate * 100).toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="trends">
              <TabsList className="mb-4">
                <TabsTrigger value="trends">Usage Trends</TabsTrigger>
                <TabsTrigger value="interactions">Interaction Types</TabsTrigger>
                <TabsTrigger value="users">User Demographics</TabsTrigger>
                <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" />
                        <Line type="monotone" dataKey="interactions" stroke="#82ca9d" name="Interactions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="interactions">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Interaction Types</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.interactionTypes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.interactionTypes.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Time to First Interaction</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.timeToInteraction}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" name="Interactions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>User Roles</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.userRoles} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="role" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" fill="#8884d8" name="Views" />
                        <Bar dataKey="interactions" fill="#82ca9d" name="Interactions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="dashboards">
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This widget appears in {analytics.dashboards.length} dashboards
                      </p>
                      
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Dashboard</th>
                              <th className="text-right py-2">Views</th>
                              <th className="text-right py-2">Interactions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.dashboards.map((dashboard: any) => (
                              <tr key={dashboard.id} className="border-b">
                                <td className="py-2">{dashboard.name}</td>
                                <td className="text-right py-2">{dashboard.views.toLocaleString()}</td>
                                <td className="text-right py-2">{dashboard.interactions.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end mt-6">
              <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 