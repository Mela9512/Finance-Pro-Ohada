import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  private ensureClient(): GoogleGenAI {
    if (!this.client) {
      throw new ServiceUnavailableException(
        "GEMINI_API_KEY n'est pas configurée sur le serveur — fonctionnalité IA indisponible",
      );
    }
    return this.client;
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const client = this.ensureClient();
    const response = await client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response.text ?? '';
  }

  async generateJson<T>(prompt: string, schema: Record<string, unknown>, systemInstruction?: string): Promise<T> {
    const client = this.ensureClient();
    const response = await client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema as any,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });
    return JSON.parse(response.text ?? '{}') as T;
  }

  async generateJsonFromFile<T>(
    prompt: string,
    fileBase64: string,
    mimeType: string,
    schema: Record<string, unknown>,
    systemInstruction?: string,
  ): Promise<T> {
    const client = this.ensureClient();
    const response = await client.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: fileBase64, mimeType } }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema as any,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });
    return JSON.parse(response.text ?? '{}') as T;
  }
}
