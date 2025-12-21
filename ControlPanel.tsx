
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
        className="fixed bottom-10 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 z-[100] animate-pulse"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    );
  }

  return (
    <div 
      style={panelStyle}
      className="fixed bottom-6 left-1/2 w-[92%] max-w-sm bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl z-[100] transition-transform duration-200 ease-out"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center space-x-2">
           <div className={`w-2 h-2 rounded-full ${settings.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
           <span className="text-[10px] font-black text-white uppercase tracking-tighter">AI ENGINE v4</span>
        </div>
        <div className="flex items-center space-x-3">
           {isProcessing && <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
           <button onClick={() => setIsMinimized(true)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
             </svg>
           </button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center space-x-2 bg-zinc-800/50 p-1.5 rounded-xl border border-white/5">
           <select 
             value={settings.sourceLanguage}
             onChange={(e) => setSettings(s => ({ ...s, sourceLanguage: e.target.value }))}
             className="flex-1 bg-transparent text-[10px] font-bold text-white text-center appearance-none focus:outline-none"
           >
             <option value="auto">OTOMATİK</option>
             <option value="Japanese">Japonca</option>
             <option value="Korean">Korece</option>
             <option value="Chinese">Çince</option>
             <option value="English">İngilizce</option>
           </select>
           <div className="text-zinc-600 font-bold text-xs">→</div>
           <select 
             value={settings.targetLanguage}
             onChange={(e) => setSettings(s => ({ ...s, targetLanguage: e.target.value }))}
             className="flex-1 bg-transparent text-[10px] font-bold text-white text-center appearance-none focus:outline-none"
           >
             <option value="Turkish">Türkçe</option>
             <option value="English">İngilizce</option>
           </select>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => setSettings(s => ({ ...s, isEnabled: !s.isEnabled }))} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${settings.isEnabled ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
             {settings.isEnabled ? 'DURDUR' : 'BAŞLAT'}
           </button>
           <button onClick={() => setSettings(s => ({ ...s, showOriginal: !s.showOriginal }))} className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${settings.showOriginal ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-zinc-800 border-transparent text-zinc-500'}`}>
             {settings.showOriginal ? 'ÇEVİRİ' : 'ORİJİNAL'}
           </button>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
             <span className="text-[9px] text-zinc-500 font-bold uppercase">UI Ölçek</span>
             <div className="flex items-center space-x-2">
               <input type="range" min="0.7" max="1.2" step="0.05" value={settings.uiScale} onChange={(e) => setSettings(s => ({ ...s, uiScale: parseFloat(e.target.value) }))} className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none accent-blue-500" />
               <span className="text-[9px] font-bold text-blue-400 w-6">{Math.round(settings.uiScale * 100)}%</span>
             </div>
          </div>
          <div className="flex items-center justify-between">
             <span className="text-[9px] text-zinc-500 font-bold uppercase">Yazı Boyutu</span>
             <div className="flex items-center space-x-2">
               <input type="range" min="10" max="20" value={settings.fontSize} onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))} className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none accent-blue-500" />
               <span className="text-[9px] font-bold text-blue-400 w-6">{settings.fontSize}</span>
             </div>
          </div>
          <div className="flex items-center justify-between">
             <span className="text-[9px] text-zinc-500 font-bold uppercase">Şeffaflık</span>
             <div className="flex items-center space-x-2">
               <input type="range" min="0" max="1" step="0.1" value={settings.opacity} onChange={(e) => setSettings(s => ({ ...s, opacity: parseFloat(e.target.value) }))} className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none accent-blue-500" />
               <span className="text-[9px] font-bold text-blue-400 w-6">{Math.round(settings.opacity * 10)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
