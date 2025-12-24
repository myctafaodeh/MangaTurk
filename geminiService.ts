
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

/**
 * MangaTurk AI PRO - Motor v4.0
 * Kural: Gördüğün her şeyi (İngilizce dahil) çevir, asla sessiz kalma.
 */
export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  try {
    if (imageInput.startsWith('data:image')) {
      base64Data = imageInput.split(',')[1];
    } else if (imageInput.length > 500) {
      base64Data = imageInput;
    } else {
      throw new Error("Görsel verisi eksik veya geçersiz URL.");
    }
  } catch (e: any) {
    console.error("[ENGINE] Giriş Hatası:", e.message);
    throw e;
  }

  const systemInstruction = `You are a world-class Manga/Webtoon translator.
STRICT COMMANDS:
1. Detect ALL text in the image (Japanese, Korean, Chinese, English, UI, SFX).
2. Translate EVERY detected text into ${targetLang}. 
3. MANDATORY: Even if the text is English, translate it to ${targetLang}. Do NOT leave original English text.
4. Output ONLY valid JSON in the specified format. 
5. If no text, return {"bubbles": []}.
6. box_2d: [ymin, xmin, ymax, xmax] 0-1000.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Detect all text and translate into ${targetLang}. JSON output only.` }
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

    const responseText = response.text;
    if (!responseText) return { bubbles: [] };

    const parsed = JSON.parse(responseText.trim());
    return (parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("[ENGINE] Kritik Hata:", error.message);
    throw error;
  }
};
