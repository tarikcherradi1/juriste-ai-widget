import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION, Mode, Attachment } from "./types.ts";

// Initialisation unique du client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateLegalResponse = async (
  prompt: string,
  mode: Mode,
  chatHistory: any[],
  attachments: Attachment[] = []
): Promise<{ text: string; sources?: string[] }> => {
  
  // Choix du modèle selon la complexité
  const modelName = mode === Mode.DEEP ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ googleSearch: {} }] // Toujours activer la recherche pour le droit
  };

  if (mode === Mode.DEEP) {
    config.thinkingConfig = { thinkingBudget: 16000 };
  }

  // Préparation des contenus (incluant les pièces jointes en tête)
  const currentParts: any[] = [];
  
  attachments.forEach(att => {
    currentParts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.data
      }
    });
  });

  currentParts.push({ text: prompt });

  const contents = [
    ...chatHistory,
    { role: 'user', parts: currentParts }
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: config
    });

    const sources: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) sources.push(chunk.web.uri);
      });
    }

    return { 
      text: response.text || "Désolé, je n'ai pas pu générer de réponse.", 
      sources 
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const speakText = async (text: string): Promise<AudioBuffer | null> => {
  try {
    // Nettoyage rapide du markdown pour la voix
    const cleanText = text.replace(/[#*`⚖️🏛️🔍💡]/g, '').slice(0, 1000);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Lis ceci avec une voix posée et professionnelle : ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// Helpers Audio internes
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
