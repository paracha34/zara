/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar, NavTab } from './components/TopBar.tsx';
import { ZaraAvatar } from './components/ZaraAvatar.tsx';
import { ChatInterface } from './components/ChatInterface.tsx';
import { WebsiteBuilderView } from './components/WebsiteBuilderView.tsx';
import { RemindersView } from './components/RemindersView.tsx';
import { EmotionSelectorModal } from './components/EmotionSelectorModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { CameraPreview } from './components/CameraPreview.tsx';
import { EmotionType, EMOTIONS } from './utils/assistantLogic.ts';
import { ChatMessage, GeneratedWebsite, ReminderItem, UserSettings } from './types/assistant.ts';
import {
  soundEffects,
  ttsController,
  createSpeechRecognizer,
} from './utils/audioService.ts';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content:
      'Assalam o alaikum Tony! ZARA voice assistant active hai. Main aapki poori madad karne ke liye tayyar hoon.\n\nAap mujhse kisi bhi andaaz mein baat kar sakte hain — chahe English ho ya Urdu:\n• "website banao mera portfolio"\n• "remind me in 10 minutes to review armor telemetry"\n• "/emotion Sarcastic" (10 personality modes available!)\n• Voice mic button daba kar bol sakte hain.',
    emotion: 'Friendly',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    websiteId: 'site-iron-man-hud',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat');
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('Friendly');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('zara_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MESSAGES;
  });

  const [websites, setWebsites] = useState<GeneratedWebsite[]>([]);
  const [activeWebsiteId, setActiveWebsiteId] = useState<string | null>(null);
  const [isGeneratingWebsite, setIsGeneratingWebsite] = useState(false);

  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  const [settings, setSettings] = useState<UserSettings>({
    defaultEmotion: 'Friendly',
    ttsEnabled: true,
    ttsSpeed: 1.0,
    language: 'ur-PK',
    userName: 'Tony Stark',
    thinkingMode: true,
    modelName: '@cf/zai-org/glm-4.7-flash',
  });

  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const recognizerRef = useRef<any>(null);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zara_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Load initial websites, reminders, settings from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [webRes, remRes, setRes] = await Promise.allSettled([
          fetch('/api/websites'),
          fetch('/api/reminders'),
          fetch('/api/settings'),
        ]);

        if (webRes.status === 'fulfilled' && webRes.value.ok) {
          const webData = await webRes.value.json();
          setWebsites(webData);
          if (webData.length > 0) setActiveWebsiteId(webData[0].id);
        }

        if (remRes.status === 'fulfilled' && remRes.value.ok) {
          const remData = await remRes.value.json();
          setReminders(remData);
        }

        if (setRes.status === 'fulfilled' && setRes.value.ok) {
          const setData = await setRes.value.json();
          setSettings(setData);
          if (setData.defaultEmotion) setCurrentEmotion(setData.defaultEmotion);
          if (setData.thinkingMode !== undefined) setThinkingMode(setData.thinkingMode);
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    };

    fetchData();
  }, []);

  // Speak aloud helper using TTS
  const speakText = useCallback(
    (text: string) => {
      if (!settings.ttsEnabled) return;
      ttsController.speak(text, {
        speed: settings.ttsSpeed,
        language: settings.language,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [settings.ttsEnabled, settings.ttsSpeed, settings.language]
  );

  // Send message to server
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          emotion: currentEmotion,
          language: settings.language,
          thinkingMode: thinkingMode,
          userName: settings.userName,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // If emotion changed via directive
      if (data.newEmotion) {
        setCurrentEmotion(data.newEmotion);
      }

      // If website was generated
      if (data.websiteData) {
        setWebsites((prev) => [data.websiteData, ...prev.filter((w) => w.id !== data.websiteData.id)]);
        setActiveWebsiteId(data.websiteData.id);
      }

      // If reminder was set
      if (data.reminderData) {
        setReminders((prev) => [data.reminderData, ...prev]);
        soundEffects.playSuccessTone();
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        emotion: data.emotion || currentEmotion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        websiteId: data.websiteData?.id,
        intent: data.intent,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak answer via TTS
      speakText(data.reply);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Maazrat chahti hoon Tony! Thora sa issue aaya hai: ${err.message || 'API connection failed'}. Please retry karein.`,
        emotion: 'Empathetic',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Toggle Voice Input Recognition (STT)
  const handleToggleMic = async () => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Stop speaking if currently speaking
    ttsController.stop();
    setIsSpeaking(false);

    soundEffects.playMicBeep();

    const recognizer = createSpeechRecognizer(
      settings.language,
      (transcript) => {
        setIsListening(false);
        handleSendMessage(transcript);
      },
      () => {
        setIsListening(false);
      },
      (error) => {
        console.warn('Speech recognition error:', error);
        setIsListening(false);
        alert(`Microphone ya speech recognition issue: ${error?.message || error?.error || 'Please check microphone permission and try again.'}`);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        setIsListening(true);
        await Promise.resolve(recognizer.start());
      } catch (e: any) {
        console.warn('Error starting speech recognizer:', e);
        setIsListening(false);
        alert(`Microphone access nahi mil saka: ${e?.message || 'Browser settings mein microphone allow karein.'}`);
      }
    } else {
      alert('Speech recognition is not supported in this browser. You can type commands in the chat bar below.');
    }
  };

  // Generate new website from Website Studio
  const handleGenerateWebsite = async (prompt: string) => {
    setIsGeneratingWebsite(true);
    try {
      const res = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          topic: prompt,
          emotion: currentEmotion,
        }),
      });
      if (res.ok) {
        const site = await res.json();
        setWebsites((prev) => [site, ...prev]);
        setActiveWebsiteId(site.id);
        soundEffects.playSuccessTone();

        // Add a message in chat indicating website is ready
        const asstMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: `Website for "${site.title}" generated successfully! Check the live interactive view in Website Studio.`,
          emotion: currentEmotion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          websiteId: site.id,
        };
        setMessages((prev) => [...prev, asstMsg]);
      }
    } catch (e) {
      console.error('Failed to generate website:', e);
    } finally {
      setIsGeneratingWebsite(false);
    }
  };

  // Reminder operations
  const handleAddReminder = async (task: string, delayMinutes: number, priority: 'normal' | 'high' = 'normal') => {
    const dueTime = Date.now() + Math.round(delayMinutes * 60 * 1000);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, dueTime, priority }),
      });
      if (res.ok) {
        const item = await res.json();
        setReminders((prev) => [item, ...prev]);
        soundEffects.playSuccessTone();
      }
    } catch (e) {
      console.error('Add reminder error:', e);
    }
  };

  const handleUpdateReminderStatus = async (id: string, status: 'active' | 'completed' | 'snoozed') => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      console.error('Update reminder error:', e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Delete reminder error:', e);
    }
  };

  const handleSnoozeReminder = async (id: string, extraMinutes: number) => {
    const item = reminders.find((r) => r.id === id);
    if (!item) return;
    const newDue = Date.now() + extraMinutes * 60 * 1000;
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueTime: newDue, status: 'active' }),
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, dueTime: newDue, status: 'active' } : r))
      );
      soundEffects.playSuccessTone();
    } catch (e) {}
  };

  // Emotion switcher
  const handleSelectEmotion = (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
    setIsEmotionModalOpen(false);
    const meta = EMOTIONS[emotion];
    soundEffects.playSuccessTone();
    speakText(`Emotion mode switch ho gaya hai. Main ab ${meta.nameRomanUrdu} andaaz mein baat karungi.`);
  };

  const handleTestEmotionVoice = (emotion: EmotionType) => {
    const meta = EMOTIONS[emotion];
    speakText(`Yeh hai mera ${meta.nameRomanUrdu} andaaz. ${meta.tagline}.`);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* TopBar Contract: 1-line wordmark, 4 nav links, 1 primary action */}
      <TopBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'emotions') {
            setIsEmotionModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        activeEmotion={currentEmotion}
        onEmotionClick={() => setIsEmotionModalOpen(true)}
        isListening={isListening}
        onMicToggle={handleToggleMic}
        onCameraClick={() => setIsCameraOpen(true)}
        ttsEnabled={settings.ttsEnabled}
        onToggleTts={() => {
          const next = !settings.ttsEnabled;
          setSettings((s) => ({ ...s, ttsEnabled: next }));
          if (!next) ttsController.stop();
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        thinkingMode={thinkingMode}
        onToggleThinking={() => setThinkingMode((prev) => !prev)}
      />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Holographic ZARA Avatar Header with Audio Waveforms */}
            <div className="shrink-0 bg-gradient-to-b from-slate-950 via-slate-900/40 to-transparent border-b border-slate-900/80">
              <ZaraAvatar
                emotion={currentEmotion}
                isListening={isListening}
                isThinking={isThinking}
                isSpeaking={isSpeaking}
                onMicClick={handleToggleMic}
                thinkingMode={thinkingMode}
              />
            </div>

            {/* Bilingual Chat Thread */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isThinking={isThinking}
                isListening={isListening}
                onMicToggle={handleToggleMic}
                currentEmotion={currentEmotion}
                onOpenEmotionModal={() => setIsEmotionModalOpen(true)}
                onOpenWebsite={(websiteId) => {
                  setActiveWebsiteId(websiteId);
                  setActiveTab('builder');
                }}
                onReplaySpeech={speakText}
                thinkingMode={thinkingMode}
                onToggleThinking={() => setThinkingMode((prev) => !prev)}
              />
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <WebsiteBuilderView
            websites={websites}
            activeWebsiteId={activeWebsiteId}
            onSelectWebsite={(id) => setActiveWebsiteId(id)}
            onGenerateNew={handleGenerateWebsite}
            isGenerating={isGeneratingWebsite}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onUpdateStatus={handleUpdateReminderStatus}
            onDeleteReminder={handleDeleteReminder}
            onSnoozeReminder={handleSnoozeReminder}
          />
        )}
      </main>

      {/* Modals */}
      <EmotionSelectorModal
        isOpen={isEmotionModalOpen}
        onClose={() => setIsEmotionModalOpen(false)}
        currentEmotion={currentEmotion}
        onSelectEmotion={handleSelectEmotion}
        onTestVoice={handleTestEmotionVoice}
      />

      <CameraPreview isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          setThinkingMode(newSettings.thinkingMode);
          if (newSettings.defaultEmotion) setCurrentEmotion(newSettings.defaultEmotion);
        }}
      />
    </div>
  );
}
