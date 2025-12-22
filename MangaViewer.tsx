
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
  
  const demoImages = [
    "https://images.unsplash.com/photo-1578632738980-23055508882d?q=80&w=1000&auto=format&fit=crop"
  ];

  useImperativeHandle(ref, () => ({
    captureViewport: () => customImage || demoImages[0]
  }));

  useEffect(() => {
    if (activeUrl) setIsIframeLoading(true);
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

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      
      {/* AI Scan Line */}
      {isProcessing && (
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-[60] animate-scan-line shadow-[0_0_20px_#3b82f6]"></div>
      )}

      {/* Main Content Area */}
      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll bg-black relative scroll-smooth overflow-x-hidden">
        <div ref={containerRef} className="relative w-full flex flex-col min-h-full">
            
            {activeUrl ? (
                <div className="w-full min-h-full relative bg-white">
                    {isIframeLoading && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900 text-white">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Sayfa Yükleniyor...</p>
                      </div>
                    )}
                    <iframe 
                      key={activeUrl} // Force reload on URL change
                      ref={iframeRef}
                      src={activeUrl} 
                      onLoad={() => setIsIframeLoading(false)}
                      className="w-full h-[500vh] border-none pointer-events-auto"
                      title="Manga Browser"
                    />
                    {/* Translation Overlay for Web */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {bubbles.map(bubble => (
                            <div 
                                key={bubble.id}
                                className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in duration-300 shadow-xl"
                                style={{
                                    top: `${bubble.absoluteY}px`,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '85%',
                                    minHeight: '45px',
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
                                borderRadius: '12px',
                                border: '2px solid black',
                                color: 'black',
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: "'Shadows Into Light', cursive",
                                padding: '8px',
                                boxSizing: 'border-box'
                            }}
                        >
                            {bubble.translated_text}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-screen p-10 text-center bg-zinc-950">
                    <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2">Webtoon URL Girin</h3>
                    <p className="text-zinc-500 text-xs font-semibold leading-relaxed max-w-[200px]">Üst panelden bir web adresi yazarak veya görsel yükleyerek başlayın.</p>
                </div>
            )}
        </div>
      </div>

      {/* Sync Badge */}
      {!isProcessing && (
        <div className="absolute bottom-6 right-6 pointer-events-none z-50">
           <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center space-x-2 shadow-2xl">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-[10px] text-zinc-300 font-black tracking-widest uppercase">AUTO-SYNC</span>
           </div>
        </div>
      )}

      <style>{`
        @keyframes scan-line { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan-line 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .custom-scroll::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
});

export default MangaViewer;
