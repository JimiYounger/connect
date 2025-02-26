import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WidgetType } from "@/features/widgets/types";
import { getWidgetTypeIcon } from "@/lib/widget-type-utils";

// Define the shape of our analytics data
export type WidgetAnalytics = {
  id: string;
  name: string;
  type: WidgetType;
  views: number;
  interactions: number;
  interactionRate: number;
  dashboardsCount: number;
  avgTimeOnWidget: number;
  lastActivity: string;
};

export const columns: ColumnDef<WidgetAnalytics>[] = [
  {
    accessorKey: "name",
    header: "Widget Name",
    cell: ({ row }) => {
      const type = row.getValue("type") as WidgetType;
      const IconComponent = getWidgetTypeIcon(type);
      
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-xs text-muted-foreground">
              {type}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as WidgetType;
      return (
        <Badge variant="outline">
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "views",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Views
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("views")}</div>;
    },
  },
  {
    accessorKey: "interactions",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Interactions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("interactions")}</div>;
    },
  },
  {
    accessorKey: "interactionRate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Int. Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("interactionRate") as number;
      return <div className="text-right">{(value * 100).toFixed(1)}%</div>;
    },
  },
  {
    accessorKey: "dashboardsCount",
    header: "Dashboards",
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("dashboardsCount")}</div>;
    },
  },
  {
    accessorKey: "avgTimeOnWidget",
    header: "Avg. Time",
    cell: ({ row }) => {
      const seconds = row.getValue("avgTimeOnWidget") as number;
      return <div className="text-right">{seconds.toFixed(1)}s</div>;
    },
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => {
      return <div>{row.getValue("lastActivity")}</div>;
    },
  },
]; 