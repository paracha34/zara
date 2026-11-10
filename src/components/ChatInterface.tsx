import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Volume2,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { ChatMessage } from '../types/assistant.ts';
import { EmotionType, EMOTIONS } from '../utils/assistantLogic.ts';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  isListening: boolean;
  onMicToggle: () => void;
  currentEmotion: EmotionType;
  onOpenEmotionModal: () => void;
  onOpenWebsite: (websiteId: string) => void;
  onReplaySpeech: (text: string) => void;
  thinkingMode: boolean;
  onToggleThinking: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isThinking,
  isListening,
  onMicToggle,
  currentEmotion,
  onOpenEmotionModal,
  onOpenWebsite,
  onReplaySpeech,
  thinkingMode,
  onToggleThinking,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    { text: 'website banao mera portfolio with dark theme', label: 'Create Portfolio Website' },
    { text: '/emotion Sarcastic - roast me Tony Stark style', label: 'Switch to Sarcastic Mode' },
    { text: 'remind me to inspect Mark LXXXV armor in 15 minutes', label: 'Set 15-Min Reminder' },
    { text: 'Assalam o alaikum ZARA, aaj ka schedule aur tasks kya hain?', label: 'Urdu Daily Briefing' },
    { text: 'Explain quantum entanglement step by step in Roman Urdu', label: 'High Reasoning Query' },
  ];

  const currentMeta = EMOTIONS[currentEmotion] || EMOTIONS.Friendly;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 md:px-6">
      {/* Sample Quick Prompt Suggestions Bar */}
      <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-slate-800/80 mb-2">
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          Quick Directives:
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(p.text)}
            className="text-xs px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const msgEmotion = msg.emotion ? EMOTIONS[msg.emotion] : currentMeta;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-700 bg-slate-900 flex items-center justify-center shadow">
                {isUser ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 font-mono">
                    TS
                  </div>
                ) : (
                  <img
                    src="/src/assets/images/zara_avatar_portrait_1794037134840.jpg"
                    alt="ZARA"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>

              {/* Message Bubble Body */}
              <div
                className={`rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-800/90 text-slate-100 border border-slate-700 rounded-tr-none'
                    : 'bg-slate-900/90 text-slate-200 border rounded-tl-none shadow-md'
                }`}
                style={!isUser ? { borderColor: (msgEmotion?.accentColor || '#38BDF8') + '35' } : {}}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-800 text-xs">
                  <span className="font-semibold text-slate-300">
                    {isUser ? 'Tony Stark' : 'ZARA AI'}
                  </span>

                  <div className="flex items-center gap-2 text-slate-500">
                    {!isUser && msg.emotion && (
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: msgEmotion.accentColor }}
                      >
                        [{msgEmotion.nameEn}]
                      </span>
                    )}
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap font-sans text-slate-100">
                  {msg.content}
                </div>

                {/* Website Studio Link if generated */}
                {msg.websiteId && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                      <Code2 className="w-4 h-4" />
                      <span>Interactive Website Ready in Studio</span>
                    </div>
                    <button
                      onClick={() => onOpenWebsite(msg.websiteId!)}
                      className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-medium flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Launch Preview
                    </button>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-end gap-2 mt-2 pt-1 text-slate-400">
                  {!isUser && (
                    <button
                      onClick={() => onReplaySpeech(msg.content)}
                      className="p-1 hover:text-cyan-400 transition"
                      title="Read aloud with ZARA Voice"
                      aria-label="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1 hover:text-cyan-400 transition"
                    title="Copy response"
                    aria-label="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl rounded-tl-none p-4 text-sm text-cyan-300 shadow-lg">
              <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                <span>ZARA High Reasoning Engine</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono text-[10px]">
                  gemini-3.8-flash · ThinkingLevel.HIGH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluating complex intent, bilingual Urdu/English parameters, and synthesizing response...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <div className="py-3 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          {/* Personality pill button */}
          <button
            type="button"
            onClick={onOpenEmotionModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
            title="Switch Emotion Mode"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentMeta.accentColor }}
            />
            <span>{currentMeta.nameEn}</span>
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask ZARA in English or Urdu ('website banao', 'remind me in 5m', '/emotion Playful')..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-inner"
              disabled={isThinking}
            />
          </div>

          {/* Mic Button */}
          <button
            type="button"
            onClick={onMicToggle}
            className={`p-3 rounded-xl transition ${
              isListening
                ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isListening ? 'Stop recording voice' : 'Start speaking (Urdu/English)'}
            aria-label="Microphone"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition shadow-md flex items-center justify-center shrink-0"
            aria-label="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <div className="flex items-center gap-3">
            <span>Voice input: Urdu & English Web Speech</span>
            <span>·</span>
            <span>Commands: /quit, /emotion &lt;name&gt;</span>
          </div>
          <button
            type="button"
            onClick={onToggleThinking}
            className={`font-mono transition ${
              thinkingMode ? 'text-cyan-400 font-semibold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Argon Thinking: {thinkingMode ? 'HIGH (Active)' : 'Standard'}
          </button>
        </div>
      </div>
    </div>
  );
};
