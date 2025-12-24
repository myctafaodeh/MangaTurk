
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

const MangaViewer = forwardRef<any, MangaViewerProps>(({ bubbles, settings, isProcessing, onScrollStop, customImage, activeUrl }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeError, setIframeError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (activeUrl) {
      setIframeError(false);
      setLoading(true);
      const timer = setTimeout(() => {
         if (loading) {
           setIframeError(true);
           setLoading(false);
         }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeUrl]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !customImage) return;

    let timeout: any;
    const handleScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (settings.isEnabled) onScrollStop(customImage, el.scrollTop, el.clientHeight); 
      }, 1500); 
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [settings.isEnabled, onScrollStop, customImage]);

  return (
    <div className="w-full h-full bg-[#050507] relative overflow-hidden">
      
      {isProcessing && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-blue-500/50"></div>
            <p className="mt-6 text-[10px] font-black text-white tracking-[0.3em] uppercase animate-pulse">Analiz Ediliyor...</p>
        </div>
      )}

      <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scroll relative bg-[#050507]">
        <div ref={containerRef} className="relative w-full flex flex-col min-h-full">
            
            {activeUrl ? (
                <div className="w-full relative min-h-screen">
                    {loading && (
                        <div className="absolute inset-0 bg-[#050507] z-40 flex flex-col items-center justify-center p-12">
                           <div className="w-12 h-12 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                           <p className="text-zinc-600 font-black tracking-widest text-[9px]">SİTE YÜKLENİYOR...</p>
                        </div>
                    )}
                    
                    {iframeError ? (
                        <div className="absolute inset-0 z-50 bg-[#050507] flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mb-8 border border-red-600/20">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            </div>
                            <h2 className="text-white font-black text-lg mb-3 uppercase tracking-tighter">İÇERİK ENGELLENDİ</h2>
                            <p className="text-zinc-500 text-[10px] mb-8 leading-relaxed max-w-[250px] font-bold">Bu site, güvenliği nedeniyle uygulama içinde açılmayı engelliyor (X-Frame). <br/><br/> Lütfen sayfayı tarayıcıda açıp ekran görüntüsü alarak galeriden yükleyin.</p>
                            <button onClick={() => window.open(activeUrl, '_blank')} className="w-full max-w-[200px] py-4 bg-blue-600 rounded-2xl text-[10px] font-black text-white shadow-xl active:scale-95 transition-all">TARAYICIDA AÇ</button>
                        </div>
                    ) : (
                        <iframe 
                          key={activeUrl} src={activeUrl} 
                          onLoad={() => { setLoading(false); setIframeError(false); }}
                          onError={() => { setLoading(false); setIframeError(true); }}
                          className="w-full h-[15000px] border-none" title="Manga"
                        />
                    )}
                </div>
            ) : customImage ? (
                <div className="w-full relative bg-[#050507]">
                    <img src={customImage} className="w-full h-auto block" alt="Manga" />
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
                                borderRadius: '10px',
                                border: '2.5px solid black',
                                color: 'black',
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: "'Shadows Into Light', cursive",
                                padding: '8px',
                                boxSizing: 'border-box',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                            }}
                        >
                            {bubble.translated_text}
                        </div>
                    )})}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen p-12 text-center bg-[#050507]">
                    <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-2">MangaTurk AI PRO</h3>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-loose">Galeriden sayfa yükleyerek <br/> anlık çeviriye başlayın.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
});

export default MangaViewer;
