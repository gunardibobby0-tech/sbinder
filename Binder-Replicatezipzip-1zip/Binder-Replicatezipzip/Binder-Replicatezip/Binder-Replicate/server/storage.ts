import { 
  users, projects, documents, cast, crewMaster, contacts, events, userSettings, crew, crewAssignments, equipment, equipmentAssignments, budgets, budgetLineItems, shotList, locations, locationGallery, documentVersions,
  type User,
  type Project, type InsertProject,
  type Document, type InsertDocument,
  type Cast, type InsertCast,
  type CrewMaster, type InsertCrewMaster,
  type Contact, type InsertContact,
  type Event, type InsertEvent,
  type UserSettings, type InsertUserSettings,
  type Crew, type InsertCrew,
  type CrewAssignment, type InsertCrewAssignment,
  type Equipment, type InsertEquipment,
  type EquipmentAssignment, type InsertEquipmentAssignment,
  type Budget, type InsertBudget,
  type BudgetLineItem, type InsertBudgetLineItem,
  type ShotList, type InsertShotList,
  type Location, type InsertLocation,
  type LocationGallery, type InsertLocationGallery,
  type DocumentVersion, type InsertDocumentVersion
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

  // Cast
  getCast(projectId: number): Promise<(Cast & { crewMaster?: CrewMaster })[]>;
  createCast(castData: InsertCast): Promise<Cast>;
  updateCast(id: number, updates: Partial<InsertCast>): Promise<Cast>;
  deleteCast(id: number): Promise<void>;

  // Crew Master
  getCrewMaster(): Promise<CrewMaster[]>;
  createCrewMaster(talent: InsertCrewMaster): Promise<CrewMaster>;
  updateCrewMaster(id: number, updates: Partial<InsertCrewMaster>): Promise<CrewMaster>;
  deleteCrewMaster(id: number): Promise<void>;

  // Contacts
  getContacts(projectId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Events
  getEvents(projectId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<Event> & { order?: number }): Promise<Event>;
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

  // Locations
  getLocations(projectId: number): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, updates: Partial<InsertLocation>): Promise<Location>;
  deleteLocation(id: number): Promise<void>;

  // Location Gallery
  getLocationGallery(locationId: number): Promise<LocationGallery[]>;
  addGalleryImage(image: InsertLocationGallery): Promise<LocationGallery>;
  deleteGalleryImage(id: number): Promise<void>;

  // Document Versions
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  restoreDocumentVersion(documentId: number, versionId: number): Promise<Document>;

  // Budget Auto-calculation
  calculateProjectBudget(projectId: number): Promise<{ 
    crewCosts: number; 
    equipmentCosts: number; 
    totalEstimated: number;
    breakdown: { crew: string; equipment: string };
  }>;

  // Storyboards
  getStoryboards(projectId: number): Promise<any[]>;
  createStoryboard(data: any): Promise<any>;
  deleteStoryboard(id: number): Promise<void>;
  getStoryboardImages(storyboardId: number): Promise<any[]>;
  addStoryboardImage(data: any): Promise<any>;
  deleteStoryboardImage(id: number): Promise<void>;

  // Team Collaboration
  getProjectMembers(projectId: number): Promise<any[]>;
  getProjectInvitations(projectId: number): Promise<any[]>;
  inviteProjectMember(projectId: number, email: string, role: string): Promise<any>;
  removeProjectMember(projectId: number, memberId: number): Promise<void>;
  updateMemberRole(projectId: number, memberId: number, role: string): Promise<any>;
  getProjectActivity(projectId: number): Promise<any[]>;
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

  // Cast
  async getCast(projectId: number): Promise<(Cast & { crewMaster?: CrewMaster })[]> {
    return await db.select().from(cast).where(eq(cast.projectId, projectId));
  }

  async createCast(castData: InsertCast): Promise<Cast> {
    const [newCast] = await db.insert(cast).values(castData).returning();
    return newCast;
  }

  async updateCast(id: number, updates: Partial<InsertCast>): Promise<Cast> {
    const [updated] = await db.update(cast)
      .set(updates)
      .where(eq(cast.id, id))
      .returning();
    return updated;
  }

  async deleteCast(id: number): Promise<void> {
    await db.delete(cast).where(eq(cast.id, id));
  }

  // Crew Master
  async getCrewMaster(): Promise<CrewMaster[]> {
    return await db.select().from(crewMaster);
  }

  async createCrewMaster(talent: InsertCrewMaster): Promise<CrewMaster> {
    const [newTalent] = await db.insert(crewMaster).values(talent).returning();
    return newTalent;
  }

  async updateCrewMaster(id: number, updates: Partial<InsertCrewMaster>): Promise<CrewMaster> {
    const [updated] = await db.update(crewMaster)
      .set(updates)
      .where(eq(crewMaster.id, id))
      .returning();
    return updated;
  }

  async deleteCrewMaster(id: number): Promise<void> {
    await db.delete(crewMaster).where(eq(crewMaster.id, id));
  }

  // Events
  async getEvents(projectId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.projectId, projectId));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const [updated] = await db.update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return updated;
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
    console.log(`[CONFLICT CHECK] Checking conflicts for crewId=${crewId}, eventId=${eventId}`);
    
    const targetEvent = await db.select().from(events).where(eq(events.id, eventId));
    if (!targetEvent.length) {
      console.log(`[CONFLICT CHECK] Event ${eventId} not found`);
      return { hasConflict: false, conflicts: [] };
    }

    const target = targetEvent[0];
    console.log(`[CONFLICT CHECK] Target event: ${target.title} (${target.startTime} to ${target.endTime})`);
    
    const assignments = await db.select().from(crewAssignments).where(eq(crewAssignments.crewId, crewId));
    console.log(`[CONFLICT CHECK] Found ${assignments.length} existing assignments for crewId=${crewId}`);
    console.log(`[CONFLICT CHECK] Assignments:`, assignments);
    
    const assignmentEventIds = assignments.map(a => a.eventId).filter(Boolean) as number[];
    console.log(`[CONFLICT CHECK] Assignment event IDs:`, assignmentEventIds);
    
    if (assignmentEventIds.length === 0) {
      console.log(`[CONFLICT CHECK] No existing assignments, no conflict`);
      return { hasConflict: false, conflicts: [] };
    }

    const assignedEvents = await db.select().from(events).where(inArray(events.id, assignmentEventIds));
    console.log(`[CONFLICT CHECK] Assigned events:`, assignedEvents);

    const conflicts = assignedEvents.filter(evt => {
      // Skip self-conflict: exclude the event being checked
      if (evt.id === eventId) {
        return false;
      }
      const hasConflict = (target.startTime < evt.endTime) && (target.endTime > evt.startTime);
      console.log(`[CONFLICT CHECK] Event ${evt.id} ${evt.title}: ${hasConflict ? 'CONFLICT' : 'no conflict'}`);
      return hasConflict;
    });

    console.log(`[CONFLICT CHECK] Final result: ${conflicts.length} conflicts found`);
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

  // Locations
  async getLocations(projectId: number): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.projectId, projectId)).orderBy(desc(locations.createdAt));
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: number, updates: Partial<InsertLocation>): Promise<Location> {
    const [updated] = await db.update(locations).set({ ...updates, updatedAt: new Date() }).where(eq(locations.id, id)).returning();
    return updated;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Location Gallery
  async getLocationGallery(locationId: number): Promise<LocationGallery[]> {
    return await db.select().from(locationGallery).where(eq(locationGallery.locationId, locationId)).orderBy(desc(locationGallery.createdAt));
  }

  async addGalleryImage(image: InsertLocationGallery): Promise<LocationGallery> {
    const [newImage] = await db.insert(locationGallery).values(image).returning();
    return newImage;
  }

  async deleteGalleryImage(id: number): Promise<void> {
    await db.delete(locationGallery).where(eq(locationGallery.id, id));
  }

  // Document Versions
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return await db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).orderBy(desc(documentVersions.version));
  }

  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [newVersion] = await db.insert(documentVersions).values(version).returning();
    return newVersion;
  }

  async restoreDocumentVersion(documentId: number, versionId: number): Promise<Document> {
    const versionRecord = await db.select().from(documentVersions).where(eq(documentVersions.id, versionId));
    if (!versionRecord.length) throw new Error("Version not found");
    
    const [updated] = await db.update(documents).set({ content: versionRecord[0].content }).where(eq(documents.id, documentId)).returning();
    return updated;
  }

  // Budget Auto-calculation
  async calculateProjectBudget(projectId: number): Promise<{ 
    crewCosts: number; 
    equipmentCosts: number; 
    totalEstimated: number;
    breakdown: { crew: string; equipment: string };
  }> {
    const crewList = await db.select().from(crew).where(eq(crew.projectId, projectId));
    const equipmentList = await db.select().from(equipment).where(eq(equipment.projectId, projectId));

    let crewCosts = 0;
    let equipmentCosts = 0;

    crewList.forEach(c => {
      if (c.pricing) {
        const numericStr = c.pricing.replace(/[^\d.]/g, '');
        const price = numericStr ? parseFloat(numericStr) : 0;
        if (!Number.isNaN(price)) {
          crewCosts += price;
        }
      }
    });

    equipmentList.forEach(e => {
      if (e.rentalCost) {
        const numericStr = e.rentalCost.replace(/[^\d.]/g, '');
        const cost = numericStr ? parseFloat(numericStr) : 0;
        if (!Number.isNaN(cost)) {
          const qty = e.quantity || 1;
          equipmentCosts += cost * qty;
        }
      }
    });

    const totalEstimated = crewCosts + equipmentCosts;

    return {
      crewCosts,
      equipmentCosts,
      totalEstimated,
      breakdown: {
        crew: `${crewList.length} crew members @ avg pricing`,
        equipment: `${equipmentList.length} equipment items @ rental rates`,
      },
    };
  }

  // Storyboards - Mock implementation
  async getStoryboards(projectId: number): Promise<any[]> {
    const storyboards: any[] = [];
    try {
      // Try to get from database if table exists, otherwise return empty
      return storyboards;
    } catch {
      return storyboards;
    }
  }

  async createStoryboard(data: any): Promise<any> {
    const storyboard = {
      id: Math.floor(Math.random() * 1000000),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return storyboard;
  }

  async deleteStoryboard(id: number): Promise<void> {
    // Mock deletion
  }

  async getStoryboardImages(storyboardId: number): Promise<any[]> {
    return [];
  }

  async addStoryboardImage(data: any): Promise<any> {
    const image = {
      id: Math.floor(Math.random() * 1000000),
      ...data,
      createdAt: new Date().toISOString(),
    };
    return image;
  }

  async deleteStoryboardImage(id: number): Promise<void> {
    // Mock deletion
  }

  // Team Collaboration - Mock implementations
  async getProjectMembers(projectId: number): Promise<any[]> {
    return [{
      id: 1,
      projectId,
      userId: "user_1",
      email: "owner@example.com",
      userName: "You",
      role: "owner",
      joinedAt: new Date().toISOString(),
    }];
  }

  async getProjectInvitations(projectId: number): Promise<any[]> {
    return [];
  }

  async inviteProjectMember(projectId: number, email: string, role: string): Promise<any> {
    return {
      id: Math.floor(Math.random() * 1000000),
      projectId,
      email,
      role,
      token: Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  async removeProjectMember(projectId: number, memberId: number): Promise<void> {
    // Mock removal
  }

  async updateMemberRole(projectId: number, memberId: number, role: string): Promise<any> {
    return { id: memberId, projectId, role };
  }

  async getProjectActivity(projectId: number): Promise<any[]> {
    return [];
  }
}

export const storage = new DatabaseStorage();
