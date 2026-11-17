/* ============ MA SEMAINE : clubs (tous sports), séances perso, programme intégré, mobilité automatique ============
   « planning » = { jours: jours perso [0 = lundi … 6], heure, lieu, clubs: sports affichés, prog: programme intégré ou "", choix: { jour: "prog" | "sport:<sp>" | "plan" } }.
   Les jours, types, contenus et durée des clubs restent dans les réglages de chaque sport (spPref : jours, types, contenus, clubMin) : une seule source avec l'écran du sport.
   Un programme intégré saute les séances que le club couvre déjà (cardio, renfo…) quand elles sont générales, et les garde en version courte quand elles sont
   propres à un autre sport (prépa ski avec un club de boxe). Sa mobilité et sa récupération sont remplacées par la mobilité placée automatiquement.
   Sans club ni programme, la semaine est exactement l'ancien planning (modèle de l'objectif sur les jours choisis). */
const SPEC_PROG = { ski: "ski", cardioBoxe: "boxe" };   // programmes propres à un sport
// ce qu'une séance de programme travaille, d'après son type et la zone de son retour au calme
const tagsProg = (type, rac) => ({ fract: ["cardio"], cardio: ["cardio"], hiit: ["cardio"], gainage: ["gainage"], force: rac === "haut" ? ["haut"] : rac === "bas" ? ["jambes"] : ["haut", "jambes"] }[type] || []);
const lirePlan = () => ({ jours: [], heure: "18:00", clubs: [], prog: "", choix: {}, ...(lirePlanning() || {}) });
const modeComplet = (P = lirePlan()) => !!(P.prog || sportsClub().length);
const nomContenus = l => l.map(k => L(...CONTENUS_CLUB.find(c => c[0] === k).slice(1)).toLowerCase()).join(", ");

// prochaines séances d'un programme pour n jours perso : l [{ i, court }], saut [{ i, p: "club" | "mob" }]
function suiteProg(id, n, tags, sports) {
  const PR = PROGRAMMES.find(p => p[0] === id), l = [], saut = []; if (!PR) return { l, saut };
  for (let i = progAvance(id); i < NB_PROG && l.length < n; i++) {
    const test = i === NB_PROG - 1, [type, , , , rac] = PR[10][i % 7], tg = test ? [] : tagsProg(type, rac), couvert = tg.length > 0 && tg.every(t => tags.has(t)), spec = !!SPEC_PROG[id] && !sports.includes(SPEC_PROG[id]);
    if (!test && (type === "mobilite" || type === "recup")) saut.push({ i, p: "mob" });
    else if (couvert && !spec) saut.push({ i, p: "club" });
    else l.push({ i, court: couvert });
  }
  return { l, saut, PR };
}
const focusProg = (PR, i) => { const [type, fF, fE] = PR[10][i % 7]; return L(PTYPES[type][1], PTYPES[type][2]) + " · " + L(fF, fE); };
const objProg = (PR, i, court) => { const R = progJour(PR, i, undefined, court);
  return { t: L(PR[1], PR[2]) + " · " + L("J", "D") + (i + 1), s: focusProg(PR, i) + (court ? " · " + L("version courte", "short version") : ""), c: PR[5], dur: ["fract", "hiit", "force", "cardio"].includes(R.ty), d: Math.round(R.plan.reduce((t, q) => t + q.d + q.r, 0) / 60),
    go: () => { ROUTINES.prog = progJour(PR, i, undefined, court); CONSEILLES.prog = ROUTINES.prog.exercices; ouvrirRoutine("prog"); } }; };
// séance dure : la liste du sport quand il en a une, sinon un effort visé de 8 ou plus
const durSp = (sp, c) => { const G = SP[sp], l = sp === "boxe" ? DUR_BX : (G.equipe || G.objectif || (G.saison && G.saison.E) || {}).dur; return l ? l.includes(c) : !G.S[c].fixe && /8|9|10/.test(G.S[c].rpe); };
const objSport = (sp, c, f) => { const G = SP[sp], S = G.S[c];
  return { t: L(...S.t), s: L(...G.nom) + " · " + L("effort", "effort") + " " + S.rpe + "/10" + (f < 1 ? " · " + L("volume allégé", "reduced volume") : ""), c: S.c, dur: durSp(sp, c), go: () => lancerSp(sp, c, f) }; };
const objMob = sports => sports.includes("boxe") ? { ...objSport("boxe", "mobilite"), s: L("Hanches, dos, épaules · effort 3/10", "Hips, back, shoulders · effort 3/10") } : tpl("C:" + (sports.some(sp => SP[sp].equipe) ? "collectif" : "complet"));
// ce que chaque jour perso peut recevoir : [valeur, FR, EN]
const choixDispo = (P, sports) => [...(P.prog && PROGRAMMES.some(p => p[0] === P.prog) ? [["prog", ...PROGRAMMES.find(p => p[0] === P.prog).slice(1, 3)]] : []),
  ...sports.filter(sp => spSemaine(sp)).map(sp => ["sport:" + sp, "Prépa " + SP[sp].nom[0].toLowerCase(), SP[sp].nom[1] + " prep"]), ["plan", "Mon objectif", "My goal"]];

/* La semaine en cours, jour par jour : { d, dt, j, clubs, fait, perso: { src, s, note }, mob: { s, r }, avant } ; notes : ce qui a été retiré ou raccourci, et pourquoi */
function semaineComplete(P = lirePlan()) {
  const L0 = lundi(), auj = jourSemaine(), C = lireClubs(), faits = new Set(lireHist().map(x => x.j)), sports = sportsClub(C), notes = [];
  const J = Array.from({ length: 8 }, (_, d) => { const dt = plusJ(L0, d), j = jourCle(dt); return { d, dt, j, clubs: clubsDu(j, C), fait: faits.has(j) }; });
  const tags = new Set(J.slice(0, 7).flatMap(x => x.clubs.flatMap(c => c.contenu))), dispo = choixDispo(P, sports), src = d => dispo.some(o => o[0] === P.choix[d]) ? P.choix[d] : dispo[0][0];
  const perso = [...P.jours].sort((a, b) => a - b), clubDur = d => J[d].clubs.some(c => c.dur), proche = d => clubDur(d) || clubDur(d + 1);
  // programme : les jours perso encore à faire reçoivent ses prochaines séances utiles
  if (P.prog) {
    const futurs = perso.filter(d => src(d) === "prog" && (d > auj || (d === auj && !J[d].fait))), S = suiteProg(P.prog, futurs.length, tags, sports);
    futurs.forEach((d, k) => { if (S.l[k]) J[d].pg = S.l[k]; });
    const PR = S.PR, retires = S.saut.filter(x => x.p === "club"), courts = S.l.slice(0, futurs.length).filter(x => x.court);
    if (retires.length) notes.push(L(`Retiré de ${PR[1]} : ${retires.map(x => focusProg(PR, x.i)).join(" ; ")}. Ton club travaille déjà : ${nomContenus([...tags])}.`, `Removed from ${PR[2]}: ${retires.map(x => focusProg(PR, x.i)).join("; ")}. Your club already covers: ${nomContenus([...tags])}.`));
    if (courts.length) notes.push(L(`Gardé en version courte : ${courts.map(x => focusProg(PR, x.i)).join(" ; ")}. C’est propre au programme ${PR[1]}, ton club ne le travaille pas de cette façon.`, `Kept in a short version: ${courts.map(x => focusProg(PR, x.i)).join("; ")}. It is specific to ${PR[2]}; your club does not train it this way.`));
    if (S.saut.some(x => x.p === "mob")) notes.push(L("Mobilité et récupération du programme : remplacées par la mobilité placée automatiquement dans ta semaine.", "The programme’s mobility and recovery days: replaced by the mobility placed automatically in your week."));
    if (futurs.length && !S.l.length) notes.push(L("Programme terminé ou entièrement couvert par ton club : tes jours perso reprennent ton objectif.", "Programme finished or fully covered by your club: your personal days go back to your goal."));
  }
  // objectif : le modèle de l'ancien planning, sur les jours qui le choisissent
  const p = lireProfil(), niv = lireNiv(), obj = PLANS[p.objectif] ? p.objectif : "forme", spR = RENFOS[p.sport] ? p.sport : "complet", nP = perso.filter(d => src(d) === "plan" || (src(d) === "prog" && !J[d].pg && d >= auj)).length || 1, modele = typeof PLANS[obj] === "function" ? PLANS[obj](nP) : PLANS[obj];
  const parSport = {}; let kp = 0;
  perso.forEach(d => {
    let c = src(d), s = null, note = "";
    if (c === "prog" && J[d].pg) { const { i, court } = J[d].pg, PR = PROGRAMMES.find(x => x[0] === P.prog), dur = objProg(PR, i).dur; s = objProg(PR, i, court || (dur && proche(d))); if (!court && dur && proche(d)) note = L("club dur ce jour-là ou le lendemain", "hard club day that day or the next"); }
    else if (c === "prog" && d < auj) { const PR = PROGRAMMES.find(x => x[0] === P.prog); s = { t: L(PR[1], PR[2]), s: L("Séance du programme", "Programme session"), c: PR[5], passe: 1 }; }
    else if (c.startsWith("sport:")) {
      const sp = c.slice(6), G = SP[sp], W = parSport[sp] || (parSport[sp] = { S: spSemaine(sp), k: 0 }), l = W.S ? W.S.jours.flatMap(x => x.l).filter(x => G.S[x]) : [], durS = x => objSport(sp, x).dur;
      let code = l[W.k++ % (l.length || 1)];
      // séance dure un jour de club dur, ou coincée entre deux : remplacée par une séance non dure du parcours, sinon de la technique
      if (code && durS(code) && (clubDur(d) || (d > 0 && clubDur(d - 1) && clubDur(d + 1)))) { const alt = l.find(x => !durS(x)) || Object.keys(G.S).find(x => /^tech/.test(x) && !durS(x)); if (alt) { code = alt; note = L("séance dure remplacée : entre deux clubs durs", "hard session swapped: between two hard club days"); } }
      if (code) { const f0 = W.S.f < 1 ? W.S.f : undefined, dur = durS(code), f = dur && proche(d) ? Math.min(f0 || 1, .7) : f0; s = objSport(sp, code, f); if (dur && proche(d)) note = L("club dur ce jour-là ou le lendemain", "hard club day that day or the next"); }
    }
    if (!s) { c = "plan"; s = tpl(modele[kp++ % modele.length].replace("@", spR), niv); }
    J[d].perso = { src: c, s, note };
  });
  // mobilité automatique : lendemain d'un effort dur ou jour coincé entre deux, et 10 min avant chaque club
  const dur = d => d >= 0 && (clubDur(d) || (J[d].perso && J[d].perso.s && J[d].perso.s.dur));
  for (let d = 0; d < 7; d++) {
    if (J[d].clubs.length) J[d].avant = objMob(sports);
    if (J[d].perso || J[d].clubs.length) continue;
    if (dur(d - 1)) J[d].mob = { s: objMob(sports), r: dur(d + 1) ? L("Entre deux grosses séances : bouge sans te fatiguer.", "Between two big sessions: move without tiring yourself.") : L("Lendemain d’une grosse séance : la mobilité aide à récupérer.", "Day after a big session: mobility helps you recover.") };
    else if (dur(d + 1)) J[d].mob = { s: objMob(sports), r: L("Veille d’une grosse séance : reste frais, 10 min suffisent.", "Day before a big session: stay fresh, 10 min is enough.") };
  }
  return { jours: J.slice(0, 7), notes, tags, sports };
}
// compatibilité : [{ j, s }] des jours perso, comme l'ancien planning (accueil, rappels, agenda)
function semaine() { const P = lirePlanning(); if (!P || (!P.jours.length && !modeComplet(lirePlan()))) return []; return semaineComplete(lirePlan()).jours.filter(x => x.perso && x.perso.s && !x.perso.s.passe).map(x => ({ j: x.d, s: x.perso.s })); }

/* --- L'écran Ma semaine : 4 étapes, puis la semaine calculée --- */
const MS_OUVERTS = new Set();   // clubs dépliés : ils le restent quand l'écran se redessine
const chipsMs = (a, l, actif, attrs = "") => `<div class="chips">${l.map(([k, f, e]) => `<button class="toggle" data-a="${a}" data-v="${k}" ${attrs} aria-pressed="${Array.isArray(actif) ? actif.includes(k) : String(k) === String(actif)}">${L(f, e)}</button>`).join("")}</div>`;
function renduPlanning() {
  const P = lirePlan(), C = $("plCorps"), p = lireProfil(), obj = OBJECTIFS.find(o => o[0] === p.objectif), sports = sportsClub(), aff = [...new Set([...P.clubs, ...sports])].filter(sp => SP[sp]);
  const J7 = JOURS_SP.map(([f, e], d) => [d, f, e]), perso = [...P.jours].sort((a, b) => a - b), dispo = choixDispo(P, sports);
  const club = sp => { const Q = spPref(sp), Ty = typesClub(sp), at = `data-sp="${sp}"`;
    return `<details class="ms-club" data-sp="${sp}" ${Q.jours.length && !MS_OUVERTS.has(sp) ? "" : "open"}><summary><b>${L(...SP[sp].nom)}</b><small>${Q.jours.length ? [...Q.jours].sort().map(d => L(...JOURS_SP[d]) + " " + L(...Ty[(Q.types || {})[d]] ? Ty[Q.types[d]].slice(0, 2) : Object.values(Ty)[0].slice(0, 2)).split(" /")[0].toLowerCase()).join(" · ") : L("aucun jour", "no day yet")}</small></summary>
      <span class="champ-titre">${L("Jours de club", "Club days")}</span>${chipsMs("cj", J7, Q.jours, at)}
      ${[...Q.jours].sort().map(d => `<div class="bx-type"><b>${L(...JOURS_SP[d])}</b>${chipsMs("ct", Object.entries(Ty).map(([k, [f, e]]) => [k, f, e]), Ty[(Q.types || {})[d]] ? Q.types[d] : Object.keys(Ty)[0], `${at} data-d="${d}"`)}</div>`).join("")}
      <span class="champ-titre">${L("Durée d’une séance", "Session length")}</span>${chipsMs("cm", [[60, "1 h", "1 h"], [90, "1 h 30", "1 h 30"], [120, "2 h", "2 h"]], Q.clubMin || 90, at)}
      <span class="champ-titre">${L("Ce que chaque type travaille déjà", "What each type already trains")}</span>
      ${Object.entries(Ty).map(([t, T]) => `<div class="bx-type"><b>${L(T[0], T[1])}</b>${chipsMs("cc", CONTENUS_CLUB, (Q.contenus || {})[t] || T[4], `${at} data-t="${t}"`)}</div>`).join("")}
      <button class="toggle contour" data-a="cx" ${at}>${L("Retirer ce club", "Remove this club")}</button></details>`; };
  C.innerHTML = `<div class="carnet ms-etape"><h3>1 · ${L("Mes clubs", "My clubs")}</h3><p class="sh-aide">${L("Le sport que tu pratiques en club, avec tes jours et ce que tu y fais. Tes séances perso se placent autour, sans refaire ce que le club travaille déjà.", "The sport you do at a club, with your days and what you do there. Your own sessions fit around it, without repeating what the club already trains.")}</p>
      ${chipsMs("ca", Object.keys(SP).map(sp => [sp, ...SP[sp].nom]), aff)}${aff.map(club).join("")}</div>
    <div class="carnet ms-etape"><h3>2 · ${L("Mes jours perso", "My own training days")}</h3><p class="sh-aide">${L("Les jours où tu t’entraînes seul avec l’appli. Les jours restants : repos, ou mobilité quand l’enchaînement le demande.", "The days you train on your own with the app. Other days: rest, or mobility when the sequence calls for it.")}</p>
      ${chipsMs("pj", J7, P.jours)}
      <div class="champ-duo"><label class="champ"><span>${L("Heure du rappel", "Reminder time")}</span><input id="plHeure" type="time" value="${P.heure}"></label>
      <div class="champ"><span>${L("Objectif", "Goal")}</span><button class="toggle contour" id="plObj">${obj ? L(obj[1], obj[2]) : L("À choisir", "To choose")} ›</button></div></div>
      <label class="champ"><span>${L("Où ? (facultatif)", "Where? (optional)")}</span><input id="plLieu" maxlength="40" value="${echap(P.lieu || "")}" placeholder="${L("ex. à la maison, au parc, à la salle", "e.g. at home, at the park, at the gym")}"></label></div>
    <div class="carnet ms-etape"><h3>3 · ${L("Un programme à intégrer ?", "A programme to fit in?")}</h3><p class="sh-aide">${L("Il avance au rythme de tes jours perso. Ce que ton club couvre déjà est retiré s’il est général, gardé en version courte s’il est propre au programme.", "It moves at the pace of your own days. What your club already covers is removed if general, kept short if specific to the programme.")}</p>
      ${chipsMs("pg", [["", "Aucun", "None"], ...PROGRAMMES.map(x => [x[0], x[1], x[2]])], P.prog)}</div>
    ${perso.length && dispo.length > 1 ? `<div class="carnet ms-etape"><h3>4 · ${L("Chaque jour perso", "Each own day")}</h3>${perso.map(d => `<div class="bx-type"><b>${L(...JOURS_SP[d])}</b>${chipsMs("pc", dispo, dispo.some(o => o[0] === P.choix[d]) ? P.choix[d] : dispo[0][0], `data-d="${d}"`)}</div>`).join("")}</div>` : ""}
    <div id="plSemaine"></div>`;
  C.querySelectorAll("details.ms-club").forEach(x => x.ontoggle = () => MS_OUVERTS[x.open ? "add" : "delete"](x.dataset.sp));
  const maj = () => { stocker("planning", JSON.stringify(P)); renduPlanning(); };
  C.onclick = e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const { a, sp, d, t, v } = b.dataset, Q = sp && spPref(sp), bascule = (l, x) => l.includes(x) ? l.filter(y => y !== x) : [...l, x];
    if (a === "ca") { if (aff.includes(v)) { P.clubs = P.clubs.filter(x => x !== v); spGarder(v, { ...spPref(v), jours: [] }); } else { P.clubs = [...P.clubs, v]; MS_OUVERTS.add(v); } }
    else if (a === "cx") { P.clubs = P.clubs.filter(x => x !== sp); spGarder(sp, { ...Q, jours: [] }); }
    else if (a === "cj") spGarder(sp, { ...Q, jours: bascule(Q.jours, +v).sort() });
    else if (a === "ct") spGarder(sp, { ...Q, types: { ...(Q.types || {}), [d]: v } });
    else if (a === "cm") spGarder(sp, { ...Q, clubMin: +v });
    else if (a === "cc") spGarder(sp, { ...Q, contenus: { ...(Q.contenus || {}), [t]: bascule((Q.contenus || {})[t] || typesClub(sp)[t][4], v) } });
    else if (a === "pj") P.jours = bascule(P.jours, +v).sort();
    else if (a === "pg") P.prog = v;
    else if (a === "pc") P.choix = { ...P.choix, [d]: v };
    maj();
  };
  $("plHeure").onchange = e => { P.heure = e.target.value || "18:00"; stocker("planning", JSON.stringify(P)); listeSemaine(); };
  $("plLieu").onchange = e => { P.lieu = propre(e.target.value.trim()).slice(0, 40); stocker("planning", JSON.stringify(P)); listeSemaine(); };
  $("plObj").onclick = () => ouvrirProfil("planning");
  listeSemaine();
}
function listeSemaine() {
  const P = lirePlan(), W = semaineComplete(P), auj = jourSemaine(), Z = $("plSemaine");
  if (!W.jours.some(x => x.clubs.length || x.perso)) { Z.innerHTML = `<p class="vide">${L("Ajoute un club ou touche les jours où tu veux t’entraîner.", "Add a club or tap the days you want to train.")}</p>`; return; }
  const et = l => l.length > 1 ? l.slice(0, -1).join(", ") + L(" et ", " and ") + l[l.length - 1] : l[0] || "", jp = [...P.jours].sort().map(i => JOURS_LONGS()[i]);
  Z.innerHTML = `${jp.length ? `<p class="pl-plan">📌 <b>${L("Mon plan", "My plan")}</b> : ${L(`le ${et(jp)} à ${P.heure}`, `${et(jp)} at ${P.heure}`)}${P.lieu ? ", " + echap(P.lieu) : ""}. ${L("Imprévu ? <b>Plan B</b> : 7 minutes de Quick start, plutôt que rien.", "Something came up? <b>Plan B</b>: 7 minutes of Quick start, rather than nothing.")}</p>` : ""}
    <h2 class="sec">${L("Cette semaine", "This week")}</h2><ul class="list semaine-liste ms-liste">${W.jours.map(x => { const S = x.perso ? x.perso.s : x.mob ? x.mob.s : null, lance = S && S.go && !x.fait && x.d >= auj;
      return `<li class="${x.d === auj ? "auj" : ""}${S || x.clubs.length ? "" : " repos"}" style="--c:${S ? S.c : x.clubs.length ? "var(--brand)" : "transparent"}"><span class="jr">${JOURS_LONGS()[x.d].slice(0, 3)}<small>${x.dt.getDate()}</small></span><div>
        ${x.clubs.map(c => `<button class="ms-club-b" data-note="${c.sp}" data-j="${x.j}" aria-label="${L("Noter la séance de club", "Log the club session")}">${L(...SP[c.sp].nom)} · ${L(...c.nom)}${c.note ? " ✓" : ""}</button>`).join("")}
        ${S ? `<b>${x.mob ? "🧘 " : ""}${S.t}</b><small>${x.mob ? x.mob.r : S.s}${x.perso && x.perso.note ? " · " + x.perso.note : ""}</small>` : x.clubs.length ? (x.avant && x.d >= auj ? `<button class="ms-avant" data-avant="${x.d}">🧘 ${L("10 min de mobilité avant le club", "10 min of mobility before the club")}</button>` : "") : `<b>${L("Repos", "Rest")}</b><small>${L("Marche, vélo tranquille ou rien du tout : ça fait partie du plan.", "A walk, an easy ride or nothing at all: it is part of the plan.")}</small>`}
      </div>${x.fait ? `<span class="fait">✓</span>` : lance ? `<button class="toggle" data-go="${x.d}">${x.d === auj ? L("Lancer", "Start") : "▶"}</button>` : ""}</li>`; }).join("")}</ul>
    ${W.notes.length ? `<div class="carnet ms-notes"><h3>🔀 ${L("Ce qui a été adapté", "What was adapted")}</h3><ul class="prog-obj">${W.notes.map(n => `<li>${n}</li>`).join("")}</ul></div>` : ""}
    ${W.sports.length ? `<p class="sh-aide">${L("Touche une séance de club pour noter ce que tu as vraiment fait (ou qu’elle n’a pas eu lieu) : la semaine et ta batterie s’adaptent.", "Tap a club session to log what you actually did (or that it didn’t happen): your week and battery adapt.")}</p>` : ""}
    ${jp.length ? `<button class="primary" id="plIcs">🔔 ${L("Ajouter les rappels à mon agenda", "Add reminders to my calendar")}</button><div id="plNotif"></div><p class="sh-aide" id="plIcsAide">${L("Crée un rendez-vous chaque semaine dans l’agenda de ton téléphone, avec une alerte 15 minutes avant.", "Creates a weekly event in your phone’s calendar, with an alert 15 minutes before.")}</p>` : ""}`;
  Z.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { const x = W.jours[+b.dataset.go]; (x.perso ? x.perso.s : x.mob.s).go(); });
  Z.querySelectorAll("[data-avant]").forEach(b => b.onclick = () => W.jours[+b.dataset.avant].avant.go());
  Z.querySelectorAll("[data-note]").forEach(b => b.onclick = () => feuilleClub(b.dataset.j, b.dataset.note, renduPlanning));
  if ($("plIcs")) { $("plIcs").onclick = exporterIcs; blocRappel(); majRappelSW(); }
}
// carte de l'accueil un jour sans séance perso, quand il y a des clubs ou un programme : le club du jour ou la mobilité prévue
function carteJourComplet(Z) {
  if (!modeComplet()) return false;
  const x = semaineComplete().jours[jourSemaine()]; if (x.perso) return false;
  const S = x.mob ? x.mob.s : x.clubs.length ? x.avant : null, c = x.clubs[0];
  Z.innerHTML = `<button class="sc-corps" id="scOuvrir" style="--c:${S ? S.c : "#64748B"}"><span class="sc-ico">${c ? "🏟️" : x.mob ? "🧘" : "🌙"}</span><span><strong>${c ? L("Aujourd’hui : club", "Today: club") + " · " + x.clubs.map(k => L(...SP[k.sp].nom) + " " + L(...k.nom).toLowerCase()).join(" + ") : x.mob ? L("Aujourd’hui", "Today") + " · " + S.t : L("Aujourd’hui : repos", "Today: rest")}</strong><small>${c ? L("10 min de mobilité avant, si tu veux", "10 min of mobility before, if you like") : x.mob ? x.mob.r : L("Ça fait partie du plan.", "It is part of the plan.")}</small></span></button>${S && !x.fait ? `<button class="sc-go" id="scGo" aria-label="${L("Lancer", "Start")}">${ico("lecture")}</button>` : ""}`;
  if ($("scGo")) $("scGo").onclick = e => { e.stopPropagation(); S.go(); };
  $("scOuvrir").onclick = () => ouvrirPlanning("menu");
  return true;
}
