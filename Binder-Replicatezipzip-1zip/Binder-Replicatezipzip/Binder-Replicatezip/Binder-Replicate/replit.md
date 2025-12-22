# Binder Production Management Platform

## Overview
A comprehensive full-stack production management application for film, TV, and commercial productions. Built with React frontend, Express backend, PostgreSQL database, and TypeScript throughout.

## Current Status
✅ **FUNCTIONAL** - Core features implemented and working

## Completed Features

### UI/Features Implemented
- ✅ **Budget Tracking Dashboard** - Full budget creation, line item management, contingency calculation
- ✅ **Script/Document Editor** - Full screenplay editor with save functionality
- ✅ **Contacts Management** - Cast and crew contact management with add/delete functionality
- ✅ **Production Schedule** - Event calendar with shoot, scout, and meeting tracking
- ✅ **Crew Management** - Crew master inventory with department organization
- ✅ **Equipment Management** - Equipment inventory system with rental cost tracking
- ✅ **User Settings** - Model selection and API key management for AI features
- ✅ **Authentication** - Replit Auth integration for secure user login

### Backend Implementation
- ✅ Database schema with 14 tables (projects, documents, contacts, events, crew, budget, etc.)
- ✅ Full CRUD APIs for all core entities
- ✅ Budget calculation logic (total, contingency, remaining balance)
- ✅ Document versioning support
- ✅ Event scheduling and crew assignment tracking
- ✅ Equipment assignment system

### Technical Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Query
- **Backend:** Express.js, TypeScript, PostgreSQL (Neon), Drizzle ORM
- **Auth:** Replit Auth integration
- **UI Components:** 40+ pre-built components from shadcn/ui

## Architecture
```
Binder-Replicate/
├── client/               # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── hooks/        # React query hooks for data fetching
│       ├── pages/        # Main views and project detail pages
│       └── lib/          # Utilities, auth, i18n
├── server/               # Express backend
│   ├── routes.ts         # All API endpoints
│   ├── storage.ts        # Database operations
│   ├── auth.ts          # Authentication logic
│   └── replit_integrations/ # AI chat, OpenRouter integration
├── shared/               # Shared types and schemas
│   ├── schema.ts        # Drizzle ORM table definitions
│   └── routes.ts        # API endpoint definitions
└── script/               # Build utilities
```

## Database Tables
- `projects` - Production projects
- `documents` - Scripts, call sheets, schedules
- `contacts` - Cast and crew contacts
- `events` - Scheduled shoots, scouts, meetings
- `crew` - Crew master inventory
- `crewAssignments` - Crew assigned to events
- `equipment` - Equipment inventory
- `equipmentAssignments` - Equipment assigned to events
- `budgets` - Project budget totals
- `budgetLineItems` - Individual budget line items
- `userSettings` - User preferences and API keys
- Plus auth and chat tables

## Remaining Features (Prioritized)
1. **Production Timeline** - Gantt chart visualization
2. **Location Scouting** - Gallery and map integration
3. **Call Sheet Generation** - PDF export from template
4. **Shot List Breakdown** - Visual breakdown editor
5. **Crew Conflict Detection** - Schedule availability checking
6. **Dailies Management** - Footage ingestion and organization
7. **Document Collaboration** - Comments and annotations
8. **Export Functionality** - PDF, calendar sync (iCal)
9. **Notifications System** - Alerts and reminders
10. **Advanced Search** - Cross-project search with filters

## How to Run
```bash
npm install --legacy-peer-deps
npm run db:push                    # Initialize database
npm run dev                        # Start development server
```

Server runs on `http://localhost:5000`

## Development Notes
- All data is persisted to PostgreSQL (Neon backend)
- Session management via express-session with PostgreSQL store
- Real-time chat integration via OpenRouter AI API
- Frontend uses React Query for efficient state management and caching
- TypeScript throughout for type safety

## Recent Fixes (Dec 22, 2025)
- **Fixed "Add Crew to Schedule" Issue**
  - Issue: Crew assignment button in schedule detail dialog did nothing
  - Root Cause: Code was trying to access non-existent properties (`costAmount`, `paymentType`) on Crew type
  - Solution: 
    1. Simplified `calculateCrewCost()` to use the `pricing` field instead
    2. Added missing `projectId` to budget item creation request
    3. Added `setAssigningCrew(false)` to close dialog after successful assignment
  - Status: ✅ FIXED - All TypeScript errors resolved, add crew functionality now working
