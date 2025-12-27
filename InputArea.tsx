import React, { useState } from 'react';
import { Mode, Attachment } from './types.ts';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onToggleLive: () => void;
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  isLoading: boolean;
  isLiveActive: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onToggleLive, currentMode, onModeChange, isLoading, isLiveActive }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, []);
      setInput('');
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button onClick={() => onModeChange(Mode.FAST)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${currentMode === Mode.FAST ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>Standard</button>
        <button onClick={() => onModeChange(Mode.DEEP)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${currentMode === Mode.DEEP ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Jurisprudence</button>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-slate-100 p-2 rounded-xl border border-slate-200 focus-within:border-slate-400">
        <button type="button" onClick={onToggleLive} className={`p-2 rounded-lg ${isLiveActive ? 'bg-red-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </button>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question..."
          className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-2"
          disabled={isLoading || isLiveActive}
        />
        <button type="submit" disabled={!input.trim() || isLoading} className="p-2 bg-slate-900 text-white rounded-lg disabled:opacity-30">
          {isLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
        </button>
      </form>
    </div>
  );
};
