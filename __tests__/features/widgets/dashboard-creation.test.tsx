import React from 'react';
import { dashboardService } from '@/features/widgets/services/dashboard-service';
import { widgetService } from '@/features/widgets/services/widget-service';
import { act, render, screen, waitFor } from '@testing-library/react';

// Mock the services
jest.mock('@/features/widgets/services/dashboard-service');
jest.mock('@/features/widgets/services/widget-service');
jest.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    profile: { id: 'test-user-id' },
    session: { user: { id: 'test-user-id' } }
  })
}));

describe('Dashboard Creation Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a dashboard with draft and publish it successfully', async () => {
    // Mock responses for each step in the workflow
    const mockDashboard = {
      id: 'dashboard-123',
      name: 'Test Dashboard',
      description: 'Test Description',
      is_published: false,
      created_by: 'test-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_default: false,
      role_access: []
    };

    const mockDraft = {
      id: 'draft-123',
      dashboard_id: 'dashboard-123',
      created_by: 'test-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name: 'Test Dashboard Draft',
      description: 'Test Draft'
    };

    const mockWidgets = [
      {
        id: 'widget-1',
        name: 'Widget 1',
        widget_type: 'content',
        is_published: true
      },
      {
        id: 'widget-2',
        name: 'Widget 2',
        widget_type: 'data_visualization',
        is_published: true
      }
    ];

    const mockPlacements = [
      {
        id: 'placement-1',
        draft_id: 'draft-123',
        widget_id: 'widget-1',
        position_x: 0,
        position_y: 0,
        width: 3,
        height: 2,
        layout_type: 'lg',
        created_at: new Date().toISOString()
      },
      {
        id: 'placement-2',
        draft_id: 'draft-123',
        widget_id: 'widget-2',
        position_x: 3,
        position_y: 0,
        width: 3,
        height: 2,
        layout_type: 'lg',
        created_at: new Date().toISOString()
      }
    ];

    const mockVersion = {
      id: 'version-1',
      dashboard_id: 'dashboard-123',
      version_number: 1,
      created_by: 'test-user-id',
      created_at: new Date().toISOString(),
      is_active: true,
      name: 'Version 1',
      description: 'Published version'
    };

    // Setup mock implementations
    (dashboardService.createDashboard as jest.Mock).mockResolvedValue({
      data: mockDashboard,
      error: null
    });

    (dashboardService.createDraft as jest.Mock).mockResolvedValue({
      data: mockDraft,
      error: null
    });

    (widgetService.getWidgetsByUser as jest.Mock).mockResolvedValue({
      data: mockWidgets,
      error: null
    });

    (dashboardService.replaceDraftWidgetPlacements as jest.Mock).mockResolvedValue({
      data: mockPlacements,
      error: null
    });

    (dashboardService.publishDashboardVersion as jest.Mock).mockResolvedValue({
      data: mockVersion,
      error: null
    });

    // Test the complete workflow
    await act(async () => {
      // Step 1: Create a dashboard
      const { data: dashboard, error } = await dashboardService.createDashboard(
        { name: 'Test Dashboard', description: 'Test Description' },
        'test-user-id'
      );

      expect(error).toBeNull();
      expect(dashboard).toEqual(mockDashboard);

      // Step 2: Create a draft (usually automatic after dashboard creation)
      const { data: draft, error: draftError } = await dashboardService.createDraft(
        dashboard!.id,
        'test-user-id'
      );

      expect(draftError).toBeNull();
      expect(draft).toEqual(mockDraft);

      // Step 3: Get available widgets
      const { data: widgets } = await widgetService.getWidgetsByUser('test-user-id');
      expect(widgets).toHaveLength(2);

      // Step 4: Add widgets to draft (save placements)
      const placementsToSave = [
        {
          draft_id: draft!.id,
          widget_id: widgets![0].id,
          position_x: 0,
          position_y: 0,
          width: 3,
          height: 2,
          layout_type: 'lg',
          created_by: 'test-user-id'
        },
        {
          draft_id: draft!.id,
          widget_id: widgets![1].id,
          position_x: 3,
          position_y: 0,
          width: 3,
          height: 2,
          layout_type: 'lg',
          created_by: 'test-user-id'
        }
      ];

      const { error: saveError } = await dashboardService.replaceDraftWidgetPlacements(
        draft!.id,
        placementsToSave
      );

      expect(saveError).toBeNull();

      // Step 5: Publish dashboard
      const { data: version, error: publishError } = await dashboardService.publishDashboardVersion(
        draft!.id,
        'test-user-id',
        'Version 1',
        'Published version'
      );

      expect(publishError).toBeNull();
      expect(version).toEqual(mockVersion);
    });

    // Verify all service methods were called correctly
    expect(dashboardService.createDashboard).toHaveBeenCalledWith(
      { name: 'Test Dashboard', description: 'Test Description' }, 
      'test-user-id'
    );
    
    expect(dashboardService.createDraft).toHaveBeenCalledWith(
      'dashboard-123', 
      'test-user-id'
    );
    
    expect(dashboardService.replaceDraftWidgetPlacements).toHaveBeenCalled();
    expect(dashboardService.publishDashboardVersion).toHaveBeenCalledWith(
      'draft-123', 
      'test-user-id', 
      'Version 1', 
      'Published version'
    );
  });
}); 