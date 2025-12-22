
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
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  
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
    <div className="h-screen w-screen flex flex-col bg-[#000000] overflow-hidden select-none font-sans safe-top">
      
      {/* Header Panel */}
      <div className={`w-full bg-zinc-950/80 backdrop-blur-2xl border-b border-white/5 transition-all duration-300 ease-in-out z-50 ${isHeaderMinimized ? 'h-14' : 'pb-4'}`}>
        <div className="max-w-md mx-auto px-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between py-3">
              <div className="flex flex-col">
                <h1 className="text-lg font-black italic tracking-tighter text-white uppercase">
                  MANGA<span className="text-blue-500">TURK</span>
                  {!isHeaderMinimized && <span className="ml-2 text-[8px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full not-italic tracking-normal">AI PRO</span>}
                </h1>
                {!isHeaderMinimized && (
                   <div className="flex items-center space-x-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-ping' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`}></div>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                      {isProcessing ? 'AI ÇEVİRİYOR...' : 'SİSTEM HAZIR'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {!isHeaderMinimized && (
                  <div className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center active:scale-90 transition-all">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <button 
                      onClick={() => setIsBrowserMode(!isBrowserMode)} 
                      className={`w-10 h-10 border rounded-xl flex items-center justify-center active:scale-90 transition-all ${isBrowserMode ? 'bg-blue-600 border-blue-400' : 'bg-zinc-900 border-white/5'}`}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <svg className={`w-6 h-6 transform transition-transform ${isHeaderMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {!isHeaderMinimized && isBrowserMode && (
              <div className="flex items-center bg-black border border-white/10 rounded-2xl px-4 py-3 mt-2 animate-in slide-in-from-top-2 duration-300">
                <span className="text-blue-500 font-black text-[9px] mr-3 tracking-widest opacity-50 uppercase">HTTPS://</span>
                <input 
                  type="text" 
                  value={browserUrl} 
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                  className="bg-transparent text-[13px] font-semibold text-zinc-200 flex-1 focus:outline-none"
                  placeholder="mangatrx.com"
                  spellCheck="false"
                />
                <button 
                  onClick={handleNavigate}
                  className="ml-2 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all active:scale-90"
                >
                   <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7" />
                   </svg>
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Main View Area */}
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
      
      {/* Bottom SafeArea handle */}
      <div className="h-6 w-full flex justify-center bg-black safe-bottom">
        <div className="w-20 h-1 bg-white/10 rounded-full mt-2"></div>
      </div>
    </div>
  );
};

export default App;
