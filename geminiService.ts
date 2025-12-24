
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

/**
 * MangaTurk AI PRO Engine
 * APK ortamında yüksek kararlılık ve zorunlu çeviri protokolü.
 */
export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // APK ortamında process.env.API_KEY otomatik olarak inject edilir.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // En yüksek doğruluk ve OCR başarısı için Pro model kullanılır.
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  try {
    if (imageInput.startsWith('data:image')) {
      base64Data = imageInput.split(',')[1];
    } else if (imageInput.length > 500) {
      base64Data = imageInput;
    } else {
      throw new Error("Geçersiz görsel verisi.");
    }
  } catch (e: any) {
    console.error("[ENGINE-ERR] Görsel işleme hatası:", e.message);
    return { bubbles: [] };
  }

  // ZORUNLU TALİMAT: İngilizce olsa bile çevir, asla sessiz kalma.
  const systemInstruction = `You are a professional translation engine for Manga and Webtoons.
STRICT RULES:
1. Detect ALL text in the image (Japanese, Korean, Chinese, and ESPECIALLY English).
2. Translate EVERY detected text into ${targetLang}. 
3. DO NOT skip English text. Even if the text is already English, you MUST translate it into ${targetLang}.
4. DO NOT summarize. DO NOT add notes. Only return the translated text in the JSON structure.
5. Coordinates: [ymin, xmin, ymax, xmax] on a 0-1000 scale.
6. If the image contains text, you MUST produce a translation. Failing to translate is not an option.`;

  try {
    console.log(`[ENGINE-LOG] İstek gönderiliyor: Model=${modelName}, Hedef=${targetLang}`);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Detect all text and translate to ${targetLang}. Output JSON.` }
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
                    description: "Coordinates [ymin, xmin, ymax, xmax]"
                  },
                  translated_text: { 
                    type: Type.STRING,
                    description: "Mandatory translation"
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

    // response.text property'si candidates[0].content.parts[0].text içeriğini getirir.
    const responseText = response.text;
    
    if (!responseText || responseText.trim() === "") {
      console.error("[ENGINE-ERR] API boş yanıt döndürdü.");
      throw new Error("API_EMPTY_RESPONSE");
    }

    console.log("[ENGINE-LOG] Ham Yanıt Alındı:", responseText);

    const parsed = JSON.parse(responseText.trim());
    
    if (!parsed.bubbles || !Array.isArray(parsed.bubbles)) {
      throw new Error("INVALID_JSON_STRUCTURE");
    }

    return parsed as TranslationResult;

  } catch (error: any) {
    console.error("[ENGINE-CRITICAL] Çeviri Zinciri Kırıldı:", {
      message: error.message,
      code: error.status || "UNKNOWN"
    });
    // Hata durumunda sessiz kalma, hatayı yukarı fırlat
    throw error;
  }
};
