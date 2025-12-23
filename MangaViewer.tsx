
import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { SpeechBubble, EngineSettings } from './types';

interface MangaViewerProps {
  bubbles: SpeechBubble[];
  settings: EngineSettings;
  isProcessing: boolean;
  onScrollStop: (viewData: string, scrollPos: number, viewHeight: number) => void;
  customImage: string | null;
  activeUrl?: string | null;
}

export interface MangaViewerHandle {
  captureViewport: () => string | null;
}

const MangaViewer = forwardRef<MangaViewerHandle, MangaViewerProps>(({ bubbles, settings, isProcessing, onScrollStop, customImage, activeUrl }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeError, setIframeError] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  
  useImperativeHandle(ref, () => ({
    captureViewport: () => customImage || activeUrl || ""
  }));

  useEffect(() => {
    if (activeUrl) {
      setIframeError(false);
      setIsIframeLoading(true);
      
      // Iframe koruma tespiti (7 saniye yüklenmezse hata say)
      const timer = setTimeout(() => {
         if (isIframeLoading) {
           console.error("[MangaViewer] Site erişimi kısıtlanmış olabilir (ERR_BLOCKED_BY_RESPONSE).");
           setIframeError(true);
           setIsIframeLoading(false);
         }
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeUrl]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timeout: any;
    const handleScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (settings.isEnabled && (customImage || activeUrl)) {
          onScrollStop(customImage || activeUrl || "", el.scrollTop, el.clientHeight); 
        }
      }, 1800); 
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage, activeUrl]);

  return (
    <div className="w-full h-full bg-[#050507] relative overflow-hidden">
      
      {isProcessing && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.3)]"></div>
            <div className="mt-8 px-8 py-3 bg-zinc-950/80 border border-white/10 rounded-full">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Sayfa Analiz Ediliyor...</p>
            </div>
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent z-[60] animate-scan shadow-[0_0_15px_#3b82f6]"></div>
      )}

      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll relative bg-[#050507] scroll-smooth overscroll-none">
        <div ref={containerRef} className="relative w-full flex flex-col min-h-full">
            
            {activeUrl ? (
                <div className="w-full relative min-h-screen bg-[#050507]">
                    {isIframeLoading && (
                        <div className="absolute inset-0 bg-[#050507] z-40 flex flex-col items-center justify-center p-12 text-center">
                           <div className="w-14 h-14 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                           <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">İçerik Yükleniyor...</p>
                        </div>
                    )}
                    
                    {iframeError ? (
                        <div className="absolute inset-0 z-50 bg-[#050507] flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mb-8 border border-red-600/20 shadow-2xl">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            </div>
                            <h2 className="text-white font-black text-xl mb-4 uppercase tracking-tighter">İÇERİK ENGELLENDİ</h2>
                            <p className="text-zinc-500 text-[11px] mb-10 leading-relaxed font-medium max-w-[280px]">Bu site güvenlik politikası (X-Frame-Options) nedeniyle uygulama içerisinde açılamıyor. <br/><br/> Lütfen <b>CİHAZDAN YÜKLE</b> özelliğini kullanın.</p>
                            <button onClick={() => window.open(activeUrl, '_blank')} className="w-full max-w-[240px] py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black text-white shadow-xl active:scale-95 transition-all uppercase tracking-widest">TARAYICIDA AÇ</button>
                        </div>
                    ) : (
                        <iframe 
                          key={activeUrl}
                          src={activeUrl} 
                          onLoad={() => { setIsIframeLoading(false); setIframeError(false); }}
                          onError={() => { setIsIframeLoading(false); setIframeError(true); }}
                          className="w-full h-[20000px] border-none bg-white"
                          title="Manga Frame"
                        />
                    )}

                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {settings.isEnabled && !settings.showOriginal && bubbles.map(bubble => (
                          <div 
                              key={bubble.id}
                              className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in duration-300"
                              style={{
                                  top: `${bubble.absoluteY}px`,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '90%',
                                  minHeight: '35px',
                                  backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                  borderRadius: '16px',
                                  border: '3px solid black',
                                  color: 'black',
                                  fontSize: `${settings.fontSize}px`,
                                  fontFamily: "'Shadows Into Light', cursive",
                                  padding: '10px',
                                  boxSizing: 'border-box',
                                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                              }}
                          >
                              {bubble.translated_text}
                          </div>
                      ))}
                    </div>
                </div>
            ) : customImage ? (
                <div className="w-full relative bg-[#050507]">
                    <img 
                      src={customImage} 
                      className="w-full h-auto block" 
                      alt="Manga Canvas"
                    />
                    {settings.isEnabled && !settings.showOriginal && bubbles.map(bubble => {
                        const imgHeight = containerRef.current?.scrollHeight || 1;
                        return (
                         <div 
                            key={bubble.id}
                            className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in duration-300"
                            style={{
                                top: `${(bubble.box_2d[0] / 1000) * imgHeight}px`,
                                left: `${(bubble.box_2d[1] / 1000) * 100}%`,
                                width: `${((bubble.box_2d[3] - bubble.box_2d[1]) / 1000) * 100}%`,
                                minHeight: '30px',
                                backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                borderRadius: '12px',
                                border: '2.5px solid black',
                                color: 'black',
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: "'Shadows Into Light', cursive",
                                padding: '8px',
                                boxSizing: 'border-box',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                            }}
                        >
                            {bubble.translated_text}
                        </div>
                    )})}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen p-12 text-center bg-[#050507]">
                    <div className="w-28 h-28 bg-zinc-900/50 rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl">
                      <svg className="w-14 h-14 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-4">MangaTurk AI Aktif</h3>
                    <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest leading-loose">URL girerek veya görsel yükleyerek <br/> gerçek zamanlı çeviriye başlayın.</p>
                </div>
            )}
        </div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan { animation: scan 4s linear infinite; }
      `}</style>
    </div>
  );
});

export default MangaViewer;
