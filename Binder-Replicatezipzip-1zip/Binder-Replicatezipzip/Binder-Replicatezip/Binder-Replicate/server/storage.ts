import { 
  users, projects, documents, contacts, events, userSettings, crew, crewAssignments, equipment, equipmentAssignments, budgets, budgetLineItems, shotList,
  type User,
  type Project, type InsertProject,
  type Document, type InsertDocument,
  type Contact, type InsertContact,
  type Event, type InsertEvent,
  type UserSettings, type InsertUserSettings,
  type Crew, type InsertCrew,
  type CrewAssignment, type InsertCrewAssignment,
  type Equipment, type InsertEquipment,
  type EquipmentAssignment, type InsertEquipmentAssignment,
  type Budget, type InsertBudget,
  type BudgetLineItem, type InsertBudgetLineItem,
  type ShotList, type InsertShotList
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Documents
  getDocuments(projectId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Contacts
  getContacts(projectId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Events
  getEvents(projectId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;

  // Crew
  getCrew(projectId: number): Promise<Crew[]>;
  createCrew(crew: InsertCrew): Promise<Crew>;
  updateCrew(id: number, updates: Partial<InsertCrew>): Promise<Crew>;
  deleteCrew(id: number): Promise<void>;

  // Crew Assignments
  getCrewAssignments(projectId: number): Promise<CrewAssignment[]>;
  getCrewAssignmentsByEvent(eventId: number): Promise<CrewAssignment[]>;
  createCrewAssignment(assignment: InsertCrewAssignment): Promise<CrewAssignment>;
  updateCrewAssignment(id: number, updates: Partial<InsertCrewAssignment>): Promise<CrewAssignment>;
  deleteCrewAssignment(id: number): Promise<void>;

  // Equipment
  getEquipment(projectId: number): Promise<Equipment[]>;
  createEquipment(equip: InsertEquipment): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;

  // Equipment Assignments
  getEquipmentAssignments(projectId: number): Promise<EquipmentAssignment[]>;
  createEquipmentAssignment(assignment: InsertEquipmentAssignment): Promise<EquipmentAssignment>;
  deleteEquipmentAssignment(id: number): Promise<void>;

  // Budget
  getBudget(projectId: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(projectId: number, updates: Partial<InsertBudget>): Promise<Budget>;

  // Budget Line Items
  getBudgetLineItems(projectId: number): Promise<BudgetLineItem[]>;
  createBudgetLineItem(item: InsertBudgetLineItem): Promise<BudgetLineItem>;
  updateBudgetLineItem(id: number, updates: Partial<InsertBudgetLineItem>): Promise<BudgetLineItem>;
  deleteBudgetLineItem(id: number): Promise<void>;

  // Shot List
  getShotList(projectId: number): Promise<ShotList[]>;
  createShotListItem(item: InsertShotList): Promise<ShotList>;
  updateShotListItem(id: number, updates: Partial<InsertShotList>): Promise<ShotList>;
  deleteShotListItem(id: number): Promise<void>;

  // Crew Conflict Detection
  detectCrewConflicts(crewId: number, eventId: number): Promise<{ hasConflict: boolean; conflicts: Array<{ eventId: number; eventTitle: string; startTime: Date; endTime: Date }> }>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.ownerId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Documents
  async getDocuments(projectId: number): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.projectId, projectId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db.update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Contacts
  async getContacts(projectId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.projectId, projectId));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Events
  async getEvents(projectId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.projectId, projectId));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [updated] = await db.update(userSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userSettings)
        .values({ userId, ...settings })
        .returning();
      return created;
    }
  }

  // Crew
  async getCrew(projectId: number): Promise<Crew[]> {
    return await db.select().from(crew).where(eq(crew.projectId, projectId));
  }

  async createCrew(crewData: InsertCrew): Promise<Crew> {
    const [newCrew] = await db.insert(crew).values(crewData).returning();
    return newCrew;
  }

  async updateCrew(id: number, updates: Partial<InsertCrew>): Promise<Crew> {
    const [updatedCrew] = await db.update(crew)
      .set(updates)
      .where(eq(crew.id, id))
      .returning();
    return updatedCrew;
  }

  async deleteCrew(id: number): Promise<void> {
    await db.delete(crew).where(eq(crew.id, id));
  }

  // Crew Assignments
  async getCrewAssignments(projectId: number): Promise<CrewAssignment[]> {
    return await db.select().from(crewAssignments).where(eq(crewAssignments.projectId, projectId));
  }

  async getCrewAssignmentsByEvent(eventId: number): Promise<CrewAssignment[]> {
    return await db.select().from(crewAssignments).where(eq(crewAssignments.eventId, eventId));
  }

  async createCrewAssignment(assignment: InsertCrewAssignment): Promise<CrewAssignment> {
    const [newAssignment] = await db.insert(crewAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updateCrewAssignment(id: number, updates: Partial<InsertCrewAssignment>): Promise<CrewAssignment> {
    const [updatedAssignment] = await db.update(crewAssignments)
      .set(updates)
      .where(eq(crewAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteCrewAssignment(id: number): Promise<void> {
    await db.delete(crewAssignments).where(eq(crewAssignments.id, id));
  }

  // Equipment
  async getEquipment(projectId: number): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.projectId, projectId));
  }

  async createEquipment(equip: InsertEquipment): Promise<Equipment> {
    const [newEquip] = await db.insert(equipment).values(equip).returning();
    return newEquip;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  // Equipment Assignments
  async getEquipmentAssignments(projectId: number): Promise<EquipmentAssignment[]> {
    return await db.select().from(equipmentAssignments).where(eq(equipmentAssignments.projectId, projectId));
  }

  async createEquipmentAssignment(assignment: InsertEquipmentAssignment): Promise<EquipmentAssignment> {
    const [newAssignment] = await db.insert(equipmentAssignments).values(assignment).returning();
    return newAssignment;
  }

  async deleteEquipmentAssignment(id: number): Promise<void> {
    await db.delete(equipmentAssignments).where(eq(equipmentAssignments.id, id));
  }

  // Budget
  async getBudget(projectId: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.projectId, projectId));
    return budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(projectId: number, updates: Partial<InsertBudget>): Promise<Budget> {
    const [updated] = await db.update(budgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgets.projectId, projectId))
      .returning();
    return updated;
  }

  // Budget Line Items
  async getBudgetLineItems(projectId: number): Promise<BudgetLineItem[]> {
    return await db.select().from(budgetLineItems)
      .where(eq(budgetLineItems.projectId, projectId))
      .orderBy(budgetLineItems.category);
  }

  async createBudgetLineItem(item: InsertBudgetLineItem): Promise<BudgetLineItem> {
    const [newItem] = await db.insert(budgetLineItems).values(item).returning();
    return newItem;
  }

  async updateBudgetLineItem(id: number, updates: Partial<InsertBudgetLineItem>): Promise<BudgetLineItem> {
    const [updated] = await db.update(budgetLineItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgetLineItems.id, id))
      .returning();
    return updated;
  }

  async deleteBudgetLineItem(id: number): Promise<void> {
    await db.delete(budgetLineItems).where(eq(budgetLineItems.id, id));
  }

  // Shot List
  async getShotList(projectId: number): Promise<ShotList[]> {
    return await db.select().from(shotList)
      .where(eq(shotList.projectId, projectId))
      .orderBy(desc(shotList.createdAt));
  }

  async createShotListItem(item: InsertShotList): Promise<ShotList> {
    const [newItem] = await db.insert(shotList).values(item).returning();
    return newItem;
  }

  async updateShotListItem(id: number, updates: Partial<InsertShotList>): Promise<ShotList> {
    const [updated] = await db.update(shotList)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shotList.id, id))
      .returning();
    return updated;
  }

  async deleteShotListItem(id: number): Promise<void> {
    await db.delete(shotList).where(eq(shotList.id, id));
  }

  // Crew Conflict Detection
  async detectCrewConflicts(crewId: number, eventId: number): Promise<{ hasConflict: boolean; conflicts: Array<{ eventId: number; eventTitle: string; startTime: Date; endTime: Date }> }> {
    const targetEvent = await db.select().from(events).where(eq(events.id, eventId));
    if (!targetEvent.length) {
      return { hasConflict: false, conflicts: [] };
    }

    const target = targetEvent[0];
    const assignments = await db.select().from(crewAssignments).where(eq(crewAssignments.crewId, crewId));
    const assignmentEventIds = assignments.map(a => a.eventId).filter(Boolean) as number[];
    
    if (assignmentEventIds.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    const assignedEvents = await db.select().from(events).where(inArray(events.id, assignmentEventIds));

    const conflicts = assignedEvents.filter(evt => {
      return (target.startTime < evt.endTime) && (target.endTime > evt.startTime);
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        eventId: c.id,
        eventTitle: c.title,
        startTime: c.startTime,
        endTime: c.endTime
      }))
    };
  }
}

export const storage = new DatabaseStorage();
