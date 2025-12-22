
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [hasIframeError, setHasIframeError] = useState(false);
  
  const demoImages = [
    "https://images.unsplash.com/photo-1578632738980-23055508882d?q=80&w=1000&auto=format&fit=crop"
  ];

  useImperativeHandle(ref, () => ({
    captureViewport: () => customImage || demoImages[0]
  }));

  useEffect(() => {
    if (activeUrl) {
      setIsIframeLoading(true);
      setHasIframeError(false);
      
      // Iframe'in yüklenememe durumunu (X-Frame-Options) kontrol etmek için bir zamanlayıcı
      const timer = setTimeout(() => {
        if (isIframeLoading) {
          // Eğer 5 saniye içinde hala yükleme durumundaysa bir sorun olabilir uyarısı
          console.warn("Iframe might be blocked by site policy.");
        }
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
        if (settings.isEnabled) {
          onScrollStop(customImage || activeUrl || demoImages[0], el.scrollTop, el.clientHeight); 
        }
      }, 1000);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage, activeUrl]);

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
    setHasIframeError(false);
  };

  const handleIframeError = () => {
    setIsIframeLoading(false);
    setHasIframeError(true);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      
      {/* Scan Line Overlay */}
      {isProcessing && (
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-[60] animate-scan-line shadow-[0_0_25px_#3b82f6]"></div>
      )}

      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll bg-black relative scroll-smooth overscroll-none">
        <div ref={containerRef} className="relative w-full flex flex-col min-h-full">
            
            {activeUrl ? (
                <div className="w-full min-h-full relative bg-white">
                    {isIframeLoading && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Tarayıcı Yükleniyor...</p>
                        <p className="mt-2 text-[9px] text-zinc-700 italic px-10 text-center">Bazı siteler güvenlik nedeniyle burada açılmayı engelleyebilir.</p>
                      </div>
                    )}
                    
                    {hasIframeError ? (
                      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950 p-10 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
                           <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Giriş Reddedildi</h3>
                        <p className="text-zinc-500 text-xs mb-8 leading-relaxed">Bu web sitesi doğrudan burada açılmayı engelliyor. Lütfen ekran görüntüsü alıp "Görsel Yükle" modunu kullanın.</p>
                        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-[11px] font-black tracking-widest text-zinc-300 active:scale-95 transition-all">TEKRAR DENE</button>
                      </div>
                    ) : (
                      <iframe 
                        key={activeUrl}
                        ref={iframeRef}
                        src={activeUrl} 
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        className="w-full h-[800vh] border-none"
                        title="Manga Browser"
                      />
                    )}

                    {/* Overlay Bubbles for Web */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {bubbles.map(bubble => (
                          <div 
                              key={bubble.id}
                              className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in duration-300 shadow-2xl"
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
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                              }}
                          >
                              {bubble.translated_text}
                          </div>
                      ))}
                    </div>
                </div>
            ) : customImage ? (
                <div className="w-full relative min-h-screen">
                    <img src={customImage} className="w-full h-auto block" alt="Manga" />
                    {bubbles.map(bubble => (
                         <div 
                            key={bubble.id}
                            className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in duration-300 shadow-lg"
                            style={{
                                top: `${(bubble.box_2d[0] / 1000) * (containerRef.current?.clientHeight || 1000)}px`,
                                left: `${(bubble.box_2d[1] / 1000) * 100}%`,
                                width: `${((bubble.box_2d[3] - bubble.box_2d[1]) / 1000) * 100}%`,
                                minHeight: '30px',
                                backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                borderRadius: '14px',
                                border: '2px solid black',
                                color: 'black',
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: "'Shadows Into Light', cursive",
                                padding: '10px',
                                boxSizing: 'border-box'
                            }}
                        >
                            {bubble.translated_text}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center bg-zinc-950">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center mb-10 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.6)] animate-pulse">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-4">Manga Başlatın</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed max-w-[280px]">Üst kısımdan bir web adresi yazın veya galeriniden bir sayfa yükleyerek gerçek zamanlı çeviriyi başlatın.</p>
                </div>
            )}
        </div>
      </div>

      <style>{`
        @keyframes scan-line { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan-line 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .custom-scroll::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
});

export default MangaViewer;
