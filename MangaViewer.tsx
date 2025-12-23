
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
  const [frameLoadStatus, setFrameLoadStatus] = useState<'loading' | 'error' | 'ok'>('ok');
  
  useImperativeHandle(ref, () => ({
    captureViewport: () => customImage || activeUrl || ""
  }));

  useEffect(() => {
    if (activeUrl) setFrameLoadStatus('loading');
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
      }, 1000);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage, activeUrl]);

  return (
    <div className="w-full h-full bg-[#050507] relative overflow-hidden">
      
      {/* SCAN LINE */}
      {isProcessing && (
        <div className="absolute inset-x-0 h-1 bg-blue-500 z-[60] animate-scan shadow-[0_0_20px_#3b82f6]"></div>
      )}

      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll relative bg-black scroll-smooth">
        <div ref={containerRef} className="relative w-full flex flex-col min-h-full">
            
            {activeUrl ? (
                <div className="w-full relative min-h-screen bg-white">
                    {frameLoadStatus === 'loading' && (
                       <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-12 text-center">
                          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                          <p className="text-zinc-500 text-[10px] font-black tracking-widest">SİTEYE BAĞLANILIYOR...</p>
                       </div>
                    )}
                    
                    <iframe 
                      key={activeUrl}
                      src={activeUrl} 
                      onLoad={() => setFrameLoadStatus('ok')}
                      onError={() => setFrameLoadStatus('error')}
                      className="w-full h-[10000px] border-none"
                      title="Manga Engine"
                    />

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
                      alt="Manga Page"
                      style={{ minWidth: '100%' }}
                    />
                    {bubbles.map(bubble => (
                         <div 
                            key={bubble.id}
                            className="absolute flex items-center justify-center text-center font-bold z-40 animate-in zoom-in"
                            style={{
                                top: `${(bubble.box_2d[0] / 1000) * (containerRef.current?.scrollHeight || 0)}px`,
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
                <div className="flex flex-col items-center justify-center min-h-screen p-12 text-center bg-[#050507]">
                    <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl">
                      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-4">Manga Bekleniyor</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed max-w-[240px]">Bir web sitesi adresi girin veya galeriden bir webtoon sayfası yükleyin.</p>
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
