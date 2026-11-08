import React from 'react';
import { Mic, Volume2, VolumeX, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { EmotionType, EMOTIONS } from '../utils/assistantLogic.ts';

export type NavTab = 'chat' | 'builder' | 'reminders' | 'emotions';

interface TopBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeEmotion: EmotionType;
  onEmotionClick: () => void;
  isListening: boolean;
  onMicToggle: () => void;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onOpenSettings: () => void;
  thinkingMode: boolean;
  onToggleThinking: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  activeEmotion,
  onEmotionClick,
  isListening,
  onMicToggle,
  ttsEnabled,
  onToggleTts,
  onOpenSettings,
  thinkingMode,
  onToggleThinking,
}) => {
  const emotionMeta = EMOTIONS[activeEmotion] || EMOTIONS.Friendly;

  return (
    <header className="flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element brand wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('chat');
          }}
          className="text-base md:text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          ZARA AI
        </a>

        {/* Emotion Indicator Button */}
        <button
          onClick={onEmotionClick}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors hover:brightness-110 whitespace-nowrap shrink-0"
          style={{
            borderColor: emotionMeta.accentColor + '60',
            backgroundColor: emotionMeta.accentColor + '15',
            color: emotionMeta.accentColor,
          }}
          title="Click to change personality emotion mode"
        >
          <span>{emotionMeta.nameEn}</span>
          <span className="text-slate-400 font-urdu">{emotionMeta.nameUrdu}</span>
        </button>
      </div>

      {/* Zone 2: 4 concise single-line text navigation links (scrollable on mobile) */}
      <nav className="flex items-center gap-4 md:gap-6 text-xs md:text-sm font-medium text-slate-400 overflow-x-auto no-scrollbar shrink">
        <button
          onClick={() => onTabChange('chat')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'chat' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => onTabChange('builder')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'builder' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Website Studio
        </button>
        <button
          onClick={() => onTabChange('reminders')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'reminders' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Alarms
        </button>
        <button
          onClick={() => onTabChange('emotions')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'emotions' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          10 Personalities
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
        {/* Thinking Mode Switcher */}
        <button
          onClick={onToggleThinking}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 border ${
            thinkingMode
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="High Thinking Reasoning Engine (gemini-4-argon with ThinkingLevel.HIGH)"
        >
          <Sparkles className={`w-3.5 h-3.5 ${thinkingMode ? 'text-cyan-400 animate-pulse' : ''}`} />
          <span className="hidden md:inline">High Thinking</span>
        </button>

        {/* TTS Toggle */}
        <button
          onClick={onToggleTts}
          className="p-1.5 md:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          title={ttsEnabled ? 'Mute Voice Output' : 'Enable Voice Output'}
          aria-label="Toggle Voice Output"
        >
          {ttsEnabled ? <Volume2 className="w-3.5 md:w-4 h-3.5 md:h-4 text-emerald-400" /> : <VolumeX className="w-3.5 md:w-4 h-3.5 md:h-4 text-slate-500" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 md:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="Settings & Voice Config"
          aria-label="Settings"
        >
          <SettingsIcon className="w-3.5 md:w-4 h-3.5 md:h-4" />
        </button>

        {/* Primary Mic Action Button */}
        <button
          onClick={onMicToggle}
          className={`px-2.5 md:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            isListening
              ? 'bg-red-600 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm'
          }`}
          aria-label={isListening ? 'Stop Listening' : 'Voice Input'}
        >
          <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : ''}`} />
          <span className="hidden xs:inline">{isListening ? 'Listening' : 'Mic'}</span>
        </button>
      </div>
    </header>
  );
};
