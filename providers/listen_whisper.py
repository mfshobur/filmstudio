#!/usr/bin/env python3
"""Speech-to-text worker for `filmstudio listen` (faster-whisper, runs on the CPU).
usage: listen_whisper.py <model_dir> <job.json> <out.json>
job.json: [{"index": 0, "file": "/path/clip.mp3", "prompt": "the script text (helps with names)"}]
out.json: [{"index": 0, "text": "...", "words": [{"w": "hello", "start": 0.1, "end": 0.4, "p": 0.93}], "duration": 2.4}]"""
import sys, json
from faster_whisper import WhisperModel
model_dir, job, out = sys.argv[1:4]
m = WhisperModel(model_dir, device='cpu', compute_type='int8')
res = []
for it in json.load(open(job)):
    segs, info = m.transcribe(it['file'], language='en', beam_size=5, word_timestamps=True, condition_on_previous_text=False, temperature=0.0, vad_filter=False)
    words, texts = [], []
    for s in segs:
        texts.append(s.text.strip())
        for w in (s.words or []):
            words.append({'w': w.word.strip(), 'start': round(w.start, 2), 'end': round(w.end, 2), 'p': round(w.probability, 2)})
    res.append({'index': it['index'], 'text': ' '.join(texts).strip(), 'words': words, 'duration': round(info.duration, 2)})
    print('ok', it['index'], flush=True)
json.dump(res, open(out, 'w'))
