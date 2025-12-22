
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
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [frameError, setFrameError] = useState<string | null>(null);
  
  useImperativeHandle(ref, () => ({
    captureViewport: () => customImage || activeUrl || ""
  }));

  useEffect(() => {
    if (activeUrl) {
      setIsIframeLoading(true);
      setFrameError(null);
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
          onScrollStop(customImage || activeUrl || "", el.scrollTop, el.clientHeight); 
        }
      }, 1200);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage, activeUrl]);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      
      {/* SCAN ANIMATION */}
      {isProcessing && (
        <div className="absolute inset-x-0 h-1 bg-blue-500 z-[60] animate-scan shadow-[0_0_20px_#3b82f6]"></div>
      )}

      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll relative bg-black scroll-smooth">
        <div ref={containerRef} className="relative w-full flex flex-col">
            
            {activeUrl ? (
                <div className="w-full relative min-h-screen bg-white">
                    {isIframeLoading && (
                      <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black">
                         <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                         <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Siteye Bağlanılıyor...</p>
                      </div>
                    )}
                    
                    <iframe 
                      key={activeUrl}
                      src={activeUrl} 
                      onLoad={() => setIsIframeLoading(false)}
                      onError={() => { setIsIframeLoading(false); setFrameError("ENGEL"); }}
                      className="w-full h-[8000px] border-none"
                      title="Browser"
                    />

                    {frameError && (
                       <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-zinc-950 p-10 text-center">
                          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                             <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          </div>
                          <h2 className="text-white font-black text-lg mb-2 uppercase">SİTE ERİŞİMİ ENGELLENDİ</h2>
                          <p className="text-zinc-500 text-xs mb-8 leading-relaxed">Bu web sitesi doğrudan açılmayı engelliyor. Lütfen ekran görüntüsü alıp sol üstteki galeri butonuna basın.</p>
                          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 rounded-2xl text-xs font-black text-white">TEKRAR DENE</button>
                       </div>
                    )}

                    {/* Webtoon Bubbles */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {bubbles.map(bubble => (
                          <div 
                              key={bubble.id}
                              className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in duration-300"
                              style={{
                                  top: `${bubble.absoluteY}px`,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '85%',
                                  minHeight: '40px',
                                  backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                  borderRadius: '16px',
                                  border: '2px solid black',
                                  color: 'black',
                                  fontSize: `${settings.fontSize}px`,
                                  fontFamily: "'Shadows Into Light', cursive",
                                  padding: '12px',
                                  boxSizing: 'border-box'
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
                      alt="Manga"
                    />
                    {bubbles.map(bubble => (
                         <div 
                            key={bubble.id}
                            className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in duration-300"
                            style={{
                                top: `${(bubble.box_2d[0] / 1000) * (containerRef.current?.scrollHeight || 1000)}px`,
                                left: `${(bubble.box_2d[1] / 1000) * 100}%`,
                                width: `${((bubble.box_2d[3] - bubble.box_2d[1]) / 1000) * 100}%`,
                                minHeight: '30px',
                                backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                borderRadius: '12px',
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
                <div className="flex flex-col items-center justify-center min-h-[80vh] p-12 text-center">
                    <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5">
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </div>
                    <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-3">İçerik Hazır Değil</h3>
                    <p className="text-zinc-500 text-xs font-bold leading-relaxed max-w-[200px]">Link girerek veya görsel yükleyerek çeviriye başlayabilirsiniz.</p>
                </div>
            )}
        </div>
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan { animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
});

export default MangaViewer;
