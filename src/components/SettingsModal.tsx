import React from 'react';
import { X, Sliders, Sparkles, Volume2, Globe, User, ShieldCheck } from 'lucide-react';
import { UserSettings } from '../types/assistant.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof UserSettings, value: any) => {
    onSaveSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-display">
              ZARA System & Voice Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* User Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              User Profile
            </label>
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => handleChange('userName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. Tony Stark"
            />
            <p className="text-[11px] text-slate-500 mt-1">ZARA addresses you by this name in conversations.</p>
          </div>

          {/* Primary Language */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Primary Voice Input Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('language', 'ur-PK')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  settings.language === 'ur-PK'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Urdu (Pakistan / ur-PK)
              </button>
              <button
                type="button"
                onClick={() => handleChange('language', 'en-US')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  settings.language === 'en-US'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                English (US / en-US)
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Speech recognition tunes automatically to this accent. Both languages are recognized in text.
            </p>
          </div>

          {/* TTS Speech Rate / Speed */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Text-to-Speech Speed
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
                {settings.ttsSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={settings.ttsSpeed}
              onChange={(e) => handleChange('ttsSpeed', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0.7x (Deliberate)</span>
              <span>1.0x (Natural)</span>
              <span>1.5x (Fast)</span>
            </div>
          </div>

          {/* High Thinking Mode Toggle */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Gemini High Thinking Mode</h4>
                  <p className="text-[11px] text-cyan-400 font-mono">model: gemini-4-argon · ThinkingLevel.HIGH</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.thinkingMode}
                onChange={(e) => handleChange('thinkingMode', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Unlocks deep reasoning steps for complex coding, math, architecture, and multi-step tool workflows.
            </p>
          </div>

          {/* Telemetry info */}
          <div className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure Server Proxy: Your API keys are managed server-side in AI Studio Secrets.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
