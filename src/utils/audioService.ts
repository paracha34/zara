/**
 * Audio service handling:
 * 1. Speech Recognition (STT) for Urdu / English
 * 2. Speech Synthesis (TTS) with lock & speed controls
 * 3. Web Audio API synthesized sound cues (Chimes / Beeps / Alarms)
 */

// Synthesize pleasant sound effects using Web Audio API
class AudioSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Short mic activate beep
  playMicBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      // AudioContext may be restricted by autoplay
    }
  }

  // Futuristic reminder chime
  playReminderAlarm() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Pulse 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Pulse 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.2); // D6
      gain2.gain.setValueAtTime(0.18, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.65);
    } catch (e) {
      // Ignore audio context exceptions
    }
  }

  // Completion chime
  playSuccessTone() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }
}

export const soundEffects = new AudioSynth();

// Realistic Urdu TTS using Google Cloud Text-to-Speech API with browser fallback
class TtsController {
  private isSpeaking = false;
  private audioElement: HTMLAudioElement | null = null;

  async speak(
    text: string,
    options: {
      speed?: number;
      language?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ) {
    // Clean markdown from text and speak first 300 chars for fast, responsive output
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 300)
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    this.stop();
    this.isSpeaking = true;
    options.onStart?.();

    try {
      // Call backend TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          language: options.language || 'ur-PK',
          speed: options.speed || 1.35,
        }),
      });

      if (!response.ok) {
        // Fallback to browser TTS
        this.fallbackBrowserTTS(cleanText, options);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (this.audioElement) {
        this.audioElement.pause();
        URL.revokeObjectURL(this.audioElement.src);
      }

      this.audioElement = new Audio(audioUrl);
      this.audioElement.playbackRate = options.speed ? options.speed * 1.2 : 1.35;

      this.audioElement.onended = () => {
        this.isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        options.onEnd?.();
      };

      this.audioElement.onerror = () => {
        this.isSpeaking = false;
        options.onError?.();
        // Fallback
        this.fallbackBrowserTTS(cleanText, options);
      };

      await this.audioElement.play();
    } catch (err) {
      this.fallbackBrowserTTS(cleanText, options);
    }
  }

  private fallbackBrowserTTS(
    text: string,
    options: { speed?: number; language?: string; onStart?: () => void; onEnd?: () => void; onError?: () => void }
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.isSpeaking = false;
      options.onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.speed ? options.speed * 1.2 : 1.35; // Fast responsive rate
    utterance.pitch = 1.05;
    utterance.lang = options.language || 'ur-PK';

    const voices = window.speechSynthesis.getVoices();
    // Try to find best Urdu or English voice
    const bestVoice =
      voices.find((v) => v.lang.startsWith('ur')) ||
      voices.find((v) => v.lang.includes('en-GB')) ||
      voices.find((v) => v.lang.includes('en-US')) ||
      voices[0];

    if (bestVoice) utterance.voice = bestVoice;

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };
    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
      options.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  getSpeakingStatus() {
    return this.isSpeaking;
  }
}

export const ttsController = new TtsController();

// Speech recognition controller
export function createSpeechRecognizer(
  language: 'ur-PK' | 'en-US',
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: (err: any) => void
) {
  if (typeof window === 'undefined') return null;

  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRec) {
    return null;
  }

  const recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language;

  recognition.onresult = (event: any) => {
    if (event.results && event.results[0] && event.results[0][0]) {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event);
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}
