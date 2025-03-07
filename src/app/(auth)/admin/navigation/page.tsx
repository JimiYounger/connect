'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, MoreVertical } from 'lucide-react'
import { useNavigation } from '@/features/navigation/hooks/useNavigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

// Create a MenuRow component to handle individual menu items
function MenuRow({ 
  menu, 
  onDelete,
  isDeleting 
}: { 
  menu: any, 
  onDelete: (id: string) => void,
  isDeleting: boolean 
}) {
  const { useNavigationItems } = useNavigation()
  const { data: items } = useNavigationItems(menu.id)

  return (
    <TableRow key={menu.id}>
      <TableCell className="font-medium">{menu.name}</TableCell>
      <TableCell>{menu.description || '-'}</TableCell>
      <TableCell>
        <Badge variant={menu.is_active ? 'default' : 'secondary'}>
          {menu.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>{items?.length || 0} items</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/navigation/${menu.id}`}>
                View Items
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/navigation/${menu.id}/edit`}>
                Edit Menu
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              disabled={isDeleting}
              onClick={() => onDelete(menu.id)}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export default function NavigationManagementPage() {
  const { toast } = useToast()
  const {
    menus,
    isLoadingMenus,
    menusError,
    deleteMenu
  } = useNavigation()

  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDeleteMenu = async (menuId: string) => {
    try {
      setIsDeleting(menuId)
      await deleteMenu(menuId)
      toast({
        title: 'Success',
        description: 'Navigation menu deleted successfully.',
      })
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete navigation menu.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // Loading state for menus data
  if (isLoadingMenus) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (menusError) {
    return (
      <div className="page-container">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>Failed to load navigation menus</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Navigation Management</h1>
          <p className="page-description">
            Manage navigation menus and their items
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/navigation/new">
            <Plus className="mr-2 h-4 w-4" />
            New Menu
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus?.map((menu) => (
              <MenuRow
                key={menu.id}
                menu={menu}
                onDelete={handleDeleteMenu}
                isDeleting={isDeleting === menu.id}
              />
            ))}
            {menus?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No navigation menus found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 