'use client';

import React, { useState, useEffect } from 'react';
import { WidgetLibrary } from '@/features/widgets/components/widget-library';
import { WidgetDndProvider } from '@/features/widgets/components/widget-library/widget-dnd-context';
import { useWidgetCategories } from '@/features/widgets/hooks/use-widget-categories';
import { Widget, WidgetConfigData } from '@/features/widgets/types';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Info, Plus } from 'lucide-react';
import Link from 'next/link';
import { initializeWidgets } from '@/features/widgets/init-widgets';

export default function AdminWidgetLibraryPage() {
  const { session, loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  const { categories } = useWidgetCategories();
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  
  const handleWidgetSelect = (widget: Widget) => {
    setSelectedWidget(widget);
  };
  
  const handleDragEnd = (widget: Widget, configuration: WidgetConfigData) => {
    console.log('Widget dragged:', widget, configuration);
    // Here you would handle adding the widget to your grid or dashboard
  };
  
  useEffect(() => {
    // Initialize all widgets when the page loads
    initializeWidgets();
  }, []);
  
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
          <Link href="/admin/widgets" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Widget Management
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Widget Library</h1>
          <p className="text-muted-foreground">
            Browse and manage widgets for your dashboards
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/admin/widgets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Widget
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Widgets</TabsTrigger>
          <TabsTrigger value="info">How to Use</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="h-[calc(100vh-240px)]">
                <CardContent className="h-[calc(100%-1rem)] pt-6">
                  <WidgetDndProvider onDragEnd={handleDragEnd}>
                    <WidgetLibrary
                      userId={session.user.id}
                      onWidgetSelect={handleWidgetSelect}
                      categories={categories}
                      className="h-full"
                    />
                  </WidgetDndProvider>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-[calc(100vh-240px)]">
                <CardHeader className="pb-3">
                  <CardTitle>Widget Details</CardTitle>
                  <CardDescription>
                    {selectedWidget ? 'Information about the selected widget' : 'Select a widget to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedWidget ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-lg">{selectedWidget.name}</h3>
                        <p className="text-muted-foreground text-sm">{selectedWidget.description || 'No description available'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">{selectedWidget.widget_type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Shape</p>
                          <p className="font-medium capitalize">{selectedWidget.shape}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Size Ratio</p>
                          <p className="font-medium">{selectedWidget.size_ratio}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">{selectedWidget.is_published ? 'Published' : 'Draft'}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Link href={`/admin/widgets/${selectedWidget.id}/edit`}>
                          <Button className="w-full">Edit Widget</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Info className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Widget Selected</h3>
                      <p className="text-muted-foreground text-sm">
                        Click on a widget in the gallery to view its details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>How to Use the Widget Library</CardTitle>
              <CardDescription>
                Learn how to browse, search, and add widgets to your dashboards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Browsing Widgets</h3>
                <p>
                  The widget library displays all available widgets in a grid layout. You can browse through the widgets by scrolling or using the pagination controls at the bottom.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Searching and Filtering</h3>
                <p>
                  Use the search box to find widgets by name or description. You can also filter widgets by category using the dropdown menu.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Adding Widgets to Dashboards</h3>
                <p>
                  To add a widget to your dashboard, simply drag it from the library and drop it onto your dashboard grid. You can then resize and position it as needed.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Widget Details</h3>
                <p>
                  Click on any widget to view its details in the sidebar. From there, you can also edit the widget&apos;s properties or configuration.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 