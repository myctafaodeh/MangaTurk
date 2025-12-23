
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // Guidelines uyarınca process.env.API_KEY doğrudan kullanılıyor.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Karmaşık diller ve OCR için en güçlü model olan gemini-3-pro-preview tercih edildi.
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  if (imageInput.startsWith('data:image')) {
    base64Data = imageInput.split(',')[1];
  } else if (imageInput.length > 500) {
    base64Data = imageInput;
  } else {
    return { bubbles: [] };
  }

  // CJK (Chinese, Japanese, Korean) dilleri için optimize edilmiş sistem talimatı
  const systemInstruction = `Sen profesyonel bir Manga, Manhwa ve Manhua çeviri motorusun. 
Görseldeki tüm metinleri (konuşma balonları, kutular, anlatımlar) tespit et.
Özellikle Japonca (JA), Çince (ZH) ve Korece (KO) dillerindeki dikey ve yatay yazıları hatasız algıla.
Metinleri duygu ve bağlamı koruyarak ${targetLang} diline çevir.
Yanıtın SADECE aşağıda tanımlanan JSON formatında olmalıdır. Başka hiçbir açıklama yapma.
Koordinatlar box_2d: [ymin, xmin, ymax, xmax] (0-1000 arası değerler).`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Lütfen bu görseldeki tüm metinleri ${targetLang} diline çevir ve koordinatlarını belirle.` }
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
                  translated_text: { type: Type.STRING },
                  confidence: { type: Type.NUMBER }
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
    if (!text) {
      console.warn("AI returned empty text");
      return { bubbles: [] };
    }
    
    const parsed = JSON.parse(text.trim());
    return (parsed && parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("MangaTurk Engine Error:", error);
    return { bubbles: [] };
  }
};
