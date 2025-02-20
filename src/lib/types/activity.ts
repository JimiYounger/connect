// src/lib/types/activity.ts

export enum ActivityType {
  USER_AUTH = 'user_auth',        // Login, logout, etc.
  CONTENT_ACCESS = 'content_access', // Viewing resources
  ADMIN_ACTION = 'admin_action',   // Admin panel actions
  SYSTEM_EVENT = 'system_event',   // Background jobs, system updates
  ERROR_EVENT = 'error_event',     // Error occurrences
  PAGE_VIEW = 'page_view'         // Page views and navigation
}

export enum ActivityStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  action: string;
  userId?: string;
  userEmail?: string;
  status: ActivityStatus;
  details: Record<string, any>;
  metadata?: {
    userAgent?: string;
    ip?: string;
    path?: string;
    method?: string;
  };
  timestamp: number;
} 