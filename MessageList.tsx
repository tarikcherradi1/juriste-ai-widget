import React, { useEffect, useRef } from 'react';
import { Message, Role } from './types.ts';
import ReactMarkdown from 'react-markdown';
import { speakText } from './geminiService.ts';

interface MessageListProps {
  messages: Message[];
  isLiveActive: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLiveActive }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSpeak = async (text: string) => {
    const buffer = await speakText(text);
    if (buffer) {
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
        <p className="mt-8 text-slate-900 font-bold text-lg">Mode Écoute Activé</p>
        <p className="text-slate-500 font-arabic">أنا أسمعك الآن، تفضل بالتحدث</p>
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
            <p className="text-slate-500 max-w-md mx-auto">Votre assistant spécialisé en droit marocain, français et égyptien.</p>
            <p className="font-arabic text-xl text-slate-800">مساعدك القانوني المتخصص في القانون المغربي والفرنسي والمصري</p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.role === Role.USER;
          const isArabic = /[\u0600-\u06FF]/.test(msg.content.substring(0, 100));
          
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-6 ${
                isUser ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
              }`}>
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
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sources consultées :</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((s, idx) => (
                            <a key={idx} href={s} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors truncate max-w-[150px]">
                              {s.replace('https://', '')}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isUser && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 no-print">
                        <button onClick={() => handleSpeak(msg.content)} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                          Écouter
                        </button>
                      </div>
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
