import React, { useEffect, useRef } from 'react';
import { EmotionType, EMOTIONS } from '../utils/assistantLogic.ts';
import { Mic, Volume2, Cpu, Sparkles } from 'lucide-react';

interface ZaraAvatarProps {
  emotion: EmotionType;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  speechText?: string;
  onMicClick?: () => void;
  thinkingMode?: boolean;
}

export const ZaraAvatar: React.FC<ZaraAvatarProps> = ({
  emotion,
  isListening,
  isThinking,
  isSpeaking,
  speechText,
  onMicClick,
  thinkingMode = true,
}) => {
  const meta = EMOTIONS[emotion] || EMOTIONS.Friendly;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio frequency wave animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      step += isSpeaking ? 0.08 : isListening ? 0.05 : 0.02;

      const numBars = 32;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let amplitude = 4;
        if (isSpeaking) {
          amplitude = 12 + Math.sin(step * 2 + i * 0.4) * 16 + Math.cos(step * 3 + i * 0.2) * 10;
        } else if (isListening) {
          amplitude = 8 + Math.sin(step * 4 + i * 0.5) * 14;
        } else if (isThinking) {
          amplitude = 6 + Math.sin(step * 3 + i * 0.3) * 8;
        }

        amplitude = Math.max(3, Math.min(amplitude, height / 2 - 2));

        const x = i * (barWidth + 2);
        const y = centerY - amplitude;
        const barHeight = amplitude * 2;

        const grad = ctx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
        if (isListening) {
          grad.addColorStop(0, '#EF4444');
          grad.addColorStop(1, '#DC2626');
        } else if (isThinking) {
          grad.addColorStop(0, '#06B6D4');
          grad.addColorStop(1, '#3B82F6');
        } else if (isSpeaking) {
          grad.addColorStop(0, meta.accentColor);
          grad.addColorStop(1, '#10B981');
        } else {
          grad.addColorStop(0, 'rgba(148, 163, 184, 0.4)');
          grad.addColorStop(1, 'rgba(148, 163, 184, 0.1)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSpeaking, isListening, isThinking, meta.accentColor]);

  return (
    <div className="flex flex-col items-center justify-center p-3 md:p-6 text-center select-none">
      {/* Avatar Container with Holographic Ring */}
      <div className="relative group cursor-pointer" onClick={onMicClick}>
        {/* Exterior pulsing radial glow */}
        <div
          className={`absolute -inset-2.5 rounded-full blur-xl opacity-60 transition-all duration-700 ${
            isListening
              ? 'bg-red-500/70 scale-110 animate-ping'
              : isThinking
              ? 'bg-cyan-500/60 scale-105 animate-pulse'
              : isSpeaking
              ? 'scale-105 animate-pulse'
              : 'opacity-30 group-hover:opacity-60 scale-95'
          }`}
          style={{ backgroundColor: isListening ? '#EF4444' : isThinking ? '#06B6D4' : meta.accentColor }}
        />

        {/* Orbiting Tech Ring */}
        <div
          className={`absolute -inset-1 rounded-full border-2 border-dashed border-opacity-60 transition-transform duration-1000 ${
            isSpeaking ? 'animate-spin' : isListening ? 'animate-pulse' : ''
          }`}
          style={{ borderColor: meta.accentColor, animationDuration: '8s' }}
        />

        {/* Core Avatar Face */}
        <div className="relative w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-slate-700/80 bg-slate-900 shadow-2xl flex items-center justify-center">
          <img
            src="/src/assets/images/zara_avatar_portrait_1794037134840.jpg"
            alt="ZARA AI Avatar"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Fallback if image load fails
              e.currentTarget.style.display = 'none';
            }}
          />

          {/* Fallback Icon if image missing */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 pointer-events-none -z-10">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-300 mt-0.5">ZARA</span>
          </div>

          {/* Interactive Mic Overlay button */}
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs"
            aria-label="Toggle Microphone Voice Input"
          >
            <Mic className={`w-6 h-6 md:w-8 md:h-8 ${isListening ? 'text-red-400 animate-bounce' : 'text-cyan-300'}`} />
          </button>
        </div>

        {/* Dynamic Status Beacon */}
        <div
          className="absolute bottom-0 right-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-slate-950 flex items-center justify-center text-xs shadow-md transition-colors duration-300"
          style={{
            backgroundColor: isListening
              ? '#EF4444'
              : isThinking
              ? '#06B6D4'
              : isSpeaking
              ? '#10B981'
              : meta.accentColor,
          }}
          title={isListening ? 'Listening...' : isThinking ? 'High Reasoning Active...' : isSpeaking ? 'Speaking...' : 'Standing By'}
        >
          {isListening ? (
            <Mic className="w-3 h-3 text-white animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-3 h-3 text-white animate-pulse" />
          ) : (
            <Cpu className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-950" />
          )}
        </div>
      </div>

      {/* Title & Active Emotion Indicator */}
      <div className="mt-2.5 md:mt-4 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-base md:text-xl font-bold tracking-tight text-white font-display">
            ZARA AI
          </span>
          <span
            className="px-2 py-0.5 rounded text-[11px] md:text-xs font-medium border"
            style={{
              borderColor: meta.accentColor + '60',
              backgroundColor: meta.accentColor + '18',
              color: meta.accentColor,
            }}
          >
            {meta.nameEn} · {meta.nameRomanUrdu}
          </span>
        </div>

        <p className="hidden sm:block text-xs text-slate-400 mt-1 max-w-md line-clamp-1">
          {meta.tagline}
        </p>

        {/* State description */}
        <div className="mt-2 text-xs font-mono">
          {isListening ? (
            <span className="text-red-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              ZARA sun rahi hai... (Listening)
            </span>
          ) : isThinking ? (
            <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 animate-spin" />
              High Reasoning (gemini-3.8-flash) in progress...
            </span>
          ) : isSpeaking ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              ZARA bol rahi hai... (Speaking)
            </span>
          ) : (
            <span className="text-slate-500">
              Standing by for @Tony Stark · Ready for Urdu & English commands
            </span>
          )}
        </div>
      </div>

      {/* Real-time Waveform Canvas */}
      <div className="w-full max-w-xs mt-3 h-10 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={40}
          className="w-full h-full opacity-90"
        />
      </div>
    </div>
  );
};
