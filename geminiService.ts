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
  } else {
    base64Data = imageInput;
  }

  const systemInstruction = `Sen profesyonel bir Manga çeviri motorusun.
Görevin: Görüntüdeki konuşma balonlarını bul ve ${targetLang} diline çevir.
Kurallar: Sadece JSON döndür. Koordinatlar 0-1000 arası [ymin, xmin, ymax, xmax].`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: `Çeviriyi JSON olarak yap.` }
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
    
    // Markdown bloklarını temizle
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    return (parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("AI Error:", error);
    return { bubbles: [] };
  }
};
