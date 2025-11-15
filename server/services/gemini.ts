import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import pRetry from "p-retry";

// Referenced from Gemini AI Integrations blueprint
// This is using Replit's AI Integrations service, which provides Gemini-compatible API access without requiring your own Gemini API key.

class GeminiService {
  private ai: GoogleGenAI | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized() {
    if (this.ai) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
        const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

        if (!apiKey || !baseUrl) {
          console.warn("Gemini not configured - AI_INTEGRATIONS_GEMINI_API_KEY or AI_INTEGRATIONS_GEMINI_BASE_URL missing");
          return;
        }

        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            apiVersion: "",
            baseUrl,
          },
        });

        console.log("✓ Gemini service initialized");
      } catch (error) {
        console.warn("Failed to initialize Gemini:", error);
      }
    })();

    await this.initPromise;
  }

  private isRateLimitError(error: any): boolean {
    const errorMsg = error?.message || String(error);
    return (
      errorMsg.includes("429") ||
      errorMsg.includes("RATELIMIT_EXCEEDED") ||
      errorMsg.toLowerCase().includes("quota") ||
      errorMsg.toLowerCase().includes("rate limit")
    );
  }

  async answerQuestion(
    question: string,
    companyContext: string,
    relevantDocs: string[] = []
  ): Promise<string> {
    await this.ensureInitialized();
    if (!this.ai) {
      return "AI assistant is not available. Please contact support.";
    }

    try {
      const context = relevantDocs.length > 0
        ? `\n\nRelevant context:\n${relevantDocs.join('\n\n')}`
        : '';

      const prompt = `You are an elite startup lawyer AI assistant for incorporate.run.

${companyContext}

User question: ${question}${context}

Provide helpful, accurate legal guidance specific to the user's jurisdiction. Be concise but thorough.`;

      return await pRetry(
        async () => {
          try {
            const response = await this.ai!.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });
            return response.text || "I apologize, I couldn't generate a response.";
          } catch (error: any) {
            if (this.isRateLimitError(error)) {
              throw error;
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
    } catch (error) {
      console.error("Gemini answerQuestion error:", error);
      return "I encountered an error processing your question. Please try again.";
    }
  }

  async draftDocument(
    type: string,
    company: any,
    params: any = {}
  ): Promise<string> {
    await this.ensureInitialized();
    if (!this.ai) {
      return "Document drafting is not available. Please contact support.";
    }

    try {
      const prompt = `You are an elite startup lawyer drafting legal documents.

Company: ${company.name}
Jurisdiction: ${company.jurisdiction === 'delaware' ? 'Delaware C-Corp' : 'France SAS'}
Document Type: ${type}

Additional parameters: ${JSON.stringify(params)}

Draft a complete, professional ${type} document tailored to this jurisdiction. Include all necessary clauses and legal language.`;

      return await pRetry(
        async () => {
          try {
            const response = await this.ai!.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });
            return response.text || "Failed to generate document.";
          } catch (error: any) {
            if (this.isRateLimitError(error)) {
              throw error;
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
    } catch (error) {
      console.error("Gemini draftDocument error:", error);
      return "Failed to draft document. Please try again.";
    }
  }

  async validateDocument(
    type: string,
    content: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    await this.ensureInitialized();
    if (!this.ai) {
      return { valid: false, issues: ["Validation service not available"] };
    }

    try {
      const prompt = `You are an elite startup lawyer reviewing a ${type} document.

Document content:
${content}

Analyze this document for:
1. Missing required clauses
2. Legal inconsistencies
3. Jurisdiction-specific compliance issues
4. Best practice recommendations

Respond in JSON format with:
{
  "valid": boolean,
  "issues": string[]
}`;

      const response = await pRetry(
        async () => {
          try {
            const result = await this.ai!.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    issues: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["valid", "issues"]
                }
              }
            });
            return JSON.parse(result.text || '{"valid": false, "issues": ["Validation failed"]}');
          } catch (error: any) {
            if (this.isRateLimitError(error)) {
              throw error;
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

      return response;
    } catch (error) {
      console.error("Gemini validateDocument error:", error);
      return { valid: false, issues: ["Validation error occurred"] };
    }
  }

  async extractCompanyData(
    conversation: string
  ): Promise<{ name: string; description: string; jurisdiction: 'delaware' | 'france' } | null> {
    await this.ensureInitialized();
    if (!this.ai) {
      return null;
    }

    try {
      const prompt = `Extract company formation details from this conversation:

${conversation}

Extract:
- Company name
- Company description/purpose
- Jurisdiction preference (Delaware or France)

If jurisdiction is not clear, default to Delaware. Return JSON with exact fields: name, description, jurisdiction`;

      const response = await pRetry(
        async () => {
          try {
            const result = await this.ai!.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    jurisdiction: { 
                      type: Type.STRING,
                      enum: ['delaware', 'france']
                    }
                  },
                  required: ["name", "description", "jurisdiction"]
                }
              }
            });
            return JSON.parse(result.text || 'null');
          } catch (error: any) {
            if (this.isRateLimitError(error)) {
              throw error;
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

      return response;
    } catch (error) {
      console.error("Gemini extractCompanyData error:", error);
      return null;
    }
  }

  async extractEntities(conversation: string): Promise<{
    company: { name: string; description: string; jurisdiction: 'delaware' | 'france' };
    founders: Array<{ email: string; firstName: string; lastName: string; role: string; equityPercentage: number }>;
    investors: Array<{ name: string; email: string; amount: number }>;
  } | null> {
    await this.ensureInitialized();
    if (!this.ai) {
      return null;
    }

    try {
      const prompt = `Extract all startup formation details from this conversation:

${conversation}

Extract:
1. Company information:
   - Company name
   - Brief description/purpose
   - Jurisdiction (Delaware C-Corp or France SAS)

2. Founders (co-founders):
   - Email address  
   - First name and last name
   - Role/title (CEO, CTO, etc.)
   - Equity percentage

3. Investors (if mentioned):
   - Name
   - Email (if mentioned, otherwise generate professional email from name)
   - Investment amount

If jurisdiction is not clear, default to Delaware.
If equity percentages aren't specified, distribute evenly among founders.
Return empty arrays if no founders or investors are mentioned.`;

      const response = await pRetry(
        async () => {
          try {
            const result = await this.ai!.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    company: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        jurisdiction: {
                          type: Type.STRING,
                          enum: ['delaware', 'france']
                        }
                      },
                      required: ["name", "description", "jurisdiction"]
                    },
                    founders: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          email: { type: Type.STRING },
                          firstName: { type: Type.STRING },
                          lastName: { type: Type.STRING },
                          role: { type: Type.STRING },
                          equityPercentage: { type: Type.NUMBER }
                        },
                        required: ["email", "firstName", "lastName", "role", "equityPercentage"]
                      }
                    },
                    investors: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          email: { type: Type.STRING },
                          amount: { type: Type.NUMBER }
                        },
                        required: ["name", "email", "amount"]
                      }
                    }
                  },
                  required: ["company", "founders", "investors"]
                }
              }
            });
            return JSON.parse(result.text || 'null');
          } catch (error: any) {
            if (this.isRateLimitError(error)) {
              throw error;
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

      return response;
    } catch (error) {
      console.error("Gemini extractEntities error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
