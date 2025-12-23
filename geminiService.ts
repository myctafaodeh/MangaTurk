
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
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
    return { bubbles: [] };
  }

  const systemInstruction = `Sen Manga ve Webtoon çeviri uzmanısın. Görüntüdeki konuşma balonlarını (speech bubbles) tespit et ve içindeki metinleri ${targetLang} diline çevir. 
  Yanıtın SADECE JSON formatında olmalı. Markdown kullanma. 
  Koordinatlar [ymin, xmin, ymax, xmax] şeklinde 0-1000 arasında olmalı.
  JSON Yapısı: {"bubbles": [{"box_2d": [y1, x1, y2, x2], "translated_text": "..."}]}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: `Lütfen bu sayfadaki tüm konuşma balonlarını bul ve ${targetLang} diline çevir. Yanıt sadece saf JSON olsun.` }
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bubbles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  translated_text: { type: Type.STRING }
                },
                required: ["box_2d", "translated_text"]
              }
            }
          },
          required: ["bubbles"]
        }
      },
    });

    const text = response.text;
    if (!text) return { bubbles: [] };
    
    // JSON Temizleme
    const cleanJson = text.trim()
      .replace(/^```json/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    console.log("AI Response Parsed:", parsed);
    return (parsed && parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("Gemini Translation Error:", error);
    return { bubbles: [] };
  }
};
