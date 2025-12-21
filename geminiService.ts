
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranslationResult } from "./types";

export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // APK build aşamasında API_KEY güvenli bir şekilde enjekte edilir.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  let base64Data = "";
  if (imageInput.startsWith('data:image')) {
    base64Data = imageInput.split(',')[1];
  } else {
    base64Data = imageInput;
  }

  const systemInstruction = `Sen profesyonel bir Manga ve Webtoon çeviri motorusun. 
Görevin: Görüntüdeki tüm Japonca/Korece metin kutularını (speech bubbles) bul, OCR yap ve ${targetLang} diline çevir.
Kurallar:
1. Sadece JSON formatında yanıt ver.
2. Koordinatlar [ymin, xmin, ymax, xmax] formatında 0-1000 arasında olsun.
3. Onomatopeleri (ses efektlerini) çevirme, sadece konuşma balonlarını ve anlatıcı metinlerini çevir.
4. Çeviriler doğal, akıcı ve manga jargonuna uygun olsun.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: `Bu manga sayfasındaki metinleri ${targetLang} diline çevir ve JSON olarak döndür.` }
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text;
    if (!textOutput) return { bubbles: [] };
    
    const parsed = JSON.parse(textOutput.trim());
    return (parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("Manga AI Engine Error:", error);
    return { bubbles: [] };
  }
};
