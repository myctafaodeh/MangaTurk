
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { TranslationResult } from "./types";

/**
 * MangaTurk AI Engine
 * High-precision OCR and translation using Gemini models.
 */
export const translateMangaPage = async (
  imageInput: string,
  targetLang: string,
): Promise<TranslationResult> => {
  // Always initialize with API_KEY from environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-pro-preview for complex reasoning and layout-aware translation
  const modelName = 'gemini-3-pro-preview';

  let base64Data = "";
  try {
    if (imageInput.startsWith('data:image')) {
      base64Data = imageInput.split(',')[1];
    } else if (imageInput.length > 500) {
      base64Data = imageInput;
    } else {
      console.warn("Invalid image data provided.");
      return { bubbles: [] };
    }
  } catch (e) {
    console.error("Error processing image data:", e);
    return { bubbles: [] };
  }

  // System instruction optimized for manga/webtoon text detection and translation
  const systemInstruction = `You are a professional Manga/Webtoon translation engine. 
Your task is to detect all text in the image (speech bubbles, boxes, sound effects).
1. Auto-detect source language (focus on Japanese vertical/horizontal text, Korean, Chinese).
2. Translate text into ${targetLang} contextually.
3. Return output ONLY in JSON format.
4. Coordinates should be [ymin, xmin, ymax, xmax] (0-1000).
Even if no text is found, return a valid JSON with an empty "bubbles" array.`;

  try {
    console.log("Initiating Gemini API request...");
    
    // Always use ai.models.generateContent with model name and prompt
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `Detect all foreign text in the image and translate it into ${targetLang}.` }
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
                    description: "[ymin, xmin, ymax, xmax] 0-1000"
                  },
                  translated_text: { 
                    type: Type.STRING,
                    description: "The translated text content"
                  }
                },
                required: ["box_2d", "translated_text"],
                propertyOrdering: ["box_2d", "translated_text"]
              }
            }
          },
          required: ["bubbles"]
        }
      },
    });

    // Directly access the text property as per SDK guidelines (no .text() method)
    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received empty response from API.");
    }

    const parsed = JSON.parse(responseText.trim());
    
    if (!parsed.bubbles || !Array.isArray(parsed.bubbles)) {
      console.warn("No text bubbles detected in the response.");
      return { bubbles: [] };
    }

    console.log(`Successfully translated ${parsed.bubbles.length} text elements.`);
    return parsed as TranslationResult;

  } catch (error: any) {
    console.error("Gemini Engine Error:", error.message);
    return { bubbles: [] };
  }
};
