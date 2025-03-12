export const dashboardService = {
  getDashboardById: jest.fn(),
  createDashboard: jest.fn(),
  updateDashboard: jest.fn(),
  deleteDashboard: jest.fn(),
  createDraft: jest.fn(),
  getLatestDraft: jest.fn(),
  getDraftsForDashboard: jest.fn(),
  getDraftWidgetPlacements: jest.fn(),
  replaceDraftWidgetPlacements: jest.fn(),
  publishDashboardVersion: jest.fn(),
  getActiveDashboardVersion: jest.fn(),
  getWidgetPlacementsForVersion: jest.fn(),
}; 