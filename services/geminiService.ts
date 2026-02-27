import { GoogleGenAI, Type } from "@google/genai";
import { UIComponent } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is expected to be present.
// If the key is missing, the functions will throw or fail gracefully.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateComponentName = async (component: UIComponent): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning default name.");
    return component.name;
  }

  try {
    // Extract base64 data from DataURL
    const base64Data = component.imageBase64.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          {
            text: "Identify this specific UI element. Provide a concise, 1-3 word name (e.g., 'Submit Button', 'User Avatar', 'Search Bar', 'Navigation Link'). Do not include articles like 'A' or 'The'."
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING }
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return json.name || component.name;

  } catch (error) {
    console.error("Gemini Naming Error:", error);
    return component.name; // Fallback
  }
};

/**
 * Bulk rename components.
 * To avoid hitting rate limits, we process them in small batches or sequentially.
 */
export const bulkRenameComponents = async (
  components: UIComponent[], 
  onProgress: (index: number, name: string) => void
) => {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    // Skip if it looks like it was already named (basic heuristic, optional)
    if (!comp.name.startsWith('Component ')) {
        continue;
    }
    
    const newName = await generateComponentName(comp);
    onProgress(i, newName);
    
    // Tiny delay to be nice to the rate limiter if needed, though Flash is fast.
    await new Promise(r => setTimeout(r, 200)); 
  }
};

export const generateReferenceImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};