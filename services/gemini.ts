import { GoogleGenerativeAI } from "@google/generative-ai";

// ===========================================
// 🔑 您的新项目 Key (来自 "New house")
// (为了排除 Vercel 环境变量延迟，暂时直接写在这里，调试通了再改回去)
// ===========================================
const API_KEY = "AIzaSyBhVimwoZEjKGszfA1PgWhhwi7sVyDW51g"; 
// ===========================================

const genAI = new GoogleGenerativeAI(API_KEY);

// 🚨 关键改动：改用 gemini-pro (老版本模型)，它在英国比 1.5-flash 更容易调通
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function askGemini(message: string) {
  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Thinking...";
  }
}

export async function enrichArtistProfile(artistName: string, snippet: string, artworkTitles: string[]) {
  try {
    const prompt = `
      Act as an art expert. Analyze the artist "${artistName}".
      Context: ${snippet}
      Artworks: ${artworkTitles.join(", ")}.
      
      You must return ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json).
      
      JSON Structure:
      {
        "nameCN": "Artist Name in Chinese",
        "introEN": "Write a 3-sentence biography in English.",
        "introCN": "Write a 3-sentence biography in Chinese.",
        "movements": ["Movement 1", "Movement 2"],
        "materials": ["Material 1", "Material 2"],
        "themes": ["Theme 1", "Theme 2"],
        "techniquesEN": "Main technique (English)",
        "techniquesCN": "Main technique (Chinese)",
        "artworksMetadata": [
           {"title": "${artworkTitles[0] || 'Artwork 1'}", "year": "Year", "media": "Medium"},
           {"title": "${artworkTitles[1] || 'Artwork 2'}", "year": "Year", "media": "Medium"},
           {"title": "${artworkTitles[2] || 'Artwork 3'}", "year": "Year", "media": "Medium"}
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // 🧹 强力清洗逻辑：防止 AI 虽然返回了 JSON 但加了 markdown 符号
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON found in response");
    }

    const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Gemini Enrich Error:", error);
    return null;
  }
}
