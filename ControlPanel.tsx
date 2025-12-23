
import React, { useState } from 'react';
import { EngineSettings } from './types';

interface ControlPanelProps {
  settings: EngineSettings;
  setSettings: React.Dispatch<React.SetStateAction<EngineSettings>>;
  isProcessing: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings, isProcessing }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-6 w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-white/20 z-[2000] active:scale-90 transition-all"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-8 bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[2000] animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                !settings.isEnabled ? 'bg-zinc-700' : 
                isProcessing ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse' : 
                'bg-green-500 shadow-[0_0_12px_#22c55e]'
              }`}></div>
              <span className="text-[11px] font-black text-white uppercase tracking-widest">Motor Ayarları</span>
           </div>
           <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center active:bg-white/10">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
        </div>

        <div className="space-y-8">
           <div className="grid grid-cols-2 gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="flex flex-col text-center">
                 <span className="text-[9px] font-black text-zinc-500 mb-1 uppercase tracking-tighter">Kaynak</span>
                 <select 
                   value={settings.sourceLanguage}
                   onChange={(e) => setSettings(s => ({ ...s, sourceLanguage: e.target.value }))}
                   className="bg-transparent py-2 text-sm font-black text-blue-400 outline-none appearance-none text-center cursor-pointer"
                 >
                   <option value="auto">OTOMATİK</option>
                   <option value="Japanese">JAPONCA</option>
                   <option value="Korean">KORECE</option>
                   <option value="Chinese">ÇİNCE</option>
                   <option value="English">İNGİLİZCE</option>
                 </select>
              </div>
              <div className="flex flex-col text-center border-l border-white/5">
                 <span className="text-[9px] font-black text-zinc-500 mb-1 uppercase tracking-tighter">Hedef</span>
                 <select 
                   value={settings.targetLanguage}
                   onChange={(e) => setSettings(s => ({ ...s, targetLanguage: e.target.value }))}
                   className="bg-transparent py-2 text-sm font-black text-white outline-none appearance-none text-center cursor-pointer"
                 >
                   <option value="Turkish">TÜRKÇE</option>
                   <option value="English">ENGLISH</option>
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSettings(s => ({ ...s, isEnabled: !s.isEnabled }))}
                className={`py-5 rounded-2xl text-[10px] font-black tracking-widest transition-all shadow-xl active:scale-95 ${
                  settings.isEnabled 
                    ? 'bg-zinc-800 text-red-500 border border-red-500/20' 
                    : 'bg-green-600 text-white shadow-green-600/20'
                }`}
              >
                {settings.isEnabled ? 'MOTORU KAPAT' : 'MOTORU AÇ'}
              </button>
              <button 
                onClick={() => setSettings(s => ({ ...s, showOriginal: !s.showOriginal }))}
                className={`py-5 rounded-2xl text-[10px] font-black border transition-all active:scale-95 ${
                  settings.showOriginal 
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-500' 
                    : 'bg-white text-black border-white shadow-lg'
                }`}
              >
                {settings.showOriginal ? 'ORİJİNAL' : 'ÇEVİRİ'}
              </button>
           </div>

           <div className="space-y-6">
              <div className="flex flex-col space-y-2.5">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Yazı Boyutu</span>
                    <span className="text-blue-500 font-black text-xs">{settings.fontSize}px</span>
                 </div>
                 <input 
                   type="range" min="12" max="36" 
                   value={settings.fontSize} 
                   onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                   className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                 />
              </div>
              <div className="flex flex-col space-y-2.5">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Şeffaflık</span>
                    <span className="text-blue-500 font-black text-xs">{Math.round(settings.opacity * 100)}%</span>
                 </div>
                 <input 
                   type="range" min="0.3" max="1" step="0.05"
                   value={settings.opacity} 
                   onChange={(e) => setSettings(s => ({ ...s, opacity: parseFloat(e.target.value) }))}
                   className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
