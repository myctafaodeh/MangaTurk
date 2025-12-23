
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
      // Iframe korumalı siteler için timeout kontrolü
      const timer = setTimeout(() => {
         if (isIframeLoading) setIframeError(true);
      }, 5000);
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
          // Görüntünün anlık yüksekliğini ve kaydırma miktarını AI koordinatlarına oranlıyoruz
          onScrollStop(customImage || activeUrl || "", el.scrollTop, el.clientHeight); 
        }
      }, 1500); // Kullanıcı durduğunda tara
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage, activeUrl]);

  return (
    <div className="w-full h-full bg-[#050507] relative overflow-hidden">
      
      {/* AI ANALİZ LOADER */}
      {isProcessing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center">
            <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.4)]"></div>
            <div className="mt-6 px-6 py-2.5 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">AI Analiz Ediyor...</p>
            </div>
        </div>
      )}

      {/* SCAN LINE ANIMATION */}
      {isProcessing && (
        <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent z-[60] animate-scan shadow-[0_0_20px_#3b82f6]"></div>
      )}

      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll relative bg-black scroll-smooth overscroll-none">
        <div ref={containerRef} className="relative w-full flex flex-col min-h-full">
            
            {activeUrl ? (
                <div className="w-full relative min-h-screen bg-white">
                    {isIframeLoading && (
                        <div className="absolute inset-0 bg-[#050507] z-40 flex flex-col items-center justify-center p-10 text-center">
                           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                           <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Site Güvenliği Kontrol Ediliyor...</p>
                        </div>
                    )}
                    
                    {iframeError ? (
                        <div className="absolute inset-0 z-50 bg-[#050507] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                            <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-red-500/20">
                                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            </div>
                            <h2 className="text-white font-black text-xl mb-4 uppercase tracking-tighter">SİTE ERİŞİMİ REDDEDİLDİ</h2>
                            <p className="text-zinc-500 text-xs mb-10 leading-relaxed font-bold max-w-[280px]">Manga sitesi kendini dış erişime kapatmış (X-Frame-Options). <br/><br/> <span className="text-blue-500">ÇÖZÜM:</span> Ekran görüntüsü alıp sol üstteki galeri butonuyla yükleyin.</p>
                            <button onClick={() => window.location.reload()} className="w-full max-w-[240px] py-4 bg-zinc-900 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest">Tekrar Dene</button>
                        </div>
                    ) : (
                        <iframe 
                          key={activeUrl}
                          src={activeUrl} 
                          onLoad={() => setIsIframeLoading(false)}
                          onError={() => { setIsIframeLoading(false); setIframeError(true); }}
                          className="w-full h-[12000px] border-none"
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
                                  borderRadius: '20px',
                                  border: '2.5px solid black',
                                  color: 'black',
                                  fontSize: `${settings.fontSize}px`,
                                  fontFamily: "'Shadows Into Light', cursive",
                                  padding: '12px',
                                  boxSizing: 'border-box',
                                  boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
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
                      style={{ minWidth: '100%' }}
                    />
                    {bubbles.map(bubble => {
                        // Resim gerçek yüksekliğine göre koordinat hesaplama
                        const imgHeight = containerRef.current?.scrollHeight || 1;
                        const topPos = (bubble.box_2d[0] / 1000) * imgHeight;
                        const leftPos = (bubble.box_2d[1] / 1000) * 100;
                        const widthPerc = ((bubble.box_2d[3] - bubble.box_2d[1]) / 1000) * 100;
                        
                        return (
                         <div 
                            key={bubble.id}
                            className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in"
                            style={{
                                top: `${topPos}px`,
                                left: `${leftPos}%`,
                                width: `${widthPerc}%`,
                                minHeight: '35px',
                                backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                borderRadius: '14px',
                                border: '3px solid black',
                                color: 'black',
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: "'Shadows Into Light', cursive",
                                padding: '10px',
                                boxSizing: 'border-box',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                            }}
                        >
                            {bubble.translated_text}
                        </div>
                    )})}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen p-12 text-center bg-[#050507]">
                    <div className="w-28 h-28 bg-zinc-900 rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl">
                      <svg className="w-14 h-14 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-4">SİSTEM HAZIR</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed max-w-[260px] font-bold">Web adresi girin veya galeriden görsel yükleyerek başlayın.</p>
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
