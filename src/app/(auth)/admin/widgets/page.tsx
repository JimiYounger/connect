// my-app/src/app/(auth)/admin/widgets/page.tsx

'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { widgetService } from '@/features/widgets/services/widget-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ErrorDisplay } from '@/components/ui/error-display';
import { PlusIcon, RefreshCcw, Search, SlidersHorizontal, Tags } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { WidgetType } from '@/features/widgets/types';
import { formatDistanceToNow } from 'date-fns';

export default function WidgetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  // State for widgets
  const [widgets, setWidgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [widgetTypes, setWidgetTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const ITEMS_PER_PAGE = 12;
  
  // Fetch widgets
  useEffect(() => {
    async function fetchWidgets() {
      if (!session?.user.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get query parameters
        const tabStatus = activeTab === 'published' ? true : 
                         activeTab === 'drafts' ? false : undefined;
        
        // Fetch widgets with filters
        const { data, error, pagination } = await widgetService.getWidgets({
          userId: session.user.id,
          search: searchQuery,
          types: widgetTypes.length > 0 ? widgetTypes : undefined,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          isPublished: tabStatus,
          page: currentPage,
          limit: ITEMS_PER_PAGE
        });
        
        if (error) throw error;
        
        setWidgets(data || []);
        
        // Set total pages from pagination data
        if (pagination) {
          setTotalPages(Math.ceil(pagination.total / ITEMS_PER_PAGE));
        }
      } catch (err) {
        console.error('Error fetching widgets:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Fetch categories for filter
    async function fetchCategories() {
      if (!session?.user.id) return;
      
      try {
        const { data, error } = await widgetService.getWidgetCategories();
        
        if (error) throw error;
        
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    
    if (session?.user.id) {
      fetchWidgets();
      fetchCategories();
    }
  }, [session, searchQuery, widgetTypes, selectedCategory, activeTab, currentPage]);
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    router.refresh();
  };
  
  // Handle widget type filter
  const handleWidgetTypeFilter = (type: string) => {
    setWidgetTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
    
    // Reset to first page when changing filters
    setCurrentPage(1);
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };
  
  // Get icon based on widget type
  const getWidgetTypeIcon = (type: string) => {
    switch (type) {
      case WidgetType.REDIRECT:
        return "🔗";
      case WidgetType.DATA_VISUALIZATION:
        return "📊";
      case WidgetType.INTERACTIVE_TOOL:
        return "🛠️";
      case WidgetType.CONTENT:
        return "📝";
      case WidgetType.EMBED:
        return "🖼️";
      case WidgetType.CUSTOM:
        return "🧩";
      default:
        return "📦";
    }
  };
  
  // Loading states
  if (loading.initializing) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (!session) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>Please sign in to access this page</p>
        </div>
      </div>
    );
  }

  // Profile and permissions loading
  if (!profile || !userPermissions) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Permission check
  if (!hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p>You don&apos;t have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Widget Library</h1>
          <p className="text-muted-foreground">
            Manage and configure widgets for your dashboards
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Link href="/admin/widgets/categories">
            <Button variant="outline" size="sm">
              <Tags className="mr-2 h-4 w-4" />
              Manage Categories
            </Button>
          </Link>
          
          <Link href="/admin/widgets/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Widget
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All Widgets</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {showFilters && (
          <div className="mb-6 p-4 border rounded-md bg-muted/40">
            <h3 className="font-medium mb-3">Filter by Type</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.values(WidgetType).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={widgetTypes.includes(type)}
                    onCheckedChange={() => handleWidgetTypeFilter(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="flex items-center">
                    <span className="mr-1">{getWidgetTypeIcon(type)}</span> {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <TabsContent value="all" className="mt-0">
          {renderWidgetGrid()}
        </TabsContent>
        
        <TabsContent value="published" className="mt-0">
          {renderWidgetGrid()}
        </TabsContent>
        
        <TabsContent value="drafts" className="mt-0">
          {renderWidgetGrid()}
        </TabsContent>
      </Tabs>
    </div>
  );
  
  function renderWidgetGrid() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardHeader>
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-8 w-full bg-gray-200 rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <ErrorDisplay 
          title="Error loading widgets" 
          error={error} 
          retry={handleRefresh}
        />
      );
    }
    
    if (widgets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
              <path d="M9 15h.01" />
              <path d="M15 15h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">No widgets found</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            {searchQuery || widgetTypes.length > 0 || selectedCategory !== 'all'
              ? "No widgets match your current filters. Try adjusting your search criteria."
              : "You haven't created any widgets yet. Get started by creating your first widget."}
          </p>
          <Link href="/admin/widgets/new">
            <Button>Create Widget</Button>
          </Link>
        </div>
      );
    }
    
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {widgets.map((widget) => (
            <Link key={widget.id} href={`/admin/widgets/${widget.id}/edit`} className="group">
              <Card className="overflow-hidden h-full transition-all hover:shadow-md group-hover:border-primary/20">
                <div 
                  className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative"
                  style={{
                    backgroundImage: widget.thumbnail_url ? `url(${widget.thumbnail_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!widget.thumbnail_url && (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                      {getWidgetTypeIcon(widget.widget_type)}
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    {widget.is_published ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {widget.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    {getWidgetTypeIcon(widget.widget_type)} {widget.widget_type}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {widget.description || 'No description available'}
                  </p>
                </CardContent>
                
                <CardFooter className="border-t pt-4 flex justify-between text-xs text-muted-foreground">
                  <div>
                    Created {widget.created_at 
                      ? formatDistanceToNow(new Date(widget.created_at), { addSuffix: true })
                      : 'N/A'}
                  </div>
                  <div>
                    Used in {widget.usage_count || 0} dashboards
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
        
        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                // Show first page, last page, and pages around current page
                if (
                  i === 0 || 
                  i === totalPages - 1 || 
                  (i >= currentPage - 2 && i <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis
                if (
                  (i === 1 && currentPage > 3) ||
                  (i === totalPages - 2 && currentPage < totalPages - 3)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </>
    );
  }
} 