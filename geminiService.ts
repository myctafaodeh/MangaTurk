
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // Initialize AI client using process.env.API_KEY directly as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Using gemini-3-pro-preview for complex reasoning/translation tasks.
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  if (imageInput.startsWith('data:image')) {
    base64Data = imageInput.split(',')[1];
  } else if (imageInput.length > 500) {
    base64Data = imageInput;
  } else {
    return { bubbles: [] };
  }

  const systemInstruction = `Sen uzman bir Manga/Webtoon çeviri motorusun. 
Görseldeki tüm konuşma balonlarını ve metinleri bul. 
Hepsini ${targetLang} diline çevir. 
Yanıtın sadece JSON formatında olmalı. 
Koordinatlar [ymin, xmin, ymax, xmax] formatında 0-1000 arası olmalı.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Görseldeki metinleri tespit et ve ${targetLang} diline çevir.` }
        ],
      },
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

    // Access text property directly from the response.
    const text = response.text;
    if (!text) return { bubbles: [] };
    
    const parsed = JSON.parse(text.trim());
    return (parsed && parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("Gemini PRO Engine Error:", error);
    return { bubbles: [] };
  }
};
