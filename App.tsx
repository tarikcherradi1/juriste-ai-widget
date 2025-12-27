import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import * as mammoth from 'mammoth';
// @ts-ignore
import * as XLSX from 'xlsx';
import { generateLegalResponse, speakText } from './geminiService.ts';
import { LiveSession } from './liveService.ts';
import { Role, Mode, Attachment, Message } from './types.ts';

/** COMPONENT: MessageList **/
interface MessageListProps {
  messages: Message[];
  isLiveActive: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLiveActive }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSpeak = async (text: string) => {
    const buffer = await speakText(text);
    if (buffer) {
      // Fix: Cast window to any to access webkitAudioContext
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  };

  if (isLiveActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl relative">
          <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20"></div>
          <svg className="w-12 h-12 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </div>
        <p className="mt-8 text-slate-900 font-bold text-lg text-center">Mode Écoute Activé<br/><span className="font-arabic text-slate-500">أنا أسمعك الآن، تفضل بالتحدث</span></p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-full text-center space-y-6">
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif-legal text-slate-900">JuristeAI Expert</h2>
            <p className="text-slate-500 max-w-md mx-auto">Assistant spécialisé en droit marocain, français et égyptien.</p>
            <p className="font-arabic text-xl text-slate-800">مساعدك القانوني المتخصص</p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.role === Role.USER;
          const isArabic = /[\u0600-\u06FF]/.test(msg.content.substring(0, 100));
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-6 ${isUser ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'}`}>
                {msg.isThinking ? (
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="flex gap-1"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Analyse en cours...</span>
                  </div>
                ) : (
                  <>
                    <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'} ${isArabic ? 'font-arabic text-right leading-loose' : 'leading-relaxed'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        {msg.sources.map((s, idx) => (
                          <a key={idx} href={s} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors truncate max-w-[150px]">{s}</a>
                        ))}
                      </div>
                    )}
                    {!isUser && (
                      <button onClick={() => handleSpeak(msg.content)} className="mt-4 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase flex items-center gap-1 no-print">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        Écouter
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};

/** COMPONENT: InputArea **/
interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onToggleLive: () => void;
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  isLoading: boolean;
  isLiveActive: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onToggleLive, currentMode, onModeChange, isLoading, isLiveActive }) => {
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

  // Fix: Add typing for event and ensure file is treated as File object
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const reader = new FileReader();
      if (ext === 'docx') {
        reader.onload = async (ev) => {
          // Fix: Type check reader result
          if (ev.target?.result instanceof ArrayBuffer) {
            const res = await mammoth.extractRawText({ arrayBuffer: ev.target.result });
            const base64 = btoa(unescape(encodeURIComponent(res.value)));
            setAttachments(prev => [...prev, { name: file.name, mimeType: 'text/plain', data: base64 }]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        reader.onload = (ev) => {
          // Fix: Type check reader result
          if (ev.target?.result instanceof ArrayBuffer) {
            const data = new Uint8Array(ev.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
            const base64 = btoa(unescape(encodeURIComponent(csv)));
            setAttachments(prev => [...prev, { name: file.name, mimeType: 'text/csv', data: base64 }]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (ev) => {
          // Fix: Type check reader result and handle split error
          if (typeof ev.target?.result === 'string') {
            const base64 = ev.target.result.split(',')[1];
            setAttachments(prev => [...prev, { name: file.name, mimeType: file.type || 'application/octet-stream', data: base64 }]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 no-print">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => onModeChange(Mode.FAST)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${currentMode === Mode.FAST ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>⚖️ Standard</button>
          <button type="button" onClick={() => onModeChange(Mode.DEEP)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${currentMode === Mode.DEEP ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>🏛️ Deep Research</button>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <button type="button" onClick={onToggleLive} className={`p-3 rounded-xl transition-all ${isLiveActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" multiple />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-slate-400 border border-slate-200 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading || isLiveActive} placeholder={isLiveActive ? "Conversation..." : "Décrivez votre cas..."} className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-2" />
          <button type="submit" disabled={!input.trim() && attachments.length === 0 || isLoading || isLiveActive} className="p-3 bg-slate-900 text-white rounded-xl disabled:opacity-30">
            {isLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
          </button>
        </form>
      </div>
    </div>
  );
};

/** MAIN: App **/
export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<Mode>(Mode.FAST);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSession = useRef<LiveSession | null>(null);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, content: text, attachments, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (mode === Mode.DEEP) {
        setMessages(prev => [...prev, { id: 'thinking', role: Role.MODEL, content: '', isThinking: true, timestamp: Date.now() }]);
      }
      const history = messages.slice(-4).map(m => ({ role: m.role, parts: [{ text: m.content }] }));
      const result = await generateLegalResponse(text, mode, history, attachments);
      setMessages(prev => [...prev.filter(m => m.id !== 'thinking'), { id: Date.now().toString(), role: Role.MODEL, content: result.text, sources: result.sources, timestamp: Date.now() }]);
    } catch (error) {
      setMessages(prev => [...prev.filter(m => m.id !== 'thinking'), { id: 'err', role: Role.SYSTEM, content: "Erreur technique.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLive = async () => {
    if (isLiveActive) {
      await liveSession.current?.stop();
      liveSession.current = null;
    } else {
      liveSession.current = new LiveSession(setIsLiveActive);
      await liveSession.current.start();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg></div>
          <div><h1 className="text-sm font-bold text-slate-900 font-serif-legal">JuristeAI</h1><p className="text-[8px] uppercase tracking-widest text-amber-600 font-bold">Expert Bilingue</p></div>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <MessageList messages={messages} isLiveActive={isLiveActive} />
        <InputArea onSendMessage={handleSendMessage} onToggleLive={toggleLive} currentMode={mode} onModeChange={setMode} isLoading={isLoading} isLiveActive={isLiveActive} />
      </main>
      <div className="bg-slate-100 p-2 text-[9px] text-center text-slate-400 no-print">⚖️ Information juridique non contractuelle. <span className="font-arabic">لا تعتبر استشارة قانونية</span></div>
    </div>
  );
}
