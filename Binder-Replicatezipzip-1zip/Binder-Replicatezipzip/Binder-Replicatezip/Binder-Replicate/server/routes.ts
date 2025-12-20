import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { extractScriptData, generateScript, fetchOpenRouterModels } from "./replit_integrations/ai/client";

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
    const userId = (req.user as any)?.id || "user_1";
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
    const userId = (req.user as any)?.id || "user_1";
    try {
      const input = z.object({ 
        openaiKey: z.string().optional(),
        preferredModel: z.string().optional(),
      }).parse(req.body);
      
      if (input.openaiKey) {
        process.env.OPENROUTER_API_KEY = input.openaiKey;
      }
      
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
    const userId = (req.user as any)?.id || "user_1";
    const projects = await storage.getProjects(userId);
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.sendStatus(404);
    res.json(project);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const userId = (req.user as any)?.id || "user_1";
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
      const userId = (req.user as any).claims.sub;

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
      const userId = (req.user as any)?.id || "user_1";

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

  // === Auto-Suggest Cast Only from Script ===
  app.post("/api/projects/:projectId/auto-suggest", async (req, res) => {
    try {
      const { scriptContent, model } = req.body;
      const projectId = Number(req.params.projectId);
      const userId = (req.user as any)?.id || "user_1";

      if (!scriptContent) {
        return res.status(400).json({ message: "scriptContent is required" });
      }

      // Get user settings for preferred model
      const userSettings = await storage.getUserSettings(userId);
      const selectedModel = model || userSettings?.preferredModel || "meta-llama/llama-3.3-70b-instruct";

      // Extract cast, crew, and schedule from script
      const suggestions = await extractScriptData(scriptContent, selectedModel);

      // Get existing contacts to check for duplicates
      const existingContacts = await storage.getContacts(projectId);
      const existingNames = new Set(existingContacts.map(c => c.name.toLowerCase()));

      // Filter out duplicates - CAST ONLY
      const newCast = suggestions.cast.filter(c => !existingNames.has(c.name.toLowerCase()));

      // Create CAST contacts only (no crew)
      const createdCast = await Promise.all(
        newCast.map(c =>
          storage.createContact({
            projectId,
            name: c.name,
            role: c.role,
            category: "Cast"
          })
        )
      );

      // Create schedule events
      const now = new Date();
      const createdEvents = await Promise.all(
        suggestions.schedule.map((s, idx) => {
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

      res.json({
        cast: createdCast,
        crew: [],
        events: createdEvents,
        duplicatesSkipped: {
          cast: suggestions.cast.length - newCast.length,
          crew: 0
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

  app.delete(api.events.delete.path, async (req, res) => {
    
    await storage.deleteEvent(Number(req.params.id));
    res.sendStatus(204);
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
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
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
      const ids = JSON.parse(content);
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
      const { category, description, amount, status } = req.body;
      const item = await storage.createBudgetLineItem({
        projectId: Number(req.params.projectId),
        category,
        description,
        amount,
        status,
      });
      res.status(201).json(item);
    } catch {
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

  return httpServer;
}
