
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranslationResult } from "../types";

async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'no-cors' }); 
    throw new Error("CORS Fallback");
  } catch (e) {
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  }
}

export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  let base64Data = "";
  if (imageInput.startsWith('data:image')) {
    base64Data = imageInput.split(',')[1];
  } else if (imageInput.startsWith('http')) {
    base64Data = await imageUrlToBase64(imageInput);
  } else {
    base64Data = imageInput;
  }

  const systemInstruction = `Sen profesyonel bir Manga ve Webtoon çeviri motorusun. 
Görevin: Görüntüdeki metinleri bulup ${targetLang} diline çevirmek.

KRİTİK TALİMATLAR:
1. DOĞALLIK: Çeviriler asla robotik olmamalı. "Wait" yerine "Dur bir dakika", "Massive power" yerine "Muazzam güç" gibi manga ruhuna uygun ifadeler kullan.
2. YERLEŞİM: Koordinatlar [ymin, xmin, ymax, xmax] orijinal metnin tam üstünde olmalı.
3. KISALIK: Baloncuklara sığması için anlamı bozmadan en vurucu ve kısa çeviriyi seç.
4. FORMAT: Sadece saf JSON döndür.

Örnek Çeviri Tarzı:
- "What is this?" -> "Bu da ne?" (Doğal)
- "It can't be!" -> "Olamaz!" veya "İmkansız!" (Vurucu)

JSON Yapısı: {"bubbles": [{"box_2d": [ymin, xmin, ymax, xmax], "translated_text": "...", "type": "speech"}]}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: `Görüntüyü tara, tüm metinleri doğal bir Türkçe ile çevir.` }
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    if (!response.text) return { bubbles: [] };

    let cleanJson = response.text.trim();
    if (cleanJson.includes('```')) {
      cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    return (parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    return { bubbles: [] };
  }
};
