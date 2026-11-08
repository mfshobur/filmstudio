#!/usr/bin/env python3
"""Kokoro text-to-speech worker. usage: kokoro_gen.py <model.onnx> <voices.bin> <job.json>
job.json: [{"text":..., "voice":"bf_emma", "speed":0.86, "out":"/path/x.wav"}, ...]
Writes each file as soon as it is ready so a crash only loses the clip in progress."""
import sys, json, time
import soundfile as sf
from kokoro_onnx import Kokoro
model, voices, job = sys.argv[1:4]
k = Kokoro(model, voices)
for item in json.load(open(job)):
    t = time.time()
    voice = item.get('voice', 'bf_emma')
    lang = item.get('lang') or ('en-gb' if voice[:2] in ('bf', 'bm') else 'en-us')
    samples, sr = k.create(item['text'], voice=voice, speed=item.get('speed', 0.88), lang=lang)
    sf.write(item['out'], samples, sr)
    print('ok', item['out'], round(len(samples) / sr, 2), 's audio in', round(time.time() - t, 1), 's', flush=True)
