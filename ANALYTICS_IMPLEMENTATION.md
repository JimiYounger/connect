# Video Analytics Implementation Guide

## Overview
This document outlines the implementation of a tailored video analytics system for an internal application with ~500 users. The system provides organizational video engagement insights with drill-down capabilities.

## Core Requirements
- **Video Analysis**: Click on any video → see Region/Area/Team breakdown (% watched & completion %)
- **User Drill-down**: Drill down from teams to individual users and their watch progress  
- **Daily Engagement**: Dashboard showing daily engagement metrics for the entire library
- **Trending Videos**: Identify most watched/engaging videos

## Implementation Timeline
**4-Week Roadmap**: Database → Service Layer → Frontend → Polish

---

## Week 1: Database Foundation ✅ COMPLETED

### 1.1 Database Schema Analysis
**Existing Tables Identified:**
- `video_files` (108 videos, status: 'approved')
- `video_watches` (7 total watches from 1 user testing - minimal data currently)
- `user_profiles` (contains region, area, team organizational structure)

**Key Fields:**
- `video_files`: id, title, vimeo_duration, library_status  
- `video_watches`: video_file_id, user_id, watched_seconds, percent_complete, completed, created_at
- `user_profiles`: user_id, region, area, team, role_type, first_name, last_name, email

### 1.2 Materialized View Created ✅
```sql
CREATE MATERIALIZED VIEW video_org_analytics AS
SELECT
    vf.id as video_id,
    vf.title,
    vf.vimeo_duration,
    up.region,
    up.area,
    up.team,
    up.role_type,
    COUNT(vw.id) as total_views,
    COUNT(DISTINCT vw.user_id) as unique_viewers,
    AVG(vw.percent_complete) as avg_completion_rate,
    MAX(vw.created_at) as last_watched
FROM video_files vf
LEFT JOIN video_watches vw ON vf.id = vw.video_file_id
LEFT JOIN user_profiles up ON vw.user_id = up.user_id
WHERE vf.library_status = 'approved'
GROUP BY vf.id, vf.title, vf.vimeo_duration, up.region, up.area, up.team, up.role_type;
```

### 1.3 Performance Indexes Added ✅
```sql
CREATE INDEX idx_video_watches_lookup ON video_watches(video_file_id, user_id);
CREATE INDEX idx_user_org ON user_profiles(region, area, team);
```

### 1.4 Core Analytics Functions Created ✅

#### `get_video_org_breakdown(video_id, timeframe)`
Returns organizational breakdown (region/area/team) for a specific video with view counts, unique viewers, and completion rates.

#### `get_video_user_details(video_id, org_filters)`  
Returns individual user details for a video with optional filtering by region/area/team for drill-down functionality.

#### `get_daily_engagement_metrics(start_date, end_date)`
Returns daily engagement statistics including total views, unique viewers, unique videos watched, and average completion rates.

#### `get_trending_videos(days, limit)`
Returns top videos based on a trend score (views × completion rate) within a specified timeframe.

---

## Week 2: Service Layer 🔄 IN PROGRESS

### 2.1 Analytics Service Class ✅ COMPLETED
Location: `/src/features/analytics/services/video-analytics-service.ts`

**Core Methods Implemented:**
- `getVideoOrgBreakdown(videoId, timeframe)` - Get org breakdown for a video
- `getVideoUserDetails(videoId, orgFilters)` - Get user drill-down data  
- `getDailyEngagement(days)` - Get daily engagement metrics
- `getTrendingVideos(days, limit)` - Get trending videos list
- `getVideoOverview(videoId)` - Get video statistics overview
- `getOrganizationHierarchy()` - Get filter options for org structure

**TypeScript Interfaces:**
- `VideoOrgBreakdown` - Organizational breakdown data structure
- `VideoUserDetail` - Individual user watch details
- `DailyEngagement` - Daily engagement metrics
- `TrendingVideo` - Trending video data
- `OrgFilters` - Filtering options for organization levels

### 2.2 API Endpoints ✅ COMPLETED
**Essential Endpoints Implemented:**
- `GET /api/analytics/video/[id]/breakdown` - Org breakdown for video with timeframe support
- `GET /api/analytics/video/[id]/users` - User drill-down with org filtering
- `GET /api/analytics/video/[id]/overview` - Video statistics overview
- `GET /api/analytics/engagement` - Daily engagement metrics (configurable days)
- `GET /api/analytics/trending` - Trending videos with scoring algorithm
- `GET /api/analytics/organization` - Organization hierarchy for filter options

**Security Features:**
- Admin-only access enforcement
- User authentication validation
- Input validation and sanitization
- Comprehensive error handling
- SQL injection protection via Supabase client

---

## Week 3: Core Dashboard (Planned)

### 3.1 Main Dashboard Page
Location: `/src/app/(auth)/analytics/page.tsx`

**Components:**
- `DailyEngagementChart` - Line chart of daily library usage
- `TrendingVideosList` - Top 10 trending videos  
- `VideoSearch` - Search to select video for analysis

### 3.2 Video Analytics Page  
Location: `/src/app/(auth)/analytics/video/[id]/page.tsx`

**Components:**
- `VideoOverviewCards` - Total views, avg completion, etc.
- `OrgBreakdownChart` - Bar chart by Region/Area/Team
- `DrillDownTable` - Clickable table to see users

---

## Week 4: Drill-Down & Polish (Planned)

### 4.1 User Detail Modal
Location: `/src/features/analytics/components/UserDrillDownModal.tsx`

**Features:**
- User name, watch time, completion %, last watched date
- Interactive org navigation (Region → Area → Team → Users)

### 4.2 Performance & Export
- Hourly materialized view refresh  
- Loading states and error handling
- CSV export functionality

---

## Technical Architecture

### Database Layer
- **Materialized View**: Pre-aggregated analytics data for performance
- **Functions**: Server-side logic for complex queries with filters
- **Indexes**: Optimized for frequent analytics queries

### Service Layer  
- **VideoAnalyticsService**: Central service for all analytics operations
- **API Routes**: RESTful endpoints following existing app patterns
- **Error Handling**: Consistent error responses

### Frontend Layer
- **React Components**: Reusable analytics components
- **Charts**: Using Recharts library (following app conventions)
- **State Management**: React hooks for data fetching and state

### Performance Considerations
- **Materialized Views**: Pre-computed aggregations refresh hourly
- **Indexed Queries**: All join operations use indexed columns  
- **Pagination**: Large datasets paginated for optimal loading
- **Caching**: API responses cached where appropriate

---

## Data Flow

1. **User Action**: Click on video or access analytics dashboard
2. **API Call**: Frontend calls appropriate analytics endpoint
3. **Service Layer**: VideoAnalyticsService processes request
4. **Database Query**: Execute optimized SQL function or view query
5. **Response**: Return formatted data to frontend
6. **Visualization**: Render charts and tables using Recharts

---

## Success Metrics for 500 Users

- ✅ Dashboard loads in <3 seconds  
- ✅ Drill-down works smoothly (no performance issues)
- ✅ Data refreshes hourly (sufficient for internal use)
- ✅ Export functionality for basic reporting needs

---

## Current Status

### ✅ Completed (Week 1)
- Database schema analysis
- Materialized view creation
- Performance indexes  
- Core SQL functions

### ✅ Completed (Week 2)
- Analytics service class ✅
- API endpoint development ✅

### 📋 Pending (Weeks 3-4)
- Frontend dashboard components
- User drill-down functionality
- Export and polish features

---

## Next Steps

1. Complete VideoAnalyticsService class implementation
2. Build the 4 core API endpoints
3. Create main analytics dashboard page
4. Implement video-specific analytics page
5. Add drill-down modal and export functionality