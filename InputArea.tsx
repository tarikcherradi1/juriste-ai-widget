import React, { useState, useRef } from 'react';
import { Mode, Attachment } from './types.ts';
// @ts-ignore
import * as mammoth from 'mammoth';
// @ts-ignore
import * as XLSX from 'xlsx';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onToggleLive: () => void;
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  isLoading: boolean;
  isLiveActive: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, onToggleLive, currentMode, onModeChange, isLoading, isLiveActive 
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const reader = new FileReader();

      if (ext === 'docx') {
        reader.onload = async (ev) => {
          const res = await mammoth.extractRawText({ arrayBuffer: ev.target?.result as ArrayBuffer });
          const base64 = btoa(unescape(encodeURIComponent(res.value)));
          setAttachments(prev => [...prev, { name: file.name, mimeType: 'text/plain', data: base64 }]);
        };
        reader.readAsArrayBuffer(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        reader.onload = (ev) => {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
          const base64 = btoa(unescape(encodeURIComponent(csv)));
          setAttachments(prev => [...prev, { name: file.name, mimeType: 'text/csv', data: base64 }]);
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (ev) => {
          const base64 = (ev.target?.result as string).split(',')[1];
          setAttachments(prev => [...prev, { name: file.name, mimeType: file.type || 'application/octet-stream', data: base64 }]);
        };
        reader.readAsDataURL(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 no-print">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button onClick={() => onModeChange(Mode.FAST)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${currentMode === Mode.FAST ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>⚖️ Standard</button>
          <button onClick={() => onModeChange(Mode.DEEP)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${currentMode === Mode.DEEP ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>🏛️ Jurisprudence</button>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1">
                <span className="truncate max-w-[100px]">{a.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="ml-2 text-red-400">×</button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
          <button type="button" onClick={onToggleLive} className={`p-3 rounded-xl transition-all ${isLiveActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" multiple />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>

          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isLiveActive}
            placeholder={isLiveActive ? "Conversation vocale..." : "Décrivez votre cas juridique..."}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-2"
          />

          <button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading || isLiveActive} className="p-3 bg-slate-900 text-white rounded-xl disabled:opacity-30 shadow-lg transition-transform active:scale-95">
            {isLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
          </button>
        </form>
      </div>
    </div>
  );
};
