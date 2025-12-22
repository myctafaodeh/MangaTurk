
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
  const [isMinimized, setIsMinimized] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanY = useRef<number>(-5000);
  
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
           const currentViewMin = scrollY - 2000;
           const currentViewMax = scrollY + 3000;
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
  };

  const handleScrollStop = useCallback((imgSource: string, scrollY: number, viewHeight: number) => {
    const scrollDiff = Math.abs(scrollY - lastScanY.current);
    if (scrollDiff > 450) {
      lastScanY.current = scrollY;
      processFrame(imgSource, scrollY, viewHeight);
    }
  }, [settings.isEnabled, isProcessing, settings.targetLanguage]);

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden safe-top">
      
      {/* PROFESSIONAL COLLAPSIBLE HEADER */}
      <div className={`glass-header transition-all duration-300 ease-in-out z-[100] ${isMinimized ? 'h-14' : 'pb-4'}`}>
        <div className="px-6 h-full flex flex-col justify-center max-w-lg mx-auto">
          
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
               <h1 className="text-xl font-black italic text-white tracking-tighter">
                 MANGA<span className="text-blue-500">TURK</span>
               </h1>
               {!isMinimized && (
                 <div className="flex items-center space-x-1 mt-0.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-ping' : 'bg-green-500 shadow-[0_0_5px_#22c55e]'}`}></div>
                   <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">AI ENGINE ACTIVE</span>
                 </div>
               )}
            </div>

            <div className="flex items-center space-x-2">
               {!isMinimized && (
                 <>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all">
                     <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </button>
                   <button 
                     onClick={() => setIsBrowserMode(!isBrowserMode)}
                     className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isBrowserMode ? 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-zinc-900 border-white/5'}`}
                   >
                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                   </button>
                 </>
               )}
               <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-zinc-500">
                  <svg className={`w-6 h-6 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
               </button>
            </div>
          </div>

          {!isMinimized && isBrowserMode && (
            <div className="mt-3 flex items-center bg-black/50 border border-white/10 rounded-2xl p-1 animate-in fade-in slide-in-from-top-2">
               <span className="px-3 text-blue-500 font-black text-[9px] tracking-widest opacity-40">WEB</span>
               <input 
                 type="text" 
                 className="flex-1 bg-transparent py-2 text-sm font-semibold text-white outline-none" 
                 placeholder="mangatrx.com" 
                 value={browserUrl}
                 onChange={(e) => setBrowserUrl(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                 spellCheck="false"
               />
               <button onClick={handleNavigate} className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
               </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEWER CONTENT */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <MangaViewer 
            bubbles={bubbles} 
            settings={settings} 
            isProcessing={isProcessing} 
            onScrollStop={handleScrollStop} 
            customImage={isBrowserMode ? null : customImage}
            activeUrl={isBrowserMode ? activeUrl : null}
        />
      </div>

      <ControlPanel settings={settings} setSettings={setSettings} isProcessing={isProcessing} />
      
      {/* BOTTOM SAFE AREA HANDLE */}
      <div className="h-8 bg-black flex justify-center safe-bottom">
        <div className="w-16 h-1 bg-white/10 rounded-full mt-2"></div>
      </div>
    </div>
  );
};

export default App;
