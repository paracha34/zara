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

// Browser-native TTS. Voice availability depends on the user's OS/browser language packs.
class TtsController {
  private isSpeaking = false;

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
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    this.stop();
    this.isSpeaking = true;
    options.onStart?.();

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.isSpeaking = false;
      options.onError?.();
      options.onEnd?.();
      return;
    }

    try {
      const synth = window.speechSynthesis;
      let voices = synth.getVoices();
      if (!voices.length) {
        voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
          const done = () => resolve(synth.getVoices());
          synth.addEventListener('voiceschanged', done, { once: true });
          window.setTimeout(done, 1200);
        });
      }

      const language = options.language || 'ur-PK';
      const isUrdu = language.toLowerCase().startsWith('ur');
      const voice = isUrdu
        ? voices.find((v) => v.lang.toLowerCase() === 'ur-pk') ||
          voices.find((v) => v.lang.toLowerCase().startsWith('ur'))
        : voices.find((v) => v.lang.toLowerCase() === language.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()));

      // Do not silently read Urdu text in an English voice.
      const chunks = cleanText.match(/[^.!?۔؟]+[.!?۔؟]*/g) || [cleanText];
      let index = 0;
      const speakNext = () => {
        if (index >= chunks.length) {
          this.isSpeaking = false;
          options.onEnd?.();
          return;
        }
        const part = chunks[index++].trim();
        if (!part) return speakNext();
        const utterance = new SpeechSynthesisUtterance(part);
        utterance.lang = language;
        utterance.rate = Math.min(1.25, Math.max(0.75, options.speed || 1));
        utterance.pitch = 1.08;
        if (voice) utterance.voice = voice;
        utterance.onend = speakNext;
        utterance.onerror = () => {
          this.isSpeaking = false;
          options.onError?.();
          options.onEnd?.();
        };
        synth.speak(utterance);
      };
      speakNext();
    } catch {
      this.isSpeaking = false;
      options.onError?.();
      options.onEnd?.();
    }
  }

  stop() {
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
    // Fallback: record microphone audio and transcribe it with Cloudflare Workers AI Whisper.
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return null;
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let chunks: BlobPart[] = [];
    let stoppedByUser = false;
    return {
      start: async () => {
        try {
          stoppedByUser = false;
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recorder = new MediaRecorder(stream);
          chunks = [];
          recorder.ondataavailable = (event: BlobEvent) => {
            if (event.data.size > 0) chunks.push(event.data);
          };
          recorder.onerror = (event: Event) => onError(event);
          recorder.onstop = async () => {
            try {
              if (!stoppedByUser && chunks.length) {
                const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
                const bytes = new Uint8Array(await blob.arrayBuffer());
                let binary = '';
                for (let i = 0; i < bytes.length; i += 0x8000) {
                  binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
                }
                const audio = btoa(binary);
                const response = await fetch('/api/stt', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audio, language: language === 'ur-PK' ? 'ur' : 'en' }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Speech transcription failed');
                if (data.text) onResult(data.text);
              }
            } catch (error) {
              onError(error);
            } finally {
              stream?.getTracks().forEach((track) => track.stop());
              stream = null;
              onEnd();
            }
          };
          recorder.start();
        } catch (error) {
          stream?.getTracks().forEach((track) => track.stop());
          stream = null;
          onError(error);
          onEnd();
        }
      },
      stop: () => {
        stoppedByUser = false;
        if (recorder && recorder.state !== 'inactive') recorder.stop();
        else {
          stream?.getTracks().forEach((track) => track.stop());
          onEnd();
        }
      },
    };
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
