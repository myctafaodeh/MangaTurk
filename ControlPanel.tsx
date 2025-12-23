
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
        className="fixed bottom-10 right-6 w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4)] border-2 border-white/20 z-[2000] active:scale-90 transition-all"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-8 bg-zinc-950/98 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[2000] animate-in slide-in-from-bottom-10 duration-300">
      <div className="p-7">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
              <span className="text-[11px] font-black text-white uppercase tracking-widest">AI Engine Control</span>
           </div>
           <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500 bg-white/5 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
        </div>

        <div className="space-y-8">
           {/* Dil Seçimi */}
           <div className="grid grid-cols-2 gap-3 bg-white/5 p-1 rounded-2xl border border-white/10">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-zinc-600 px-3 pt-2 uppercase">Kaynak Dil</span>
                 <select 
                   value={settings.sourceLanguage}
                   onChange={(e) => setSettings(s => ({ ...s, sourceLanguage: e.target.value }))}
                   className="bg-transparent py-2 text-center text-xs font-black text-blue-400 outline-none appearance-none"
                 >
                   <option value="auto">OTOMATİK</option>
                   <option value="Japanese">JAPONCA</option>
                   <option value="Korean">KORECE</option>
                   <option value="Chinese">ÇİNCE</option>
                   <option value="English">İNGİLİZCE</option>
                 </select>
              </div>
              <div className="flex flex-col border-l border-white/5">
                 <span className="text-[8px] font-black text-zinc-600 px-3 pt-2 uppercase">Hedef Dil</span>
                 <select 
                   value={settings.targetLanguage}
                   onChange={(e) => setSettings(s => ({ ...s, targetLanguage: e.target.value }))}
                   className="bg-transparent py-2 text-center text-xs font-black text-white outline-none appearance-none"
                 >
                   <option value="Turkish">TÜRKÇE</option>
                   <option value="English">ENGLISH</option>
                   <option value="German">DEUTSCH</option>
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSettings(s => ({ ...s, isEnabled: !s.isEnabled }))}
                className={`py-5 rounded-2xl text-[11px] font-black tracking-widest transition-all shadow-lg ${settings.isEnabled ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-zinc-800 text-zinc-500'}`}
              >
                {settings.isEnabled ? 'SİSTEMİ DURDUR' : 'SİSTEMİ BAŞLAT'}
              </button>
              <button 
                onClick={() => setSettings(s => ({ ...s, showOriginal: !s.showOriginal }))}
                className={`py-5 rounded-2xl text-[11px] font-black border transition-all ${settings.showOriginal ? 'bg-zinc-800 border-transparent text-zinc-500' : 'bg-white text-black border-white shadow-lg shadow-white/10'}`}
              >
                {settings.showOriginal ? 'ORİJİNAL GÖSTER' : 'ÇEVİRİYİ GÖSTER'}
              </button>
           </div>

           <div className="space-y-7 px-2">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Yazı Boyutu</span>
                 <div className="flex items-center space-x-4">
                    <input 
                      type="range" min="12" max="28" 
                      value={settings.fontSize} 
                      onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                      className="w-32 h-1 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                    />
                    <span className="text-[10px] font-black text-blue-500 w-4">{settings.fontSize}</span>
                 </div>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Balon Opasite</span>
                 <div className="flex items-center space-x-4">
                    <input 
                      type="range" min="0.1" max="1" step="0.1"
                      value={settings.opacity} 
                      onChange={(e) => setSettings(s => ({ ...s, opacity: parseFloat(e.target.value) }))}
                      className="w-32 h-1 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                    />
                    <span className="text-[10px] font-black text-blue-500 w-4">{Math.round(settings.opacity * 100)}%</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
