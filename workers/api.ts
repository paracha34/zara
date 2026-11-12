/**
 * ZARA AI — Cloudflare Worker API
 * Handles all /api/* routes for Cloudflare Pages & Workers deployment
 */

import {
  detectIntent,
  buildZaraSystemInstruction,
  EMOTIONS,
  EmotionType,
} from '../src/utils/assistantLogic.ts';
import { GeneratedWebsite, ReminderItem, UserSettings } from '../src/types/assistant.ts';

export interface Env {
  AI: { run(model: string, input: Record<string, unknown>): Promise<any> };
  // KV namespace for persistent storage (optional, configured in Cloudflare dashboard)
  ZARA_KV?: any;
}

// In-memory stores (with showcase data)
const defaultWebsites: GeneratedWebsite[] = [
  {
    id: 'site-iron-man-hud',
    title: 'Stark Industries Arc Command Hub',
    description: 'Futuristic telemetry and defense dashboard with interactive reactor status and diagnostics.',
    prompt: 'Create an Iron Man Stark Industries command center dashboard with live diagnostics and arc reactor pulse.',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stark Industries Command</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col p-6 font-sans">
  <header class="flex items-center justify-between pb-6 border-b border-cyan-500/30">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full border border-cyan-400 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.6)]">
        <div class="w-3 h-3 bg-cyan-400 rounded-full"></div>
      </div>
      <div>
        <h1 class="text-xl font-bold tracking-wider text-cyan-400">STARK INDUSTRIES</h1>
        <p class="text-xs text-slate-400">MARK LXXXV · ARC REACTOR TELEMETRY</p>
      </div>
    </div>
    <div class="flex items-center gap-2 text-xs">
      <span class="px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono">STATUS: OPTIMAL</span>
    </div>
  </header>
  <main class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 flex-1">
    <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h2 class="text-sm font-semibold text-slate-400 mb-2">POWER OUTPUT</h2>
      <div class="text-4xl font-bold font-mono text-cyan-400 my-2" id="power-val">99.4%</div>
      <p class="text-xs text-slate-400 mb-4">Clean Palladium-Free Fusion Matrix</p>
      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div class="bg-cyan-500 h-2 rounded-full transition-all duration-500" style="width: 99.4%"></div>
      </div>
    </div>
    <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h2 class="text-sm font-semibold text-slate-400 mb-2">DEFENSE MATRIX</h2>
      <div class="text-4xl font-bold font-mono text-amber-400 my-2">100%</div>
      <p class="text-xs text-slate-400 mb-4">Repulsor Capacitors & Energy Shields</p>
      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div class="bg-amber-500 h-2 rounded-full" style="width: 100%"></div>
      </div>
    </div>
    <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h2 class="text-sm font-semibold text-slate-400 mb-2">ZARA PROTOCOL</h2>
      <div class="text-4xl font-bold font-mono text-emerald-400 my-2">ONLINE</div>
      <p class="text-xs text-slate-400 mb-4">Urdu/English Bilingual Voice Hub</p>
      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div class="bg-emerald-500 h-2 rounded-full" style="width: 100%"></div>
      </div>
    </div>
  </main>
  <footer class="pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
    <span>CLASSIFIED // LEVEL 9 SECURITY CLEARANCE</span>
    <span>DESIGNED FOR TONY STARK</span>
  </footer>
</body>
</html>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultReminders: ReminderItem[] = [
  {
    id: 'rem-1',
    task: 'Review Stark Industries AI architecture and Jarvis telemetry',
    dueTime: Date.now() + 1800000,
    createdAt: Date.now() - 600000,
    status: 'active',
    priority: 'high',
  },
  {
    id: 'rem-2',
    task: 'Coffee break aur pani peene ka waqt (Urdu reminder)',
    dueTime: Date.now() + 600000,
    createdAt: Date.now() - 300000,
    status: 'active',
    priority: 'normal',
  },
];

const defaultUserSettings: UserSettings = {
  defaultEmotion: 'Friendly',
  ttsEnabled: true,
  ttsSpeed: 1.0,
  language: 'ur-PK',
  userName: 'Tony Stark',
  thinkingMode: true,
  modelName: '@cf/zai-org/glm-4.7-flash',
};

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

async function readCollection<T>(env: Env, key: string, fallback: T): Promise<T> {
  if (!env.ZARA_KV) return fallback;
  const value = await env.ZARA_KV.get(key, 'json');
  if (value !== null && value !== undefined) return value as T;
  await env.ZARA_KV.put(key, JSON.stringify(fallback));
  return fallback;
}

async function writeCollection<T>(env: Env, key: string, value: T): Promise<void> {
  if (env.ZARA_KV) await env.ZARA_KV.put(key, JSON.stringify(value));
}

const CHAT_MODEL = '@cf/zai-org/glm-4.7-flash';

async function callWorkersAI(
  env: Env,
  prompt: string,
  systemInstruction: string,
  enableHighThinking: boolean
): Promise<{ text: string; modelUsed: string; thinkingUsed: boolean }> {
  if (!env.AI || typeof env.AI.run !== 'function') {
    throw new Error('Cloudflare Workers AI binding "AI" is missing. Configure it in the Pages project.');
  }

  const result = await env.AI.run(CHAT_MODEL, {
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1800,
    temperature: 0.7,
    ...(enableHighThinking ? { reasoning_effort: 'high' } : {}),
  });

  const choiceText = result?.choices?.[0]?.message?.content;
  const text = typeof result?.response === 'string'
    ? result.response
    : typeof choiceText === 'string'
      ? choiceText
      : Array.isArray(choiceText)
        ? choiceText.map((part: any) => part?.text || '').join('')
        : '';

  if (!text.trim()) {
    throw new Error('Workers AI returned an empty response.');
  }

  return { text: text.trim(), modelUsed: CHAT_MODEL, thinkingUsed: !!enableHighThinking };
}

async function generateWebsite(
  env: Env,
  topic: string,
  emotion: EmotionType
): Promise<{ title: string; description: string; html: string }> {
  const systemInstruction = `You are ZARA's elite Web Generator engine.
Generate a complete, modern, stunning, responsive, standalone single-file HTML5 website with Tailwind CSS loaded via CDN: <script src="https://cdn.tailwindcss.com"></script>.
Include interactive JavaScript for tab switching, buttons, counters, form handling, or animations.
Do not use markdown backticks in the html output when responding in JSON.
Tone: high-aesthetic, production-ready, dark modern theme tailored to: "${topic}".`;

  const prompt = `Generate a complete production-quality HTML website for: "${topic}".
Return ONLY a valid JSON object matching this schema:
{
  "title": "Short title of the website",
  "description": "One sentence summary of the site",
  "html": "<!DOCTYPE html><html>...</html>"
}`;

  const result = await callWorkersAI(env, prompt, systemInstruction, true);
  const cleanText = result.text.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleanText);
  if (typeof parsed.html !== 'string' || !parsed.html.toLowerCase().includes('<html')) {
    throw new Error('AI did not return valid standalone HTML.');
  }
  return {
    title: typeof parsed.title === 'string' ? parsed.title : topic,
    description: typeof parsed.description === 'string' ? parsed.description : `Website generated for ${topic}`,
    html: parsed.html,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    const storedWebsites = await readCollection<GeneratedWebsite[]>(env, 'websites', defaultWebsites);
    const storedReminders = await readCollection<ReminderItem[]>(env, 'reminders', defaultReminders);
    let userSettings = await readCollection<UserSettings>(env, 'settings', defaultUserSettings);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') return corsPreflight();

    // Route: GET /api/health
    if (pathname === '/api/health' && request.method === 'GET') {
      return json({
        status: 'ok',
        assistant: 'ZARA',
        bilingual: true,
        aiBindingConfigured: !!env.AI,
        model: CHAT_MODEL,
        runtime: 'cloudflare-worker',
      });
    }

    // Route: POST /api/chat
    if (pathname === '/api/chat' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const {
        message,
        emotion: reqEmotion,
        history = [],
        thinkingMode = userSettings.thinkingMode,
        userName = userSettings.userName,
      } = body;

      if (!message) return json({ error: 'Message is required' }, 400);

      const currentEmotion: EmotionType = reqEmotion || userSettings.defaultEmotion || 'Friendly';
      const parsedIntent = detectIntent(message);

      if (parsedIntent.type === 'QUIT') {
        return json({
          reply: 'Alvida! Main standby mode par ja rahi hoon. Jab bhi zaroorat ho, bas aawaz dein.',
          intent: 'QUIT',
          emotion: currentEmotion,
          thinkingUsed: false,
        });
      }

      if (parsedIntent.type === 'CHANGE_EMOTION') {
        const newEmotion = parsedIntent.emotionTarget || 'Friendly';
        userSettings.defaultEmotion = newEmotion;
        await writeCollection(env, 'settings', userSettings);
        const meta = EMOTIONS[newEmotion];
        return json({
          reply: `Emotion switched to **${meta.nameEn}** (${meta.nameRomanUrdu} / ${meta.nameUrdu})!\n\n${meta.tagline}`,
          intent: 'CHANGE_EMOTION',
          newEmotion,
          emotion: newEmotion,
          thinkingUsed: false,
        });
      }

      if (parsedIntent.type === 'WEBSITE_BUILD') {
        const topic = parsedIntent.websiteTopic || 'Modern Showcase';
        let webResult;\n        try {\n          webResult = await generateWebsite(env, topic, currentEmotion);\n        } catch (error) {\n          console.error('Website generation failed:', error);\n          return json({ error: 'Website generation failed. Check Workers AI availability and try again.' }, 503);\n        }

        const newSite: GeneratedWebsite = {
          id: `site-${Date.now()}`,
          title: webResult.title,
          description: webResult.description,
          html: webResult.html,
          prompt: message,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storedWebsites.unshift(newSite);
        await writeCollection(env, 'websites', storedWebsites);

        return json({
          reply: `Website successfully ban gayi hai! 🚀\n\n**Title:** ${webResult.title}\n**Description:** ${webResult.description}\n\nAap "Website Studio" tab mein iska live interactive preview dekh sakte hain!`,
          intent: 'WEBSITE_BUILD',
          emotion: currentEmotion,
          websiteData: newSite,
          thinkingUsed: true,
        });
      }

      if (parsedIntent.type === 'REMINDER' && parsedIntent.reminderData) {
        const delayMins = parsedIntent.reminderData.delayMinutes || 5;
        const dueTime = Date.now() + Math.round(delayMins * 60 * 1000);
        const reminder: ReminderItem = {
          id: `rem-${Date.now()}`,
          task: parsedIntent.reminderData.task,
          dueTime,
          createdAt: Date.now(),
          status: 'active',
          priority: 'normal',
        };
        storedReminders.unshift(reminder);
        await writeCollection(env, 'reminders', storedReminders);
        return json({
          reply: `Reminder set kar diya! ⏰\n📌 **Task:** ${reminder.task}\n⏱️ **${delayMins} minute(s) baad**`,
          intent: 'REMINDER',
          emotion: currentEmotion,
          reminderData: reminder,
          thinkingUsed: false,
        });
      }

      // Standard AI chat
      const systemInstruction = buildZaraSystemInstruction(currentEmotion, userName);
      const recent = (history as any[]).slice(-6);
      const contextPrompt =
        recent.length > 0
          ? recent.map((h: any) => `${h.role === 'user' ? userName : 'ZARA'}: ${h.content}`).join('\n') +
            `\n${userName}: ${message}\nZARA:`
          : `${userName}: ${message}\nZARA:`;

      let aiResult;\n      try {\n        aiResult = await callWorkersAI(env, contextPrompt, systemInstruction, !!thinkingMode);\n      } catch (error) {\n        console.error('Workers AI chat failed:', error);\n        return json({ error: 'ZARA AI is temporarily unavailable. Check Workers AI binding, model availability, or daily usage limits.' }, 503);\n      }
      return json({
        reply: aiResult.text,
        intent: 'CHAT',
        emotion: currentEmotion,
        modelUsed: aiResult.modelUsed,
        thinkingUsed: aiResult.thinkingUsed,
      });
    }

    // Route: POST /api/generate-website
    if (pathname === '/api/generate-website' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const { prompt, topic, emotion = userSettings.defaultEmotion } = body;
      const siteTopic = topic || prompt || 'Modern Interactive Application';
      let result;\n      try {\n        result = await generateWebsite(env, siteTopic, emotion);\n      } catch (error) {\n        console.error('Website generation failed:', error);\n        return json({ error: 'Website generation failed. Check Workers AI availability and try again.' }, 503);\n      }

      const newSite: GeneratedWebsite = {
        id: `site-${Date.now()}`,
        title: result.title,
        description: result.description,
        html: result.html,
        prompt: prompt || siteTopic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storedWebsites.unshift(newSite);
      await writeCollection(env, 'websites', storedWebsites);
      return json(newSite);
    }

    // Route: POST /api/stt — audio transcription with Cloudflare Workers AI Whisper
    if (pathname === '/api/stt' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { audio?: string; language?: string };
        const audio = body.audio;
        if (!audio || typeof audio !== 'string') return json({ error: 'Base64 audio is required' }, 400);
        if (audio.length > 12_000_000) return json({ error: 'Audio file is too large (max about 8 MB)' }, 413);
        if (!env.AI) return json({ error: 'Workers AI binding is not configured' }, 503);

        const result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
          audio,
          task: 'transcribe',
          ...(body.language ? { language: body.language } : {}),
        });
        const transcript = typeof result?.text === 'string' ? result.text.trim() : '';
        if (!transcript) return json({ error: 'No speech detected' }, 422);
        return json({ text: transcript, modelUsed: '@cf/openai/whisper-large-v3-turbo' });
      } catch (error) {
        console.error('Workers AI STT error:', error);
        return json({ error: 'Speech transcription failed. Please try again.' }, 502);
      }
    }

    // Route: POST /api/tts — Urdu TTS uses browser-native speech synthesis.
    if (pathname === '/api/tts' && request.method === 'POST') {
      return json({
        available: false,
        fallback: 'browser-speech-synthesis',
        message: 'Workers AI does not currently provide a supported Urdu Pakistan voice. Use an Urdu voice installed in the browser or operating system.',
      }, 501);
    }

    // Route: GET /api/websites
    if (pathname === '/api/websites' && request.method === 'GET') {
      return json(storedWebsites);
    }

    // Route: POST /api/websites/save
    if (pathname === '/api/websites/save' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const { title, description, html, prompt, id } = body;
      if (!html) return json({ error: 'HTML is required' }, 400);

      const existingIdx = id ? storedWebsites.findIndex((s) => s.id === id) : -1;
      if (existingIdx >= 0) {
        storedWebsites[existingIdx] = {
          ...storedWebsites[existingIdx],
          title: title || storedWebsites[existingIdx].title,
          description: description || storedWebsites[existingIdx].description,
          html,
          updatedAt: new Date().toISOString(),
        };
        await writeCollection(env, 'websites', storedWebsites);
        return json(storedWebsites[existingIdx]);
      } else {
        const newSite: GeneratedWebsite = {
          id: `site-${Date.now()}`,
          title: title || 'Custom Web Creation',
          description: description || 'Created in ZARA Website Studio',
          html,
          prompt: prompt || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storedWebsites.unshift(newSite);
        await writeCollection(env, 'websites', storedWebsites);
        return json(newSite);
      }
    }

    // Route: GET & POST /api/reminders
    if (pathname === '/api/reminders') {
      if (request.method === 'GET') return json(storedReminders);
      if (request.method === 'POST') {
        const body = (await request.json()) as any;
        const { task, dueTime, priority = 'normal' } = body;
        if (!task || !dueTime) return json({ error: 'Task and dueTime required' }, 400);

        const reminder: ReminderItem = {
          id: `rem-${Date.now()}`,
          task,
          dueTime: Number(dueTime),
          createdAt: Date.now(),
          status: 'active',
          priority,
        };
        storedReminders.unshift(reminder);
        await writeCollection(env, 'reminders', storedReminders);
        return json(reminder);
      }
    }

    // Route: PATCH & DELETE /api/reminders/:id
    if (pathname.startsWith('/api/reminders/')) {
      const id = pathname.split('/').pop();
      if (request.method === 'PATCH') {
        const body = (await request.json()) as any;
        const item = storedReminders.find((r) => r.id === id);
        if (!item) return json({ error: 'Not found' }, 404);
        if (body.status) item.status = body.status;
        if (body.dueTime) item.dueTime = Number(body.dueTime);
        await writeCollection(env, 'reminders', storedReminders);
        return json(item);
      }
      if (request.method === 'DELETE') {
        const idx = storedReminders.findIndex((r) => r.id === id);
        if (idx >= 0) storedReminders.splice(idx, 1);
        await writeCollection(env, 'reminders', storedReminders);
        return json({ success: true });
      }
    }

    // Route: GET/POST /api/settings
    if (pathname === '/api/settings') {
      if (request.method === 'GET') return json(userSettings);
      if (request.method === 'POST') {
        const body = (await request.json()) as any;
        userSettings = { ...userSettings, ...body };
        await writeCollection(env, 'settings', userSettings);
        return json(userSettings);
      }
    }

    return json({ error: 'Not found' }, 404);
  },
};
