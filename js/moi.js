/* ============ MOI : personnage, boutique et home gym ============
   Le personnage en pied reprend l'avatar du profil (genre, peau, cheveux) et porte une tenue ; il vit dans un home gym à décorer.
   L'apparence est gratuite. Tenues et décors s'achètent avec les points d'expérience gagnés en séance :
   solde = XP total − prix des articles possédés (le niveau, lui, ne baisse jamais).
   Données : tenue portée dans profil.avatar (tee, bas, chaus, acc[], coupe) ; achats et décor dans « boutique » { a: possédés, mur, sol, obj[] }. */
// [id, famille, nom FR, EN, prix, …données] ; un prix négatif = récompense de palier, offerte à partir de ce niveau (−6 → niveau 6) — tee : couleur, coupe (0 t-shirt, 1 débardeur, 2 sweat), motif (0 uni, 1 bande, 2 étoile, 3 numéro)
const ARTICLES = [
  ["t0", "tee", "T-shirt orange", "Orange T-shirt", 0, "#EA580C", 0, 0], ["t1", "tee", "T-shirt blanc", "White T-shirt", 40, "#F8FAFC", 0, 0], ["t2", "tee", "Débardeur noir", "Black tank top", 60, "#1F2937", 1, 0], ["t3", "tee", "T-shirt bleu à bande", "Blue striped T-shirt", 90, "#2563EB", 0, 1],
  ["t4", "tee", "Débardeur rouge de boxe", "Red boxing tank", 120, "#DC2626", 1, 1], ["t5", "tee", "Sweat gris à capuche", "Grey hoodie", 160, "#64748B", 2, 0], ["t6", "tee", "Maillot vert numéro 10", "Green number 10 jersey", 200, "#16A34A", 0, 3], ["t7", "tee", "Sweat noir étoilé", "Black star hoodie", 280, "#111827", 2, 2], ["t8", "tee", "Maillot or de champion", "Champion gold jersey", 500, "#F5B301", 0, 2],
  ["t9", "tee", "Maillot violet du Motivé", "Motivated purple jersey", -3, "#7C3AED", 0, 2], ["t10", "tee", "Tenue noire de Légende", "Legend black kit", -15, "#0B0B14", 0, 3],
  // bas : couleur, long (0 short, 1 jogging)
  ["b0", "bas", "Short noir", "Black shorts", 0, "#1F2937", 0], ["b1", "bas", "Short bleu", "Blue shorts", 40, "#1D4ED8", 0], ["b2", "bas", "Short rouge de boxe", "Red boxing shorts", 90, "#B91C1C", 0], ["b3", "bas", "Jogging gris", "Grey joggers", 110, "#6B7280", 1], ["b4", "bas", "Jogging noir", "Black joggers", 140, "#111827", 1], ["b5", "bas", "Short or", "Gold shorts", 350, "#EAB308", 0],
  // chaussures : couleur, semelle
  ["c0", "chaus", "Baskets blanches", "White trainers", 0, "#F1F5F9", "#94A3B8"], ["c1", "chaus", "Baskets noires", "Black trainers", 50, "#111827", "#F8FAFC"], ["c2", "chaus", "Baskets rouges", "Red trainers", 90, "#DC2626", "#F8FAFC"], ["c3", "chaus", "Chaussures de boxe", "Boxing boots", 180, "#1E3A8A", "#FACC15"], ["c4", "chaus", "Baskets fluo", "Neon trainers", 240, "#A3E635", "#0F172A"],
  // accessoires : type, couleur (plusieurs à la fois)
  ["a1", "acc", "Bandeau", "Headband", 50, "bandeau", "#DC2626"], ["a2", "acc", "Serviette", "Towel", 40, "serviette", "#E2E8F0"], ["a3", "acc", "Casquette", "Cap", 90, "casquette", "#1D4ED8"], ["a4", "acc", "Lunettes", "Glasses", 110, "lunettes", "#111827"], ["a5", "acc", "Casque audio", "Headphones", 150, "casque", "#111827"], ["a6", "acc", "Gants de boxe", "Boxing gloves", 220, "gants", "#DC2626"], ["a7", "acc", "Ceinture de champion", "Champion belt", 600, "ceinture", "#F5B301"], ["a8", "acc", "Couronne", "Crown", -9, "couronne", "#F5B301"], ["a9", "acc", "Auréole", "Halo", -21, "aureole", "#FDE047"],
  // murs : genre, couleur 1, couleur 2
  ["m0", "mur", "Mur clair", "Light wall", 0, "uni", "#E7E5E4", "#D6D3D1"], ["m1", "mur", "Mur bleu nuit", "Night-blue wall", 80, "uni", "#1E293B", "#0F172A"], ["m2", "mur", "Béton brut", "Raw concrete", 110, "beton", "#9CA3AF", "#6B7280"], ["m3", "mur", "Briques", "Brick wall", 160, "brique", "#B45309", "#7C2D12"], ["m4", "mur", "Salle néon", "Neon room", 320, "neon", "#0B0B14", "#F97316"], ["m5", "mur", "Coucher de soleil", "Sunset wall", -6, "uni", "#F97316", "#7C3AED"],
  // sols : genre, couleur 1, couleur 2
  ["s0", "sol", "Parquet", "Wooden floor", 0, "parquet", "#D6A77A", "#B9875A"], ["s1", "sol", "Dalles caoutchouc", "Rubber tiles", 100, "dalles", "#334155", "#1E293B"], ["s2", "sol", "Tatami", "Tatami mats", 140, "dalles", "#2563EB", "#DC2626"], ["s3", "sol", "Gazon d’entraînement", "Training turf", 180, "parquet", "#16A34A", "#15803D"], ["s4", "sol", "Podium noir et or", "Black and gold podium", -18, "dalles", "#111827", "#CA8A04"],
  // objets du home gym : devant (1) ou derrière (0) le personnage
  ["o1", "obj", "Tapis de sol", "Exercise mat", 40, 0], ["o2", "obj", "Plante verte", "Green plant", 50, 0], ["o3", "obj", "Poster motivation", "Motivation poster", 60, 0], ["o4", "obj", "Horloge murale", "Wall clock", 70, 0], ["o5", "obj", "Kettlebell", "Kettlebell", 80, 1], ["o6", "obj", "Rack d’haltères", "Dumbbell rack", 100, 0],
  ["o7", "obj", "Enceinte", "Speaker", 100, 1], ["o8", "obj", "Miroir", "Mirror", 120, 0], ["o9", "obj", "Fenêtre", "Window", 150, 0], ["o10", "obj", "Banc de musculation", "Weight bench", 160, 0], ["o11", "obj", "Sac de frappe", "Punching bag", 220, 0], ["o12", "obj", "Étagère à trophées", "Trophy shelf", 260, 0], ["o13", "obj", "Cage à squat", "Squat rack", 320, 0], ["o14", "obj", "Néon 2WORK", "2WORK neon sign", 380, 0], ["o15", "obj", "Trophée géant", "Giant trophy", -12, 1]];
ARTICLES.push(["t11", "tee", "Maillot braise", "Ember jersey", "x", "#9F1239", 0, 2], ["t12", "tee", "Veste de coach", "Coach jacket", "x", "#0F766E", 2, 1], ["a10", "acc", "Cape de champion", "Champion cape", "x", "cape", "#B91C1C"], ["a11", "acc", "Médaille d’or", "Gold medal", "x", "medaille", "#F5B301"]);
// Articles d'exploit (prix « x ») : ni achetables ni liés au niveau, ils se gagnent par un exploit précis — [condition FR, EN, test sur l'historique]
const EXPLOITS = { t11: ["14 jours d’affilée", "14-day streak", h => series(h).best >= 14], t12: ["28 séances de programme", "28 programme sessions", h => h.filter(x => x.k === "prog").length >= 28],
  a10: ["10 séances en mode combat", "10 fight-mode sessions", h => h.filter(x => x.k === "combat").length >= 10], a11: ["100 séances terminées", "100 workouts done", h => h.length >= 100] };
// Bonus d'XP des objets installés dans le home gym : [% en plus, séances concernées, libellé FR, EN] ; cumulables jusqu'à 25 %, figés dans la séance au moment où elle se termine (« bx »)
const renfoX = x => ["seance", "salle"].includes(x.m), recupX = x => ["calme", "souffle", "echauffement"].includes(x.m);
const BONUS = { o1: [10, recupX, "mobilité et récupération", "mobility and recovery"], o2: [5, recupX, "mobilité et récupération", "mobility and recovery"], o5: [5, renfoX, "renfo et salle", "strength and gym"], o6: [5, renfoX, "renfo et salle", "strength and gym"], o10: [5, x => x.m === "salle", "salle", "gym"],
  o13: [10, x => x.m === "salle", "salle", "gym"], o11: [10, x => x.c === "boxe" || x.k === "combat", "boxe", "boxing"], o7: [5, () => true, "toutes les séances", "every workout"], o15: [5, () => true, "toutes les séances", "every workout"] };
const bonusGym = (x, B = lireBoutique()) => Math.round((xpSeance({ ...x, bx: 0 })) * Math.min(25, B.obj.reduce((t, id) => t + (BONUS[id] && BONUS[id][1](x) ? BONUS[id][0] : 0), 0)) / 100);
const article = id => ARTICLES.find(a => a[0] === id);
const lireBoutique = () => ({ a: [], mur: "m0", sol: "s0", obj: [], pos: {}, ...lireJSON("boutique", {}) });
const possede = (id, B = lireBoutique()) => { const p = article(id)[4]; return p === "x" ? EXPLOITS[id][2](lireHist()) : p < 0 ? niveauXp().n >= -p : !p || B.a.includes(id); };
const solde = (B = lireBoutique()) => xpTotal() - B.a.reduce((t, id) => t + (article(id) ? Math.max(0, +article(id)[4] || 0) : 0), 0);
const COUPES = [["Classique", "Classic"], ["Rasé", "Buzz cut"], ["Crête", "Spiky"], ["Chignon", "Bun"], ["Afro", "Afro"]];

/* --- Dessin : la tête (partagée avec la carte de vitalité), le corps et sa tenue, puis la pièce --- */
function tetePerso(a, e = "forme") {   // → [cheveux de derrière, visage et cheveux de devant]
  const p = PEAUX[a.peau] || PEAUX[1], c = CHEVEUX[a.chev] || CHEVEUX[1], f = a.g === "f", lon = +a.lon || 0, k = +a.coupe || 0;
  const dos = (k === 4 ? `<circle cx="60" cy="46" r="37" fill="${c}"/>` : "") + (lon === 2 ? `<path d="M30 52C26 20 94 20 90 52c0 22 6 40 2 62H28c-4-22 2-40 2-62z" fill="${c}"/>` : lon === 1 ? `<path d="M31 52C27 22 93 22 89 52c0 12 3 22 1 32H30c-2-10 1-20 1-32z" fill="${c}"/>` : "");
  const yeux = e === "plat" ? `<path d="M46 60h10M64 60h10" stroke="#2B1D14" stroke-width="2.6" stroke-linecap="round"/>` : `<circle cx="51" cy="60" r="3.2" fill="#2B1D14"/><circle cx="69" cy="60" r="3.2" fill="#2B1D14"/>${f ? `<path d="M45 55l-3-2M75 55l3-2" stroke="#2B1D14" stroke-width="1.6" stroke-linecap="round"/>` : ""}`;
  const bouche = e === "plat" ? "M53 76q7-4 14 0" : e === "baisse" ? "M54 75h12" : e === "feu" ? "M50 72q10 11 20 0z" : "M52 73q8 7 16 0";
  const dessus = k === 1 ? `<path d="M34 50C32 26 88 26 86 50c-6-8-14-12-26-12s-20 4-26 12z" fill="${c}" opacity=".5"/>` : `<path d="${f || lon ? "M32 56C28 22 92 22 88 56c-6-12-16-20-30-20-12 0-22 8-26 20z" : "M33 52C30 24 90 24 87 52c-5-9-12-14-27-14S38 43 33 52z"}" fill="${c}"/>`
    + (k === 2 ? `<path d="M44 36l5-17 5 12 5-17 5 17 5-12 5 17z" fill="${c}"/>` : k === 3 ? `<circle cx="60" cy="22" r="11" fill="${c}"/>` : "");
  return [dos, `<ellipse cx="60" cy="60" rx="27" ry="31" fill="${p}"/><ellipse cx="33" cy="62" rx="4" ry="6" fill="${p}"/><ellipse cx="87" cy="62" rx="4" ry="6" fill="${p}"/>${dessus}${yeux}<path d="${bouche}" fill="${e === "feu" ? "#7F1D1D" : "none"}" stroke="#7A3B2A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`];
}
const POSES_PERSO = { debout: [10, 30, 11, 62], garde: [14, 24, 1, -6], flex: [19, -2, 13, -30], victoire: [13, -12, 19, -46] };   // coude puis main, par rapport à l'épaule (x vers l'extérieur du corps)
const NOMS_POSES = [["auto", "Auto", "Auto"], ["debout", "Debout", "Standing"], ["garde", "En garde", "Guard up"], ["flex", "Biceps", "Flex"], ["victoire", "Victoire", "Victory"]];
function posePerso(a = lireAvatar()) {   // « auto » : en garde après une séance de boxe, biceps quand la vitalité est haute, debout sinon
  if (a.pose && a.pose !== "auto") return a.pose; const h = lireHist(), x = h[h.length - 1];
  return x && (x.c === "boxe" || x.k === "combat") ? "garde" : vitalite() >= 80 ? "flex" : "debout";
}
function persoSvg(a = lireAvatar(), e = etatVita(vitalite())[0], pose = posePerso(a)) {   // personnage en pied, dans un repère 120 × 232
  const p = PEAUX[a.peau] || PEAUX[1], T = article(a.tee) || article("t0"), B = article(a.bas) || article("b0"), C = article(a.chaus) || article("c0"), acc = (a.acc || []).map(article).filter(Boolean), a2 = t => acc.find(x => x[5] === t);
  const [dos, visage] = tetePerso(a, e), [, , , , , tc, tt, tm] = T, sombre = /^#(0|1|2|3)/.test(tc), enc = sombre ? "#F8FAFC" : "#0F172A", g = a2("gants"), manche = tt === 2 ? 60 : tt === 1 ? 0 : 24;
  const [ex, ey, hx, hy] = POSES_PERSO[pose] || POSES_PERSO.debout, trait = (d, c, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const bras = x => { const s = x < 60 ? -1 : 1, C = [x + s * ex, 104 + ey], H = [x + s * hx, 104 + hy], P = k => [C[0] + (H[0] - C[0]) * k, C[1] + (H[1] - C[1]) * k];   // épaule → coude → main
    return trait(`M${x} 104L${C}L${H}`, p, 11) + (manche === 60 ? trait(`M${x} 104L${C}L${P(.8)}`, tc, 13) : manche ? trait(`M${x} 104L${[x + s * ex * .7, 104 + ey * .7]}`, tc, 13) : "")
      + (g ? `<circle cx="${H[0]}" cy="${H[1]}" r="10" fill="${g[6]}"/><circle cx="${P(.72)[0]}" cy="${P(.72)[1]}" r="6" fill="#F8FAFC"/>` : `<circle cx="${H[0]}" cy="${H[1]}" r="6.5" fill="${p}"/>`); };
  const jambe = x => `<rect x="${x}" y="182" width="17" height="36" rx="7" fill="${B[6] ? B[5] : p}"/><path d="M${x - 3} 222q0-9 11-9t13 6q3 5-1 7h-21q-2-1-2-4z" fill="${C[5]}"/><rect x="${x - 3}" y="223" width="25" height="4" rx="2" fill="${C[6]}"/>${C[0] === "c3" ? `<rect x="${x}" y="204" width="17" height="12" fill="${C[5]}"/>` : ""}`;
  const motif = tm === 1 ? `<rect x="36" y="124" width="48" height="9" fill="${enc}" opacity=".85"/>` : tm === 2 ? `<path d="M60 116l3.6 7.6 8.2 1-6 5.8 1.5 8.2-7.3-4-7.3 4 1.5-8.2-6-5.8 8.2-1z" fill="${T[0] === "t8" ? "#7C2D12" : "#FACC15"}"/>` : tm === 3 ? `<text x="60" y="140" text-anchor="middle" font-size="24" font-weight="800" font-family="Barlow Condensed, Arial Narrow, sans-serif" fill="${enc}">10</text>` : "";
  return `${a2("cape") ? `<path d="M36 100q-20 62-12 116h72q8-54-12-116z" fill="${a2("cape")[6]}"/><path d="M36 100q24 12 48 0l3 8H33z" fill="#FACC15"/>` : ""}${dos}${tt === 2 ? `<path d="M36 100q24-22 48 0v10H36z" fill="${tc}" opacity=".85"/>` : ""}${jambe(40)}${jambe(63)}
    <path d="M37 160h46l3 30H63l-3-14-3 14H34z" fill="${B[5]}"/>
    <path d="M50 90h20v12q-10 8-20 0z" fill="${p}"/><path d="M34 102q10-6 16-4 10 8 20 0 6-2 16 4l-2 60H36z" fill="${tc}"/>${motif}
    ${a2("medaille") ? `<path d="M50 100l10 26 10-26" fill="none" stroke="#2563EB" stroke-width="4"/><circle cx="60" cy="130" r="8" fill="${a2("medaille")[6]}" stroke="#B45309" stroke-width="1.500"/>` : ""}${bras(34)}${bras(86)}
    ${a2("ceinture") ? `<rect x="35" y="154" width="50" height="11" rx="3" fill="#7C2D12"/><ellipse cx="60" cy="159.500" rx="11" ry="9" fill="${a2("ceinture")[6]}" stroke="#B45309" stroke-width="1.500"/>` : ""}
    ${a2("serviette") ? `<path d="M40 98q20 14 40 0l5 6v26h-11v-20q-14 8-28 0v20H35v-26z" fill="${a2("serviette")[6]}"/>` : ""}${visage}
    ${a2("bandeau") ? `<path d="M33 47q27-11 54 0v8q-27-11-54 0z" fill="${a2("bandeau")[6]}"/>` : ""}${a2("lunettes") ? `<g fill="none" stroke="${a2("lunettes")[6]}" stroke-width="2.4"><rect x="42" y="53" width="15" height="12" rx="4"/><rect x="63" y="53" width="15" height="12" rx="4"/><path d="M57 58h6M42 58l-8-2M78 58l8-2"/></g>` : ""}
    ${a2("casquette") ? `<path d="M32 47C31 18 89 18 88 47z" fill="${a2("casquette")[6]}"/><path d="M84 41h20q4 8-20 8z" fill="${a2("casquette")[6]}"/>` : ""}${a2("couronne") ? `<path d="M40 34l4-18 8 10 8-14 8 14 8-10 4 18z" fill="${a2("couronne")[6]}" stroke="#B45309" stroke-width="1.500" stroke-linejoin="round"/><circle cx="60" cy="27" r="2.500" fill="#DC2626"/>` : ""}${a2("aureole") ? `<ellipse cx="60" cy="14" rx="22" ry="6" fill="none" stroke="${a2("aureole")[6]}" stroke-width="4" style="filter:drop-shadow(0 0 4px ${a2("aureole")[6]})"/>` : ""}${a2("casque") ? `<path d="M30 60C28 14 92 14 90 60" fill="none" stroke="${a2("casque")[6]}" stroke-width="5"/><rect x="25" y="52" width="10" height="20" rx="5" fill="${a2("casque")[6]}"/><rect x="85" y="52" width="10" height="20" rx="5" fill="${a2("casque")[6]}"/>` : ""}`;
}
const OBJETS = {   // repère de la pièce (360 × 300, sol à partir de y = 205) ; le personnage occupe x 132 à 228 : aucun objet n'y est placé, sauf le tapis sous ses pieds
  o1: `<ellipse cx="180" cy="268" rx="96" ry="18" fill="#7C3AED"/><ellipse cx="180" cy="268" rx="96" ry="18" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`,
  o2: `<path d="M322 205h24l-4 28h-16z" fill="#B45309"/><path d="M334 205q-20-30-8-54 8 24 8 54zM334 205q2-40 20-48-2 28-20 48zM334 205q-26-14-26-36 20 10 26 36z" fill="#16A34A"/>`,
  o3: `<rect x="264" y="40" width="38" height="52" rx="3" fill="#0F172A" stroke="#F8FAFC" stroke-width="3"/><path d="M270 80l9-18 6 9 5-6 7 15z" fill="#F97316"/><circle cx="292" cy="54" r="5" fill="#FACC15"/>`,
  o4: `<circle cx="283" cy="19" r="13" fill="#F8FAFC" stroke="#0F172A" stroke-width="3"/><path d="M283 19v-8M283 19l6 4" stroke="#0F172A" stroke-width="2.500" stroke-linecap="round"/>`,
  o5: `<g transform="translate(188 0)"><path d="M94 264a14 14 0 1 1 28 0 14 14 0 0 1-28 0z" fill="#1F2937"/><path d="M100 252q-4-16 8-16t8 16" fill="none" stroke="#1F2937" stroke-width="5"/><circle cx="108" cy="264" r="5" fill="#EA580C"/></g>`,
  o6: `<path d="M10 234h74M10 214h74" stroke="#64748B" stroke-width="5"/><path d="M14 207v40M80 207v40" stroke="#475569" stroke-width="5"/>${[24, 47, 70].map((x, k) => `<g fill="${["#DC2626", "#2563EB", "#16A34A"][k]}"><rect x="${x - 7}" y="202" width="5" height="12" rx="2"/><rect x="${x + 6}" y="202" width="5" height="12" rx="2"/><rect x="${x - 7}" y="222" width="5" height="12" rx="2"/><rect x="${x + 6}" y="222" width="5" height="12" rx="2"/></g><path d="M${x - 3} 208h10M${x - 3} 228h10" stroke="#CBD5E1" stroke-width="3"/>`).join("")}`,
  o7: `<rect x="318" y="246" width="32" height="44" rx="6" fill="#111827"/><circle cx="334" cy="259" r="5.500" fill="#64748B"/><circle cx="334" cy="276" r="9" fill="#64748B"/><circle cx="334" cy="276" r="4" fill="#EA580C"/>`,
  o8: `<rect x="10" y="52" width="36" height="124" rx="6" fill="#BAE6FD" stroke="#F8FAFC" stroke-width="4"/><path d="M17 150l20-80M27 166l14-56" stroke="#fff" stroke-opacity=".75" stroke-width="4"/>`,
  o9: `<rect x="54" y="40" width="42" height="52" rx="4" fill="#7DD3FC" stroke="#F8FAFC" stroke-width="5"/><path d="M75 40v52M54 66h42" stroke="#F8FAFC" stroke-width="4"/><circle cx="86" cy="53" r="6" fill="#FDE047"/>`,
  o10: `<rect x="250" y="216" width="62" height="10" rx="4" fill="#DC2626"/><path d="M258 226v20M304 226v20M251 246h14M297 246h14" stroke="#475569" stroke-width="5" stroke-linecap="round"/>`,
  o11: `<path d="M326 0v40" stroke="#CBD5E1" stroke-width="3"/><rect x="311" y="40" width="30" height="100" rx="14" fill="#B91C1C"/><rect x="311" y="62" width="30" height="8" fill="#FCA5A5"/><rect x="311" y="112" width="30" height="8" fill="#FCA5A5"/>`,
  o12: `<rect x="262" y="126" width="44" height="6" rx="2" fill="#92400E"/>${[271, 284, 297].map((x, k) => `<path d="M${x - 5} 106h10v7q0 7-5 7t-5-7zM${x - 3} 126h6l-1-6h-4z" fill="${["#F5B301", "#E2E8F0", "#D97706"][k]}"/>`).join("")}`,
  o13: `<path d="M120 62v178M240 62v178M112 240h18M232 240h18" stroke="#475569" stroke-width="7" stroke-linecap="round"/><path d="M110 112h22M228 112h22" stroke="#CBD5E1" stroke-width="5"/><rect x="103" y="97" width="8" height="30" rx="3" fill="#DC2626"/><rect x="249" y="97" width="8" height="30" rx="3" fill="#DC2626"/>`,
  o14: `<text x="60" y="27" text-anchor="middle" font-size="24" font-weight="800" font-family="Barlow Condensed, Arial Narrow, sans-serif" fill="#FDBA74" stroke="#F97316" stroke-width="1.200" style="filter:drop-shadow(0 0 6px #F97316)">2WORK</text>`,
  o15: `<path transform="translate(78 52) scale(.8)" d="M22 236h36v14q0 20-18 20t-18-20zM14 240h8v10q-8 0-8-10zM58 240h8q0 10-8 10zM35 270h10l2 12H33zM26 282h28v8H26z" fill="#F5B301" stroke="#92400E" stroke-width="1.500" stroke-linejoin="round"/>` };
function sceneSvg(a = lireAvatar(), B = lireBoutique()) {
  const M = article(B.mur) || article("m0"), S = article(B.sol) || article("s0"), o = B.obj.map(article).filter(Boolean), des = d => o.filter(x => x[5] === d).map(x => `<g data-obj="${x[0]}" transform="translate(${(B.pos[x[0]] || [0, 0]).join(" ")})">${OBJETS[x[0]]}</g>`).join("");
  const mur = M[5] === "brique" ? `<pattern id="pMur" width="36" height="20" patternUnits="userSpaceOnUse"><rect width="36" height="20" fill="${M[6]}"/><path d="M0 10h36M0 0h36M18 0v10M0 10v10M36 10v10" stroke="${M[7]}" stroke-width="2"/></pattern>`
    : M[5] === "beton" ? `<pattern id="pMur" width="90" height="70" patternUnits="userSpaceOnUse"><rect width="90" height="70" fill="${M[6]}"/><path d="M0 69h90M89 0v70" stroke="${M[7]}" stroke-width="1.500"/><circle cx="12" cy="12" r="2" fill="${M[7]}"/><circle cx="76" cy="12" r="2" fill="${M[7]}"/></pattern>`
    : M[5] === "neon" ? `<pattern id="pMur" width="360" height="205" patternUnits="userSpaceOnUse"><rect width="360" height="205" fill="${M[6]}"/><path d="M0 150h360M0 100h360" stroke="${M[7]}" stroke-width="3" opacity=".9" style="filter:drop-shadow(0 0 5px ${M[7]})"/><path d="M0 125h360" stroke="#22D3EE" stroke-width="2" opacity=".8"/></pattern>`
    : `<linearGradient id="pMur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M[6]}"/><stop offset="1" stop-color="${M[7]}"/></linearGradient>`;
  const sol = S[5] === "dalles" ? `<pattern id="pSol" width="60" height="48" patternUnits="userSpaceOnUse"><rect width="60" height="48" fill="${S[6]}"/><rect x="30" width="30" height="24" fill="${S[7]}"/><rect y="24" width="30" height="24" fill="${S[7]}"/></pattern>`
    : `<pattern id="pSol" width="80" height="24" patternUnits="userSpaceOnUse"><rect width="80" height="24" fill="${S[6]}"/><path d="M0 23h80M30 0v12M62 12v12" stroke="${S[7]}" stroke-width="2"/></pattern>`;
  return `<svg class="scene" viewBox="0 0 360 300" role="img" aria-label="${L("Ton personnage dans son home gym", "Your character in their home gym")}"><defs>${mur}${sol}</defs>
    <rect width="360" height="205" fill="url(#pMur)"/><rect y="205" width="360" height="95" fill="url(#pSol)"/><rect y="200" width="360" height="7" fill="#0F172A" opacity=".35"/>
    <g class="detoure">${des(0)}</g><ellipse cx="180" cy="270" rx="40" ry="7" fill="#000" opacity=".25"/><g class="detoure"><g transform="translate(114 18) scale(1.1)"><g class="perso">${persoSvg(a)}</g></g></g><g class="detoure">${des(1)}</g></svg>`;
}

/* --- Écran « Moi » : la scène, le solde, puis trois rayons (Apparence, Tenue, Home gym). Un appui essaie l'article, un second l'achète. --- */
let moiVue = "tenue", essai = "";
const FAMILLES = { tenue: [["tee", "Hauts", "Tops"], ["bas", "Bas", "Bottoms"], ["chaus", "Chaussures", "Shoes"], ["acc", "Accessoires", "Accessories"]], decor: [["mur", "Murs", "Walls"], ["sol", "Sols", "Floors"], ["obj", "Équipement et déco", "Equipment and decoration"]] };
const porte = (id, a = lireAvatar(), B = lireBoutique()) => { const f = article(id)[1]; return f === "acc" ? (a.acc || []).includes(id) : f === "obj" ? B.obj.includes(id) : f === "mur" || f === "sol" ? B[f] === id : (a[f] || { tee: "t0", bas: "b0", chaus: "c0" }[f]) === id; };
function mettre(id, a, B, forcer) {   // porte ou pose l'article (les accessoires et les objets se cumulent, un second appui les retire)
  const f = article(id)[1];
  if (f === "acc") a.acc = (a.acc || []).includes(id) ? (forcer ? a.acc : a.acc.filter(x => x !== id)) : [...(a.acc || []), id];
  else if (f === "obj") B.obj = B.obj.includes(id) ? (forcer ? B.obj : B.obj.filter(x => x !== id)) : [...B.obj, id];
  else if (f === "mur" || f === "sol") B[f] = id; else a[f] = id;
}
function ouvrirMoi() {
  const a = lireAvatar(), B = lireBoutique(), N = niveauXp(), pts = solde(B), aE = { ...a, acc: [...(a.acc || [])] }, bE = { ...B, obj: [...B.obj] }, p = lireProfil();
  if (essai) mettre(essai, aE, bE, true);
  const carte = x => { const [id, , fr, en, prix] = x, ok = possede(id, B), mis = porte(id, a, B), couleur = typeof x[5] === "string" && x[5][0] === "#" ? x[5] : x[6] && x[6][0] === "#" ? x[6] : "#EA580C";
    return `<button class="article${mis ? " mis" : ""}${essai === id ? " essai" : ""}" data-art="${id}"><i style="--c:${couleur}"></i><b>${L(fr, en)}</b><small>${mis ? "✓ " + L(/obj|mur|sol/.test(x[1]) ? "Installé" : "Porté", /obj|mur|sol/.test(x[1]) ? "Installed" : "Worn") : ok ? L("À toi", "Owned") : prix === "x" ? "🏆 " + L(...EXPLOITS[id]) : prix < 0 ? "🔒 " + L("Niveau", "Level") + " " + -prix : essai === id ? (pts >= prix ? L("Acheter", "Buy") + " · " + prix + " XP" : L("Il te manque", "You need") + " " + (prix - pts) + " XP") : "◆ " + prix + " XP"}</small>${BONUS[id] ? `<em>+${BONUS[id][0]} % XP · ${L(BONUS[id][2], BONUS[id][3])}</em>` : ""}</button>`; };
  const rond = (attr, l, sel) => l.map((c, i) => `<button class="pastille" data-${attr}="${i}" aria-pressed="${i === sel}" style="--c:${c}" aria-label="${attr} ${i + 1}"></button>`).join(""), choix = (attr, l, sel) => `<div class="stepper niv-choix moi-choix">${l.map(([f, e], i) => `<button class="toggle" data-${attr}="${i}" aria-pressed="${sel === i}">${L(f, e)}</button>`).join("")}</div>`;
  $("moiCorps").innerHTML = `<div class="moi-haut"><div class="moi-scene">${sceneSvg(aE, bE)}${essai ? `<span class="moi-essai">${L("Essayage", "Trying on")}</span>` : ""}</div>
      <div class="moi-infos"><div><b class="xp-rond">${N.n}</b><span><strong>${p.nom ? propre(p.nom) + " · " : ""}${N.nom}</strong>${barreXp(N)}<small>${N.dans} / ${N.pour} XP</small></span></div><p class="moi-solde">◆ <b>${pts}</b> XP ${L("à dépenser", "to spend")}</p></div>
      ${moiVue === "decor" && B.obj.length ? `<p class="sh-aide moi-glisse">✋ ${L("Fais glisser les objets pour les placer où tu veux.", "Drag the items to place them wherever you like.")} <button class="lien" data-raz="1">${L("Tout remettre en place", "Reset positions")}</button></p>` : ""}</div>
    <div class="chips moi-onglets">${[["apparence", "Apparence", "Looks"], ["tenue", "Tenue", "Outfit"], ["decor", "Home gym", "Home gym"]].map(([k, f, e]) => `<button class="toggle" data-vue="${k}" aria-pressed="${moiVue === k}">${L(f, e)}</button>`).join("")}</div>
    ${moiVue === "apparence" ? `<div class="carnet avatar-choix">${choix("ag", [["Garçon", "Boy"], ["Fille", "Girl"]], a.g === "f" ? 1 : 0)}<span class="champ-titre">${L("Peau", "Skin")}</span><div class="pastilles-choix">${rond("ap", PEAUX, a.peau)}</div><span class="champ-titre">${L("Couleur des cheveux", "Hair colour")}</span><div class="pastilles-choix">${rond("ac", CHEVEUX, a.chev)}</div>
        <span class="champ-titre">${L("Longueur", "Length")}</span>${choix("al", [["Courts", "Short"], ["Mi-longs", "Medium"], ["Longs", "Long"]], +a.lon || 0)}<span class="champ-titre">${L("Coiffure", "Hairstyle")}</span>${choix("ak", COUPES, +a.coupe || 0)}<span class="champ-titre">${L("Pose", "Pose")}</span>${choix("ao", NOMS_POSES.map(n => n.slice(1)), Math.max(0, NOMS_POSES.findIndex(n => n[0] === (a.pose || "auto"))))}<p class="sh-aide">${L("L’apparence est gratuite. L’expression du visage suit ta vitalité : entraîne-toi pour garder le sourire.", "Looks are free. The facial expression follows your vitality: train to keep the smile.")}</p></div>`
      : FAMILLES[moiVue].map(([f, fr, en]) => `<h2 class="sec">${L(fr, en)}</h2><div class="articles">${ARTICLES.filter(x => x[1] === f).map(carte).join("")}</div>`).join("") + `<p class="sh-aide">${L("Un appui pour essayer, un second pour acheter. Tes XP dépensés ne font jamais baisser ton niveau. 🔒 = récompense de niveau, 🏆 = exploit à réussir.", "Tap once to try, again to buy. Spending XP never lowers your level. 🔒 = level reward, 🏆 = feat to achieve.")}</p>`}
    <button class="toggle contour moi-partage" data-partage="1">📸 ${L("Partager mon personnage", "Share my character")}</button><div id="shAide"></div>`;
  if (ecranCourant !== "moi") ecran("moi");
}
$("moiCorps").addEventListener("click", ev => {
  const b = ev.target.closest("button"); if (!b) return; const d = b.dataset, a = lireAvatar(), B = lireBoutique(), y = scrollY, fin = () => { ouvrirMoi(); scrollTo(0, y); majVitalite(); };
  if (d.vue) { moiVue = d.vue; essai = ""; ouvrirMoi(); return; }
  if (d.partage) return partagerPerso();
  if (d.raz) { B.pos = {}; stocker("boutique", JSON.stringify(B)); return fin(); }
  const reg = [["ag", "g", v => +v ? "f" : "g"], ["ap", "peau", Number], ["ac", "chev", Number], ["al", "lon", Number], ["ak", "coupe", Number], ["ao", "pose", v => NOMS_POSES[v][0]]].find(([k]) => d[k] !== undefined);
  if (reg) { ecrireProfil("avatar", { ...a, [reg[1]]: reg[2](d[reg[0]]) }); return fin(); }
  if (!d.art) return; const id = d.art, x = article(id);
  if (possede(id, B)) { essai = ""; mettre(id, a, B); ecrireProfil("avatar", a); stocker("boutique", JSON.stringify(B)); return fin(); }
  if (essai !== id) { essai = id; return fin(); }   // premier appui : essayage
  if (!(x[4] > 0) || solde(B) < x[4]) return;   // récompense de palier : seulement à essayer tant que le niveau n'est pas atteint
  B.a.push(id); mettre(id, a, B, true); essai = ""; ecrireProfil("avatar", a); stocker("boutique", JSON.stringify(B));   // second appui : achat, et l'article est porté
  [659, 880, 1319].forEach((f, i) => bip(f, 160, .14, "triangle", i * .09)); vibrer([40, 40, 80]); fin();
});
/* Home gym : faire glisser un objet pour le déplacer (rayon Home gym seulement) ; le décalage est gardé dans boutique.pos */
{ let g = null, x0 = 0, y0 = 0, d0 = [0, 0], k = 1, bb = null;
  $("moiCorps").addEventListener("pointerdown", e => { const o = moiVue === "decor" && e.target.closest("[data-obj]"); if (!o) return;
    g = o; k = 360 / g.ownerSVGElement.getBoundingClientRect().width; x0 = e.clientX; y0 = e.clientY; d0 = lireBoutique().pos[g.dataset.obj] || [0, 0]; bb = g.getBBox(); g.setPointerCapture(e.pointerId); e.preventDefault(); });
  $("moiCorps").addEventListener("pointermove", e => { if (!g) return; const lim = (v, a, b) => Math.round(Math.min(b, Math.max(a, v)));
    g.dataset.d = [lim(d0[0] + (e.clientX - x0) * k, -bb.x, 360 - bb.x - bb.width), lim(d0[1] + (e.clientY - y0) * k, -bb.y, 300 - bb.y - bb.height)]; g.setAttribute("transform", `translate(${g.dataset.d.replace(",", " ")})`); });
  const lacher = () => { if (!g) return; if (g.dataset.d) { const B = lireBoutique(); B.pos[g.dataset.obj] = g.dataset.d.split(",").map(Number); stocker("boutique", JSON.stringify(B)); } g = null; };
  $("moiCorps").addEventListener("pointerup", lacher); $("moiCorps").addEventListener("pointercancel", lacher); }
/* Carte à partager : la pièce et le personnage dessinés sur une image 1080 × 1350, avec le niveau */
function partagerPerso() {
  const N = niveauXp(), p = lireProfil(), img = new Image();
  img.onload = () => { const { c, x, T1, T2 } = toileCarte(1350, [[0, "#EA580C"], [1, "#1C1210"]], []);
    x.drawImage(img, 40, 170, 1000, 833); x.font = `800 96px ${T1}`; x.fillText((p.nom ? p.nom + " · " : "") + L("NIVEAU", "LEVEL") + " " + N.n, 540, 1130); x.font = `600 52px ${T2}`; x.fillText(N.nom + " · " + N.xp + " XP", 540, 1205);
    c.toBlob(b => envoyer(b, "2work-personnage.jpg", "image/jpeg").then(r => { if (r === "telecharge" && $("shAide")) $("shAide").innerHTML = `<p class="sh-ok">${L("Image enregistrée dans tes téléchargements.", "Image saved to your downloads.")}</p>`; }), "image/jpeg", .92); };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sceneSvg().replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="900" `));
}
$("nMoi").onclick = () => { if (ecranCourant !== "moi") { essai = ""; ouvrirMoi(); } };
$("moiTitre").textContent = L("Moi", "Me"); $("nMoi").querySelector("span").textContent = L("Moi", "Me");
