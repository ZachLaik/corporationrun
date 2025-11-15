import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const jurisdictionEnum = pgEnum('jurisdiction', ['delaware', 'france']);
export const documentTypeEnum = pgEnum('document_type', [
  'nda',
  'pre_founder_agreement',
  'ip_assignment',
  'advisor_agreement',
  'terms_conditions',
  'privacy_policy',
  'contractor_agreement',
  'safe',
  'certificate_incorporation',
  'bylaws',
  'board_consent',
]);
export const documentStatusEnum = pgEnum('document_status', ['drafting', 'validating', 'signing', 'active']);
export const signatureStatusEnum = pgEnum('signature_status', ['pending', 'sent', 'signed']);
export const founderStatusEnum = pgEnum('founder_status', ['invited', 'pending_signature', 'active']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed']);

// ============================================================================
// AUTH TABLES (from Replit Auth blueprint)
// ============================================================================

// Session storage table - MANDATORY for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - MANDATORY for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// COMPANY TABLES
// ============================================================================

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  jurisdiction: jurisdictionEnum("jurisdiction").notNull(),
  healthScore: integer("health_score").default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  founders: many(founders),
  investors: many(investors),
  documents: many(documents),
  tasks: many(tasks),
  capTableEntries: many(capTableEntries),
}));

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// ============================================================================
// FOUNDER TABLES
// ============================================================================

export const founders = pgTable("founders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  role: varchar("role", { length: 255 }),
  equityPercentage: integer("equity_percentage"),
  status: founderStatusEnum("status").default('invited'),
  idUploaded: boolean("id_uploaded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const foundersRelations = relations(founders, ({ one, many }) => ({
  company: one(companies, {
    fields: [founders.companyId],
    references: [companies.id],
  }),
  signatures: many(documentSignatures),
  tasks: many(tasks),
}));

export const insertFounderSchema = createInsertSchema(founders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFounder = z.infer<typeof insertFounderSchema>;
export type Founder = typeof founders.$inferSelect;

// ============================================================================
// INVESTOR TABLES
// ============================================================================

export const investors = pgTable("investors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: integer("amount"),
  safeDocumentId: varchar("safe_document_id").references(() => documents.id),
  status: signatureStatusEnum("status").default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const investorsRelations = relations(investors, ({ one, many }) => ({
  company: one(companies, {
    fields: [investors.companyId],
    references: [companies.id],
  }),
  safeDocument: one(documents, {
    fields: [investors.safeDocumentId],
    references: [documents.id],
  }),
  signatures: many(documentSignatures),
}));

export const insertInvestorSchema = createInsertSchema(investors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investor = typeof investors.$inferSelect;

// ============================================================================
// DOCUMENT TABLES
// ============================================================================

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  type: documentTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: documentStatusEnum("status").default('drafting'),
  content: text("content"),
  validationErrors: jsonb("validation_errors"),
  qdrantPointId: varchar("qdrant_point_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  activatedAt: timestamp("activated_at"),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
  signatures: many(documentSignatures),
}));

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  activatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// ============================================================================
// DOCUMENT SIGNATURE TABLES
// ============================================================================

export const documentSignatures = pgTable("document_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  signerId: varchar("signer_id").notNull(),
  signerEmail: varchar("signer_email", { length: 255 }).notNull(),
  signerType: varchar("signer_type", { length: 50 }).notNull(), // 'founder' | 'investor'
  status: signatureStatusEnum("status").default('pending'),
  magicToken: varchar("magic_token", { length: 255 }),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentSignaturesRelations = relations(documentSignatures, ({ one }) => ({
  document: one(documents, {
    fields: [documentSignatures.documentId],
    references: [documents.id],
  }),
  founder: one(founders, {
    fields: [documentSignatures.signerId],
    references: [founders.id],
  }),
  investor: one(investors, {
    fields: [documentSignatures.signerId],
    references: [investors.id],
  }),
}));

export const insertDocumentSignatureSchema = createInsertSchema(documentSignatures).omit({
  id: true,
  createdAt: true,
  signedAt: true,
});

export type InsertDocumentSignature = z.infer<typeof insertDocumentSignatureSchema>;
export type DocumentSignature = typeof documentSignatures.$inferSelect;

// ============================================================================
// TASK TABLES
// ============================================================================

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }),
  assigneeId: varchar("assignee_id"),
  status: taskStatusEnum("status").default('pending'),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  company: one(companies, {
    fields: [tasks.companyId],
    references: [companies.id],
  }),
  assignee: one(founders, {
    fields: [tasks.assigneeId],
    references: [founders.id],
  }),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ============================================================================
// CAP TABLE TABLES
// ============================================================================

export const capTableEntries = pgTable("cap_table_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  holderId: varchar("holder_id").notNull(),
  holderType: varchar("holder_type", { length: 50 }).notNull(), // 'founder' | 'investor'
  holderName: varchar("holder_name", { length: 255 }).notNull(),
  shares: integer("shares").notNull(),
  percentage: integer("percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const capTableEntriesRelations = relations(capTableEntries, ({ one }) => ({
  company: one(companies, {
    fields: [capTableEntries.companyId],
    references: [companies.id],
  }),
}));

export const insertCapTableEntrySchema = createInsertSchema(capTableEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCapTableEntry = z.infer<typeof insertCapTableEntrySchema>;
export type CapTableEntry = typeof capTableEntries.$inferSelect;

// ============================================================================
// CHAT MESSAGE TABLES (for AI conversations)
// ============================================================================

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 50 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  qdrantPointId: varchar("qdrant_point_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  company: one(companies, {
    fields: [chatMessages.companyId],
    references: [companies.id],
  }),
}));

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
