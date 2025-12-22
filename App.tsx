
import React, { useState, useCallback, useRef } from 'react';
import MangaViewer from './MangaViewer';
import ControlPanel from './ControlPanel';
import { translateMangaPage } from './geminiService';
import { SpeechBubble, EngineSettings } from './types';

const App: React.FC = () => {
  const [bubbles, setBubbles] = useState<SpeechBubble[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState<string>("mangatrx.com");
  const [activeUrl, setActiveUrl] = useState<string>("https://mangatrx.com");
  const [isBrowserMode, setIsBrowserMode] = useState(true);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanY = useRef<number>(-5000);
  
  const [settings, setSettings] = useState<EngineSettings>({
    isEnabled: true,
    isAutoScan: true,
    qualityLevel: 'high',
    showOriginal: false,
    opacity: 0.95,
    fontSize: 16,
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
           // Sadece görünür alanın yakınındakileri tut, çok uzağı temizle (performans)
           const currentViewMin = scrollY - 2000;
           const currentViewMax = scrollY + 4000;
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
        setBubbles([]);
        processFrame(base64, 0, 800);
        setIsHeaderExpanded(false);
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
    setIsHeaderExpanded(false);
  };

  const handleScrollStop = useCallback((imgSource: string, scrollY: number, viewHeight: number) => {
    const scrollDiff = Math.abs(scrollY - lastScanY.current);
    if (scrollDiff > 450) {
      lastScanY.current = scrollY;
      processFrame(imgSource, scrollY, viewHeight);
    }
  }, [settings.isEnabled, isProcessing, settings.targetLanguage]);

  return (
    <div className="w-full h-full relative bg-black select-none">
      
      {/* APP HEADER */}
      <header className={`app-header transition-all duration-300 ${isHeaderExpanded ? 'h-[130px]' : 'h-[60px]'}`}>
        <div className="px-5 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between min-h-[60px]">
             <div className="flex flex-col" onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}>
                <h1 className="text-xl font-black italic tracking-tighter text-white">
                  MANGA<span className="text-blue-500">TURK</span>
                </h1>
                <div className="flex items-center space-x-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-ping' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`}></div>
                   <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">AI LIVE ACTIVE</span>
                </div>
             </div>

             <div className="flex items-center space-x-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center active:scale-90 border border-white/5">
                   <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <button onClick={() => setIsHeaderExpanded(!isHeaderExpanded)} className="w-8 h-8 flex items-center justify-center text-zinc-600">
                  <svg className={`w-6 h-6 transform transition-transform ${isHeaderExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                </button>
             </div>
          </div>

          {isHeaderExpanded && (
            <div className="pb-4 animate-in slide-in-from-top-4">
               <div className="flex items-center space-x-2 bg-black border border-white/10 rounded-2xl p-1">
                  <span className="pl-3 pr-2 text-blue-500 font-black text-[9px] tracking-widest uppercase opacity-50">URL</span>
                  <input 
                    type="text" 
                    value={browserUrl} 
                    onChange={(e) => setBrowserUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                    className="flex-1 bg-transparent py-2.5 text-white text-sm font-bold outline-none"
                    placeholder="site-adi.com"
                  />
                  <button onClick={handleNavigate} className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90">
                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
               </div>
            </div>
          )}
        </div>
      </header>

      {/* VIEWER CONTENT */}
      <main className={`app-content transition-all duration-300 ${isHeaderExpanded ? 'header-expanded' : ''}`}>
        <MangaViewer 
          bubbles={bubbles} 
          settings={settings} 
          isProcessing={isProcessing} 
          onScrollStop={handleScrollStop} 
          customImage={isBrowserMode ? null : customImage}
          activeUrl={isBrowserMode ? activeUrl : null}
        />
      </main>

      <ControlPanel settings={settings} setSettings={setSettings} isProcessing={isProcessing} />
    </div>
  );
};

export default App;
