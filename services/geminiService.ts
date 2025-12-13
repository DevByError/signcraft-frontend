import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateMarketingCopy = async (topic: string, tone: string = 'professional'): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Configuration Error: Missing API Key";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, punchy marketing headline (max 10 words) for a digital sign about: "${topic}". Tone: ${tone}. Do not include quotes.`,
    });
    return response.text?.trim() || "Could not generate text.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please try again.";
  }
};

export const suggestLayoutDescription = async (context: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Configuration Error";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest a color palette (3 colors hex codes) and a design style for a digital signage about: "${context}". Format: 'Primary: #HEX, Secondary: #HEX, Accent: #HEX. Style: [Description]'`,
    });
    return response.text?.trim() || "Could not generate suggestions.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating suggestions.";
  }
};