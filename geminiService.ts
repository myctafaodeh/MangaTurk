
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // En güçlü model gemini-3-pro-preview ile hassas OCR ve çeviri
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  if (imageInput.startsWith('data:image')) {
    base64Data = imageInput.split(',')[1];
  } else if (imageInput.length > 500) {
    base64Data = imageInput;
  } else {
    // URL durumlarında çeviri şimdilik pasif (iframe engeli nedeniyle)
    return { bubbles: [] };
  }

  // AI'nın sadece JSON döndürmesini sağlayan kesin talimat
  const systemInstruction = `Sen Manga ve Webtoon çeviri motorusun. 
Görüntüdeki metinleri (konuşma balonları, anlatımlar) tespit et.
Metinleri ${targetLang} diline, karakterlerin duygularını koruyarak çevir.
YANIT SADECE SAF JSON OLMALIDIR. MARKDOWN KULLANMA.
Koordinatlar box_2d: [ymin, xmin, ymax, xmax] (0-1000 arası değerler).`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: `Görseldeki tüm konuşmaları ${targetLang} diline çevirip koordinatlarıyla ver.` }
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        // YAPISAL ÇIKTI: AI'nın yanlış format döndürmesini engeller
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
        },
        thinkingConfig: { thinkingBudget: 0 } // Hız için düşünme bütçesi kapalı
      },
    });

    const text = response.text;
    if (!text) return { bubbles: [] };
    
    // JSON'u güvenli şekilde ayrıştır
    const parsed = JSON.parse(text.trim());
    return (parsed && parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("Gemini PRO Engine Error:", error);
    return { bubbles: [] };
  }
};
