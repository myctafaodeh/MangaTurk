
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranslationResult } from "./types";

export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const modelName = 'gemini-3-flash-preview';

  let base64Data = "";
  if (imageInput.startsWith('data:image')) {
    base64Data = imageInput.split(',')[1];
  } else if (imageInput.length > 500) {
    base64Data = imageInput;
  } else {
    // URL durumunda (iframe'deysek) şimdilik çeviri yapamaz, 
    // kullanıcıya ekran görüntüsü aldırmak en iyisi
    return { bubbles: [] };
  }

  const systemInstruction = `Sen profesyonel bir Manga ve Webtoon çeviri motorusun. 
Görüntüdeki konuşma balonlarını tespit et ve metinleri ${targetLang} diline çevir.
ÖNEMLİ: Yanıtı SADECE saf JSON formatında döndür. Markdown blokları ( \`\`\`json ) kullanma. 
Format: { "bubbles": [ { "box_2d": [ymin, xmin, ymax, xmax], "translated_text": "..." } ] } 
Koordinatlar 0-1000 arasında olmalıdır.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: `Görüntüyü analiz et ve balonları çevir.` }
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return { bubbles: [] };
    
    // JSON parse işlemi öncesi temizlik
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    return (parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("AI Error:", error);
    return { bubbles: [] };
  }
};
