// src/features/carousel/components/BannerList.tsx

'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Edit2, Trash2, GripVertical, Users, MapPin, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Tables } from '@/types/supabase'

type Banner = Tables<'carousel_banners_detailed'>

// Helper component for displaying role assignments
function RoleAssignmentBadges({ banner }: { banner: Banner }) {
  // Parse the role_details JSON if it exists
  const roleDetails = banner.role_details ? 
    (typeof banner.role_details === 'string' ? 
      JSON.parse(banner.role_details) : 
      banner.role_details) : 
    null;

  if (!roleDetails) {
    return <span className="text-muted-foreground text-sm">All users</span>;
  }

  // Extract unique values
  const roleTypes = new Set<string>();
  const teams = new Set<string>();
  const areas = new Set<string>();
  const regions = new Set<string>();

  // Process role details
  Object.values(roleDetails).forEach((detail: any) => {
    if (detail.role_type && detail.role_type !== 'Any') {
      roleTypes.add(detail.role_type);
    }
    if (detail.team) teams.add(detail.team);
    if (detail.area) areas.add(detail.area);
    if (detail.region) regions.add(detail.region);
  });

  // If no specific assignments, show "All users"
  if (roleTypes.size === 0 && teams.size === 0 && areas.size === 0 && regions.size === 0) {
    return <span className="text-muted-foreground text-sm">All users</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {roleTypes.size > 0 && (
        <div className="flex flex-wrap gap-1">
          {Array.from(roleTypes).map(role => (
            <Badge key={`role-${role}`} variant="outline" className="bg-primary/10 text-xs">
              {role}
            </Badge>
          ))}
        </div>
      )}
      
      {teams.size > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{teams.size} team{teams.size > 1 ? 's' : ''}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-xs">Teams:</span>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {Array.from(teams).map(team => (
                    <Badge key={`team-${team}`} variant="outline" className="bg-blue-50 text-xs">
                      {team}
                    </Badge>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {areas.size > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{areas.size} area{areas.size > 1 ? 's' : ''}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-xs">Areas:</span>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {Array.from(areas).map(area => (
                    <Badge key={`area-${area}`} variant="outline" className="bg-green-50 text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {regions.size > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>{regions.size} region{regions.size > 1 ? 's' : ''}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-xs">Regions:</span>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {Array.from(regions).map(region => (
                    <Badge key={`region-${region}`} variant="outline" className="bg-purple-50 text-xs">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface SortableRowProps {
  id: string
  banner: Banner
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  router: ReturnType<typeof useRouter>
}

function SortableRow({ id, banner, onToggleActive, onDelete, router }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm"
          className="cursor-move"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{banner.title}</p>
          {banner.description && (
            <p className="text-sm text-muted-foreground">{banner.description}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        {banner.click_behavior === 'video' ? 'Video' : 'URL'}
      </TableCell>
      <TableCell>
        <RoleAssignmentBadges banner={banner} />
      </TableCell>
      <TableCell>
        <Switch
          checked={banner.is_active ?? false}
          onCheckedChange={() => onToggleActive(banner.id || '')}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => banner.id && router.push(`/admin/carousel/${banner.id}`)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => banner.id && onDelete(banner.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface BannerListProps {
  banners: Banner[]
  isLoading: boolean
  error: Error | null
  onUpdateOrder: (updatedBanners: Banner[]) => Promise<void>
  onToggleActive: (bannerId: string) => Promise<void>
  onDelete: (bannerId: string) => Promise<void>
}

export function BannerList({ 
  banners, 
  isLoading, 
  error,
  onUpdateOrder,
  onToggleActive,
  onDelete 
}: BannerListProps) {
  const router = useRouter()
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return

    const oldIndex = banners.findIndex(banner => banner.id === active.id)
    const newIndex = banners.findIndex(banner => banner.id === over.id)

    const newBanners = [...banners]
    const [removed] = newBanners.splice(oldIndex, 1)
    newBanners.splice(newIndex, 0, removed)

    // Update the order_index for all affected banners
    const updatedBanners = newBanners.map((banner, index) => ({
      ...banner,
      order_index: index,
    }))

    try {
      await onUpdateOrder(updatedBanners)
      toast({
        title: "Success",
        description: "Banner order updated successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update banner order",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      await onToggleActive(id)
      toast({
        title: "Success",
        description: "Banner status updated successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update banner status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id)
      toast({
        title: "Success",
        description: "Banner deleted successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete banner",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading banners...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    )
  }

  return (
    <Card>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sort</TableHead>
              <TableHead>Banner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Visible To</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={banners.map(banner => banner.id!)}
              strategy={verticalListSortingStrategy}
            >
              {banners.map((banner) => (
                <SortableRow
                  key={banner.id}
                  id={banner.id || ''}
                  banner={banner}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  router={router}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
    </Card>
  )
}