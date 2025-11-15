import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./replitAuth";
import { insertCompanySchema, insertFounderSchema, insertInvestorSchema, insertDocumentSchema, insertTaskSchema, insertDocumentSignatureSchema, insertCapTableEntrySchema } from "@shared/schema";
import { qdrantService } from "./services/qdrant";
import { openaiService } from "./services/openai";
import { emailService } from "./services/email";

// Helper to get authenticated user
function getAuthUser(req: Request) {
  const user = req.user as any;
  if (!user || !user.id) {
    throw new Error("User not authenticated");
  }
  return user;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // COMPANY ROUTES
  // ============================================
  
  // Get current user's company
  app.get("/api/company", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new company
  app.post("/api/company", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      
      // Check if user already has a company
      const existingCompany = await storage.getCompanyByUserId(user.id);
      if (existingCompany) {
        return res.status(400).json({ message: "You already have a company" });
      }
      
      const data = insertCompanySchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const company = await storage.createCompany(data);
      res.json(company);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================
  // FOUNDER ROUTES
  // ============================================
  
  // Get all founders for the current user's company
  app.get("/api/founders", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const founders = await storage.getFoundersByCompanyId(company.id);
      res.json(founders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new founder (invite)
  app.post("/api/founders", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const data = insertFounderSchema.parse({
        ...req.body,
        companyId: company.id,
        status: 'invited',
      });
      
      const founder = await storage.createFounder(data);
      
      // Send invitation email
      const inviterName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      await emailService.sendFounderInvitation(
        founder.email,
        founder.firstName || founder.email,
        company.name,
        inviterName
      );
      
      res.json(founder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================
  // INVESTOR ROUTES
  // ============================================
  
  // Get all investors for the current user's company
  app.get("/api/investors", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const investors = await storage.getInvestorsByCompanyId(company.id);
      res.json(investors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new investor and generate SAFE document
  app.post("/api/investors", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const data = insertInvestorSchema.parse({
        ...req.body,
        companyId: company.id,
        status: 'pending',
      });
      
      const investor = await storage.createInvestor(data);
      
      // Generate SAFE document
      const safeContent = await openaiService.draftDocument(
        'SAFE',
        company,
        { investor: data, amount: data.amount }
      );
      
      const safeDoc = await storage.createDocument({
        companyId: company.id,
        type: 'safe',
        title: `SAFE - ${investor.name}`,
        content: safeContent,
        status: 'drafting',
      });
      
      // Update investor with SAFE document reference
      await storage.updateInvestor(investor.id, { safeDocumentId: safeDoc.id });
      
      res.json(investor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================
  // DOCUMENT ROUTES
  // ============================================
  
  // Get all documents for the current user's company
  app.get("/api/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const documents = await storage.getDocumentsByCompanyId(company.id);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific document
  app.get("/api/documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new document
  app.post("/api/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const data = insertDocumentSchema.parse({
        ...req.body,
        companyId: company.id,
        status: 'drafting',
      });
      
      const document = await storage.createDocument(data);
      
      // Store in Qdrant for semantic search
      if (document.content) {
        await qdrantService.storeDocument(
          company.id,
          document.id,
          document.content,
          { title: document.title, type: document.type }
        );
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update a document
  app.patch("/api/documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const document = await storage.updateDocument(req.params.id, req.body);
      
      // Update in Qdrant if content changed
      if (req.body.content) {
        const company = await storage.getCompanyByUserId((req.user as any).id);
        if (company) {
          await qdrantService.storeDocument(
            company.id,
            document.id,
            req.body.content,
            { title: document.title, type: document.type }
          );
        }
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Validate a document using AI
  app.post("/api/documents/:id/validate", requireAuth, async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const validation = await openaiService.validateDocument(
        document.type,
        document.content || ''
      );
      
      // Update document status based on validation
      if (validation.valid) {
        await storage.updateDocument(document.id, { status: 'validating' });
      }
      
      res.json(validation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Send document for signature
  app.post("/api/documents/:id/send-for-signature", requireAuth, async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const { signers } = req.body; // Array of { email, name }
      
      if (!signers || !Array.isArray(signers)) {
        return res.status(400).json({ message: "Signers array is required" });
      }
      
      // Create signature requests
      const baseUrl = req.protocol + '://' + req.get('host');
      
      for (const signer of signers) {
        const magicToken = emailService.generateMagicToken();
        
        await storage.createSignature({
          documentId: document.id,
          signerEmail: signer.email,
          signerName: signer.name,
          magicToken,
          status: 'sent',
        });
        
        await emailService.sendSignatureRequest(
          signer.email,
          signer.name,
          document.title,
          magicToken,
          baseUrl
        );
      }
      
      // Update document status
      await storage.updateDocument(document.id, { status: 'signing' });
      
      res.json({ message: "Signature requests sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // TASK ROUTES
  // ============================================
  
  // Get all tasks for the current user's company
  app.get("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const tasks = await storage.getTasksByCompanyId(company.id);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new task
  app.post("/api/tasks", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const data = insertTaskSchema.parse({
        ...req.body,
        companyId: company.id,
        status: 'pending',
      });
      
      const task = await storage.createTask(data);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update a task
  app.patch("/api/tasks/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================
  // SIGNATURE ROUTES
  // ============================================
  
  // Get signatures for a document
  app.get("/api/documents/:id/signatures", requireAuth, async (req: Request, res: Response) => {
    try {
      const signatures = await storage.getSignaturesByDocumentId(req.params.id);
      res.json(signatures);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get signature by magic token (no auth required for signing)
  app.get("/api/signatures/:token", async (req: Request, res: Response) => {
    try {
      const signature = await storage.getSignatureByToken(req.params.token);
      
      if (!signature) {
        return res.status(404).json({ message: "Signature request not found or expired" });
      }
      
      // Also return the document
      const document = await storage.getDocumentById(signature.documentId);
      
      res.json({ signature, document });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Submit signature (no auth required)
  app.post("/api/signatures/:token/sign", async (req: Request, res: Response) => {
    try {
      const signature = await storage.getSignatureByToken(req.params.token);
      
      if (!signature) {
        return res.status(404).json({ message: "Signature request not found or expired" });
      }
      
      if (signature.status === 'signed') {
        return res.status(400).json({ message: "Document already signed" });
      }
      
      // Update signature
      const updated = await storage.updateSignature(signature.id, {
        status: 'signed',
        signedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      // Check if all signatures are complete
      const allSignatures = await storage.getSignaturesByDocumentId(signature.documentId);
      const allSigned = allSignatures.every(s => s.status === 'signed');
      
      if (allSigned) {
        await storage.updateDocument(signature.documentId, { status: 'active' });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // CAP TABLE ROUTES
  // ============================================
  
  // Get cap table for the current user's company
  app.get("/api/cap-table", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const capTable = await storage.getCapTableByCompanyId(company.id);
      res.json(capTable);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create cap table entry
  app.post("/api/cap-table", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const data = insertCapTableEntrySchema.parse({
        ...req.body,
        companyId: company.id,
      });
      
      const entry = await storage.createCapTableEntry(data);
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================
  // CHAT / AI ASSISTANT ROUTES
  // ============================================
  
  // Get chat messages
  app.get("/api/chat/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const messages = await storage.getChatMessagesByCompanyId(company.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Send a chat message and get AI response
  app.post("/api/chat/send", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getAuthUser(req);
      const company = await storage.getCompanyByUserId(user.id);
      
      if (!company) {
        return res.status(404).json({ message: "No company found" });
      }
      
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        companyId: company.id,
        role: 'user',
        content,
      });
      
      // Store in Qdrant
      await qdrantService.storeChatMessage(company.id, userMessage.id, content, 'user');
      
      // Search for relevant context
      const relevantContext = await qdrantService.search(company.id, content, 3);
      const contextStrings = relevantContext.map(r => r.payload?.content || '').filter(Boolean);
      
      // Generate AI response
      const companyContext = `Company: ${company.name}, Jurisdiction: ${company.jurisdiction}`;
      const aiResponse = await openaiService.answerQuestion(content, companyContext, contextStrings);
      
      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        companyId: company.id,
        role: 'assistant',
        content: aiResponse,
      });
      
      // Store in Qdrant
      await qdrantService.storeChatMessage(company.id, assistantMessage.id, aiResponse, 'assistant');
      
      res.json({ userMessage, assistantMessage });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
