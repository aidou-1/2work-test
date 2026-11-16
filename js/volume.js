/* ============ VOLUME : objets en relief du style « Socle » (personnage des exercices, kettlebell, médaille) ============
   Chargé seulement quand ce style est choisi (js/progres.js, volEcran). Aucun fichier 3D : tout est modelé ici par le code.
   - Personnage : champs de distance (ellipsoïdes et capsules fondus entre eux) transformés une fois en maillage par « filets de surface » ;
     corps, tête, mains, cheveux, t-shirt, short, chaussettes et baskets sont des pièces séparées. Le maillage est gardé en mémoire.
   - Rendu : WebGL 1, un seul shader (peau, tissu, cheveux, socle, métal), image redessinée seulement quand quelque chose bouge.
   - volume(hote, "perso" | "kettlebell" | "medaille", options) renvoie { maj(options), fermer(), detruire() }, ou null sans WebGL.
     Options : muscles ({ quad: 1, … } ou ["quad", …]), mode ("muscles" ou "habille"), mini, auto, face (groupe tourné vers soi), points ([{ g, nom }]), surPoint(g),
     outils ({ muscles, dos } : libellés des deux boutons), seul (faux pour garder plusieurs vues, page de démonstration). */
(() => {
"use strict";
const RAD = Math.PI / 180, CALME = matchMedia("(prefers-reduced-motion: reduce)");
// matrice 3×3 (lignes) de rotation Rz·Ry·Rx, angles en degrés
function rot3(rx = 0, ry = 0, rz = 0) {
  const [a, b, c] = [rx, ry, rz].map(v => v * RAD), ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  return [cc * cb, cc * sb * sa - sc * ca, cc * sb * ca + sc * sa, sc * cb, sc * sb * sa + cc * ca, sc * sb * ca - cc * sa, -sb, cb * sa, cb * ca];
}
const app3 = (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2], m[3] * p[0] + m[4] * p[1] + m[5] * p[2], m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];
const inv3 = (m, p) => [m[0] * p[0] + m[3] * p[1] + m[6] * p[2], m[1] * p[0] + m[4] * p[1] + m[7] * p[2], m[2] * p[0] + m[5] * p[1] + m[8] * p[2]];
const norm = v => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const croix = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const moins = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// entre deux blocs de calcul : on attend un moment creux, et on se met en pause pendant le décompte et la séance (sauf si le mini-personnage est demandé)
const souffle = () => new Promise(function att(r) { const occupe = typeof ecranCourant !== "undefined" && ["pret", "session"].includes(ecranCourant) && !window.volPresse;
  if (occupe) return setTimeout(() => att(r), 500); window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 600 }) : setTimeout(r, 30); });

/* Sommet : position 3, normale 3, couleur 3 + occlusion, puis (u des fibres, matière, groupe musculaire, poids du groupe).
   Matières : 0 peau, 1 socle, 2 or, 3 accent verni, 4 fonte, 5 tissu (peut devenir un voile), 6 cheveux, 7 uni. */
const PAS = 14;
class Geo {
  constructor() { this.v = []; this.i = []; this.n = 0; this.col = [1, 1, 1]; this.place(); }
  place(o = [0, 0, 0], r = [0, 0, 0]) { this.o = o; this.R = rot3(...r); return this; }
  pt(p, n, u, mat) { const P = app3(this.R, p), N = norm(app3(this.R, n)); this.v.push(P[0] + this.o[0], P[1] + this.o[1], P[2] + this.o[2], N[0], N[1], N[2], ...this.col, 1, u, mat, 0, 0); return this.n++; }
  grille(w, h, base) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const a = base + j * (w + 1) + i; this.i.push(a, a + 1, a + w + 1, a + 1, a + w + 2, a + w + 1); } }
  ell(c, r, rot, mat = 0, col = [1, 1, 1], w = 20, h = 12) {
    this.place(c, rot); this.col = col; const b = this.n;
    for (let j = 0; j <= h; j++) for (let i = 0; i <= w; i++) { const t = j / h * Math.PI, f = i / w * 2 * Math.PI, p = [Math.sin(t) * Math.cos(f), Math.cos(t), Math.sin(t) * Math.sin(f)]; this.pt([p[0] * r[0], p[1] * r[1], p[2] * r[2]], [p[0] / r[0], p[1] / r[1], p[2] / r[2]], i / w, mat); }
    this.grille(w, h, b); return this.place();
  }
  // tube le long d'un chemin, rayon variable, bouts arrondis
  tube(pts, ray, mat = 0, w = 14) {
    this.place(); this.col = [1, 1, 1]; const b = this.n, k = pts.length; let N = null;
    pts.forEach((p, j) => {
      const T = norm(moins(pts[Math.min(j + 1, k - 1)], pts[Math.max(j - 1, 0)]));
      N = N ? norm(moins(N, T.map(x => x * (N[0] * T[0] + N[1] * T[1] + N[2] * T[2])))) : norm(croix(T, Math.abs(T[1]) < .9 ? [0, 1, 0] : [1, 0, 0]));
      const B = croix(T, N), r = ray[j] ?? ray[0];
      for (let i = 0; i <= w; i++) { const a = i / w * 2 * Math.PI, d = [0, 1, 2].map(x => Math.cos(a) * N[x] + Math.sin(a) * B[x]); this.pt([p[0] + d[0] * r, p[1] + d[1] * r, p[2] + d[2] * r], d, i / w, mat); }
    });
    this.grille(w, k - 1, b);
    [0, k - 1].forEach(j => { const r = ray[j] ?? ray[0]; this.ell(pts[j], [r, r, r], [0, 0, 0], mat, [1, 1, 1], 12, 8); });
    return this;
  }
  // solide de révolution autour de Y : profil [[rayon, y]…], arêtes vives entre segments
  tour(prof, mat, c = [0, 0, 0], rot = [0, 0, 0], w = 56) {
    this.place(c, rot); this.col = [1, 1, 1];
    for (let s = 0; s < prof.length - 1; s++) {
      const [r0, y0] = prof[s], [r1, y1] = prof[s + 1], l = Math.hypot(r1 - r0, y1 - y0) || 1, nr = (y0 - y1) / l, ny = (r1 - r0) / l, b = this.n;
      [[r0, y0], [r1, y1]].forEach(([r, y]) => { for (let i = 0; i <= w; i++) { const f = i / w * 2 * Math.PI; this.pt([r * Math.cos(f), y, r * Math.sin(f)], [nr * Math.cos(f), ny, nr * Math.sin(f)], i / w, mat); } });
      this.grille(w, 1, b);
    }
    return this.place();
  }
  tri(a, b, c, mat) { const n = norm(croix(moins(b, a), moins(c, a))), k = this.n; [a, b, c].forEach(p => this.pt(p, n, 0, mat)); this.i.push(k, k + 1, k + 2); }
  piece(voile = false) { return { v: new Float32Array(this.v), i: new Uint16Array(this.i), voile }; }
}
const SOCLE = [[0, 0], [.6, 0], [.625, -.02], [.625, -.085], [.6, -.105], [.56, -.105], [.56, -.14], [0, -.14]];

function kettlebell() {
  const g = new Geo(), arc = [], ray = [];
  g.ell([0, .44, 0], [.47, .45, .47], [0, 0, 0], 4, [1, 1, 1], 40, 26);
  for (let k = 0; k <= 28; k++) { const t = k / 28 * Math.PI, c = Math.cos(t), s = Math.sin(t); arc.push([-.27 * Math.sign(c) * Math.abs(c) ** .55, .8 + .34 * s ** .7, 0]); ray.push(.058 + .028 * Math.abs(c) ** 4); }
  g.tube(arc, ray, 4, 18);
  [1, -1].forEach(s => g.ell([0, .46, s * .415], [.2, .2, .07], [0, 0, 0], 3, [1, 1, 1], 32, 12));
  return [g.piece()];
}
function medaille() {
  const g = new Geo(), y = 1.02;
  g.tour(SOCLE, 1).tour([[0, 0], [.2, 0], [.2, .03], [.12, .05], [.05, .1], [.05, .17]], 2, [0, 0, 0], [0, 0, 0], 32);
  g.tour([[0, .05], [.6, .05], [.66, .1], [.8, .1], [.86, .045], [.86, -.045], [.8, -.1], [.66, -.1], [.6, -.05], [0, -.05]], 2, [0, y, 0], [90, 0, 0], 72);
  // étoile en relief sur les deux faces
  [1, -1].forEach(s => { g.place([0, y, 0]); const P = k => { const a = (k * 36 + 90) * RAD, r = k % 2 ? .21 : .5; return [r * Math.cos(a), r * Math.sin(a), s * .05]; };
    for (let k = 0; k < 10; k++) s > 0 ? g.tri([0, 0, .17], P(k), P(k + 1), 2) : g.tri([0, 0, -.17], P(k + 1), P(k), 2); });
  return [g.piece()];
}

/* ---------- Champs de distance : une grille de valeurs (négatif = dedans), des formes fondues entre elles ---------- */
// ellipsoïde (centre, rayons, options : rot, k = largeur de la fusion, g = groupe musculaire, sub = creuse au lieu d'ajouter) et capsule à rayon variable
const E = (c, r, o = {}) => ({ c, r, R: rot3(...(o.rot || [0, 0, 0])), k: o.k ?? .03, g: o.g, sub: o.sub, m: Math.max(...r) });
const C = (a, b, ra, rb, k = .03) => ({ a, b, ra, rb, k, m: Math.max(ra, rb), d: moins(b, a) });
function grille(lo, hi, h) { const n = [0, 1, 2].map(a => Math.ceil((hi[a] - lo[a]) / h) + 1); return { o: lo, h, n, f: new Float32Array(n[0] * n[1] * n[2]).fill(1) }; }
function poser(G, prims) {
  const { o, h, n, f } = G;
  for (const p of prims) {
    const pad = p.m + p.k + 2.5 * h, lo = p.c ? p.c.map(x => x - pad) : p.a.map((x, a) => Math.min(x, p.b[a]) - pad), hi = p.c ? p.c.map(x => x + pad) : p.a.map((x, a) => Math.max(x, p.b[a]) + pad),
      i0 = lo.map((x, a) => Math.max(0, Math.floor((x - o[a]) / h))), i1 = hi.map((x, a) => Math.min(n[a] - 1, Math.ceil((x - o[a]) / h))), k = p.k, dd = p.d && (p.d[0] ** 2 + p.d[1] ** 2 + p.d[2] ** 2);
    for (let z = i0[2]; z <= i1[2]; z++) for (let y = i0[1]; y <= i1[1]; y++) for (let x = i0[0], c = x + n[0] * (y + n[1] * z); x <= i1[0]; x++, c++) {
      const X = o[0] + x * h, Y = o[1] + y * h, Z = o[2] + z * h; let d;
      if (p.c) { const q = inv3(p.R, [X - p.c[0], Y - p.c[1], Z - p.c[2]]), a = q[0] / p.r[0], b = q[1] / p.r[1], e = q[2] / p.r[2], k0 = Math.hypot(a, b, e), k1 = Math.hypot(a / p.r[0], b / p.r[1], e / p.r[2]); d = k1 < 1e-9 ? -Math.min(...p.r) : k0 * (k0 - 1) / k1; }
      else { const ax = X - p.a[0], ay = Y - p.a[1], az = Z - p.a[2], t = Math.max(0, Math.min(1, (ax * p.d[0] + ay * p.d[1] + az * p.d[2]) / dd)); d = Math.hypot(ax - p.d[0] * t, ay - p.d[1] * t, az - p.d[2] * t) - (p.ra + (p.rb - p.ra) * t); }
      const v = f[c]; if (p.sub) d = -d; const e = Math.max(k - Math.abs(v - d), 0) / k, s = e * e * k * .25;
      f[c] = p.sub ? Math.max(v, d) + s : Math.min(v, d) - s;
    }
  }
  return G;
}
// retouche du champ point par point (découpes des vêtements) : fn(x, y, z, valeur) renvoie la nouvelle valeur
function retoucher(G, fn) { const { o, h, n } = G, f = new Float32Array(G.f); let c = 0;
  for (let z = 0; z < n[2]; z++) for (let y = 0; y < n[1]; y++) for (let x = 0; x < n[0]; x++, c++) if (f[c] < .2) f[c] = fn(o[0] + x * h, o[1] + y * h, o[2] + z * h, f[c]);
  return { o, h, n, f }; }
function ech(G, x, y, z) {
  const { o, h, n, f } = G, gx = Math.max(0, Math.min(n[0] - 1.001, (x - o[0]) / h)), gy = Math.max(0, Math.min(n[1] - 1.001, (y - o[1]) / h)), gz = Math.max(0, Math.min(n[2] - 1.001, (z - o[2]) / h)),
    i = gx | 0, j = gy | 0, k = gz | 0, a = gx - i, b = gy - j, e = gz - k, c = i + n[0] * (j + n[1] * k), sy = n[0], sz = n[0] * n[1], m = (p, q, t) => p + (q - p) * t;
  return m(m(m(f[c], f[c + 1], a), m(f[c + sy], f[c + sy + 1], a), b), m(m(f[c + sz], f[c + sz + 1], a), m(f[c + sz + sy], f[c + sz + sy + 1], a), b), e);
}
/* Filets de surface : un sommet par case traversée par la surface (moyenne des points de passage sur ses arêtes), un carré par arête traversée.
   Normales et occlusion viennent du champ lui-même, donc deux pièces qui se recouvrent (cou, poignets) se raccordent sans couture visible. */
const AR = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
function filets(G, { garde, mat = 7, coul = [1, 1, 1], zones, voile = false, loin = G } = {}) {
  const { o, h, n, f } = G, [nx, ny, nz] = n, S = [1, nx, nx * ny], id = new Int32Array(nx * ny * nz).fill(-1), V = [], I = [], w = new Float32Array(8);
  const coin = [0, 1, nx, nx + 1, S[2], S[2] + 1, S[2] + nx, S[2] + nx + 1];
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0, c = nx * (y + ny * z); x < nx - 1; x++, c++) {
    let m = 0; for (let q = 0; q < 8; q++) { w[q] = f[c + coin[q]]; if (w[q] < 0) m |= 1 << q; }
    if (!m || m === 255) continue;
    let px = 0, py = 0, pz = 0, k = 0;
    for (const [a, b] of AR) if ((m >> a & 1) !== (m >> b & 1)) { const t = w[a] / (w[a] - w[b]); px += (a & 1) + ((b & 1) - (a & 1)) * t; py += (a >> 1 & 1) + ((b >> 1 & 1) - (a >> 1 & 1)) * t; pz += (a >> 2) + ((b >> 2) - (a >> 2)) * t; k++; }
    const P = [o[0] + (x + px / k) * h, o[1] + (y + py / k) * h, o[2] + (z + pz / k) * h];
    if (garde && !garde(P)) continue;
    const N = norm([ech(G, P[0] + h, P[1], P[2]) - ech(G, P[0] - h, P[1], P[2]), ech(G, P[0], P[1] + h, P[2]) - ech(G, P[0], P[1] - h, P[2]), ech(G, P[0], P[1], P[2] + h) - ech(G, P[0], P[1], P[2] - h)]);
    // occlusion : le champ lu un peu plus loin le long de la normale dit si un autre volume est proche (aisselles, entre-jambes, sous le menton)
    const ao = Math.min(1, Math.max(0, ech(G, P[0] + N[0] * .025, P[1] + N[1] * .025, P[2] + N[2] * .025) / .025)) * (.55 + .45 * Math.min(1, Math.max(0, ech(loin, P[0] + N[0] * .07, P[1] + N[1] * .07, P[2] + N[2] * .07) / .07)));
    const col = typeof coul === "function" ? coul(P) : coul; let u = 0, g = 0, pd = 0;
    if (zones) { let mq = 1; for (const Z of zones) { const q = inv3(Z.R, moins(P, Z.c)), d = Math.hypot(q[0] / Z.r[0], q[1] / Z.r[1], q[2] / Z.r[2]) / 1.14; if (d < mq) { mq = d; g = Z.g; u = q[0] / Z.r[0]; } } pd = 1 - lisse(.72, 1, mq); }
    id[c] = V.length / PAS; V.push(P[0], P[1], P[2], N[0], N[1], N[2], col[0], col[1], col[2], .25 + .75 * ao, u, mat, g, pd);
  }
  for (let z = 1; z < nz - 1; z++) for (let y = 1; y < ny - 1; y++) for (let x = 1, c = x + nx * (y + ny * z); x < nx - 1; x++, c++) for (let a = 0; a < 3; a++) {
    if ((f[c] < 0) === (f[c + S[a]] < 0)) continue;
    const u = S[(a + 1) % 3], v = S[(a + 2) % 3], q = [id[c], id[c - u], id[c - u - v], id[c - v]];
    if (q[0] < 0 || q[1] < 0 || q[2] < 0 || q[3] < 0) continue;
    I.push(q[0], q[1], q[2], q[0], q[2], q[3]);
  }
  if (V.length / PAS > 65535) throw Error("maillage trop dense");
  return { v: new Float32Array(V), i: new Uint16Array(I), voile };
}

/* ---------- Le personnage des exercices : homme athlétique, blond, t-shirt bleu, short gris, baskets grises ---------- */
const GROUPES = ["", "quad", "fessiers", "ischios", "mollets", "abdos", "obliques", "pecs", "epaules", "biceps", "triceps", "dos", "adducteurs", "avantbras"];
const G_ = Object.fromEntries(GROUPES.map((g, i) => [g, i]));
// points d'intérêt : position approchée et direction de sortie par groupe ; recalés sur la surface à la génération
const ANCRES = { quad: [.1, .74, .05, 0, 0, 1], abdos: [0, 1.13, .04, 0, 0, 1], fessiers: [-.085, .93, -.06, 0, 0, -1], mollets: [.102, .37, -.03, 0, 0, -1], ischios: [-.097, .7, -.04, 0, 0, -1], pecs: [.085, 1.36, .04, 0, 0, 1],
  epaules: [.2, 1.41, 0, .62, .3, .72], biceps: [.222, 1.29, .01, .1, 0, 1], triceps: [-.226, 1.28, -.01, -.1, 0, -1], dos: [.1, 1.27, -.04, 0, 0, -1], obliques: [.1, 1.09, .01, .65, 0, .76], adducteurs: [.055, .8, 0, -.25, 0, .97], avantbras: [.262, 1.07, 0, .3, 0, .95] };
const PEAU = [.95, .745, .615], BLEU = [.14, .27, .93], GRIS = [.33, .34, .37], BLOND = [.74, .57, .32];
const cotes = fn => [1, -1].flatMap(fn);
// tête un peu plus grande que nature, comme le personnage des vidéos : tout ce qui la compose est agrandi autour de la base du crâne
const TETE = 1.1, gt = p => [p[0] * TETE, 1.55 + (p[1] - 1.55) * TETE, p[2] * TETE], grandir = l => l.map(p => p.c ? { ...p, c: gt(p.c), r: p.r.map(x => x * TETE), m: p.m * TETE, k: p.k * TETE } : p);

function formes() {
  const kt = { k: .016 }, tete = [
    E([0, 1.695, -.015], [.073, .083, .092], { k: .02 }), E([0, 1.64, .018], [.06, .082, .07], { k: .02 }), E([0, 1.567, .05], [.025, .019, .021], kt),
    C([0, 1.44, -.02], [0, 1.6, -.012], .055, .048, .02),
    E([0, 1.66, .0855], [.009, .026, .013], { rot: [-16, 0, 0], k: .008 }), E([0, 1.636, .099], [.012, .0105, .012], { k: .008 }), E([0, 1.6, .075], [.019, .0065, .0065], { k: .006 }),
    ...cotes(s => [E([s * .03, 1.59, .012], [.024, .028, .04], kt), E([s * .028, 1.683, .073], [.025, .008, .011], { k: .012 }), E([s * .042, 1.642, .05], [.02, .016, .02], kt),
      E([s * .0105, 1.631, .0905], [.0075, .0065, .0085], { k: .005 }), E([s * .0745, 1.648, -.012], [.007, .025, .015], { rot: [0, s * -22, s * -8], k: .006 })]),
    ...cotes(s => [E([s * .03, 1.664, .082], [.0135, .0072, .011], { k: .008, sub: 1 })])
  ];
  const tronc = [
    E([0, 1.3, -.005], [.153, .19, .105], { k: .05 }), E([0, 1.4, -.012], [.165, .075, .09], { k: .05 }), E([0, 1.1, 0], [.125, .15, .088], { k: .05 }), E([0, .96, -.005], [.155, .105, .1], { k: .05 }),
    E([0, 1.12, .058], [.07, .135, .034], { g: "abdos" }), E([0, 1.37, -.08], [.125, .12, .04], { g: "dos" }),
    ...cotes(s => [E([s * .08, 1.352, .06], [.09, .066, .048], { g: "pecs", rot: [0, 0, s * 6] }), E([s * .115, 1.24, -.045], [.06, .15, .065], { g: "dos" }), E([s * .08, 1.468, -.03], [.1, .04, .052], { rot: [0, 0, s * -24], g: "dos" }),
      E([s * .037, 1.1, -.074], [.035, .13, .03], { g: "dos" }), E([s * .104, 1.09, .02], [.04, .1, .066], { g: "obliques" }), E([s * .08, .925, -.07], [.086, .09, .076], { g: "fessiers" })])
  ];
  const bras = cotes(s => { const S = [s * .19, 1.415, -.005], Ec = [s * .25, 1.15, -.02], W = [s * .278, .92, .03], m = [(S[0] + Ec[0]) / 2, (S[1] + Ec[1]) / 2, (S[2] + Ec[2]) / 2];
    return [E([s * .2, 1.395, -.002], [.058, .072, .066], { rot: [0, 0, s * 14], g: "epaules" }), C([s * .06, 1.455, -.012], [s * .185, 1.43, -.006], .045, .05, .05), C(S, Ec, .05, .042), E([m[0], m[1] + .01, m[2] + .027], [.039, .09, .041], { rot: [0, 0, s * 12], g: "biceps" }),
      E([m[0] + s * .004, m[1], m[2] - .031], [.039, .098, .039], { rot: [0, 0, s * 12], g: "triceps" }), C(Ec, W, .043, .027), E([s * .279, .9, .034], [.021, .04, .031], { k: .02 }), E([s * .261, 1.08, -.004], [.044, .085, .042], { rot: [-10, 0, s * 7], g: "avantbras" })]; });
  const mains = cotes(s => { const x = s * .279; return [E([x, .85, .045], [.019, .05, .043], { k: .012 }), C([x - s * .003, .858, .076], [x - s * .012, .787, .107], .0125, .0102, .008),
    ...[0, 1, 2, 3].flatMap(i => { const z = .0745 - i * .0195, y = i === 3 ? .014 : i === 0 ? .007 : i === 2 ? .002 : 0; return [C([x + s * .004, .816, z], [x + s * .005, .77 + y * .5, z + .003], .0104, .0095, .0045), C([x + s * .005, .77 + y * .5, z + .003], [x - s * .009, .726 + y, z + .009], .0095, .0086, .0045)]; })]; });
  const jambes = cotes(s => { const H = [s * .092, .93, 0], K = [s * .1, .5, .012], A = [s * .1, .1, -.02];
    return [C(H, K, .09, .053), E([s * .096, .74, .038], [.064, .18, .062], { g: "quad" }), E([s * .142, .75, .008], [.044, .16, .056], { g: "quad" }), E([s * .07, .585, .035], [.034, .07, .036], { g: "quad" }),
      E([s * .096, .72, -.047], [.062, .17, .055], { g: "ischios" }), E([s * .048, .8, -.005], [.042, .13, .058], { g: "adducteurs" }), E([s * .1, .508, .02], [.045, .052, .046]),
      C(K, A, .047, .031), E([s * .088, .36, -.045], [.038, .11, .046], { g: "mollets" }), E([s * .118, .37, -.042], [.036, .1, .044], { g: "mollets" }), E([s * .108, .33, .03], [.027, .12, .026]), E([s * .1, .06, .03], [.04, .04, .08])]; });
  const tout = [...tronc, ...bras, ...jambes, ...mains, ...grandir(tete)];
  return { tout, zones: tout.filter(p => p.g).map(p => ({ ...p, g: G_[p.g] })),
    cheveux: grandir([E([0, 1.708, -.02], [.081, .08, .1]), E([0, 1.762, .028], [.058, .028, .055], { rot: [-14, 0, 0] }), E([0, 1.665, -.07], [.066, .06, .044]), E([0, 1.632, .05], [.105, .1, .115], { k: .014, sub: 1 })]),
    chaussure: s => [E([s * .1, .072, .03], [.048, .05, .112], { k: .02 }), E([s * .1, .052, .122], [.046, .033, .056], { k: .025 }), E([s * .1, .1, -.036], [.043, .056, .05], { k: .025 }), E([s * .1, .116, .034], [.03, .03, .042], { k: .02 })],
    semelle: s => [E([s * .1, .015, .04], [.055, .05, .147])] };
}

let PERSO = null; window.volLiberer = () => { PERSO = null; };   // style quitté : on rend la mémoire du maillage
/* Génère le personnage (une fois), en rendant la main au navigateur entre les pièces pour ne pas figer l'écran. */
function perso() { return PERSO ||= (async () => {
  // découpe adoucie : un ourlet arrondi plutôt qu'une arête en dents de scie
  const t0 = performance.now(), F = formes(), P = [], coupe = (v, d, k = .012) => { const e = Math.max(k - Math.abs(v - d), 0) / k; return Math.max(v, d) + e * e * k * .25; };
  const B = poser(grille([-.36, .06, -.2], [.36, 1.55, .19], .0095), F.tout); await souffle();
  // peau : rose aux lèvres et aux joues
  const peau = q => { if (q[1] < 1.54) return PEAU; const p = [q[0] / TETE, 1.55 + (q[1] - 1.55) / TETE, q[2] / TETE], l = Math.hypot(p[0] / .021, (p[1] - 1.6) / .0075, (p[2] - .08) / .012), j = Math.hypot((Math.abs(p[0]) - .043) / .026, (p[1] - 1.625) / .026, (p[2] - .06) / .03),
    a = (1 - lisse(.7, 1.15, l)) * .45, b = (1 - lisse(.3, 1, j)) * .14; return [PEAU[0] + (.82 - PEAU[0]) * a + .02 * b, PEAU[1] + (.5 - PEAU[1]) * a - .06 * b, PEAU[2] + (.46 - PEAU[2]) * a - .05 * b]; };
  P.push(filets(B, { mat: 0, coul: PEAU, zones: F.zones, garde: p => p[1] < 1.5 && !(Math.abs(p[0]) > .2 && p[1] < .895) })); await souffle();
  P.push(filets(poser(grille([-.105, 1.47, -.135], [.105, 1.84, .13], .0045), F.tout), { mat: 0, coul: peau, loin: B, garde: p => p[1] > 1.476 })); await souffle();
  for (const s of [1, -1]) P.push(filets(poser(grille([s > 0 ? .228 : -.325, .7, -.012], [s > 0 ? .325 : -.228, .93, .135], .0042), F.tout), { mat: 0, coul: PEAU, loin: B }));
  await souffle();
  // cheveux : mèches suggérées par une ondulation du champ
  const Hc = poser(grille([-.115, 1.58, -.15], [.115, 1.86, .125], .0055), F.cheveux);
  P.push(filets(retoucher(Hc, (x, y, z, v) => v + .0028 * Math.sin(x * 150 + Math.sin(y * 60 + z * 30) * 1.6) * lisse(1.6, 1.72, y)), { mat: 6, coul: BLOND })); await souffle();
  // t-shirt : la surface du corps décalée de quelques millimètres (plus aux manches et à l'ourlet), coupée au col, aux manches et à la taille
  const man = cotes(s => { const n = norm([s * .06, -.265, -.015]); return [[s, [s * .19 + n[0] * .14, 1.415 + n[1] * .14, -.005 + n[2] * .14], n]]; });
  P.push(filets(retoucher(B, (x, y, z, v) => { const ax = Math.abs(x); let d = v - .008 - .004 * lisse(.17, .23, ax) - .006 * lisse(1.08, .985, y) - .007 * lisse(1.39, 1.45, y) * (1 - lisse(.09, .15, ax));
    d = coupe(coupe(d, .985 - y), y - 1.5); d = coupe(d, Math.min(.072 - Math.hypot(x, z - .004), y - 1.4), .016);
    for (const [s, c, n] of man) if (s * x > .165) d = coupe(d, (x - c[0]) * n[0] + (y - c[1]) * n[1] + (z - c[2]) * n[2]);
    return d; }), { mat: 5, coul: BLEU, voile: true })); await souffle();
  // short : plus ample vers le bas
  P.push(filets(retoucher(B, (x, y, z, v) => coupe(coupe(coupe(v - .01 - .02 * lisse(.9, .66, y), y - 1.03), .655 - y), Math.abs(x) - .225)), { mat: 5, coul: GRIS, voile: true }));
  P.push(filets(retoucher(B, (x, y, z, v) => coupe(coupe(v - .006, y - .152, .006), .09 - y)), { mat: 7, coul: [.9, .9, .91] })); await souffle();
  for (const s of [1, -1]) { const lo = [s > 0 ? .035 : -.165, -.008, -.11], hi = [s > 0 ? .165 : -.035, .17, .2];
    P.push(filets(retoucher(poser(grille(lo, hi, .0055), F.chaussure(s)), (x, y, z, v) => coupe(v, .03 - y, .006)), { mat: 7, coul: p => { const t = lisse(.08, .12, p[1]) * .07; return [.69 + t, .7 + t, .735 + t]; } }));
    P.push(filets(retoucher(poser(grille(lo, [hi[0], .07, hi[2]], .0055), F.semelle(s)), (x, y, z, v) => coupe(coupe(v, y - .031 - .008 * lisse(.02, -.06, z), .006), .001 - y, .004)), { mat: 7, coul: [.95, .95, .96] })); }
  await souffle();
  // socle, yeux, sourcils, bouche : petites formes nettes ajoutées à part
  const g = new Geo(), oe = (c, r, ...a) => g.ell(gt(c), r.map(x => x * TETE), ...a); g.tour(SOCLE, 1);
  cotes(s => { oe([s * .03, 1.664, .0665], [.0115, .0115, .0115], [0, 0, 0], 7, [.95, .94, .92], 14, 10); oe([s * .03, 1.664, .0769], [.0048, .0048, .002], [0, 0, 0], 7, [.24, .38, .56], 12, 8); oe([s * .03, 1.664, .0781], [.002, .002, .0012], [0, 0, 0], 7, [.08, .08, .1], 10, 6); oe([s * .03, 1.6698, .0775], [.012, .0016, .003], [0, 0, s * -4], 7, [.42, .3, .22], 12, 6); oe([s * .03, 1.6835, .0835], [.0175, .003, .004], [0, s * 16, s * -5], 7, [.55, .41, .23], 12, 6); return []; });
  oe([0, 1.6005, .0818], [.014, .0013, .0025], [0, 0, 0], 7, [.62, .36, .33], 12, 6); P.push(g.piece());
  // points d'intérêt recalés sur la surface du corps
  const ancres = {}; for (const [k, a] of Object.entries(ANCRES)) { let t = 0; while (t < .2 && ech(B, a[0] + a[3] * t, a[1] + a[4] * t, a[2] + a[5] * t) < .004) t += .003; ancres[k] = { p: [a[0] + a[3] * t, a[1] + a[4] * t, a[2] + a[5] * t], n: norm(a.slice(3)) }; }
  P.ancres = ancres; P.ms = Math.round(performance.now() - t0); P.sommets = P.reduce((t, x) => t + x.v.length / PAS, 0);
  return P;
})(); }

const VS = `attribute vec3 aP,aN;attribute vec4 aC,aA;uniform mat3 uR;uniform vec4 uPr,uC;uniform float uGl[16];
varying vec3 vN,vM,vW,vA;varying vec4 vC;varying vec2 vG;
void main(){vec3 q=uR*(aP-vec3(0.,uC.x,0.));q.z-=uC.y;vN=uR*aN;vM=aN;vW=aP;vC=aC;vA=vec3(aA.x,aA.y,aA.w);vG=vec2(uGl[int(aA.z+.5)]*aA.w,1.-smoothstep(1.49,1.56,aP.y));
gl_Position=vec4(q.x*uPr.x,q.y*uPr.y,q.z*uPr.z+uPr.w,-q.z);gl_Position.xy+=uC.zw*gl_Position.w;}`;
/* Lumière principale en haut à gauche, contre-jour derrière à droite ; peau : rougeur à la limite de l'ombre (diffusion sous la surface). uSh = (rayon² de l'ombre, écart des pieds, lumière ambiante, mode muscles). */
const FS = `precision mediump float;varying vec3 vN,vM,vW,vA;varying vec4 vC;varying vec2 vG;
uniform vec3 uClay,uAcc,uPed,uPedS,uRim,uIron;uniform vec4 uSh;uniform float uVoile;
vec3 env(vec3 r){float h=r.y*.5+.5;vec3 c=mix(vec3(.07,.06,.055),vec3(.6,.57,.54),smoothstep(.15,.8,h));
c+=(smoothstep(.7,.78,h)-smoothstep(.92,.99,h))*.95;c+=vec3(1.,.88,.76)*smoothstep(.55,.9,r.x)*smoothstep(-.4,.3,r.y)*.55;c+=vec3(.85,.92,1.)*smoothstep(.7,.97,-r.x)*.3;return c;}
void main(){vec3 n=normalize(vN),L=normalize(vec3(-.5,.72,.52)),b=vC.rgb,c;
float d=dot(n,L),w=clamp(d*.6+.4,0.,1.);w=w*w*(3.-2.*w);float hemi=n.y*.5+.5,fr=pow(1.-clamp(n.z,0.,1.),3.),sp=pow(max(dot(n,normalize(L+vec3(0.,0.,1.))),0.),42.);
float cj=fr*clamp(dot(n,normalize(vec3(.62,.3,-.72)))*.6+.55,0.,1.),k=vA.y,ao=vC.a,a=1.,lum=(uSh.z+(1.-uSh.z)*w)*mix(.84,1.,hemi);
if(k<.5){float m=uSh.w*vG.y;vec3 s=mix(b,uClay,.72*m);s=mix(s,s*vec3(.97,.8,.74),vA.z*m*.8);
 c=s*lum*mix(vec3(.62,.4,.34),vec3(1.),mix(1.,ao,.75))+b*vec3(.55,.13,.07)*exp(-(d+.12)*(d+.12)*9.)*.15*(1.-.6*m)+sp*.09+uRim*cj*1.5;
 float st=.5+.5*sin(vA.x*42.);vec3 g=mix(uAcc*.36,uAcc,w)*(1.-.2*st)*mix(.85,1.,hemi)*mix(.6,1.,ao)+sp*.3+fr*(uAcc*.5+vec3(.2,.15,.1));c=mix(c,g,min(1.,vG.x*1.4)*uSh.w);}
else if(k<1.5){float top=smoothstep(.6,.9,vM.y);c=mix(mix(uPedS,uPed,w),uPed,top*.85)*mix(.86,1.,hemi);
 vec2 p=vW.xz-vec2(uSh.y,.03),q=vW.xz-vec2(-uSh.y,.03);c*=1.-.55*min(1.,exp(-dot(p,p)/uSh.x)+exp(-dot(q,q)/uSh.x))*top;c*=1.-.1*top*smoothstep(.3,.62,length(vW.xz));}
else if(k<4.5){vec3 e=env(reflect(vec3(0.,0.,-1.),n));
 if(k<2.5)c=vec3(1.,.73,.26)*(.2+e*1.25)+sp*.7+vec3(1.,.6,.2)*fr*.25;
 else if(k<3.5)c=uAcc*(.5+.6*w)+e*.2+sp*.55;
 else c=uIron*(.45+1.05*w)+e*(.1+fr*.5)+sp*.4+uRim*fr*1.4;}
else if(k<5.5){c=b*lum*mix(.42,1.,ao)+b*fr*.3+uRim*cj;a=uVoile*mix(.3+1.7*fr,1.,uVoile);}
else if(k<6.5){float an=pow(max(1.-abs(dot(n,normalize(L+vec3(0.,0.,1.)))-.72)*2.4,0.),3.);c=b*lum*mix(.45,1.,ao)+vec3(1.,.9,.7)*an*.14+uRim*cj*1.5;}
else c=b*lum*mix(.5,1.,ao)+sp*.14+uRim*cj;
gl_FragColor=vec4(c*a,a);}`;

/* Teintes du rendu selon le thème : argile de l'écorché, accent des muscles, socle, liseré du contre-jour, fonte, lumière ambiante */
const TEINTES = { light: { uClay: [.95, .915, .87], uAcc: [.93, .29, .12], uPed: [1, .99, .975], uPedS: [.8, .765, .715], uRim: [.2, .22, .27], uIron: [.115, .11, .105], amb: .52 },
  dark: { uClay: [.84, .8, .75], uAcc: [1, .4, .22], uPed: [.26, .24, .22], uPedS: [.075, .068, .06], uRim: [.4, .29, .22], uIron: [.2, .19, .18], amb: .3 } };
const REGL = { perso: { dist: 4.75, cy: .86, lacet: -.45, dy: -.045, pied: .1, ombre: .012 }, mini: { dist: 5.5, cy: .84, lacet: -.5, fov: 22, tang: .12, pied: .1, ombre: .012, auto: false },
  kettlebell: { dist: 3.5, cy: .62, tang: .2, lacet: -.5, vAuto: .22, fov: 30 }, medaille: { dist: 5.9, cy: .9, tang: .13, vAuto: .9, lacet: .55, dy: -.04, ombre: .03 } };
const VUES = []; let tPrec = 0, enBoucle = false;
function boucle(t) { if (!VUES.length) return enBoucle = false; const dt = Math.min(.1, (t - tPrec) / 1000); tPrec = t; VUES.forEach(v => v.avancer(dt, t / 1000)); requestAnimationFrame(boucle); }

/* Une vue = un canvas, un objet, une caméra en orbite. Redessinée seulement si quelque chose a changé et si elle est à l'écran. */
class Vue {
  constructor(hote, type, o) {
    const cv = document.createElement("canvas");
    Object.assign(this, { hote, cv, type, lacet: 0, tang: .17, vit: 0, dist: 4.6, cy: .85, fov: 26, dx: 0, dy: 0, auto: true, vAuto: .32, cible: null, ombre: .05, pied: 0, pris: false, visible: true, sale: true, points: [], decal: 0, mode: 0, modeV: 0, pret: false, o: {} }, REGL[type === "perso" && o.mini ? "mini" : type]);
    this.lueur = new Float32Array(16); this.vise = new Float32Array(16); this.pouls = 0; this.fin = [];
    const gl = this.gl = cv.getContext("webgl", { antialias: true, alpha: true });
    if (!gl) return;
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p); gl.useProgram(p);
    this.attr = ["aP", "aN", "aC", "aA"].map(a => gl.getAttribLocation(p, a)); this.attr.forEach(l => gl.enableVertexAttribArray(l));
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const U = {}; this.u = n => U[n] ??= gl.getUniformLocation(p, n);
    hote.classList.add("vol", "vol-" + type); hote.classList.toggle("vol-mini", !!o.mini); cv.tabIndex = o.mini ? -1 : 0; cv.setAttribute("role", "img"); hote.append(cv);
    this.brancher(); this.regler(o);
    const io = new IntersectionObserver(e => { this.visible = e[0].isIntersecting; this.sale = true; }), ro = new ResizeObserver(() => this.sale = true); io.observe(cv); ro.observe(cv); this.fin.push(() => io.disconnect(), () => ro.disconnect());
    // personnage : maillage généré au premier affichage, avec un état d'attente discret
    if (type === "perso") { hote.classList.add("vol-attente"); perso().then(P => this.gl && this.charger(P), () => this.echec()); } else this.charger(type === "medaille" ? medaille() : kettlebell());
  }
  charger(P) {
    const gl = this.gl; this.pieces = P.map(x => { const b = [gl.createBuffer(), gl.createBuffer()]; gl.bindBuffer(gl.ARRAY_BUFFER, b[0]); gl.bufferData(gl.ARRAY_BUFFER, x.v, gl.STATIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b[1]); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, x.i, gl.STATIC_DRAW); return { b, n: x.i.length, voile: x.voile }; });
    this.ancres = P.ancres || {}; this.pret = true; const f = this.ancres[this.o.face]; if (f) { this.lacet = Math.atan2(-f.n[0], f.n[2]) + (f.p[0] > 0 ? -.35 : .35); this.auto = false; } this.sale = true; this.hote.classList.remove("vol-attente"); this.poserPoints();
    VUES.push(this); if (!enBoucle) { enBoucle = true; tPrec = performance.now(); requestAnimationFrame(boucle); }
    if (this.o.pret) this.o.pret(P);
  }
  echec() { const s = this.o.echec; this.detruire(); if (s) s(); }
  brancher() {
    const cv = this.cv; let x0, y0, t0;
    const sur = (n, f) => { cv.addEventListener(n, f); this.fin.push(() => cv.removeEventListener(n, f)); };
    sur("pointerdown", e => { this.pris = true; this.cible = null; this.vit = 0; x0 = e.clientX; y0 = e.clientY; t0 = e.timeStamp; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
    sur("pointermove", e => { if (!this.pris) return; const dx = e.clientX - x0, dt = Math.max(1, e.timeStamp - t0) / 1000; this.lacet += dx * .011; this.tang = Math.max(-.12, Math.min(.62, this.tang + (e.clientY - y0) * .005)); this.vit = Math.max(-7, Math.min(7, dx * .011 / dt)); x0 = e.clientX; y0 = e.clientY; t0 = e.timeStamp; this.sale = true; });
    const fin = () => { this.pris = false; if (CALME.matches) this.vit = 0; };
    sur("pointerup", fin); sur("pointercancel", fin);
    sur("keydown", e => { const k = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (k) { this.cible = null; this.lacet += k * .3; this.sale = true; e.preventDefault(); } });
    sur("webglcontextlost", e => { e.preventDefault(); this.echec(); });
  }
  /* Applique les options (appelé à la création puis par maj) : muscles allumés, mode, points, boutons. */
  regler(o) {
    Object.assign(this.o, o); o = this.o;
    if (o.aria) this.cv.setAttribute("aria-label", o.aria);
    if ("auto" in o) this.auto = o.auto; if ("decal" in o) this.decal = o.decal; if ("tang" in o) this.tang = o.tang;
    if (o.muscles) this.allumer(Array.isArray(o.muscles) ? Object.fromEntries(o.muscles.map(m => [m, 1])) : o.muscles);
    // en mode muscles, le personnage apparaît d'abord habillé, puis les vêtements s'effacent
    if (o.mode) { this.modeV = o.mode === "muscles" ? 1 : 0; if (!this.pret && (CALME.matches || o.mini)) this.mode = this.modeV; }
    if (o.outils && !this.outils) { this.outils = document.createElement("div"); this.outils.className = "vol-outils";
      const bt = (t, f, pr) => { const b = document.createElement("button"); b.type = "button"; b.className = "toggle"; b.textContent = t; if (pr != null) b.setAttribute("aria-pressed", pr); else b.classList.add("contour"); b.onclick = () => f(b); this.outils.append(b); };
      bt(o.outils.muscles, b => { this.modeV = 1 - this.modeV; b.setAttribute("aria-pressed", !!this.modeV); this.fermer(); }, !!this.modeV);
      bt(o.outils.dos, () => { this.fermer(); this.viser(Math.cos(this.cible ?? this.lacet) > 0 ? Math.PI + .3 : -.3); });
      this.hote.append(this.outils); }
    if (o.points && this.pret) this.poserPoints();
    this.sale = true;
  }
  poserPoints() {
    this.points.forEach(h => h.el.remove()); this.points = [];
    (this.o.points || []).forEach(pt => { const a = this.ancres[pt.g]; if (!a) return; const el = document.createElement("button"); el.type = "button"; el.className = "vol-pt"; el.setAttribute("aria-label", pt.nom); el.setAttribute("aria-expanded", "false"); el.innerHTML = "<i></i>";
      el.onclick = () => { this.fermer(); this.ouvert = el; el.setAttribute("aria-expanded", "true"); this.auto = false; this.viser(Math.atan2(-a.n[0], a.n[2]) + (a.p[0] > 0 ? -.3 : .3)); this.pouls = G_[pt.g]; this.avant = Float32Array.from(this.vise); this.vise.forEach((v, k) => this.vise[k] = k === this.pouls ? 1 : v * .16); if (this.o.surPoint) this.o.surPoint(pt.g, pt); };
      this.hote.append(el); this.points.push({ el, ...a }); });
  }
  // referme le point ouvert : les muscles de la séance reprennent leur intensité
  fermer() { if (!this.ouvert) return; this.ouvert.setAttribute("aria-expanded", "false"); this.ouvert = null; this.pouls = 0; if (this.avant) this.vise.set(this.avant); this.auto = this.o.auto ?? REGL[this.type].auto ?? true; }
  // rotation du monde vers la caméra (colonnes) : Rx(tangage)·Ry(lacet)
  rot() { const a = this.lacet + this.decal + (this.mx || 0) * .7, tg = Math.max(-.2, Math.min(.75, this.tang + (this.my || 0) * .3)), c = Math.cos(a), s = Math.sin(a), ct = Math.cos(tg), st = Math.sin(tg); return [c, st * s, -ct * s, 0, ct, st, s, -st * c, ct * c]; }
  projeter(p, n) {
    const R = this.rot(), q = [0, 1, 2].map(k => R[k] * p[0] + R[k + 3] * (p[1] - this.cy) + R[k + 6] * p[2]), nz = R[2] * n[0] + R[5] * n[1] + R[8] * n[2], w = this.dist - q[2];
    return { x: (q[0] * this.pr[0] / w + this.dx) * .5 + .5, y: .5 - (q[1] * this.pr[1] / w + this.dy) * .5, face: nz };
  }
  avancer(dt, t) {
    const y0 = this.lacet, vif = !CALME.matches;
    if (!this.pris) {
      if (this.cible != null) { const d = this.cible - this.lacet; this.lacet += !vif || Math.abs(d) < .004 ? d : d * Math.min(1, dt * 5); if (this.lacet === this.cible) this.cible = null; }
      else if (Math.abs(this.vit) > .02) { this.lacet += this.vit * dt; this.vit *= Math.exp(-dt * 2.6); }
      else if (this.auto && vif) { this.lacet += dt * this.vAuto; if ((this.tAuto = (this.tAuto || 0) + dt) > 8) this.auto = false; }
    }
    let bouge = y0 !== this.lacet;
    // inclinaison du téléphone (window.MVT, js/progres.js) : l'objet tourne doucement avec le geste
    const M = window.MVT; if (M && vif && !this.o.mini) for (const [k, v] of [["mx", M.x], ["my", M.y]]) { const d = v - (this[k] || 0); if (Math.abs(d) > .002) { this[k] = (this[k] || 0) + d * Math.min(1, dt * 8); bouge = true; } }
    // les vêtements ne commencent à s'effacer qu'après une courte pause, le temps de reconnaître le personnage
    this.t0 ??= t; const mv = t - this.t0 > .9 || !vif || this.o.mini ? this.modeV : Math.min(this.mode, this.modeV);
    if (Math.abs(mv - this.mode) > .002) { this.mode += vif ? (mv - this.mode) * Math.min(1, dt * 3.5) : mv - this.mode; bouge = true; }
    for (let k = 1; k < 16; k++) { const v = this.vise[k] * (k === this.pouls && vif ? .82 + .18 * Math.sin(t * 4) : 1), d = v - this.lueur[k]; if (Math.abs(d) > .002) { this.lueur[k] += vif ? d * Math.min(1, dt * 6) : d; bouge = true; } }
    if ((bouge || this.sale) && this.visible) this.dessiner();
  }
  dessiner() {
    const { gl, cv } = this, dpr = Math.min(devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
    if (!W || !H) return; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    this.sale = false; gl.viewport(0, 0, W, H); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const f = 1 / Math.tan(this.fov * RAD / 2), n = .5, fa = 30, T = TEINTES[document.documentElement.dataset.theme === "dark" ? "dark" : "light"], voile = 1 - .88 * this.mode;
    this.pr = [f * H / W, f, (fa + n) / (n - fa), 2 * fa * n / (n - fa)];
    gl.uniformMatrix3fv(this.u("uR"), false, this.rot()); gl.uniform4fv(this.u("uPr"), this.pr); gl.uniform4f(this.u("uC"), this.cy, this.dist, this.dx, this.dy);
    gl.uniform1fv(this.u("uGl"), this.lueur); gl.uniform4f(this.u("uSh"), this.ombre, this.pied, T.amb, this.mode); gl.uniform1f(this.u("uVoile"), voile);
    Object.entries(T).forEach(([k, v]) => k !== "amb" && gl.uniform3fv(this.u(k), v));
    // pièces opaques d'abord ; les vêtements devenus voile sont dessinés ensuite, mélangés, sans écrire la profondeur
    [false, true].forEach(v => { const fondu = v && voile < .99; if (fondu) { gl.enable(gl.BLEND); gl.depthMask(false); }
      this.pieces.forEach(x => { if (!!x.voile !== v) return; gl.bindBuffer(gl.ARRAY_BUFFER, x.b[0]); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, x.b[1]);
        [3, 3, 4, 4].reduce((d, t, k) => (gl.vertexAttribPointer(this.attr[k], t, gl.FLOAT, false, PAS * 4, d * 4), d + t), 0); gl.drawElements(gl.TRIANGLES, x.n, gl.UNSIGNED_SHORT, 0); });
      if (fondu) { gl.disable(gl.BLEND); gl.depthMask(true); } });
    cv.dataset.lacet = (this.lacet + this.decal).toFixed(4); cv.dataset.mode = this.mode.toFixed(2);
    // points d'intérêt : suivent le modèle, s'effacent quand ils passent derrière ou hors du mode muscles
    this.points.forEach(h => { const q = this.projeter(h.p, h.n), cache = q.face < .18 || this.mode < .5; h.el.style.transform = `translate(${(q.x * cv.clientWidth).toFixed(1)}px,${(q.y * cv.clientHeight).toFixed(1)}px)`; h.el.classList.toggle("dos", cache); h.el.tabIndex = cache ? -1 : 0; });
  }
  allumer(groupes) { this.vise.fill(0); Object.entries(groupes).forEach(([k, v]) => { if (G_[k]) this.vise[G_[k]] = v; }); this.pouls = 0; this.avant = null; }
  // tourner par le plus court chemin jusqu'à un lacet donné
  viser(a) { const T = 2 * Math.PI; this.vit = 0; this.cible = this.lacet + ((((a - this.lacet) % T) + T + Math.PI) % T - Math.PI); }
  detruire() {
    const k = VUES.indexOf(this); if (k >= 0) VUES.splice(k, 1); if (COURANTE === this) COURANTE = null;
    this.fin.forEach(f => f()); this.fin = []; this.points.forEach(h => h.el.remove()); this.outils?.remove(); this.cv.remove();
    this.hote.classList.remove("vol-attente"); const x = this.gl?.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); this.gl = null;
  }
}
let COURANTE = null;
window.volume = (hote, type, o = {}) => {
  // un seul contexte WebGL vivant à la fois dans l'appli (les téléphones en limitent le nombre)
  if (o.seul !== false) { COURANTE?.detruire(); COURANTE = null; }
  let v; try { v = new Vue(hote, type, o); } catch (e) { hote.querySelectorAll("canvas").forEach(c => { c.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext(); c.remove(); }); return null; }
  if (!v.gl) return null;
  if (o.seul !== false) COURANTE = v;
  return { vue: v, maj: (n = {}) => v.gl && v.regler(n), fermer: () => v.gl && v.fermer(), detruire: () => v.detruire() };
};
window.volume.groupes = GROUPES.slice(1); window.volume.perso = perso;
})();
