
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
      const timer = setTimeout(() => {
         if (isIframeLoading) setIframeError(true);
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      setIframeError(false);
      setIsIframeLoading(false);
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
      }, 1500); 
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage, activeUrl]);

  return (
    <div className="w-full h-full bg-[#050507] relative overflow-hidden">
      
      {/* AI PROCESSING MODAL */}
      {isProcessing && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.4)]"></div>
            <div className="mt-8 px-8 py-3 bg-zinc-950 border border-white/10 rounded-full shadow-2xl">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">AI Sayfayı Çeviriyor</p>
            </div>
        </div>
      )}

      {/* SCAN LINE */}
      {isProcessing && (
        <div className="absolute inset-x-0 h-[3px] bg-blue-500 z-[60] animate-scan shadow-[0_0_20px_#3b82f6]"></div>
      )}

      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll relative bg-black scroll-smooth overscroll-none">
        <div ref={containerRef} className="relative w-full flex flex-col min-h-full">
            
            {activeUrl ? (
                <div className="w-full relative min-h-screen bg-white">
                    {isIframeLoading && (
                        <div className="absolute inset-0 bg-[#050507] z-40 flex flex-col items-center justify-center p-10 text-center">
                           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                           <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">Siteye Bağlanılıyor...</p>
                        </div>
                    )}
                    
                    {iframeError ? (
                        <div className="absolute inset-0 z-50 bg-[#050507] flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
                            <div className="w-28 h-28 bg-red-600/10 rounded-[3rem] flex items-center justify-center mb-10 border border-red-500/20 shadow-2xl">
                                <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            </div>
                            <h2 className="text-white font-black text-2xl mb-4 uppercase tracking-tighter">ERİŞİM ENGELLENDİ</h2>
                            <p className="text-zinc-500 text-xs mb-10 leading-relaxed font-bold max-w-[300px]">Manga sitesi (X-Frame-Options) kısıtlaması uyguluyor. <br/><br/> Lütfen ekran görüntüsü alın ve sol üstteki <b>GALERİ</b> ikonuna basarak yükleyin.</p>
                            <button onClick={() => window.open(activeUrl, '_blank')} className="w-full max-w-[260px] py-5 bg-blue-600 rounded-2xl text-[11px] font-black text-white shadow-xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-widest">SİTEYİ TARAYICIDA AÇ</button>
                        </div>
                    ) : (
                        <iframe 
                          key={activeUrl}
                          src={activeUrl} 
                          onLoad={() => setIsIframeLoading(false)}
                          onError={() => { setIsIframeLoading(false); setIframeError(true); }}
                          className="w-full h-[10000px] border-none"
                          title="Manga Engine"
                        />
                    )}

                    {/* Webtoon Bubbles Over Web */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {bubbles.map(bubble => (
                          <div 
                              key={bubble.id}
                              className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in"
                              style={{
                                  top: `${bubble.absoluteY}px`,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '85%',
                                  minHeight: '40px',
                                  backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                  borderRadius: '16px',
                                  border: '2.5px solid black',
                                  color: 'black',
                                  fontSize: `${settings.fontSize}px`,
                                  fontFamily: "'Shadows Into Light', cursive",
                                  padding: '12px',
                                  boxSizing: 'border-box',
                                  boxShadow: '0 15px 40px rgba(0,0,0,0.4)'
                              }}
                          >
                              {bubble.translated_text}
                          </div>
                      ))}
                    </div>
                </div>
            ) : customImage ? (
                <div className="w-full relative">
                    <img 
                      src={customImage} 
                      className="w-full h-auto block" 
                      alt="Manga Page"
                    />
                    {bubbles.map(bubble => {
                        const imgHeight = containerRef.current?.scrollHeight || 1;
                        return (
                         <div 
                            key={bubble.id}
                            className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in"
                            style={{
                                top: `${(bubble.box_2d[0] / 1000) * imgHeight}px`,
                                left: `${(bubble.box_2d[1] / 1000) * 100}%`,
                                width: `${((bubble.box_2d[3] - bubble.box_2d[1]) / 1000) * 100}%`,
                                minHeight: '35px',
                                backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                borderRadius: '14px',
                                border: '3px solid black',
                                color: 'black',
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: "'Shadows Into Light', cursive",
                                padding: '10px',
                                boxSizing: 'border-box',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                            }}
                        >
                            {bubble.translated_text}
                        </div>
                    )})}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen p-12 text-center bg-[#050507]">
                    <div className="w-32 h-32 bg-zinc-900 rounded-[3.5rem] flex items-center justify-center mb-12 border border-white/5 shadow-2xl">
                      <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <h3 className="text-white font-black text-3xl uppercase tracking-tighter mb-4">GÖRSEL YOK</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed max-w-[280px] font-black uppercase tracking-widest">Link Girin veya Galeri'den Yükleyin</p>
                </div>
            )}
        </div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan { animation: scan 3.5s linear infinite; }
      `}</style>
    </div>
  );
});

export default MangaViewer;
