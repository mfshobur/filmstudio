'use strict';
// ElevenLabs text-to-speech with timestamps. Uses the key in ELEVENLABS_API_KEY (never stored or printed).
// POST {base}/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128
// body: {text, model_id, voice_settings:{stability, similarity_boost, style, use_speaker_boost, speed}}
// response: {audio_base64, alignment:{characters, character_start_times_seconds, character_end_times_seconds}, normalized_alignment}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function wordsFromAlignment(al) {
  if (!al || !Array.isArray(al.characters)) return [];
  const w = []; let cur = null;
  al.characters.forEach((ch, i) => {
    const s = al.character_start_times_seconds[i], e = al.character_end_times_seconds[i];
    if (/\s/.test(ch)) { if (cur) { w.push(cur); cur = null; } return; }
    if (!cur) cur = { word: '', start: s, end: e };
    cur.word += ch; cur.end = e;
  });
  if (cur) w.push(cur);
  return w.map(x => ({ word: x.word, start: +x.start.toFixed(3), end: +x.end.toFixed(3) }));
}

async function synthesize(o) {
  const key = o.apiKey || process.env.ELEVENLABS_API_KEY;
  if (!key) { const e = new Error('ELEVENLABS_API_KEY is not set. Export it in the environment (never put it in spec.json).'); e.code = 'NO_KEY'; throw e; }
  if (!o.voiceId) { const e = new Error('No ElevenLabs voice id. Set spec.voice.voiceId (list voices with GET https://api.elevenlabs.io/v1/voices).'); e.code = 'NO_VOICE'; throw e; }
  const base = (o.baseUrl || process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io').replace(/\/$/, '');
  const url = base + '/v1/text-to-speech/' + encodeURIComponent(o.voiceId) + '/with-timestamps?output_format=' + (o.format || 'mp3_44100_128');
  const vs = o.settings || {};
  const body = { text: o.text, model_id: o.model || 'eleven_multilingual_v2', voice_settings: { stability: vs.stability == null ? .5 : vs.stability, similarity_boost: vs.similarity == null ? .75 : vs.similarity, style: vs.style == null ? 0 : vs.style, use_speaker_boost: vs.speakerBoost !== false, speed: vs.speed == null ? 1 : vs.speed } };
  let last = null;
  for (let attempt = 1; attempt <= (o.retries || 4); attempt++) {
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), o.timeoutMs || 60000);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': key }, body: JSON.stringify(body), signal: ac.signal });
      clearTimeout(timer);
      if (r.status === 401 || r.status === 403) { const e = new Error('ElevenLabs rejected the API key (HTTP ' + r.status + ').'); e.code = 'AUTH'; throw e; }
      if (r.status === 422) { let d = ''; try { d = JSON.stringify((await r.json()).detail || ''); } catch (_) { /* ignore */ } const e = new Error('ElevenLabs rejected the request (422): ' + d.slice(0, 300)); e.code = 'BAD_REQUEST'; throw e; }
      if (r.status === 429 || r.status >= 500) { last = new Error('ElevenLabs HTTP ' + r.status); await sleep((o.backoffMs == null ? 1000 : o.backoffMs) * attempt); continue; }
      if (!r.ok) { const e = new Error('ElevenLabs HTTP ' + r.status); e.code = 'HTTP'; throw e; }
      const j = await r.json();
      if (!j.audio_base64) { const e = new Error('ElevenLabs response had no audio_base64 field.'); e.code = 'BAD_RESPONSE'; throw e; }
      const al = j.alignment || j.normalized_alignment || null;
      return { audio: Buffer.from(j.audio_base64, 'base64'), words: wordsFromAlignment(al), duration: al && al.character_end_times_seconds && al.character_end_times_seconds.length ? al.character_end_times_seconds[al.character_end_times_seconds.length - 1] : null };
    } catch (e) {
      clearTimeout(timer);
      if (e.code) throw e;
      last = e; await sleep((o.backoffMs == null ? 1000 : o.backoffMs) * attempt);
    }
  }
  const e = new Error('ElevenLabs request failed after retries: ' + (last && last.message)); e.code = 'RETRIES'; throw e;
}
module.exports = { synthesize, wordsFromAlignment };
