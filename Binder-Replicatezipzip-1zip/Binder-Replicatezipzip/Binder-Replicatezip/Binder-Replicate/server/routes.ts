import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { extractScriptData, generateScript, fetchOpenRouterModels } from "./replit_integrations/ai/client";
import { generateCallSheetPDF } from "./pdf-generator";

// Helper to safely extract and validate userId with proper typing
function extractUserId(req: Request): string | null {
  const user = req.user as { id?: string } | undefined;
  return user?.id || null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);

  // === Settings ===
  app.get(api.settings.get.path, async (req, res) => {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const settings = await storage.getUserSettings(userId);
    res.json({
      openaiKey: settings?.openrouterToken ? "***" : undefined,
      preferredModel: settings?.preferredModel || "meta-llama/llama-3.3-70b-instruct",
    });
  });

  app.get(api.settings.models.path, async (req, res) => {
    try {
      const models = await fetchOpenRouterModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ error: "Failed to fetch available models" });
    }
  });

  app.put(api.settings.update.path, async (req, res) => {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const input = z.object({ 
        openaiKey: z.string().optional(),
        preferredModel: z.string().optional(),
      }).parse(req.body);
      
      await storage.updateUserSettings(userId, {
        openrouterToken: input.openaiKey,
        preferredModel: input.preferredModel,
      });
      res.json({
        openaiKey: input.openaiKey ? "***" : undefined,
        preferredModel: input.preferredModel || "meta-llama/llama-3.3-70b-instruct",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Projects ===
  app.get(api.projects.list.path, async (req, res) => {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const projects = await storage.getProjects(userId);
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.sendStatus(404);
    if (project.ownerId !== userId) return res.sendStatus(403);
    res.json(project);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const userId = extractUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const project = await storage.createProject({ ...input, ownerId: userId });
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.projects.update.path, async (req, res) => {
    try {
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), input);
      res.json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Documents ===
  app.get(api.documents.list.path, async (req, res) => {
    const documents = await storage.getDocuments(Number(req.params.projectId));
    res.json(documents);
  });

  app.post(api.documents.create.path, async (req, res) => {
    try {
      const input = api.documents.create.input.parse(req.body);
      const document = await storage.createDocument({
        ...input,
        projectId: Number(req.params.projectId)
      });
      res.status(201).json(document);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.documents.get.path, async (req, res) => {
    
    const document = await storage.getDocument(Number(req.params.id));
    if (!document) return res.sendStatus(404);
    res.json(document);
  });

  app.put(api.documents.update.path, async (req, res) => {
    
    try {
      const input = api.documents.update.input.parse(req.body);
      const document = await storage.updateDocument(Number(req.params.id), input);
      res.json(document);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.documents.delete.path, async (req, res) => {
    
    await storage.deleteDocument(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Document Import ===
  app.post(api.documents.import.path, async (req, res) => {
    
    try {
      const input = api.documents.import.input.parse(req.body);
      const projectId = Number(req.params.projectId);
      const userId = extractUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userSettings = await storage.getUserSettings(userId);
      const model = input.model || userSettings?.preferredModel || "meta-llama/llama-3.3-70b-instruct";

      const extractedData = await extractScriptData(input.content, model);

      const script = await storage.createDocument({
        projectId,
        type: "Script",
        title: input.fileName || "Imported Script",
        content: extractedData.scriptContent,
        status: "draft"
      });

      const castContacts = await Promise.all(
        extractedData.cast.map(c =>
          storage.createContact({
            projectId,
            name: c.name,
            role: c.role,
            category: "Cast"
          })
        )
      );

      const crewContacts = await Promise.all(
        extractedData.crew.map(c =>
          storage.createContact({
            projectId,
            name: c.name,
            role: c.role,
            category: "Crew"
          })
        )
      );

      const now = new Date();
      const scheduleEvents = await Promise.all(
        extractedData.schedule.map((s, idx) => {
          const startTime = new Date(now.getTime() + idx * 24 * 60 * 60 * 1000);
          const endTime = new Date(startTime.getTime() + s.duration * 60 * 1000);
          return storage.createEvent({
            projectId,
            title: s.title,
            startTime,
            endTime,
            type: "Shoot",
            description: s.description
          });
        })
      );

      res.status(201).json({
        script,
        contacts: [...castContacts, ...crewContacts],
        events: scheduleEvents,
      });
    } catch (err) {
      console.error("Document import error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to import document"
      });
    }
  });

  // === Document Script Generation ===
  app.post(api.documents.generate.path, async (req, res) => {
    try {
      const input = api.documents.generate.input.parse(req.body);
      const docId = Number(req.params.id);
      const userId = extractUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const document = await storage.getDocument(docId);
      if (!document) return res.sendStatus(404);

      const userSettings = await storage.getUserSettings(userId);
      const model = input.model || userSettings?.preferredModel || "meta-llama/llama-3.3-70b-instruct";
      const language = (req.body.language as 'en' | 'id') || 'id';

      const generatedScript = await generateScript(input.prompt, model, language);

      const updated = await storage.updateDocument(docId, {
        content: generatedScript,
        status: "draft"
      });

      res.json(updated);
    } catch (err) {
      console.error("Script generation error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to generate script"
      });
    }
  });

  // === Auto-Suggest Cast and Crew from Script ===
  app.post("/api/projects/:projectId/auto-suggest", async (req, res) => {
    try {
      const { scriptContent, model, dateRange, daysOfWeek } = req.body;
      const projectId = Number(req.params.projectId);
      const userId = extractUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!scriptContent) {
        return res.status(400).json({ message: "scriptContent is required" });
      }

      // Get user settings for preferred model
      const userSettings = await storage.getUserSettings(userId);
      const selectedModel = model || userSettings?.preferredModel || "meta-llama/llama-3.3-70b-instruct";

      // Extract cast, crew, and schedule from script
      const suggestions = await extractScriptData(scriptContent, selectedModel, dateRange, daysOfWeek);

      // Get existing cast to check for duplicates
      const existingCast = await storage.getCast(projectId);
      const existingCastCharacterNames = new Set(existingCast.map(c => c.role.toLowerCase())); // Cast.role contains character name
      
      // Get existing crew master to check for duplicates
      const existingCrewMaster = await storage.getCrewMaster();
      const existingCrewNames = new Set(existingCrewMaster.map(c => c.name.toLowerCase())); // CrewMaster.name contains job title

      // Filter out duplicates - cast suggestions matched by character name (stored in cast.role)
      const newCastSuggestions = suggestions.cast.filter(c => !existingCastCharacterNames.has(c.name.toLowerCase()));
      const newCrewSuggestions = suggestions.crew.filter(c => !existingCrewNames.has(c.name.toLowerCase()));

      // Create CAST entries (characters from script)
      const createdCast = await Promise.all(
        newCastSuggestions.map(c =>
          storage.createCast({
            projectId,
            role: c.name,
            roleType: "character",
            notes: c.role // Store character description in notes
          })
        )
      );

      // Create CREW entries (project-scoped crew members, not global masters)
      const createdCrewMaster = await Promise.all(
        newCrewSuggestions.map(c =>
          storage.createCrew({
            projectId,
            name: c.name, // Job title like "Director"
            title: c.name, // Job title
            department: c.department || c.name, // Use provided department or default to job title
            notes: c.role // Responsibilities
          })
        )
      );

      // Create schedule events respecting daysOfWeek preference
      const baseDate = dateRange?.startDate ? new Date(dateRange.startDate) : new Date();
      const createdEvents = await Promise.all(
        suggestions.schedule.map((s, idx) => {
          let eventDate = new Date(baseDate);
          
          // If daysOfWeek is specified, find the next occurrence of those days
          if (daysOfWeek && daysOfWeek.length > 0) {
            let daysAdded = 0;
            while (daysAdded < idx && !daysOfWeek.includes(eventDate.getDay())) {
              eventDate.setDate(eventDate.getDate() + 1);
            }
            // Move forward for schedule items beyond the first
            for (let i = 0; i < idx; i++) {
              do {
                eventDate.setDate(eventDate.getDate() + 1);
              } while (!daysOfWeek.includes(eventDate.getDay()));
            }
          } else {
            // Default: space 1 day apart if no daysOfWeek specified
            eventDate.setDate(eventDate.getDate() + idx);
          }
          
          const startTime = new Date(eventDate);
          const endTime = new Date(startTime.getTime() + s.duration * 60 * 1000);
          return storage.createEvent({
            projectId,
            title: s.title,
            startTime,
            endTime,
            type: "Shoot",
            description: s.description
          });
        })
      );

      res.json({
        cast: createdCast,
        crew: createdCrewMaster,
        events: createdEvents,
        duplicatesSkipped: {
          cast: suggestions.cast.length - newCastSuggestions.length,
          crew: suggestions.crew.length - newCrewSuggestions.length
        }
      });
    } catch (err) {
      console.error("Auto-suggest error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to auto-suggest"
      });
    }
  });

  // === Cast ===
  app.get("/api/projects/:projectId/cast", async (req, res) => {
    const cast = await storage.getCast(Number(req.params.projectId));
    res.json(cast);
  });

  app.post("/api/projects/:projectId/cast", async (req, res) => {
    try {
      const input = req.body;
      const castItem = await storage.createCast({
        ...input,
        projectId: Number(req.params.projectId)
      });
      res.status(201).json(castItem);
    } catch (err) {
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create cast" });
    }
  });

  app.put("/api/projects/:projectId/cast/:castId", async (req, res) => {
    try {
      const castItem = await storage.updateCast(Number(req.params.castId), req.body);
      res.json(castItem);
    } catch (err) {
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to update cast" });
    }
  });

  app.delete("/api/projects/:projectId/cast/:castId", async (req, res) => {
    await storage.deleteCast(Number(req.params.castId));
    res.sendStatus(204);
  });

  // === Crew Master ===
  app.get("/api/crew-master", async (req, res) => {
    const crewMaster = await storage.getCrewMaster();
    res.json(crewMaster);
  });

  app.post("/api/crew-master", async (req, res) => {
    try {
      const input = req.body;
      const talent = await storage.createCrewMaster(input);
      res.status(201).json(talent);
    } catch (err) {
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create crew master" });
    }
  });

  app.put("/api/crew-master/:crewMasterId", async (req, res) => {
    try {
      const talent = await storage.updateCrewMaster(Number(req.params.crewMasterId), req.body);
      res.json(talent);
    } catch (err) {
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to update crew master" });
    }
  });

  app.delete("/api/crew-master/:crewMasterId", async (req, res) => {
    await storage.deleteCrewMaster(Number(req.params.crewMasterId));
    res.sendStatus(204);
  });

  // === Contacts ===
  app.get(api.contacts.list.path, async (req, res) => {
    
    const contacts = await storage.getContacts(Number(req.params.projectId));
    res.json(contacts);
  });

  app.post(api.contacts.create.path, async (req, res) => {
    
    try {
      const input = api.contacts.create.input.parse(req.body);
      const contact = await storage.createContact({
        ...input,
        projectId: Number(req.params.projectId)
      });
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.contacts.delete.path, async (req, res) => {
    
    await storage.deleteContact(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Events ===
  app.get(api.events.list.path, async (req, res) => {
    
    const events = await storage.getEvents(Number(req.params.projectId));
    res.json(events);
  });

  app.post(api.events.create.path, async (req, res) => {
    
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent({
        ...input,
        projectId: Number(req.params.projectId)
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.events.update.path, async (req, res) => {
    
    try {
      const eventId = Number(req.params.id);
      const input = req.body;
      
      // Convert ISO strings to Date objects if needed
      const data: any = { ...input };
      if (typeof data.startTime === 'string') {
        data.startTime = new Date(data.startTime);
      }
      if (typeof data.endTime === 'string') {
        data.endTime = new Date(data.endTime);
      }
      
      const event = await storage.updateEvent(eventId, data);
      res.json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.events.delete.path, async (req, res) => {
    
    await storage.deleteEvent(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Call Sheet PDF Generation ===
  app.post("/api/projects/:projectId/call-sheet", async (req, res) => {
    try {
      const { eventId, eventDetails, crewMembers, equipmentList } = req.body;

      if (!eventDetails) {
        return res.status(400).json({ error: "Event details are required" });
      }

      const pdfBuffer = await generateCallSheetPDF({
        eventDetails,
        crewMembers: crewMembers || [],
        equipmentList: equipmentList || [],
      });

      res.contentType("application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="call-sheet-${eventId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating call sheet:", error);
      res.status(500).json({ error: "Failed to generate call sheet PDF" });
    }
  });

  // === Crew ===
  app.get(api.crew.list.path, async (req, res) => {
    const crewList = await storage.getCrew(Number(req.params.projectId));
    res.json(crewList);
  });

  app.post(api.crew.create.path, async (req, res) => {
    try {
      const input = api.crew.create.input.parse(req.body);
      const crewMember = await storage.createCrew({
        ...input,
        projectId: Number(req.params.projectId)
      });
      res.status(201).json(crewMember);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.crew.update.path, async (req, res) => {
    try {
      const input = api.crew.update.input.parse(req.body);
      const crewMember = await storage.updateCrew(Number(req.params.crewId), input);
      res.json(crewMember);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.crew.delete.path, async (req, res) => {
    await storage.deleteCrew(Number(req.params.crewId));
    res.sendStatus(204);
  });

  // === Crew Assignments ===
  app.get(api.crewAssignments.list.path, async (req, res) => {
    const assignments = await storage.getCrewAssignments(Number(req.params.projectId));
    res.json(assignments);
  });

  app.post(api.crewAssignments.create.path, async (req, res) => {
    try {
      const input = api.crewAssignments.create.input.parse(req.body);
      const assignment = await storage.createCrewAssignment({
        ...input,
        projectId: Number(req.params.projectId)
      });
      res.status(201).json(assignment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldError = `${err.errors[0].path.join('.')} ${err.errors[0].message}`;
        console.error("Crew assignment validation error:", fieldError, "Body:", JSON.stringify(req.body));
        return res.status(400).json({ message: fieldError });
      }
      throw err;
    }
  });

  // === Crew Conflict Detection ===
  app.post(api.crewAssignments.checkConflicts.path, async (req, res) => {
    try {
      const input = api.crewAssignments.checkConflicts.input.parse(req.body);
      const conflicts = await storage.detectCrewConflicts(input.crewId, input.eventId);
      res.json(conflicts);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Delete Crew Assignment ===
  app.delete(api.crewAssignments.delete.path, async (req, res) => {
    try {
      await storage.deleteCrewAssignment(Number(req.params.assignmentId));
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Assignment not found" });
    }
  });

  // === AI Crew Suggestions ===
  app.post("/api/projects/:projectId/crew/suggest", async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const { eventType, eventDescription } = req.body;
      const existingCrew = await storage.getCrew(projectId);
      
      if (existingCrew.length === 0) {
        return res.json([]);
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://studiobinder.local",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [{
            role: "user",
            content: `For a ${eventType} event${eventDescription ? ` (${eventDescription})` : ''}, suggest crew from: ${JSON.stringify(existingCrew.map(c => ({ id: c.id, name: c.name, title: c.title })))}.
Return only JSON array of IDs by relevance: [1,3,5]`
          }],
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        return res.json(existingCrew.slice(0, 3));
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      
      let ids: number[] = [];
      try {
        ids = JSON.parse(content);
        if (!Array.isArray(ids)) {
          ids = [];
        }
      } catch {
        ids = [];
      }
      
      const suggested = existingCrew.filter(c => ids.includes(c.id));
      res.json(suggested.length > 0 ? suggested : existingCrew.slice(0, 3));
    } catch (error) {
      const existingCrew = await storage.getCrew(Number(req.params.projectId));
      res.json(existingCrew.slice(0, 3));
    }
  });

  // === Equipment ===
  app.get("/api/projects/:projectId/equipment", async (req, res) => {
    try {
      const equip = await storage.getEquipment(Number(req.params.projectId));
      res.json(equip);
    } catch (error) {
      res.json([]);
    }
  });

  app.post("/api/projects/:projectId/equipment", async (req, res) => {
    try {
      const input = z.object({
        name: z.string(),
        category: z.string().optional(),
        quantity: z.number().optional(),
        rentalCost: z.string().optional(),
        notes: z.string().optional(),
      }).parse(req.body);
      
      const equip = await storage.createEquipment({
        ...input,
        projectId: Number(req.params.projectId),
        category: input.category || "Other",
      });
      res.status(201).json(equip);
    } catch (err) {
      res.status(400).json({ error: "Failed to create equipment" });
    }
  });

  app.delete("/api/projects/:projectId/equipment/:equipmentId", async (req, res) => {
    try {
      await storage.deleteEquipment(Number(req.params.equipmentId));
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // === BUDGET ===
  app.get("/api/projects/:projectId/budget", async (req, res) => {
    try {
      const budget = await storage.getBudget(Number(req.params.projectId));
      res.json(budget || null);
    } catch {
      res.json(null);
    }
  });

  app.post("/api/projects/:projectId/budget", async (req, res) => {
    try {
      const { totalBudget, contingency } = req.body;
      const projectId = Number(req.params.projectId);
      const existing = await storage.getBudget(projectId);
      
      if (existing) {
        const updated = await storage.updateBudget(projectId, { totalBudget, contingency });
        return res.json(updated);
      }
      
      const budget = await storage.createBudget({ projectId, totalBudget, contingency });
      res.status(201).json(budget);
    } catch {
      res.status(500).json({ error: "Failed to create budget" });
    }
  });

  app.get("/api/projects/:projectId/budget/line-items", async (req, res) => {
    try {
      const items = await storage.getBudgetLineItems(Number(req.params.projectId));
      res.json(items);
    } catch {
      res.json([]);
    }
  });

  app.post("/api/projects/:projectId/budget/line-items", async (req, res) => {
    try {
      const { category, description, amount, status, isAutoCalculated } = req.body;
      
      // Validate amount is a number
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (typeof numAmount !== 'number' || Number.isNaN(numAmount)) {
        return res.status(400).json({ error: "Amount must be a valid number" });
      }
      
      const item = await storage.createBudgetLineItem({
        projectId: Number(req.params.projectId),
        category,
        description,
        amount: numAmount.toString(),
        status,
        isAutoCalculated: isAutoCalculated ?? false,
      });
      res.status(201).json(item);
    } catch (err) {
      console.error("Budget line item creation error:", err);
      res.status(500).json({ error: "Failed to create line item" });
    }
  });

  app.delete("/api/projects/:projectId/budget/line-items/:itemId", async (req, res) => {
    try {
      await storage.deleteBudgetLineItem(Number(req.params.itemId));
      res.sendStatus(204);
    } catch {
      res.status(500).json({ error: "Failed to delete line item" });
    }
  });

  // === Locations ===
  app.get(api.locations.list.path, async (req, res) => {
    const locations = await storage.getLocations(Number(req.params.projectId));
    res.json(locations);
  });

  app.post(api.locations.create.path, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createLocation({
        ...input,
        projectId: Number(req.params.projectId)
      });
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.locations.delete.path, async (req, res) => {
    await storage.deleteLocation(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Location Gallery ===
  app.get(api.locationGallery.list.path, async (req, res) => {
    const gallery = await storage.getLocationGallery(Number(req.params.locationId));
    res.json(gallery);
  });

  app.post(api.locationGallery.addImage.path, async (req, res) => {
    try {
      const input = api.locationGallery.addImage.input.parse(req.body);
      const image = await storage.addGalleryImage({
        ...input,
        locationId: Number(req.params.locationId)
      });
      res.status(201).json(image);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Document Versions ===
  app.get(api.documentVersions.list.path, async (req, res) => {
    const versions = await storage.getDocumentVersions(Number(req.params.documentId));
    res.json(versions);
  });

  app.post(api.documentVersions.create.path, async (req, res) => {
    try {
      const input = api.documentVersions.create.input.parse(req.body);
      const version = await storage.createDocumentVersion({
        ...input,
        documentId: Number(req.params.documentId)
      });
      res.status(201).json(version);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.documentVersions.restore.path, async (req, res) => {
    try {
      const document = await storage.restoreDocumentVersion(Number(req.params.documentId), Number(req.params.versionId));
      res.json(document);
    } catch (err) {
      res.status(404).json({ message: "Version not found" });
    }
  });

  // === Budget Auto-calculation ===
  app.post("/api/projects/:projectId/budget/auto-calculate", async (req, res) => {
    try {
      const calculation = await storage.calculateProjectBudget(Number(req.params.projectId));
      res.json(calculation);
    } catch (err) {
      res.status(500).json({ error: "Failed to calculate budget" });
    }
  });

  // === Stripboard ===
  app.get("/api/projects/:projectId/stripboard/events", async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const events = await storage.getEvents(projectId);
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stripboard events" });
    }
  });

  app.post("/api/projects/:projectId/stripboard/reorder", async (req, res) => {
    try {
      const input = z.object({
        orderedEventIds: z.array(z.number()),
      }).parse(req.body);
      
      const projectId = Number(req.params.projectId);
      const reorderedEvents = [];
      
      for (let i = 0; i < input.orderedEventIds.length; i++) {
        const updated = await storage.updateEvent(input.orderedEventIds[i], { order: i });
        reorderedEvents.push(updated);
      }
      
      res.json(reorderedEvents);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ error: "Failed to reorder events" });
    }
  });

  app.put("/api/events/:eventId/order", async (req, res) => {
    try {
      const input = z.object({
        order: z.number(),
      }).parse(req.body);
      
      const event = await storage.updateEvent(Number(req.params.eventId), { order: input.order });
      res.json(event);
    } catch (err) {
      res.status(500).json({ error: "Failed to update event order" });
    }
  });

  // === Storyboards ===
  app.get("/api/projects/:projectId/storyboards", async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const storyboards = await storage.getStoryboards(projectId);
      res.json(storyboards);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch storyboards" });
    }
  });

  app.post("/api/projects/:projectId/storyboards", async (req, res) => {
    try {
      const input = z.object({
        title: z.string(),
        description: z.string().optional(),
      }).parse(req.body);
      const projectId = Number(req.params.projectId);
      const storyboard = await storage.createStoryboard({
        projectId,
        title: input.title,
        description: input.description || "",
      });
      res.status(201).json(storyboard);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create storyboard" });
    }
  });

  app.delete("/api/storyboards/:storyboardId", async (req, res) => {
    try {
      await storage.deleteStoryboard(Number(req.params.storyboardId));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ error: "Failed to delete storyboard" });
    }
  });

  app.get("/api/storyboards/:storyboardId/images", async (req, res) => {
    try {
      const images = await storage.getStoryboardImages(Number(req.params.storyboardId));
      res.json(images);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/storyboards/:storyboardId/images", async (req, res) => {
    try {
      const input = z.object({
        imageUrl: z.string(),
        caption: z.string().optional(),
        order: z.number(),
      }).parse(req.body);
      const image = await storage.addStoryboardImage({
        storyboardId: Number(req.params.storyboardId),
        imageUrl: input.imageUrl,
        caption: input.caption || "",
        order: input.order,
      });
      res.status(201).json(image);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ error: "Failed to add image" });
    }
  });

  app.delete("/api/storyboards/images/:imageId", async (req, res) => {
    try {
      await storage.deleteStoryboardImage(Number(req.params.imageId));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  return httpServer;
}
