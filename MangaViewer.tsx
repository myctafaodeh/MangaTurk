
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SpeechBubble, EngineSettings } from './types';

interface MangaViewerProps {
  bubbles: SpeechBubble[];
  settings: EngineSettings;
  isProcessing: boolean;
  onScrollStop: (viewData: string, scrollPos: number, viewHeight: number) => void;
  customImage: string | null;
}

export interface MangaViewerHandle {
  captureViewport: () => string | null;
}

const MangaViewer = forwardRef<MangaViewerHandle, MangaViewerProps>(({ bubbles, settings, isProcessing, onScrollStop, customImage }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const demoImages = [
    "https://images.unsplash.com/photo-1578632738980-23055508882d?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop"
  ];

  useImperativeHandle(ref, () => ({
    captureViewport: () => customImage || demoImages[0]
  }));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timeout: any;
    const handleScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (settings.isEnabled) {
          onScrollStop(customImage || demoImages[0], el.scrollTop, el.clientHeight); 
        }
      }, 700);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage]);

  return (
    <div className="relative w-full h-[70vh] max-w-md mx-auto bg-black rounded-[3rem] border-[10px] border-zinc-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden ring-1 ring-white/10">
      {isProcessing && (
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-[60] animate-scan-line shadow-[0_0_15px_#3b82f6]"></div>
      )}
      <div className="absolute top-0 inset-x-0 h-10 flex items-center justify-center z-[100] pointer-events-none">
        <div className="w-28 h-6 bg-zinc-900 rounded-b-[2rem] border-x border-b border-white/5 flex items-center justify-around px-4">
            <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
            <div className="w-10 h-1.5 bg-black rounded-full"></div>
        </div>
      </div>
      <div ref={scrollRef} className="h-full overflow-y-auto custom-scroll bg-white relative scroll-smooth overscroll-none">
        <div ref={containerRef} className="relative w-full flex flex-col">
            {customImage ? (
                <div className="w-full relative min-h-[100vh]">
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
                <div className="relative flex flex-col">
                    {demoImages.map((src, idx) => (
                        <div key={idx} className="w-full relative">
                            <img src={src} className="w-full h-auto grayscale-[0.3] hover:grayscale-0 transition-all duration-700" alt={`Page ${idx}`} />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10"></div>
                        </div>
                    ))}
                    {settings.isEnabled && !settings.showOriginal && bubbles.map((bubble) => (
                        <div 
                            key={bubble.id}
                            className="absolute flex items-center justify-center text-center font-bold z-40 animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{
                                top: `${bubble.absoluteY}px`,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '88%',
                                minHeight: '55px',
                                backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
                                borderRadius: '30px',
                                border: '3px solid black',
                                color: 'black',
                                fontSize: `${settings.fontSize + 2}px`,
                                fontFamily: "'Shadows Into Light', cursive",
                                padding: '15px 20px',
                                boxSizing: 'border-box',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <span className="leading-[1.1]">{bubble.translated_text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
      <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none z-50">
         <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[9px] text-zinc-300 font-bold tracking-widest uppercase">Live AI Sync</span>
         </div>
      </div>
      <style>{`
        @keyframes scan-line { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan-line 2s linear infinite; }
      `}</style>
    </div>
  );
});

export default MangaViewer;
