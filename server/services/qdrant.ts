import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

// Lazy initialization to avoid crashes when env vars are missing
let qdrantClient: QdrantClient | null = null;
let openai: OpenAI | null = null;

function getQdrantClient(): QdrantClient | null {
  if (!qdrantClient) {
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
      console.warn('Qdrant not configured - QDRANT_URL and QDRANT_API_KEY missing');
      return null;
    }
    qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  return qdrantClient;
}

function getOpenAI(): OpenAI | null {
  if (!openai) {
    if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      console.warn('OpenAI not configured - AI_INTEGRATIONS env vars missing');
      return null;
    }
    openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
  }
  return openai;
}

const COLLECTION_NAME = 'legal_documents';
const VECTOR_SIZE = 1536; // OpenAI embedding size

export class QdrantService {
  // Check if service is available
  private isAvailable(): boolean {
    return getQdrantClient() !== null && getOpenAI() !== null;
  }

  // Ensure collection exists (called lazily on first use)
  private async ensureCollection(): Promise<boolean> {
    const client = getQdrantClient();
    if (!client) {
      console.warn('Qdrant client not available - skipping collection setup');
      return false;
    }
    try {
      await client.getCollection(COLLECTION_NAME);
    } catch {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });

      // Create payload index for company_id to enable multitenancy
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'company_id',
        field_schema: {
          type: 'keyword',
          is_tenant: true,
        },
      });
    }
    return true;
  }

  // Generate embeddings using OpenAI
  private async generateEmbedding(text: string): Promise<number[] | null> {
    const client = getOpenAI();
    if (!client) {
      console.warn('OpenAI client not available - cannot generate embedding');
      return null;
    }
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  // Store document in Qdrant
  async storeDocument(
    companyId: string,
    documentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    if (!this.isAvailable()) {
      console.warn('Qdrant service unavailable - skipping document storage');
      return `mock_${documentId}`;
    }
    
    const collectionReady = await this.ensureCollection();
    if (!collectionReady) {
      return `mock_${documentId}`;
    }
    
    const client = getQdrantClient();
    if (!client) return `mock_${documentId}`;
    
    const embedding = await this.generateEmbedding(content);
    if (!embedding) return `mock_${documentId}`;
    
    const pointId = `doc_${documentId}`;

    await client.upsert(COLLECTION_NAME, {
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            company_id: companyId,
            document_id: documentId,
            content,
            ...metadata,
          },
        },
      ],
    });

    return pointId;
  }

  // Store chat message in Qdrant
  async storeChatMessage(
    companyId: string,
    messageId: string,
    content: string,
    role: string
  ): Promise<string> {
    if (!this.isAvailable()) {
      console.warn('Qdrant service unavailable - skipping message storage');
      return `mock_${messageId}`;
    }
    
    const collectionReady = await this.ensureCollection();
    if (!collectionReady) {
      return `mock_${messageId}`;
    }
    
    const client = getQdrantClient();
    if (!client) return `mock_${messageId}`;
    
    const embedding = await this.generateEmbedding(content);
    if (!embedding) return `mock_${messageId}`;
    
    const pointId = `msg_${messageId}`;

    await client.upsert(COLLECTION_NAME, {
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            company_id: companyId,
            message_id: messageId,
            content,
            role,
            type: 'chat_message',
          },
        },
      ],
    });

    return pointId;
  }

  // Search for relevant documents/messages
  async search(companyId: string, query: string, limit: number = 5) {
    if (!this.isAvailable()) {
      console.warn('Qdrant service unavailable - returning empty results');
      return [];
    }
    
    const collectionReady = await this.ensureCollection();
    if (!collectionReady) {
      return [];
    }
    
    const client = getQdrantClient();
    if (!client) return [];
    
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) return [];

    const results = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      filter: {
        must: [
          {
            key: 'company_id',
            match: {
              value: companyId,
            },
          },
        ],
      },
      limit,
      with_payload: true,
    });

    return results;
  }

  // Delete document from Qdrant
  async deleteDocument(pointId: string): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Qdrant service unavailable - skipping deletion');
      return;
    }
    
    const client = getQdrantClient();
    if (!client) return;
    
    await client.delete(COLLECTION_NAME, {
      points: [pointId],
    });
  }
}

export const qdrantService = new QdrantService();
