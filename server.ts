import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  detectIntent,
  buildZaraSystemInstruction,
  EMOTIONS,
  EmotionType,
} from './src/utils/assistantLogic.ts';
import { GeneratedWebsite, ReminderItem, UserSettings } from './src/types/assistant.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '15mb' }));

const PORT = 3000;

// Initialize GoogleGenAI SDK on server side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory data stores (with pre-seeded showcase data)
const storedWebsites: GeneratedWebsite[] = [
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
      <button onclick="boostPower()" class="mt-4 w-full py-2 px-3 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 rounded text-slate-950 transition">OVERCLOCK REACTOR</button>
    </div>

    <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h2 class="text-sm font-semibold text-slate-400 mb-2">DEFENSE MATRIX</h2>
      <div class="text-4xl font-bold font-mono text-amber-400 my-2">100%</div>
      <p class="text-xs text-slate-400 mb-4">Repulsor Capacitors & Energy Shields</p>
      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div class="bg-amber-500 h-2 rounded-full" style="width: 100%"></div>
      </div>
      <button onclick="alert('Defensive shields primed!')" class="mt-4 w-full py-2 px-3 text-xs font-semibold bg-amber-500 hover:bg-amber-400 rounded text-slate-950 transition">DEPLOY SHIELDS</button>
    </div>

    <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h2 class="text-sm font-semibold text-slate-400 mb-2">ZARA PROTOCOL</h2>
      <div class="text-4xl font-bold font-mono text-emerald-400 my-2">ONLINE</div>
      <p class="text-xs text-slate-400 mb-4">Urdu/English Bilingual Voice Hub</p>
      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div class="bg-emerald-500 h-2 rounded-full" style="width: 100%"></div>
      </div>
      <button onclick="alert('ZARA AI is synchronized and standing by.')" class="mt-4 w-full py-2 px-3 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 rounded text-slate-950 transition">PING ASSISTANT</button>
    </div>
  </main>

  <footer class="pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
    <span>CLASSIFIED // LEVEL 9 SECURITY CLEARANCE</span>
    <span>DESIGNED FOR TONY STARK</span>
  </footer>

  <script>
    function boostPower() {
      const el = document.getElementById('power-val');
      el.textContent = '120.0%';
      el.className = 'text-4xl font-bold font-mono text-emerald-400 my-2 animate-bounce';
      setTimeout(() => {
        el.textContent = '100.0%';
        el.className = 'text-4xl font-bold font-mono text-cyan-400 my-2';
      }, 2500);
    }
  </script>
</body>
</html>`,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const storedReminders: ReminderItem[] = [
  {
    id: 'rem-1',
    task: 'Review Stark Industries AI architecture and Jarvis telemetry',
    dueTime: Date.now() + 1800000, // in 30 mins
    createdAt: Date.now() - 600000,
    status: 'active',
    priority: 'high',
  },
  {
    id: 'rem-2',
    task: 'Coffee break aur pani peene ka waqt (Urdu reminder)',
    dueTime: Date.now() + 600000, // in 10 mins
    createdAt: Date.now() - 300000,
    status: 'active',
    priority: 'normal',
  },
];

let userSettings: UserSettings = {
  defaultEmotion: 'Friendly',
  ttsEnabled: true,
  ttsSpeed: 1.0,
  language: 'ur-PK',
  userName: 'Tony Stark',
  thinkingMode: true,
  modelName: 'gemini-4-argon',
};

// Helper to call Gemini with fallback handling
async function callGemini(
  prompt: string,
  systemInstruction: string,
  enableHighThinking: boolean
): Promise<{ text: string; modelUsed: string; thinkingUsed: boolean }> {
  // If API key is missing, provide a friendly simulated assistant response
  if (!apiKey) {
    return {
      text: `Assalam o alaikum Tony! ZARA hazir hai. Main aapki poori madad karne ke liye tayyar hoon.\n\n(Note: Connect your GEMINI_API_KEY in Settings > Secrets to unlock full live AI generation.)\n\nAap mujhse website banane, reminders lagane ya 10 mukhtalif emotions mein baat karne ka keh sakte hain!`,
      modelUsed: 'offline-simulator',
      thinkingUsed: false,
    };
  }

  // If High Thinking requested, use 'gemini-4-argon' with ThinkingLevel.HIGH
  if (enableHighThinking) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      return {
        text: response.text || 'ZARA did not receive a response text.',
        modelUsed: 'gemini-4-argon',
        thinkingUsed: true,
      };
    } catch (argonError: any) {
      console.warn('gemini-4-argon call failed, falling back to gemini-3.8-flash:', argonError?.message || argonError);
      // Fallback gracefully to gemini-3.8-flash
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      return {
        text: fallbackResponse.text || 'ZARA fallback response completed.',
        modelUsed: 'gemini-3.8-flash',
        thinkingUsed: false,
      };
    }
  }

  // Standard fast model
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return {
      text: response.text || '',
      modelUsed: 'gemini-3.8-flash',
      thinkingUsed: false,
    };
  } catch (err: any) {
    console.error('Gemini API call failed:', err);
    throw err;
  }
}

// Helper to generate full standalone website HTML
async function generateWebsiteHtml(topic: string, emotion: EmotionType): Promise<{ title: string; description: string; html: string }> {
  const systemInstruction = `You are ZARA's elite Web Generator engine.
Generate a complete, modern, stunning, responsive, standalone single-file HTML5 website with Tailwind CSS loaded via CDN: <script src="https://cdn.tailwindcss.com"></script>.
Include interactive JavaScript for tab switching, buttons, counters, form handling, or animations.
Do not use markdown backticks in the html output when responding in JSON.
Tone of web design: high-aesthetic, production-ready, dark or sleek modern theme with rich content tailored to: "${topic}".`;

  const prompt = `Generate a complete production-quality HTML website for: "${topic}".
Return ONLY a valid JSON object matching this schema:
{
  "title": "Short title of the website",
  "description": "One sentence summary of the site",
  "html": "<!DOCTYPE html><html>...</html>"
}`;

  if (!apiKey) {
    // Fallback template
    return {
      title: `${topic} Showcase`,
      description: `A responsive web page generated for ${topic} by ZARA.`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col p-8 font-sans">
  <header class="max-w-4xl mx-auto w-full pb-8 border-b border-slate-800">
    <h1 class="text-3xl font-bold text-cyan-400">${topic}</h1>
    <p class="text-slate-400 mt-2">Bilingual prototype crafted by ZARA Voice Assistant</p>
  </header>
  <main class="max-w-4xl mx-auto w-full py-12 flex-1">
    <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4 text-white">Interactive Feature Station</h2>
      <p class="text-slate-300 mb-6">This site was created via ZARA's voice & text generation engine for Tony Stark.</p>
      <button onclick="alert('Feature activated successfully!')" class="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium rounded-lg transition shadow-lg">Test Interaction</button>
    </div>
  </main>
  <footer class="max-w-4xl mx-auto w-full text-slate-500 text-sm border-t border-slate-800 pt-6">
    Generated by ZARA AI · Fast Standalone Preview
  </footer>
</body>
</html>`,
    };
  }

  try {
    const result = await callGemini(prompt, systemInstruction, true);
    // Parse JSON safely
    const cleanText = result.text.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanText);
    return {
      title: parsed.title || topic,
      description: parsed.description || `Website generated for ${topic}`,
      html: parsed.html || '<!DOCTYPE html><html><body><h1>Error generating HTML</h1></body></html>',
    };
  } catch (err) {
    console.warn('JSON parsing for website failed, generating fallback HTML:', err);
    return {
      title: `${topic} Site`,
      description: `Interactive web app for ${topic}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-xl w-full bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 text-center shadow-2xl">
    <div class="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚡</div>
    <h1 class="text-2xl font-bold mb-2">${topic}</h1>
    <p class="text-slate-400 mb-6">Generated by ZARA AI Assistant with high thinking reasoning.</p>
    <button onclick="alert('Welcome to ${topic}!')" class="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition">Explore Project</button>
  </div>
</body>
</html>`,
    };
  }
}

// --- API ROUTES ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assistant: 'ZARA',
    bilingual: true,
    apiKeyConfigured: !!apiKey,
    activeEmotion: userSettings.defaultEmotion,
    thinkingMode: userSettings.thinkingMode,
  });
});

// 2. Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      emotion: reqEmotion,
      language = 'ur-PK',
      history = [],
      thinkingMode = userSettings.thinkingMode,
      userName = userSettings.userName,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const currentEmotion: EmotionType = reqEmotion || userSettings.defaultEmotion || 'Friendly';
    const parsedIntent = detectIntent(message);

    // Intent 1: QUIT
    if (parsedIntent.type === 'QUIT') {
      const farewellUrdu = 'Alvida Tony! Main standby mode par ja rahi hoon. Jab bhi zaroorat ho, bas aawaz dein.';
      const farewellEn = 'Goodbye Tony! Entering standby mode. Whenever you need me, just say the word.';
      const reply = language.startsWith('ur') ? `${farewellUrdu}\n\n${farewellEn}` : `${farewellEn}\n\n${farewellUrdu}`;
      return res.json({
        reply,
        intent: 'QUIT',
        emotion: currentEmotion,
        thinkingUsed: false,
      });
    }

    // Intent 2: CHANGE_EMOTION
    if (parsedIntent.type === 'CHANGE_EMOTION') {
      const newEmotion = parsedIntent.emotionTarget || 'Friendly';
      userSettings.defaultEmotion = newEmotion;
      const meta = EMOTIONS[newEmotion];
      const reply = `ZARA ki personality mode ko **${meta.nameEn}** (${meta.nameRomanUrdu} / ${meta.nameUrdu}) par switch kar diya gaya hai!\n\n${meta.tagline}. Ab mera har jawab is andaaz mein hoga.`;
      return res.json({
        reply,
        intent: 'CHANGE_EMOTION',
        newEmotion,
        emotion: newEmotion,
        thinkingUsed: false,
      });
    }

    // Intent 3: WEBSITE_BUILD
    if (parsedIntent.type === 'WEBSITE_BUILD') {
      const topic = parsedIntent.websiteTopic || 'Modern Showcase';
      const webResult = await generateWebsiteHtml(topic, currentEmotion);

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

      const reply = `Website successfully ban gayi hai! 🚀\n\n**Title:** ${webResult.title}\n**Description:** ${webResult.description}\n\nAap "Website Studio" tab mein iska live interactive preview dekh sakte hain, code inspect kar sakte hain, aur single-click HTML download kar sakte hain!`;

      return res.json({
        reply,
        intent: 'WEBSITE_BUILD',
        emotion: currentEmotion,
        websiteData: newSite,
        thinkingUsed: true,
      });
    }

    // Intent 4: REMINDER
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

      const reply = `Zaroor Tony! Reminder set kar diya gaya hai:\n\n📌 **Task:** ${reminder.task}\n⏱️ **Due:** ${new Date(dueTime).toLocaleTimeString()} (${delayMins} minute${delayMins > 1 ? 's' : ''} baad)\n\nMain theek waqt par notification chime aur voice alert se yaad dila doongi!`;

      return res.json({
        reply,
        intent: 'REMINDER',
        emotion: currentEmotion,
        reminderData: reminder,
        thinkingUsed: false,
      });
    }

    // Standard Chat with Gemini (supports gemini-4-argon with ThinkingLevel.HIGH)
    const systemInstruction = buildZaraSystemInstruction(currentEmotion, userName);

    // Build context with history
    let contextPrompt = '';
    if (history && Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6);
      contextPrompt = recent
        .map((h: any) => `${h.role === 'user' ? userName : 'ZARA'}: ${h.content}`)
        .join('\n');
      contextPrompt += `\n${userName}: ${message}\nZARA:`;
    } else {
      contextPrompt = `${userName}: ${message}\nZARA:`;
    }

    const aiResult = await callGemini(contextPrompt, systemInstruction, !!thinkingMode);

    return res.json({
      reply: aiResult.text,
      intent: 'CHAT',
      emotion: currentEmotion,
      modelUsed: aiResult.modelUsed,
      thinkingUsed: aiResult.thinkingUsed,
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while processing ZARA request',
    });
  }
});

// 3. Direct Website Generation Endpoint
app.post('/api/generate-website', async (req, res) => {
  try {
    const { prompt, topic, emotion = userSettings.defaultEmotion } = req.body;
    const siteTopic = topic || prompt || 'Modern Interactive Application';
    const result = await generateWebsiteHtml(siteTopic, emotion);

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

    res.json(newSite);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate website' });
  }
});

// 4. Websites list and save
app.get('/api/websites', (req, res) => {
  res.json(storedWebsites);
});

app.post('/api/websites/save', (req, res) => {
  const { title, description, html, prompt, id } = req.body;
  if (!html) return res.status(400).json({ error: 'HTML is required' });

  const existingIdx = id ? storedWebsites.findIndex((s) => s.id === id) : -1;
  if (existingIdx >= 0) {
    storedWebsites[existingIdx] = {
      ...storedWebsites[existingIdx],
      title: title || storedWebsites[existingIdx].title,
      description: description || storedWebsites[existingIdx].description,
      html,
      updatedAt: new Date().toISOString(),
    };
    return res.json(storedWebsites[existingIdx]);
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
    return res.json(newSite);
  }
});

// 5. Reminders
app.get('/api/reminders', (req, res) => {
  res.json(storedReminders);
});

app.post('/api/reminders', (req, res) => {
  const { task, dueTime, priority = 'normal' } = req.body;
  if (!task || !dueTime) return res.status(400).json({ error: 'Task and dueTime required' });

  const reminder: ReminderItem = {
    id: `rem-${Date.now()}`,
    task,
    dueTime: Number(dueTime),
    createdAt: Date.now(),
    status: 'active',
    priority,
  };
  storedReminders.unshift(reminder);
  res.json(reminder);
});

app.patch('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const item = storedReminders.find((r) => r.id === id);
  if (!item) return res.status(404).json({ error: 'Reminder not found' });
  if (status) item.status = status;
  res.json(item);
});

app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const idx = storedReminders.findIndex((r) => r.id === id);
  if (idx >= 0) {
    storedReminders.splice(idx, 1);
  }
  res.json({ success: true });
});

// 6. Settings
app.get('/api/settings', (req, res) => {
  res.json(userSettings);
});

app.post('/api/settings', (req, res) => {
  userSettings = {
    ...userSettings,
    ...req.body,
  };
  res.json(userSettings);
});

// 7. TTS Endpoint — Google Cloud Text-to-Speech
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language = 'ur-PK', speed = 1.0 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const gcpApiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;

    if (!gcpApiKey) {
      return res.status(503).json({ error: 'TTS API key not configured' });
    }

    // Map language to Google TTS voice name
    const voiceMap: Record<string, { languageCode: string; name: string; ssmlGender: string }> = {
      'ur-PK': {
        languageCode: 'ur-PK',
        name: 'ur-PK-Standard-A', // Urdu Pakistan female voice
        ssmlGender: 'FEMALE',
      },
      'en-US': {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F',
        ssmlGender: 'FEMALE',
      },
      'en-GB': {
        languageCode: 'en-GB',
        name: 'en-GB-Neural2-C',
        ssmlGender: 'FEMALE',
      },
    };

    const voiceConfig = voiceMap[language] || voiceMap['ur-PK'];

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${gcpApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text.slice(0, 5000) }, // Google TTS limit
          voice: voiceConfig,
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: Math.min(Math.max(speed, 0.25), 4.0),
            pitch: 0.0,
            effectsProfileId: ['headphone-class-device'],
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.warn('Google TTS service response:', errText);
      // Return 503 so frontend gracefully falls back to browser TTS
      return res.status(503).json({ error: 'TTS service error' });
    }

    const ttsData = (await ttsResponse.json()) as { audioContent?: string };

    if (!ttsData.audioContent) {
      return res.status(503).json({ error: 'No audio content received' });
    }

    // Decode base64 audio and return as MP3
    const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', String(audioBuffer.length));
    res.set('Cache-Control', 'no-cache');
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    res.status(503).json({ error: error.message || 'TTS service unavailable' });
  }
});

// Dev / Prod Vite mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZARA AI Voice Assistant backend active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
