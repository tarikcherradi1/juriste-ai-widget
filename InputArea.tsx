
import React, { useState, useRef, useEffect } from 'react';
import { Mode, Attachment } from '../types';
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
  onSendMessage, 
  onToggleLive,
  currentMode, 
  onModeChange, 
  isLoading,
  isLiveActive
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        try {
            if (ext === 'docx') {
                const reader = new FileReader();
                await new Promise<void>((resolve) => {
                    reader.onload = async (event) => {
                        const arrayBuffer = event.target?.result as ArrayBuffer;
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        const base64 = btoa(unescape(encodeURIComponent(result.value)));
                        newAttachments.push({ name: file.name, mimeType: 'text/plain', data: base64 });
                        resolve();
                    };
                    reader.readAsArrayBuffer(file);
                });
            } else if (ext === 'xlsx' || ext === 'xls') {
                const reader = new FileReader();
                await new Promise<void>((resolve) => {
                    reader.onload = (event) => {
                        const data = new Uint8Array(event.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
                        const base64 = btoa(unescape(encodeURIComponent(csv)));
                        newAttachments.push({ name: file.name, mimeType: 'text/csv', data: base64 });
                        resolve();
                    };
                    reader.readAsArrayBuffer(file);
                });
            } else {
                const reader = new FileReader();
                await new Promise<void>((resolve) => {
                  reader.onload = (event) => {
                     if (event.target?.result) {
                        const base64 = (event.target.result as string).split(',')[1];
                        let mimeType = file.type || 'application/octet-stream';
                        newAttachments.push({ name: file.name, mimeType, data: base64 });
                     }
                     resolve();
                  };
                  reader.readAsDataURL(file);
                });
            }
        } catch (error) { console.error(error); }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Non supporté");
    if (isRecording) { stopDictation(); return; }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'fr-FR'; 
    recognition.continuous = true;
    recognition.interimResults = true;
    setIsRecording(true);
    recognition.onresult = (event: any) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) chunk += event.results[i][0].transcript + ' ';
      }
      if (chunk) setInput(prev => prev + chunk);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div className="bg-white border-t border-legal-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] no-print">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => onModeChange(Mode.FAST)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
              currentMode === Mode.FAST ? 'bg-legal-900 text-white border-legal-900 shadow-md' : 'bg-white text-legal-600 border-legal-200 hover:border-legal-400'
            }`}
          >
            ⚖️ Standard
          </button>
          <button
            onClick={() => onModeChange(Mode.DEEP)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
              currentMode === Mode.DEEP ? 'bg-gold-600 text-white border-gold-600 shadow-md' : 'bg-white text-gold-600 border-gold-200 hover:border-gold-400'
            }`}
          >
            🏛️ Analyse Jurisprudence
          </button>
        </div>

        {attachments.length > 0 && (
           <div className="flex flex-wrap gap-2 mb-3">
             {attachments.map((att, idx) => (
               <div key={idx} className="flex items-center bg-legal-50 text-legal-700 text-xs font-medium rounded-md px-2 py-1.5 border border-legal-200">
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-legal-400 hover:text-red-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
             ))}
           </div>
        )}

        <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-legal-400 focus-within:ring-4 focus-within:ring-legal-50 transition-all">
          <button
            onClick={onToggleLive}
            className={`p-3 rounded-xl transition-all ${isLiveActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-legal-600 border border-slate-200 hover:shadow-sm'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
          
          <button
            onClick={handleDictation}
            className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-gold-500 text-white' : 'bg-white text-legal-600 border border-slate-200 hover:shadow-sm'}`}
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>

          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-white text-legal-600 border border-slate-200 hover:shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isLiveActive}
            placeholder={isLiveActive ? "Conversation vocale en cours..." : "Expliquez votre situation juridique..."}
            className="w-full bg-transparent border-0 focus:ring-0 p-3 max-h-40 resize-none text-base font-medium placeholder-slate-400"
            rows={1}
            dir="auto"
          />
          
          <button
            onClick={() => handleSubmit()}
            disabled={(!input.trim() && attachments.length === 0) || isLoading || isLiveActive}
            className="p-3 bg-legal-900 text-white rounded-xl hover:bg-black disabled:opacity-30 transition-all shadow-lg shadow-legal-200"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
