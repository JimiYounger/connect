# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Common Development Tasks
- `npm run dev` - Start the development server (Next.js 15 with App Router)
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues
- `npm run test` - Run Jest test suite
- `npm run test:watch` - Run Jest in watch mode for development
- `npm run test:coverage` - Run tests with coverage report

### Test-Specific Commands
- Tests are located in `__tests__/` directory
- Test files follow the pattern `*.test.tsx`
- Tests use Jest with jsdom environment and SWC for transforms
- Use `npm run test:watch` when developing new features to get immediate feedback

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router and React 19
- **Database**: Supabase with PostgreSQL
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack Query for server state, React Context for client state
- **Authentication**: Supabase Auth with role-based permissions
- **File Storage**: Uploadcare for general files, Supabase Storage for documents
- **Video**: Vimeo integration for video library and streaming
- **Messaging**: Twilio for SMS/messaging features
- **PWA**: Next-PWA for Progressive Web App capabilities

### Key Application Features

**Core Modules:**
- **Dashboard System**: Drag-and-drop widget-based dashboards with customizable layouts
- **Video Library**: Vimeo-integrated video management with series, categories, and analytics
- **Document Library**: AI-powered document management with semantic search and OCR
- **Contact Directory**: Organizational contact management with department grouping
- **Messaging System**: Twilio-powered SMS messaging with templates and variables
- **Navigation Builder**: Dynamic menu system with role-based visibility
- **Analytics**: Video engagement and organizational usage analytics
- **Widget System**: Extensible widget framework for dashboard components

### Directory Structure

**App Router Structure:**
- `src/app/(auth)/` - Protected admin routes
- `src/app/(public)/` - Public routes and authentication
- `src/app/api/` - API routes organized by feature
- `src/app/layout.tsx` - Root layout with PWA and auth handling

**Feature-Based Architecture:**
- `src/features/` - Feature modules with components, hooks, services, and types
- Each feature is self-contained with its own components, services, and types
- Shared UI components in `src/components/ui/`

**Key Service Integrations:**
- Supabase client utilities in `src/lib/supabase.ts` and auth utilities
- Vimeo API integration in `src/features/vimeo/api/vimeoApi.ts`
- OpenAI integration for document processing in `src/lib/openai.ts`
- Redis caching with Upstash in `src/lib/redis/`
- Activity and error logging services in `src/lib/logging/`

### Database Schema
- Uses Supabase with custom extensions and RLS policies
- Migration files in `migrations/` directory
- TypeScript types generated from database schema in `src/types/supabase.ts`

### Authentication & Permissions
- Role-based access control with organizational hierarchy
- Permission guards in `src/features/permissions/`
- Auth utilities handle both client and server-side authentication
- Middleware handles route protection

### Key Development Patterns

**State Management:**
- TanStack Query for all server state and caching
- React Context for client-side state (auth, theme)
- SWR for some real-time features

**Component Structure:**
- Feature-based organization with index.ts exports
- Radix UI primitives with custom styling
- Form handling with React Hook Form and Zod validation

**API Design:**
- RESTful API routes under `/api/`
- Consistent error handling and logging
- Rate limiting and caching where appropriate

### Testing Strategy
- Jest with Testing Library for component tests
- Tests focus on user interactions and business logic
- Mocks for external services (Vimeo, Supabase, etc.)
- Test utilities in `__mocks__/` directory

### Performance Considerations
- Next.js Image optimization for all media
- PWA caching strategies for offline functionality
- Redis caching for frequently accessed data
- Semantic search with optimized vector operations