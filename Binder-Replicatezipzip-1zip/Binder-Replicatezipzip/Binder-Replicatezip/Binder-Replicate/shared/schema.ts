import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models so they are included in migrations
export * from "./models/auth";
// Export chat models
export * from "./models/chat";

// === TABLE DEFINITIONS ===

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // Film, TV, Commercial, etc.
  status: text("status").default("development"),
  ownerId: text("owner_id").notNull(), // Links to auth users.id
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  type: text("type").notNull(), // Script, CallSheet, Schedule
  title: text("title").notNull(),
  content: text("content"), // Could be JSON or simple text
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crewMaster = pgTable("crew_master", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(), // Director, Actor, Producer, etc.
  department: text("department"), // Camera, Acting, Production, etc.
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  costAmount: text("cost_amount"), // e.g., "500" or "10000"
  paymentType: text("payment_type"), // "hourly", "daily", "fixed"
  currency: text("currency").default("IDR"), // IDR or USD
  createdAt: timestamp("created_at").defaultNow(),
});

export const cast = pgTable("cast", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  role: text("role").notNull(), // Character name or crew role
  roleType: text("role_type").notNull(), // "character" or "crew"
  crewMasterId: integer("crew_master_id"), // Links to actual talent (optional - can be unassigned)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  category: text("category").notNull(), // Cast, Crew
  email: text("email"),
  phone: text("phone"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: text("type").notNull(), // Shoot, Scout, Meeting
  description: text("description"),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  openrouterToken: text("openrouter_token"), // Optional: user's own OpenRouter API key
  preferredModel: text("preferred_model").default("meta-llama/llama-3.3-70b-instruct"), // Selected OpenRouter model
  currency: text("currency").default("IDR"), // Default currency for budgeting (IDR or USD)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const crew = pgTable("crew", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(), // Director, Cinematographer, etc.
  department: text("department").notNull(), // Camera, Lighting, Sound, etc.
  pricing: text("pricing"), // Daily rate or per-project
  contact: text("contact"), // Email or phone
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crewAssignments = pgTable("crew_assignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  eventId: integer("event_id"), // Which schedule event
  crewId: integer("crew_id").notNull(),
  actualPerson: text("actual_person"), // Real person assigned (can differ from master)
  status: text("status").default("pending"), // pending, confirmed, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Camera, Lighting, Sound, Grip, etc.
  quantity: integer("quantity").default(1),
  rentalCost: text("rentalCost"), // e.g., "$500/day"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const equipmentAssignments = pgTable("equipment_assignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  eventId: integer("event_id").notNull(),
  equipmentId: integer("equipment_id").notNull(),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().unique(),
  totalBudget: text("total_budget").notNull(), // e.g., "500000" for $500k
  currency: text("currency").default("IDR"), // Default currency changed to IDR
  contingency: text("contingency").default("10"), // 10% contingency
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetLineItems = pgTable("budget_line_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  category: text("category").notNull(), // Cast, Crew, Equipment, Locations, VFX, etc.
  description: text("description").notNull(),
  amount: text("amount").notNull(), // Stored as string for precision
  status: text("status").default("estimated"), // estimated, approved, actual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shotList = pgTable("shot_list", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  sceneNumber: text("scene_number").notNull(), // e.g., "1A", "2B"
  description: text("description").notNull(), // Shot description
  shotType: text("shot_type").notNull(), // Wide, Medium, Close-up, etc.
  duration: text("duration"), // e.g., "30 sec"
  location: text("location"), // Where shot takes place
  equipment: text("equipment"), // Equipment needed
  notes: text("notes"),
  priority: text("priority").default("medium"), // high, medium, low
  status: text("status").default("planned"), // planned, shot, approved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  description: text("description"),
  coordinates: text("coordinates"), // JSON: {lat, lng}
  permissions: text("permissions"), // Filming permit status
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const locationGallery = pgTable("location_gallery", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changesSummary: text("changes_summary"),
  editedBy: text("edited_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertCrewMasterSchema = createInsertSchema(crewMaster).omit({ id: true, createdAt: true });
export const insertCastSchema = createInsertSchema(cast).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCrewSchema = createInsertSchema(crew).omit({ id: true, createdAt: true });
export const insertCrewAssignmentSchema = createInsertSchema(crewAssignments).omit({ id: true, createdAt: true });
export const insertEquipmentSchema = createInsertSchema(equipment).omit({ id: true, createdAt: true });
export const insertEquipmentAssignmentSchema = createInsertSchema(equipmentAssignments).omit({ id: true, createdAt: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBudgetLineItemSchema = createInsertSchema(budgetLineItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertShotListSchema = createInsertSchema(shotList).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLocationGallerySchema = createInsertSchema(locationGallery).omit({ id: true, createdAt: true });
export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({ id: true, createdAt: true });

// === TYPES ===

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type CrewMaster = typeof crewMaster.$inferSelect;
export type InsertCrewMaster = z.infer<typeof insertCrewMasterSchema>;

export type Cast = typeof cast.$inferSelect;
export type InsertCast = z.infer<typeof insertCastSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type Crew = typeof crew.$inferSelect;
export type InsertCrew = z.infer<typeof insertCrewSchema>;

export type CrewAssignment = typeof crewAssignments.$inferSelect;
export type InsertCrewAssignment = z.infer<typeof insertCrewAssignmentSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type EquipmentAssignment = typeof equipmentAssignments.$inferSelect;
export type InsertEquipmentAssignment = z.infer<typeof insertEquipmentAssignmentSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type BudgetLineItem = typeof budgetLineItems.$inferSelect;
export type InsertBudgetLineItem = z.infer<typeof insertBudgetLineItemSchema>;

export type ShotList = typeof shotList.$inferSelect;
export type InsertShotList = z.infer<typeof insertShotListSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type LocationGallery = typeof locationGallery.$inferSelect;
export type InsertLocationGallery = z.infer<typeof insertLocationGallerySchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
