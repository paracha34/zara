import { EmotionType } from '../utils/assistantLogic';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  emotion?: EmotionType;
  timestamp: string;
  isAudio?: boolean;
  intent?: string;
  thinkingProcess?: string;
  websiteId?: string;
}

export interface GeneratedWebsite {
  id: string;
  title: string;
  description: string;
  html: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderItem {
  id: string;
  task: string;
  dueTime: number; // timestamp ms
  createdAt: number;
  status: 'active' | 'completed' | 'snoozed';
  priority?: 'normal' | 'high';
}

export interface UserSettings {
  defaultEmotion: EmotionType;
  ttsEnabled: boolean;
  ttsSpeed: number; // 0.8 - 1.5
  language: 'ur-PK' | 'en-US';
  userName: string;
  thinkingMode: boolean; // enables higher reasoning effort when supported by the selected Workers AI model
  modelName: string;
}
