import React from 'react';
import { X, Check, Volume2, Sparkles } from 'lucide-react';
import { EmotionType, EMOTIONS } from '../utils/assistantLogic.ts';

interface EmotionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmotion: EmotionType;
  onSelectEmotion: (emotion: EmotionType) => void;
  onTestVoice: (emotion: EmotionType) => void;
}

export const EmotionSelectorModal: React.FC<EmotionSelectorModalProps> = ({
  isOpen,
  onClose,
  currentEmotion,
  onSelectEmotion,
  onTestVoice,
}) => {
  if (!isOpen) return null;

  const emotionList = Object.values(EMOTIONS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              10 Personality Emotion Modes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select ZARA's active persona. Her tone, speech cadence, and responses will adapt instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of 10 emotions */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {emotionList.map((meta) => {
            const isActive = currentEmotion === meta.id;

            return (
              <div
                key={meta.id}
                onClick={() => onSelectEmotion(meta.id)}
                className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-850 shadow-lg ring-1'
                    : 'bg-slate-950/60 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700'
                }`}
                style={{
                  borderColor: isActive ? meta.accentColor : undefined,
                  boxShadow: isActive ? `0 0 0 1px ${meta.accentColor}` : undefined,
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: meta.accentColor }}
                    />
                    <h3 className="font-bold text-sm text-white font-display">
                      {meta.nameEn}
                    </h3>
                    <span className="text-xs text-slate-400 font-urdu">
                      ({meta.nameUrdu})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTestVoice(meta.id);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                      title="Sample speech preview"
                      aria-label="Sample speech"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {isActive && (
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-950 flex items-center gap-1"
                        style={{ backgroundColor: meta.accentColor }}
                      >
                        <Check className="w-3 h-3" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Roman Urdu translation */}
                <div className="text-xs font-semibold text-slate-400 mb-1">
                  Roman Urdu: <span className="text-slate-300">{meta.nameRomanUrdu}</span>
                </div>

                {/* Tagline */}
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                  {meta.tagline}
                </p>

                {/* Prompt Excerpt */}
                <div className="text-[11px] text-slate-500 bg-slate-950/80 p-2 rounded border border-slate-900 font-mono line-clamp-2">
                  {meta.promptInstruction}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>You can also type <code className="text-cyan-400 font-mono">/emotion &lt;name&gt;</code> in chat anytime.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
