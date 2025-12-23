
import React, { useState, useCallback, useRef, useEffect } from 'react';
import MangaViewer from './MangaViewer';
import ControlPanel from './ControlPanel';
import { translateMangaPage } from './geminiService';
import { SpeechBubble, EngineSettings } from './types';

const App: React.FC = () => {
  const [bubbles, setBubbles] = useState<SpeechBubble[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState<string>("mangatrx.com");
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [isBrowserMode, setIsBrowserMode] = useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanY = useRef<number>(-5000);
  
  const [settings, setSettings] = useState<EngineSettings>({
    isEnabled: true,
    isAutoScan: true,
    qualityLevel: 'high',
    showOriginal: false,
    opacity: 0.90,
    fontSize: 16,
    sourceLanguage: 'auto',
    targetLanguage: 'Turkish',
    uiScale: 1.0
  });

  const runTranslation = async (imageSrc: string, scrollY: number, viewHeight: number) => {
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
           const currentViewMin = scrollY - 2000;
           const currentViewMax = scrollY + 4000;
           const filtered = prev.filter(p => (p.absoluteY || 0) > currentViewMin && (p.absoluteY || 0) < currentViewMax);
           return [...filtered, ...processed];
        });
      }
    } catch (err) {
      console.error("AI Scan Error:", err);
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
        setBubbles([]);
        setIsHeaderOpen(false);
        // İlk kareyi hemen tara
        runTranslation(base64, 0, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNavigate = () => {
    let url = browserUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    setActiveUrl(url);
    setIsBrowserMode(true);
    setBubbles([]);
    setIsHeaderOpen(false);
  };

  const onScrollUpdate = useCallback((imgSource: string, scrollY: number, viewHeight: number) => {
    const scrollDiff = Math.abs(scrollY - lastScanY.current);
    if (scrollDiff > 500) {
      lastScanY.current = scrollY;
      runTranslation(imgSource, scrollY, viewHeight);
    }
  }, [settings.isEnabled, isProcessing, settings.targetLanguage]);

  return (
    <div className="w-full h-full relative bg-[#050507]">
      
      {/* HEADER */}
      <header className={`app-header transition-all duration-500 ease-out ${isHeaderOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="px-6 h-[70px] flex items-center justify-between">
           <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter text-white">MANGA<span className="text-blue-500">TURK</span></h1>
              <div className="flex items-center space-x-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
                 <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">AI ENGINE ACTIVE</span>
              </div>
           </div>

           <div className="flex items-center space-x-3">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 active:scale-90 transition-all">
                 <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              <button onClick={() => setIsHeaderOpen(false)} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 active:scale-90">
                 <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"/></svg>
              </button>
           </div>
        </div>

        <div className="px-6 pb-4">
           <div className="flex items-center space-x-2 bg-black/50 border border-white/10 rounded-2xl p-1.5">
              <input 
                type="text" 
                value={browserUrl} 
                onChange={(e) => setBrowserUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                className="flex-1 bg-transparent px-3 text-sm font-bold text-white outline-none"
                placeholder="mangatrx.com"
              />
              <button onClick={handleNavigate} className="bg-blue-600 px-4 py-2.5 rounded-xl text-[10px] font-black shadow-lg">GİT</button>
           </div>
        </div>
      </header>

      {/* HEADER TOGGLE BUTTON (GIZLIYKEN GOZUKUR) */}
      {!isHeaderOpen && (
        <button 
          onClick={() => setIsHeaderOpen(true)}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[1100] bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full active:scale-90 transition-all"
        >
          <div className="w-8 h-1 bg-zinc-700 rounded-full"></div>
        </button>
      )}

      {/* MAIN VIEWER */}
      <main className="app-content">
        <MangaViewer 
          bubbles={bubbles} 
          settings={settings} 
          isProcessing={isProcessing} 
          onScrollStop={onScrollUpdate} 
          customImage={isBrowserMode ? null : customImage}
          activeUrl={isBrowserMode ? activeUrl : null}
        />
      </main>

      <ControlPanel settings={settings} setSettings={setSettings} isProcessing={isProcessing} />
    </div>
  );
};

export default App;
