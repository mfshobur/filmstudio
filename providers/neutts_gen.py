#!/usr/bin/env python3
"""NeuTTS-2E text-to-speech worker (emotional English, four fixed speakers).
usage: neutts_gen.py <backbone.gguf> <decoder.onnx> <job.json>
job.json: [{"text":..., "speaker":"emily", "emotion":"neutral", "seed":7, "out":"/path/x.wav"}, ...]
Writes each file as soon as it is ready so a crash only loses the clip in progress."""
import sys, json, time, warnings
warnings.filterwarnings('ignore')
import soundfile as sf
from neutts import NeuTTS2E
gguf, onnx, job = sys.argv[1:4]
tts = NeuTTS2E(backbone_repo=gguf, backbone_device='cpu', codec_repo=onnx, codec_device='cpu')
for item in json.load(open(job)):
    t = time.time()
    if item.get('seed') is not None:
        import random, numpy as np, torch
        random.seed(item['seed']); np.random.seed(item['seed']); torch.manual_seed(item['seed'])
    wav = tts.infer(item['text'], speaker=item.get('speaker', 'emily'), emotion=item.get('emotion', 'neutral'),
                    temperature=item.get('temperature', 1.0))
    sf.write(item['out'], wav, 24000)
    print('ok', item['out'], round(len(wav) / 24000, 2), 's audio in', round(time.time() - t, 1), 's', flush=True)
sys.stdout.flush()
import os
os._exit(0)  # skip interpreter teardown: llama-cpp prints a harmless traceback on exit
