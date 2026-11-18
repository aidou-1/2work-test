"""Génère voix/<langue>/<nom>.mp3 pour chaque morceau de phrases.json (reprend là où il s'est arrêté).
Usage : python3 -I generer.py <phrases.json> <dossier_sortie>"""
import sys, os, json, re, subprocess, time
import numpy as np
from kokoro_onnx import Kokoro
src, dst = sys.argv[1], sys.argv[2]
k = Kokoro(os.environ.get("KOKORO_MODELE", "kokoro-v1.0.int8.onnx"), os.environ.get("KOKORO_VOIX", "voices-v1.0.bin"))
VOIX = {"fr": ("ff_siwis", "fr-fr"), "en": ("am_michael", "en-us")}
def nom(cle):   # même calcul que nomVoixFichier (js/seance.js)
    h = 5381
    for ch in cle:
        h = ((h * 33) ^ ord(ch)) & 0xFFFFFFFF
    b36 = lambda n: "0" if n == 0 else (b36(n // 36).lstrip("0") + "0123456789abcdefghijklmnopqrstuvwxyz"[n % 36])
    return b36(h) + b36(len(cle))
d = json.load(open(src)); t0 = time.time(); n = 0
for lg, (voix, code) in [x for x in VOIX.items() if len(sys.argv) < 4 or x[0] == sys.argv[3]]:
    os.makedirs(f"{dst}/{lg}", exist_ok=True); man = {}
    for cle, txt in d[lg].items():
        if re.fullmatch(r"[a-z]+[A-Z]\w*", txt.strip(" .")): continue   # identifiant technique, pas une phrase
        f = nom(cle); man[f] = 1; out = f"{dst}/{lg}/{f}.mp3"
        if os.path.exists(out): continue
        s, sr = k.create(txt, voice=voix, speed=1.0, lang=code)
        a = np.abs(s) > 0.01; i0 = max(0, np.argmax(a) - int(.03 * sr)); i1 = min(len(s), len(s) - np.argmax(a[::-1]) + int(.06 * sr)); s = s[i0:i1]
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "40k", out], input=s.astype("float32").tobytes(), check=True)
        n += 1
        if n % 50 == 0: print(lg, n, "faits", round(time.time() - t0), "s", flush=True)
    json.dump(sorted(man), open(f"{dst}/{lg}.json", "w"), separators=(",", ":"))
print("FINI", n, round(time.time() - t0), "s", flush=True)
