
import React, { useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import ReactMarkdown from 'react-markdown';
import { speakText } from '../services/geminiService';

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
                 <div className="absolute inset-0 bg-gold-400 rounded-full animate-ping opacity-20"></div>
                 <svg className="w-12 h-12 text-legal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </div>
             <p className="mt-8 text-legal-900 font-bold text-lg">Mode Écoute Activé</p>
             <p className="text-slate-500 font-arabic">أنا أسمعك الآن، تفضل بالتحدث</p>
         </div>
     )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-full text-center space-y-8 py-10">
            <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-4xl font-serif-legal text-legal-900">Bienvenue, Petit Détective !</h2>
                <p className="text-slate-600 text-lg max-w-md mx-auto">
                    Je suis ton Robot Juriste. Je t'aide à comprendre les règles et les lois en t'amusant.
                </p>
                <p className="font-arabic text-2xl text-legal-800 mt-4">مرحباً بك! أنا مساعدك القانوني الصغير</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-blue-500 flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">1</div>
                    <p className="font-bold text-legal-900 mb-2">Pose ta question</p>
                    <p className="text-xs text-slate-500 italic">"Est-ce qu'on a le droit d'avoir un lion comme animal de compagnie ?"</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-gold-500 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-full flex items-center justify-center mb-4">2</div>
                    <p className="font-bold text-legal-900 mb-2">Donne un papier</p>
                    <p className="text-xs text-slate-500 italic">Utilise le trombone pour me montrer une photo d'un texte sérieux.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-green-500 flex flex-col items-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">3</div>
                    <p className="font-bold text-legal-900 mb-2">Écoute-moi</p>
                    <p className="text-xs text-slate-500 italic">Clique sur le haut-parleur pour que je te lise la réponse.</p>
                </div>
            </div>
            
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Prêt à commencer ? Écris un message en bas !</p>
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.role === Role.USER;
          const isArabic = /[\u0600-\u06FF]/.test(msg.content.substring(0, 50));
          
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-6 ${
                isUser ? 'bg-legal-900 text-white shadow-xl' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
              }`}>
                {isUser && msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-legal-700">
                        {msg.attachments.map((att, idx) => (
                            <div key={idx} className="bg-legal-800 text-legal-100 text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-tighter">
                                📎 {att.name}
                            </div>
                        ))}
                    </div>
                )}

                {msg.isThinking ? (
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="flex gap-1"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>
                        <span className="text-xs font-bold uppercase tracking-widest">Le robot réfléchit très fort...</span>
                    </div>
                ) : (
                    <>
                    <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'} ${isArabic ? 'font-arabic text-right leading-loose' : 'leading-relaxed'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    
                    {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sources de mes recherches :</p>
                            <div className="flex flex-wrap gap-2">
                                {msg.sources.map((source, idx) => (
                                    <a key={idx} href={source} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors truncate max-w-[200px]">
                                        {source.replace('https://', '')}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isUser && (
                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-50 no-print">
                            <button onClick={() => window.print()} className="text-[10px] font-bold text-slate-400 hover:text-legal-900 uppercase flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Imprimer
                            </button>
                            <button onClick={() => handleSpeak(msg.content)} className="text-[10px] font-bold text-slate-400 hover:text-legal-900 uppercase flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                Écouter la voix
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
