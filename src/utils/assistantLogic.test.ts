import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectIntent,
  normalizeEmotion,
  buildZaraSystemInstruction,
  EMOTIONS,
} from './assistantLogic';

test('normalizeEmotion correctly matches all 10 emotions by various names', () => {
  assert.equal(normalizeEmotion('Friendly'), 'Friendly');
  assert.equal(normalizeEmotion('dostana'), 'Friendly');
  assert.equal(normalizeEmotion('serious'), 'Serious');
  assert.equal(normalizeEmotion('sanjeeda'), 'Serious');
  assert.equal(normalizeEmotion('playful'), 'Playful');
  assert.equal(normalizeEmotion('mazaqiya'), 'Playful');
  assert.equal(normalizeEmotion('professional'), 'Professional');
  assert.equal(normalizeEmotion('empathetic'), 'Empathetic');
  assert.equal(normalizeEmotion('hamdard'), 'Empathetic');
  assert.equal(normalizeEmotion('sarcastic'), 'Sarcastic');
  assert.equal(normalizeEmotion('encouraging'), 'Encouraging');
  assert.equal(normalizeEmotion('pur-azm'), 'Encouraging');
  assert.equal(normalizeEmotion('creative'), 'Creative');
  assert.equal(normalizeEmotion('analytical'), 'Analytical');
  assert.equal(normalizeEmotion('mantiqi'), 'Analytical');
  assert.equal(normalizeEmotion('calming'), 'Calming');
  assert.equal(normalizeEmotion('pur-sukoon'), 'Calming');
  assert.equal(normalizeEmotion('invalid-emotion'), null);
});

test('detectIntent detects QUIT commands', () => {
  assert.equal(detectIntent('/quit').type, 'QUIT');
  assert.equal(detectIntent('band karo').type, 'QUIT');
  assert.equal(detectIntent('exit').type, 'QUIT');
});

test('detectIntent detects EMOTION change commands', () => {
  const res1 = detectIntent('/emotion Sarcastic');
  assert.equal(res1.type, 'CHANGE_EMOTION');
  assert.equal(res1.emotionTarget, 'Sarcastic');

  const res2 = detectIntent('/mood mazaqiya');
  assert.equal(res2.type, 'CHANGE_EMOTION');
  assert.equal(res2.emotionTarget, 'Playful');

  const res3 = detectIntent('become sarcastic');
  assert.equal(res3.type, 'CHANGE_EMOTION');
  assert.equal(res3.emotionTarget, 'Sarcastic');

  const res4 = detectIntent('/emotion Sarcastic - roast me Tony Stark style');
  assert.equal(res4.type, 'CHANGE_EMOTION');
  assert.equal(res4.emotionTarget, 'Sarcastic');
});

test('detectIntent detects WEBSITE_BUILD commands', () => {
  const res1 = detectIntent('website banao mera portfolio');
  assert.equal(res1.type, 'WEBSITE_BUILD');
  assert.equal(res1.websiteTopic, 'mera portfolio');

  const res2 = detectIntent('make a website for Iron Man armor showcase');
  assert.equal(res2.type, 'WEBSITE_BUILD');
  assert.ok(res2.websiteTopic?.includes('Iron Man'));
});

test('detectIntent detects REMINDER commands', () => {
  const res = detectIntent('remind me to check server logs in 10 minutes');
  assert.equal(res.type, 'REMINDER');
  assert.equal(res.reminderData?.delayMinutes, 10);
  assert.ok(res.reminderData?.task.includes('check server logs'));
});

test('detectIntent detects default CHAT', () => {
  const res = detectIntent('Assalam o alaikum ZARA, aaj ka mausam kaisa hai?');
  assert.equal(res.type, 'CHAT');
});

test('buildZaraSystemInstruction injects active emotion rules and bilingual context', () => {
  const prompt = buildZaraSystemInstruction('Sarcastic', 'Tony Stark');
  assert.ok(prompt.includes('ZARA'));
  assert.ok(prompt.includes('Sarcastic'));
  assert.ok(prompt.includes('Tony Stark'));
  assert.ok(prompt.includes('Urdu'));
});
