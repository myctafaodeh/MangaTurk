
import React, { useState, useCallback, useRef } from 'react';
import MangaViewer from './MangaViewer';
import ControlPanel from './ControlPanel';
import { translateMangaPage } from './geminiService';
import { SpeechBubble, EngineSettings } from './types';

const App: React.FC = () => {
  const [bubbles, setBubbles] = useState<SpeechBubble[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState<string>("mangatrx.com/manga/solo-leveling");
  const [isBrowserMode, setIsBrowserMode] = useState(true);
  
  const viewerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanY = useRef<number>(-2000);
  
  const [settings, setSettings] = useState<EngineSettings>({
    isEnabled: true,
    isAutoScan: true,
    qualityLevel: 'high',
    showOriginal: false,
    opacity: 0.95,
    fontSize: 14,
    sourceLanguage: 'auto',
    targetLanguage: 'Turkish',
    uiScale: 1.0
  });

  const processFrame = async (imageSrc: string, scrollY: number, viewHeight: number) => {
    if (isProcessing || !settings.isEnabled) return;
    setIsProcessing(true);
    try {
      const result = await translateMangaPage(imageSrc, settings.targetLanguage);
      if (result && result.bubbles) {
        const processed = result.bubbles.map((b) => ({
            ...b,
            id: `b-${Math.random().toString(36).substr(2, 9)}`,
            absoluteY: scrollY + (b.box_2d[0] / 1000) * viewHeight
        }));
        setBubbles(prev => {
           const currentViewMin = scrollY - 1000;
           const currentViewMax = scrollY + 2000;
           const filtered = prev.filter(p => (p.absoluteY || 0) > currentViewMin && (p.absoluteY || 0) < currentViewMax);
           return [...filtered, ...processed];
        });
      }
    } catch (err) {
      console.error("AI Translation Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCustomImage(base64);
        setIsBrowserMode(false);
        processFrame(base64, 0, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScrollStop = useCallback((imgSource: string, scrollY: number, viewHeight: number) => {
    const scrollDiff = Math.abs(scrollY - lastScanY.current);
    if (scrollDiff > 350) {
      lastScanY.current = scrollY;
      processFrame(imgSource, scrollY, viewHeight);
    }
  }, [settings.isEnabled, isProcessing, settings.targetLanguage]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#050507] overflow-hidden select-none font-sans safe-top">
      <div className="w-full max-w-md pt-8 pb-4 px-6 bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 z-30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic text-white tracking-tighter uppercase">
              MANGA<span className="text-blue-500">TURK</span> <span className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full not-italic tracking-normal ml-1">AI PRO</span>
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-ping' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`}></div>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                {isProcessing ? 'AI ENGINE: PROCESSING' : 'AI ENGINE: STANDBY'}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-zinc-800/50 border border-white/10 rounded-2xl flex items-center justify-center active:scale-95 transition-all">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={() => { setIsBrowserMode(!isBrowserMode); setBubbles([]); }} className={`w-10 h-10 border rounded-2xl flex items-center justify-center active:scale-95 transition-all ${isBrowserMode ? 'bg-blue-600 border-blue-400 shadow-[0_8px_20px_rgba(37,99,235,0.4)]' : 'bg-zinc-800/50 border-white/10'}`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            </button>
          </div>
        </div>
        {isBrowserMode && (
          <div className="flex items-center bg-black/60 border border-white/5 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-blue-500 font-black text-[9px] mr-3 tracking-widest">LIVE</span>
            <input 
              type="text" 
              value={browserUrl} 
              onChange={(e) => setBrowserUrl(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-zinc-300 flex-1 focus:outline-none italic"
              spellCheck="false"
            />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-2"></div>
          </div>
        )}
      </div>
      <div className="w-full flex-grow flex items-center justify-center relative z-10 px-4">
        <MangaViewer 
            ref={viewerRef} 
            bubbles={bubbles} 
            settings={settings} 
            isProcessing={isProcessing} 
            onScrollStop={handleScrollStop} 
            customImage={isBrowserMode ? null : customImage}
        />
      </div>
      <ControlPanel settings={settings} setSettings={setSettings} isProcessing={isProcessing} />
      <div className="w-full flex justify-center pb-6 pt-2 safe-bottom">
        <div className="w-28 h-1.5 bg-white/10 rounded-full"></div>
      </div>
    </div>
  );
};

export default App;
