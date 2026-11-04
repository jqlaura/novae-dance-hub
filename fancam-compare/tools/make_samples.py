"""Make two fake dance videos that share one song, starting at different points.

练习.mp4  : phone in a practice room. Video t=0 is 1.5 s before the song starts.
直拍.mp4  : fancam. Video t=0 is already 4.0 s into the song, with crowd noise.
So the same musical moment is at practice time t and fancam time t - 5.5.
A white bar flashes on every drum hit in both videos, so sync is easy to check by eye.
"""
import subprocess, sys, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
SR, FPS = 44100, 30
rng = np.random.default_rng(7)
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"

# ---------- the song: 120 BPM, random drum fills and a random melody ----------
SONG_LEN = 32.0
beat = 0.5
hits = []  # (time, strength)
t = 0.0
while t < SONG_LEN - 0.5:
    if rng.random() > 0.12:
        hits.append((t, 1.0))
    if rng.random() < 0.35:
        hits.append((t + beat / 2, 0.6))
    t += beat
hits.sort()

song = np.zeros(int(SONG_LEN * SR))
def add(sig, at):
    i = int(at * SR)
    j = min(len(song), i + len(sig))
    song[i:j] += sig[: j - i]

for ht, s in hits:
    n = int(0.18 * SR)
    tt = np.arange(n) / SR
    kick = np.sin(2 * np.pi * (55 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 18)
    add(s * 0.9 * kick, ht)
    nh = int(0.05 * SR)
    add(s * 0.25 * rng.standard_normal(nh) * np.exp(-np.arange(nh) / SR * 80), ht)
scale = [262, 294, 330, 392, 440, 523, 587, 659]
t = 0.0
while t < SONG_LEN - 0.5:
    dur = beat * rng.choice([0.5, 1, 1, 2])
    f = rng.choice(scale)
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = np.minimum(1, tt * 40) * np.exp(-tt * 2.5)
    add(0.22 * env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)), t)
    t += dur
song /= np.abs(song).max() * 1.1

def song_at(start_song_time, length, lead_silence=0.0):
    """Audio for a video of `length` seconds: silence, then the song from start_song_time."""
    out = np.zeros(int(length * SR))
    i0 = int(lead_silence * SR)
    s0 = int(start_song_time * SR)
    seg = song[s0 : s0 + len(out) - i0]
    out[i0 : i0 + len(seg)] = seg
    return out

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    # simple one-pole filter, vectorised in chunks via cumulative trick is overkill; loop is fine at this size
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32000).astype("<i2").tobytes())

# ---------- practice: room echo, phone mic, quiet hiss ----------
P_LEN, P_LEAD = 25.0, 1.5
p = song_at(0.0, P_LEN, P_LEAD)
d = int(0.045 * SR)
p[d:] += 0.35 * p[:-d]          # wall echo
p = lowpass(p, 0.35) * 0.7       # phone mic, speaker across the room
p += 0.02 * rng.standard_normal(len(p))
write_wav(OUT / "practice.wav", p)

# ---------- fancam: crowd noise that swells ----------
F_LEN, F_START = 22.0, 4.0
f = song_at(F_START, F_LEN)
crowd = lowpass(rng.standard_normal(len(f)), 0.25)
swell = 0.5 + 0.5 * np.sin(np.arange(len(f)) / SR * 0.9) ** 2
f = 0.8 * f + 0.45 * crowd * swell / np.abs(crowd).max()
write_wav(OUT / "fancam.wav", f)

# ---------- video frames ----------
hit_times = np.array([h for h, s in hits if s == 1.0])

def flash(song_t):
    k = hit_times[(hit_times <= song_t)]
    if len(k) == 0: return 0.0
    return max(0.0, 1 - (song_t - k[-1]) / 0.12)

def render(path_raw, w, h, length, song_offset, style):
    font = ImageFont.truetype(FONT, int(w * 0.075))
    small = ImageFont.truetype(FONT, int(w * 0.045))
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-qp", "18", str(path_raw)],
        stdin=subprocess.PIPE)
    for i in range(int(length * FPS)):
        vt = i / FPS
        st = vt - song_offset  # song time
        img = Image.new("RGB", (w, h), style["bg"])
        dr = ImageDraw.Draw(img)
        if style["stage"]:
            dr.ellipse([w * 0.1, h * 0.25, w * 0.9, h * 0.95], fill=(40, 30, 60))
        # dancer: body bounces on hits, sways with time
        fl = flash(st) if st >= 0 else 0.0
        cx = w / 2 + np.sin(max(st, 0) * 2.1) * w * 0.18
        cy = h * 0.62 - fl * h * 0.06
        r = w * 0.09
        dr.ellipse([cx - r, cy - r * 3.4, cx + r, cy - r * 1.4], fill=style["fg"])          # head
        dr.rounded_rectangle([cx - r * 1.3, cy - r * 1.3, cx + r * 1.3, cy + r * 1.8], r * 0.5, fill=style["fg"])
        arm = np.sin(max(st, 0) * 6.28) * r * 1.5
        dr.line([cx - r * 1.2, cy - r, cx - r * 2.6, cy - r * 2 - arm], fill=style["fg"], width=int(r * 0.45))
        dr.line([cx + r * 1.2, cy - r, cx + r * 2.6, cy - r * 2 + arm], fill=style["fg"], width=int(r * 0.45))
        # beat bar
        c = int(60 + 195 * fl)
        dr.rectangle([0, 0, w, h * 0.035], fill=(c, c, c))
        dr.text((w * 0.06, h * 0.06), style["label"], font=font, fill=style["text"])
        dr.text((w * 0.06, h * 0.06 + w * 0.1), f"歌曲 {max(st,0):05.2f}s" if st >= 0 else "（还没放音乐）",
                font=small, fill=style["text"])
        proc.stdin.write(img.tobytes())
    proc.stdin.close(); proc.wait()

render(OUT / "practice_v.mp4", 360, 640, P_LEN, P_LEAD,
       dict(bg=(214, 210, 200), fg=(70, 90, 140), text=(40, 40, 40), label="练习视频（假）", stage=False))
render(OUT / "fancam_v.mp4", 540, 960, F_LEN, -F_START,
       dict(bg=(12, 10, 22), fg=(240, 120, 150), text=(240, 240, 240), label="成员直拍（假）", stage=True))

for name in ["practice", "fancam"]:
    v, a = OUT / f"{name}_v.mp4", OUT / f"{name}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", v, "-i", a, "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "28", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart",
                    "-shortest", OUT / f"{name}.mp4"], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", v, "-i", a, "-c:v", "libvpx-vp9", "-b:v", "300k",
                    "-c:a", "libopus", "-shortest", OUT / f"{name}.webm"], check=True)
    v.unlink(); a.unlink()
print("expected: fancam_time = practice_time - 5.5")
