
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

/**
 * MangaTurk AI PRO - Çeviri Motoru
 * Kritik: Tüm metinleri istisnasız hedef dile çevirir.
 */
export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // Guidelines: API anahtarını doğrudan process.env'den al
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // En gelişmiş çeviri ve OCR kabiliyeti için Pro model
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  try {
    if (imageInput.startsWith('data:image')) {
      base64Data = imageInput.split(',')[1];
    } else if (imageInput.length > 500) {
      base64Data = imageInput;
    } else {
      throw new Error("Görsel verisi eksik veya hatalı.");
    }
  } catch (e: any) {
    console.error("[MangaTurk-Engine] Input Hatası:", e.message);
    return { bubbles: [] };
  }

  // Kesin talimatlar: İngilizce dahil her şeyi çevir, asla sessiz kalma.
  const systemInstruction = `You are a professional Manga/Webtoon translation engine.
Your absolute rules:
1. Detect ALL text in the provided image (Japanese vertical/horizontal, English, sound effects, narrative).
2. Translate EVERY detected text to ${targetLang}. 
3. IMPORTANT: DO NOT skip English text. Even if the text is already English, translate it into ${targetLang}.
4. Output MUST be a valid JSON. 
5. Coordinates must be [ymin, xmin, ymax, xmax] in 0-1000 scale.
6. DO NOT explain the translation. DO NOT summarize. Only return the translated text.`;

  try {
    console.log(`[MangaTurk-Engine] İstek başlatılıyor: ${targetLang} diline çeviri...`);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Görseldeki tüm yabancı ve İngilizce metinleri tespit et ve ${targetLang} diline çevir.` }
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
                    description: "[ymin, xmin, ymax, xmax] normalize 0-1000"
                  },
                  translated_text: { 
                    type: Type.STRING,
                    description: "Translated content. Mandatory output."
                  },
                  original_text: {
                    type: Type.STRING,
                    description: "Detected original text"
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

    // .text property'si doğrudan yanıtı döndürür (metot değildir)
    const responseText = response.text;
    
    console.group("[MangaTurk-Engine] API Yanıt Detayı");
    console.log("Raw Response:", responseText);
    console.groupEnd();

    if (!responseText) {
      throw new Error("API'den boş yanıt (Empty Response) döndü.");
    }

    const parsed = JSON.parse(responseText.trim());
    
    if (!parsed.bubbles || !Array.isArray(parsed.bubbles)) {
      throw new Error("JSON parse başarılı ancak bubbles dizisi bulunamadı.");
    }

    if (parsed.bubbles.length === 0) {
      console.warn("[MangaTurk-Engine] Görselde metin tespit edilemedi.");
    }

    return parsed as TranslationResult;

  } catch (error: any) {
    console.error("[MangaTurk-Engine] Kritik Hata:", {
      message: error.message,
      status: error.status || "N/A",
      stack: error.stack
    });
    // Sessiz kalma, hatayı fırlat ki UI bilsin
    throw error;
  }
};
