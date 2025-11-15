// From javascript_database and javascript_log_in_with_replit blueprints
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  companies,
  founders,
  investors,
  documents,
  documentSignatures,
  tasks,
  capTableEntries,
  chatMessages,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Founder,
  type InsertFounder,
  type Investor,
  type InsertInvestor,
  type Document,
  type InsertDocument,
  type DocumentSignature,
  type InsertDocumentSignature,
  type Task,
  type InsertTask,
  type CapTableEntry,
  type InsertCapTableEntry,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";

export interface IStorage {
  // User operations (MANDATORY for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Company operations
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company>;

  // Founder operations
  getFoundersByCompanyId(companyId: string): Promise<Founder[]>;
  createFounder(founder: InsertFounder): Promise<Founder>;
  updateFounder(id: string, data: Partial<InsertFounder>): Promise<Founder>;

  // Investor operations
  getInvestorsByCompanyId(companyId: string): Promise<Investor[]>;
  createInvestor(investor: InsertInvestor): Promise<Investor>;
  updateInvestor(id: string, data: Partial<InsertInvestor>): Promise<Investor>;

  // Document operations
  getDocumentsByCompanyId(companyId: string): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document>;

  // Document signature operations
  getSignaturesByDocumentId(documentId: string): Promise<DocumentSignature[]>;
  getSignatureByToken(token: string): Promise<DocumentSignature | undefined>;
  createSignature(signature: InsertDocumentSignature): Promise<DocumentSignature>;
  updateSignature(id: string, data: Partial<InsertDocumentSignature>): Promise<DocumentSignature>;

  // Task operations
  getTasksByCompanyId(companyId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task>;

  // Cap table operations
  getCapTableByCompanyId(companyId: string): Promise<CapTableEntry[]>;
  createCapTableEntry(entry: InsertCapTableEntry): Promise<CapTableEntry>;

  // Chat operations
  getChatMessagesByCompanyId(companyId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations (MANDATORY for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, userId))
      .limit(1);
    return company;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  // Founder operations
  async getFoundersByCompanyId(companyId: string): Promise<Founder[]> {
    return await db
      .select()
      .from(founders)
      .where(eq(founders.companyId, companyId))
      .orderBy(desc(founders.createdAt));
  }

  async createFounder(founderData: InsertFounder): Promise<Founder> {
    const [founder] = await db.insert(founders).values(founderData).returning();
    return founder;
  }

  async updateFounder(id: string, data: Partial<InsertFounder>): Promise<Founder> {
    const [founder] = await db
      .update(founders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(founders.id, id))
      .returning();
    return founder;
  }

  // Investor operations
  async getInvestorsByCompanyId(companyId: string): Promise<Investor[]> {
    return await db
      .select()
      .from(investors)
      .where(eq(investors.companyId, companyId))
      .orderBy(desc(investors.createdAt));
  }

  async createInvestor(investorData: InsertInvestor): Promise<Investor> {
    const [investor] = await db.insert(investors).values(investorData).returning();
    return investor;
  }

  async updateInvestor(id: string, data: Partial<InsertInvestor>): Promise<Investor> {
    const [investor] = await db
      .update(investors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(investors.id, id))
      .returning();
    return investor;
  }

  // Document operations
  async getDocumentsByCompanyId(companyId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  // Document signature operations
  async getSignaturesByDocumentId(documentId: string): Promise<DocumentSignature[]> {
    return await db
      .select()
      .from(documentSignatures)
      .where(eq(documentSignatures.documentId, documentId))
      .orderBy(desc(documentSignatures.createdAt));
  }

  async getSignatureByToken(token: string): Promise<DocumentSignature | undefined> {
    const [signature] = await db
      .select()
      .from(documentSignatures)
      .where(eq(documentSignatures.magicToken, token));
    return signature;
  }

  async createSignature(signatureData: InsertDocumentSignature): Promise<DocumentSignature> {
    const [signature] = await db.insert(documentSignatures).values(signatureData).returning();
    return signature;
  }

  async updateSignature(id: string, data: Partial<InsertDocumentSignature>): Promise<DocumentSignature> {
    const [signature] = await db
      .update(documentSignatures)
      .set(data)
      .where(eq(documentSignatures.id, id))
      .returning();
    return signature;
  }

  // Task operations
  async getTasksByCompanyId(companyId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.companyId, companyId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Cap table operations
  async getCapTableByCompanyId(companyId: string): Promise<CapTableEntry[]> {
    return await db
      .select()
      .from(capTableEntries)
      .where(eq(capTableEntries.companyId, companyId))
      .orderBy(desc(capTableEntries.createdAt));
  }

  async createCapTableEntry(entryData: InsertCapTableEntry): Promise<CapTableEntry> {
    const [entry] = await db.insert(capTableEntries).values(entryData).returning();
    return entry;
  }

  // Chat operations
  async getChatMessagesByCompanyId(companyId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.companyId, companyId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
