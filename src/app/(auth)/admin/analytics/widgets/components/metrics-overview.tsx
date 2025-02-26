import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Eye, MousePointer, BarChart2, Clock } from 'lucide-react';

interface MetricsOverviewProps {
  data: {
    totalViews: number;
    totalInteractions: number;
    interactionRate: number;
    avgTimeOnWidget: number;
    viewsChange: number;
    interactionsChange: number;
    rateChange: number;
    timeChange: number;
  };
}

export function MetricsOverview({ data }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
          <p className={`text-xs ${data.viewsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.viewsChange >= 0 ? '↑' : '↓'} {Math.abs(data.viewsChange).toFixed(1)}% from previous period
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
          <MousePointer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalInteractions.toLocaleString()}</div>
          <p className={`text-xs ${data.interactionsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.interactionsChange >= 0 ? '↑' : '↓'} {Math.abs(data.interactionsChange).toFixed(1)}% from previous period
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interaction Rate</CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(data.interactionRate * 100).toFixed(1)}%</div>
          <p className={`text-xs ${data.rateChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.rateChange >= 0 ? '↑' : '↓'} {Math.abs(data.rateChange).toFixed(1)}% from previous period
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Time on Widget</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.avgTimeOnWidget.toFixed(1)}s</div>
          <p className={`text-xs ${data.timeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.timeChange >= 0 ? '↑' : '↓'} {Math.abs(data.timeChange).toFixed(1)}% from previous period
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 