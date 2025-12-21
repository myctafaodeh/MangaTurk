
export interface SpeechBubble {
  id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  original_text: string;
  translated_text: string;
  type: 'speech' | 'thought' | 'narrative';
  confidence: number;
  absoluteY?: number; // Sayfanın en başından olan mutlak piksel konumu
}

export interface TranslationResult {
  bubbles: SpeechBubble[];
  context_analysis?: string;
}

export interface EngineSettings {
  isEnabled: boolean;
  isAutoScan: boolean;
  qualityLevel: 'balanced' | 'high' | 'fast';
  showOriginal: boolean;
  opacity: number;
  fontSize: number;
  sourceLanguage: string;
  targetLanguage: string;
  uiScale: number; // 0.7 to 1.2
}
