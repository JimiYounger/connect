# Leadership Training Decks (LTD) Project Plan

## Project Overview

We are creating a custom page at `/ltd` (Leadership Training Decks) that displays documents from the "Leadership Training" category and "Decks" subcategory with custom metadata fields for presentation tracking.

## Current Status: IN PROGRESS
- **Started**: 2025-01-29
- **Current Phase**: Database Schema & API Development
- **Next Milestone**: Complete API endpoints and begin frontend development

---

## Project Requirements

### Core Functionality
1. **Custom Page Route**: `/ltd` - Leadership Training Decks
2. **Document Filtering**: Show only documents where:
   - Category = "Leadership Training"
   - Subcategory = "Decks"
3. **Sorting**: Display newest to oldest (by updated_at)
4. **Document Display**: Show clickable titles that link directly to document viewer
5. **Custom Metadata**: Add "Presented By" and "Meeting Date" fields
6. **Admin Features**: 
   - Edit mode toggle (Edit Mode ↔ Production View)
   - Inline editing of custom metadata
   - Only visible to admin users
7. **Document Links**: Click title → direct to document viewer (`/api/document-library/view/[id]`)

### Technical Requirements
- Integrate with existing document management system
- Use current authentication/authorization patterns
- Follow existing UI/UX design patterns
- Maintain responsive design for mobile

---

## Implementation Plan

### Phase 1: Database Schema ✅ IN PROGRESS
**Objective**: Add custom metadata storage capability

#### Database Table: `document_custom_metadata`
```sql
CREATE TABLE document_custom_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    metadata_type TEXT NOT NULL, -- 'leadership_training_deck'
    presented_by TEXT,
    meeting_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES user_profiles(id),
    UNIQUE(document_id, metadata_type)
);
```

#### Indexes & Policies
- Index on `document_id` for fast lookups
- Index on `metadata_type` for filtering
- RLS policies: read for authenticated, full access for admins

**Status**: ✅ Migration file created, needs to be executed via Supabase MCP

---

### Phase 2: API Development 🔄 NEXT UP
**Objective**: Build backend endpoints for LTD functionality

#### New API Routes
1. **GET `/api/ltd/documents`** - Fetch Leadership Training Decks
   - Filters documents by category/subcategory
   - Joins with custom metadata
   - Orders by newest first
   - Includes permission checking

2. **POST `/api/ltd/metadata`** - Create/Update custom metadata
   - Admin-only endpoint
   - Upsert metadata for document
   - Validation for required fields

3. **DELETE `/api/ltd/metadata/[id]`** - Remove custom metadata
   - Admin-only endpoint
   - Soft delete or hard delete (TBD)

**Status**: 🔄 Ready to implement

---

### Phase 3: Frontend Components 📋 PENDING
**Objective**: Build the `/ltd` page interface

#### Component Architecture
```
src/app/(auth)/ltd/
├── page.tsx                    # Main route page
├── components/
│   ├── LeadershipTrainingDecks.tsx    # Main container component
│   ├── LTDDocumentCard.tsx            # Individual document display
│   ├── MetadataEditForm.tsx           # Inline editing form
│   ├── AdminToggle.tsx                # Edit/Production mode toggle
│   └── LTDDocumentList.tsx            # Document list container
```

#### Features to Implement
- **Document List Display**
  - Title (clickable → document viewer)
  - Presented By field
  - Meeting Date field  
  - Clean, professional layout

- **Admin Mode Toggle**
  - Toggle button: "Edit Mode" ↔ "Production View"
  - Visual distinction between modes
  - Hide/show edit controls

- **Inline Editing**
  - Click-to-edit for metadata fields
  - Save/cancel functionality
  - Real-time updates with optimistic UI
  - Error handling and feedback

**Status**: 📋 Planned, ready to implement after API completion

---

### Phase 4: UI/UX Polish 🎨 PENDING
**Objective**: Styling and user experience refinement

#### Design Requirements
- Match existing app design patterns
- Responsive mobile layout
- Clear visual hierarchy
- Professional presentation focus
- Accessible form controls

#### Specific Elements
- Clean card-based layout for documents
- Date picker for meeting dates
- Toast notifications for actions
- Loading states and error boundaries
- Mobile-optimized touch targets

**Status**: 🎨 Pending frontend completion

---

## Current Todo List

### High Priority (This Week)
- [ ] **Execute database table creation** via Supabase MCP
- [ ] **Build API endpoint** `/api/ltd/documents` for fetching LTD documents
- [ ] **Build API endpoint** `/api/ltd/metadata` for metadata management
- [ ] **Create main page component** `src/app/(auth)/ltd/page.tsx`
- [ ] **Implement LeadershipTrainingDecks component** with basic listing

### Medium Priority (Next Week)
- [ ] **Build admin toggle functionality** (Edit Mode ↔ Production View)
- [ ] **Implement inline metadata editing** (Presented By, Meeting Date)
- [ ] **Add form validation and error handling**
- [ ] **Implement optimistic updates** for smooth UX
- [ ] **Add responsive design** for mobile devices

### Lower Priority (Future)
- [ ] **Performance optimization** (caching, lazy loading)
- [ ] **Advanced error boundaries** and fallback UI
- [ ] **Unit testing** for components and API endpoints
- [ ] **Integration testing** for full workflow
- [ ] **Documentation** for future maintenance

---

## Technical Architecture

### Database Integration
- Extends existing document system
- Uses current RLS policies and patterns
- Maintains referential integrity with CASCADE deletes
- Supports multiple metadata types for future expansion

### API Design
- Follows existing route patterns (`/api/ltd/...`)
- Uses current authentication middleware
- Implements proper error handling
- Returns consistent JSON response format

### Frontend Architecture
- Uses Next.js 15 App Router
- Integrates with existing auth context
- Follows current component patterns
- Uses existing UI components (shadcn/ui)

### Permission System
- Leverages existing role-based access control
- Admin-only editing capabilities
- Graceful degradation for non-admin users
- Server-side permission validation

---

## File Structure

### Database
```
migrations/
└── add_document_custom_metadata.sql    # ✅ Created

types/
└── ltd.ts                              # 📋 To create - TypeScript interfaces
```

### API Routes
```
src/app/api/ltd/
├── documents/
│   └── route.ts                        # 🔄 To create - Document fetching
├── metadata/
│   ├── route.ts                        # 🔄 To create - Create/update metadata
│   └── [id]/
│       └── route.ts                    # 🔄 To create - Delete metadata
```

### Frontend Components
```
src/app/(auth)/ltd/
├── page.tsx                            # 📋 To create - Main page
└── components/
    ├── LeadershipTrainingDecks.tsx     # 📋 To create - Main component
    ├── LTDDocumentCard.tsx             # 📋 To create - Document card
    ├── MetadataEditForm.tsx            # 📋 To create - Edit form
    ├── AdminToggle.tsx                 # 📋 To create - Mode toggle
    └── types.ts                        # 📋 To create - TypeScript types
```

---

## Success Criteria

### Functional Requirements
- [ ] Page loads at `/ltd` route
- [ ] Shows only Leadership Training > Decks documents
- [ ] Documents sorted newest to oldest
- [ ] Document titles link to document viewer
- [ ] Admin users can toggle Edit/Production modes
- [ ] Admin users can edit Presented By and Meeting Date
- [ ] Non-admin users see clean production view
- [ ] All changes persist to database
- [ ] Mobile responsive design

### Technical Requirements  
- [ ] No breaking changes to existing functionality
- [ ] Follows current authentication patterns
- [ ] Proper error handling and user feedback
- [ ] Performance comparable to existing pages
- [ ] Code follows project conventions

### User Experience
- [ ] Intuitive admin interface
- [ ] Clear visual distinction between modes
- [ ] Smooth editing experience
- [ ] Professional appearance for end users
- [ ] Fast loading and responsive interactions

---

## Notes & Considerations

### Future Enhancements
- Could extend to other document types with custom metadata
- Potential for bulk editing functionality
- Export capabilities for meeting schedules
- Integration with calendar systems
- Search and filtering within LTD documents

### Potential Challenges
- Ensuring proper permission boundaries
- Handling concurrent edits by multiple admins
- Mobile UX for inline editing
- Performance with large document sets

### Dependencies
- Supabase MCP for database operations
- Existing document management system
- Current authentication/authorization system
- shadcn/ui component library

---

**Last Updated**: 2025-01-29
**Next Review**: After Phase 2 completion
**Project Lead**: Development Team