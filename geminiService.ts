
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

/**
 * MangaTurk AI PRO Engine
 * APK ortamında yüksek kararlılık ve kesin çeviri protokolü.
 * Bu modül İngilizce dahil tüm metinleri istisnasız çevirir.
 */
export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // API anahtarı güvenli ortam değişkeninden (process.env.API_KEY) alınır.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // En yüksek doğruluk ve karmaşık OCR başarısı için Pro model.
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  try {
    if (imageInput.startsWith('data:image')) {
      base64Data = imageInput.split(',')[1];
    } else if (imageInput.length > 500) {
      // Base64 ham veri gelmiş olabilir
      base64Data = imageInput;
    } else {
      // Eğer bir URL gelmişse veya veri çok kısaysa hata fırlat
      throw new Error("Görsel verisi geçersiz veya çok kısa (URL gönderilmiş olabilir).");
    }
  } catch (e: any) {
    console.error("[MangaTurk-Engine] Input Hatası:", e.message);
    throw e;
  }

  // ZORUNLU TALİMAT: Kullanıcının talep ettiği katı kuralları uygula.
  const systemInstruction = `You are a professional OCR and translation engine for Manga and Webtoon images.
Your task is NOT optional.

STRICT RULES — FOLLOW ALL OF THEM:

1. Detect ALL visible text in the image.
   This includes Japanese, Korean, Chinese, English, numbers, sound effects, signs, UI text, and small background text.

2. Translate EVERY detected text into the target language: ${targetLang}.
   - Even if the text is already English, you MUST translate it.
   - Never keep the original language.

3. NEVER skip text.
   Skipping text, ignoring text, or partially translating is a FAILURE.

4. NEVER summarize.
   NEVER explain.
   NEVER add notes.
   NEVER add comments.
   Output ONLY the required JSON.

5. Output MUST be valid JSON and MUST follow the schema exactly.

6. If NO text is detected, return:
   { "bubbles": [] }
   You are NOT allowed to return an empty response.

7. Each detected text block MUST include:
   - box_2d: [ymin, xmin, ymax, xmax] scaled from 0 to 1000
   - translated_text: fully translated string

8. Coordinates must reflect the real position of the text in the image.
   Do NOT guess randomly.

9. You are FORBIDDEN from refusing, staying silent, or returning partial data.

10. Failure to output valid JSON is NOT acceptable.`;

  try {
    console.log(`[MangaTurk-Engine] İstek: Model=${modelName}, Hedef=${targetLang}`);
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Görseldeki her şeyi tespit et ve ${targetLang} diline çevir. Çıktı formatı kesinlikle JSON olmalı.` }
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
                    description: "[ymin, xmin, ymax, xmax] coordinates"
                  },
                  translated_text: { 
                    type: Type.STRING,
                    description: "Translated string"
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

    const responseText = response.text;
    
    if (!responseText || responseText.trim() === "") {
      console.error("[MangaTurk-Engine] API Boş Yanıt Döndürdü!");
      throw new Error("API_RETURNED_EMPTY_CONTENT");
    }

    console.log("[MangaTurk-Engine] Yanıt:", responseText);

    const parsed = JSON.parse(responseText.trim());
    
    if (!parsed.bubbles) {
      throw new Error("INVALID_JSON_STRUCTURE_NO_BUBBLES");
    }

    return parsed as TranslationResult;

  } catch (error: any) {
    console.error("[MangaTurk-Engine] Kritik Çeviri Hatası:", {
      message: error.message,
      status: error.status || "Unknown",
    });
    throw error;
  }
};
