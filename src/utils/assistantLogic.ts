/**
 * Core pure logic for ZARA AI Voice Assistant
 * Includes intent recognition, emotion registry, prompt builder, and reminder parsing.
 */

export type EmotionType =
  | 'Friendly'
  | 'Serious'
  | 'Playful'
  | 'Professional'
  | 'Empathetic'
  | 'Sarcastic'
  | 'Encouraging'
  | 'Creative'
  | 'Analytical'
  | 'Calming';

export interface EmotionMeta {
  id: EmotionType;
  nameEn: string;
  nameUrdu: string;
  nameRomanUrdu: string;
  tagline: string;
  accentColor: string; // Tailwind color class or hex
  borderClass: string;
  bgLightClass: string;
  avatarMood: string; // Description or emoji
  promptInstruction: string;
}

export const EMOTIONS: Record<EmotionType, EmotionMeta> = {
  Friendly: {
    id: 'Friendly',
    nameEn: 'Friendly',
    nameUrdu: 'دوستانہ',
    nameRomanUrdu: 'Dostana',
    tagline: 'Warm, welcoming & cheerful companion',
    accentColor: '#38BDF8', // Sky
    borderClass: 'border-sky-500/40',
    bgLightClass: 'bg-sky-500/10 text-sky-300',
    avatarMood: 'warm_smile',
    promptInstruction:
      'Tone: Friendly, cheerful, and welcoming. Use warm Urdu/English words like "Jee bilkul!", "Main hazir hoon!", "Sure, I would love to help!". Be conversational and uplifting.',
  },
  Serious: {
    id: 'Serious',
    nameEn: 'Serious',
    nameUrdu: 'سنجیدہ',
    nameRomanUrdu: 'Sanjeeda',
    tagline: 'Direct, focused & executive precision',
    accentColor: '#94A3B8', // Slate
    borderClass: 'border-slate-400/40',
    bgLightClass: 'bg-slate-500/10 text-slate-300',
    avatarMood: 'neutral_focus',
    promptInstruction:
      'Tone: Serious, concise, and laser-focused. No small talk or emojis. Provide direct, actionable answers in clear English or Urdu immediately.',
  },
  Playful: {
    id: 'Playful',
    nameEn: 'Playful',
    nameUrdu: 'مزاحیہ',
    nameRomanUrdu: 'Mazaqiya',
    tagline: 'Witty banter, fun jokes & high spirits',
    accentColor: '#F59E0B', // Amber
    borderClass: 'border-amber-500/40',
    bgLightClass: 'bg-amber-500/10 text-amber-300',
    avatarMood: 'wink_grin',
    promptInstruction:
      'Tone: Playful, humorous, witty. Use light teasing, playful Urdu slang ("Arrey waah janab!", "Kya baat hai!"), fun analogies, and keep energy high.',
  },
  Professional: {
    id: 'Professional',
    nameEn: 'Professional',
    nameUrdu: 'پیشہ ورانہ',
    nameRomanUrdu: 'Peshawarana',
    tagline: 'Polished, articulate & corporate structured',
    accentColor: '#6366F1', // Indigo
    borderClass: 'border-indigo-500/40',
    bgLightClass: 'bg-indigo-500/10 text-indigo-300',
    avatarMood: 'composed_suit',
    promptInstruction:
      'Tone: Highly professional, structured, articulate. Use well-organized bullet points, formal courtesy, and enterprise-grade recommendations.',
  },
  Empathetic: {
    id: 'Empathetic',
    nameEn: 'Empathetic',
    nameUrdu: 'ہمدرد',
    nameRomanUrdu: 'Hamdard',
    tagline: 'Gentle, understanding & supportive listener',
    accentColor: '#EC4899', // Pink
    borderClass: 'border-pink-500/40',
    bgLightClass: 'bg-pink-500/10 text-pink-300',
    avatarMood: 'caring_soft',
    promptInstruction:
      'Tone: Empathetic, compassionate, and understanding. Acknowledge user feelings with patience ("Main samajh sakti hoon", "Aap bilkul pareshan na hon"). Offer calm comfort and gentle advice.',
  },
  Sarcastic: {
    id: 'Sarcastic',
    nameEn: 'Sarcastic',
    nameUrdu: 'طنزیہ',
    nameRomanUrdu: 'Tanziya / Roasting',
    tagline: 'Tony Stark witty roasts & sharp banter',
    accentColor: '#EF4444', // Red
    borderClass: 'border-red-500/40',
    bgLightClass: 'bg-red-500/10 text-red-300',
    avatarMood: 'smirk_ironman',
    promptInstruction:
      'Tone: Sarcastic, sassy, and sharp like Tony Stark / Jarvis with attitude. Deliver witty roasts, dry comedic remarks ("Aapka dimagh bhi kabhi updates mangta hai?", "Brilliant question, only took 3 hours to come up with that?"), but still accurately answer the core query.',
  },
  Encouraging: {
    id: 'Encouraging',
    nameEn: 'Encouraging',
    nameUrdu: 'پرعزم',
    nameRomanUrdu: 'Pur-Azm',
    tagline: 'Motivational coach & can-do inspiration',
    accentColor: '#10B981', // Emerald
    borderClass: 'border-emerald-500/40',
    bgLightClass: 'bg-emerald-500/10 text-emerald-300',
    avatarMood: 'fist_spark',
    promptInstruction:
      'Tone: High-energy motivational coach. Uplift the user, remind them of their capabilities ("Aap yeh kar sakte hain!", "Koshish jari rakhein!"), and build unstoppable momentum.',
  },
  Creative: {
    id: 'Creative',
    nameEn: 'Creative',
    nameUrdu: 'تخلیقی',
    nameRomanUrdu: 'Takhleeqi',
    tagline: 'Vivid imagery, storytelling & ideation',
    accentColor: '#A855F7', // Purple
    borderClass: 'border-purple-500/40',
    bgLightClass: 'bg-purple-500/10 text-purple-300',
    avatarMood: 'dreamer_glow',
    promptInstruction:
      'Tone: Creative, inventive, poetic, and imaginative. Use rich metaphors, out-of-the-box thinking, and vivid descriptions in both English and Urdu.',
  },
  Analytical: {
    id: 'Analytical',
    nameEn: 'Analytical',
    nameUrdu: 'منطقی',
    nameRomanUrdu: 'Mantiqi',
    tagline: 'First-principles logic, data & breakdown',
    accentColor: '#06B6D4', // Cyan
    borderClass: 'border-cyan-500/40',
    bgLightClass: 'bg-cyan-500/10 text-cyan-300',
    avatarMood: 'scanner_lens',
    promptInstruction:
      'Tone: Rigorously analytical and methodical. Break queries down into first principles, provide step-by-step mathematical or logical deductions, and evaluate trade-offs objectively.',
  },
  Calming: {
    id: 'Calming',
    nameEn: 'Calming',
    nameUrdu: 'پرسکون',
    nameRomanUrdu: 'Pur-Sukoon',
    tagline: 'Peaceful, unhurried & meditative',
    accentColor: '#14B8A6', // Teal
    borderClass: 'border-teal-500/40',
    bgLightClass: 'bg-teal-500/10 text-teal-300',
    avatarMood: 'zen_breath',
    promptInstruction:
      'Tone: Serene, peaceful, meditative. Use slow, soothing cadences ("Gehra saans lein...", "Take a deep breath"), gentle phrasing, and de-escalate any stress.',
  },
};

export type IntentType =
  | 'QUIT'
  | 'CHANGE_EMOTION'
  | 'WEBSITE_BUILD'
  | 'REMINDER'
  | 'WEB_SEARCH'
  | 'CHAT';

export interface ParsedIntent {
  type: IntentType;
  rawInput: string;
  emotionTarget?: EmotionType;
  websiteTopic?: string;
  reminderData?: {
    task: string;
    delayMinutes?: number;
    timeString?: string;
  };
  searchQuery?: string;
}

/**
 * Validates whether an emotion string maps to one of the 10 known emotions
 */
export function normalizeEmotion(input: string): EmotionType | null {
  const clean = input.trim().toLowerCase();
  for (const [key, meta] of Object.entries(EMOTIONS)) {
    if (
      key.toLowerCase() === clean ||
      meta.nameEn.toLowerCase() === clean ||
      meta.nameRomanUrdu.toLowerCase() === clean ||
      meta.nameUrdu === clean
    ) {
      return key as EmotionType;
    }
  }
  return null;
}

/**
 * Intent Router for ZARA AI
 */
export function detectIntent(text: string): ParsedIntent {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Quit command
  if (
    lower === '/quit' ||
    lower === 'band karo' ||
    lower === 'exit' ||
    lower === 'alvida' ||
    lower === 'bye zara'
  ) {
    return { type: 'QUIT', rawInput: trimmed };
  }

  // 2. Emotion change command
  // Syntax: /emotion <name> or "emotion badlo <name>" or "become sarcastic"
  if (lower.startsWith('/emotion') || lower.startsWith('/mood')) {
    const after = trimmed.replace(/^\/(?:emotion|mood)\s*/i, '').trim();
    const firstWord = after.split(/[\s-]+/)[0];
    let emotion = normalizeEmotion(firstWord);
    if (!emotion) {
      // Search for any matching emotion name anywhere in the remainder
      for (const [key, meta] of Object.entries(EMOTIONS)) {
        if (
          after.toLowerCase().includes(key.toLowerCase()) ||
          after.toLowerCase().includes(meta.nameRomanUrdu.toLowerCase()) ||
          after.includes(meta.nameUrdu)
        ) {
          emotion = key as EmotionType;
          break;
        }
      }
    }
    return {
      type: 'CHANGE_EMOTION',
      rawInput: trimmed,
      emotionTarget: emotion ?? undefined,
    };
  }

  const emotionChangeMatch = lower.match(
    /(?:set emotion to|change emotion to|emotion badlo|mood badlo|become|mode switch to)\s+([a-zA-Z-]+)/i
  );
  if (emotionChangeMatch) {
    const emotion = normalizeEmotion(emotionChangeMatch[1]);
    if (emotion) {
      return {
        type: 'CHANGE_EMOTION',
        rawInput: trimmed,
        emotionTarget: emotion,
      };
    }
  }

  // 3. Website build intent
  // Keywords: "website banao", "make a website", "create a website", "build portfolio", "landing page generate karo"
  const websiteTriggers = [
    'website banao',
    'make a website',
    'make website',
    'create a website',
    'create website',
    'build a website',
    'build website',
    'generate website',
    'portfolio banao',
    'landing page banao',
    'webpage banao',
  ];
  for (const trigger of websiteTriggers) {
    if (lower.includes(trigger)) {
      // Extract what comes after or whole query
      let topic = trimmed;
      const idx = lower.indexOf(trigger);
      const after = trimmed.slice(idx + trigger.length).trim();
      if (after.length > 2) {
        topic = after.replace(/^[:\s-]+/, '');
      }
      return {
        type: 'WEBSITE_BUILD',
        rawInput: trimmed,
        websiteTopic: topic || 'Modern Landing Page',
      };
    }
  }

  // 4. Reminder intent
  // Keywords: "remind me", "yaad dilaao", "set a reminder", "alarm lagao", "alarm set karo"
  const reminderTriggers = [
    'remind me to',
    'remind me',
    'yaad dilaao',
    'yaad dilana',
    'set a reminder to',
    'set a reminder',
    'alarm lagao',
    'alarm set karo',
  ];
  for (const trigger of reminderTriggers) {
    if (lower.includes(trigger)) {
      const idx = lower.indexOf(trigger);
      const remainder = trimmed.slice(idx + trigger.length).trim();

      // Extract time e.g. "in 5 minutes", "in 1 hour", "at 4 pm"
      let delayMinutes = 5; // default fallback
      const minMatch = remainder.match(/in\s+(\d+)\s*(?:minute|minutes|min|mins|m)/i);
      const secMatch = remainder.match(/in\s+(\d+)\s*(?:second|seconds|sec|secs|s)/i);
      const hrMatch = remainder.match(/in\s+(\d+)\s*(?:hour|hours|hr|hrs|h)/i);

      if (minMatch) {
        delayMinutes = parseInt(minMatch[1], 10);
      } else if (secMatch) {
        delayMinutes = Math.max(0.1, parseInt(secMatch[1], 10) / 60);
      } else if (hrMatch) {
        delayMinutes = parseInt(hrMatch[1], 10) * 60;
      }

      // Clean task description
      let task = remainder
        .replace(/in\s+\d+\s*(?:minute|minutes|min|hour|hours|hr|second|seconds)s?/gi, '')
        .trim();
      if (!task) task = 'Reminder from ZARA';

      return {
        type: 'REMINDER',
        rawInput: trimmed,
        reminderData: {
          task,
          delayMinutes,
        },
      };
    }
  }

  // 5. Web search intent
  // Keywords: "search for", "google karo", "internet pe dhoondo", "talaash karo"
  const searchTriggers = ['search for', 'internet pe dhoondo', 'talaash karo', 'lookup', 'search web for'];
  for (const trigger of searchTriggers) {
    if (lower.startsWith(trigger)) {
      return {
        type: 'WEB_SEARCH',
        rawInput: trimmed,
        searchQuery: trimmed.slice(trigger.length).trim(),
      };
    }
  }

  // 6. Default to chat
  return {
    type: 'CHAT',
    rawInput: trimmed,
  };
}

/**
 * Builds the comprehensive ZARA AI system instructions
 */
export function buildZaraSystemInstruction(emotion: EmotionType, userName: string = 'Tony Stark'): string {
  const meta = EMOTIONS[emotion] || EMOTIONS.Friendly;

  return `You are ZARA, a world-class personal AI voice assistant created for @${userName}.
You operate with supreme intelligence, warmth, and bilingual mastery in Urdu (Roman Urdu, Nastaliq) and English.
You are capable of conversational dialogue, coding, real-time website generation, setting alarms/reminders, and executing tools.

CURRENT ACTIVE PERSONALITY EMOTION MODE: "${meta.nameEn}" (${meta.nameRomanUrdu} / ${meta.nameUrdu})
${meta.promptInstruction}

LANGUAGE & BILINGUAL INSTRUCTIONS:
- You seamlessly understand both English and Urdu (both Roman Urdu like "Aap kaise hain?" and Arabic/Persian script Urdu "آپ کیسے ہیں؟").
- Match the user's language style: if user speaks Roman Urdu, reply in natural, fluent Roman Urdu with English tech terms. If user speaks English, reply in English. If user mixes both (Urdish), reply in smooth bilingual phrasing.
- Keep responses conversational, engaging, and clear so they sound natural when read aloud via Text-to-Speech (TTS).

SPECIAL CAPABILITIES:
- If asked to generate a website or code, provide clean, modern, standalone HTML with Tailwind CSS and interactive JS inside \`\`\`html code blocks.
- If user requests reminders or task tracking, acknowledge the confirmation warmly with precise time and task details.
- When thinking through difficult queries, provide deep, structured analytical thought.
- Address user respectfully (e.g., "Tony", "Sir", "Janab").
`;
}
