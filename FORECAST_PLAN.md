# Forecasting Tool - Project Plan & Documentation

## 🎯 Project Goal
Build a simple, effective weekly forecasting tool for sales teams where:
- **Managers** submit weekly forecasts through a mobile-friendly wizard
- **Executives** view aggregated forecasts across regions/teams
- **Admins** can modify survey questions as needed

## 🏗 Design Principles

### Core Philosophy
1. **KISS (Keep It Simple, Stupid)**
   - No over-engineering
   - Straightforward user flows
   - Minimal dependencies

2. **DRY (Don't Repeat Yourself)**
   - Single source of truth
   - Reusable components
   - Centralized business logic

3. **Single Function Architecture**
   - Each function/component does ONE thing well
   - Clear separation of concerns
   - Easy to test and debug

### Technical Principles
- **Mobile-First PWA**: Design for phones, scale up to desktop
- **Standard Components**: Use shadcn/ui defaults, no custom styling overhead
- **Minimal State**: Keep state management simple, use React Query for server state
- **Open Access**: No complex permissions, simple authenticated access
- **Clean Aesthetics**: Black & white with purposeful color (green=good, red=concern, blue=action)

## 📋 Implementation Strategy

### Phase Approach
1. **Foundation** - Database & types
2. **Collection** - Survey wizard
3. **Visualization** - Dashboard
4. **Management** - Admin tools

### Technical Stack
- **Database**: Supabase (3 simple tables)
- **Frontend**: Next.js App Router + React
- **UI**: Shadcn components (Card, Button, Input, Progress)
- **State**: TanStack Query + Local storage for drafts
- **Charts**: Recharts (already installed)
- **Forms**: React Hook Form + Zod validation

### File Structure
```
src/features/forecasting/
├── components/
│   ├── survey/          # Survey wizard components
│   ├── dashboard/       # Dashboard views
│   └── admin/          # Question management
├── hooks/              # Business logic hooks
├── services/           # API calls
├── types/              # TypeScript types
└── pages/              # Page components
```

## 📊 Database Schema

### Tables
1. **forecast_questions**
   - Core question data
   - Section grouping
   - Display order
   - Active status

2. **forecast_responses**
   - User submission metadata
   - Week/team/area/region tracking
   - Submission timestamp

3. **forecast_answers**
   - Individual answer storage
   - Links response to question
   - Flexible text/number storage

### Design Decisions
- Separate answers table = flexible question changes
- Week stored as Monday date = consistent reporting
- JSONB for select options = easy updates
- No hard deletes = historical integrity

## ✅ Atomic Todo List

### Phase 1: Foundation ✅
- [x] Create FORECAST_PLAN.md documentation
- [x] Create database migration file
- [x] Add forecast tables (questions, responses, answers)
- [x] Set up RLS policies (simple authenticated access)
- [x] Seed initial 14 questions with sections
- [x] Create TypeScript types from schema
- [x] Set up feature folder structure

### Phase 2: Survey Wizard ✅
- [x] Create SurveyPage.tsx route wrapper
- [x] Build SurveyWizard.tsx container
- [x] Create QuestionCard.tsx component
  - [x] Text input variant
  - [x] Number input variant
  - [x] Textarea variant
  - [x] Select dropdown variant
  - [ ] People multi-select variant
- [x] Add ProgressBar.tsx with sections
- [x] Implement swipe/button navigation
- [x] Add localStorage draft saving
- [x] Create useForecastSurvey.ts hook
- [x] Build forecastService.ts API layer
- [x] Add SurveyComplete.tsx confirmation
- [x] Create API route /api/forecast/survey
- [x] Test mobile responsiveness
- [x] Test offline draft capability

### Phase 2.5: People Multi-Select Enhancement ✅
- [x] Add 'people_multi_select' enum value to question_type
- [x] Update Q4, Q5, Q8, Q9 to use people_multi_select type
- [x] Create PeopleMultiSelect.tsx component
- [x] Add user fetching logic to survey hook
- [x] Update QuestionCard to handle people selection
- [x] Test people selection functionality
- [x] Add include_text_area field for Q4, Q5, Q9
- [x] Enhance PeopleMultiSelect with optional text areas
- [x] Update data handling for combined people+text answers

### Phase 2.7: Area Selection & Bug Fixes ✅
- [x] Create /api/forecast/areas endpoint for area-region mapping
- [x] Create AreaSelection component with area dropdown
- [x] Update SurveyWizard to include area selection step
- [x] Update survey hook to support area selection state
- [x] Update survey API to use selected area/region
- [x] Fix foreign key constraint error (user_profiles.id vs auth user.id)
- [x] Fix week_of calculation to use next Monday correctly
- [x] Fix dropdown text readability in AreaSelection
- [x] Remove View Dashboard button from completion screen
- [x] Simplify by removing week selection dropdown (KISS principle)

### Phase 2.8: Multi-Area Forecast Support ✅
- [x] Update database unique constraint from (user_id, week_of) to (user_id, week_of, area)
- [x] Modify GET endpoint to filter responses by selected area
- [x] Update POST endpoint conflict resolution to support area-specific updates
- [x] Enhance frontend hook to pass area context in API calls
- [x] Fix people multi-select to show users from selected area, not manager's area
- [x] Update component prop chain: SurveyWizard → QuestionCard → PeopleMultiSelect
- [x] Clean up ESLint warnings in AreaSelection component

### Phase 3: Dashboard
- [ ] Create DashboardPage.tsx route
- [ ] Build ForecastDashboard.tsx container
- [ ] Create MetricsSummary.tsx (big numbers)
- [ ] Build RegionalCard.tsx component
- [ ] Build TeamCard.tsx component
- [ ] Add MetricsChart.tsx with recharts
- [ ] Create useForecastDashboard.ts hook
- [ ] Build comparison logic (week vs week)
- [ ] Add drill-down navigation
- [ ] Create API route /api/forecast/dashboard
- [ ] Implement pull-to-refresh
- [ ] Add export functionality
- [ ] Test responsive layouts

### Phase 4: Admin Tools
- [ ] Create AdminPage.tsx route
- [ ] Build QuestionManager.tsx component
- [ ] Create QuestionList.tsx table
- [ ] Add QuestionEditor.tsx modal
- [ ] Implement drag-to-reorder
- [ ] Add active/inactive toggle
- [ ] Create useQuestionManager.ts hook
- [ ] Build API route /api/forecast/questions
- [ ] Add question preview
- [ ] Test question updates

### Phase 5: Polish & Deploy
- [ ] Add loading states
- [ ] Implement error boundaries
- [ ] Add success toasts
- [ ] Create help tooltips
- [ ] Test PWA installation
- [ ] Verify offline capabilities
- [ ] Performance optimization
- [ ] Documentation update

## 🐛 Debug Journal

### Issue Template
```
#### Issue: [Brief description]
**Date**: YYYY-MM-DD
**Symptoms**: What went wrong?
**Root Cause**: Why did it happen?
**Solution**: How was it fixed?
**Lessons Learned**: What to remember
---
```

### Resolved Issues

#### Issue: Incorrect Supabase import paths
**Date**: 2025-01-18
**Symptoms**: TypeScript errors for missing module '@/lib/supabase/supabase-auth-helpers/client'
**Root Cause**: Using deprecated auth helpers instead of new @supabase/ssr
**Solution**: Updated imports to use '@/lib/supabase' for client and '@/lib/supabase-server' for server
**Lessons Learned**: Always check existing project patterns before adding new dependencies

#### Issue: Type mismatch in useState Map
**Date**: 2025-01-18
**Symptoms**: TypeScript error with Map<string, unknown> vs Map<string, string | number>
**Root Cause**: JSON.parse returns unknown types, need explicit casting
**Solution**: Added type assertions when loading from localStorage
**Lessons Learned**: Be explicit with type casting when dealing with serialized data

#### Issue: Missing toast hook
**Date**: 2025-01-18
**Symptoms**: Cannot find '@/components/ui/use-toast' module
**Root Cause**: Wrong import path for toast functionality
**Solution**: Changed to '@/hooks/use-toast' and destructured { toast } from useToast()
**Lessons Learned**: Grep existing codebase for correct import patterns

#### Issue: Survey showing "No questions available"
**Date**: 2025-01-18
**Symptoms**: API returns empty questions array despite 14 questions in database
**Root Cause**: API route was calling client-side service from server context
**Solution**: Rewrote API route to use server-side Supabase client directly
**Lessons Learned**: Keep server and client code separate - don't call client services from API routes

#### Enhancement: People Multi-Select for Team Questions
**Date**: 2025-01-18
**Need**: Questions about specific team members need searchable multi-select for users
**Solution**: Add 'people_multi_select' question type with JSONB storage
**Implementation**:
- Store user IDs as JSON array in answer_text field
- Searchable dropdown filtered by area, expandable to all users
- Update Q4, Q5, Q8, Q9 to use new type

#### Enhancement: Optional Text Area for People Questions
**Date**: 2025-01-18
**Need**: Some people selection questions need additional text input for context/plans
**Solution**: Add 'include_text_area' field to questions, show both people + text when enabled
**Implementation**:
- Add include_text_area boolean to forecast_questions table
- Store as: ["user1","user2"]||Additional text here
- Enable for Q4, Q5, Q9 (need context/plans) but not Q8 (just unavailable list)

#### Issue: Foreign Key Constraint Error on Survey Submission
**Date**: 2025-09-18
**Symptoms**: Insert error violates foreign key constraint "forecast_responses_user_id_fkey"
**Root Cause**: Code inserting user.id (Supabase auth) but FK points to user_profiles.id (different UUID)
**Solution**: Use profile.id instead of user.id, add error handling for missing profiles
**Lessons Learned**: Always verify foreign key relationships match actual data flow

#### Issue: Week Dates Showing Sunday Instead of Monday
**Date**: 2025-09-18
**Symptoms**: Area selection shows "Week of Sunday, September 21, 2025" instead of Monday
**Root Cause**: Two different Monday calculation functions with inconsistent logic
**Solution**: Fixed getNextMonday() function in survey hook with simple, clear date math
**Lessons Learned**: KISS principle - don't overcomplicate date calculations

#### Enhancement: Area Selection with Region Mapping
**Date**: 2025-09-18
**Need**: Managers need flexibility to submit forecasts for different areas
**Solution**: Added area selection screen before survey questions
**Implementation**:
- Shows current area by default with clear week information
- Dropdown to select different area if needed
- Auto-populates region based on area selection
- Sets team=null when submitting for different area

#### Enhancement: Multi-Area Forecast Support
**Date**: 2025-09-18
**Need**: Managers should be able to submit multiple forecasts per week for different areas
**Problem**: Database constraint limited one forecast per user per week, regardless of area
**Solution**: Updated system to support area-specific forecasts with proper data isolation
**Implementation**:
- **Database**: Changed unique constraint from (user_id, week_of) to (user_id, week_of, area)
- **API**: Updated conflict resolution to use area-specific upserts (user_id,week_of,area)
- **Frontend**: Enhanced query system to fetch/cache responses per area context
- **People Selection**: Fixed component chain to show users from target area, not manager's area
- **User Experience**: Same area = update existing, different area = create new record

#### Issue: React Duplicate Key Error in Dashboard Week Selector
**Date**: 2025-09-18
**Symptoms**: "Encountered two children with the same key, `2025-09-22`" React error
**Root Cause**: Complex multi-loop week generation logic was creating duplicate dates
**Solution**: Replaced with simple offset-based single loop approach
**Implementation**:
- **Before**: Separate loops for future weeks, current week, and past weeks
- **After**: Single loop with offsets from -8 to +4 relative to current forecast week
- **Benefits**: KISS principle, DRY compliance, guaranteed unique keys
- **Lessons Learned**: Simple sequential logic prevents edge case bugs

#### Issue: Dashboard Timezone Date Display Bug
**Date**: 2025-09-18
**Symptoms**: Week selector showing "Sep 21, 2025" but data stored for "Sep 22, 2025"
**Root Cause**: `new Date('2025-09-22')` parsed as midnight UTC, shifted to local timezone during formatting
**Solution**: Add explicit time component to prevent timezone drift
**Implementation**:
- **Before**: `new Date('2025-09-22')` → displays "Sep 21, 2025"
- **After**: `new Date('2025-09-22T12:00:00')` → displays "Sep 22, 2025"
- **Fixed Components**: Week selector labels, Executive Summary dates
- **Lessons Learned**: Always specify time component for date-only strings to avoid timezone issues

### Known Limitations
<!-- Document any accepted limitations or trade-offs -->

## 📝 Design Decisions Log

### Why These Choices?
- **Separate answers table**: Allows question modifications without data loss
- **Week of Monday**: Standardizes reporting periods across teams
- **Mobile-first wizard**: Most managers will fill out on phones
- **No complex permissions**: Internal tool, trust the team
- **localStorage drafts**: Prevent data loss on connection issues

### Future Considerations
- Historical trend analysis
- Automated reminder system
- Slack/email notifications
- Forecast accuracy tracking
- Team goal setting

## 🚀 Success Metrics

1. **Usability**
   - Survey completion < 5 minutes
   - Mobile-friendly score 100/100
   - Zero training required

2. **Reliability**
   - No data loss
   - Works offline
   - Fast load times (< 2s)

3. **Adoption**
   - 100% manager participation
   - Weekly executive reviews
   - Positive feedback

## 📚 Resources & References

- [Supabase Docs](https://supabase.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [TanStack Query](https://tanstack.com/query)
- [Recharts](https://recharts.org)

---

## 📊 Progress Summary

### Completed ✅
- **Database**: All tables created, seeded with questions, RLS policies configured
- **Backend**: Service layer and API routes implemented
- **Survey Wizard**: Complete mobile-first typeform-style interface
- **People Multi-Select**: Searchable team member selection with optional text areas
- **Area Selection**: Flexible area selection with smart defaults and region mapping
- **Multi-Area Support**: Managers can submit multiple forecasts per week for different areas
- **Smart People Filtering**: People selection shows users from target forecast area
- **Executive Dashboard**: Complete dashboard with metrics, regional breakdown, and charts
- **Future Week Support**: Dashboard can view both past and future forecasts
- **Bug Fixes**: Duplicate keys, timezone issues, Monday calculations, mobile optimizations
- **TypeScript**: Full type safety with proper Supabase integration

### Currently Ready ✅
- **Survey Collection**: Fully functional mobile-first survey with all question types
- **Multi-Area Forecasting**: Managers can create separate forecasts for different areas
- **Executive Dashboard**: Real-time dashboard with metrics summary, regional cards, and charts
- **Historical & Future Views**: Week selector spanning past and future forecasts
- **Area-Specific Data**: People selection and data isolation per area
- **Smart State Management**: Area switching preserves/loads appropriate data
- **Data Integrity**: Proper foreign keys, validation, and error handling

### Next Steps 📝
1. Admin interface for question management (Phase 4)
2. Export functionality for dashboard (CSV/PDF reports)
3. Mobile PWA testing and optimization (Phase 5)
4. Advanced features: historical trends, automated reminders, notifications

---

*Last Updated: 2025-09-18*
*Status: Executive Dashboard Complete - Survey Collection & Analytics Ready for Production*