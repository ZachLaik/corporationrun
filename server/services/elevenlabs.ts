import { ElevenLabsClient } from "elevenlabs";

class ElevenLabsService {
  private client: ElevenLabsClient | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized() {
    if (this.client) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
          console.warn("ElevenLabs not configured - ELEVENLABS_API_KEY missing");
          return;
        }

        this.client = new ElevenLabsClient({
          apiKey,
        });
        
        console.log("ElevenLabs service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize ElevenLabs:", error);
      }
    })();

    await this.initPromise;
  }

  async isAvailable(): Promise<boolean> {
    await this.ensureInitialized();
    return this.client !== null;
  }

  async textToSpeech(text: string, voiceId: string = "21m00Tcm4TlvDq8ikWAM"): Promise<Buffer | null> {
    await this.ensureInitialized();
    if (!this.client) {
      return null;
    }

    try {
      const audio = await this.client.textToSpeech.convert(voiceId, {
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      });

      const chunks: Buffer[] = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error("ElevenLabs TTS error:", error);
      return null;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
