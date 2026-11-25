"""Fond Titane de 2 WORK : scène de nuit détaillée (nébuleuse, étoiles, faisceau, horizon, sol réfléchissant) ;
l'astre à anneau est une image à part (fonds/astre.webp), placée par le CSS pour rester visible sur téléphone comme sur ordinateur.."""
import numpy as np, pathlib
from PIL import Image, ImageFilter
W, H = 1080, 2340
HZ = int(H * .56)                      # horizon, aligné sur la ligne CSS (background-position: center 56%)
rng = np.random.default_rng(42)
Y, X = np.mgrid[0:H, 0:W].astype(np.float32)

def bruit(octaves=6, base=4, persist=.55, w=W, h=H, graine=0):
    """bruit fractal : somme d'octaves de bruit aléatoire agrandi en bicubique"""
    r = np.random.default_rng(graine); tot = np.zeros((h, w), np.float32); amp, s = 1, 0
    for o in range(octaves):
        n = base * 2 ** o
        a = r.random((max(2, int(n * h / w)), n)).astype(np.float32)
        tot += amp * np.asarray(Image.fromarray(a).resize((w, h), Image.BICUBIC)); s += amp; amp *= persist
    return tot / s

# --- ciel : dégradé sépia vers l'horizon
t = np.clip(Y / HZ, 0, 1)
ciel = np.stack([6 + 26 * t**2.2, 5 + 23 * t**2.2, 5 + 19 * t**2.2], -1)

# --- nébuleuse : nappe diagonale de poussière lumineuse avec des filaments sombres
n1, n2 = bruit(7, 3, .58, graine=1), bruit(7, 6, .6, graine=2)
bande = np.exp(-((X * .55 - Y * .8 + 700) / 520) ** 2) * (Y < HZ)
lum = np.clip((n1 - .42) * 2.4, 0, 1) ** 1.6 * bande
sombre = np.clip((n2 - .5) * 3, 0, 1) * bande
neb = lum * (1 - .75 * sombre)
ciel += neb[..., None] * np.array([70, 60, 46])
ciel *= 1 - .35 * sombre[..., None]

# --- faisceau : cône de lumière depuis le haut, avec des stries et de la poussière en suspension
cx = W / 2; ang = np.abs(np.arctan2(X - cx, Y + 60))
cone = np.clip(1 - ang / .46, 0, 1) ** .9 * np.clip(1 - Y / (HZ * 1.02), 0, 1) ** .6
stries = np.asarray(Image.fromarray(rng.random((8, 300)).astype(np.float32)).resize((W, H), Image.BICUBIC))
ciel += (cone * (.85 + .3 * stries))[..., None] * np.array([34, 32, 28])

# --- étoiles : milliers de points, quelques brillantes avec halo et aigrettes
etoiles = np.zeros((H, W), np.float32)
def point(x, y, r, a):
    x0, x1, y0, y1 = int(max(0, x - 4 * r - 2)), int(min(W, x + 4 * r + 3)), int(max(0, y - 4 * r - 2)), int(min(H, y + 4 * r + 3))
    yy, xx = np.mgrid[y0:y1, x0:x1]; etoiles[y0:y1, x0:x1] += a * np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * r * r))
for _ in range(3200):
    x, y = rng.random() * W, rng.random() ** 1.25 * HZ
    point(x, y, rng.choice([.45, .55, .7, .9]), rng.random() ** 2.4 * .9 + .05)
for _ in range(60):
    x, y = rng.random() * W, rng.random() * HZ * .95; point(x, y, 1.3, .9); point(x, y, 4, .12)
for _ in range(9):
    x, y = rng.random() * W, rng.random() * HZ * .85; point(x, y, 1.6, 1); point(x, y, 7, .1)
    for dx, dy in ((1, 0), (0, 1)):
        for k in range(-26, 27):
            xi, yi = int(x + k * dx), int(y + k * dy)
            if 0 <= xi < W and 0 <= yi < H: etoiles[yi, xi] += .55 * np.exp(-abs(k) / 7)
ciel += np.clip(etoiles, 0, 1.4)[..., None] * np.array([235, 228, 214])

# --- poussière dans le faisceau
for _ in range(500):
    x = cx + (rng.random() - .5) * 2 * np.tan(.40) * (y := rng.random() * HZ * .97) ; point(x, y, .6, rng.random() * .5)

# --- horizon : lueur large et ligne fine brillante
dh = np.abs(Y - HZ)
ciel += (np.exp(-dh / 90) * 28 * np.exp(-((X - W / 2) / (W * .7)) ** 2))[..., None] * np.array([1, .95, .85])

# --- sol : reflet de la scène, ondulé et assombri, avec des lignes en perspective
img = np.clip(ciel, 0, 255)
haut = img[:HZ][::-1]
sol_h = H - HZ
refl = np.zeros((sol_h, W, 3), np.float32)
ond = bruit(4, 6, .5, w=W, h=sol_h, graine=5)
for yy in range(sol_h):
    src = min(HZ - 1, int(yy * 1.15))
    dx = int((ond[yy, 0] - .5) * 16 * (yy / sol_h + .2))
    refl[yy] = np.roll(haut[src], dx, axis=0)
refl = np.asarray(Image.fromarray(refl.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)
fond_sol = np.linspace(.30, .05, sol_h)[:, None, None]
sol = refl * fond_sol + np.array([8, 7, 6])
ys = np.arange(sol_h)[:, None]; xs = np.arange(W)[None, :]
prof_sol = (ys + 8) / sol_h
lignes_h = (np.abs(np.sin(1 / (prof_sol + .02) * 9)) < .05) * (.6 - .5 * prof_sol)
fuite = np.abs(((xs - W / 2) / (ys + 30)) * 3 % 1 - .5) < .025
sol += ((lignes_h + fuite * .35 * prof_sol) * 22)[..., None]
sol += (np.exp(-ys / 40) * 30)[..., None] * np.array([1, .95, .85])
img = np.concatenate([img[:HZ], sol], 0)
img[HZ - 1:HZ + 1] = np.maximum(img[HZ - 1:HZ + 1], 205)

# --- vignette et grain
vig = 1 - .55 * (((X - W / 2) / W) ** 2 * 1.4 + ((Y - H * .45) / H) ** 2 * 1.2)
img *= np.clip(vig, .35, 1)[..., None]
img += rng.normal(0, 3.2, (H, W, 1))
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save("/tmp/titane.png")
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(__import__("pathlib").Path(__file__).resolve().parent.parent / "fonds" / "titane.webp", quality=82, method=6)
print("ok")

# --- astre à anneau : image détourée à part
S = 640; R = S * .19
Y, X = np.mgrid[0:S, 0:S].astype(np.float32); PX = PY = S / 2
tilt = np.radians(-16); ct, st = np.cos(tilt), np.sin(tilt)
u = ((X - PX) * ct + (Y - PY) * st) / R; v = (-(X - PX) * st + (Y - PY) * ct) / R   # repère de l'astre
d2 = (X - PX) ** 2 + (Y - PY) ** 2; dedans = d2 < R * R
nz = np.sqrt(np.clip(1 - d2 / R / R, 0, 1)); nx, ny = (X - PX) / R, (Y - PY) / R
Ld = np.array([-.62, -.52, .58]); Ld /= np.linalg.norm(Ld)
lamb = np.clip(nx * Ld[0] + ny * Ld[1] + nz * Ld[2], 0, 1)
bn = bruit(5, 8, .5, w=S, h=S, graine=3)
bandes = .78 + .22 * np.sin(v * 14 + 3 * bn) + .08 * np.sin(v * 41 + 5 * bn)
inc = .24                                                   # aplatissement de l'anneau (inclinaison)
rr = np.sqrt(u ** 2 + (v / inc) ** 2)                      # rayon dans le plan de l'anneau
ombre_anneau = np.exp(-((v - .22) / .07) ** 2)             # ombre de l'anneau projetée sur la sphère
c = np.array([150, 132, 108]) * (lamb ** 1.2 * bandes * (1 - .55 * ombre_anneau))[..., None] + np.array([10, 9, 8])
rim = np.clip(1 - nz, 0, 1) ** 3 * np.clip(-nx * .7 - ny * .7, 0, 1)
c += (rim * 120)[..., None] * np.array([1, .93, .82])
prof = np.zeros_like(rr)
for a0, b0, k in ((1.28, 1.52, .35), (1.55, 1.92, .85), (1.99, 2.35, .6), (2.4, 2.48, .25)):
    prof += k * np.clip((rr - a0) / .02, 0, 1) * np.clip((b0 - rr) / .02, 0, 1)
prof *= .75 + .25 * np.sin(rr * 260) * np.sin(rr * 71)
arriere = v < 0
ombre_planete = arriere & (np.abs(u - .35) < .95) & (u > -.2)   # ombre de la sphère sur l'anneau, côté opposé à la lumière
aa = np.clip(prof, 0, 1) * ~(arriere & dedans) * .8 * np.where(ombre_planete, .3, 1)
an = np.array([222, 206, 178]) * (.55 + .45 * np.clip(-u * .4 + .6, 0, 1))[..., None]
alpha = np.clip(dedans + aa, 0, 1)
rgb = np.where(dedans[..., None], c, an)
rgb = np.where(dedans[..., None] & (aa > 0)[..., None], c * (1 - aa[..., None]) + an * aa[..., None], rgb)
halo = np.exp(-np.clip(np.sqrt(d2) / R - 1, 0, None) * 5) * ~dedans * .25
alpha = np.clip(alpha + halo, 0, 1); rgb = np.where((halo > alpha - 1e-6)[..., None] & ~dedans[..., None] & (aa == 0)[..., None], np.array([232, 220, 196.]), rgb)
im = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), "RGBA").resize((S // 2, S // 2), Image.LANCZOS)
im.crop(im.getbbox()).save(pathlib.Path(__file__).resolve().parent.parent / "fonds" / "astre.webp", quality=88)
print("astre ok")
