"""Render the project's original Pocket Parade loop. No sampled music is used.

Optional development dependency: NumPy. Runtime playback uses the bundled MP3.
"""
from pathlib import Path
import argparse
import json
import math
import wave
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'qa' / 'pocket-parade-master.wav')
args = parser.parse_args()
rate, bpm, bars = 44100, 112, 16
beat = 60 / bpm
duration = bars * 4 * beat
length = round(duration * rate)
mix = np.zeros((length, 2), dtype=np.float64)
rng = np.random.default_rng(20261109)

def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def place(start, sound, amplitude, pan=0):
    offset = round(start * rate) % length
    envelope = np.array([math.sqrt((1-pan)/2), math.sqrt((1+pan)/2)])
    stereo = sound[:, None] * envelope[None, :] * amplitude
    end = min(length, offset + len(sound))
    mix[offset:end] += stereo[:end-offset]
    if end-offset < len(sound):
        mix[:len(sound)-(end-offset)] += stereo[end-offset:]

def bell(midi, seconds=.42):
    t = np.arange(round(seconds*rate)) / rate
    f = frequency(midi)
    tone = (np.sin(2*np.pi*f*t) * np.exp(-t*8)
            + .28*np.sin(2*np.pi*f*2*t) * np.exp(-t*13)
            + .11*np.sin(2*np.pi*f*3.97*t) * np.exp(-t*22))
    attack = np.minimum(1, t/.005)
    release = np.minimum(1, (seconds-t)/.025)
    return tone * attack * release

def bass(midi):
    t = np.arange(round(.7*rate)) / rate
    f = frequency(midi)
    return (np.sin(2*np.pi*f*t) + .16*np.sin(2*np.pi*f*2*t)) * np.exp(-t*5) * np.minimum(1,t/.009)

chords = [[60,64,67,71],[64,67,71,74],[57,60,64,67],[53,57,60,64],
          [62,65,69,72],[55,59,62,65],[60,64,67,69],[55,59,62,64]]
bass_roots = [48,52,45,41,50,43,48,43]
melody = [
 [72,76,79,76,81,79,76,74], [76,79,83,81,79,76,74,71],
 [72,76,81,79,76,72,69,72], [77,76,72,69,72,76,77,79],
 [74,77,81,79,77,74,72,69], [71,74,79,81,79,74,71,67],
 [72,76,79,84,81,79,76,72], [74,71,67,71,74,79,76,74],
 [76,79,84,81,79,76,74,72], [71,76,79,83,79,76,74,71],
 [69,72,76,81,84,81,79,76], [77,79,81,79,76,72,69,72],
 [74,77,81,84,81,77,74,72], [71,74,79,83,81,79,74,71],
 [72,76,79,84,81,79,76,74], [71,74,79,76,74,71,67,71]
]
for bar in range(bars):
    start = bar*4*beat
    chord = chords[bar % 8]
    root = bass_roots[bar % 8]
    for step, midi in enumerate(melody[bar]):
        if (bar+step) % 11 == 5:
            continue
        swing = .045*beat if step % 2 else 0
        place(start+step*.5*beat+swing, bell(midi), .15 if step % 2 == 0 else .12, -.16 if step % 2 else .15)
    for pulse in [0, 2]:
        place(start+pulse*beat, bass(root if pulse == 0 else root+7), .16, 0)
    for pulse in [.75, 2.75]:
        for voice, midi in enumerate(chord):
            place(start+pulse*beat+voice*.012, bell(midi,.42), .037, -.35+voice*.22)
    for step in range(8):
        t = np.arange(round(.065*rate)) / rate
        noise = rng.standard_normal(len(t))
        bright = (noise - np.roll(noise,1)) * np.exp(-t*75)
        place(start+step*.5*beat, bright, .006 if step % 2 else .009, -.35 if step % 2 else .35)
    for pulse in [1,3]:
        t = np.arange(round(.1*rate))/rate
        click = (np.sin(2*np.pi*1030*t)+.4*np.sin(2*np.pi*1730*t))*np.exp(-t*70)
        place(start+pulse*beat, click, .013, .12)

for delay, amount in [(0.047,.09),(.091,.055),(.151,.035)]:
    mix += np.roll(mix, round(delay*rate), axis=0)[:, ::-1] * amount
mix -= mix.mean(axis=0)
mix *= .58 / np.max(np.abs(mix))
fade = round(.012*rate)
mix[:fade] *= np.linspace(0,1,fade)[:,None]
mix[-fade:] *= np.linspace(1,0,fade)[:,None]
pcm = (np.clip(mix,-1,1)*32767).astype('<i2')
args.output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(args.output),'wb') as file:
    file.setnchannels(2)
    file.setsampwidth(2)
    file.setframerate(rate)
    file.writeframes(pcm.tobytes())
metadata = {'title':'Pocket Parade','source':'Original procedural composition and synthesis for Roll It All; no third-party samples',
            'bpm':bpm,'bars':bars,'durationSeconds':length/rate,'sampleRate':rate,'channels':2,
            'peak':float(np.max(np.abs(mix))),'rms':float(np.sqrt(np.mean(mix**2)))}
args.output.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metadata))
