# StudioBinder - Film & TV Production Management

## Overview
A complete clone of StudioBinder - a professional production management software for film, TV, and video professionals. Built with TypeScript, React, Express, and PostgreSQL. **Fully portable - runs anywhere without Replit dependencies.**

## Current Status ✅
**All Core Features Complete**
- Projects, Scripts, Cast & Crew Contacts, Production Schedules
- AI-powered script generation & auto-suggest features
- Settings with OpenRouter API integration
- Mock authentication (works anywhere)

## Architecture

### Stack
- **Frontend:** React + Vite + TailwindCSS (localhost/5000)
- **Backend:** Express.js (Node.js)
- **Database:** PostgreSQL (Neon)
- **AI:** OpenRouter (supports 20+ models including Llama, Claude, GPT-4)

### Key Files
```
Binder-Replicate/
├── client/src/
│   ├── pages/
│   │   ├── dashboard.tsx        # Project list
│   │   ├── project-details.tsx  # Tabs: Script, Schedule, Contacts
│   │   ├── settings.tsx         # API key & model config
│   │   ├── login.tsx            # Mock auth
│   │   └── project-views/
│   │       ├── script-view.tsx  # Script editor + Generate/Auto-Suggest
│   │       ├── schedule-view.tsx # Production timeline
│   │       └── contacts-view.tsx # Cast & crew table
│   ├── hooks/
│   │   ├── use-projects.ts
│   │   ├── use-documents.ts
│   │   ├── use-contacts.ts
│   │   ├── use-events.ts
│   │   ├── use-settings.ts
│   │   ├── use-script-generation.ts  # NEW: Generate & Auto-Suggest
│   │   └── use-auth.ts
│   └── components/
│       ├── script-generator.tsx  # NEW: Prompt-based script generation
│       ├── auto-suggest-dialog.tsx # NEW: Auto-suggest from script
│       └── layout-shell.tsx       # Navigation & layout
├── server/
│   ├── routes.ts               # 25+ API endpoints
│   ├── storage.ts              # Database operations
│   ├── auth.ts                 # Mock user auth
│   └── replit_integrations/ai/
│       └── client.ts           # OpenRouter API client
└── shared/
    ├── schema.ts               # Zod + Drizzle schema
    └── routes.ts               # API contracts
```

## Features

### 1. Projects Management ✅
- Create, update, delete projects
- Track project type, status, dates
- 2+ sample projects included

### 2. Script Editor ✅
- **Full-text editing** with Courier Prime font
- **Generate by Prompt:** Use AI to write scripts from descriptions
- **Auto-Suggest:** Extract cast, crew, and schedule from script content
- **Auto-deduplication:** Checks database to avoid duplicate contacts
- Save/draft functionality

### 3. Cast & Crew ✅
- Table view with search filtering
- Add/remove contacts manually
- Categories: Cast, Crew, etc.
- Auto-populated from script analysis

### 4. Production Schedule ✅
- Calendar-style event view
- Create shoot days, meetings, scouts
- Time and location tracking

### 5. Settings ✅
- **API Key Configuration:** Add your OpenRouter API key
- **Model Selection:** Dynamically loads 100+ models from OpenRouter, sorted by cheapest first
- Keys encrypted and never logged

### 6. AI Features ✅
- **Script Generation:** `POST /api/documents/:id/generate` - Create scripts from prompts
- **Document Extraction:** `POST /api/projects/:projectId/documents/import` - Parse scripts for cast/crew/schedule
- **Auto-Suggest:** `POST /api/projects/:projectId/auto-suggest` - Analyze existing scripts
- **Smart Deduplication:** Prevents adding duplicate cast/crew members

## API Integration

### OpenRouter Setup ✨ DYNAMIC MODEL LOADING
The app uses **OpenRouter** for AI (supports 100+ models):

1. Get free API key from https://openrouter.ai/keys
2. Go to Settings page → enter key → models load automatically
3. Models sorted by cheapest/free first (real-time pricing)
4. Examples of available models:
   - Llama 3.3 70B (free with credits)
   - DeepSeek V3 (free with credits)
   - Claude 3.5 Sonnet
   - GPT-4o, GPT-4 Turbo
   - And 100+ more...

### Environment Variables
```bash
OPENROUTER_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@host/db
```

## Routes (25 endpoints)

### Projects
- `GET /api/projects` - List all
- `POST /api/projects` - Create
- `GET /api/projects/:id` - Get one
- `PUT /api/projects/:id` - Update
- `DELETE /api/projects/:id` - Delete

### Documents (Scripts)
- `GET /api/projects/:projectId/documents` - List
- `POST /api/projects/:projectId/documents` - Create
- `PUT /api/documents/:id` - Update
- `DELETE /api/documents/:id` - Delete
- **`POST /api/documents/:id/generate`** - Generate from prompt ✨
- **`POST /api/projects/:projectId/documents/import`** - Import & extract ✨

### Contacts
- `GET /api/projects/:projectId/contacts` - List
- `POST /api/projects/:projectId/contacts` - Create
- `DELETE /api/contacts/:id` - Delete

### Events (Schedule)
- `GET /api/projects/:projectId/events` - List
- `POST /api/projects/:projectId/events` - Create
- `DELETE /api/events/:id` - Delete

### AI Auto-Suggest
- **`POST /api/projects/:projectId/auto-suggest`** ✨
  - Analyzes script content
  - Suggests cast, crew, schedule
  - Deduplicates existing contacts
  - Returns `{ cast, crew, events, duplicatesSkipped }`

### Settings
- `GET /api/settings` - Get user preferences
- `PUT /api/settings` - Update API key & model
- `GET /api/settings/models` - List available models

## Development

### Install & Run
```bash
cd Binder-Replicate
npm install
npm run dev
```

Runs on http://localhost:5000

### Database
```bash
npm run db:push    # Sync schema
npm run db:studio  # GUI
```

## Deployment

App is **fully portable**. To deploy:

1. Set environment variables:
   ```
   OPENROUTER_API_KEY=your_key
   DATABASE_URL=postgresql://...
   ```
2. Build: `npm run build`
3. Start: `npm start`

Works on any Node.js host (Heroku, Render, Railway, Docker, etc.)

## Authentication
Uses **mock user system** (no real auth). Works without external auth providers.
- Auto-logs in as `user@studiobinder.local`
- Safe for demo/testing
- Can be swapped for real auth (Auth0, etc.) by modifying `server/auth.ts`

## Recent Changes (Dec 20, 2025)

### NEW: Language Support & Cast-Only Auto-Suggest
- 🌍 **Language Selection** - Choose English or Indonesian (default) for script generation
- 📝 **i18n System** - Full translation system created (`client/src/lib/i18n.ts`)
- 🎭 **Cast-Only Auto-Suggest** - Only extracts and suggests cast members, no crew
- 🧠 **Smart OpenRouter Integration** - Language parameter sent to OpenRouter prompts

### Latest Features
- ✨ **Script Generation by Prompt** - Generate full scripts with language selection
- ✨ **Auto-Suggest from Script** - Extract CAST ONLY with smart deduplication
- ✨ **Smart Deduplication** - Database checks prevent duplicate contacts
- ✨ **OpenRouter Integration** - Full support for 100+ AI models
- ✨ **Dynamic Model Loading** - Models fetch real-time from OpenRouter API, sorted by cost
- ✨ **Settings Page** - Configure OpenRouter API key and auto-select cheapest available models

### Technical Details
- `client/src/lib/i18n.ts` - Translation strings (English & Indonesian) for all UI
- `client/src/hooks/use-language.tsx` - Language context provider (React context API)
- `useLanguage()` hook - Access current language throughout app
- `t(key, language)` - Translation function for any text
- `ScriptGenerator.tsx` - Language dropdown added (English/Indonesian, default: Indonesian)
- `extractScriptData()` - AI prompt explicitly requests CAST ONLY (crew always empty)
- `POST /api/documents/:id/generate` - Accepts `language` parameter from frontend
- `POST /api/projects/:projectId/auto-suggest` - Returns `crew: []` (always empty)
- Environment variable: `OPENROUTER_API_KEY` (required for AI features)

## Known Limitations
- Chat UI page not yet implemented (backend routes ready)
- No persistence of generated images or assets
- Uses mock auth (suitable for demo/testing)

## Next Steps (Optional)
- [ ] Add chat/conversation UI page
- [ ] Implement real user authentication
- [ ] Add document upload/parsing
- [ ] Budget tracking
- [ ] Team collaboration features
- [ ] Email notifications

## User Preferences
- Fully portable app (no Replit dependencies)
- Uses standard OpenRouter API instead of Replit integrations
- Simple mock auth for ease of deployment
- Focus on core production management features
