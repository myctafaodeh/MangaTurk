
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
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanY = useRef<number>(-9999);
  
  const [settings, setSettings] = useState<EngineSettings>({
    isEnabled: true,
    isAutoScan: true,
    qualityLevel: 'high',
    showOriginal: false,
    opacity: 0.98,
    fontSize: 20,
    sourceLanguage: 'auto',
    targetLanguage: 'Turkish',
    uiScale: 1.0
  });

  const runTranslation = async (imageSrc: string, scrollY: number, viewHeight: number) => {
    if (isProcessing || !settings.isEnabled) return;
    
    setIsProcessing(true);
    console.log("[MangaTurk-UI] Çeviri motoru aktif edildi.");

    try {
      if (!imageSrc) throw new Error("Görsel kaynağı algılanamadı.");
      
      const result = await translateMangaPage(imageSrc, settings.targetLanguage);
      
      if (result && result.bubbles) {
        const processed = result.bubbles.map((b) => ({
            ...b,
            id: `b-${Math.random().toString(36).substring(2, 11)}`,
            absoluteY: scrollY + (b.box_2d[0] / 1000) * viewHeight
        }));

        setBubbles(prev => {
           // Eski verileri temizleyerek bellek yükünü azalt
           const currentViewMin = scrollY - 2000;
           const currentViewMax = scrollY + 4000;
           const filtered = prev.filter(p => (p.absoluteY || 0) > currentViewMin && (p.absoluteY || 0) < currentViewMax);
           return [...filtered, ...processed];
        });
      }
    } catch (err: any) {
      console.error("[MangaTurk-UI] Çeviri döngüsünde hata:", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToGallery = () => {
    setActiveUrl("");
    setBubbles([]);
    setCustomImage(null);
    setIsHeaderOpen(true);
    lastScanY.current = -9999;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setActiveUrl("");
        setCustomImage(base64);
        setBubbles([]);
        setIsHeaderOpen(false);
        runTranslation(base64, 0, window.innerHeight);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNavigate = () => {
    let url = browserUrl.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    
    setCustomImage(null);
    setBubbles([]);
    setActiveUrl(url);
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
      <header className={`app-header transition-all duration-500 ease-out ${isHeaderOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="px-6 h-[80px] flex items-center justify-between">
           <div className="flex flex-col cursor-pointer" onClick={resetToGallery}>
              <h1 className="text-2xl font-black italic tracking-tighter text-white">MANGA<span className="text-blue-500">TURK</span></h1>
              <div className="flex items-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${
                   isProcessing ? 'bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]' : 
                   settings.isEnabled ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-700'
                 }`}></div>
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                   {isProcessing ? 'AI TRANSLATING' : settings.isEnabled ? 'ENGINE READY' : 'OFFLINE'}
                 </span>
              </div>
           </div>

           <div className="flex items-center space-x-3">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button onClick={() => { resetToGallery(); fileInputRef.current?.click(); }} className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                 <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              <button onClick={() => setIsHeaderOpen(false)} className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90">
                 <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"/></svg>
              </button>
           </div>
        </div>

        <div className="px-6 pb-6">
           <div className="flex items-center space-x-3 bg-black/50 border border-white/10 rounded-[1.25rem] p-2.5">
              <input 
                type="text" 
                value={browserUrl} 
                onChange={(e) => setBrowserUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                className="flex-1 bg-transparent px-3 text-[14px] font-black text-white outline-none placeholder-zinc-700"
                placeholder="Manga sitesi URL'si..."
              />
              <button onClick={handleNavigate} className="bg-blue-600 px-7 py-3.5 rounded-xl text-[10px] font-black shadow-2xl active:scale-95 transition-all">OKU</button>
           </div>
        </div>
      </header>

      {!isHeaderOpen && (
        <button 
          onClick={() => setIsHeaderOpen(true)}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] bg-zinc-900/90 backdrop-blur-3xl border border-white/10 px-10 py-3 rounded-full active:scale-95 transition-all shadow-2xl"
        >
          <div className="w-14 h-2 bg-zinc-700 rounded-full"></div>
        </button>
      )}

      <main className="w-full h-full">
        <MangaViewer 
          bubbles={bubbles} 
          settings={settings} 
          isProcessing={isProcessing} 
          onScrollStop={onScrollUpdate} 
          customImage={customImage}
          activeUrl={activeUrl}
        />
      </main>

      <ControlPanel settings={settings} setSettings={setSettings} isProcessing={isProcessing} />
    </div>
  );
};

export default App;
