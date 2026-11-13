/* ============ SPORTS : moteur commun des écrans de sport (modèle de la boxe) ============
   Chaque sport complet déclare sa configuration dans SP[sport] (js/boxe.js, js/foot.js…) : séances, onglets, profil et parcours.
   Le moteur fournit : matériel du jour, choix de l'exercice selon le matériel, construction des séances
   (mobilité → bloc principal → gainage → retour au calme) ajustée à 20 / 35 / 50 min, l'écran à onglets et la semaine du parcours.
   Configuration : { nom [FR, EN], sous [FR, EN], resume [FR, EN] (liste Sports), c couleur, cle (réglages), pre (historique),
   def (réglages par défaut), mat (clés de MAT_X), S (séances), mob, calme, core (éléments), mobTxt [FR, EN], onglets [[clé, FR, EN, rendu(h), sans réglages]] } */
const MAT_X = { gants: ["Gants et sac", "Gloves and bag"], corde: ["Corde à sauter", "Jump rope"], elastique: ["Élastique", "Resistance band"], medecine: ["Médecine-ball", "Medicine ball"],
  kb: ["Kettlebell ou haltères", "Kettlebell or dumbbells"], barre: ["Barre et disques", "Barbell and plates"], box: ["Box ou banc solide", "Box or sturdy bench"], traction: ["Barre de traction ou sangles", "Pull-up bar or straps"],
  ballon: ["Ballon", "Ball"], mur: ["Un mur", "A wall"], plots: ["Plots ou bouteilles", "Cones or bottles"], partenaire: ["Un partenaire", "A partner"] };
// matériel demandé par un exercice (plusieurs clés séparées par une espace = tout est nécessaire)
const MAT_EX = { kbSwing: "kb", goblet: "kb", dbRow: "kb", bulgare: "kb", stepUp: "box", souleveTerre: "barre", squatBarre: "barre", rafaleSac: "gants", lancerMedecine: "medecine",
  rotElastique: "elastique", bandRow: "elastique", bandPullApart: "elastique", tractions: "traction", tractionBloquee: "traction", traineau: "barre", bandWalk: "elastique", hipThrust: "box" };
const SP = {};
/* Nouveaux exercices : [id, durée, matériel, mat FR, EN, nom FR, EN, muscles FR, EN, description FR, EN, pose (objet POSES ou id emprunté), consigne FR, EN] */
function exosSp(liste) {
  const EN = LANGUE === "en";
  liste.forEach(([id, duree, m, matFr, matEn, nomFr, nomEn, musFr, musEn, descFr, descEn, pose, vFr, vEn]) => {
    const mat = EN ? matEn : matFr;
    EXERCICES[id] = { nom: EN ? nomEn : nomFr, nomFr, duree, video: VIDEOS.includes(id) ? `videos/${id}.mp4` : null, description: EN ? descEn : descFr, muscles: (EN ? musEn : musFr) + (mat ? " · " + mat : ""), mat: !!mat };
    if (m) { MAT_EX[id] = m; MATOS.push(id); }
    VOIX_SALLE[id] = nomEn; POSES[id] = typeof pose === "string" ? POSES[pose] : pose;
    if (typeof CONSIGNES !== "undefined") CONSIGNES[id] = [vFr, vEn];
  });
}
const spPref = sp => ({ dur: 35, mat: [], n: 3, jours: [], debut: jourCle(), ...SP[sp].def, ...lireJSON(SP[sp].cle, {}) });
const spGarder = (sp, p) => stocker(SP[sp].cle, JSON.stringify(p));
const spChoix = (slot, mat) => [].concat(slot).find(id => EXERCICES[id] && (MAT_EX[id] || "").split(" ").every(m => !m || mat.includes(m))) || null;
const RPE_SP = (a, b) => L(`Effort ${a}/10 · `, `Effort ${a}/10 · `) + b;
const allSp = (sp, a) => "c_" + supportDe(sp)[0] + a;   // effort cardio sur le support choisi : 0 facile, 1 soutenu, 2 à fond
const lundi = (d = new Date()) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
const plusJ = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const JOURS_SP = [["Lun", "Mon"], ["Mar", "Tue"], ["Mer", "Wed"], ["Jeu", "Thu"], ["Ven", "Fri"], ["Sam", "Sat"], ["Dim", "Sun"]];
const ficheSp = (sp, i) => { const [ico, fr, en, tf, te] = SP[sp].savoir[i]; return `<details class="prog-info" style="--c:${SP[sp].c}"><summary>${ico} ${L(fr, en)}</summary><p>${L(tf, te)}</p></details>`; };
const derTest = id => { const l = lireTests().filter(x => x.id === id); return l.length ? l[l.length - 1].v : "—"; };

/* --- Construction d'une séance. Bloc = [nom FR, EN, texte FR, EN, tours, récup entre tours (s), éléments, repos de fin], élément = [exercice ou alternatives, durée (s), repos (s), consigne, résumé, étiquette].
   Drapeaux d'une séance : cardio (échauffement et retour au calme cardio), fixe (durée propre), sansMob, sansEch, calme (étirements malgré fixe), core (gainage final dès 35 min). */
function spPlan(sp, code, k, x) {
  const G = SP[sp], S = G.S[code], plan = [], blocs = [], D = S.fixe ? 35 : x.dur, n = (a, b, c) => ({ 20: a, 35: b, 50: c })[D], al = a => allSp(sp, a);
  const tout = [...(S.cardio || S.sansMob ? [] : [["Mobilité", "Mobility", L(...G.mobTxt), "", 1, 0, G.mob.slice(0, n(3, 5, 6)).map(id => [id, 40, 5, "", "40 s"])]]),
    ...(S.cardio && !S.sansEch ? [["Échauffement", "Warm-up", L("4 minutes progressives, deux accélérations.", "4 progressive minutes, two accelerations."), "", 1, 0, [[al(0), 120, 0, RPE_SP(3, ""), "2 min"], [al(1), 60, 0, RPE_SP(6, ""), "1 min"], [al(0), 20, 0, "", "20 s"], [al(2), 10, 0, RPE_SP(9, ""), "10 s"], [al(0), 20, 0, "", "20 s"], [al(2), 10, 60, RPE_SP(9, ""), "10 s"]]]] : []),
    ...S.f(k, x), ...(S.core && D >= 35 && !x.court ? [[G.coreNom[0], G.coreNom[1], L("Court et contrôlé.", "Short and controlled."), "", n(1, 1, 2), 20, G.core]] : []),
    ...(S.cardio && !S.sansEch ? [["Retour au calme", "Cool-down", L("Trois minutes très faciles.", "Three very easy minutes."), "", 1, 0, [[al(0), 180, 0, RPE_SP(2, ""), "3 min"]]]] : []),
    ...(S.cardio || S.fixe && !S.calme ? [] : [["Retour au calme", "Cool-down", L("Étirements doux, respiration lente.", "Gentle stretches, slow breathing."), "", 1, 0, G.calme.slice(0, n(2, 3, 4)).map(id => [id, 40, 5, "", "40 s"])]])];
  tout.forEach(([nF, nE, dF, dE, tours, rT, items, fin]) => {
    const nb = L(nF, nE), l = items.map(([s, d, r, p, a, lab]) => [spChoix(s, x.mat), d, r, p, a, lab]).filter(i => i[0]);
    if (!l.length) return;
    for (let t = 1; t <= tours; t++) l.forEach(([id, d, r, p, , lab], i) => plan.push({ id, d, r: i < l.length - 1 ? r : t < tours ? rT : fin ?? 30, bn: nb, t, tt: tours, ft: i === l.length - 1 && t < tours,
      lab: lab ? nb + " · " + lab : nb + (tours > 1 ? L(" · tour ", " · round ") + t + "/" + tours : "") + (l.length > 1 ? " · " + (i + 1) + "/" + l.length : ""), presc: p || undefined }));
    blocs.push([nb, l.map(([id, d, , , a]) => [id, (tours > 1 ? tours + " × " : "") + (a || duTxt(d))]), L(dF, dE || dF)]);
  });
  plan[plan.length - 1].r = 0;
  return { plan, blocs, total: Math.round(plan.reduce((s, q) => s + q.d + q.r, 0) / 60) };
}
function spSeance(sp, code, o = {}) {
  const G = SP[sp], P = spPref(sp), S = G.S[code], mat = o.mat || P.mat, x = { mat, dur: o.dur || P.dur, niv: P.niv, P, sac: mat.includes("gants"), court: o.f < 1, f: o.f || 1 }, cible = Math.round(x.dur * (o.f || 1));
  let s = spPlan(sp, code, 1, x);
  for (let k = 2; k <= S.max && !S.fixe && S.max > 1; k++) { const t = spPlan(sp, code, k, x); if (t.total > cible + 2) break; s = t; }
  const zr = zoneRouge(), sup = supportDe(sp), dur = S.fixe ? "" : " · " + L("format ", "format ") + x.dur + " min";
  const html = `<li class="etude prog-carte-jour" style="--accent:${S.c}"><div><small><b>${L(...S.t)}${dur}${o.f < 1 ? " · " + L("volume allégé", "reduced volume") : ""}</b></small><small>🎯 ${L(...S.d)}</small>
    <small>💬 ${L("Effort visé", "Target effort")} ${S.rpe}/10 ${L("(0 repos · 5 modéré · 8 très dur · 10 maximum)", "(0 rest · 5 moderate · 8 very hard · 10 max)")}${zr && /8|9|10/.test(S.rpe) && S.cardio ? L(` · zone rouge : ${zr} bpm et plus sur les efforts durs`, ` · red zone: ${zr} bpm and above on hard efforts`) : ""}</small>
    ${S.cardio ? `<small>📍 ${L("Support", "Support")} : ${L(sup[1], sup[2])} · ${L(sup[5], sup[6])}</small>${/course|tapis|cote/.test(sup[0]) && alluresVma() ? `<small>🏃 ${alluresVma()}</small>` : ""}` : `<small>🧰 ${mat.length ? L("Matériel du jour : ", "Today’s equipment: ") + mat.filter(k => G.mat.includes(k)).map(k => L(...MAT_X[k])).join(", ") : L(`Version sans matériel (coche ton matériel dans ${G.nom[0]} pour l’utiliser)`, `No-equipment version (tick your equipment in ${G.nom[1]} to use it)`)}</small>`}</div></li>` + s.blocs.map(blocHtml).join("");
  return { type: "seance", cat: sp, sp: code, fixe: true, couleur: S.c, plan: s.plan, exercices: s.plan.map(q => q.id), listeHtml: html, rpe: S.rpe, total: s.total, titre: L(...S.t), titreFr: S.t[0], detail: "" };
}
const spOnglet = {}, spRetour = {};
function lancerSp(sp, code, f) {
  const k = SP[sp].pre + code; ROUTINES[k] = { ...spSeance(sp, code, { f }), retour: () => ouvrirSport(sp) }; CONSEILLES[k] = ROUTINES[k].exercices; ouvrirRoutine(k);
}

/* --- L'écran d'un sport : onglets, durée, matériel du jour, puis le contenu de l'onglet --- */
function ouvrirSport(sp, onglet, rv) {
  const G = SP[sp]; onglet = onglet || spOnglet[sp] || G.onglets[0][0]; spOnglet[sp] = onglet; if (rv) spRetour[sp] = rv;
  if (!lireJSON(G.cle, {}).debut) spGarder(sp, spPref(sp));   // le parcours démarre à la première ouverture
  const P = spPref(sp), O = G.onglets.find(o => o[0] === onglet) || G.onglets[0];
  outil(L(...G.nom), L(...G.sous),
    `<div class="chips bx-onglets">${G.onglets.map(([k, f, e]) => `<button class="toggle" data-bxo="${k}" aria-pressed="${k === O[0]}">${L(f, e)}</button>`).join("")}</div>
     ${O[4] ? "" : `<div class="carnet bx-regl"><span class="champ-titre">${L("Durée de la séance", "Session length")}</span>${chips("bxd", [[20, "20 min", "20 min"], [35, "35 min", "35 min"], [50, "50 min", "50 min"]], P.dur)}
       <span class="champ-titre">${L("Ton matériel aujourd’hui", "Your equipment today")}</span><div class="chips">${G.mat.map(k => `<button class="toggle" data-bxm="${k}" aria-pressed="${P.mat.includes(k)}">${L(...MAT_X[k])}</button>`).join("")}</div>
       <p class="sh-aide">${L("Rien de coché = version sans matériel. Les séances choisissent l’exercice adapté à ce que tu as.", "Nothing ticked = no-equipment version. Sessions pick the exercise that fits what you have.")}</p></div>`}<div id="bxC"></div>`, () => (spRetour[sp] || vueSCats)());
  $("oCorps").querySelectorAll("[data-bxo]").forEach(b => b.onclick = () => { const y = scrollY; ouvrirSport(sp, b.dataset.bxo); scrollTo(0, Math.min(y, 120)); });
  brancherChips("bxd", v => { spGarder(sp, { ...spPref(sp), dur: +v }); rendu(); });
  $("oCorps").querySelectorAll("[data-bxm]").forEach(b => b.onclick = () => { const p = spPref(sp), k = b.dataset.bxm; p.mat = p.mat.includes(k) ? p.mat.filter(x => x !== k) : [...p.mat, k]; b.setAttribute("aria-pressed", p.mat.includes(k)); spGarder(sp, p); rendu(); });
  const C = () => $("bxC");
  const h = { sp, P, C, titre: t => C().insertAdjacentHTML("beforeend", `<h2 class="sec">${t}</h2>`), html: t => C().insertAdjacentHTML("beforeend", t), fiche: i => C().insertAdjacentHTML("beforeend", ficheSp(sp, i)),
    carte: (code, f) => { const s = spSeance(sp, code, { f }), S = G.S[code]; bouton(C(), `${L(...S.t)} · ${s.total} min`, L(...S.d), S.c, () => lancerSp(sp, code, f)); },
    cartes: l => l.forEach(c => h.carte(c)), ouvrir: o => ouvrirSport(sp, o), rendu: () => rendu(),
    gestes: (l, avert) => { C().insertAdjacentHTML("beforeend", `<ul class="list carnet bx-gestes">${l.filter(id => EXERCICES[id]).map(id => `<li class="bloc-ex" data-bxex="${id}">${vignette(id)}<div><b>${EXERCICES[id].nom}</b><small>${EXERCICES[id].muscles}</small></div><span class="duree">›</span></li>`).join("")}</ul>${avert ? `<p class="prog-avert">${avert}</p>` : ""}`);
      C().querySelectorAll("[data-bxex]").forEach(li => li.onclick = () => ficheExercice(li.dataset.bxex)); },
    renfo: () => { const nv = lireNiv(); h.titre(L(`Renfo ${G.nom[0].toLowerCase()} · circuit en 4 blocs`, `${G.nom[1]} strength · 4-block circuit`));   // le renfo par sport, fusionné dans l'onglet Force
      h.html(`<div class="stepper niv-choix">${NIV_RENFO.map(n => `<button class="toggle" data-bxr="${n[0]}" aria-pressed="${n[0] === nv}">${L(n[1], n[2])}</button>`).join("")}</div><p class="niv-txt">${L(...NIV_RENFO.find(n => n[0] === nv).slice(9))}</p>`);
      C().querySelectorAll("[data-bxr]").forEach(b => b.onclick = () => { stocker("niveauRenfo", b.dataset.bxr); rendu(); });
      [[0, "Poids du corps", "Bodyweight", "Sans matériel, partout", "No equipment, anywhere"], [1, "Avec matériel", "With equipment", "Kettlebell, haltères, élastique…", "Kettlebell, dumbbells, band…"]].forEach(([m, f, e, df, de]) => { const s = seanceRenfo(sp, m, nv);
        bouton(C(), `${L(f, e)} · ${s.total} min`, L(df, de) + " · " + L("échauffement, circuit, prévention, retour au calme", "warm-up, circuit, prevention, cool-down"), G.c, () => { ROUTINES.renfo = { ...seanceRenfo(sp, m, lireNiv()), retour: () => ouvrirSport(sp, "force") }; CONSEILLES.renfo = ROUTINES.renfo.exercices; ouvrirRoutine("renfo"); }); });
      const k0 = SEANCE(sp); h.titre(L("Personnaliser", "Customise"));
      [["", "au poids du corps", "bodyweight"], ["Mat", "avec matériel", "with equipment"]].forEach(([s, f, e]) => ROUTINES[k0 + s] && bouton(C(), L("Version libre · ", "Free version · ") + L(f, e), L(`${ROUTINES[k0 + s].exercices.length} exercices à modifier, à enregistrer dans tes séances`, `${ROUTINES[k0 + s].exercices.length} exercises to edit and save to your workouts`), G.c, () => ouvrirRoutine(k0 + s))); },
    cardio: (codes, fiche) => { const S = supportDe(sp);
      h.html(`<div class="carnet"><span class="champ-titre">${L("Où fais-tu ton cardio ?", "Where do you do your cardio?")}</span>${chips("bxs", SUPPORTS.filter(x => pourSport(x[7], sp)).map(x => [x[0], x[1], x[2]]), S[0])}</div>`);
      h.titre(L("Séances de cardio", "Cardio sessions")); h.cartes(codes);
      bouton(C(), L("Toutes les séances de cardio", "All cardio sessions"), L("Pyramide, sprints, intermittent… avec les niveaux", "Pyramid, sprints, intermittent… with levels"), "#64748B", () => ouvrirCardio(sp));
      if (fiche !== undefined) h.fiche(fiche); brancherChips("bxs", s => { stocker("cardioSupport", JSON.stringify({ ...cardioPref(), s })); rendu(); }); },
    savoir: () => h.html(G.savoir.map((_, i) => ficheSp(sp, i)).join("")) };
  const rendu = () => { C().innerHTML = ""; h.P = spPref(sp); O[3](h); };
  rendu();
}

/* --- Semaine d'un parcours : S = { L0 lundi, f volume, jours: [{ d, club, l: [codes] }] }. Codes spéciaux : lib(c) donne leur nom, cle(c) la séance à lancer (null = rien) --- */
function semaineSp(h, S, lib, cle, fOf = () => S.f < 1 ? S.f : undefined) {
  const G = SP[h.sp], auj = (new Date().getDay() + 6) % 7, a = jourCle(S.L0), b = jourCle(plusJ(S.L0, 6)), deja = {}, aFaire = S.jours[auj].l.filter(c => cle(c));
  h.html(`${aFaire.length ? `<h2 class="sec">${L("Aujourd’hui", "Today")}</h2><div id="bxAuj"></div>` : ""}
    <h2 class="sec">${L("Ta semaine", "Your week")}</h2><ul class="carnet bx-sem">${S.jours.map((j, d) => `<li class="${d === auj ? "auj" : ""}"><b>${L(...JOURS_SP[d])} ${j.d.getDate()}</b><span>${j.club ? `<i class="bx-club">${L(...(j.clubNom || ["Club", "Club"]))}</i>` : ""}${j.l.map(c => {
      const n = (deja[c] = (deja[c] || 0) + 1), k = cle(c), ok = !!k && G.S[c] && lireHist().filter(x => x.k === G.pre + c && x.j >= a && x.j <= b).length >= n;
      return `<button class="toggle bx-s" aria-pressed="${ok}" data-bxl="${k || ""}"${k ? "" : " disabled"}>${ok ? "✓ " : ""}${lib(c)}</button>`; }).join("") || (j.club ? "" : `<small>${L("Libre", "Free")}</small>`)}</span></li>`).join("")}</ul>`);
  aFaire.forEach(c => { const k = cle(c); h.carte(k, fOf(k)); h.C().querySelector("#bxAuj").appendChild(h.C().lastChild); });
  h.C().querySelectorAll("[data-bxl]").forEach(x => x.dataset.bxl && (x.onclick = () => lancerSp(h.sp, x.dataset.bxl, fOf(x.dataset.bxl))));
}
/* placement des séances d'une semaine : les dures évitent les jours de club, leur veille et deux jours d'affilée ; lim = premier jour interdit */
function placerSp(liste, jours, club, dur, lim = 7) {
  [...liste.filter(dur), ...liste.filter(c => !dur(c))].forEach(c => {
    let best = -1, sc = 1e9;
    for (let d = 0; d < lim; d++) {
      if (jours[d].length) continue;
      const voisinDur = [d - 1, d + 1].some(v => v >= 0 && v < 7 && jours[v].some(dur)), voisin = [d - 1, d + 1].some(v => v >= 0 && v < 7 && jours[v].length);
      const s = (club(d) ? (dur(c) ? 6 : 2) : 0) + (dur(c) && club(d + 1) ? 4 : 0) + (dur(c) && voisinDur ? 3 : 0) + (voisin ? 1 : 0) + d * .01;
      if (s < sc) { sc = s; best = d; }
    }
    if (best >= 0) jours[best].push(c);
  });
}
// réglages du profil : chips à choix unique, jours (plusieurs), date ; maj(p) enregistre et redessine
const choixJours = (attr, l) => `<div class="chips">${JOURS_SP.map(([f, e], d) => `<button class="toggle" data-${attr}="${d}" aria-pressed="${l.includes(d)}">${L(f, e)}</button>`).join("")}</div>`;
const brancherJours = (h, attr, champ, maj) => h.C().querySelectorAll(`[data-${attr}]`).forEach(x => x.onclick = () => { const p = spPref(h.sp), d = +x.dataset[attr]; p[champ] = p[champ].includes(d) ? p[champ].filter(y => y !== d) : [...p[champ], d]; maj(p); });

/* --- Sports d'équipe : en saison, la semaine se construit autour du jour de match ; sans match ou pendant la trêve, bloc de reprise de 6 semaines.
   SP[sport].equipe = { saison(P) → [[séance, jours possibles par rapport au match]] par priorité, reprise [[nom FR, EN, texte FR, EN, séances]] (3 étapes de 2 semaines),
   dur (séances dures), map(P, c) (séance adaptée au poste), ico, ech (échauffement d'avant-match), fiche(saison), profil [FR, EN], poste [[clé, FR, EN]] facultatif, txtSaison [FR, EN] } */
function semaineEquipe(E, P) {
  const L0 = lundi(), jours = Array.from({ length: 7 }, () => []), club = d => P.jours.includes(((d % 7) + 7) % 7), dur = c => E.dur.includes(c), fin = (o) => ({ L0, f: 1, ...o, jours: jours.map((l, d) => ({ d: plusJ(L0, d), club: club(d), clubNom: ["Entraînement", "Training"], l })) });
  if (P.match >= 0 && !P.treve) {
    const M = P.match, pris = new Set(); jours[M].push("match");
    E.saison(P).slice(0, P.n).forEach(([c, offs]) => { const libres = offs.map(o => (M + o + 7) % 7).filter(d => d !== M && !jours[d].length && !pris.has(d)), d = libres.find(d => !club(d) || !dur(c)) ?? libres[0];
      if (d !== undefined) { jours[d].push(c); pris.add(d); } });
    return fin({ saison: 1, info: L("En saison · semaine construite autour du match", "In season · week built around the match") });
  }
  const w = Math.max(0, Math.floor((L0 - lundi(new Date(P.debut + "T12:00"))) / 6048e5)), b = Math.min(2, Math.floor(w / 2)), R = E.reprise[b];
  placerSp(R[4].slice(0, P.n).map(c => E.map ? E.map(P, c) : c), jours, club, dur);
  return fin({ bloc: b, R, info: (w < 6 ? L(`Reprise · semaine ${w + 1}/6`, `Pre-season · week ${w + 1}/6`) : L("Reprise terminée : indique ton jour de match", "Pre-season done: set your match day")) + " · " + L(R[0], R[1]) });
}
function parcoursEquipe(h) {
  const G = SP[h.sp], E = G.equipe, P = h.P, S = semaineEquipe(E, P);
  h.html(`<div class="etude ech-fiche" style="--accent:${G.c}"><b>${S.info}</b><p>${S.saison ? L(...E.txtSaison) : L(S.R[2], S.R[3])}</p></div>${E.fiche(S.saison)}`);
  semaineSp(h, S, c => c === "match" ? E.ico + " " + L("Match · échauffement d’avant-match", "Match · pre-match warm-up") : L(...G.S[c].t), c => c === "match" ? null : c);
  h.C().querySelectorAll(".bx-s[disabled]").forEach(b => { b.disabled = false; b.onclick = () => vueEch(E.ech); });
  h.html(`<h2 class="sec">${L(...E.profil)}</h2><div class="carnet bx-prof">
    <span class="champ-titre">${L("Je suis", "I am")}</span>${chips("eqn", [["debutant", "Débutant", "Beginner"], ["club", "Joueur en club", "Club player"], ["compet", "Compétition", "Competitive"]], P.niv)}
    ${E.poste ? `<span class="champ-titre">${L("Mon poste", "My position")}</span>${chips("eqp", E.poste, P.poste)}` : ""}
    <span class="champ-titre">${L("Jour de match", "Match day")}</span><div class="chips">${[[-1, "Aucun", "None"], ...JOURS_SP.map(([f, e], d) => [d, f, e])].map(([d, f, e]) => `<button class="toggle" data-eqm="${d}" aria-pressed="${P.match === d}">${L(f, e)}</button>`).join("")}</div>
    <span class="champ-titre">${L("Mes jours d’entraînement au club", "My club training days")}</span>${choixJours("eqj", P.jours)}
    <span class="champ-titre">${L("Séances de préparation par semaine", "Prep sessions per week")}</span>${chips("eqk", [1, 2, 3, 4, 5].map(n => [n, n, n]), P.n)}
    <button class="toggle" id="eqTreve" aria-pressed="${!!P.treve}">${P.treve ? "✓ " : ""}${L("Trêve ou pré-saison : bloc de reprise de 6 semaines", "Break or pre-season: 6-week build-up block")}</button>
    <p class="sh-aide">${L("Avec un jour de match, la semaine se construit autour de lui. Sans match (ou trêve cochée), l’appli te propose le bloc de reprise, qui commence cette semaine.", "With a match day, the week is built around it. Without a match (or break ticked), the app offers the build-up block, starting this week.")}</p></div>`);
  const sp = h.sp, maj = p => { spGarder(sp, p); h.rendu(); };
  brancherChips("eqn", v => maj({ ...spPref(sp), niv: v })); if (E.poste) brancherChips("eqp", v => maj({ ...spPref(sp), poste: v }));
  brancherChips("eqk", v => maj({ ...spPref(sp), n: +v })); brancherJours(h, "eqj", "jours", maj);
  h.C().querySelectorAll("[data-eqm]").forEach(b => b.onclick = () => maj({ ...spPref(sp), match: +b.dataset.eqm }));
  $("eqTreve").onclick = () => { const p = spPref(sp); maj({ ...p, treve: !p.treve, debut: jourCle() }); };
}

// séances communes aux sports d'équipe : sprints répétés, intermittent 15/15, endurance de base, récupération active
const seancesEquipe = (sp, mob) => ({
  rsa: { c: "#16A34A", t: ["Sprints répétés", "Repeated sprints"], rpe: "9", max: 4, cardio: 1, d: ["Des sprints de 6 s avec 24 s de récupération, par séries de 6 : répéter les efforts jusqu’à la fin du match.", "6-second sprints with 24 s recovery, in sets of 6: repeat efforts until the final whistle."],
    f: k => Array.from({ length: k }, (_, s) => [`Série ${s + 1}/${k}`, `Set ${s + 1}/${k}`, L("6 sprints de 6 s, 24 s de récupération, 3 min entre les séries.", "6 sprints of 6 s, 24 s recovery, 3 min between sets."), "", 6, 24, [[allSp(sp, 2), 6, 24, RPE_SP(9, L("avec un demi-tour si tu as la place", "with a turn if you have room")), "6 s"]], 180]) },
  intermittent: { c: "#7C3AED", t: ["Intermittent 15/15", "15/15 intermittent"], rpe: "8", max: 4, cardio: 1, d: ["15 s vite, 15 s lentement, sans s’arrêter : le rythme haché du match, beaucoup de souffle gagné en peu de temps.", "15 s fast, 15 s slow, without stopping: the stop-start rhythm of a match, lots of fitness in little time."],
    f: k => Array.from({ length: k }, (_, s) => [`Bloc ${s + 1}/${k}`, `Block ${s + 1}/${k}`, L("8 min d’intermittent, 3 min de récupération entre les blocs.", "8 min of intermittent running, 3 min recovery between blocks."), "", 16, 0, [[allSp(sp, 1), 15, 0, RPE_SP(8, L("vite", "fast")), "15 s"], [allSp(sp, 0), 15, 0, L("lent, sans s’arrêter", "slow, keep moving"), "15 s"]], 180]) },
  base: { c: "#0EA5E9", t: ["Endurance de base", "Base endurance"], rpe: "6", max: 6, cardio: 1, d: ["Des blocs de course à allure confortable : la base de la reprise, sans se mettre dans le rouge.", "Running blocks at a comfortable pace: the foundation of pre-season, without going into the red."],
    f: k => [["Blocs de course", "Running blocks", "Tu dois pouvoir parler en courant.", "You should be able to talk as you run.", k, 60, [[allSp(sp, 1), 300, 60, RPE_SP(6, L("confortable", "comfortable")), "5 min"]]]] },
  recup: { c: "#14B8A6", t: ["Récupération active", "Active recovery"], rpe: "3", max: 1, cardio: 1, sansEch: 1, d: ["Le lendemain du match : effort très facile puis mobilité, pour faire circuler le sang et récupérer plus vite.", "The day after the match: very easy effort then mobility, to get the blood flowing and recover faster."],
    f: (k, x) => [["Cardio très facile", "Very easy cardio", "Tu peux parler sans effort.", "You can talk easily.", 1, 0, [[allSp(sp, 0), { 20: 600, 35: 1080, 50: 1500 }[x.dur], 30, RPE_SP(3, L("très facile", "very easy")), ""]]],
      ["Circuit de mobilité", "Mobility circuit", "Lent, sans douleur, en respirant.", "Slow, pain-free, breathing.", 1, 0, mob.slice(0, { 20: 4, 35: 6, 50: 8 }[x.dur]).map(id => [id, 45, 10, "", "45 s"])]] },
});

/* --- Sports à objectif daté (cyclisme, natation, ski…) : 3 blocs de 4 semaines à rebours de la date, affûtage, séance J-2, repos J-1 ; sans date, blocs en boucle avec une semaine allégée.
   SP[sport].objectif = { objs [[clé, FR, EN]], debut { obj, sem (semaines), txt [FR, EN, texte FR, EN] } facultatif, blocs [[nom FR, EN, texte FR, EN]] × 3, sem(P, bloc, semaine) → séances par priorité,
   dur (séances dures), longue (séance du week-end), taper(P) → semaines d'affûtage, jour [ico, FR, EN] (jour J), ech, profil [FR, EN], fiche(P, S), date [FR, EN] (libellé de la date) } */
function semaineObjectif(E, P) {
  const L0 = lundi(), jours = Array.from({ length: 7 }, () => []), club = d => P.jours.includes(((d % 7) + 7) % 7), dur = c => E.dur.includes(c), w0 = Math.max(0, Math.floor((L0 - lundi(new Date(P.debut + "T12:00"))) / 6048e5));
  const cse = P.date ? new Date(P.date + "T12:00") : null, D = E.debut; let bloc = 1, f = 1, info, fixes = {}, liste;
  if (D && P.obj === D.obj) { bloc = 0; liste = E.sem(P, 0, Math.min(D.sem - 1, w0)); info = w0 < D.sem ? L(`${D.txt[0]} · semaine ${w0 + 1}/${D.sem}`, `${D.txt[1]} · week ${w0 + 1}/${D.sem}`) : L("Bases terminées : choisis un objectif", "Basics done: pick a goal"); }
  else {
    if (cse && cse >= L0) { const W = Math.floor((lundi(cse) - L0) / 6048e5), T = E.taper(P); bloc = W >= 8 ? 1 : W >= 4 ? 2 : 3; f = W < T ? (W ? .75 : .55) : 1;
      info = W ? L(`Objectif dans ${W} semaine${W > 1 ? "s" : ""}`, `Goal in ${W} week${W > 1 ? "s" : ""}`) + (f < 1 ? L(" · affûtage", " · taper") : "") : L("Semaine de l’objectif : affûtage", "Goal week: taper");
      if (!W) { const j = (cse.getDay() + 6) % 7; fixes[j] = "jourJ"; if (j >= 1) fixes[j - 1] = "repos"; if (j >= 2) fixes[j - 2] = "affutage"; } }
    else { bloc = Math.floor(w0 / 4) % 3 + 1; if (w0 % 4 === 3) f = .7; info = L(`Semaine ${w0 % 4 + 1}/4`, `Week ${w0 % 4 + 1}/4`) + (f < 1 ? L(" · semaine allégée", " · lighter week") : ""); }
    liste = E.sem(P, bloc, w0 % 4);
  }
  liste = liste.slice(0, P.n); Object.entries(fixes).forEach(([j, c]) => jours[j].push(c));
  const nf = Object.keys(fixes).length, lim = nf ? Math.min(...Object.keys(fixes).map(Number)) : 7;
  if (nf) liste = liste.filter(c => c !== E.longue).slice(0, Math.min(3, P.n - 1));
  if (liste.includes(E.longue)) { const d = [6, 5, 4].find(d => !jours[d].length && !club(d)) ?? 6; jours[d].push(E.longue); liste = liste.filter(c => c !== E.longue); }
  placerSp(liste, jours, club, dur, lim);
  return { L0, bloc, f, info, jours: jours.map((l, d) => ({ d: plusJ(L0, d), club: club(d), l })) };
}
function parcoursObjectif(h) {
  const G = SP[h.sp], E = G.objectif, P = h.P, S = semaineObjectif(E, P), B = S.bloc ? E.blocs[S.bloc - 1] : E.debut.txt.slice(0, 2).concat(E.debut.txt.slice(2)), sp = h.sp;
  h.html(`<div class="etude ech-fiche" style="--accent:${G.c}"><b>${S.bloc ? L(B[0], B[1]) + " · " : ""}${S.info}</b><p>${L(B[2], B[3])}</p></div>${E.fiche(P, S)}`);
  semaineSp(h, S, c => c === "jourJ" ? E.jour[0] + " " + L(E.jour[1], E.jour[2]) : c === "repos" ? L("Repos ou très facile", "Rest or very easy") : L(...G.S[c].t), c => ["jourJ", "repos"].includes(c) ? null : c, k => k === "affutage" || S.f >= 1 ? undefined : S.f);
  h.C().querySelectorAll(".bx-s[disabled]").forEach(b => b.textContent.startsWith(E.jour[0]) && (b.disabled = false, b.onclick = () => vueEch(E.ech)));
  h.html(`<h2 class="sec">${L(...E.profil)}</h2><div class="carnet bx-prof">
    <span class="champ-titre">${L("Mon objectif", "My goal")}</span>${chips("obo", E.objs, P.obj)}
    <span class="champ-titre">${L("Séances par semaine", "Sessions per week")}</span>${chips("obk", [2, 3, 4, 5, 6].map(n => [n, n, n]), P.n)}
    <span class="champ-titre">${L("Mes jours de club ou d’entraînement collectif (facultatif)", "My club or group training days (optional)")}</span>${choixJours("obj", P.jours)}
    ${E.debut && P.obj === E.debut.obj ? "" : `<span class="champ-titre">${L(...E.date)}</span><div class="favForm"><input class="choixVoix" type="date" id="obDate" value="${P.date}" min="${jourCle()}"><button class="toggle" id="obDateX">${L("Effacer", "Clear")}</button></div>`}
    <p class="sh-aide">${L("Avec une date, les 3 blocs sont placés à rebours et la fin est allégée (affûtage). La séance longue se place le week-end, les séances dures ne se suivent pas.", "With a date, the 3 blocks are counted back and the end is lighter (taper). The long session goes on the weekend, hard sessions are never back to back.")}</p>
    <button class="toggle" id="obRaz">${L("Recommencer le parcours à cette semaine", "Restart the plan from this week")}</button></div>`);
  const maj = p => { spGarder(sp, p); h.rendu(); };
  brancherChips("obo", v => maj({ ...spPref(sp), obj: v, debut: jourCle() })); brancherChips("obk", v => maj({ ...spPref(sp), n: +v })); brancherJours(h, "obj", "jours", maj);
  if ($("obDate")) { $("obDate").onchange = e => maj({ ...spPref(sp), date: e.target.value }); $("obDateX").onclick = () => maj({ ...spPref(sp), date: "" }); }
  $("obRaz").onclick = () => maj({ ...spPref(sp), debut: jourCle() });
}

/* --- Sports → un sport complet ouvre son écran ; les autres gardent leur page --- */
const vueModeAvantSp = vueMode;
vueMode = grp => SP[grp] ? (spRetour[grp] = null, ouvrirSport(grp)) : vueModeAvantSp(grp);
