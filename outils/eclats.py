"""Éclats d'obsidienne du style Titane, rendus en 3D par lancer de rayons (numpy) :
roches irrégulières (enveloppe convexe de points tirés sur un ellipsoïde cabossé : nombreuses facettes, aucune forme de cube), surface rugueuse, verre noir brillant qui reflète la scène (faisceau chaud au-dessus, horizon),
fissures d'énergie blanche (arêtes de Voronoï 3D) qui émettent de la lumière. Sortie : images détourées fonds/eclat1..6.webp."""
import numpy as np, pathlib
from scipy.spatial import ConvexHull
from PIL import Image, ImageFilter
N, SS = 220, 2                                   # taille finale, sur-échantillonnage (bords lisses)
M = N * SS
DOSSIER = pathlib.Path(__file__).resolve().parent.parent / "fonds"

def rot(ax, ay, az):
    cx, sx, cy, sy, cz, sz = np.cos(ax), np.sin(ax), np.cos(ay), np.sin(ay), np.cos(az), np.sin(az)
    return np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]) @ np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]) @ np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])

def environnement(d):
    """ce que reflète le verre : ciel sombre, faisceau chaud au zénith, lueur d'horizon, sol sombre"""
    y = d[..., 1]
    ciel = np.clip(-y, 0, 1)
    c = np.stack([12 + 0 * y] * 3, -1) + (np.exp(-np.abs(y) * 9) * 70)[..., None] * np.array([1, .94, .84])   # horizon
    c += (np.clip(-y - .55, 0, 1) ** 2 * 900)[..., None] * np.array([1, .95, .86])                            # faisceau au-dessus
    c += (np.exp(-((d[..., 0] - .55) ** 2 + (y + .2) ** 2) * 30) * 120)[..., None] * np.array([.85, .85, 1])  # reflet froid sur le côté
    return c * (1 - .7 * np.clip(y, 0, 1))[..., None]

for k in range(6):
    r = np.random.default_rng(100 + k)
    # forme : roche irrégulière = enveloppe convexe de points sur un ellipsoïde allongé et cabossé
    axes = r.uniform(.55, 1.0, 3); axes[r.integers(3)] *= r.uniform(1.2, 1.7)
    pts = r.normal(size=(r.integers(22, 40), 3)); pts /= np.linalg.norm(pts, axis=1)[:, None]
    pts *= axes * r.uniform(.72, 1.0, (len(pts), 1))
    hull = ConvexHull(pts)
    Nn = hull.equations[:, :3]; D = -hull.equations[:, 3]
    taille = axes
    R = rot(*r.uniform(0, np.pi * 2, 3))
    Nn = Nn @ R.T
    sc = 1.15 * np.max(taille)
    # rayons orthographiques
    v = (np.arange(M) + .5) / M * 2 - 1
    X, Y = np.meshgrid(v * sc * 1.25, v * sc * 1.25)
    o = np.stack([X, Y, np.full_like(X, -5)], -1); d = np.array([0, 0, 1.])
    # intersection rayon / polyèdre convexe (méthode des dalles) : entrée = max des t d'entrée
    num = D[None, None] - o @ Nn.T; den = Nn @ d
    t = num / np.where(np.abs(den) < 1e-9, 1e-9, den)
    entre = np.where(den < 0, t, -np.inf).max(-1); sort = np.where(den > 0, t, np.inf).min(-1)
    touche = (entre < sort) & ((den < 0) | (num > 0)).all(-1) | (entre < sort)
    touche &= entre < sort
    idx = np.argmax(np.where(den[None, None] < 0, t, -np.inf), -1)
    nrm = Nn[idx]; p = o + entre[..., None] * d
    # éclairage : verre noir très brillant (Fresnel), faible diffus chaud venu du faisceau, arêtes accrochées
    bosse = np.stack([np.sin(p[..., 1] * 23 + p[..., 2] * 17), np.sin(p[..., 2] * 19 + p[..., 0] * 29), np.sin(p[..., 0] * 21 + p[..., 1] * 13)], -1)
    nrm = nrm + .07 * bosse; nrm /= np.linalg.norm(nrm, axis=-1)[..., None]
    vd = -d; cosv = np.clip((nrm * vd).sum(-1), 0, 1)
    fres = .04 + .96 * (1 - cosv) ** 5
    refl = d - 2 * (nrm * d).sum(-1)[..., None] * nrm
    rugo = 1
    spec = environnement(refl)
    L = np.array([0, -1, -.35]); L /= np.linalg.norm(L)
    diff = np.clip((nrm * L).sum(-1), 0, 1)
    coul = spec * (fres * 1.6 + .12)[..., None] + (diff * 10)[..., None] * np.array([1, .92, .85]) + np.array([7, 6, 10])
    # fissures d'énergie : arêtes de Voronoï 3D à la surface, une partie seulement chargée
    g = r.uniform(-1.2, 1.2, (9, 3)) * taille
    dist = np.sort(np.linalg.norm(p[..., None, :] - g[None, None], axis=-1), -1)
    bord = (dist[..., 1] - dist[..., 0]) / sc
    actif = np.sin(p @ r.normal(size=3) * 3 + k) > .15
    veine = (np.exp(-bord / .004) + .3 * np.exp(-bord / .025)) * actif
    em = np.where(touche, veine, 0)
    # arêtes du polyèdre légèrement lumineuses (lumière qui fuit des fissures internes)
    coul += (em * 255)[..., None] * np.array([.95, .95, 1])
    rgb = np.where(touche[..., None], coul, 0)
    a = touche.astype(np.float32)
    # halo de l'énergie (bloom) autour et au-dessus de l'éclat
    emi = Image.fromarray((np.clip(em, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10 * SS))
    halo = np.asarray(emi).astype(np.float32) / 255 * 1.6
    rgb = rgb + (halo * 200)[..., None] * np.array([.9, .9, 1])
    a = np.clip(a + halo * .6, 0, 1)
    img = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    im = Image.fromarray(img, "RGBA").resize((N, N), Image.LANCZOS)
    im = im.crop(im.getbbox())
    im.save(DOSSIER / f"eclat{k + 1}.webp", quality=88)
print("ok")
