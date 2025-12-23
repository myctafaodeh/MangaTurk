
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

/**
 * MangaTurk AI Core
 * Bu modül Japonca, Korece ve Çince metinleri görselden okuyup çevirir.
 */
export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // SDK gereği API_KEY doğrudan process.env üzerinden okunmalı.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Karmaşık OCR ve çeviri görevleri için en güçlü model.
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  try {
    if (imageInput.startsWith('data:image')) {
      base64Data = imageInput.split(',')[1];
    } else if (imageInput.length > 500) {
      base64Data = imageInput;
    } else {
      console.warn("[Gemini] Geçersiz görsel verisi.");
      return { bubbles: [] };
    }
  } catch (e) {
    console.error("[Gemini] Base64 parse hatası:", e);
    return { bubbles: [] };
  }

  // Manga/Webtoon formatına özel sistem talimatı
  const systemInstruction = `Sen profesyonel bir Manga/Webtoon OCR ve çeviri motorusun. 
Görevin: Görseldeki tüm Japonca, Korece, Çince ve İngilizce metinleri tespit et.
1. Dikey ve yatay metinleri (tategaki/yokogaki) doğru kutulara al.
2. Metinleri ${targetLang} diline, karakterlerin duygularını koruyarak çevir.
3. Çıktıyı SADECE JSON formatında ver.
4. Koordinatlar box_2d: [ymin, xmin, ymax, xmax] şeklinde ve 0-1000 aralığında olmalı.`;

  try {
    console.log("[Gemini] İstek gönderiliyor...");
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Detect and translate all text to ${targetLang}. Output JSON.` }
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
                  box_2d: { 
                    type: Type.ARRAY, 
                    items: { type: Type.NUMBER },
                    description: "[ymin, xmin, ymax, xmax] normalize values 0-1000"
                  },
                  translated_text: { 
                    type: Type.STRING,
                    description: "Translated content in target language"
                  }
                },
                required: ["box_2d", "translated_text"]
              }
            }
          },
          required: ["bubbles"]
        }
      },
    });

    // SDK: .text() bir metod değil, bir property'dir.
    const responseText = response.text;
    
    if (!responseText) {
      console.error("[Gemini] Boş yanıt.");
      return { bubbles: [] };
    }

    const parsed = JSON.parse(responseText.trim());
    
    if (!parsed.bubbles || !Array.isArray(parsed.bubbles)) {
      return { bubbles: [] };
    }

    return parsed as TranslationResult;

  } catch (error: any) {
    console.error("[Gemini] API Hatası:", error.message);
    return { bubbles: [] };
  }
};
