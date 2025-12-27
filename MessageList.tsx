import React, { useEffect, useRef } from 'react';
import { Message, Role } from './types.ts';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
  isLiveActive: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLiveActive }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLiveActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </div>
        <p className="mt-4 text-slate-600 font-bold">Je vous écoute...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </div>
          <h2 className="text-xl font-serif-legal text-slate-900">Bienvenue Maître</h2>
          <p className="text-slate-500 text-sm max-w-xs">Posez votre question juridique sur le droit marocain, français ou égyptien.</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl ${msg.role === Role.USER ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'}`}>
              {msg.isThinking ? (
                <div className="flex gap-1 py-1"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>
              ) : (
                <div className="prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};
