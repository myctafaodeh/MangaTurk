
import React, { useState } from 'react';
import { EngineSettings } from './types';

interface ControlPanelProps {
  settings: EngineSettings;
  setSettings: React.Dispatch<React.SetStateAction<EngineSettings>>;
  isProcessing: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings, isProcessing }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const panelStyle = {
    transform: `translateX(-50%) scale(${settings.uiScale})`,
    transformOrigin: 'bottom center',
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-10 right-6 w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_20px_40px_rgba(37,99,235,0.4)] border-2 border-white/20 z-[100] active:scale-90 transition-all"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </button>
    );
  }

  return (
    <div 
      style={panelStyle}
      className="fixed bottom-10 left-1/2 w-[90%] max-w-sm bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[100] transition-all duration-300 overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
        <div className="flex items-center space-x-2">
           <div className={`w-2.5 h-2.5 rounded-full ${settings.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
           <span className="text-[11px] font-black text-white uppercase tracking-tighter">AI SETTINGS</span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full">
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center space-x-2 bg-black/40 p-2 rounded-2xl border border-white/5">
           <select 
             value={settings.sourceLanguage}
             onChange={(e) => setSettings(s => ({ ...s, sourceLanguage: e.target.value }))}
             className="flex-1 bg-transparent text-[11px] font-black text-white text-center focus:outline-none appearance-none"
           >
             <option value="auto">OTOMATİK</option>
             <option value="Japanese">Japonca</option>
             <option value="Korean">Korece</option>
             <option value="Chinese">Çince</option>
           </select>
           <div className="w-6 h-6 flex items-center justify-center text-blue-500">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7m0 0l-7 7m7-7H3"/></svg>
           </div>
           <select 
             value={settings.targetLanguage}
             onChange={(e) => setSettings(s => ({ ...s, targetLanguage: e.target.value }))}
             className="flex-1 bg-transparent text-[11px] font-black text-white text-center focus:outline-none appearance-none"
           >
             <option value="Turkish">Türkçe</option>
             <option value="English">İngilizce</option>
           </select>
        </div>

        <div className="flex space-x-3">
           <button 
             onClick={() => setSettings(s => ({ ...s, isEnabled: !s.isEnabled }))} 
             className={`flex-1 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all ${settings.isEnabled ? 'bg-blue-600 shadow-[0_10px_30px_-5px_rgba(37,99,235,0.4)]' : 'bg-zinc-800 text-zinc-500'}`}
           >
             {settings.isEnabled ? 'ON' : 'OFF'}
           </button>
           <button 
             onClick={() => setSettings(s => ({ ...s, showOriginal: !s.showOriginal }))} 
             className={`flex-1 py-3 rounded-2xl text-[11px] font-black border tracking-widest ${settings.showOriginal ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-zinc-800 border-transparent text-zinc-500'}`}
           >
             {settings.showOriginal ? 'ORIGIN' : 'TRANS'}
           </button>
        </div>

        <div className="space-y-4 pt-2">
          {[
            { label: 'Yazı', key: 'fontSize', min: 10, max: 24 },
            { label: 'Cam', key: 'opacity', min: 0, max: 1, step: 0.1 }
          ].map(slider => (
            <div key={slider.key} className="flex items-center justify-between">
               <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{slider.label}</span>
               <input 
                type="range" 
                min={slider.min} max={slider.max} step={slider.step || 1}
                value={(settings as any)[slider.key]} 
                onChange={(e) => setSettings(s => ({ ...s, [slider.key]: parseFloat(e.target.value) }))} 
                className="w-32 h-1 bg-zinc-800 rounded-full appearance-none accent-blue-500" 
               />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
