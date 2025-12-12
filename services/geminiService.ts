import { GoogleGenAI } from "@google/genai";
import { Secret } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateRumor = async (
  unlockedSecrets: Secret[],
  lockedSecrets: Secret[],
  playerStats: any
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "The spirits are silent (Missing API Key).";

  // Filter out super hard secrets for early game if needed, or just pick random
  if (lockedSecrets.length === 0) return "You have found every secret I know of! You are a legend!";

  const targetSecret = lockedSecrets[Math.floor(Math.random() * lockedSecrets.length)];

  const prompt = `
    You are a mysterious, slightly crazy old sage in a pixel RPG called 'Secret Hunters'.
    The player is asking for a rumor or hint.
    
    Here is the secret they should look for:
    Secret Name: ${targetSecret.title}
    Secret Hint Logic: ${targetSecret.hint}
    
    Current Player Stats: Level ${playerStats.level}, STR ${playerStats.str}, INT ${playerStats.int}.
    
    Generate a short, cryptic, atmospheric, and possibly humorous rumor (max 2 sentences) that hints at how to get this secret without explicitly stating the exact requirements. 
    Do not mention the secret name directly. Use RPG slang or mystical tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "The wind whispers... but I cannot hear it clearly.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "My mind is cloudy... try again later.";
  }
};

export const generateLore = async (secret: Secret): Promise<string> => {
  const ai = getClient();
  if (!ai) return secret.description;

  const prompt = `
    The player just unlocked a secret achievement called "${secret.title}" in the game 'Secret Hunters'.
    Description: ${secret.description}
    
    Write a funny or epic 1-sentence flavor text celebrating this achievement.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || secret.description;
  } catch (e) {
    return secret.description;
  }
}
