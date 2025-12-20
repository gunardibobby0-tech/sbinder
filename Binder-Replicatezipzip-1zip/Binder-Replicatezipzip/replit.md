# StudioBinder Replica - Project Status

## Overview
A production management app for film/TV projects with crew management, scheduling, and script handling.

## 🎯 Recently Completed (Session 2)

### ✅ Crew Master UI System Built
- **Crew Management Dialog** - Full CRUD interface for crew master database
- **Add Crew Form** - Modal dialog with fields: name, title, department, pricing, contact, notes
- **Crew Table Display** - Shows all crew with department badges, pricing, contact info
- **Delete Functionality** - Remove crew from master database
- **Department System** - Supports 10 departments (Camera, Lighting, Sound, Production, Grip, Art, Makeup, Costume, VFX, Other)

### ✅ Cast & Crew Tab Navigation
- **Dual-Tab Interface** - "Cast" and "Crew Master" tabs in project details
- **Separate Management** - Cast members from contacts system vs crew master database
- **Contextual Actions** - Different buttons/forms for each tab
- **Tab-Aware Search** - Search placeholder changes based on active tab

### ✅ Database & Infrastructure
- Crew tables fully migrated and tested
- All API routes functional (GET, POST, PUT, DELETE for crew)
- Crew assignment storage ready (links crew to events)

### ✅ Server Status
- Dev server running with hot reload enabled
- All components compiling without errors
- Ready for feature expansion

## What's Built & Working

### ✅ Core Features
- Project management (create, list, view)
- User authentication (Replit Auth)
- Dark theme UI with modern styling
- **Crew Master database with full CRUD**
- **Cast & Crew tab management**
- Schedule view with clickable events
- OpenRouter AI integration for script generation

### ✅ Pages & Views
- Dashboard with project search
- Project Details with 3 tabs (Details, Cast & Crew, Schedule)
- Settings page
- Login page

## What Still Needs Building

### High Priority (Crew Assignment Features)

#### Logic
- [ ] **Query crew assignments by event** - Get crew assigned to specific schedule event (API exists, UI integration needed)
- [ ] **Link assignments to schedule modal** - Show assigned crew in schedule detail modal
- [ ] **Assign crew to events** - Allow clicking "Add Crew" in schedule modal to select from crew master

#### UI/UX  
- [ ] **Attendees list in schedule modal** - Display assigned crew members
- [ ] **Add/Remove crew from event** - Dialog or dropdown to assign crew
- [ ] **Crew conflict detection** - Show if crew scheduled multiple times
- [ ] **Visual crew indicators** - Show crew count on schedule cards

### Medium Priority
- [ ] **Auto-suggest crew** - OpenRouter suggest crew needed based on event type
- [ ] **Schedule event edits** - Save notes and attendee changes
- [ ] **Crew availability calendar** - Show which days crew are booked
- [ ] **Budget calculations** - Sum crew pricing for project

### Lower Priority
- [ ] Equipment/resource inventory
- [ ] Advanced reports and analytics
- [ ] Document versioning
- [ ] Media asset gallery

## Architecture Notes

### Database Schema
```typescript
// Crew Master
crew: {
  id: serial (primary key)
  projectId: number (foreign key to projects)
  name: string
  title: string
  department: enum (Camera, Lighting, Sound, Production, Grip, Art, Makeup, Costume, VFX, Other)
  pricing: string (flexible format: "$500/day", "$5000/week", etc)
  contact: string (email or phone)
  notes: string (optional)
  createdAt: timestamp
}

// Crew Assignments
crewAssignments: {
  id: serial (primary key)
  projectId: number
  eventId: number (links to events/schedule)
  crewId: number (links to crew master)
  actualPerson: string (optional - specific person if multiple on crew)
  status: string (assigned, confirmed, completed, cancelled)
  createdAt: timestamp
}
```

### API Routes (All Working)
```
GET /api/projects/:projectId/crew - Get all crew for project
POST /api/projects/:projectId/crew - Add new crew member
PUT /api/projects/:projectId/crew/:crewId - Update crew
DELETE /api/projects/:projectId/crew/:crewId - Remove crew

GET /api/projects/:projectId/crew-assignments - Get assignments
POST /api/projects/:projectId/crew-assignments - Create assignment
```

### Frontend Components
- `CrewManagementDialog` - Main dialog for managing crew master
- `AddCrewDialog` - Nested dialog for adding new crew
- `CrewRow` - Individual crew member row component
- `ScheduleDetailDialog` - Shows event details (attendees section ready for integration)
- `ContactsView` - Main view with Cast/Crew tabs

### Frontend Hooks
- `useCrew(projectId)` - Get all crew for project
- `useCrewAssignments(projectId)` - Get crew assignments
- `useCreateCrew()` - Add new crew
- `useUpdateCrew()` - Edit crew
- `useDeleteCrew()` - Remove crew
- `useCreateCrewAssignment()` - Assign crew to event

## Key Design Decisions

1. **Separation of Cast & Crew** - Cast members (actors/characters) stay in contacts system, back-end crew goes in new crew master table
2. **Department-Based Organization** - Crew organized by department instead of generic "role"
3. **Flexible Pricing Format** - Pricing stored as string for flexibility ($500/day, $5000/week, hourly, etc)
4. **Tab Navigation** - Cast and Crew Master in same UI with tab switching
5. **Event-Based Assignments** - CrewAssignments table links crew to specific schedule events (eventId field)

## Next Steps

1. **Display Crew Assignments in Schedule Modal** - Query crewAssignments by eventId and show in attendees section
2. **Add Crew Assignment UI** - Button in schedule modal to assign crew from master
3. **Visual Feedback** - Show crew count/badges on schedule cards
4. **Auto-Suggest Feature** - Use OpenRouter to suggest required crew based on event type
5. **Conflict Detection** - Warn if crew scheduled for overlapping times

## Technologies
- Frontend: React, TypeScript, Tailwind CSS, React Hook Form
- Backend: Express.js, Drizzle ORM, PostgreSQL (Neon)
- AI: OpenRouter for script generation & suggestions
- Auth: Replit Auth
- UI Components: Radix UI primitives
- Dev: Vite, Hot Module Replacement (HMR)

## File Structure
```
client/src/
├── components/
│   ├── crew-management-dialog.tsx (NEW - Crew CRUD UI)
│   ├── schedule-detail-dialog.tsx (Needs: crew assignment display)
│   └── [other components]
├── hooks/
│   ├── use-crew.ts (All crew operations)
│   └── [other hooks]
└── pages/
    └── project-views/
        └── contacts-view.tsx (Cast & Crew tabs)

server/
├── routes.ts (Crew API endpoints)
├── storage.ts (Crew data methods)
└── [other server files]

shared/
└── schema.ts (Crew & CrewAssignment schemas)
```

## Development Notes
- Hot reload working - changes reflect immediately
- No TypeScript errors in new code
- All database migrations applied
- Ready for additional feature development
- Recommend switching to Autonomous Mode for complex features (crew assignment UI, auto-suggest)
