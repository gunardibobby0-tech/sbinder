# Quick Start Guide for StudioBinder

## 🚀 Getting Started in 5 Minutes

### 1. Install & Setup
```bash
cd Binder-Replicate
npm install
npm run db:push
npm run dev
```

Visit: `http://localhost:5000`

### 2. Create Your First Project
1. Click "New Project"
2. Enter project details (title, type: Film/TV/Commercial)
3. Start building your production

### 3. Key Features to Try

#### Budget Management
- Go to Budget tab
- Set total budget
- Add line items (Cast, Crew, Equipment, etc)
- Watch it auto-calculate remaining balance

#### Schedule Production
- Go to Schedule tab
- Create events (Shoot, Scout, Meeting)
- Assign crew to events
- System prevents double-booking crew

#### Generate Scripts
- Go to Scripts tab
- Click "Generate by Prompt"
- Select a template (Action, Drama, Comedy, Documentary)
- AI generates your script
- Use "Auto-Suggest" to extract cast/crew/schedule

#### Scout Locations
- Go to Locations tab
- Add location with address & coordinates
- Upload gallery photos
- Add permission status and notes

#### Manage Crew
- Go to Crew tab
- Add crew with title, department, pricing
- Assign to events
- System checks for conflicts automatically

---

## 🔗 Key API Endpoints

### Budget
```
GET /api/projects/:id/budget
POST /api/projects/:id/budget/auto-calculate
```

### Schedule
```
GET /api/projects/:id/events
POST /api/projects/:id/crew-assignments/check-conflicts
```

### Documents
```
POST /api/documents/:id/generate (AI script generation)
POST /api/projects/:id/auto-suggest (Extract cast/crew/schedule)
```

---

## 📚 Architecture at a Glance

```
Frontend (React) → Express Server → PostgreSQL
     Vite             TypeScript       Neon
    Tailwind          OpenRouter
   shadcn/ui           Drizzle ORM
```

---

## 🛠️ Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:push      # Sync database schema
npm run check        # TypeScript type check
```

---

## 📖 Documentation

Full developer handout: See `DEVELOPER_HANDOUT.md`

---

## 💡 Pro Tips

1. **Auto-Calculate Budget:** Assign crew & equipment, then click "Auto-Calculate from Crew & Equipment"
2. **Prevent Conflicts:** System automatically warns if crew assigned to overlapping events
3. **AI Generation:** Use templates as starting points for script generation
4. **Version Control:** All documents auto-save with version history
5. **Location Photos:** Upload multiple photos per location for scouting reference

---

## ❓ Troubleshooting

**Database won't connect?**
```bash
npm run db:push --force
```

**Dependencies missing?**
```bash
npm install --legacy-peer-deps
```

**Port 5000 in use?**
Change port in `vite.config.ts` or kill process on port 5000

---

**Ready to build your production? Start with a new project! 🎬**
