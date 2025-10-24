
import { GoogleGenAI, Type } from "@google/genai";
import { CATEGORIES } from '../constants';
import { PunchlistItemCategory } from '../types';

// The API key is injected from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface ParsedVoiceCommand {
  room: string;
  description: string;
  category: PunchlistItemCategory;
}

export const parseVoiceCommand = async (command: string): Promise<ParsedVoiceCommand | null> => {
  if (!command) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following voice command from a construction site manager. Extract the room number or location, a description of the issue, and the responsible trade/category. The command is: "${command}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            room: {
              type: Type.STRING,
              description: "The room number or location of the issue. E.g., '101', 'Lobby', 'Kitchen'."
            },
            description: {
              type: Type.STRING,
              description: "A detailed description of the construction issue or snag."
            },
            category: {
              type: Type.STRING,
              description: "The trade category responsible for fixing the issue.",
              enum: CATEGORIES,
            }
          },
          required: ["room", "description", "category"]
        },
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        console.error("Gemini returned empty JSON text.");
        return null;
    }
    const parsed = JSON.parse(jsonText) as ParsedVoiceCommand;
    return parsed;
  } catch (error) {
    console.error("Error parsing voice command with Gemini:", error);
    return null;
  }
};
