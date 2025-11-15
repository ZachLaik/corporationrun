import OpenAI from 'openai';
import pRetry from 'p-retry';

// From javascript_openai_ai_integrations blueprint
// Lazy initialization to avoid crashes when env vars are missing
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!openaiClient) {
    if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      console.warn('OpenAI not configured - AI_INTEGRATIONS env vars missing');
      return null;
    }
    openaiClient = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Get the AI model to use (configurable via env var)
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export class OpenAIService {
  // Check if service is available
  private isAvailable(): boolean {
    return getOpenAI() !== null;
  }

  // Generate AI response with retry logic
  async generateResponse(
    systemPrompt: string,
    userMessage: string,
    context?: string[]
  ): Promise<string> {
    const client = getOpenAI();
    if (!client) {
      console.warn('OpenAI service unavailable - returning fallback response');
      return "I'm sorry, the AI service is not configured. Please contact support.";
    }

    return await pRetry(
      async () => {
        try {
          const messages: any[] = [
            { role: 'system', content: systemPrompt },
          ];

          if (context && context.length > 0) {
            messages.push({
              role: 'system',
              content: `Relevant context:\n${context.join('\n\n')}`,
            });
          }

          messages.push({ role: 'user', content: userMessage });

          const response = await client.chat.completions.create({
            model: AI_MODEL,
            messages,
            max_completion_tokens: 8192,
          });

          return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error; // Rethrow to trigger p-retry
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );
  }

  // Draft a legal document using AI
  async draftDocument(
    documentType: string,
    companyData: any,
    templateData: any
  ): Promise<string> {
    const systemPrompt = `You are an expert legal AI assistant specializing in startup legal documents. 
Generate a professional ${documentType} document based on the provided company information and template structure. 
Use clear, legally sound language. Format the document professionally with proper sections and clauses.`;

    const userMessage = `Draft a ${documentType} for:
Company: ${companyData.name}
Jurisdiction: ${companyData.jurisdiction}

Template requirements:
${JSON.stringify(templateData, null, 2)}

Please generate a complete, professional document.`;

    return await this.generateResponse(systemPrompt, userMessage);
  }

  // Validate a document
  async validateDocument(
    documentType: string,
    content: string
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const systemPrompt = `You are an expert legal AI assistant. Analyze the provided ${documentType} document and identify any missing required sections, legal errors, or potential issues. Return your analysis as JSON with the following structure:
{
  "valid": boolean,
  "errors": ["array of critical issues"],
  "warnings": ["array of recommendations"]
}`;

    const userMessage = `Validate this ${documentType} document:\n\n${content}`;

    const response = await this.generateResponse(systemPrompt, userMessage);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        valid: true,
        errors: [],
        warnings: ['Could not parse validation response'],
      };
    }
  }

  // Answer user questions about their company
  async answerQuestion(
    question: string,
    companyContext: string,
    relevantDocs: string[]
  ): Promise<string> {
    const systemPrompt = `You are a helpful AI legal assistant for corporation.run, a voice-first legal OS for startups. 
You help founders understand their company, documents, and legal requirements. Be friendly, concise, and accurate.
Always cite which documents or information you're referencing.`;

    const context = [
      `Company Information:\n${companyContext}`,
      ...relevantDocs.map((doc, idx) => `Document ${idx + 1}:\n${doc}`),
    ];

    return await this.generateResponse(systemPrompt, question, context);
  }
}

export const openaiService = new OpenAIService();
