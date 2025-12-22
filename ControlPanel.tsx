
import React, { useState } from 'react';
import { EngineSettings } from './types';

interface ControlPanelProps {
  settings: EngineSettings;
  setSettings: React.Dispatch<React.SetStateAction<EngineSettings>>;
  isProcessing: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings, isProcessing }) => {
  const [isMinimized, setIsMinimized] = useState(true);

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-10 right-6 w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl border-2 border-white/20 z-[2000] active:scale-90 transition-all"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-5 bottom-10 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[2000] animate-in slide-in-from-bottom-10 duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${settings.isEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
            <span className="text-[11px] font-black text-white uppercase tracking-tighter">AI Ayarları</span>
          </div>
          <button onClick={() => setIsMinimized(true)} className="text-zinc-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSettings(s => ({ ...s, isEnabled: !s.isEnabled }))}
                className={`py-3 rounded-2xl text-[11px] font-black tracking-widest ${settings.isEnabled ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
              >
                {settings.isEnabled ? 'DURDUR' : 'BAŞLAT'}
              </button>
              <button 
                onClick={() => setSettings(s => ({ ...s, showOriginal: !s.showOriginal }))}
                className={`py-3 rounded-2xl text-[11px] font-black border tracking-widest ${settings.showOriginal ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-zinc-800 border-transparent text-zinc-500'}`}
              >
                {settings.showOriginal ? 'ORİJİNAL' : 'ÇEVİRİ'}
              </button>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-black uppercase">Yazı Boyutu</span>
                <input 
                  type="range" min="12" max="24" 
                  value={settings.fontSize} 
                  onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                  className="w-32 h-1 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-black uppercase">Arka Plan</span>
                <input 
                  type="range" min="0" max="1" step="0.1"
                  value={settings.opacity} 
                  onChange={(e) => setSettings(s => ({ ...s, opacity: parseFloat(e.target.value) }))}
                  className="w-32 h-1 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
