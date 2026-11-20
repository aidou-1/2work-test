/* ============ MA SEMAINE : clubs (tous sports), séances perso, programme intégré, mobilité automatique ============
   « planning » = { jours: jours d'entraînement perso [0 = lundi … 6], dispo: jours disponibles (léger ou mobilité si besoin), heure, lieu, clubs: sports affichés,
   prog: programme intégré ou "", types: ce que l'on veut travailler (TYPES_PERSO), choix: { jour: "prog" | "sport:<sp>" | "types" | "plan" },
   off: { "AAAA-MM-JJ": 1 } séances retirées à la main cette semaine, remp: { "AAAA-MM-JJ": "type:<clé>" | "sp:<sport>:<code>" } séance choisie à la main pour ce jour,
   ajout: { "AAAA-MM-JJ": [même format que remp] } séances ajoutées en plus, valide: jour de la dernière validation,
   allege: lundi d'une semaine allégée (choisie dans le bilan), bilanVu: lundi de la semaine dont le bilan a été lu,
   fait: { "AAAA-MM-JJ": 1 } séances validées à la main (faites sans l'appli), dep: { jour passé non fait: jour où la séance est déplacée } }.
   off, remp, ajout, fait et dep ne gardent que la semaine en cours.
   Les jours, types, contenus et durée des clubs restent dans les réglages de chaque sport (spPref : jours, types, contenus, clubMin) : une seule source avec l'écran du sport.
   Un programme intégré saute les séances que le club couvre déjà (cardio, renfo…) quand elles sont générales, et les garde en version courte quand elles sont
   propres à un autre sport (prépa ski avec un club de boxe). Sa mobilité et sa récupération sont remplacées par la mobilité placée automatiquement.
   Sans club ni programme, la semaine est exactement l'ancien planning (modèle de l'objectif sur les jours choisis). */
const SPEC_PROG = { ski: "ski", cardioBoxe: "boxe" };   // programmes propres à un sport
// ce qu'une séance de programme travaille, d'après son type et la zone de son retour au calme
const tagsProg = (type, rac) => ({ fract: ["cardio"], cardio: ["cardio"], hiit: ["cardio"], gainage: ["gainage"], force: rac === "haut" ? ["haut"] : rac === "bas" ? ["jambes"] : ["haut", "jambes"] }[type] || []);
const lirePlan = () => ({ jours: [], dispo: [], heure: "18:00", clubs: [], prog: "", types: [], choix: {}, off: {}, remp: {}, ajout: {}, fait: {}, dep: {}, ...(lirePlanning() || {}) });
// ce que l'on veut travailler en perso : [clé, FR, EN, contenu de club qui le couvre déjà, dur]
const TYPES_PERSO = [["cardio", "Cardio / fractionné", "Cardio / intervals", ["cardio"], 1], ["haut", "Renfo haut", "Upper body", ["haut"], 1], ["jambes", "Renfo jambes", "Legs", ["jambes"], 1],
  ["complet", "Renfo complet", "Full body", ["haut", "jambes"], 1], ["gainage", "Gainage", "Core", ["gainage"], 0], ["mobilite", "Mobilité", "Mobility", ["mobilite"], 0],
  ["technique", "Technique du sport", "Sport technique", [], 0], ["explo", "Explosivité", "Power", [], 1]];
const couvertType = (k, tags) => { const c = TYPES_PERSO.find(t => t[0] === k)[3]; return c.length > 0 && c.every(t => tags.has(t)); };
// séance d'un type : celle du sport de club quand il en a une (technique, puissance, gainage), sinon une séance de l'appli
function objType(k, sports, niv) {
  const sp = sports.find(x => spSemaine(x)) || sports[0], G = sp && SP[sp], code = re => G && Object.keys(G.S).find(c => re.test(c)), dur = TYPES_PERSO.find(t => t[0] === k)[4];
  const c = k === "technique" ? code(/^tech/) : k === "explo" ? code(/puiss|explo|plio|deten|vitesse|sprint/) : k === "gainage" ? code(/^gainage/) : null;
  const s = k === "mobilite" ? objMob(sports) : c ? objSport(sp, c) : tpl({ cardio: "T:cardio", haut: "R:haut", jambes: "R:bas", complet: "R:complet", gainage: "R:pilates", technique: "C:complet", explo: "T:jambes" }[k], niv);
  // titres des séances de repli : le type demandé, pas le nom de la séance de l'appli utilisée
  const titre = !c && { gainage: L("Gainage · centre du corps", "Core · trunk"), technique: L("Mobilité et technique libre", "Mobility and free technique") }[k];
  return { ...s, ...(titre ? { t: titre } : {}), dur: !!dur, type: k };
}
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
const objProg = (PR, i, court, sautes = []) => { const R = progJour(PR, i, undefined, court);
  return { t: L(PR[1], PR[2]) + " · " + L("J", "D") + (i + 1), s: focusProg(PR, i) + (court ? " · " + L("version courte", "short version") : ""), c: PR[5], dur: ["fract", "hiit", "force", "cardio"].includes(R.ty), d: Math.round(R.plan.reduce((t, q) => t + q.d + q.r, 0) / 60),
    go: () => { ROUTINES.prog = { ...progJour(PR, i, undefined, court), sautes }; CONSEILLES.prog = ROUTINES.prog.exercices; ouvrirRoutine("prog"); } }; };
// séance dure : la liste du sport quand il en a une, sinon un effort visé de 8 ou plus
const durSp = (sp, c) => { const G = SP[sp], l = sp === "boxe" ? DUR_BX : (G.equipe || G.objectif || (G.saison && G.saison.E) || {}).dur; return l ? l.includes(c) : !G.S[c].fixe && /8|9|10/.test(G.S[c].rpe); };
const objSport = (sp, c, f) => { const G = SP[sp], S = G.S[c];
  return { t: L(...S.t), s: L(...G.nom) + " · " + L("effort", "effort") + " " + S.rpe + "/10" + (f < 1 ? " · " + L("volume allégé", "reduced volume") : ""), c: S.c, dur: durSp(sp, c), cle: G.pre + c, go: () => lancerSp(sp, c, f) }; };
const objMob = sports => sports.includes("boxe") ? { ...objSport("boxe", "mobilite"), s: L("Hanches, dos, épaules · effort 3/10", "Hips, back, shoulders · effort 3/10") } : { ...tpl("C:" + (sports.some(sp => SP[sp].equipe) ? "collectif" : "complet")), t: L("Mobilité douce", "Gentle mobility") };
// ce que chaque jour perso peut recevoir : [valeur, FR, EN]
const choixDispo = (P, sports) => [...(P.prog && PROGRAMMES.some(p => p[0] === P.prog) ? [["prog", ...PROGRAMMES.find(p => p[0] === P.prog).slice(1, 3)]] : []),
  ...sports.filter(sp => spSemaine(sp)).map(sp => ["sport:" + sp, "Prépa " + SP[sp].nom[0].toLowerCase(), SP[sp].nom[1] + " prep"]), ...(P.types.length ? [["types", "Mes types", "My types"]] : []), ["plan", "Mon objectif", "My goal"]];

/* La semaine en cours, jour par jour : { d, dt, j, clubs, fait, perso: { src, s, note }, mob: { s, r }, avant } ; notes : ce qui a été retiré ou raccourci, et pourquoi */
function semaineComplete(P = lirePlan()) {
  const L0 = lundi(), auj = jourSemaine(), C = lireClubs(), faits = new Set(lireHist().map(x => x.j)), sports = sportsClub(C), notes = [];   // sports = clubs réglés ; les clubs du jour (clubsDu) comptent aussi le journal
  const J = Array.from({ length: 8 }, (_, d) => { const dt = plusJ(L0, d), j = jourCle(dt); return { d, dt, j, clubs: clubsDu(j, C), fait: faits.has(j) }; });
  const tags = new Set(J.slice(0, 7).flatMap(x => x.clubs.flatMap(c => c.contenu))), dispo = choixDispo(P, sports), defaut = dispo.find(o => o[0] === "prog" || o[0] === "types") || ["plan"], src = d => dispo.some(o => o[0] === P.choix[d]) ? P.choix[d] : defaut[0];
  // un jour de club coché en séance perso ne reçoit qu'un complément léger (voir plus bas) : les vraies séances vont sur les jours sans club
  // séances retirées à la main : le jour devient repos, et les séances du programme ou du sport passent aux jours suivants
  // un jour choisi à la main sort aussi des séquences : il reçoit la séance choisie (plus bas)
  // semaine allégée (bilan) : volume réduit partout, types légers de préférence
  const allege = P.allege === J[0].j;
  if (allege) notes.push(L("Semaine allégée, choisie dans ton bilan : volume réduit et séances légères de préférence.", "Lighter week, chosen in your review: reduced volume and light sessions first."));
  J.forEach(x => { x.retire = !!(P.off || {})[x.j]; x.choisi = !x.retire && (P.remp || {})[x.j]; });
  const garde = d => !J[d].retire && !J[d].choisi, surClub = P.jours.filter(d => J[d].clubs.length && garde(d)).sort((a, b) => a - b), perso = P.jours.filter(d => !J[d].clubs.length && garde(d)).sort((a, b) => a - b), clubDur = d => J[d].clubs.some(c => c.dur), proche = d => clubDur(d) || clubDur(d + 1);
  if (surClub.length) notes.push(L(`Le ${surClub.map(d => JOURS_LONGS()[d]).join(", ")} : jour de club, ta séance perso devient un complément léger (gainage, technique ou mobilité), pour ne pas cumuler deux grosses séances.`, `On ${surClub.map(d => JOURS_LONGS()[d]).join(", ")}: club day, your own session becomes a light extra (core, technique or mobility), so you don’t stack two big sessions.`));
  // programme : les jours perso encore à faire reçoivent ses prochaines séances utiles
  if (P.prog) {
    const futurs = perso.filter(d => src(d) === "prog" && (d > auj || (d === auj && !J[d].fait))), S = suiteProg(P.prog, futurs.length, tags, sports);
    futurs.forEach((d, k) => { if (S.l[k]) J[d].pg = { ...S.l[k], sautes: S.saut.map(x => x.i) }; });
    const PR = S.PR, retires = S.saut.filter(x => x.p === "club"), courts = S.l.slice(0, futurs.length).filter(x => x.court);
    if (retires.length) notes.push(L(`Retiré de ${PR[1]} : ${retires.map(x => focusProg(PR, x.i)).join(" ; ")}. Ton club travaille déjà : ${nomContenus([...tags])}.`, `Removed from ${PR[2]}: ${retires.map(x => focusProg(PR, x.i)).join("; ")}. Your club already covers: ${nomContenus([...tags])}.`));
    if (courts.length) notes.push(L(`Gardé en version courte : ${courts.map(x => focusProg(PR, x.i)).join(" ; ")}. C’est propre au programme ${PR[1]}, ton club ne le travaille pas de cette façon.`, `Kept in a short version: ${courts.map(x => focusProg(PR, x.i)).join("; ")}. It is specific to ${PR[2]}; your club does not train it this way.`));
    if (S.saut.some(x => x.p === "mob")) notes.push(L("Mobilité et récupération du programme : remplacées par la mobilité placée automatiquement dans ta semaine.", "The programme’s mobility and recovery days: replaced by the mobility placed automatically in your week."));
    if (futurs.length && !S.l.length) notes.push(L("Programme terminé ou entièrement couvert par ton club : tes jours perso reprennent ton objectif.", "Programme finished or fully covered by your club: your personal days go back to your goal."));
  }
  // objectif : le modèle de l'ancien planning, sur les jours qui le choisissent
  const p = lireProfil(), niv = lireNiv(), obj = PLANS[p.objectif] ? p.objectif : "forme", spR = RENFOS[p.sport] ? p.sport : "complet", nP = perso.filter(d => src(d) === "plan" || (src(d) === "prog" && !J[d].pg && d >= auj)).length || 1, modele = typeof PLANS[obj] === "function" ? PLANS[obj](nP) : PLANS[obj];
  const parSport = {}, file = P.types.filter(k => !couvertType(k, tags)), retiresT = P.types.filter(k => couvertType(k, tags)); let kp = 0, dernier = null;
  if (perso.some(d => src(d) === "types") && retiresT.length) notes.push(L(`Retiré de tes types : ${retiresT.map(k => TYPES_PERSO.find(t => t[0] === k)[1].toLowerCase()).join(", ")}. Ton club le travaille déjà.`, `Removed from your types: ${retiresT.map(k => TYPES_PERSO.find(t => t[0] === k)[2].toLowerCase()).join(", ")}. Your club already trains it.`));
  perso.forEach(d => {
    let c = src(d), s = null, note = "";
    if (c === "prog" && J[d].pg) { const { i, court } = J[d].pg, PR = PROGRAMMES.find(x => x[0] === P.prog), dur = objProg(PR, i).dur; s = objProg(PR, i, court || allege || (dur && proche(d)), J[d].pg.sautes); if (!court && dur && proche(d)) note = L("club dur ce jour-là ou le lendemain", "hard club day that day or the next"); }
    else if (c === "prog" && d < auj) { const PR = PROGRAMMES.find(x => x[0] === P.prog); s = { t: L(PR[1], PR[2]), s: L("Séance du programme", "Programme session"), c: PR[5], passe: 1 }; }
    else if (c.startsWith("sport:")) {
      const sp = c.slice(6), G = SP[sp], W = parSport[sp] || (parSport[sp] = { S: spSemaine(sp), k: 0 }), l = W.S ? W.S.jours.flatMap(x => x.l).filter(x => G.S[x]) : [], durS = x => objSport(sp, x).dur;
      let code = l[W.k++ % (l.length || 1)];
      // séance dure un jour de club dur, ou coincée entre deux : remplacée par une séance non dure du parcours, sinon de la technique
      if (code && durS(code) && (clubDur(d) || (d > 0 && clubDur(d - 1) && clubDur(d + 1)))) { const alt = l.find(x => !durS(x)) || Object.keys(G.S).find(x => /^tech/.test(x) && !durS(x)); if (alt) { code = alt; note = L("séance dure remplacée : entre deux clubs durs", "hard session swapped: between two hard club days"); } }
      if (code) { const f0 = W.S.f < 1 ? W.S.f : undefined, dur = durS(code), f = dur && (proche(d) || allege) ? Math.min(f0 || 1, .7) : f0; s = objSport(sp, code, f); if (dur && proche(d)) note = L("club dur ce jour-là ou le lendemain", "hard club day that day or the next"); }
    }
    else if (c === "types") {
      // léger demandé près d'un club dur ou après une séance dure ; sinon on alterne avec le type précédent
      const leger = allege || proche(d) || (d > 0 && clubDur(d - 1)) || dernier === 1, l = file.length ? file : ["mobilite"], i = Math.max(0, l.findIndex(k => !TYPES_PERSO.find(t => t[0] === k)[4] === leger)), k = l[i];
      if (file.length) file.push(...file.splice(i, 1));
      s = objType(k, sports, niv); dernier = s.dur ? 1 : 0; if (allege && s.dur) note = L("semaine allégée : fais un tour de moins", "lighter week: do one round less"); else if (leger && s.dur) note = L("pas de type léger dans ta liste : vas-y à effort modéré", "no light type in your list: keep the effort moderate");
    }
    // le jour de récupération active du plan reste facultatif : il ne compte pas dans le suivi
    if (!s) { c = "plan"; const m = modele[kp++ % modele.length].replace("@", spR); s = tpl(m, niv); if (m === "C:repos") s.facultatif = 1; }
    J[d].perso = { src: c, s, note };
  });
  const objChoix = v => { const [k, a, b] = v.split(":"); return k === "type" ? objType(a, sports, niv) : SP[a] && SP[a].S[b] ? objSport(a, b) : null; }, charge = (x, s) => x.clubs.some(c => c.dur) && s.dur ? " · " + L("club dur ce jour-là : attention à la charge", "hard club day: watch the load") : "";
  J.slice(0, 7).forEach(x => {
    if (x.choisi) { const s = objChoix(x.choisi); if (s) x.perso = { src: "choix", s, note: L("choisie par toi", "picked by you") + charge(x, s) }; }
    // séances ajoutées en plus de celle du jour
    x.extras = ((P.ajout || {})[x.j] || []).map(v => { const s = objChoix(v); return s && { v, s, note: charge(x, s) }; }).filter(Boolean);
  });
  // séance d'un jour passé non faite, déplacée depuis « À rattraper » : elle s'ajoute au jour choisi (après les ajouts, pour garder leurs numéros)
  J.slice(0, 7).forEach(x => { const y = J.find(z => z.d < 7 && z.j === (P.dep || {})[x.j]), s = x.perso && x.perso.s;
    if (y && s && !s.passe) { x.dep = y.j; y.extras.push({ s, dep: x.j, note: " · " + L("rattrapage du ", "catch-up from ") + JOURS_LONGS()[x.d] + charge(y, s) }); } });
  // séance faite en avance : une séance prévue plus loin dans la semaine, déjà faite un autre jour, est cochée et son jour reste libre.
  // Chaque séance faite ne compte qu'une fois : d'abord pour son propre jour, puis pour le prochain jour qui prévoit la même séance.
  const egal = (e, s) => s.cle ? e.k === s.cle : !!s.t && e.t === s.t, libres = lireHist().filter(e => e.j >= J[0].j && e.j <= J[6].j), semH = [...libres];
  J.slice(0, 7).forEach(x => { const s = x.perso && x.perso.s, i = s ? libres.findIndex(e => e.j === x.j && egal(e, s)) : -1; if (i >= 0) { libres.splice(i, 1); x.vraie = 1; } });
  // séance d'un jour passé rattrapée plus tard (relancée ou déplacée) : cochée à son jour d'origine, avant de compter les séances faites en avance ;
  // la séance de rattrapage ne coche pas le jour où elle a été faite
  const rattr = new Set(), auj0 = jourSemaine();
  J.slice(0, 7).forEach(x => { const s = x.perso && x.perso.s, i = s && !x.vraie && x.d < auj0 ? libres.findIndex(e => e.j > x.j && egal(e, s)) : -1; if (i >= 0) { const e = libres.splice(i, 1)[0]; rattr.add(e); x.rattrape = e.j; x.fait = 1; } });
  J.forEach(x => { if (!x.vraie && !x.rattrape) x.fait = semH.some(e => e.j === x.j && !rattr.has(e)); });
  J.slice(0, 7).forEach(x => { const s = x.perso && x.perso.s, i = s && !x.fait ? libres.findIndex(e => e.j < x.j && egal(e, s)) : -1; if (i >= 0) x.avance = libres.splice(i, 1)[0].j; });
  // faite : avec l'appli ce jour-là, en avance, rattrapée, ou validée à la main
  J.forEach(x => { x.coche = !!(P.fait || {})[x.j]; x.ok = x.fait || !!x.avance || x.coche; });
  // séances publiées par le coach pour cette semaine (gardées sur le téléphone par js/clubs.js) : au jour prévu, avec ma coche
  const CS = lireJSON("clubSemaine", {}), coach = CS.lundi === J[0].j ? (CS.clubs || []).flatMap(c => (c.seances || []).map(s => ({ ...s, c: c.id, club: c.nom, fait: !!(c.faits || {})[s.id] }))) : [];
  J.forEach(x => { x.coach = coach.filter(s => s.date === x.j); });
  // mobilité automatique : lendemain d'un effort dur ou jour coincé entre deux, et 10 min avant chaque club
  const dur = d => d >= 0 && (clubDur(d) || (J[d].perso && J[d].perso.s && J[d].perso.s.dur && !J[d].avance) || (J[d].extras || []).some(e => e.s.dur));
  for (let d = 0; d < 7; d++) {
    if (J[d].clubs.length) J[d].avant = objMob(sports);
    if (J[d].perso || J[d].clubs.length || J[d].retire || J[d].extras.length) continue;
    if (dur(d - 1)) J[d].mob = { s: objMob(sports), r: dur(d + 1) ? L("Entre deux grosses séances : bouge sans te fatiguer.", "Between two big sessions: move without tiring yourself.") : L("Lendemain d’une grosse séance : la mobilité aide à récupérer.", "Day after a big session: mobility helps you recover.") };
    else if (dur(d + 1)) J[d].mob = { s: objMob(sports), r: L("Veille d’une grosse séance : reste frais, 10 min suffisent.", "Day before a big session: stay fresh, 10 min is enough.") };
  }
  const legers = P.types.filter(k => !TYPES_PERSO.find(t => t[0] === k)[4]);
  surClub.forEach(d => { const l = legers.filter(k => !couvertType(k, tags)), k = l.length ? l[d % l.length] : !tags.has("gainage") ? "gainage" : "mobilite";
    J[d].perso = { src: "leger", s: objType(k, sports, niv), note: L("complément léger : c’est un jour de club", "light extra: it is a club day") }; });
  (P.dispo || []).forEach(d => { const x = J[d]; if (x.perso || x.clubs.length || x.retire) return; x.dispo = 1;
    if (!x.mob) x.mob = { s: legers.length ? objType(legers[d % legers.length], sports, niv) : objMob(sports), r: L("Jour disponible : séance légère facultative.", "Available day: optional light session.") }; });
  return { jours: J.slice(0, 7), notes, tags, sports };
}
// compatibilité : [{ j, s }] des jours perso, comme l'ancien planning (accueil, rappels, agenda)
// rappels : semaine type pour l'agenda et les rappels répétés, sans les choix ponctuels ni les compléments légers des jours de club
function semaine(rappels) { const P = lirePlanning(); if (!P || (!(P.jours || []).length && !modeComplet(lirePlan()))) return []; return semaineComplete(lirePlan()).jours.filter(x => x.perso && x.perso.s && !x.perso.s.passe && !(!rappels && x.avance) && !(rappels && ["choix", "leger"].includes(x.perso.src))).map(x => ({ j: x.d, s: x.perso.s })); }

/* Suivi : séances perso (sans les compléments légers des jours de club) et séances de club de la semaine.
   faites / prevues ; retard : jours passés non faits et non déplacés (à rattraper) ; suite : encore à faire aujourd'hui et après (d : jour où elle aura lieu). */
function suiviSemaine(W = semaineComplete()) {
  const auj = jourSemaine(), l = [];
  W.jours.forEach(x => { if (x.perso && x.perso.s && x.perso.src !== "leger" && !x.perso.s.facultatif) l.push({ x, s: x.perso.s, ok: x.ok }); x.clubs.forEach(c => l.push({ x, c, ok: c.note })); (x.coach || []).forEach((cs, i) => l.push({ x, cs, i, ok: cs.fait })); });
  const reste = l.filter(e => !e.ok);
  return { prevues: l.length, faites: l.length - reste.length, retard: reste.filter(e => e.x.d < auj && !e.x.dep), suite: reste.filter(e => e.x.d >= auj || e.x.dep).map(e => ({ ...e, d: e.x.dep ? (new Date(e.x.dep + "T12:00").getDay() + 6) % 7 : e.x.d })).sort((a, b) => a.d - b.d) };
}
const nomJourCle = j => JOURS_LONGS()[(new Date(j + "T12:00").getDay() + 6) % 7];
const barreSuivi = U => `<span class="ms-barre" role="progressbar" aria-valuemin="0" aria-valuemax="${U.prevues}" aria-valuenow="${U.faites}" aria-label="${L("Séances faites", "Sessions done")}"><i style="width:${U.prevues ? Math.round(U.faites / U.prevues * 100) : 0}%"></i></span>`;
const nomSuivi = e => e.cs ? "📣 " + echap(e.cs.titre) : e.c ? L(...SP[e.c.sp].nom) + " · " + L(...e.c.nom) : e.s.t;

/* --- L'écran Ma semaine : 4 étapes, puis la semaine calculée --- */
const MS_OUVERTS = new Set();   // clubs dépliés : ils le restent quand l'écran se redessine
// l : [valeur, FR, EN, indisponible]
const chipsMs = (a, l, actif, attrs = "") => `<div class="chips">${l.map(([k, f, e, off]) => `<button class="toggle" data-a="${a}" data-v="${k}" ${attrs}${off ? " disabled" : ""} aria-pressed="${!off && (Array.isArray(actif) ? actif.includes(k) : String(k) === String(actif))}">${L(f, e)}</button>`).join("")}</div>`;
function renduPlanning() {
  const P = lirePlan(), C = $("plCorps"), p = lireProfil(), obj = OBJECTIFS.find(o => o[0] === p.objectif), sports = sportsClub(), aff = [...new Set([...P.clubs, ...sports])].filter(sp => SP[sp]);
  const J7 = JOURS_SP.map(([f, e], d) => [d, f, e]), persoLibres = [...P.jours].sort((a, b) => a - b).filter(d => !sports.some(sp => spPref(sp).jours.includes(d))), tags = new Set(sports.flatMap(sp => { const Q = spPref(sp); return Q.jours.flatMap(d => clubJour(sp, jourCle(plusJ(lundi(), d)), Q) || { contenu: [] }).flatMap(x => x.contenu); })), perso = [...P.jours].sort((a, b) => a - b), dispo = choixDispo(P, sports);
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
    <div class="carnet ms-etape"><h3>2 · ${L("Mes jours", "My days")}</h3><p class="sh-aide">${L("Un jour de club coché en séance perso reçoit seulement un complément léger (gainage, technique ou mobilité) ; les vraies séances vont sur tes jours sans club.", "A club day ticked as an own session only gets a light extra (core, technique or mobility); real sessions go on your days without club.")}</p>
      <span class="champ-titre">${L("Séance perso : une vraie séance avec l’appli", "Own session: a real workout with the app")}</span>${chipsMs("pj", J7, P.jours)}
      <span class="champ-titre">${L("Disponible : séance légère ou mobilité, facultative", "Available: light session or mobility, optional")}</span>${chipsMs("pd", J7, P.dispo)}
      <div class="champ-duo"><label class="champ"><span>${L("Heure du rappel", "Reminder time")}</span><input id="plHeure" type="time" value="${P.heure}"></label>
      <div class="champ"><span>${L("Objectif", "Goal")}</span><button class="toggle contour" id="plObj">${obj ? L(obj[1], obj[2]) : L("À choisir", "To choose")} ›</button></div></div>
      <label class="champ"><span>${L("Où ? (facultatif)", "Where? (optional)")}</span><input id="plLieu" maxlength="40" value="${echap(P.lieu || "")}" placeholder="${L("ex. à la maison, au parc, à la salle", "e.g. at home, at the park, at the gym")}"></label></div>
    <div class="carnet ms-etape"><h3>3 · ${L("Ce que je veux travailler", "What I want to train")}</h3><p class="sh-aide">${L("Réparti sur tes jours qui choisissent « Mes types », en alternant dur et léger. « Club » : ton club le travaille déjà, il sera retiré.", "Spread over your days set to “My types”, alternating hard and light. “Club”: your club already trains it, it will be removed.")}</p>
      ${chipsMs("pt", TYPES_PERSO.map(([k, f, e]) => couvertType(k, tags) ? [k, f + " · club", e + " · club"] : [k, f, e]), P.types)}</div>
    <div class="carnet ms-etape"><h3>4 · ${L("Un programme à intégrer ?", "A programme to fit in?")}</h3><p class="sh-aide">${L("Il avance au rythme de tes jours perso. Ce que ton club couvre déjà est retiré s’il est général, gardé en version courte s’il est propre au programme.", "It moves at the pace of your own days. What your club already covers is removed if general, kept short if specific to the programme.")}</p>
      ${chipsMs("pg", [["", "Aucun", "None"], ...PROGRAMMES.map(x => [x[0], x[1], x[2]])], P.prog)}</div>
    ${persoLibres.length && dispo.length > 1 ? `<div class="carnet ms-etape"><h3>5 · ${L("Chaque jour de séance perso", "Each own-session day")}</h3>${persoLibres.map(d => `<div class="bx-type"><b>${L(...JOURS_SP[d])}</b>${chipsMs("pc", dispo, dispo.some(o => o[0] === P.choix[d]) ? P.choix[d] : (dispo.find(o => o[0] === "prog" || o[0] === "types") || ["plan"])[0], `data-d="${d}"`)}</div>`).join("")}</div>` : ""}
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
    else if (a === "pj") { P.jours = bascule(P.jours, +v).sort(); P.dispo = P.dispo.filter(x => !P.jours.includes(x)); }   // un jour est soit d'entraînement, soit disponible
    else if (a === "pd") { P.dispo = bascule(P.dispo, +v).sort(); P.jours = P.jours.filter(x => !P.dispo.includes(x)); }
    else if (a === "pt") { P.types = bascule(P.types, v); if (P.types.length && !Object.keys(P.choix).length && !P.prog) P.jours.forEach(d => P.choix[d] = "types"); }
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
  if (!W.jours.some(x => x.clubs.length || x.perso || x.coach.length) && !(lireJSON("clubSemaine", {}).propose || []).length) { Z.innerHTML = `<p class="vide">${L("Ajoute un club ou touche les jours où tu veux t’entraîner.", "Add a club or tap the days you want to train.")}</p>`; return; }
  const et = l => l.length > 1 ? l.slice(0, -1).join(", ") + L(" et ", " and ") + l[l.length - 1] : l[0] || "", jp = W.jours.filter(x => x.perso).map(x => JOURS_LONGS()[x.d]);   // jours de séance perso réels (sans les jours de club)
  const U = suiviSemaine(W), suite = U.suite.map(e => JOURS_LONGS()[e.d].slice(0, 3) + ". " + nomSuivi(e));
  // une séance pas faite : lancer, déplacer, valider (faite sans l'appli) ou abandonner ; un club : le noter
  const btCoach = (x, i, cs) => `<button class="toggle" data-cgo="${x.d}:${i}">▶ ${L("Lancer", "Start")}</button><button class="ms-retirer" data-cfait="${x.d}:${i}">✅ ${L("Fait", "Done")}</button>`;
  const rattr = e => e.cs ? `<li style="--c:#2563EB"><span><b>${JOURS_LONGS()[e.x.d]} · ${nomSuivi(e)}</b><small>${L("Séance du coach pas encore faite", "Coach workout not done yet")} · ${echap(e.cs.club)}</small></span><span class="ms-liens">${btCoach(e.x, e.i, e.cs)}</span></li>` : `<li style="--c:${e.c ? "var(--brand)" : e.s.c}"><span><b>${JOURS_LONGS()[e.x.d]} · ${nomSuivi(e)}</b><small>${e.c ? L("Séance de club pas encore notée", "Club session not logged yet") : e.s.passe ? L("Le programme reprend là où tu en es", "The programme picks up where you are") : L("Prévue mais pas faite", "Planned but not done")}</small></span><span class="ms-liens">${e.c
    ? `<button class="toggle" data-note="${e.c.sp}" data-j="${e.x.j}">${L("Noter", "Log")}</button>`
    : (e.s.go && !e.s.passe ? `<button class="toggle" data-rgo="${e.x.d}">▶ ${L("Lancer", "Start")}</button><button class="ms-retirer" data-dep="${e.x.d}">${L("Déplacer", "Move")}</button>` : "") + `<button class="ms-retirer" data-coche="${e.x.j}">✅ ${L("Fait", "Done")}</button>` + (e.s.passe ? "" : `<button class="ms-retirer" data-off="${e.x.j}">${L("Abandonner", "Drop it")}</button>`)}</span></li>`;
  const etat = x => !x.perso || x.perso.src === "leger" || x.perso.s.facultatif ? "" : x.rattrape ? " · ✓ " + L("rattrapée le ", "caught up on ") + nomJourCle(x.rattrape) : x.coche && !x.fait && !x.avance ? " · ✓ " + L("validée par toi", "confirmed by you") : !x.ok && x.dep ? " · " + L("déplacée au ", "moved to ") + nomJourCle(x.dep) : !x.ok && x.d < auj ? " · ⚠️ " + L("pas faite", "not done") : "";
  const liensSuivi = (x, S) => !x.perso ? "" : (!x.ok && x.d <= auj && !x.dep ? `<button class="ms-retirer" data-coche="${x.j}">✅ ${L("Fait", "Done")}</button>` : "") + (x.coche ? `<button class="ms-retirer" data-decoche="${x.j}">${L("Annuler la validation", "Undo")}</button>` : "") + (x.ok && !x.avance && S.go && !S.passe && x.d <= auj ? `<button class="ms-retirer" data-re="${x.d}">↻ ${L("Refaire", "Do again")}</button>` : "");
  const suivi = U.prevues ? `<div class="carnet ms-suivi"><h3>✅ ${L("Suivi de la semaine", "Week tracker")}</h3><p class="ms-compte"><b>${U.faites} / ${U.prevues}</b> ${L("séances faites", "sessions done")}</p>${barreSuivi(U)}
    <small>${suite.length ? L("Encore à faire : ", "Still to do: ") + suite.join(" · ") : U.retard.length ? "" : "🎉 " + L("Tout est fait cette semaine, bravo !", "Everything is done this week, well done!")}</small>
    ${U.retard.length ? `<h4>⚠️ ${L("À rattraper", "To catch up")}</h4><ul class="ms-rattr">${U.retard.map(rattr).join("")}</ul>` : ""}</div>` : "";
  const CS = lireJSON("clubSemaine", {}), props = (CS.propose || []).filter(x => SP[x.sp]);
  const propose = props.map((x, i) => `<div class="carnet ms-propose"><b>📣 ${L("Planning de ton club", "Your club’s schedule")} · ${echap(x.nom)}</b><p class="sh-aide">${L(...SP[x.sp].nom)} : ${x.jours.map(d => L(...JOURS_SP[d]) + " (" + L(...(typesClub(x.sp)[x.types[d]] || ["?", "?"]).slice(0, 2)).toLowerCase() + ")").join(", ")}. ${L("Tes réglages actuels pour ce sport sont différents.", "Your current settings for this sport are different.")}</p><div class="partage-btns"><button class="primary" data-papp="${i}">${L("Appliquer", "Apply")}</button><button class="toggle contour" data-pign="${i}">${L("Garder mes réglages", "Keep my settings")}</button></div></div>`).join("");
  Z.innerHTML = `${propose}${jp.length ? `<p class="pl-plan">📌 <b>${L("Mon plan", "My plan")}</b> : ${L(`le ${et(jp)} à ${P.heure}`, `${et(jp)} at ${P.heure}`)}${P.lieu ? ", " + echap(P.lieu) : ""}. ${L("Imprévu ? <b>Plan B</b> : 7 minutes de Quick start, plutôt que rien.", "Something came up? <b>Plan B</b>: 7 minutes of Quick start, rather than nothing.")}</p>` : ""}${suivi}
    <h2 class="sec">${L("Cette semaine", "This week")}</h2><ul class="list semaine-liste ms-liste">${W.jours.map(x => { const S = x.perso ? x.perso.s : x.mob ? x.mob.s : null, lance = S && S.go && !x.ok && x.d >= auj;
      const futur = x.d >= auj, ajouter = futur ? `<button class="ms-retirer" data-add="${x.d}">+ ${L("Ajouter", "Add")}</button>` : "", retirable = S && !x.fait && x.d >= auj, changer = !x.fait && x.d >= auj ? `<button class="ms-retirer" data-chg="${x.d}">${L("Changer", "Change")}</button>` : "";
      return `<li class="${x.d === auj ? "auj" : ""}${S || x.clubs.length || x.coach.length ? "" : " repos"}${x.dispo ? " dispo" : ""}" style="--c:${S ? S.c : x.clubs.length ? "var(--brand)" : "transparent"}">${x.d >= auj && !x.fait ? `<button class="jr ms-jr" data-chg="${x.d}" aria-label="${L("Choisir l’entraînement du ", "Choose the workout for ") + JOURS_LONGS()[x.d]}">` : `<span class="jr">`}${JOURS_LONGS()[x.d].slice(0, 3)}<small>${x.dt.getDate()}</small>${x.d >= auj && !x.fait ? "</button>" : "</span>"}<div>
        ${x.coach.map((cs, i) => `<div class="ms-extra ms-coach" style="--c:#2563EB"><span><b>📣 ${echap(cs.titre)}</b><small>${L("Séance du coach", "Coach workout")} · ${echap(cs.club)}</small></span>${cs.fait ? `<span class="fait">✓</span>` : `<button class="toggle" data-cgo="${x.d}:${i}" aria-label="${L("Lancer", "Start")}">▶</button>${x.d <= auj ? `<button class="ms-retirer" data-cfait="${x.d}:${i}">✅ ${L("Fait", "Done")}</button>` : ""}`}</div>`).join("")}
        ${x.clubs.map(c => `<button class="ms-club-b" data-note="${c.sp}" data-j="${x.j}" aria-label="${L("Noter la séance de club", "Log the club session")}">${L(...SP[c.sp].nom)} · ${L(...c.nom)}${c.note ? " ✓" : ""}</button>`).join("")}
        ${x.retire && x.d >= auj ? `<b>${L("Séance retirée", "Session removed")}</b><small>${L("Tu as allégé ta semaine.", "You lightened your week.")}</small><span class="ms-liens"><button class="ms-retirer" data-on="${x.j}">↺ ${L("Remettre", "Put back")}</button>${changer}</span>`
        : S && x.avance ? `<b>${S.t}</b><small>${L("Déjà faite le ", "Already done on ") + JOURS_LONGS()[(new Date(x.avance + "T12:00").getDay() + 6) % 7]} ✓ · ${L("ce jour reste libre", "this day stays free")}</small>`
        : S ? `<b>${x.mob ? "🧘 " : ""}${S.t}</b><small>${x.mob ? x.mob.r : S.s}${x.perso && x.perso.note ? " · " + x.perso.note : ""}${etat(x)}</small><span class="ms-liens">${changer}${ajouter}${retirable ? `<button class="ms-retirer" data-off="${x.j}">${L("Retirer", "Remove")}</button>` : ""}${liensSuivi(x, S)}</span>` : x.clubs.length ? (x.avant && x.d >= auj ? `<button class="ms-avant" data-avant="${x.d}">🧘 ${L("10 min de mobilité avant le club", "10 min of mobility before the club")}</button>` : "") + (changer ? `<span class="ms-liens">${changer.replace(L("Changer", "Change"), "+ " + L("Ajouter une séance", "Add a session"))}</span>` : "") : `${x.coach.length ? "" : `<b>${L("Repos", "Rest")}</b><small>${L("Marche, vélo tranquille ou rien du tout : ça fait partie du plan.", "A walk, an easy ride or nothing at all: it is part of the plan.")}</small>`}${changer ? `<span class="ms-liens">${changer.replace(L("Changer", "Change"), "+ " + L("Ajouter une séance", "Add a session"))}</span>` : ""}`}
        ${x.extras.map((e, i) => `<div class="ms-extra" style="--c:${e.s.c}"><span><b>+ ${e.s.t}</b><small>${e.s.s}${e.dep ? "" : " · " + L("ajoutée par toi", "added by you")}${e.note}</small></span>${e.dep && W.jours.find(z => z.j === e.dep).ok ? `<span class="fait">✓</span>` : futur ? `<button class="toggle" data-xgo="${x.d}:${i}" aria-label="${L("Lancer", "Start")}">▶</button><button class="ms-retirer" ${e.dep ? `data-xdep="${e.dep}"` : `data-xdel="${x.j}:${i}"`} aria-label="${L("Enlever cette séance ajoutée", "Remove this added session")}">✕</button>` : ""}</div>`).join("")}
      </div>${x.ok ? `<span class="fait">✓</span>` : lance ? `<button class="toggle" data-go="${x.d}">${x.d === auj ? L("Lancer", "Start") : "▶"}</button>` : ""}</li>`; }).join("")}</ul>
    ${W.notes.length ? `<div class="carnet ms-notes"><h3>🔀 ${L("Ce qui a été adapté", "What was adapted")}</h3><ul class="prog-obj">${W.notes.map(n => `<li>${n}</li>`).join("")}</ul></div>` : ""}
    <button class="primary" id="msValider">✓ ${L("Valider ma semaine", "Confirm my week")}</button>
    ${W.sports.length ? `<p class="sh-aide">${L("Touche une séance de club pour noter ce que tu as vraiment fait (ou qu’elle n’a pas eu lieu) : la semaine et ta batterie s’adaptent.", "Tap a club session to log what you actually did (or that it didn’t happen): your week and battery adapt.")}</p>` : ""}
    ${jp.length ? `<button class="primary" id="plIcs">🔔 ${L("Ajouter les rappels à mon agenda", "Add reminders to my calendar")}</button><div id="plNotif"></div><p class="sh-aide" id="plIcsAide">${L("Crée un rendez-vous chaque semaine dans l’agenda de ton téléphone, avec une alerte 15 minutes avant.", "Creates a weekly event in your phone’s calendar, with an alert 15 minutes before.")}</p>` : ""}`;
  const lancer = S => { S.go(); if (routine) routine.retour = () => ouvrirPlanning(planningRetourVers); };   // la séance lancée d'ici revient à Ma semaine
  Z.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { const x = W.jours[+b.dataset.go]; lancer(x.perso ? x.perso.s : x.mob.s); });
  Z.querySelectorAll("[data-avant]").forEach(b => b.onclick = () => lancer(W.jours[+b.dataset.avant].avant));
  // retirer, remettre, choisir : on ne garde que la semaine en cours ; retirer annule un choix, choisir annule un retrait
  const semaineSeule = o => Object.fromEntries(Object.entries(o).filter(([k, x]) => x && k >= jourCle(lundi())));
  const garderJour = (j, off, remp) => { const Q = lirePlan(); Q.off = semaineSeule({ ...Q.off, [j]: off }); Q.remp = semaineSeule({ ...Q.remp, [j]: remp }); stocker("planning", JSON.stringify(Q)); listeSemaine(); };
  const garderOff = (j, v) => garderJour(j, v, v ? "" : (lirePlan().remp || {})[j]);
  Z.querySelectorAll("[data-chg]").forEach(b => b.onclick = () => choisirJour(W, W.jours[+b.dataset.chg], garderJour));
  const garderAjout = (j, f) => { const Q = lirePlan(), A = { ...(Q.ajout || {}), [j]: f(((Q.ajout || {})[j] || []).slice()) }; Q.ajout = Object.fromEntries(Object.entries(A).filter(([k, l]) => l.length && k >= jourCle(lundi()))); stocker("planning", JSON.stringify(Q)); listeSemaine(); };
  Z.querySelectorAll("[data-add]").forEach(b => b.onclick = () => choisirJour(W, W.jours[+b.dataset.add], (j, off, v) => garderAjout(j, l => [...l, v]), 1));
  Z.querySelectorAll("[data-xdel]").forEach(b => b.onclick = () => { const [j, i] = b.dataset.xdel.split(":"); garderAjout(j, l => l.filter((_, k) => k !== +i)); });
  Z.querySelectorAll("[data-xgo]").forEach(b => b.onclick = () => { const [d, i] = b.dataset.xgo.split(":").map(Number); lancer(W.jours[d].extras[i].s); });
  Z.querySelectorAll("[data-off]").forEach(b => b.onclick = () => garderOff(b.dataset.off, 1));
  // séances du coach : lancer (retour à Ma semaine) ou cocher, et planning du club proposé (appliquer ou garder ses réglages)
  const cs = v => { const [d, i] = v.split(":").map(Number); return W.jours[d].coach[i]; };
  Z.querySelectorAll("[data-cgo]").forEach(b => b.onclick = () => { const s = cs(b.dataset.cgo); lancer({ go: () => lancerSeanceCoach(s.c, s) }); });
  Z.querySelectorAll("[data-cfait]").forEach(b => b.onclick = async () => { const s = cs(b.dataset.cfait); b.disabled = true; const ok = await cocherSeanceCoach(s.c, s, true); listeSemaine();
    bulleMs(ok ? L("Séance validée : ton coach la voit cochée.", "Workout confirmed: your coach sees it ticked.") : L("Séance validée sur ton téléphone : elle sera envoyée à ton coach à la prochaine connexion.", "Workout confirmed on your phone: it will be sent to your coach next time you are online.")); });
  const finProp = (i, ok) => { const Q = lireJSON("clubSemaine", {}), x = props[i]; if (ok) appliquerPlanningClub(x.c, x.sp, x); else Q.ignore = { ...(Q.ignore || {}), [x.c + x.sp]: x.sig };
    Q.propose = (Q.propose || []).filter(y => y.sig !== x.sig || y.c !== x.c); stocker("clubSemaine", JSON.stringify(Q)); renduPlanning(); };
  Z.querySelectorAll("[data-papp]").forEach(b => b.onclick = () => finProp(+b.dataset.papp, 1));
  Z.querySelectorAll("[data-pign]").forEach(b => b.onclick = () => finProp(+b.dataset.pign, 0));
  // suivi : valider à la main, relancer, refaire ou déplacer une séance (semaine en cours seulement)
  const majSuivi = (f, msg) => { const Q = lirePlan(); f(Q); stocker("planning", JSON.stringify(Q)); listeSemaine(); if (msg) bulleMs(msg); };
  Z.querySelectorAll("[data-coche]").forEach(b => b.onclick = () => majSuivi(Q => Q.fait = semaineSeule({ ...Q.fait, [b.dataset.coche]: 1 }), L("Séance validée : bien joué !", "Session confirmed: well done!")));
  Z.querySelectorAll("[data-decoche]").forEach(b => b.onclick = () => majSuivi(Q => Q.fait = semaineSeule({ ...Q.fait, [b.dataset.decoche]: 0 })));
  Z.querySelectorAll("[data-xdep]").forEach(b => b.onclick = () => majSuivi(Q => Q.dep = semaineSeule({ ...Q.dep, [b.dataset.xdep]: "" })));
  Z.querySelectorAll("[data-rgo], [data-re]").forEach(b => b.onclick = () => lancer(W.jours[+(b.dataset.rgo || b.dataset.re)].perso.s));
  Z.querySelectorAll("[data-dep]").forEach(b => b.onclick = () => { const x = W.jours[+b.dataset.dep];
    ouvrirFeuilleInfo(L("Déplacer la séance du ", "Move the session from ") + JOURS_LONGS()[x.d], `<p class="sh-aide">${x.perso.s.t}</p><div class="ms-choix">${W.jours.filter(y => y.d >= auj).map(y => `<button class="jr-opt" style="--c:${x.perso.s.c}" data-dj="${y.j}"><span><b>${JOURS_LONGS()[y.d]}${y.d === auj ? " · " + L("aujourd’hui", "today") : ""}</b><small>${y.perso && y.perso.s ? L("en plus de : ", "on top of: ") + y.perso.s.t : y.clubs.length ? L("jour de club : attention à la charge", "club day: watch the load") : L("jour libre", "free day")}</small></span><i aria-hidden="true">›</i></button>`).join("")}</div>`);
    document.querySelectorAll("[data-dj]").forEach(c => c.onclick = () => { fermerFeuille(); majSuivi(Q => Q.dep = semaineSeule({ ...Q.dep, [x.j]: c.dataset.dj }), L("Séance déplacée au ", "Session moved to ") + nomJourCle(c.dataset.dj)); }); });
  Z.querySelectorAll("[data-on]").forEach(b => b.onclick = () => garderOff(b.dataset.on, 0));
  $("msValider").onclick = () => { const Q = lirePlan(); Q.valide = jourCle(); stocker("planning", JSON.stringify(Q)); if (typeof majRappelSW === "function") majRappelSW();
    retour(() => ecran("menu", () => scrollTo(0, 0))); bulleMs(L("Semaine validée : l’accueil, les rappels et ta batterie suivent ce plan.", "Week confirmed: home, reminders and your battery follow this plan.")); };
  Z.querySelectorAll("[data-note]").forEach(b => b.onclick = () => feuilleClub(b.dataset.j, b.dataset.note, renduPlanning));
  if ($("plIcs")) { $("plIcs").onclick = exporterIcs; blocRappel(); majRappelSW(); }
}
// choix de l'entraînement d'un jour : les types, les séances du parcours de chaque sport de club, revenir au plan ou repos
function choisirJour(W, x, garderJour, ajout) {   // ajout : séance en plus de celle du jour (sans repos ni retour au prévu)
  const niv = lireNiv(), ops = TYPES_PERSO.map(([k, f, e]) => ["type:" + k, L(f, e), objType(k, W.sports, niv)]);
  W.sports.forEach(sp => { const S = spSemaine(sp); if (S) [...new Set(S.jours.flatMap(j => j.l).filter(c => SP[sp].S[c]))].forEach(c => ops.push(["sp:" + sp + ":" + c, L(...SP[sp].nom) + " · " + L(...SP[sp].S[c].t), objSport(sp, c)])); });
  const bt = (v, t, s, c) => `<button class="jr-opt" style="--c:${c || "var(--brand)"}" data-ch="${v}"><span><b>${t}</b>${s ? `<small>${s}</small>` : ""}</span><i aria-hidden="true">›</i></button>`;
  ouvrirFeuilleInfo((ajout ? L("Ajouter une séance le ", "Add a session on ") : L("Entraînement du ", "Workout for ")) + JOURS_LONGS()[x.d], `${x.clubs.length ? `<p class="sh-aide">${L("Jour de club : préfère une séance légère (gainage, mobilité, technique).", "Club day: prefer a light session (core, mobility, technique).")}</p>` : ""}
    <div class="ms-choix">${ops.map(([v, t, S]) => bt(v, t, S.s + (S.dur ? " · " + L("dure", "hard") : " · " + L("légère", "light")), S.c)).join("")}
    ${ajout ? "" : (x.choisi ? bt("", "↺ " + L("Revenir à la séance prévue", "Back to the planned session"), "") : "") + bt("off", "✕ " + L("Repos ce jour-là", "Rest that day"), "")}</div>`);
  document.querySelectorAll("[data-ch]").forEach(b => b.onclick = () => { const v = b.dataset.ch; fermerFeuille(); v === "off" ? garderJour(x.j, 1, "") : garderJour(x.j, 0, v); });
}
/* --- Bilan de la semaine : sur l'accueil le dimanche (semaine en cours) et le lundi (semaine passée), jusqu'à ce qu'il soit lu --- */
function bilanSemaine() {
  const auj = jourSemaine(), L0 = auj === 0 ? plusJ(lundi(), -7) : lundi(), a = jourCle(L0), z = jourCle(plusJ(L0, 6)), avant = jourCle(plusJ(L0, -7)), h = lireHist(), P = lirePlan();
  if (!(auj === 6 || auj === 0) || P.bilanVu === a || !((P.jours || []).length || sportsClub().length)) return null;
  const faites = h.filter(e => e.j >= a && e.j <= z).length, clubs = clubsEntre(a, z), notes = clubs.filter(c => c.note).length, ch = chargeEntre(h, a, z), chAvant = chargeEntre(h, avant, jourCle(plusJ(L0, -1)));
  const F = lireForme(), bat = Array.from({ length: 7 }, (_, k) => jourCle(plusJ(L0, k))).filter(j => F[j]).map(j => batterie(j, F, h)).filter(Boolean).map(b => b.v);
  return { a, suiv: jourCle(plusJ(L0, 7)), faites, prevues: (P.jours || []).length, clubs: clubs.length, notes, ch, evol: chAvant ? Math.round((ch / chAvant - 1) * 100) : null, bat: bat.length ? Math.round(bat.reduce((t, v) => t + v, 0) / bat.length) : null, dure: clubs.filter(c => c.dur).length };
}
// bilan affiché dans une feuille ouverte depuis la tuile « Semaine » de Ma forme ; sans Z, on masque seulement l'ancienne carte séparée
function carteBilan(Z) {
  const D = $("bilanCarte"); if (D) D.hidden = true; const B = Z && bilanSemaine(); if (!B) return;
  // conseil : alléger si la charge a bondi ou si la batterie est restée basse
  const lourd = (B.evol !== null && B.evol > 30) || (B.bat !== null && B.bat < 50);
  Z.innerHTML = `<strong>📊 ${L("Bilan de ta semaine", "Your week in review")}</strong>
    <ul class="bilan-l"><li>${L("Séances avec l’appli", "Workouts with the app")} : <b>${B.faites}</b>${B.prevues ? " / " + B.prevues + " " + L("prévues", "planned") : ""}</li>
      ${B.clubs ? `<li>${L("Séances de club", "Club sessions")} : <b>${B.clubs}</b>${B.dure ? ` (${B.dure} ${L("dures", "hard")})` : ""} · ${B.notes} ${L("notée(s)", "logged")}</li>` : ""}
      <li>${L("Charge", "Load")} : <b>${B.ch}</b>${B.evol !== null ? ` (${B.evol > 0 ? "+" : ""}${B.evol} % ${L("par rapport à la semaine d’avant", "vs the week before")})` : ""}</li>
      ${B.bat !== null ? `<li>${L("Batterie moyenne", "Average battery")} : <b>${B.bat} %</b></li>` : ""}</ul>
    <small>${lourd ? L("Ta semaine a été chargée : une semaine plus légère t’aidera à progresser sans te blesser.", "Your week was heavy: a lighter week will help you progress without getting hurt.") : L("Bel équilibre : tu peux garder le même rythme.", "Good balance: you can keep the same pace.")}</small>
    <div class="bilan-b"><button class="${lourd ? "toggle" : "primary"}" id="biGarder">${L("Garder le même rythme", "Keep the same pace")}</button><button class="${lourd ? "primary" : "toggle"}" id="biAlleger">${L("Alléger la semaine prochaine", "Lighten next week")}</button></div>`;
  const fin = allege => { const Q = lirePlan(); Q.bilanVu = B.a; if (allege) Q.allege = B.suiv; else if (Q.allege === B.suiv) delete Q.allege; stocker("planning", JSON.stringify(Q)); fermerFeuille(); majSemaine();
    bulleMs(allege ? L("C’est noté : la semaine prochaine sera allégée.", "Noted: next week will be lighter.") : L("C’est noté : même rythme la semaine prochaine.", "Noted: same pace next week.")); };
  $("biGarder").onclick = () => fin(0); $("biAlleger").onclick = () => fin(1);
}
// petit message de confirmation, lu par les lecteurs d'écran
function bulleMs(t) { const b = document.createElement("div"); b.className = "ms-bulle"; b.setAttribute("role", "status"); b.textContent = t; document.body.appendChild(b); setTimeout(() => b.remove(), 3200); }
// carte de l'accueil un jour sans séance perso, quand il y a des clubs ou un programme : le club du jour ou la mobilité prévue
function carteJourComplet(Z) {
  if (!modeComplet()) return false;
  const x = semaineComplete().jours[jourSemaine()]; if (x.perso) return false;
  const S = x.mob ? x.mob.s : x.clubs.length ? x.avant : null, c = x.clubs[0];
  Z.innerHTML = `<button class="sc-corps" id="scOuvrir" style="--c:${S ? S.c : "var(--muted)"}"><span class="sc-ico">${c ? "🏟️" : x.mob ? "🧘" : "🌙"}</span><span><strong>${c ? L("Aujourd’hui : club", "Today: club") + " · " + x.clubs.map(k => L(...SP[k.sp].nom) + " " + L(...k.nom).toLowerCase()).join(" + ") : x.mob ? L("Aujourd’hui", "Today") + " · " + S.t : L("Aujourd’hui : repos", "Today: rest")}</strong><small>${c ? L("10 min de mobilité avant, si tu veux", "10 min of mobility before, if you like") : x.mob ? x.mob.r : L("Ça fait partie du plan.", "It is part of the plan.")}</small></span></button>${S && !x.fait ? `<button class="sc-go" id="scGo" aria-label="${L("Lancer", "Start")}">${ico("lecture")}</button>` : ""}`;
  if ($("scGo")) $("scGo").onclick = e => { e.stopPropagation(); S.go(); };
  $("scOuvrir").onclick = () => ouvrirPlanning("menu");
  return true;
}
$("semaineCarte").insertAdjacentHTML("beforebegin", `<div class="semaine-carte bilan-carte" id="bilanCarte" hidden></div>`);
$("semaineCarte").insertAdjacentHTML("afterend", `<div class="semaine-carte" id="suiviCarte" hidden></div>`);
// carte de l'accueil : où en est la semaine, ce qui reste et ce qui est à rattraper ; elle ouvre Ma semaine
// tuile « Semaine » de Ma forme (accueil) : séances faites, à rattraper, bilan à lire ; l'ancienne carte séparée reste masquée
function tuileSemaine() {
  const S = $("suiviCarte"); if (S) S.hidden = true; const b = $("fbSem"); if (!b) return;
  const P = lirePlanning(), CS = lireJSON("clubSemaine", {}), Bi = bilanSemaine(), U = (P && ((P.jours || []).length || modeComplet(lirePlan()))) || (CS.clubs || []).some(c => (c.seances || []).length) ? suiviSemaine() : null;
  const pro = U && (U.suite.find(e => !e.c && e.d > jourSemaine()) || U.suite.find(e => e.d > jourSemaine()));
  $("fbSemV").textContent = Bi ? "📊 " + L("Bilan", "Review") : U && U.prevues ? `${U.faites} / ${U.prevues}` : L("Ma semaine", "My week");
  $("fbSemS").textContent = Bi ? L("de ta semaine, à lire", "of your week, to read") : !U || !U.prevues ? L("à planifier", "to plan") : U.retard.length ? `⚠️ ${U.retard.length} ${L("à rattraper", "to catch up")}`
    : U.faites === U.prevues ? "🎉 " + L("tout est fait", "all done") : pro ? L("prochaine : ", "next: ") + JOURS_LONGS()[pro.d] : L("séances faites", "sessions done");
  b.style.setProperty("--c", Bi || (U && U.retard.length) ? "#F59E0B" : "var(--brand)");
  b.onclick = () => Bi ? feuilleBilan() : ouvrirPlanning("menu");
}
const carteSuivi = tuileSemaine;
function feuilleBilan() { ouvrirFeuilleInfo(L("Bilan de ta semaine", "Your week in review"), `<div class="semaine-carte bilan-carte" id="bilanFeuille"></div>`); carteBilan($("bilanFeuille")); }
