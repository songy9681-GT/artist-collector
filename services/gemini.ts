
import { GoogleGenAI, Type } from "@google/genai";

// Task: Basic concise insights. Use gemini-3-flash-preview.
export const askGemini = async (prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class art historian. Provide concise, expert insights.",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to connect to Gemini.";
  }
};

// Task: Complex structured data extraction. Use gemini-3-pro-preview.
export const enrichArtistProfile = async (query: string, snippet: string, artworkTitles: string[] = []) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct a prompt that includes the image titles found by Google
    const artworkContext = artworkTitles.length > 0 
      ? `Additionally, I found images with these titles: ${JSON.stringify(artworkTitles)}. For the 'artworksMetadata' field, try to identify the Name, Year, and Media for these specific 3 artworks in order. If the title is vague, provide the most likely famous work that matches or just clean up the title.` 
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Search Result for "${query}": ${snippet}\n\n${artworkContext}\n\nBased on this, generate a structured artist profile in JSON format. Provide specific genre, style, media, and topics tags. Also provide a comprehensive introductory biography in both English and Chinese.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nameCN: { type: Type.STRING },
            introEN: { type: Type.STRING, description: "A detailed introductory biography in English (approx 100-150 words)." },
            introCN: { type: Type.STRING, description: "A detailed introductory biography in Chinese (approx 100-150 words)." },
            genreTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Artist's movement or genre (e.g. Impressionism)" },
            styleTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific stylistic keywords" },
            mediaTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Materials used (e.g. Oil on Canvas, Installation)" },
            topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recurring themes in their work" },
            visualElements: { type: Type.ARRAY, items: { type: Type.STRING } },
            techniquesCN: { type: Type.STRING },
            techniquesEN: { type: Type.STRING },
            artworksMetadata: {
              type: Type.ARRAY,
              description: "Metadata for the 3 detected artworks in order.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  year: { type: Type.STRING },
                  media: { type: Type.STRING }
                }
              }
            }
          },
          required: ["nameCN", "introEN", "introCN", "genreTags", "styleTags", "mediaTags", "topics", "visualElements"]
        }
      }
    });
    
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Enrichment Error:", error);
    return null;
  }
};
