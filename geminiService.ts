
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranslationResult } from "./types";

export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Hız için Flash, kalite için gerekirse Pro'ya çekilebilir
  const modelName = 'gemini-3-flash-preview';

  let base64Data = "";
  if (imageInput.startsWith('data:image')) {
    base64Data = imageInput.split(',')[1];
  } else if (imageInput.length > 500) {
    base64Data = imageInput;
  } else {
    // URL durumunda (iframe engelliyken) çeviri için ekran görüntüsü şart
    return { bubbles: [] };
  }

  const systemInstruction = `Sen Manga/Webtoon çeviri uzmanısın. 
Görüntüdeki konuşma balonlarını tespit et ve ${targetLang} diline çevir.
YANIT KURALLARI:
1. SADECE JSON döndür. 
2. Markdown bloğu (\`\`\`json) KULLANMA.
3. Koordinatlar (box_2d) [ymin, xmin, ymax, xmax] (0-1000 arası) olmalıdır.
4. Format: {"bubbles": [{"box_2d": [y1, x1, y2, x2], "translated_text": "..."}]}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Data } },
            { text: `Çeviriyi JSON olarak yap.` }
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return { bubbles: [] };
    
    // JSON Temizleme (Ekstra güvenlik)
    const cleanJson = text.trim()
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    return (parsed && parsed.bubbles ? parsed : { bubbles: [] }) as TranslationResult;

  } catch (error: any) {
    console.error("Gemini AI Engine Error:", error);
    return { bubbles: [] };
  }
};
