
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, Mode, Attachment } from "./types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateLegalResponse = async (
  prompt: string,
  mode: Mode,
  chatHistory: any[],
  attachments: Attachment[] = []
): Promise<{ text: string; sources?: string[] }> => {
  
  let modelName = 'gemini-3-flash-preview';
  let config: any = { systemInstruction: SYSTEM_INSTRUCTION };

  if (mode === Mode.DEEP) {
    modelName = 'gemini-3-pro-preview';
    config.thinkingConfig = { thinkingBudget: 16000 };
    config.tools = [{ googleSearch: {} }];
  } else {
    config.tools = [{ googleSearch: {} }];
  }

  const currentParts: any[] = [{ text: prompt }];
  attachments.forEach(att => {
    currentParts.unshift({ inlineData: { mimeType: att.mimeType, data: att.data } });
  });

  const contents = [...chatHistory, { role: 'user', parts: currentParts }];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: config
  });

  const sources: string[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => { if (chunk.web?.uri) sources.push(chunk.web.uri); });
  }

  return { text: response.text || "Erreur de réponse.", sources };
};

export const speakText = async (text: string): Promise<AudioBuffer | null> => {
    // Simplement implémenté pour éviter les erreurs
    return null;
};
