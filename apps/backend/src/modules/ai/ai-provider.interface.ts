export const AI_PROVIDER = 'AI_PROVIDER';

/**
 * Isole le reste du code du SDK Gemini spécifique : changer de fournisseur IA
 * (OpenAI, Claude, etc.) ne demande qu'une nouvelle implémentation de cette interface.
 */
export interface AiProvider {
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  generateJson<T>(prompt: string, schema: Record<string, unknown>, systemInstruction?: string): Promise<T>;
  generateJsonFromFile<T>(
    prompt: string,
    fileBase64: string,
    mimeType: string,
    schema: Record<string, unknown>,
    systemInstruction?: string,
  ): Promise<T>;
}
