import React from 'react';
import { dashboardService } from '@/features/widgets/services/dashboard-service';
import { widgetService } from '@/features/widgets/services/widget-service';
import { act, render, screen, waitFor } from '@testing-library/react';
import { DashboardEditor } from '@/features/widgets/components/admin/dashboard-editor';
import userEvent from '@testing-library/user-event';

// Mock the services
jest.mock('@/features/widgets/services/dashboard-service');
jest.mock('@/features/widgets/services/widget-service');
jest.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    profile: { id: 'test-user-id' },
    session: { user: { id: 'test-user-id' } }
  })
}));

// Mock window.alert
window.alert = jest.fn();

describe('Dashboard Editing Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load an existing dashboard and edit it successfully', async () => {
    // Setup mock data
    const mockDashboard = {
      id: 'dashboard-123',
      name: 'Existing Dashboard',
      description: 'Test Description',
      is_published: true,
      created_by: 'test-user-id',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      is_default: false,
      role_access: []
    };

    const mockDraft = {
      id: 'draft-123',
      dashboard_id: 'dashboard-123',
      created_by: 'test-user-id',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      name: 'Draft of Existing Dashboard',
      description: 'Draft Description',
      is_current: true
    };

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
        created_at: '2023-01-01T00:00:00Z',
        widget: {
          id: 'widget-1',
          name: 'Existing Widget',
          widget_type: 'content',
          is_published: true
        }
      }
    ];

    const mockWidgets = [
      {
        id: 'widget-1',
        name: 'Existing Widget',
        widget_type: 'content',
        is_published: true
      },
      {
        id: 'widget-2',
        name: 'Another Widget',
        widget_type: 'data_visualization',
        is_published: true
      }
    ];

    const mockVersion = {
      id: 'version-2',
      dashboard_id: 'dashboard-123',
      version_number: 2,
      created_by: 'test-user-id',
      created_at: new Date().toISOString(),
      is_active: true,
      name: 'Version 2',
      description: 'Updated version'
    };

    // Setup mocks
    (dashboardService.getDashboardById as jest.Mock).mockResolvedValue({
      data: mockDashboard,
      error: null
    });

    (dashboardService.getLatestDraft as jest.Mock).mockResolvedValue({
      data: mockDraft,
      error: null
    });

    (dashboardService.getDraftWidgetPlacements as jest.Mock).mockResolvedValue({
      data: mockPlacements,
      error: null
    });

    (widgetService.getWidgetsByUser as jest.Mock).mockResolvedValue({
      data: mockWidgets,
      error: null
    });

    (dashboardService.replaceDraftWidgetPlacements as jest.Mock).mockResolvedValue({
      data: mockPlacements, // Return same placements for simplicity
      error: null
    });

    (dashboardService.publishDashboardVersion as jest.Mock).mockResolvedValue({
      data: mockVersion,
      error: null
    });

    // Render dashboard editor
    render(<DashboardEditor dashboardId="dashboard-123" />);

    // Wait for data loading
    await waitFor(() => {
      expect(dashboardService.getDashboardById).toHaveBeenCalledWith('dashboard-123');
      expect(dashboardService.getLatestDraft).toHaveBeenCalledWith('dashboard-123');
      expect(dashboardService.getDraftWidgetPlacements).toHaveBeenCalledWith('draft-123');
    });

    // Test saving the draft (simplified - in real test we'd interact with the UI)
    const saveDraftButton = await screen.findByText(/save draft/i);
    await userEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(dashboardService.replaceDraftWidgetPlacements).toHaveBeenCalledWith(
        'draft-123',
        expect.any(Array)
      );
      expect(window.alert).toHaveBeenCalledWith('Draft saved successfully!');
    });

    // Test publishing the dashboard
    const publishButton = await screen.findByText(/publish/i);
    await userEvent.click(publishButton);

    await waitFor(() => {
      expect(dashboardService.publishDashboardVersion).toHaveBeenCalledWith(
        'draft-123',
        'test-user-id',
        expect.any(String),
        expect.any(String)
      );
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Dashboard published successfully'));
    });
  });
}); 