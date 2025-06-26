'use client'

import { useState, useEffect } from 'react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
    <TableRow key={menu.id} className="hover:bg-gray-50">
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/navigation/${menu.id}`} className="cursor-pointer">
                View Items
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/navigation/${menu.id}/edit`} className="cursor-pointer">
                Edit Menu
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
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

  // Hydration safety: ensure we're client-side before rendering dynamic content
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Hydration check - this only runs on client-side
  useEffect(() => {
    setIsHydrated(true)
  }, [])

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

  // Show loading until hydration is complete - prevents SSR/client mismatch
  if (!isHydrated || isLoadingMenus) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading navigation menus...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (menusError) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="max-w-md mx-auto bg-white rounded-[14px] shadow-md p-8 text-center border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
          <p className="mb-6 text-gray-500">Failed to load navigation menus</p>
          <Button asChild size="lg" className="bg-gray-800 text-white hover:bg-gray-700">
            <Link href="/admin">Back to Admin</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Navigation Management</h1>
          <p className="text-gray-500 mt-1">Manage navigation menus and their items</p>
        </div>
        <Button size="lg" className="shrink-0 bg-gray-800 text-white hover:bg-gray-700" asChild>
          <Link href="/admin/navigation/new">
            <Plus className="mr-2 h-5 w-5" />
            New Menu
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <Card className="shadow-md bg-white text-black border-gray-200 rounded-[14px]">
        <CardHeader>
          <CardTitle className="text-gray-900">Navigation Menus</CardTitle>
          <CardDescription className="text-gray-500">
            View and manage all navigation menus. Click on a menu to view or edit its items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
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
                    <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center py-8">
                        <p className="mb-4">No navigation menus found</p>
                        <Button variant="outline" asChild className="border-gray-400 text-gray-700 hover:bg-gray-100">
                          <Link href="/admin/navigation/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Menu
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 