
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
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
    // URL kontrolü: Sadece resim verisi (data:image) varsa Gemini'ye gönder
    if (isProcessing || !settings.isEnabled || !imageSrc || !imageSrc.startsWith('data:image')) {
      return;
    }
    
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const result = await translateMangaPage(imageSrc, settings.targetLanguage);
      if (result && result.bubbles) {
        const processed = result.bubbles.map((b) => ({
            ...b,
            id: `b-${Math.random().toString(36).substring(2, 11)}`,
            absoluteY: scrollY + (b.box_2d[0] / 1000) * viewHeight
        }));

        setBubbles(prev => {
           const currentViewMin = scrollY - 2000;
           const currentViewMax = scrollY + 4000;
           const filtered = prev.filter(p => (p.absoluteY || 0) > currentViewMin && (p.absoluteY || 0) < currentViewMax);
           return [...filtered, ...processed];
        });
      }
    } catch (err: any) {
      console.error("[APP] Çeviri Hatası:", err.message);
      setErrorMsg(err.message.includes("API_KEY") ? "API Anahtarı bulunamadı." : "Çeviri sırasında sorun oluştu.");
      setTimeout(() => setErrorMsg(null), 5000);
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
        if (base64) {
          setCustomImage(base64);
          setActiveUrl("");
          setBubbles([]);
          setIsHeaderOpen(false);
          runTranslation(base64, 0, window.innerHeight);
        }
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
    if (!imgSource.startsWith('data:image')) return;
    const scrollDiff = Math.abs(scrollY - lastScanY.current);
    if (scrollDiff > 600) { 
      lastScanY.current = scrollY;
      runTranslation(imgSource, scrollY, viewHeight);
    }
  }, [settings.isEnabled, isProcessing, settings.targetLanguage]);

  return (
    <div className="w-full h-full relative bg-[#050507] overflow-hidden">
      {/* HEADER */}
      <header className={`app-header transition-all duration-500 transform ${isHeaderOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="px-6 h-[75px] flex items-center justify-between">
           <div className="flex flex-col cursor-pointer" onClick={() => { setActiveUrl(""); setCustomImage(null); setBubbles([]); setIsHeaderOpen(true); }}>
              <h1 className="text-2xl font-black italic text-white leading-none">MANGA<span className="text-blue-500">TURK</span></h1>
              <div className="flex items-center space-x-2 mt-1">
                 <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                 <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{isProcessing ? 'AI TRANSLATING' : 'READY'}</span>
              </div>
           </div>
           <div className="flex items-center space-x-3">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                 <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </button>
              <button onClick={() => setIsHeaderOpen(false)} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                 <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </button>
           </div>
        </div>
        <div className="px-6 pb-5">
           <div className="flex items-center space-x-3 bg-zinc-900/50 border border-white/5 rounded-2xl p-2">
              <input 
                type="text" value={browserUrl} 
                onChange={(e) => setBrowserUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                className="flex-1 bg-transparent px-3 text-xs font-bold text-white outline-none placeholder-zinc-700"
                placeholder="Örn: mangatrx.com"
              />
              <button onClick={handleNavigate} className="bg-blue-600 px-5 py-2.5 rounded-xl text-[10px] font-black active:scale-95 transition-all">GİT</button>
           </div>
        </div>
      </header>

      {/* ERROR TOAST */}
      {errorMsg && (
        <div className="fixed top-24 left-6 right-6 z-[1200] bg-red-600 p-4 rounded-xl border border-red-500 shadow-2xl animate-bounce">
           <p className="text-[10px] font-black text-white text-center uppercase tracking-widest">{errorMsg}</p>
        </div>
      )}

      {/* RE-OPEN BUTTON */}
      {!isHeaderOpen && (
        <button onClick={() => setIsHeaderOpen(true)} className="fixed top-4 left-1/2 -translate-x-1/2 z-[1100] bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-8 py-2 rounded-full shadow-2xl active:scale-95 transition-all">
          <div className="w-10 h-1 bg-zinc-700 rounded-full"></div>
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
