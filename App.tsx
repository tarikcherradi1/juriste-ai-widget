import React, { useState, useRef } from 'react';
import { generateLegalResponse } from './geminiService.ts';
import { LiveSession } from './liveService.ts';
import { MessageList } from './MessageList.tsx';
import { InputArea } from './InputArea.tsx';
import { Disclaimer } from './Disclaimer.tsx';
import { Message, Role, Mode, Attachment } from './types.ts';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<Mode>(Mode.FAST);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  
  const liveSession = useRef<LiveSession | null>(null);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: Date.now(),
      attachments: attachments
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (mode === Mode.DEEP) {
         setMessages(prev => [...prev, { id: 'thinking', role: Role.MODEL, content: '', timestamp: Date.now(), isThinking: true }]);
      }

      const history = messages.slice(-6).map(m => ({
          role: m.role === Role.USER ? 'user' : 'model',
          parts: [
            { text: m.content },
            ...(m.attachments || []).map(a => ({ inlineData: { mimeType: a.mimeType, data: a.data } }))
          ]
      }));

      const result = await generateLegalResponse(text, mode, history, attachments);

      setMessages(prev => {
          const filtered = prev.filter(m => m.id !== 'thinking');
          return [...filtered, {
            id: (Date.now() + 1).toString(),
            role: Role.MODEL,
            content: result.text,
            timestamp: Date.now(),
            sources: result.sources
          }];
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => {
          const filtered = prev.filter(m => m.id !== 'thinking');
          return [...filtered, {
            id: (Date.now() + 1).toString(),
            role: Role.SYSTEM,
            content: "Désolé, une erreur de connexion à l'IA s'est produite. Vérifiez votre clé API.",
            timestamp: Date.now()
          }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLive = async () => {
    if (isLiveActive) {
      await liveSession.current?.stop();
      liveSession.current = null;
    } else {
      liveSession.current = new LiveSession((status) => setIsLiveActive(status));
      await liveSession.current.start();
    }
  };

  const clearChat = () => {
    if (window.confirm("Effacer l'historique ?")) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
           </div>
           <div>
             <h1 className="text-sm font-bold text-slate-900 font-serif-legal">JuristeAI</h1>
             <p className="text-[8px] uppercase tracking-widest text-amber-600 font-bold">Expert JurisprudencesPro</p>
           </div>
        </div>
        <button onClick={clearChat} className="text-slate-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <MessageList messages={messages} isLiveActive={isLiveActive} />
        <InputArea 
          onSendMessage={handleSendMessage}
          onToggleLive={toggleLive}
          currentMode={mode}
          onModeChange={setMode}
          isLoading={isLoading}
          isLiveActive={isLiveActive}
        />
      </main>
      <Disclaimer />
    </div>
  );
}
