"""Textures des éclats d'obsidienne du style Titane : verre volcanique noir, fissures d'énergie blanche, perles de lumière, micro-étoiles."""
import numpy as np, pathlib
from PIL import Image, ImageFilter
S = 256
def bruit(r, n, oct=5):
    t = np.zeros((S, S), np.float32); a, s = 1, 0
    for o in range(oct):
        k = n * 2 ** o; t += a * np.asarray(Image.fromarray(r.random((k, k)).astype(np.float32)).resize((S, S), Image.BICUBIC)); s += a; a *= .55
    return t / s
for i in range(3):
    r = np.random.default_rng(10 + i)
    Y, X = np.mgrid[0:S, 0:S].astype(np.float32)
    # fissures : bords de cellules de Voronoï (écart entre les deux germes les plus proches), déformés par du bruit
    g = r.random((9 + 3 * i, 2)) * S
    dx, dy = (bruit(r, 3) - .5) * 26, (bruit(r, 3) - .5) * 26
    d = np.sort(np.stack([np.hypot(X + dx - a, Y + dy - b) for a, b in g]), 0)
    bord = d[1] - d[0]
    coeur = np.exp(-bord / 1.1); lueur = np.exp(-bord / 9)
    garde = np.clip((bruit(r, 4) - .42) * 7, 0, 1)   # une partie des fissures seulement est chargée d'énergie (fondu doux)
    veines = (coeur * 1.0 + lueur * .22) * garde
    # masse : verre noir avec reflets conchoïdaux et voile violet cosmique
    m = bruit(r, 2, 6)
    base = np.stack([9 + 14 * m, 8 + 11 * m, 13 + 22 * m], -1)
    reflet = np.clip(np.sin((X * .6 + Y) / 22 + m * 6) * .5 + .5, 0, 1) ** 8 * 18
    img = base + reflet[..., None]
    # micro-étoiles dans la masse et perles d'énergie sur les fissures
    for _ in range(140):
        x, y = r.integers(0, S, 2); img[y, x] += r.random() * 150
    perles = np.zeros((S, S), np.float32)
    ys, xs = np.where((coeur > .7) & (garde > .5))
    for k in r.choice(len(ys), min(len(ys), 14), replace=False):
        perles += np.exp(-((X - xs[k]) ** 2 + (Y - ys[k]) ** 2) / 10)
    energie = np.clip(veines + perles * 1.2, 0, 1.6)
    img += energie[..., None] * np.array([240, 240, 255])
    img = np.asarray(Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.4)))
    Image.fromarray(img).save(pathlib.Path(__file__).resolve().parent.parent / "fonds" / f"obsidienne{i + 1}.webp", quality=85)
print("ok")
