/* ============ PROGRÈS, TROPHÉES, COACH, CÉLÉBRATION, FAVORIS, PROGRAMMES ============
   Tout reste sur le téléphone (localStorage) : historique, favoris, avancement des programmes, trophées. */
const L = (fr, en) => LANGUE === "en" ? en : fr;
let totalPrevu = 0;
const lireHist = () => lireJSON("historique", []);
const minutes = h => Math.round(h.reduce((t, x) => t + x.s, 0) / 60);
function series(h) {   // série en cours (jusqu'à aujourd'hui ou hier) et meilleure série ; un joker par semaine pardonne un jour sans séance
  const jours = [...new Set(h.map(x => x.j))].map(j => Date.UTC(...j.split("-").map((v, i) => i === 1 ? v - 1 : +v)) / 864e5).sort((a, b) => a - b);
  let best = 0, cur = 0, prec = null, jk = null; const sem = d => Math.floor((d + 3) / 7), joker = d => sem(d) !== jk && ((jk = sem(d)), true);   // jk : semaine du dernier joker dépensé
  jours.forEach(d => { cur = prec !== null && (d - prec === 1 || (d - prec === 2 && joker(d - 1))) ? cur + 1 : 1; best = Math.max(best, cur); prec = d; });
  const auj = jourNum() + Date.UTC(2026, 9, 22) / 864e5;
  return { cur: prec !== null && (auj - prec <= 1 || (auj - prec === 2 && joker(auj - 1))) ? cur : 0, best, joker: jk === sem(auj) };
}
function statsGlobales() {
  const h = lireHist(), sr = series(h), parJour = {};
  h.forEach(x => (parJour[x.j] = parJour[x.j] || new Set()).add(x.m));
  return { h, n: h.length, min: minutes(h), serie: sr.cur, best: sr.best,
    defis: new Set(h.filter(x => x.k === "defi").map(x => x.j)).size,
    sports: new Set(h.filter(x => x.c && CATS[x.c]).map(x => x.c)).size,
    compte: m => h.filter(x => x.m === m).length, reprise: h.filter(x => x.b).length,
    matin: h.some(x => x.hr < 8), soir: h.some(x => x.hr >= 22),
    muscles: lireJSON("musclesLus", []).length, favoris: lireJSON("favoris", []).length,
    progSeances: h.filter(x => x.p).length, progFini: PROGRAMMES.some(([id]) => progAvance(id) >= NB_PROG),
    complet: Object.values(parJour).some(m => m.has("echauffement") && ["seance", "salle", "tabata"].some(x => m.has(x)) && (m.has("calme") || m.has("souffle"))) };
}
// [id, nom FR, nom EN, condition FR, condition EN, niveau 1 bronze 2 argent 3 or, étiquette, test]
const TROPHEES = [
  ["premier", "Premier pas", "First step", "Termine ta première séance", "Finish your first workout", 1, "1", S => S.n >= 1],
  ["s10", "Habitué", "Regular", "10 séances terminées", "10 workouts done", 1, "10", S => S.n >= 10],
  ["s50", "Assidu", "Dedicated", "50 séances terminées", "50 workouts done", 2, "50", S => S.n >= 50],
  ["s100", "Centurion", "Centurion", "100 séances terminées", "100 workouts done", 3, "100", S => S.n >= 100],
  ["j3", "Lancé", "On a roll", "3 jours d’affilée", "3 days in a row", 1, "3j", S => S.best >= 3],
  ["j7", "Semaine parfaite", "Perfect week", "7 jours d’affilée", "7 days in a row", 2, "7j", S => S.best >= 7],
  ["j30", "Inarrêtable", "Unstoppable", "30 jours d’affilée", "30 days in a row", 3, "30j", S => S.best >= 30],
  ["h1", "Première heure", "First hour", "60 minutes d’entraînement au total", "60 minutes of training in total", 1, "1h", S => S.min >= 60],
  ["h10", "Endurant", "Enduring", "10 heures d’entraînement au total", "10 hours of training in total", 3, "10h", S => S.min >= 600],
  ["d1", "Défi relevé", "Challenge accepted", "Réussis un défi du jour", "Complete a daily challenge", 1, "★", S => S.defis >= 1],
  ["d10", "Chasseur d’étoiles", "Star hunter", "10 défis du jour réussis", "10 daily challenges completed", 2, "10★", S => S.defis >= 10],
  ["d30", "Mois en or", "Golden month", "30 défis du jour réussis", "30 daily challenges completed", 3, "30★", S => S.defis >= 30],
  ["sports", "Touche-à-tout", "All-rounder", "Essaie 5 sports différents", "Try 5 different sports", 2, "5", S => S.sports >= 5],
  ["salle", "En salle", "Gym time", "Termine une séance de musculation", "Finish a gym workout", 1, "🏋", S => S.compte("salle") >= 1 || S.h.some(x => x.g)],
  ["tabata", "Tabata", "Tabata", "Termine un Tabata", "Finish a Tabata", 1, "⏱", S => S.compte("tabata") >= 1 || S.h.some(x => x.tb)],
  ["zen", "Zen", "Zen", "Termine une séance de cohérence cardiaque", "Finish a coherent breathing session", 1, "☯", S => S.compte("souffle") >= 1],
  ["souple", "Souplesse", "Flexibility", "5 séances d’étirements", "5 stretching sessions", 2, "5", S => S.compte("calme") >= 5],
  ["reprise", "De retour", "Back in action", "Termine une séance de retour au sport après blessure", "Finish a back-to-sport-after-injury session", 1, "+", S => S.reprise >= 1],
  ["complet", "Journée complète", "Full day", "Échauffement, séance et retour au calme le même jour", "Warm-up, workout and cool-down on the same day", 2, "3/3", S => S.complet],
  ["matin", "Lève-tôt", "Early bird", "Une séance avant 8 h", "A workout before 8 am", 1, "☀", S => S.matin],
  ["soir", "Oiseau de nuit", "Night owl", "Une séance après 22 h", "A workout after 10 pm", 1, "☾", S => S.soir],
  ["muscles", "Anatomiste", "Anatomist", "Lis 10 fiches « muscle du jour »", "Read 10 “muscle of the day” cards", 2, "10", S => S.muscles >= 10],
  ["favori", "Sur mesure", "Tailor-made", "Enregistre une séance favorite", "Save a favourite workout", 1, "♥", S => S.favoris >= 1],
  ["prog", "En route", "On the way", "Termine 7 séances d’un programme", "Finish 7 programme sessions", 1, "7", S => S.progSeances >= 7],
  ["progFini", "Programme accompli", "Programme complete", "Termine un programme de 4 semaines", "Finish a 4-week programme", 3, "4s", S => S.progFini]
];
const NIVEAUX = [, ["#F2B48A", "#C26A35", "#8A4A22"], ["#F1F5F9", "#A7B3C2", "#6B7A8F"], ["#FFE58A", "#F5B301", "#B45309"]];
function medaille(t, k = 0) {
  const [c1, c2, c3] = NIVEAUX[t[5]], g = "md" + t[0] + k;
  return `<div class="medal"><svg viewBox="0 0 66 74"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs>
    <path d="M20 50l-6 22 9-5 6 7 4-20zM46 50l6 22-9-5-6 7-4-20z" fill="#E11D48"/><path d="M20 50l-6 22 9-5 6 7 4-20z" fill="#BE123C" opacity=".5"/>
    <circle cx="33" cy="32" r="28" fill="${c3}"/><circle cx="33" cy="30" r="28" fill="url(#${g})"/><circle cx="33" cy="30" r="21" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 3"/></svg><span class="lbl">${t[6]}</span></div>`;
}
function verifierTrophees() {   // renvoie les trophées débloqués à l'instant
  const S = statsGlobales(), deja = lireJSON("trophees", {}), neufs = TROPHEES.filter(t => !deja[t[0]] && t[7](S));
  neufs.forEach(t => deja[t[0]] = jourCle());
  stocker("trophees", JSON.stringify(deja));
  return neufs;
}

/* --- Coach vocal : encouragements à mi-parcours et à 10 secondes de la fin --- */
let coachActif = true;
try { coachActif = localStorage.getItem("coach") !== "0"; } catch (e) {}
const COACH = {
  fr: { mi: ["Mi-parcours, continue comme ça !", "La moitié est faite, garde le rythme !", "Tu es à mi-chemin, ne lâche rien !", "Super, encore la moitié !"],
        fin: ["Plus que 10 secondes, tiens bon !", "Dix secondes, tout donner !", "Allez, c'est la fin, encore 10 secondes !", "Dernier effort, 10 secondes !"],
        calmeMi: ["Respire profondément, relâche les épaules.", "Laisse le muscle s'allonger doucement."], calmeFin: ["Encore quelques secondes, respire calmement."],
        douxMi: ["C’est bien, continue à ton rythme.", "La moitié, le corps se réchauffe."], douxFin: ["Encore 10 secondes, tranquillement.", "Plus que 10 secondes, sans forcer."] },
  en: { mi: ["Halfway there, keep it up!", "Half done, keep the pace!", "You're halfway, don't give up!", "Great, half to go!"],
        fin: ["Ten seconds left, hold on!", "Ten seconds, give it everything!", "Come on, almost done, ten more seconds!", "Last push, ten seconds!"],
        calmeMi: ["Breathe deeply, relax your shoulders.", "Let the muscle lengthen gently."], calmeFin: ["A few more seconds, breathe calmly."],
        douxMi: ["Good, keep your own pace.", "Halfway, your body is warming up."], douxFin: ["Ten more seconds, easy does it.", "Ten seconds left, no need to push."] }
};
const auHasard = t => t[Math.floor(Math.random() * t.length)];
COACH.fr.go = ["À fond !", "Allez, tout donner !", "Intensité maximale !", "C’est parti, ne lâche rien !"];
COACH.en.go = ["All out!", "Come on, give it everything!", "Maximum intensity!", "Go, don’t give up!"];
function annonce(e, prec, repos) {   // nom de l'exercice, précédé du bloc quand il change, suivi d'un encouragement en Tabata
  const bloc = e.bn && (!prec || prec.bn !== e.bn) && langueVoix === LANGUE ? e.bn.replace(/\s*\d+\/\d+$/, "") + ". " : "";
  return bloc + dire(e) + (posture(e.id) ? (langueVoix === "fr" ? ". Tiens la position" : ". Hold the position") : "") + (e.series ? PH("serie") + e.serie : "") + (!repos && routine.tbt && e.duree <= 20 && coachActif ? ". " + auHasard(COACH[langueVoix].go) : "");
}
/* Consignes de posture (consignes.js) : placement, mouvement, point de vigilance, réparties pendant l'exercice
   (jamais dans les 10 dernières secondes ni au changement de côté). Séries ou tours suivants : seulement le point de vigilance. */
let conseilsActifs = true, planConseils = {}, conseilDejaDit = -1;
try { conseilsActifs = localStorage.getItem("conseils") !== "0"; } catch (e) {}
const consignes = id => typeof CONSIGNES !== "undefined" && CONSIGNES[id] ? CONSIGNES[id][langueVoix === "fr" ? 0 : 1].split("|") : [];
function programmerConseils(e, dejaDit) {   // une consigne toutes les 8 à 14 s ; s'il manque de place, on garde placement et vigilance
  planConseils = {}; $("conseil").textContent = "";
  const c = consignes(e.id), d = e.duree, bas = d >= 25 ? 16 : 9, h = d - 6;   // après l'annonce du nom, avant « plus que 10 secondes »
  if (!c.length || d < 12) return;
  const idx = (e.serie > 1 || e.t > 1 || e.autreCote) ? [2] : dejaDit ? [1, 2] : [0, 1, 2];
  while (idx.length > 1 && (h - bas) / (idx.length - 1) < 8) idx.splice(idx.includes(1) ? idx.indexOf(1) : idx.length - 1, 1);
  const pas = idx.length > 1 ? Math.min(14, (h - bas) / (idx.length - 1)) : 0;
  let der = 1e9;   // pas juste avant ni juste après le changement de côté, et 7 s d'écart au moins entre deux consignes
  idx.forEach((k, j) => { let r = h - Math.round(j * pas); const ic = j ? instantsCh(e).find(x => r - x > -3 && r - x < 7) : undefined; if (ic !== undefined) r = ic - 3; if (r >= bas && der - r >= 7) planConseils[der = r] = c[k]; });
}
function direConseil(r) {
  const t = conseilsActifs && planConseils[r]; if (!t) return false;
  $("conseil").textContent = t; parler(t, 0, 1); return voixActive;
}
const tonPhase = e => mode === "calme" || /calme|cool|récup|recovery|étirement|stretch|respir|breath|relax/i.test(e.bn || "") ? "calme"
  : mode === "echauffement" || /échauff|warm|mobilis|mobility|élever|raise|activer|activate|approche|préparer|prepare/i.test(e.bn || "") ? "doux" : "fort";
function coach(e, r) {
  if (!coachActif || !voixActive || e.duree < 20) return;
  const P = COACH[langueVoix], ton = tonPhase(e), calme = ton === "calme", ph = k => P[ton === "fort" ? k : ton + k[0].toUpperCase() + k.slice(1)];
  if (r === Math.floor(e.duree / 2) && (e.duree >= 30 || calme) && !coteDe(e.id) && !(conseilsActifs && Object.keys(planConseils).length)) parler(auHasard(ph("mi")), 0, 1);
  else if (r === 10 && e.duree >= 25) parler(auHasard(ph("fin")), 0, 1);
  else if (r >= 1 && r <= 3 && !calme && e.duree >= 15) parler(String(r), 0, 1.1);
}
function majCoach() { $("coachBtn").textContent = T(coachActif ? "Activé" : "Coupé"); $("coachBtn").setAttribute("aria-pressed", coachActif); }
$("coachBtn").onclick = () => { coachActif = !coachActif; stocker("coach", coachActif ? "1" : "0"); majCoach(); if (coachActif && voixActive) parler(auHasard(COACH[langueVoix].mi), 0, 1); };
majCoach();
function majRetours() { [["sonsBtn", sonsUI, "Activés", "Coupés"], ["vibBtn", vibrations, "Activées", "Coupées"], ["conseilsBtn", conseilsActifs, "Activés", "Coupés"], ["musiqueBtn", avecMusique, "Activé", "Coupé"]].forEach(([id, v, a, b]) => { $(id).textContent = T(v ? a : b); $(id).setAttribute("aria-pressed", v); }); }
$("sonsBtn").onclick = () => { sonsUI = !sonsUI; stocker("sonsUI", sonsUI ? "1" : "0"); majRetours(); if (sonsUI) RETOURS.oui[0](); };
$("musiqueBtn").onclick = () => { avecMusique = !avecMusique; stocker("musique", avecMusique ? "1" : "0"); majSession(); majRetours(); majVerrou(); };
$("conseilsBtn").onclick = () => { conseilsActifs = !conseilsActifs; stocker("conseils", conseilsActifs ? "1" : "0"); majRetours(); };
$("vibBtn").onclick = () => { vibrations = !vibrations; stocker("vibrations", vibrations ? "1" : "0"); majRetours(); vibrer([30, 40, 30]); };
majRetours();
function majReglagesSon() { $("volSons").value = Math.round(volSons * 100); $("volVal").textContent = Math.round(volSons * 100) + " %"; Object.entries(FORCES).forEach(([id, f]) => $(id).setAttribute("aria-pressed", f === forceVib)); }
$("volSons").oninput = () => { volSons = $("volSons").value / 100; majReglagesSon(); };
$("volSons").onchange = () => { stocker("volumeSons", Math.round(volSons * 100)); RETOURS.oui[0](); };
Object.entries(FORCES).forEach(([id, f]) => $(id).onclick = () => { forceVib = f; stocker("forceVib", f); majReglagesSon(); vibrer([30, 40, 30]); });
majReglagesSon();

/* --- Célébration : confettis, médaille, bilan animé, trophées débloqués, fanfare --- */
function confettis() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("confettis"), x = c.getContext("2d"), r = devicePixelRatio || 1, W = c.width = innerWidth * r, H = c.height = innerHeight * r;
  const couleurs = ["#2F5BFF", "#F5B301", "#E11D48", "#10B981", "#A855F7", "#F97316", "#38BDF8", "#FFFFFF"];
  const P = [];
  const jet = (x0, y0, dir, n) => { for (let i = 0; i < n; i++) { const a = (dir + (Math.random() - .5) * 50) * Math.PI / 180, v = (9 + Math.random() * 11) * r;
    P.push({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, w: (6 + Math.random() * 6) * r, h: (9 + Math.random() * 8) * r, c: auHasard(couleurs), f: Math.random() < .25, osc: Math.random() * 6 }); } };
  jet(0, H, -60, 90); jet(W, H, -120, 90);
  setTimeout(() => { for (let i = 0; i < 80; i++) P.push({ x: Math.random() * W, y: -20 * r, vx: (Math.random() - .5) * 2 * r, vy: (2 + Math.random() * 3) * r, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, w: 7 * r, h: 11 * r, c: auHasard(couleurs), f: Math.random() < .3, osc: Math.random() * 6 }); }, 450);
  const t0 = performance.now();
  (function boucle(t) {
    x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .32 * r; p.vx *= .985; p.vy *= .985; p.osc += .1; p.x += p.vx + Math.sin(p.osc) * .8 * r; p.y += p.vy; p.rot += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - (t - t0 - 3200) / 1200);
      if (p.f) { x.beginPath(); x.arc(0, 0, p.w / 2, 0, 7); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.osc)), p.w, p.h * Math.abs(Math.cos(p.osc))); x.restore(); });
    if (t - t0 < 4400) requestAnimationFrame(boucle); else x.clearRect(0, 0, W, H);
  })(t0);
}
function compteur(el, fin, suffixe = "") {
  const t0 = performance.now(), d = 1100;
  (function f(t) { const k = Math.min(1, (t - t0) / d), v = Math.round(fin * (1 - Math.pow(1 - k, 3))); el.textContent = v + suffixe; if (k < 1) requestAnimationFrame(f); })(t0);
}
function celebrer() {
  const mn = Math.max(1, Math.round(totalPrevu / 60)), n = mode === "souffle" ? (routine.blocs || []).length : mode === "tabata" ? cycles : new Set(ids).size;
  const h = lireHist(); h.push({ j: jourCle(), hr: new Date().getHours(), k: routineCle, t: routine.titre, m: mode, s: totalPrevu, n, c: routine.cat || routine.grp || "", b: routine.blessure ? 1 : 0, p: routine.prog ? 1 : 0, g: routine.gym || routine.salle ? 1 : 0, tb: routine.tbt ? 1 : 0, nv: routine.niv || "", e: mode === "tabata" || mode === "souffle" ? [] : ids.slice(0, 30), ...(fc.n && { fc: Math.round(fc.somme / fc.n), fcMax: fc.max }) });
  stocker("historique", JSON.stringify(h.slice(-3000)));
  if (routine.prog) progTerminer(routine.prog, routine.progI);
  if (routine.club && typeof clubSeanceFinie === "function") clubSeanceFinie(routine);
  if (typeof apresSeance === "function") apresSeance();
  if (routine.reprise) repTerminer(routine.reprise, routine.repI);
  const S = statsGlobales(), neufs = verifierTrophees();
  $("fBilan").innerHTML = [[mn, L("minutes", "minutes")], [n, L(n > 1 ? "exercices" : "exercice", n > 1 ? "exercises" : "exercise")], [S.serie, L(S.serie > 1 ? "jours d’affilée" : "jour d’affilée", S.serie > 1 ? "days in a row" : "day in a row")]]
    .map(([v, t], k) => `<div style="--k:${k}"><b data-v="${v}">0</b><span>${t}</span></div>`).join("");
  setTimeout(() => $("fBilan").querySelectorAll("b").forEach(b => compteur(b, +b.dataset.v)), 800);
  $("fTrophees").innerHTML = blocGain() + neufs.map((t, k) => `<div class="nouveau-trophee" style="--k:${k}">${medaille(t, "n")}<div><small>${L("Nouveau trophée", "New trophy")}</small><b>${L(t[1], t[2])}</b><span>${L(t[3], t[4])}</span></div></div>`).join("");
  if (fc.n) $("fSub").textContent += " ❤️ " + L(`${Math.round(fc.somme / fc.n)} bpm en moyenne, ${fc.max} au maximum.`, `${Math.round(fc.somme / fc.n)} bpm on average, ${fc.max} max.`);
  $("fRessenti").innerHTML = blocRessenti(); brancherRessenti(); brancherEffort();
  $("fCharges").innerHTML = formCharges(); brancherCharges();
  $("fPartage").innerHTML = blocPartage(); brancherPartage();
  envoyerSante(lireHist().slice(-1)[0]).then(r => r && $("fPartage").insertAdjacentHTML("afterbegin", r));
  confettis(); majRappelSW();
  [523, 659, 784, 1047].forEach((f, i) => bip(f, i === 3 ? 600 : 160, .18, "triangle", .35 + i * .13)); vibrer([90, 60, 90, 60, 260]);
  if (neufs.length) { [1319, 1568, 2093].forEach((f, i) => bip(f, 220, .12, "sine", 1.5 + i * .1)); setTimeout(() => vibrer([40, 50, 40, 50, 40]), 1500); }
}

/* --- Mes progrès : série, chiffres clés, calendrier d'activité, semaine, historique, trophées --- */
const JOURS = () => L("LMMJVSD", "MTWTFSS").split("");
function ouvrirProgres() {
  verifierTrophees();
  const S = statsGlobales(), h = S.h, parJour = {};
  h.forEach(x => parJour[x.j] = (parJour[x.j] || 0) + x.s / 60);
  const auj = new Date(), lundi = new Date(auj); lundi.setDate(auj.getDate() - ((auj.getDay() + 6) % 7));
  const debut = new Date(lundi); debut.setDate(lundi.getDate() - 17 * 7);
  let cases = "";
  for (let k = 0; k < 18 * 7; k++) { const d = new Date(debut); d.setDate(debut.getDate() + k); const m = parJour[jourCle(d)] || 0;
    cases += `<i style="--k:${k}" class="${m ? "n" + (m < 10 ? 1 : m < 20 ? 2 : m < 40 ? 3 : 4) : ""}${jourCle(d) === jourCle() ? " auj" : ""}${d > auj ? " futur" : ""}" title="${jourCle(d)}"></i>`; }
  const sem = Array.from({ length: 7 }, (_, k) => { const d = new Date(lundi); d.setDate(lundi.getDate() + k); return Math.round(parJour[jourCle(d)] || 0); }), mx = Math.max(10, ...sem);
  const deja = lireJSON("trophees", {}), nbT = Object.keys(deja).length;
  const dernieres = h.slice(-6).reverse().map((x, k) => { const [a, mo, j] = x.j.split("-"); return `<li><span class="date">${+j}<small>${new Date(a, mo - 1, j).toLocaleDateString(L("fr-FR", "en-GB"), { month: "short" })}</small></span><div><b>${propre(x.t)}</b><small>${Math.max(1, Math.round(x.s / 60))} min · ${x.n} ${L(x.n > 1 ? "exercices" : "exercice", x.n > 1 ? "exercises" : "exercise")}</small></div><button class="h-part" data-i="${h.length - 1 - k}" aria-label="${L("Partager", "Share")}">↗</button></li>`; }).join("");
  $("prTitre").textContent = L("Mes progrès", "My progress");
  const moisDispo = [...new Set(h.map(x => x.j.slice(0, 7)))].sort().reverse(), mc = jourCle().slice(0, 7);
  $("prCorps").innerHTML = `
    <button class="recap-banniere" data-m="${mc}"><span class="play">▶</span><span><strong>${L("Ton mois en sport", "Your month in sport")}</strong><span>${nomMois(mc)} · ${L("ton récap en images", "your recap in pictures")}</span></span></button>
    ${moisDispo.filter(m => m !== mc).length ? `<div class="recap-mois-prec">${moisDispo.filter(m => m !== mc).slice(0, 6).map(m => `<button class="toggle contour" data-m="${m}">${nomMois(m)}</button>`).join("")}</div>` : ""}
    <div class="hero-serie"><span class="flamme">${$("tProgres").querySelector(".flamme").innerHTML.replace(/flG/g, "flG2")}</span><b data-v="${S.serie}">0</b><span>${L(S.serie > 1 ? "jours d’affilée" : "jour d’affilée", S.serie > 1 ? "days in a row" : "day in a row")}</span><small>${L("Meilleure série", "Best streak")} : ${S.best}</small></div>
    <div class="kpis">${[[S.n, L("séances", "workouts"), "#2F5BFF"], [S.min, L("minutes", "minutes"), "#10B981"], [S.defis, L("défis réussis", "challenges"), "#F59E0B"], [nbT + "/" + TROPHEES.length, L("trophées", "trophies"), "#E11D48"]]
      .map(([v, t, c]) => `<div class="kpi" style="--c:${c}"><b${typeof v === "number" ? ` data-v="${v}"` : ""}>${typeof v === "number" ? 0 : v}</b><span>${t}</span></div>`).join("")}</div>
    <div class="carte"><h2>${L("Cette semaine", "This week")}</h2><div class="barres">${sem.map((m, k) => `<div class="${k === (auj.getDay() + 6) % 7 ? "auj" : ""}"><b>${m || ""}</b><i style="--h:${m / mx * 100}%;--k:${k}"></i>${JOURS()[k]}</div>`).join("")}</div></div>
    <div class="carte"><h2>${L("4 derniers mois", "Last 4 months")}</h2><div class="chaleur">${cases}</div>
      <div class="legende-ch">${L("Moins", "Less")} <i style="background:var(--soft)"></i><i style="background:#C7D2FE"></i><i style="background:#818CF8"></i><i style="background:#4F46E5"></i><i style="background:#312E81"></i> ${L("Plus", "More")}</div></div>
    ${blocsJeu()}
    ${sectionCharges()}
    <h2 class="sec">${L("Trophées", "Trophies")} · ${nbT}/${TROPHEES.length}</h2>
    <div class="carte"><div class="trophees">${TROPHEES.map((t, k) => `<div class="trophee${deja[t[0]] ? "" : " verrou"}" style="--k:${k}">${medaille(t, "p")}<b>${L(t[1], t[2])}</b>${L(t[3], t[4])}</div>`).join("")}</div></div>
    ${dernieres ? `<h2 class="sec">${L("Dernières séances", "Recent workouts")}</h2><ul class="list historique">${dernieres}</ul>` : `<p class="vide">${L("Termine ta première séance pour allumer la flamme !", "Finish your first workout to light the flame!")}</p>`}`;
  $("prCorps").querySelectorAll("[data-m]").forEach(b => b.onclick = () => ouvrirRecap(b.dataset.m)); $("voirBilan").onclick = () => ouvrirBilan(lundiDe(), ouvrirProgres);
  document.documentElement.style.setProperty("--accent", "#F97316");
  ecran("progres");
  setTimeout(() => $("prCorps").querySelectorAll("[data-v]").forEach(b => compteur(b, +b.dataset.v)), 350);
}
function majTableau() {
  const n = statsSemaine().n;   // la série en cours est affichée une seule fois, sur la carte de vitalité ; cette tuile compte les séances de la semaine
  $("tSerie").textContent = n; $("tSerieTxt").textContent = L(n > 1 ? "séances cette semaine" : "séance cette semaine", n > 1 ? "workouts this week" : "workout this week");
  $("tProgres").classList.toggle("eteint", n === 0);
  const prec = moisPrecedent(), aRecap = lireHist().some(x => x.j.startsWith(prec)) && localStorage.getItem("recapVu") !== prec;
  let pt = $("tProgres").querySelector(".nouveau"); if (aRecap && !pt) { pt = document.createElement("i"); pt.className = "nouveau"; $("tProgres").appendChild(pt); } else if (!aRecap && pt) pt.remove();
  const enCours = PROGRAMMES.find(([id]) => progAvance(id) > 0 && progAvance(id) < NB_PROG);
  $("tProgsTxt").textContent = enCours ? L(enCours[1], enCours[2]) + " · " + L("jour", "day") + " " + (progAvance(enCours[0]) + 1) + "/" + NB_PROG : L("4 semaines guidées", "4 guided weeks");
}
$("tProgres").onclick = () => { const prec = moisPrecedent(); if ($("tProgres").querySelector(".nouveau")) ouvrirRecap(prec); else ouvrirProgres(); };
$("progresRetour").onclick = () => retour(() => ecran("menu"));

/* --- Favoris : enregistrer une séance modifiée sous un nom, la relancer en un appui --- */
const lireFav = () => lireJSON("favoris", []);
ROUTINES.perso = { type: "seance", perso: true, titre: L("Ma séance", "My workout"), titreFr: "Ma séance", detail: L("Séance créée par toi", "Workout you created"), couleur: "#E11D48", exercices: [] };
CONSEILLES.perso = ["squat", "pompes", "fente", "pont", "planche", "planchelat", "deadbug", "superman", "climbers", "burpees", "jumpingJack", "squatBarre", "benchBarre", "rowPoulie", "poulieTirage", "militaire", "dbCurl", "poulieTriceps", "hipThrust", "presseCuisses", "legCurl"];
function creerSeance() {   // nouvelle séance vierge : on ouvre directement la liste d'exercices avec la recherche
  try { localStorage.removeItem("routine_perso"); } catch (e) {}
  ouvrirRoutine("perso");
  setTimeout(() => { if ($("ajout").classList.contains("hidden")) $("ajoutBtn").click(); }, 50);
}
function majFavoris() {
  Object.keys(ROUTINES).filter(k => k.startsWith("fav_")).forEach(k => delete ROUTINES[k]);
  lireFav().forEach(f => { const b = ROUTINES[f.base]; if (!b) return;
    ROUTINES["fav_" + f.id] = { ...b, fav: f.id, base: f.base, titre: propre(f.nom), titreFr: propre(f.nom), detail: b.detail, exercices: f.ids.filter(i => EXERCICES[i]) };
    CONSEILLES["fav_" + f.id] = CONSEILLES[f.base] || f.ids; });
}
function majFavRow() {
  const f = routine && routine.fav;
  const neuve = routineCle === "perso";
  $("favBtn").textContent = L(f ? "★ Mettre à jour" : neuve ? "💾 Enregistrer ma séance" : "☆ Enregistrer", f ? "★ Update" : neuve ? "💾 Save my workout" : "☆ Save");
  $("favInfo").textContent = L(f ? "Enregistre tes modifications dans ce favori" : "Enregistre cette séance pour la relancer en un appui", f ? "Save your changes to this favourite" : "Save this workout to start it again in one tap");
  $("favForm").classList.add("hidden");
}
$("favBtn").onclick = () => {
  if (routine.fav) { const fs = lireFav(), f = fs.find(x => x.id === routine.fav); if (f) { f.ids = [...ids]; stocker("favoris", JSON.stringify(fs)); majFavoris(); }
    $("favBtn").textContent = L("✓ Enregistré", "✓ Saved"); return; }
  if (!ids.length) { $("favBtn").textContent = L("Ajoute d’abord des exercices", "Add exercises first"); return; }
  $("favForm").classList.toggle("hidden"); $("favNom").value = routineCle === "perso" ? "" : routine.titre; $("favNom").placeholder = L("Nom de ta séance", "Workout name"); $("favNom").focus(); $("favNom").select();
};
$("favOk").onclick = () => {
  const nom = propre($("favNom").value.trim() || routine.titre), fs = lireFav(), id = Date.now().toString(36);
  fs.push({ id, nom, base: routine.base || routineCle, ids: [...ids] });
  stocker("favoris", JSON.stringify(fs));
  majFavoris(); $("favForm").classList.add("hidden"); $("favBtn").textContent = L("✓ Enregistrée dans Mes séances", "✓ Saved to My workouts");
};
$("favNom").onkeydown = e => { if (e.key === "Enter") $("favOk").click(); };
function vueFavoris() {
  const c = $("choicesF"), fs = lireFav(); c.innerHTML = "";
  bouton(c, L("+ Créer une nouvelle séance", "+ Create a new workout"), L("Choisis tes exercices parmi les 160 de l’appli", "Pick your exercises from the 160 in the app"), "#E11D48", () => creerSeance());
  if (!fs.length) c.insertAdjacentHTML("beforeend", `<p class="vide">${L("Aucune séance enregistrée pour l’instant. Crée la tienne, ou touche « ☆ Enregistrer » dans l’aperçu de n’importe quelle séance.", "No saved workouts yet. Create your own, or tap “☆ Save” in any workout preview.")}</p>`);
  fs.forEach(f => { const r = ROUTINES["fav_" + f.id]; if (!r) return;
    bouton(c, propre(f.nom), (f.base === "perso" ? L("Séance perso", "Custom workout") : ROUTINES[f.base].titre) + " · " + T("{n} exercices", { n: r.exercices.length }), r.couleur, () => ouvrirRoutine("fav_" + f.id));
    const b = c.lastChild, x = document.createElement("span"); x.className = "suppFav"; x.setAttribute("role", "button"); x.textContent = "×"; x.setAttribute("aria-label", L("Supprimer", "Delete"));
    x.onclick = ev => { ev.stopPropagation(); if (!x.classList.contains("conf")) { x.classList.add("conf"); x.textContent = L("Supprimer ?", "Delete?"); setTimeout(() => { x.classList.remove("conf"); x.textContent = "×"; }, 3000); return; }
      stocker("favoris", JSON.stringify(lireFav().filter(y => y.id !== f.id))); try { localStorage.removeItem("routine_fav_" + f.id); } catch (e) {} majFavoris(); vueFavoris(); };
    b.appendChild(x); });
  vue("choicesF", "favoris", L("Mes séances", "My workouts"), L("Tes séances créées ou enregistrées, prêtes à lancer.", "Your created or saved workouts, ready to go."));
}
majFavoris();
bouton($("choicesP"), "Mes séances enregistrées", "Tes séances créées ou modifiées, prêtes à lancer", "#DB2777", () => vueFavoris());
bouton($("choicesP"), "Planifier ma séance", "Choisis tes exercices, règle durées et repos, enregistre ta séance", "#E11D48", () => creerSeance());
$("choicesP").prepend($("choicesP").children[$("choicesP").children.length - 2]); $("choicesP").prepend($("choicesP").lastChild);

/* --- Programmes de 4 semaines : une séance par jour, périodisée comme un vrai plan d'entraînement ---
   Semaine 1 adaptation · 2 développement · 3 intensification · 4 récupération et bilan (décharge, test final le jour 28).
   Chaque séance : échauffement → corps de séance en tours → retour au calme, avec un effort ressenti visé (RPE 1-10). */
const NB_PROG = 28;
const PTYPES = {   // couleur, nom, objectif, RPE par semaine
  force: ["#2F5BFF", "Renforcement", "Strength", "Gagner en force et en tonus, mouvement contrôlé : 2 s pour descendre, 1 s pour remonter.", "Build strength and tone with control: 2 s down, 1 s up.", [6, 7, 8, 5]],
  cardio: ["#E11D48", "Cardio", "Cardio", "Améliorer ton endurance : un rythme soutenu mais régulier, tu dois pouvoir dire quelques mots.", "Build endurance: a steady, sustained pace, you should still be able to say a few words.", [6, 7, 7, 5]],
  hiit: ["#F97316", "Fractionné", "Intervals", "Des efforts courts et intenses suivis de récupération : c’est l’un des moyens les plus efficaces de progresser en souffle.", "Short, intense efforts followed by recovery: one of the most effective ways to improve your fitness.", [7, 8, 9, 6]],
  gainage: ["#8B5CF6", "Gainage & posture", "Core & posture", "Renforcer la sangle abdominale et le dos pour protéger la colonne et mieux transmettre la force.", "Strengthen your abs and back to protect the spine and transfer force better.", [6, 7, 8, 5]],
  mobilite: ["#10B981", "Mobilité", "Mobility", "Gagner en amplitude dans les hanches, le dos et les épaules : bouge lentement, respire, sans jamais forcer.", "Gain range in hips, back and shoulders: move slowly, breathe, never force.", [3, 3, 3, 3]],
  recup: ["#14B8A6", "Récupération active", "Active recovery", "Faire circuler le sang et relâcher les tensions pour récupérer de la semaine. Le repos fait partie de l’entraînement.", "Get the blood flowing and release tension to recover from the week. Rest is part of training.", [2, 2, 2, 2]],
  fract: ["#DC2626", "Cardio intensif", "Intense cardio", "Des efforts à très haute intensité avec une vraie récupération : tu construis le souffle qui te fait tenir jusqu’au bout.", "Very high-intensity efforts with real recovery: you build the fitness that carries you to the end.", [9, 9, 9, 8]],
  test: ["#F59E0B", "Bilan", "Final test", "Refais la séance du jour 1 avec l’intensité de la semaine 3 : compare tes sensations, tu vas voir le chemin parcouru !", "Redo the day 1 workout at week 3 intensity: compare how it feels, you will see how far you’ve come!", [8, 8, 8, 8]]
};
const PHASES_FRACT = { boxe: [["Vitesse", "Speed"], ["Tolérance à l’effort", "Effort tolerance"], ["Rounds de combat", "Fight rounds"], ["Affûtage et bilan", "Taper and test"]],   // nom des semaines des journées de cardio intensif
  defaut: [["Vitesse", "Speed"], ["Tolérance à l’effort", "Effort tolerance"], ["Spécifique au sport", "Sport-specific"], ["Affûtage et bilan", "Taper and test"]] };
const SEMAINES = [["Adaptation", "Adaptation", "On installe les bons gestes et l’habitude : qualité avant quantité."],
  ["Développement", "Development", "Un tour de plus : le volume augmente pour faire progresser le corps."],
  ["Intensification", "Intensification", "Efforts plus longs, repos plus courts : c’est la semaine la plus exigeante."],
  ["Récupération & bilan", "Recovery & test", "On allège pour laisser le corps assimiler, puis on mesure tes progrès le jour 28."]];
const SEMAINES_EN = ["We set good technique and the habit: quality before quantity.", "One more round: volume goes up to make the body progress.", "Longer efforts, shorter rests: the most demanding week.", "We ease off so the body can absorb the work, then measure your progress on day 28."];
const CONSEILS = {
  fract: [["Ne raccourcis jamais le repos : c’est lui qui te permet de repartir aussi fort.", "Never cut the rest short: it is what lets you go just as hard again."], ["Si tu finis un effort en pouvant encore parler, tu n’es pas allé assez fort.", "If you can still talk at the end of an effort, you did not go hard enough."], ["Bois, mange et dors bien : c’est entre les séances que le cœur progresse.", "Drink, eat and sleep well: your heart improves between sessions."], ["Note ton effort ressenti après chaque séance pour voir ta progression.", "Note your perceived effort after each session to see your progress."]],
  force: [["Garde le dos neutre et le ventre légèrement serré sur chaque répétition.", "Keep a neutral back and a lightly braced core on every rep."], ["Expire pendant l’effort, inspire pendant le retour.", "Breathe out on the effort, in on the way back."], ["Si la technique se dégrade, ralentis plutôt que d’accélérer.", "If your form slips, slow down rather than speed up."], ["Les genoux suivent l’axe des pieds, jamais vers l’intérieur.", "Knees track over your toes, never caving in."]],
  cardio: [["Trouve un rythme que tu peux tenir jusqu’au bout plutôt que de partir trop vite.", "Find a pace you can hold to the end rather than starting too fast."], ["Atterris en douceur sur l’avant du pied pour protéger les articulations.", "Land softly on the balls of your feet to protect your joints."], ["Bouge les bras : ils donnent du rythme et augmentent la dépense.", "Use your arms: they set the rhythm and burn more energy."], ["Bois quelques gorgées d’eau entre les tours.", "Sip some water between rounds."]],
  hiit: [["Donne vraiment tout pendant l’effort, puis récupère vraiment pendant le repos.", "Truly go all out during the effort, then truly recover during the rest."], ["Mieux vaut un mouvement propre et rapide qu’un mouvement bâclé.", "A clean, fast rep beats a sloppy one."], ["Si tu es essoufflé au point de ne plus parler, c’est normal sur le fractionné.", "Being too breathless to talk is normal in interval training."], ["Garde 24 h de récupération avant un autre effort intense : c’est prévu dans le planning.", "Allow 24 h before another intense effort: it is built into the plan."]],
  gainage: [["Imagine que tu fermes une fermeture éclair du nombril jusqu’aux côtes.", "Imagine zipping up from your navel to your ribs."], ["Ne bloque pas ta respiration : respire court et régulier.", "Don’t hold your breath: take short, steady breaths."], ["Le bas du dos ne doit jamais se creuser sur les exercices au sol.", "Your lower back should never arch on floor exercises."], ["Mieux vaut 20 secondes parfaites que 40 secondes affaissé.", "20 perfect seconds beat 40 sagging ones."]],
  mobilite: [["Expire en allant dans l’amplitude, le muscle se relâche mieux.", "Breathe out as you move into range: the muscle relaxes better."], ["Une légère tension, jamais de douleur.", "Mild tension, never pain."], ["Bouge lentement : la mobilité se gagne avec la régularité, pas la force.", "Move slowly: mobility comes from consistency, not force."], ["Fais-la aussi les jours de fatigue, elle aide à récupérer.", "Do it on tired days too, it helps recovery."]],
  recup: [["Profite de cette séance pour bien respirer par le ventre.", "Use this session to breathe deeply into your belly."], ["Un bon sommeil compte autant que l’entraînement pour progresser.", "Good sleep matters as much as training for progress."], ["Pas besoin de transpirer aujourd’hui : l’objectif est de te sentir mieux à la fin.", "No need to sweat today: the goal is to feel better at the end."], ["Pense à t’hydrater tout au long de la journée.", "Remember to stay hydrated throughout the day."]],
  test: [["Note mentalement tes sensations : souffle, facilité des gestes, récupération.", "Take mental note: breathing, ease of movement, recovery."]]
};
const ECH = { dyn: ["armcircles", "twist", "jumpingJack", "kneeup", "inchworm", "wgs"], doux: ["armcircles", "twist", "catcow", "ankles", "kneeup"], mob: ["catcow", "armcircles"] };
const RAC = { bas: ["quadDebout", "ischioCouche", "figure4", "molletMur", "enfantStat"], haut: ["murPecs", "brasCroise", "triceps", "nuqueLat", "enfantStat"], complet: ["chien", "fenteBasse", "papillon", "torsionAllongee", "enfantStat"] };
// [id, titre FR, titre EN, description FR, description EN, couleur, niveau FR/EN, durée, objectifs FR, objectifs EN,
//  semaine type : [type, focus FR, focus EN, exercices, retour au calme], réglages : [effort s, repos s, tours par semaine, échauffement]]
const PROGRAMMES = [
  ["cardioBoxe", "Exceller en cardio · boxe", "Excel at cardio · boxing", "4 semaines pour tenir tous tes rounds : vitesse, tolérance à l’effort, rounds de combat, puis affûtage. Support et niveau se règlent dans Boxe → Cardio boxe.", "4 weeks to last every round: speed, effort tolerance, fight rounds, then a taper. Set your equipment and level in Boxing → Boxing cardio.", "#BE123C", ["Tous niveaux", "All levels"], "15–45 min",
    ["Tenir le rythme jusqu’au dernier round", "Récupérer plus vite entre deux rafales", "Arriver frais le jour du combat ou du sparring"], ["Keep the pace until the last round", "Recover faster between two flurries", "Arrive fresh on fight or sparring day"],
    [["fract", "Séance dure 1", "Hard session 1", ["sprints", "tolerance", "rounds", "sprints-", "rounds"], null],
     ["mobilite", "Mobilité du corps entier", "Full-body mobility", ["catcow", "wgs", "hip9090", "openbook", "thread", "cossack"], "complet"],
     ["fract", "Séance dure 2", "Hard session 2", ["groupes", "groupes", "tolerance", "rounds-"], null],
     ["recup", "Étirements et respiration", "Stretching and breathing", ["catcow", "cascade", "genouxPoitrine", "torsionAllongee", "figure4", "enfantStat"], null],
     ["fract", "Séance dure 3", "Hard session 3", ["pyramide", "tolerance", "rounds", "groupes-"], null],
     ["fract", "Cardio facile", "Easy cardio", ["facile", "facile", "facile", "facile"], null],
     ["recup", "Récupération des jambes", "Leg recovery", ["quadDebout", "ischioCouche", "molletMur", "figure4", "papillon", "enfantStat"], null]], [40, 20, [2, 3, 3, 2], "dyn"]],
  ["debutant", "Remise en forme", "Get fit", "Pour (re)commencer à bouger : tout le corps, sans matériel, progressivement.", "To (re)start moving: full body, no equipment, step by step.", "#2F5BFF", ["Débutant", "Beginner"], "20–30 min",
    ["Retrouver de l’énergie au quotidien", "Tonifier jambes, fessiers, bras et ventre", "Prendre l’habitude de bouger chaque jour"], ["Get more energy every day", "Tone legs, glutes, arms and core", "Build a daily movement habit"],
    [["force", "Bas du corps", "Lower body", ["squat", "pont", "fente", "donkeyKick", "chaise"], "bas"],
     ["cardio", "Cardio doux", "Gentle cardio", ["jumpingJack", "kneeup", "heelkick", "lateral", "climbers"], "complet"],
     ["force", "Haut du corps & gainage", "Upper body & core", ["pompesMur", "pompes", "planche", "superman", "crunchInverse"], "haut"],
     ["mobilite", "Mobilité du corps entier", "Full-body mobility", ["catcow", "wgs", "hip9090", "openbook", "thread", "cossack"], "complet"],
     ["force", "Corps entier", "Full body", ["squat", "pompes", "pont", "deadbug", "lateral", "planchelat"], "complet"],
     ["hiit", "Fractionné léger", "Light intervals", ["kneeup", "climbers", "skater", "squat", "heelkick"], "bas"],
     ["recup", "Étirements et respiration", "Stretching and breathing", ["catcow", "cascade", "genouxPoitrine", "torsionAllongee", "figure4", "enfantStat"], null]],
    [30, 20, [2, 3, 3, 2], "dyn"]],
  ["reprise", "Reprise douce", "Gentle restart", "Après une pause, une période sédentaire ou de fatigue : on reprend sans brusquer le corps.", "After a break, a sedentary period or fatigue: getting back without rushing the body.", "#0E9F6E", ["Tous niveaux", "All levels"], "15–25 min",
    ["Réveiller les articulations et la posture", "Reprendre de la force sans courbatures excessives", "Améliorer l’équilibre et le souffle"], ["Wake up joints and posture", "Regain strength without excessive soreness", "Improve balance and breathing"],
    [["force", "Jambes et équilibre", "Legs and balance", ["assisDebout", "pont", "calfraise", "equilibre", "lateral"], "bas"],
     ["cardio", "Marche dynamique", "Dynamic marching", ["kneeup", "heelkick", "armcircles", "twist", "lateral"], "complet"],
     ["mobilite", "Dos et hanches", "Back and hips", ["catcow", "hip9090", "openbook", "thread", "wgs", "ankles"], "complet"],
     ["gainage", "Posture et gainage", "Posture and core", ["pompesMur", "bird", "deadbug", "superman", "ours"], "haut"],
     ["force", "Corps entier doux", "Gentle full body", ["assisDebout", "pont", "donkeyKick", "bird", "calfraise"], "bas"],
     ["cardio", "Cardio et équilibre", "Cardio and balance", ["kneeup", "lateral", "equilibre", "heelkick", "calfraise"], "bas"],
     ["recup", "Détente du corps entier", "Full-body release", ["cascade", "genouxPoitrine", "figure4", "torsionAllongee", "enfantStat"], null]],
    [25, 25, [2, 2, 3, 2], "doux"]],
  ["ski", "Prépa ski", "Ski prep", "Cuisses endurantes, genoux protégés, gainage et appuis latéraux : prêt pour la saison.", "Enduring thighs, protected knees, core and lateral push: ready for the season.", "#0EA5E9", ["Intermédiaire", "Intermediate"], "30–40 min",
    ["Tenir les positions basses plus longtemps", "Protéger les genoux par la force et la proprioception", "Gagner en explosivité et en équilibre"], ["Hold low positions for longer", "Protect your knees through strength and balance", "Gain power and balance"],
    [["force", "Cuisses : isométrie et contrôle", "Thighs: isometrics and control", ["skisquat", "chaise", "fente", "lateral", "pontuni", "calfraise"], "bas"],
     ["hiit", "Rebonds et appuis", "Bounds and footwork", ["skihop", "skater", "squatsaute", "climbers", "kneeup"], "bas"],
     ["gainage", "Gainage et proprioception", "Core and balance", ["planchelat", "ours", "equilibre", "rdl", "russian", "hollow"], "complet"],
     ["mobilite", "Hanches et chevilles", "Hips and ankles", ["cossack", "hip9090", "fenteBasse", "wgs", "ankles", "scorpion"], "bas"],
     ["force", "Puissance des jambes", "Leg power", ["squatsaute", "fentesalt", "skihop", "surfsquat", "lateral"], "bas"],
     ["cardio", "Endurance de force", "Strength endurance", ["skisquat", "chaise", "skater", "planche", "lateral", "calfraise"], "bas"],
     ["recup", "Récupération des jambes", "Leg recovery", ["quadDebout", "ischioCouche", "molletMur", "figure4", "papillon", "enfantStat"], null]],
    [35, 25, [3, 3, 4, 2], "dyn"]],
  ["cardio", "Brûler et tonifier · à la maison", "Burn and tone · at home", "Sans sport, au poids du corps : brûler des calories, gagner en souffle et dessiner la silhouette, à haute intensité. La suite logique de « Remise en forme ».", "No sport needed, bodyweight only: burn calories, build stamina and sculpt your body, high intensity. The natural next step after “Get fit”.", "#E11D48", ["Intermédiaire +", "Intermediate +"], "25–35 min",
    ["Améliorer nettement ton souffle", "Augmenter la dépense énergétique", "Tonifier tout le corps"], ["Clearly improve your stamina", "Increase energy expenditure", "Tone the whole body"],
    [["hiit", "Fractionné corps entier", "Full-body intervals", ["burpees", "climbers", "squatsaute", "kneeup", "planchetouch"], "complet"],
     ["force", "Haut du corps", "Upper body", ["pompes", "pike", "tspin", "pompesserrees", "superman"], "haut"],
     ["cardio", "Cardio continu", "Steady cardio", ["jumpingJack", "skater", "heelkick", "fentesalt", "popup", "sautContre"], "bas"],
     ["mobilite", "Mobilité active", "Active mobility", ["wgs", "scorpion", "catcow", "openbook", "hip9090", "inchworm"], "complet"],
     ["hiit", "Fractionné bas du corps", "Lower-body intervals", ["squatsaute", "fentesalt", "sautContre", "skater", "chaise"], "bas"],
     ["gainage", "Sangle abdominale", "Abs and core", ["hollow", "russian", "planchelat", "crunchInverse", "ours", "planche"], "complet"],
     ["recup", "Récupération et souplesse", "Recovery and flexibility", ["chien", "fenteBasse", "papillon", "torsionAllongee", "enfantStat"], null]],
    [30, 30, [3, 4, 4, 2], "dyn"]]
];
const progAvance = id => { try { return Math.min(NB_PROG, parseInt(localStorage.getItem("prog_" + id), 10) || 0); } catch (e) { return 0; } };
function progJour(P, i, choix) {   // construit la séance du jour i (0-27) : blocs, plan détaillé, textes
  const [id, tFr, tEn, , , couleur, , , , , sem, [eff, rep, tours, ech]] = P, w = Math.floor(i / 7), test = i === NB_PROG - 1;
  const [type, fFr, fEn, ex, rac] = test ? sem[0] : sem[i % 7], ty = test ? "test" : type, ww = test ? 2 : w;
  const ok = l => l.filter(e => EXERCICES[e]), blocs = []; let regl = {};
  if (type === "fract") {   // cardio par intervalles : séance de la semaine (suffixe « - » = volume allégé), au support et au niveau choisis
    const k = ex[test ? 4 : w], S = seanceCardio(P[12] || "boxe", k.replace("-", ""), lireNiv(), k.endsWith("-")), cs = CONSEILS.fract[i % 4];
    return { ...S, prog: id, progI: i, titre: L("J", "D") + (i + 1) + " · " + S.titre, titreFr: tFr + " J" + (i + 1), semaine: w, nomProg: L(tFr, tEn), couleurProg: couleur, ty: test ? "test" : type, objectif: L(PTYPES.fract[3], PTYPES.fract[4]), conseil: L(...cs),
      listeHtml: `<li class="etude prog-carte-jour"><div><small><b>${L("Semaine", "Week")} ${w + 1} · ${L(...(PHASES_FRACT[P[12] || "boxe"] || PHASES_FRACT.defaut)[w])}</b></small><small>💡 ${L(...cs)}</small></div></li>` + S.listeHtml };
  }
  if (type === "mobilite" || type === "recup") {
    if (type === "mobilite") blocs.push({ n: L("Réveil articulaire", "Joint warm-up"), t: 1, ex: ok(ECH.mob).map(e => [e, 30]), r: 5 });
    blocs.push({ n: L(type === "recup" ? "Séance de récupération" : "Circuit de mobilité", type === "recup" ? "Recovery session" : "Mobility circuit"), t: ww < 3 ? 2 : 1, ex: ok(ex).map(e => [e, type === "recup" ? 50 : 40 + Math.min(ww, 2) * 5]), r: 10, rt: 30 });
  } else {
    const intense = type === "hiit", d = eff + [0, 5, 10, 0][ww] - (intense ? 5 : 0), r0 = Math.max(10, rep - [0, 0, 5, -5][ww] + (intense ? 5 : 0)), r = choix ?? reposLu("prog:" + id + ":" + i, r0);
    regl = { repos: r, reposProp: r0, reposId: "prog:" + id + ":" + i, reglerRepos: v => progJour(P, i, v) };
    blocs.push({ n: L("Échauffement", "Warm-up"), t: 1, ex: ok(ECH[ech]).map(e => [e, 30]), r: 5 });
    blocs.push({ n: L("Corps de séance", "Main workout"), t: test ? tours[2] : tours[w], ex: ok(ex).map(e => [e, d]), r, rt: Math.round(r * 2.5 / 5) * 5 });
    if (rac) blocs.push({ n: L("Retour au calme", "Cool-down"), t: 1, ex: ok(RAC[rac]).map(e => [e, 30]), r: 5 });
  }
  const plan = [];
  blocs.forEach((b, j) => { for (let t = 1; t <= b.t; t++) b.ex.forEach(([e, d], k) => plan.push({ id: e, d, r: k < b.ex.length - 1 ? b.r : t < b.t ? b.rt : j < blocs.length - 1 ? 15 : 0, b: j, bn: b.n, t, tt: b.t, ft: k === b.ex.length - 1 && t < b.t })); });
  plan[plan.length - 1].r = 0;
  const [c, nFr, nEn, oFr, oEn, rpe] = PTYPES[ty], cs = CONSEILS[ty][i % CONSEILS[ty].length];
  return { type: "seance", prog: id, progI: i, fixe: true, couleur: c, plan, blocsProg: blocs, exercices: plan.map(p => p.id),
    titre: L("J", "D") + (i + 1) + " · " + L(nFr, nEn) + (test ? "" : " · " + L(fFr, fEn)), titreFr: tFr + " J" + (i + 1), detail: "",
    objectif: L(oFr, oEn), rpe: rpe[ww], conseil: L(...cs), semaine: w, nomProg: L(tFr, tEn), couleurProg: couleur, ty, ...regl };
}
const dureesProg = P => { const d = Array.from({ length: NB_PROG }, (_, i) => Math.round(progJour(P, i).plan.reduce((s, q) => s + q.d + q.r, 0) / 60)); return Math.min(...d) + "–" + Math.max(...d) + " min"; };
const avecMat = P => P[10].some(d => d[3].some(e => EXERCICES[e] && EXERCICES[e].mat));   // vrai pour un programme sur mesure composé avec du matériel
function progTerminer(id, i) { if (i === progAvance(id)) stocker("prog_" + id, i + 1); }
let pgOnglet = "";   // onglet affiché dans Programmes : « prog » ou « rep »
function ouvrirProgs(sens, onglet) {
  $("pgTitre").textContent = L("Programmes", "Programmes");
  $("pgSub").textContent = L("4 semaines, une séance par jour, périodisées comme un vrai plan d’entraînement. Suis le chemin !", "4 weeks, one workout a day, periodised like a real training plan. Follow the path!");
  $("pgListe").innerHTML = `<div class="prog-zone">` + PROGRAMMES.map(P => { const a = progAvance(P[0]), pc = a / NB_PROG;
    return `<button class="prog-carte" style="--c:${P[5]}" data-p="${P[0]}"><svg class="rond" viewBox="0 0 62 62"><circle cx="31" cy="31" r="26" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="7"/><circle cx="31" cy="31" r="26" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="${163.4 * pc} 200" transform="rotate(-90 31 31)"/><text x="31" y="38" text-anchor="middle">${a}/${NB_PROG}</text></svg><div><strong>${L(P[1], P[2])}</strong><span>${L(P[3], P[4])}</span><span class="prog-meta">${L(...P[6])} · ${dureesProg(P)} · ${avecMat(P) ? L("avec matériel", "with equipment") : L("sans matériel", "no equipment")}</span></div></button>`; }).join("") + "</div>";
  $("pgListe").insertAdjacentHTML("beforeend", `<div class="rep-zone"><h2 class="sec">${L("Retour au sport après blessure", "Back to sport after injury")}</h2><p class="sub" style="margin:4px 0 10px">${L("Programmes de renforcement en 3 étapes pour reprendre le sport, une fois ta blessure prise en charge et avec l’accord de ton médecin ou kiné. Ce ne sont pas des soins.", "3-step strengthening programmes to get back to sport, once your injury has been looked after and with your doctor’s or physio’s agreement. They are not treatment.")}</p>`
    + REPRISES.map(R => { const a = repAvance(R[0]); return `<button class="prog-carte petite" style="--c:${R[3]}" data-r="${R[0]}"><svg class="rond" viewBox="0 0 62 62"><circle cx="31" cy="31" r="26" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="7"/><circle cx="31" cy="31" r="26" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="${163.4 * a / NB_REP} 200" transform="rotate(-90 31 31)"/><text x="31" y="38" text-anchor="middle">${a}/${NB_REP}</text></svg><div><strong>${L(R[1], R[2])}</strong><span class="prog-meta">${L("12 séances · 3 phases", "12 sessions · 3 phases")}</span></div></button>`; }).join("") + "</div>");
  $("pgListe").querySelector(".prog-zone").insertAdjacentHTML("afterbegin", `<button class="toggle contour" id="pgPerso" style="width:100%;margin-bottom:12px">✨ ${PROGRAMMES[0][0] === "perso" ? L("Refaire mon programme sur mesure", "Rebuild my custom programme") : L("Créer mon programme sur mesure", "Create my custom programme")}</button>`); $("pgPerso").onclick = ouvrirProgPerso;
  // ordre : programmes en cours (les plus avancés d'abord), puis à découvrir (avec le programme sur mesure en tête), puis terminés ; reprises en cours en premier
  const Z = $("pgListe").querySelector(".prog-zone"), RZ = $("pgListe").querySelector(".rep-zone"), rang = a => a > 0 && a < NB_PROG ? 0 : a >= NB_PROG ? 2 : 1;
  const F = sportsFrequents(Object.keys(SPORT_PLUS)), pref = id => { const k = F.findIndex(s => SPORT_PLUS[s][1] === id); return k < 0 ? 99 : k; };   // à découvrir : d'abord les programmes de tes sports les plus pratiqués
  [[0, "En cours", "In progress"], [1, "À découvrir", "To discover"], [2, "Terminés", "Completed"]].forEach(([g, f, e]) => {
    const l = [...Z.querySelectorAll("[data-p]")].filter(b => rang(progAvance(b.dataset.p)) === g).sort((x, y) => g === 0 ? progAvance(y.dataset.p) - progAvance(x.dataset.p) : g === 1 ? pref(x.dataset.p) - pref(y.dataset.p) : 0);
    if (!l.length && g !== 1) return; Z.insertAdjacentHTML("beforeend", `<h2 class="sec" data-g="${g}">${L(f, e)}</h2>`); if (g === 1) Z.appendChild($("pgPerso")); l.forEach(b => Z.appendChild(b)); });
  const rr = a => a > 0 && a < NB_REP ? 0 : a >= NB_REP ? 2 : 1, cartes = [...RZ.querySelectorAll("[data-r]")];   // reprises : en cours, puis les autres zones, puis terminées (titres seulement s'il y a plusieurs groupes)
  if (cartes.some(b => rr(repAvance(b.dataset.r)) !== 1)) [[0, "En cours", "In progress"], [1, "Autres zones", "Other areas"], [2, "Terminés", "Completed"]].forEach(([g, f, e]) => {
    const l = cartes.filter(b => rr(repAvance(b.dataset.r)) === g); if (!l.length) return; RZ.insertAdjacentHTML("beforeend", `<h2 class="sec rep-groupe">${L(f, e)}</h2>`); l.forEach(b => RZ.appendChild(b)); });
  $("pgListe").querySelectorAll("[data-p]").forEach(b => b.onclick = () => ouvrirProg(b.dataset.p));
  $("pgListe").querySelectorAll("[data-r]").forEach(b => b.onclick = () => ouvrirReprise(b.dataset.r));
  // deux onglets : programmes de 4 semaines / retour après blessure ; une reprise en cours ouvre directement le second
  if (onglet) pgOnglet = onglet; else if (!pgOnglet) pgOnglet = REPRISES.some(R => repAvance(R[0]) > 0 && repAvance(R[0]) < NB_REP) ? "rep" : "prog";
  const ong = o => { pgOnglet = o; $("pgListe").dataset.ong = o; $("pgListe").querySelectorAll("[data-ong]").forEach(b => b.setAttribute("aria-pressed", b.dataset.ong === o));
    $("pgSub").textContent = o === "rep" ? L("Cheville, genou, dos, épaule… 12 séances progressives en 3 phases pour reprendre le sport après une blessure prise en charge.", "Ankle, knee, back, shoulder… 12 progressive sessions in 3 phases to get back to sport after an injury that has been looked after.") : L("4 semaines, une séance par jour, périodisées comme un vrai plan d’entraînement. Suis le chemin !", "4 weeks, one workout a day, periodised like a real training plan. Follow the path!"); };
  $("pgListe").insertAdjacentHTML("afterbegin", `<div class="chips pg-onglets"><button class="toggle" data-ong="prog">🗓️ ${L("Programmes", "Programmes")}</button><button class="toggle" data-ong="rep">🩹 ${L("Après une blessure", "After an injury")}</button></div>`);
  $("pgListe").querySelectorAll("[data-ong]").forEach(b => b.onclick = () => { ong(b.dataset.ong); scrollTo({ top: 0, behavior: "smooth" }); }); ong(pgOnglet);
  document.documentElement.style.setProperty("--accent", "#2563EB");
  sens ? retour(() => ecran("progs")) : ecran("progs");
}
function ouvrirProg(id, sens) {
  const P = PROGRAMMES.find(x => x[0] === id), a = progAvance(id), X = [0, 64, 96, 64, 0, -64, -96];
  $("pTitreProg").textContent = L(P[1], P[2]);
  $("pSubProg").textContent = a >= NB_PROG ? L("Programme terminé, bravo ! Tu peux refaire chaque séance.", "Programme complete, well done! You can replay any session.") : L("Jour {n} sur 28 · touche le rond qui rebondit", "Day {n} of 28 · tap the bouncing circle").replace("{n}", a + 1);
  const semType = P[10].map(([t, fFr, fEn], k) => `<li><b style="color:${PTYPES[t][0]}">${L("LMMJVSD", "MTWTFSS")[k]}</b><span>${L(PTYPES[t][1], PTYPES[t][2])}</span><small>${L(fFr, fEn)}</small></li>`).join("");
  let h = `<details class="prog-info" style="--c:${P[5]}"${a === 0 ? " open" : ""}><summary>${L("Le programme en détail", "Programme details")}</summary>
    <div class="prog-chips"><span>${L(...P[6])}</span><span>⏱ ${dureesProg(P)}</span><span>📅 ${L("7 j / 7", "7 days / week")}</span><span>${avecMat(P) ? "🏋️ " + L("Avec matériel", "With equipment") : "🏠 " + L("Sans matériel", "No equipment")}</span></div>
    <h3>${L("Objectifs", "Goals")}</h3><ul class="prog-obj">${L(P[8], P[9]).map(o => `<li>${o}</li>`).join("")}</ul>
    <h3>${L("Ta semaine type", "Your typical week")}</h3><ul class="prog-semaine">${semType}</ul>
    <h3>${L("La progression", "Progression")}</h3><ul class="prog-obj">${SEMAINES.map(([f, e, d], k) => `<li><b>${L("Semaine", "Week")} ${k + 1} · ${L(f, e)}</b> — ${L(d, SEMAINES_EN[k])}</li>`).join("")}</ul>
    <h3>${L("Comment lire l’effort (RPE)", "How to read effort (RPE)")}</h3><p>${L("Chaque séance indique un effort ressenti visé sur 10 : 2-3 très facile, 5-6 modéré (tu parles en phrases courtes), 7-8 difficile (quelques mots), 9-10 maximal.", "Each session shows a target perceived effort out of 10: 2-3 very easy, 5-6 moderate (short sentences), 7-8 hard (a few words), 9-10 maximal.")}</p>
    <h3>${L("Les règles d’or", "Golden rules")}</h3><ul class="prog-obj"><li>${L("Ne saute jamais l’échauffement ni le retour au calme.", "Never skip the warm-up or the cool-down.")}</li><li>${L("Une douleur vive ou articulaire = on arrête l’exercice.", "Sharp or joint pain = stop the exercise.")}</li><li>${L("Un jour raté ? Reprends là où tu t’es arrêté, sans doubler les séances.", "Missed a day? Pick up where you left off, don’t double up.")}</li><li>${L("Dors, bois de l’eau, mange équilibré : c’est là que le corps progresse.", "Sleep, drink water, eat well: that is when the body improves.")}</li></ul>
    <p class="prog-avert">${L("Programme d’entraînement général, pas un avis médical. En cas de problème de santé, de grossesse ou de blessure, demande l’avis d’un médecin avant de commencer.", "General training programme, not medical advice. If you have a health condition, are pregnant or injured, ask a doctor before starting.")}</p></details>`;
  for (let i = 0; i < NB_PROG; i++) {
    if (i % 7 === 0) h += `<div class="semaine" style="--c:${P[5]}"><span>${L("Semaine", "Week")} ${i / 7 + 1} · ${L(SEMAINES[i / 7][0], SEMAINES[i / 7][1])}</span></div>`;
    const etat = i < a ? "fait" : i === a ? "actuel" : "verrou", ty = i === NB_PROG - 1 ? "test" : P[10][i % 7][0], c = PTYPES[ty][0];
    h += `<div class="etape-bloc" style="--x:${X[i % 7]}px"><button class="etape ${etat}" style="--c:${c}" data-i="${i}" ${etat === "verrou" ? "disabled" : ""} aria-label="${L("Jour", "Day")} ${i + 1}">${etat === "fait" ? "✓" : etat === "verrou" ? "🔒" : i + 1}${etat === "actuel" ? `<span class="bulle">${L("C’est parti !", "Let’s go!")}</span>` : ""}</button><small style="color:${c}">${L(PTYPES[ty][1], PTYPES[ty][2])}</small></div>`;
  }
  if (a >= NB_PROG) h += `<p class="trophee-fin">🏆 ${L("Programme accompli", "Programme complete")}</p><button class="toggle contour" id="progReset" style="display:block;margin:0 auto">${L("Recommencer le programme", "Restart the programme")}</button>`;
  $("chemin").innerHTML = h;
  $("chemin").querySelectorAll(".etape:not([disabled])").forEach(b => b.onclick = () => { ROUTINES.prog = progJour(P, +b.dataset.i); CONSEILLES.prog = ROUTINES.prog.exercices; ouvrirRoutine("prog"); });
  if ($("progReset")) $("progReset").onclick = () => { stocker("prog_" + id, 0); ouvrirProg(id); };
  document.documentElement.style.setProperty("--accent", P[5]);
  const go = () => { ecran("prog"); setTimeout(() => { const c = $("chemin").querySelector(".actuel"); if (c && a > 0) c.scrollIntoView({ block: "center", behavior: "smooth" }); }, 750); };
  sens ? retour(go) : go();
}
/* --- Retour au sport après blessure : programmes progressifs en 3 phases (renforcement général, pas un soin), 12 séances (3 par semaine, un jour sur deux) ---
   Phase 1 protéger et réveiller (S1) · Phase 2 renforcer (S2-S3) · Phase 3 retour au sport (S4).
   Règle : aucun exercice ne doit faire mal ; en cas de douleur on arrête et on en parle à son médecin ou kiné. */
const NB_REP = 12, PHASE = i => i < 3 ? 0 : i < 9 ? 1 : 2;
const PHASES = [["Remettre en mouvement", "Get moving again", "Mobilité sans douleur, contractions douces, équilibre : on remet la zone en mouvement en douceur.", "Pain-free mobility, gentle contractions, balance: gently get the area moving again.", 30, 20, 2, "2–3"],
  ["Renforcer", "Strengthen", "Renforcement progressif, plus de charge et de contrôle : on reconstruit la solidité.", "Progressive strengthening, more load and control: rebuild robustness.", 40, 25, 3, "4–5"],
  ["Retour au sport", "Return to sport", "Mouvements dynamiques, changements de direction, petits sauts : on prépare la reprise.", "Dynamic moves, changes of direction, small jumps: prepare to return.", 40, 30, 3, "6–7"]];
// [id, zone FR, zone EN, couleur, [phase1, phase2, phase3], échauffement, retour au calme, étude FR, étude EN, [critère phase 2 FR, EN], [critère phase 3 FR, EN]]
const REPRISES = [
  ["cheville", "Cheville", "Ankle", "#0EA5E9", [["ankles", "calfraise", "equilibre", "pont"], ["calfraise", "mollet1", "equilibre", "lateral", "fente", "squat"], ["skater", "lateral", "kneeup", "squatsaute", "equilibre", "skihop"]], ["ankles", "kneeup"], ["molletMur", "soleaire"],
    "Équilibre, mollets et appuis : des chevilles stables et fortes encaissent mieux les réceptions et les changements de direction. Le travail d’équilibre fait partie des recommandations de renforcement de la cheville chez les sportifs.", "Balance, calves and footwork: stable, strong ankles handle landings and changes of direction better. Balance work is part of ankle-strengthening guidelines for athletes.",
    ["Marcher sans boiter et tenir 30 s sur la jambe blessée sans douleur.", "Walk without limping and stand 30 s on the injured leg without pain."], ["Faire 20 montées sur la pointe d’un pied et 10 petits sauts sur place sans douleur.", "Do 20 single-leg calf raises and 10 small hops on the spot without pain."]],
  ["genou", "Genou", "Knee", "#2563EB", [["chaise", "pont", "equilibre", "assisDebout"], ["squat", "fente", "assisDebout", "pontuni", "lateral", "calfraise"], ["squatsaute", "fentesalt", "skater", "lateral", "kneeup", "squat"]], ["ankles", "kneeup"], ["quadDebout", "ischioCouche"],
    "Cuisses, fessiers et contrôle du genou : des exercices tenus (comme la chaise), puis dynamiques, renforcent progressivement les muscles qui stabilisent le genou.", "Thighs, glutes and knee control: held exercises (like the wall sit), then dynamic ones, gradually strengthen the muscles that stabilise the knee.",
    ["Tenir la chaise 45 s sans gêne et monter les escaliers facilement.", "Hold the wall sit 45 s without discomfort and climb stairs easily."], ["Faire 10 squats sur une jambe contrôlés et 10 sauts sans douleur le lendemain.", "Do 10 controlled single-leg squats and 10 jumps with no pain the next day."]],
  ["ischios", "Ischio-jambiers", "Hamstrings", "#7C3AED", [["pont", "extender", "bird", "deadbug"], ["pontuni", "rdl", "extender", "fente", "pont", "deadbug"], ["rdl", "kneeup", "heelkick", "askip", "fentesalt", "pontuni"]], ["kneeup", "heelkick"], ["ischioCouche", "figure4"],
    "Exercices en allongement (extender, charnière de hanche), puis plus dynamiques : ce type de renforcement est très utilisé dans le football pour préparer les ischios aux sprints.", "Lengthening exercises (extender, hip hinge), then more dynamic ones: this type of strengthening is widely used in football to prepare the hamstrings for sprinting.",
    ["Marcher vite et faire le pont sur deux jambes sans douleur.", "Walk briskly and do a two-leg bridge without pain."], ["Faire l’extender jambe presque tendue et un footing léger sans douleur.", "Do the extender with an almost straight leg and an easy jog without pain."]],
  ["aine", "Adducteurs et aine", "Adductors and groin", "#16A34A", [["pont", "lateral", "hydrant", "deadbug"], ["copenhague", "lateral", "cossack", "fenteLatTenue", "pont", "hydrant"], ["copenhague", "skater", "lateral", "frappeVide", "fentesalt", "cossack"]], ["ankles", "twist"], ["papillon", "figure4"],
    "Adducteurs et hanches : l’exercice de Copenhague est l’un des exercices de renforcement des adducteurs les plus étudiés chez les footballeurs.", "Adductors and hips: the Copenhagen exercise is one of the most studied adductor-strengthening exercises in footballers.",
    ["Fente latérale et pont sans douleur à l’aine.", "Side lunge and bridge without groin pain."], ["Tenir le gainage de Copenhague 20 s et courir en ligne droite sans douleur.", "Hold the Copenhagen plank 20 s and run in a straight line without pain."]],
  ["dos", "Bas du dos", "Lower back", "#B45309", [["catcow", "bird", "deadbug", "genouxPoitrine", "pont"], ["bird", "planchelat", "deadbug", "pont", "superman", "squat"], ["planche", "planchelat", "rdl", "squat", "superman", "ours"]], ["catcow", "twist"], ["enfantStat", "torsionAllongee"],
    "Gainage et fessiers : le « big 3 » de McGill (curl-up, gainage latéral, bird dog) renforce le tronc sans surcharger la colonne. Rester actif est recommandé pour le dos.", "Core and glutes: McGill’s “big 3” (curl-up, side plank, bird dog) strengthens the trunk without overloading the spine. Staying active is recommended for your back.",
    ["Se pencher pour mettre ses chaussures et faire le bird dog sans douleur.", "Bend to put your shoes on and do the bird dog without pain."], ["Tenir 30 s de gainage latéral de chaque côté et faire 10 soulevés de terre roumains sans douleur.", "Hold a 30 s side plank each side and do 10 Romanian deadlifts without pain."]],
  ["epaule", "Épaule", "Shoulder", "#DB2777", [["armcircles", "scap", "rotEpaule", "brasCroise"], ["bandRotExt", "bandPullApart", "scap", "pompesMur", "superman", "rotEpaule"], ["pompes", "bandRotExt", "bandPullApart", "tspin", "planchetouch", "pompesMur"]], ["armcircles", "armcross"], ["brasCroise", "murPecs"],
    "Coiffe des rotateurs et muscles de l’omoplate : ce sont eux qui stabilisent l’épaule quand le bras travaille, surtout au-dessus de la tête.", "Rotator cuff and shoulder-blade muscles: they stabilise the shoulder when the arm works, especially overhead.",
    ["Lever le bras au-dessus de la tête sans douleur ni accroche.", "Raise your arm overhead without pain or catching."], ["Faire 10 pompes contre le mur et 15 rotations externes avec élastique sans douleur.", "Do 10 wall push-ups and 15 banded external rotations without pain."]],
  ["achille", "Tendon d’Achille et mollet", "Achilles tendon and calf", "#0D9488", [["calfraise", "ankles", "equilibre", "pont"], ["alfredson", "mollet1", "calfraise", "equilibre", "assisDebout"], ["alfredson", "skihop", "kneeup", "squatsaute", "skater", "mollet1"]], ["ankles", "kneeup"], ["molletMur", "soleaire"],
    "Mollets et tendon d’Achille : les descentes de talon lentes (excentriques) sont un exercice de renforcement du mollet très utilisé chez les coureurs.", "Calves and Achilles tendon: slow (eccentric) heel drops are a calf-strengthening exercise widely used by runners.",
    ["Faire 20 montées sur la pointe des deux pieds sans douleur.", "Do 20 two-leg calf raises without pain."], ["Faire 15 montées sur une jambe et 10 sauts sur place sans douleur le lendemain.", "Do 15 single-leg raises and 10 hops with no pain the next day."]],
  ["coude", "Coude et poignet", "Elbow and wrist", "#EA580C", [["poignets", "rotEpaule", "scap", "triceps"], ["poignetExc", "poignets", "rotEpaule", "scap", "pompesMur"], ["poignetExc", "pompesMur", "pompes", "scap", "planche"]], ["poignets", "armcircles"], ["poignets", "triceps"],
    "Avant-bras et épaule : les extensions de poignet lentes (excentriques) renforcent les muscles de l’avant-bras, très sollicités au tennis, au padel et en escalade.", "Forearm and shoulder: slow (eccentric) wrist extensions strengthen the forearm muscles, which work hard in tennis, padel and climbing.",
    ["Serrer la main et porter un sac léger sans douleur vive.", "Grip a hand and carry a light bag without sharp pain."], ["Faire 15 extensions de poignet excentriques avec une bouteille pleine sans douleur.", "Do 15 eccentric wrist extensions with a full bottle without pain."]],
  ["nuque", "Nuque", "Neck", "#64748B", [["grandissement", "nuqueFlex", "nuqueLat", "scap"], ["nuqueIso", "scap", "bandPullApart", "superman", "armcross"], ["nuqueIso", "bandPullApart", "superman", "planche", "scap"]], ["armcircles", "grandissement"], ["nuqueLat", "enfantStat"],
    "Muscles profonds du cou et haut du dos : rentrer le menton et des contractions douces renforcent la tenue de la tête et des épaules.", "Deep neck muscles and upper back: chin tucks and gentle contractions strengthen how you hold your head and shoulders.",
    ["Tourner la tête des deux côtés sans douleur.", "Turn your head both ways without pain."], ["Tenir les isométries de nuque à mi-force 10 s dans chaque direction sans douleur.", "Hold neck isometrics at half strength for 10 s in each direction without pain."]]
];
const repAvance = id => { try { return Math.min(NB_REP, parseInt(localStorage.getItem("reprise_" + id), 10) || 0); } catch (e) { return 0; } };
function repTerminer(id, i) { if (i === repAvance(id)) stocker("reprise_" + id, i + 1); }
function repJour(R, i) {
  const [id, zFr, zEn, c, ph, ech, rac, eFr, eEn] = R, f = PHASE(i), [pFr, pEn, dFr, dEn, eff, rep, tours, rpe] = PHASES[f], ok = l => l.filter(e => EXERCICES[e]);
  const ex = ok(ph[f]), w = Math.floor(i / 3), plan = [], blocs = [];
  const iso = e => ["chaise", "planche", "planchelat", "copenhague", "ours", "nuqueIso", "equilibre"].includes(e), dEx = e => f === 0 && e === "chaise" ? 45 : iso(e) ? Math.min(45, eff) : eff + (w === 2 ? 5 : 0);
  const nE = L("Échauffement", "Warm-up"), nC = L("Renforcement ciblé", "Targeted strengthening"), nR = L("Retour au calme", "Cool-down");
  ok(ech).forEach((e, k, a) => plan.push({ id: e, d: 30, r: k < a.length - 1 ? 5 : 15, bn: nE, lab: nE + " · " + (k + 1) + "/" + a.length }));
  const T = f === 0 && ex.includes("chaise") ? 3 : tours;
  for (let t = 1; t <= T; t++) ex.forEach((e, k) => plan.push({ id: e, d: dEx(e), r: k < ex.length - 1 ? rep : t < T ? 60 : 15, ft: k === ex.length - 1 && t < T, bn: nC, lab: nC + " · " + L("tour", "round") + " " + t + "/" + T + " · " + (k + 1) + "/" + ex.length, presc: L("Sans douleur, mouvement lent et contrôlé", "Pain-free, slow and controlled") }));
  ok(rac).forEach((e, k, a) => plan.push({ id: e, d: 40, r: k < a.length - 1 ? 5 : 0, bn: nR, lab: nR + " · " + (k + 1) + "/" + a.length }));
  blocs.push([nE, ok(ech).map(e => [e, "30 s"])], [nC + " · " + T + " " + L("tours", "rounds"), ex.map(e => [e, dEx(e) + " s"])], [nR, ok(rac).map(e => [e, "40 s"])]);
  const html = `<li class="etude prog-carte-jour" style="--accent:${c}"><div><small><b>${L("Phase", "Phase")} ${f + 1} · ${L(pFr, pEn)}</b></small><small>🎯 ${L(dFr, dEn)}</small><small>🚦 ${L("Aucun exercice ne doit faire mal. Si une gêne apparaît ou persiste le lendemain, refais la séance précédente et parles-en à ton médecin ou kiné.", "No exercise should hurt. If discomfort appears or lasts until the next day, repeat the previous session and talk to your doctor or physio.")}</small></div></li>`
    + blocs.map(([n, l]) => `<li class="bloc-titre"><div><b>${n}</b></div></li>` + l.map(([x, a]) => `<li class="bloc-ex">${vignette(x)}<div><b>${EXERCICES[x].nom}</b><small>${EXERCICES[x].muscles}</small></div><span class="duree">${a}</span></li>`).join("")).join("")
    + `<li class="etude"><div><small><b>${L("Ce n’est pas un soin : programme de renforcement général, à faire seulement avec l’accord de ton médecin ou kiné. Aucun exercice ne doit faire mal : en cas de douleur, arrête.", "This is not treatment: a general strengthening programme, only to be done with your doctor’s or physio’s agreement. No exercise should hurt: if you feel pain, stop.")}</b></small></div></li>`;
  return { type: "seance", reprise: id, repI: i, blessure: 1, fixe: true, couleur: c, plan, exercices: plan.map(q => q.id), listeHtml: html, rpe,
    titre: L("Séance", "Session") + " " + (i + 1) + " · " + L(zFr, zEn), titreFr: zFr + " " + (i + 1), detail: "" };
}
function ouvrirReprise(id, sens) {
  const R = REPRISES.find(x => x[0] === id), [, zFr, zEn, c, ph, , , eFr, eEn, c2, c3] = R, a = repAvance(id), X = [0, 64, 96, 64, 0, -64, -96];
  $("pTitreProg").textContent = L(zFr, zEn);
  $("pSubProg").textContent = a >= NB_REP ? L("Programme terminé : reprends ton sport progressivement, avec l’accord de ton médecin ou kiné.", "Programme complete: return to your sport gradually, with your doctor’s or physio’s agreement.") : L("Séance {n} sur 12 · 3 par semaine, un jour sur deux", "Session {n} of 12 · 3 a week, every other day").replace("{n}", a + 1);
  let h = `<details class="prog-info" style="--c:${c}"${a === 0 ? " open" : ""}><summary>${L("Le programme en détail", "Programme details")}</summary>
    <div class="prog-chips"><span>🩺 ${L("Après accord médical", "After medical clearance")}</span><span>📅 ${L("3 séances / semaine", "3 sessions / week")}</span><span>⏱ 12–25 min</span><span>🏠 ${L("Sans matériel*", "No equipment*")}</span></div>
    <h3>${L("Les 3 phases", "The 3 phases")}</h3><ul class="prog-obj">${PHASES.map(([f, e, d, de], k) => `<li><b>${L("Phase", "Phase")} ${k + 1} · ${L(f, e)}</b> (${L(["séances 1 à 3", "séances 4 à 9", "séances 10 à 12"][k], ["sessions 1-3", "sessions 4-9", "sessions 10-12"][k])}) — ${L(d, de)}</li>`).join("")}</ul>
    <h3>${L("Quand passer à la phase suivante ?", "When to move to the next phase?")}</h3><ul class="prog-obj"><li><b>${L("Vers la phase 2", "To phase 2")}</b> : ${L(...c2)}</li><li><b>${L("Vers la phase 3", "To phase 3")}</b> : ${L(...c3)}</li></ul>
    <p class="aide">${L("Si le critère n’est pas atteint, refais les séances de la phase en cours : chacun progresse à son rythme.", "If you don’t meet the criterion, repeat the current phase: everyone progresses at their own pace.")}</p>
    <h3>${L("Écoute ton corps", "Listen to your body")}</h3><p>${L("Une sensation de travail musculaire est normale ; une douleur, non. Si un exercice fait mal, arrête-le, refais la séance précédente plus tard et parles-en à ton médecin ou kiné.", "A feeling of muscles working is normal; pain is not. If an exercise hurts, stop it, repeat the previous session later and talk to your doctor or physio.")}</p>
    <h3>${L("Consulte sans attendre si…", "See a professional promptly if…")}</h3><ul class="prog-obj"><li>${L("la douleur te réveille la nuit ou augmente de jour en jour ;", "pain wakes you at night or increases day after day;")}</li><li>${L("un gonflement, une chaleur ou un hématome apparaissent ;", "swelling, heat or bruising appears;")}</li><li>${L("tu ressens une instabilité, un blocage, des fourmillements ou une perte de force.", "you feel instability, locking, tingling or loss of strength.")}</li></ul>
    <h3>${L("Pourquoi ces exercices", "Why these exercises")}</h3><p>${L(eFr, eEn)}</p>
    <p class="prog-avert">${L("* Un élastique et une marche sont utiles pour certaines zones. Programme de renforcement général : ce n’est pas un soin et il ne remplace ni un diagnostic, ni une rééducation, ni le suivi d’un professionnel de santé.", "* A resistance band and a step help for some areas. General strengthening programme: it is not treatment and does not replace a diagnosis, rehabilitation or follow-up by a health professional.")}</p></details>`;
  for (let i = 0; i < NB_REP; i++) {
    if (i === 0 || i === 3 || i === 9) { const f = PHASE(i); h += `<div class="semaine" style="--c:${c}"><span>${L("Phase", "Phase")} ${f + 1} · ${L(PHASES[f][0], PHASES[f][1])}</span></div>`; }
    const etat = i < a ? "fait" : i === a ? "actuel" : "verrou";
    h += `<div class="etape-bloc" style="--x:${X[i % 7]}px"><button class="etape ${etat}" style="--c:${c}" data-i="${i}" ${etat === "verrou" ? "disabled" : ""} aria-label="${L("Séance", "Session")} ${i + 1}">${etat === "fait" ? "✓" : etat === "verrou" ? "🔒" : i + 1}${etat === "actuel" ? `<span class="bulle">${L("C’est parti !", "Let’s go!")}</span>` : ""}</button></div>`;
  }
  if (a >= NB_REP) h += `<p class="trophee-fin">🏆 ${L("Programme terminé", "Programme complete")}</p><button class="toggle contour" id="progReset" style="display:block;margin:0 auto">${L("Recommencer", "Restart")}</button>`;
  const accord = () => { try { return localStorage.getItem("repriseAccord") === "1"; } catch (e) { return false; } };
  if (!accord()) h = `<div class="carnet accord-rep" id="accordRep"><h3>🩺 ${L("Avant de commencer", "Before you start")}</h3><p>${L("Ces programmes ne sont pas des soins et ne remplacent pas une rééducation. Utilise-les seulement une fois ta blessure prise en charge, avec l’accord de ton médecin ou kiné.", "These programmes are not treatment and do not replace rehabilitation. Only use them once your injury has been looked after, with your doctor’s or physio’s agreement.")}</p><button class="primary" id="accordOk">${L("J’ai l’accord d’un professionnel de santé", "I have a health professional’s agreement")}</button></div>` + h;
  $("chemin").innerHTML = h;
  if ($("accordOk")) $("accordOk").onclick = () => { stocker("repriseAccord", "1"); $("accordRep").remove(); };
  $("chemin").querySelectorAll(".etape:not([disabled])").forEach(b => b.onclick = () => {
    if (!accord()) { const c = $("accordRep"); c.scrollIntoView({ block: "center", behavior: "smooth" }); c.classList.remove("secoue"); void c.offsetWidth; c.classList.add("secoue"); return; }
    ROUTINES.prog = repJour(R, +b.dataset.i); CONSEILLES.prog = ROUTINES.prog.exercices; ouvrirRoutine("prog"); });
  if ($("progReset")) $("progReset").onclick = () => { stocker("reprise_" + id, 0); ouvrirReprise(id); };
  document.documentElement.style.setProperty("--accent", c);
  const go = () => { ecran("prog"); setTimeout(() => { const el = $("chemin").querySelector(".actuel"); if (el && a > 0) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 750); };
  sens ? retour(go) : go();
}
$("tProgs").onclick = () => ouvrirProgs();
$("progsRetour").onclick = () => retour(() => ecran("menu"));
$("progRetour").onclick = () => ouvrirProgs(true);

/* ============ THÈME (clair / sombre / auto) ============ */
let theme = "sombre";
try { theme = localStorage.getItem("theme") || "sombre"; } catch (e) {}
const sombreSys = matchMedia("(prefers-color-scheme: dark)");
function appliquerTheme() {
  const d = theme === "sombre" || (theme === "auto" && sombreSys.matches);
  document.documentElement.dataset.theme = d ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = d ? "#0C0A09" : "#FBF6F1";
  [["thClair", "clair"], ["thSombre", "sombre"], ["thAuto", "auto"]].forEach(([id, t]) => $(id).setAttribute("aria-pressed", theme === t));
}
[["thClair", "clair"], ["thSombre", "sombre"], ["thAuto", "auto"]].forEach(([id, t]) => $(id).onclick = () => { theme = t; stocker("theme", t); appliquerTheme(); });
sombreSys.addEventListener && sombreSys.addEventListener("change", () => theme === "auto" && appliquerTheme());
appliquerTheme();

/* ============ RÉCAPITULATIF MENSUEL : « Ton mois en sport », en stories ============ */
const nomMois = m => { const [a, mo] = m.split("-"); const t = new Date(a, mo - 1, 1).toLocaleDateString(L("fr-FR", "en-GB"), { month: "long", year: "numeric" }); return t[0].toUpperCase() + t.slice(1); };
const moisPrecedent = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return jourCle(d).slice(0, 7); };
const MODES_NOMS = { echauffement: ["Échauffements", "Warm-ups"], seance: ["Séances de renfo", "Strength workouts"], salle: ["Salle de musculation", "Gym"], tabata: ["Tabata", "Tabata"], souffle: ["Cohérence cardiaque", "Coherent breathing"], calme: ["Étirements", "Stretching"] };
function statsMois(m) {
  const h = lireHist().filter(x => x.j.startsWith(m)), jours = new Set(h.map(x => x.j)), compte = (f, l = h) => { const c = {}; l.forEach(x => [].concat(f(x)).forEach(k => k && (c[k] = (c[k] || 0) + 1))); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
  const [a, mo] = m.split("-").map(Number), nbJ = new Date(a, mo, 0).getDate();
  let best = 0, cur = 0; for (let d = 1; d <= nbJ; d++) { cur = jours.has(m + "-" + String(d).padStart(2, "0")) ? cur + 1 : 0; best = Math.max(best, cur); }
  const tr = Object.entries(lireJSON("trophees", {})).filter(([, d]) => d.startsWith(m)).map(([id]) => TROPHEES.find(t => t[0] === id)).filter(Boolean);
  const moments = compte(x => x.hr < 12 ? "matin" : x.hr < 18 ? "aprem" : "soir");
  return { h, n: h.length, min: minutes(h), jours, nbJ, a, mo, best, tr, defis: new Set(h.filter(x => x.k === "defi").map(x => x.j)).size,
    mode: compte(x => x.m)[0], seance: compte(x => x.t)[0], exos: compte(x => x.e || []).slice(0, 3), moment: moments[0] && moments[0][0] };
}
let rc = { i: 0, slides: [], t: null, m: "" };
const RC_FONDS = ["linear-gradient(160deg,#4F46E5,#7C3AED 55%,#DB2777)", "linear-gradient(160deg,#0EA5E9,#2563EB 60%,#1E1B4B)", "linear-gradient(160deg,#10B981,#0E7490 60%,#0B1235)",
  "linear-gradient(160deg,#F59E0B,#EA580C 55%,#9F1239)", "linear-gradient(160deg,#EC4899,#9333EA 60%,#1E1B4B)", "linear-gradient(160deg,#F97316,#E11D48 60%,#4C0519)", "linear-gradient(160deg,#22D3EE,#6366F1 55%,#312E81)", "linear-gradient(160deg,#1E1B4B,#4338CA 50%,#DB2777)"];
function ouvrirRecap(m) {
  const S = statsMois(m), mois = nomMois(m).split(" ")[0], sl = [];
  stocker("recapVu", m);
  sl.push(`<p class="rc-sur">2 WORK · ${L("récap", "recap")}</p><div class="rc-titre">${L("Ton mois", "Your")}<br>${L((/^[aeiouyhâ]/i.test(mois) ? "d’" : "de ") + mois.toLowerCase(), mois + " in sport")}</div><p class="rc-petit">${L("en sport · ", "")}${S.a}</p><p class="rc-txt" style="margin-top:20px">${L("Prêt à revoir tes exploits ?", "Ready to relive it?")}</p>`);
  if (!S.n) sl.push(`<div class="rc-emoji">🌱</div><div class="rc-titre">${L("Tout reste à écrire", "A blank page")}</div><p class="rc-txt">${L("Aucune séance ce mois-ci pour l’instant. La première est la plus importante !", "No workout this month yet. The first one is the most important!")}</p>`);
  else {
    const films = Math.round(S.min / 110);
    sl.push(`<p class="rc-sur">${L("Temps d’entraînement", "Training time")}</p><div class="rc-gros" data-v="${S.min}">0</div><p class="rc-txt">${L("minutes en", "minutes in")} ${S.n} ${L(S.n > 1 ? "séances" : "séance", S.n > 1 ? "workouts" : "workout")}</p>${films >= 1 ? `<p class="rc-petit">${L("L’équivalent de", "As long as")} ${films} ${L(films > 1 ? "films au cinéma" : "film au cinéma", films > 1 ? "feature films" : "feature film")} 🎬</p>` : ""}`);
    const premier = (new Date(S.a, S.mo - 1, 1).getDay() + 6) % 7;
    let cal = ""; for (let k = 0; k < premier; k++) cal += `<i class="rc-vide"></i>`;
    for (let d = 1; d <= S.nbJ; d++) cal += `<i style="--k:${d}" class="${S.jours.has(m + "-" + String(d).padStart(2, "0")) ? "on" : ""}">${d}</i>`;
    sl.push(`<p class="rc-sur">${L("Jours actifs", "Active days")}</p><div class="rc-titre"><span data-v="${S.jours.size}">0</span> / ${S.nbJ}</div><div class="rc-mois" style="--c:#2563EB">${cal}</div><p class="rc-petit">${L("Meilleure série du mois", "Best streak this month")} : ${S.best} ${L(S.best > 1 ? "jours" : "jour", S.best > 1 ? "days" : "day")} 🔥</p>`);
    if (S.mode) sl.push(`<p class="rc-sur">${L("Ton activité préférée", "Your favourite activity")}</p><div class="rc-titre">${L(...MODES_NOMS[S.mode[0]])}</div><p class="rc-txt">${S.mode[1]} ${L("fois ce mois-ci", "times this month")}</p>${S.seance ? `<p class="rc-petit">${L("Séance la plus jouée", "Most played workout")} : <b>${S.seance[0]}</b> (${S.seance[1]}×)</p>` : ""}`);
    if (S.exos.length) sl.push(`<p class="rc-sur">${L("Tes exercices stars", "Your star exercises")}</p><div class="rc-emoji">🏅</div><div class="rc-liste">${S.exos.map(([id, n], k) => `<div style="--k:${k}"><b>${k + 1}</b><span>${EXERCICES[id] ? EXERCICES[id].nom : id}</span><small>${n}×</small></div>`).join("")}</div>`);
    if (S.moment) { const M = { matin: ["☀️", "Plutôt du matin", "A morning person", "Tu t’entraînes surtout avant midi. Les lève-tôt ont toujours une longueur d’avance !", "You mostly train before noon. Early birds are always one step ahead!"], aprem: ["🌤️", "L’après-midi, c’est ton moment", "Afternoon is your time", "La plupart de tes séances ont lieu entre midi et 18 h.", "Most of your workouts happen between noon and 6 pm."], soir: ["🌙", "Un sportif du soir", "An evening athlete", "Tu préfères t’entraîner après 18 h, pour décompresser.", "You prefer training after 6 pm to unwind."] }[S.moment];
      sl.push(`<p class="rc-sur">${L("Ton moment", "Your moment")}</p><div class="rc-emoji">${M[0]}</div><div class="rc-titre" style="margin-top:14px">${L(M[1], M[2])}</div><p class="rc-txt" style="margin-top:12px">${L(M[3], M[4])}</p>`); }
    if (S.tr.length || S.defis) sl.push(`<p class="rc-sur">${L("Récompenses", "Rewards")}</p><div class="rc-gros" data-v="${S.tr.length}">0</div><p class="rc-txt">${L(S.tr.length > 1 ? "trophées gagnés" : "trophée gagné", S.tr.length > 1 ? "trophies earned" : "trophy earned")}${S.defis ? ` · ${S.defis} ${L(S.defis > 1 ? "défis réussis" : "défi réussi", S.defis > 1 ? "challenges completed" : "challenge completed")} ⭐` : ""}</p><div class="rc-liste">${S.tr.slice(0, 3).map((t, k) => `<div style="--k:${k}"><b>${t[6]}</b><span>${L(t[1], t[2])}</span></div>`).join("")}</div>`);
    sl.push(`<p class="rc-sur">${mois} ${S.a}</p><div class="rc-carte"><div class="rc-titre" style="font-size:2.2rem">${L("Ton mois en bref", "Your month in brief")}</div><div class="grille"><div><b>${S.min}</b><span>${L("minutes", "minutes")}</span></div><div><b>${S.n}</b><span>${L("séances", "workouts")}</span></div><div><b>${S.jours.size}</b><span>${L("jours actifs", "active days")}</span></div><div><b>${S.best}</b><span>${L("meilleure série", "best streak")}</span></div></div></div><button class="rc-partager" id="rcPartager">${L("Partager mon récap", "Share my recap")}</button>`);
  }
  rc = { i: 0, slides: sl, t: null, m, S };
  $("rcBarres").innerHTML = sl.map(() => "<i><b></b></i>").join("");
  ecran("recap"); rcAfficher();
}
function rcAfficher() {
  clearTimeout(rc.t); $("recap").classList.remove("pause");
  const d = rc.i === rc.slides.length - 1 ? 0 : 5200;
  [...$("rcBarres").children].forEach((el, k) => { el.className = k < rc.i ? "fait" : k === rc.i ? "en" : ""; el.style.setProperty("--d", (d || 1) + "ms"); });
  if (!d) $("rcBarres").lastChild.className = "fait";
  $("rcScene").style.setProperty("--fond", RC_FONDS[rc.i % RC_FONDS.length]);
  $("rcScene").innerHTML = rc.slides[rc.i];
  $("rcScene").querySelectorAll("[data-v]").forEach(b => setTimeout(() => compteur(b, +b.dataset.v), 300));
  if ($("rcPartager")) { $("rcPartager").onclick = e => { e.stopPropagation(); partagerRecap(); }; confettis(); }
  bip(660 + rc.i * 40, 90, .06, "sine");
  if (d) rc.t = setTimeout(rcSuivant, d);
}
const rcSuivant = () => { if (rc.i < rc.slides.length - 1) { rc.i++; rcAfficher(); } };
const rcPrecedent = () => { if (rc.i > 0) { rc.i--; rcAfficher(); } };
let rcAppui = 0;
["rcPrec", "rcSuiv"].forEach(id => {
  $(id).addEventListener("pointerdown", () => { rcAppui = Date.now(); clearTimeout(rc.t); $("recap").classList.add("pause"); });
  $(id).addEventListener("pointerup", () => { if (Date.now() - rcAppui < 300) (id === "rcPrec" ? rcPrecedent : rcSuivant)(); else { $("recap").classList.remove("pause"); if (rc.i < rc.slides.length - 1) rc.t = setTimeout(rcSuivant, 2500); } });
});
$("rcFermer").onclick = () => { clearTimeout(rc.t); retour(() => ouvrirProgres()); };
function partagerRecap() {   // image 1080 × 1920 pour les stories
  const S = rc.S, c = document.createElement("canvas"); c.width = 1080; c.height = 1920; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 1080, 1920); g.addColorStop(0, "#4F46E5"); g.addColorStop(.55, "#7C3AED"); g.addColorStop(1, "#DB2777"); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  x.fillStyle = "rgba(255,255,255,.12)"; [[880, 260, 300], [160, 1500, 220], [950, 1700, 140]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
  x.fillStyle = "#fff"; x.textAlign = "center";
  x.font = "800 64px 'Barlow Condensed', Arial Narrow, sans-serif"; x.fillText("2 WORK", 540, 190);
  x.font = "700 46px Barlow, Arial, sans-serif"; x.globalAlpha = .9; x.fillText(L("MON MOIS EN SPORT", "MY MONTH IN SPORT"), 540, 300); x.globalAlpha = 1;
  x.font = "800 120px 'Barlow Condensed', Arial Narrow, sans-serif"; x.fillText(nomMois(rc.m), 540, 450);
  [[S.min, L("minutes", "minutes")], [S.n, L("séances", "workouts")], [S.jours.size, L("jours actifs", "active days")], [S.best, L("meilleure série", "best streak")]].forEach(([v, t], k) => {
    const cx = k % 2 ? 790 : 290, cy = 760 + Math.floor(k / 2) * 420;
    x.fillStyle = "rgba(255,255,255,.16)"; x.beginPath(); x.roundRect ? x.roundRect(cx - 220, cy - 170, 440, 340, 48) : x.rect(cx - 220, cy - 170, 440, 340); x.fill();
    x.fillStyle = "#fff"; x.font = "800 170px 'Barlow Condensed', Arial Narrow, sans-serif"; x.fillText(v, cx, cy + 40); x.font = "600 44px Barlow, Arial, sans-serif"; x.fillText(t, cx, cy + 110); });
  x.font = "700 44px Barlow, Arial, sans-serif"; x.globalAlpha = .9; x.fillText(L("Et toi, tu t’y mets ?", "Your turn?"), 540, 1720);
  x.font = "500 36px Barlow, Arial, sans-serif"; x.fillText("aidou-1.github.io/2work", 540, 1790);
  c.toBlob(async b => {
    const f = new File([b], "2work-recap.png", { type: "image/png" });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) return await navigator.share({ files: [f], title: "2 WORK", text: L("Mon mois en sport sur 2 WORK", "My month in sport on 2 WORK") }); } catch (e) { return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "2work-recap.png"; a.click();
  });
}

