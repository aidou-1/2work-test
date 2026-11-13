/* ============ SPORTS : même modèle que la boxe pour chaque sport ============
   Pour chaque sport : son cardio (séances propres dans js/cardio.js), un outil quand le sport en appelle un (minuteur annoncé à la voix,
   allures), un programme de 4 semaines, des exercices spécifiques (déclarés dans js/donnees.js) et, pour certains, un test de forme.
   Réglages des minuteurs gardés dans « minuteurs » ; chaque séance faite avec un minuteur est notée dans l'historique (k = « sport:… »). */
const hasard = l => l[Math.floor(Math.random() * l.length)], entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), n3 = l => l.map(v => [v, v, v]);
const APPELS = {
  tennis: [["Coup droit", "Forehand"], ["Revers", "Backhand"], ["Monte au filet", "Come to the net"], ["Smash", "Smash"], ["Recule en fond de court", "Back to the baseline"], ["Amortie, cours devant", "Drop shot, run forward"], ["Volée de revers", "Backhand volley"], ["Défends sur la diagonale", "Defend cross-court"]],
  padel: [["Coup droit", "Forehand"], ["Revers", "Backhand"], ["Bandeja", "Bandeja"], ["Sortie de vitre", "Off the glass"], ["Volée", "Volley"], ["Lob", "Lob"], ["Smash", "Smash"], ["Recule en défense", "Back to defend"]],
  directions: [["À droite", "Right"], ["À gauche", "Left"], ["Tout droit", "Straight ahead"], ["Demi-tour", "Turn around"], ["Recule, puis repars", "Back, then go"]],
  foot: [["Frappe", "Strike"]], basket: [["Saute au rebond", "Jump for the rebound"], ["Défends", "Defend"]], volley: [["Saute au contre", "Block jump"], ["Plonge", "Dive"]], handball: [["Saute et tire", "Jump and shoot"]] };
const secs = l => l.map(([v, f]) => [v, f, f]);
const MINUTEURS = {   // nom, sous-titre, couleur de l'effort, unité, réglages [clé, titre FR, EN, options, défaut], phases(R, sport), appels(sport), aide
  echanges: { nom: ["Mode échanges", "Rally mode"], sous: ["Des points comme en match : la voix annonce les coups et les déplacements, tu les joues à vide et à fond, puis tu récupères comme entre deux points.", "Points like in a match: the voice calls the shots and the movements, you play them all out without a ball, then recover like between points."],
    couleur: "#0EA5E9", unite: ["points", "points"], aide: ["Joue chaque coup avec un vrai déplacement et reviens au centre après chaque frappe. Avec ta raquette en main, c’est encore mieux.", "Play every shot with real footwork and come back to the centre after each one. Even better with your racket in hand."],
    regl: [["s", "Séries", "Sets", n3([3, 4, 6, 8]), 4], ["p", "Points par série", "Points per set", n3([6, 8, 10]), 8], ["e", "Durée des points", "Point length", [["c", "Courts : 4 à 8 s", "Short: 4–8 s"], ["l", "Longs : 8 à 15 s", "Long: 8–15 s"]], "c"]],
    phases: R => fois(R.s, i => fois(R.p, j => [{ e: 1, d: R.e === "l" ? entre(8, 15) : entre(4, 8), ap: 2.4, lab: [`Série ${i + 1}/${R.s} · point ${j + 1}/${R.p}`, `Set ${i + 1}/${R.s} · point ${j + 1}/${R.p}`] },
      { d: j === R.p - 1 ? 120 : 20, lab: j === R.p - 1 ? ["Repos entre les séries", "Rest between sets"] : ["Entre deux points", "Between points"] }])), appels: g => APPELS[g] || APPELS.tennis },
  sprints: { nom: ["Sprints répétés", "Repeated sprints"], sous: ["Des sprints de 6 secondes : la voix annonce la direction au dernier moment, comme une action de jeu. Il te faut une dizaine de mètres de place.", "6-second sprints: the voice calls the direction at the last moment, like in a game. You need about ten metres of space."],
    couleur: "#16A34A", unite: ["sprints", "sprints"], aide: ["Démarre dès que tu entends la direction, sprinte à fond, puis reviens en marchant au point de départ pendant le repos.", "Go as soon as you hear the direction, sprint all out, then walk back to the start during the rest."],
    regl: [["s", "Séries", "Sets", n3([2, 3, 4]), 3], ["n", "Sprints par série", "Sprints per set", n3([5, 6, 8]), 6], ["r", "Repos entre les sprints", "Rest between sprints", secs([[20, "20 s"], [25, "25 s"], [30, "30 s"]]), 25]],
    phases: R => fois(R.s, i => fois(R.n, j => [{ e: 1, d: 6, lab: [`Série ${i + 1}/${R.s} · sprint ${j + 1}/${R.n}`, `Set ${i + 1}/${R.s} · sprint ${j + 1}/${R.n}`] },
      { d: j === R.n - 1 ? 180 : R.r, lab: j === R.n - 1 ? ["Récupération entre les séries", "Recovery between sets"] : ["Reviens en marchant", "Walk back"] }])), appels: g => [...APPELS.directions, ...(APPELS[g] || [])] },
  suspensions: { nom: ["Suspensions", "Hangboard repeaters"], sous: ["Sept secondes suspendu, trois secondes de repos, six fois de suite : la méthode classique pour des doigts plus forts.", "Seven seconds hanging, three seconds of rest, six times in a row: the classic method for stronger fingers."],
    couleur: "#F59E0B", unite: ["suspensions", "hangs"], aide: ["Sur une prise large et confortable, bras légèrement fléchis, épaules engagées. Échauffe tes doigts avant et arrête au moindre signal de douleur. Pour des grimpeurs qui pratiquent déjà depuis au moins un an.", "On a large, comfortable hold, arms slightly bent, shoulders engaged. Warm up your fingers first and stop at the slightest pain. For climbers with at least a year of practice."],
    regl: [["s", "Séries", "Sets", n3([3, 4, 5, 6]), 4], ["r", "Repos entre les séries", "Rest between sets", secs([[120, "2 min"], [180, "3 min"], [240, "4 min"]]), 180]],
    phases: R => fois(R.s, i => fois(6, j => [{ e: 1, d: 7, voix: ["Suspends-toi", "Hang"], lab: [`Série ${i + 1}/${R.s} · suspension ${j + 1}/6`, `Set ${i + 1}/${R.s} · hang ${j + 1}/6`] },
      { d: j === 5 ? R.r : 3, lab: j === 5 ? ["Repos entre les séries", "Rest between sets"] : ["Lâche", "Let go"] }])) },
  piscine: { nom: ["Chrono piscine", "Pool clock"], sous: ["Un départ à intervalle fixe : tu nages ta distance, et le temps qui reste avant le départ suivant est ton repos. Pose le téléphone au bord du bassin, à l’abri des éclaboussures.", "A start at a fixed interval: you swim your distance, and the time left before the next start is your rest. Put your phone by the pool, away from splashes."],
    couleur: "#0284C7", unite: ["départs", "starts"], aide: ["Choisis un intervalle qui te laisse 10 à 20 secondes de repos à chaque répétition. Par exemple, 100 mètres nagés en 1 min 45 avec un départ toutes les 2 min.", "Pick an interval that leaves you 10 to 20 seconds of rest per rep. For example, 100 metres swum in 1:45 with a start every 2 minutes."],
    regl: [["n", "Répétitions", "Reps", n3([4, 6, 8, 10, 12, 16]), 8], ["d", "Un départ toutes les", "A start every", secs([[45, "45 s"], [60, "1 min"], [75, "1 min 15"], [90, "1 min 30"], [120, "2 min"], [150, "2 min 30"]]), 90]],
    phases: R => fois(R.n, i => [{ e: 1, d: R.d, voix: ["Départ", "Go"], lab: [`Répétition ${i + 1}/${R.n}`, `Rep ${i + 1}/${R.n}`] }]) } };
function ouvrirMinuteurSport(cle, grp, retourVers = () => vueMode(grp)) {
  clearInterval(tMin); const M = MINUTEURS[cle], R = { ...Object.fromEntries(M.regl.map(r => [r[0], r[4]])), ...(lireJSON("minuteurs", {})[cle] || {}) };
  let P = [], t0 = 0, cumul = 0, sec = -1, cour = -1, prochain = 0;
  const total = () => P.reduce((s, p) => s + p.d, 0), ecoule = () => (cumul + (t0 ? Date.now() - t0 : 0)) / 1000 - 10, dire = (c, v = 1.2) => c && parler(c[langueVoix === "fr" ? 0 : 1], 700, v);   // 10 s de préparation
  outil(L(...M.nom), L(...M.sous), `<div class="carnet" id="msRegl">${M.regl.map(([k, f, e, o]) => `<span class="champ-titre">${L(f, e)}</span>${chips("m" + k, o, R[k])}`).join("")}${M.aide ? `<p class="sh-aide">${L(...M.aide)}</p>` : ""}</div>
    <p class="count" id="msLab"></p><div class="time petit" id="msTemps"></div><p class="combo" id="msAppel" aria-live="polite"></p>
    <div class="controls" style="grid-template-columns:1fr 1.6fr"><button id="msStop">${L("Arrêter", "Stop")}</button><button id="msGo" class="main">${L("Démarrer", "Start")}</button></div><div id="msRes"></div>`, retourVers);
  const aff = () => { P = M.phases(R, grp).flat(); while (P.length && !P[P.length - 1].e) P.pop();   // la séance s'arrête au dernier effort
    $("msLab").textContent = `${P.filter(p => p.e).length} ${L(...M.unite)} · ${mmss(total())} ${L("au total", "in total")}`; $("msTemps").textContent = mmss(P[0].d); };
  M.regl.forEach(([k]) => brancherChips("m" + k, v => { R[k] = isNaN(+v) ? v : +v; stocker("minuteurs", JSON.stringify({ ...lireJSON("minuteurs", {}), [cle]: R })); if (!t0 && !cumul) aff(); }));
  const fin = complet => {
    clearInterval(tMin); garderEcran(false); const fait = Math.max(0, Math.min(total(), Math.round(ecoule()))); let a = 0; const n = P.filter(p => { const ok = p.e && a < fait; a += p.d; return ok; }).length;
    t0 = cumul = 0; sec = cour = -1; $("msRegl").classList.remove("hidden"); $("msGo").textContent = L("Démarrer", "Start"); $("msAppel").textContent = ""; document.documentElement.style.setProperty("--accent", "var(--vert)"); aff();
    if (fait < 60) return;   // moins d'une minute : rien à noter
    const h = lireHist(); h.push({ j: jourCle(), hr: new Date().getHours(), k: "sport:" + cle, t: L(...M.nom) + " · " + n + " " + L(...M.unite), m: "seance", s: fait, n, c: grp, b: 0, p: 0, g: 0, tb: 0, nv: "", e: [] });
    stocker("historique", JSON.stringify(h.slice(-3000))); const neufs = verifierTrophees();
    $("msRes").innerHTML = `<div class="carnet"><h3>${complet ? "🏁 " + L("Séance terminée !", "Session complete!") : L("Séance notée", "Session saved")}</h3><p>${n} ${L(...M.unite)} · ${Math.round(fait / 60)} min</p></div>` + blocGain()
      + neufs.map(t => `<div class="nouveau-trophee">${medaille(t, "n")}<div><small>${L("Nouveau trophée", "New trophy")}</small><b>${L(t[1], t[2])}</b></div></div>`).join("");
    if (complet) { confettis(); dire(["Séance terminée. Bravo !", "Session over. Well done!"], 0.95); }
  };
  const tic = () => {
    const e = ecoule(), s = Math.floor(e); if (s === sec) return; sec = s;
    if (e < 0) { $("msLab").textContent = L("Prépare-toi", "Get ready"); $("msTemps").textContent = mmss(-s); if (s >= -3) sons.alerte(); return; }
    if (e >= total()) return fin(true);
    let k = 0, a = 0; while (a + P[k].d <= e) a += P[k++].d;
    const p = P[k], dans = e - a, reste = Math.ceil(p.d - dans);
    $("msLab").textContent = L(...p.lab); $("msTemps").textContent = mmss(reste);
    if (k !== cour) { cour = k; sons.change(); vibrer(p.e ? [60] : [30]); document.documentElement.style.setProperty("--accent", p.e ? M.couleur : "#10B981");
      const c = p.e ? (M.appels ? hasard(M.appels(grp)) : p.voix || ["Go !", "Go!"]) : p.d >= 30 ? ["Repos", "Rest"] : null;
      $("msAppel").textContent = c ? L(...c) : L(...p.lab); dire(c); prochain = dans + (p.ap || 1e9); }
    else if (p.e && p.ap && dans >= prochain && reste > 1) { const c = hasard(M.appels(grp)); $("msAppel").textContent = L(...c); dire(c, 1.3); prochain = dans + p.ap; }
    else if (reste <= 3 && P[k + 1] && P[k + 1].e) sons.alerte();
  };
  $("msGo").onclick = () => { amorcerVoix(); if (t0) { cumul += Date.now() - t0; t0 = 0; clearInterval(tMin); $("msGo").textContent = L("Reprendre", "Resume"); return; }
    if (!cumul) { $("msRes").innerHTML = ""; $("msRegl").classList.add("hidden"); aff(); } t0 = Date.now(); $("msGo").textContent = L("Pause", "Pause"); garderEcran(true); sec = -99; clearInterval(tMin); tMin = setInterval(tic, 200); tic(); };
  $("msStop").onclick = () => (t0 || cumul) && fin(false);
  aff();
}

/* --- Course : allures d'entraînement calculées depuis la VMA du test navette --- */
function ouvrirAllures(retourVers) {
  const v = derniereVma(), Z = [["Footing et récupération", "Easy running and recovery", .6, .7], ["Endurance active", "Steady endurance", .75, .8], ["Seuil", "Threshold", .85, .9], ["Intervalles de 30 s à 3 min", "Intervals from 30 s to 3 min", .95, 1.05], ["Sprints courts", "Short sprints", 1.1, 1.3]];
  const kmh = x => (v * x).toFixed(1).replace(".", L(",", ".")), mpk = x => { const s = Math.round(3600 / (v * x)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  outil(L("Mes allures de course", "My running paces"), L("Tes vitesses d’entraînement calculées à partir de ta VMA : chaque type de séance a sa zone.", "Your training speeds worked out from your top aerobic speed: each type of session has its zone."),
    v ? `<div class="carte"><h2>VMA · ${kmh(1)} km/h</h2><ul class="carnet ef-liste records">${Z.map(([f, e, a, b]) => `<li><span>${L(f, e)}<br><small>${Math.round(a * 100)} à ${Math.round(b * 100)} % VMA</small></span><b>${kmh(a)}–${kmh(b)} km/h<br><small>${mpk(b)} à ${mpk(a)} /km</small></b></li>`).join("")}</ul>
      <p class="sh-aide">${L("Repère sur piste : 400 mètres à ta VMA en ", "Track guide: 400 metres at your top aerobic speed in ")}${mmss(Math.round(400 / (v / 3.6)))}.</p></div><button class="toggle contour" id="alTest">${L("Refaire le test navette", "Retake the shuttle test")}</button>`
    : `<p class="vide">${L("Fais d’abord le test navette : il prend une quinzaine de minutes, échauffement compris, et l’appli calcule ensuite toutes tes allures.", "Take the shuttle test first: it takes about fifteen minutes including the warm-up, then the app works out all your paces.")}</p><button class="primary" id="alTest">${L("Faire le test navette", "Take the shuttle test")}</button>`, retourVers);
  $("alTest").onclick = ouvrirNavette;
}

/* --- Tests de forme propres à certains sports --- */
TESTS.push(["suspensionMax", "Suspension maximale", "Max dead hang", "s", "s", "Suspendu à une barre ou à une prise large, bras tendus : tiens le plus longtemps possible. Note ton temps en secondes.", "Hang from a bar or a large hold with straight arms: hold as long as you can. Note your time in seconds."],
  ["sautLongueur", "Saut en longueur sans élan", "Standing long jump", "cm", "cm", "Pieds joints derrière une ligne, saute le plus loin possible vers l’avant et reçois-toi sur les deux pieds. Mesure jusqu’au talon le plus proche de la ligne.", "Feet together behind a line, jump as far forward as you can and land on both feet. Measure to the heel closest to the line."]);

/* --- Exercices spécifiques ajoutés aux séances de renfo de chaque sport (juste après les deux premiers mouvements) --- */
Object.entries({ renfoTennis: ["splitStep", "fenteEtoile"], renfoPadel: ["splitStep", "bandejaVide"], renfoFoot: ["nordique", "sprintNavette", "receptionSaut"], renfoBasket: ["receptionSaut", "pasDefensifs", "sautsRebond"],
  renfoVolley: ["sautsRebond", "receptionSaut"], renfoHandball: ["receptionSaut", "pasDefensifs"], renfoCourse: ["fouleesBond", "squatUni"], renfoCyclisme: ["squatUni"], renfoNatation: ["streamline"], renfoSki: ["squatFreine", "fenteSautee"],
  renfoSurf: ["rotationSurf", "equilibreSurf"], renfoPilates: ["teaser", "swimmingPil", "ciseaux"], renfoTennisMat: ["rotElastique"], renfoPadelMat: ["rotElastique"], renfoHandballMat: ["lancerMedecine"], renfoEscaladeMat: ["tractionBloquee", "doigtsElastique"], renfoNatationMat: ["nageElastique"] })
  .forEach(([k, l]) => { const R = ROUTINES[k]; if (!R) return; R.exercices = [...new Set([...R.exercices.slice(0, 2), ...l, ...R.exercices.slice(2)])]; CONSEILLES[k] = [...new Set([...(CONSEILLES[k] || []), ...l])]; });

/* --- Programmes de 4 semaines (même format que PROGRAMMES ; le 13e champ = le sport, pour le cardio et les noms des semaines) --- */
{
  const MOB = ["catcow", "openbook", "hip9090", "thread", "wgs", "cossack"], REC = ["catcow", "cascade", "genouxPoitrine", "torsionAllongee", "figure4", "enfantStat"];
  const mob = ["mobilite", "Mobilité", "Mobility", MOB, null], rec = ["recup", "Étirements et respiration", "Stretching and breathing", REC, null], facile = ["fract", "Cardio facile", "Easy cardio", ["facile", "facile", "facile", "facile", "facile"], null];
  const fr = (f, e, l) => ["fract", f, e, l, null], fo = (f, e, l, r = "bas", t = "force") => [t, f, e, l, r];
  const prog = (id, grp, c, t, d, o, sem, regl = [35, 20, [2, 3, 3, 2], "dyn"]) => PROGRAMMES.push([id, t[0], t[1], d[0], d[1], c, ["Tous niveaux", "All levels"], "15–45 min", o[0], o[1], sem, regl, grp]);
  prog("raquette", "tennis", "#0EA5E9", ["Tenir les échanges · tennis et padel", "Last every rally · tennis and padel"], ["4 semaines pour garder ton explosivité jusqu’au dernier jeu : cardio au rythme des points, appuis, épaule et tronc.", "4 weeks to keep your explosiveness until the last game: cardio at match rhythm, footwork, shoulder and trunk."],
    [["Récupérer plus vite entre les points", "Démarrer plus vite sur chaque balle", "Protéger l’épaule et le coude"], ["Recover faster between points", "React faster to every ball", "Protect the shoulder and elbow"]],
    [fr("Cardio match", "Match cardio", ["sprints", "points", "points", "points-", "points"]), fo("Jambes et appuis", "Legs and footwork", ["splitStep", "fenteEtoile", "squatsaute", "pasChasse", "equilibre", "alfredson"]), mob,
     fr("Cardio par rafales", "Burst cardio", ["groupes", "groupes", "points", "groupes-", "groupes"]), fo("Épaule et tronc", "Shoulder and trunk", ["rotEpaule", "poignetExc", "planchelat", "russian", "scap", "coupDroit"], "haut"), facile, rec]);
  prog("collectif", "foot", "#16A34A", ["Pré-saison · sports collectifs", "Pre-season · team sports"], ["4 semaines pour arriver prêt à la reprise : sprints répétés, intermittent, puissance et prévention des blessures.", "4 weeks to be ready for the season: repeated sprints, intermittent running, power and injury prevention."],
    [["Répéter les sprints jusqu’à la fin du match", "Sauter et changer de direction plus vite", "Moins de blessures aux ischios et à l’aine"], ["Repeat sprints until the end of the match", "Jump and change direction faster", "Fewer hamstring and groin injuries"]],
    [fr("Sprints répétés", "Repeated sprints", ["sprints", "rsa", "rsa", "rsa-", "rsa"]), fo("Prévention et puissance", "Prevention and power", ["nordique", "copenhague", "receptionSaut", "fentesalt", "equilibre", "planche"]), mob,
     fr("Intermittent", "Intermittent", ["groupes", "intermittent", "intermittent", "intermittent-", "intermittent"]), fo("Appuis et détente", "Footwork and jumping", ["sprintNavette", "pasDefensifs", "sautsRebond", "squatsaute", "planchelat", "hollow"]), facile, rec]);
  prog("course510", "course", "#2563EB", ["Progresser en course · 5 à 10 km", "Run faster · 5 to 10 km"], ["4 semaines pour courir plus vite et plus longtemps : intervalles, seuil, sorties faciles et renfo du coureur.", "4 weeks to run faster and longer: intervals, threshold, easy runs and runner’s strength work."],
    [["Courir plus vite à effort égal", "Tenir une allure plus longtemps", "Des jambes et des tendons plus solides"], ["Run faster for the same effort", "Hold a pace for longer", "Stronger legs and tendons"]],
    [fr("Intervalles courts", "Short intervals", ["sprints", "intermittent", "intermittent", "intermittent-", "intermittent"]), fo("Jambes de coureur", "Runner’s legs", ["squatUni", "mollet1", "alfredson", "pontuni", "fenteSautee", "planchelat"]), mob,
     fr("Seuil", "Threshold", ["seuil", "seuil", "tolerance", "seuil-", "seuil"]), fo("Gammes et gainage", "Drills and core", ["askip", "heelkick", "fouleesBond", "jambesTendues", "planche", "deadbug"]), ["fract", "Sortie facile", "Easy run", ["facile", "facile", "facile", "facile", "facile"], null], rec]);
  prog("velo", "cyclisme", "#0F766E", ["Préparer la saison vélo", "Get ready for the cycling season"], ["4 semaines pour rouler plus fort : seuil, efforts courts, jambes et gainage du cycliste.", "4 weeks to ride stronger: threshold, short efforts, legs and cyclist’s core."],
    [["Tenir un effort soutenu plus longtemps", "Relancer plus fort", "Un dos qui tient sur les longues sorties"], ["Hold a hard effort for longer", "Accelerate harder", "A back that holds up on long rides"]],
    [fr("Seuil", "Threshold", ["seuil", "seuil", "seuil", "seuil-", "seuil"]), fo("Jambes et gainage", "Legs and core", ["squatUni", "chaise", "pontuni", "fentesalt", "planchelat", "bird"]), mob,
     fr("Efforts courts", "Short efforts", ["sprints", "pyramide", "tolerance", "sprints-", "pyramide"]), fo("Gainage du cycliste", "Cyclist’s core", ["planche", "planchelat", "bird", "deadbug", "superman", "hydrant"], "complet", "gainage"), facile, rec]);
  prog("grimpe", "escalade", "#F59E0B", ["Doigts et tirage · escalade", "Fingers and pulling · climbing"], ["4 semaines pour grimper plus fort : force des doigts, tirage, gainage et muscles opposés pour protéger les épaules.", "4 weeks to climb harder: finger strength, pulling, core and opposing muscles to protect the shoulders."],
    [["Des doigts plus forts", "Tenir les blocages", "Des épaules équilibrées et protégées"], ["Stronger fingers", "Hold lock-offs", "Balanced, protected shoulders"]],
    [fo("Doigts et tirage", "Fingers and pulling", ["suspension", "tractionBloquee", "tractions", "doigtsElastique", "scap", "relevesJambes"], "haut"), mob, fo("Muscles opposés", "Opposing muscles", ["pompes", "pike", "rotEpaule", "poignetExc", "scap", "planchelat"], "haut"),
     fr("Cardio", "Cardio", ["seuil", "pyramide", "tolerance", "seuil-", "pyramide"]), fo("Gainage du grimpeur", "Climber’s core", ["hollow", "deadbug", "planchelat", "ours", "superman", "bird"], "complet", "gainage"), rec, facile]);
  prog("nageur", "natation", "#0284C7", ["Nageur plus fort · hors de l’eau", "Stronger swimmer · out of the water"], ["4 semaines pour compléter tes séances de piscine : épaules du nageur, gainage, battements et cardio.", "4 weeks to complement your pool sessions: swimmer’s shoulders, core, kicks and cardio."],
    [["Une traction plus puissante", "Un corps gainé et aligné dans l’eau", "Des épaules protégées"], ["A more powerful pull", "A braced, streamlined body in the water", "Protected shoulders"]],
    [fo("Épaules du nageur", "Swimmer’s shoulders", ["nageElastique", "streamline", "rotEpaule", "scap", "crawlSec", "bandPullApart"], "haut"), fr("Seuil", "Threshold", ["seuil", "seuil", "tolerance", "seuil-", "seuil"]), mob,
     fo("Gainage et battements", "Core and kicks", ["battements", "hollow", "superman", "planchelat", "deadbug", "swimmingPil"], "complet", "gainage"), fr("Efforts courts", "Short efforts", ["sprints", "groupes", "pyramide", "sprints-", "groupes"]), rec, facile]);
  prog("surfeur", "surf", "#0891B2", ["Rame et pop-up · surf", "Paddling and pop-up · surf"], ["4 semaines pour ramer plus longtemps et te relever plus vite : cardio de rame, épaules, pop-up et équilibre.", "4 weeks to paddle longer and pop up faster: paddling cardio, shoulders, pop-up and balance."],
    [["Ramer plus longtemps sans t’épuiser", "Un pop-up rapide et stable", "Plus d’équilibre sur la planche"], ["Paddle longer without tiring", "A quick, stable pop-up", "Better balance on the board"]],
    [fr("Cardio de rame", "Paddling cardio", ["seuil", "pyramide", "seuil", "seuil-", "pyramide"]), fo("Pop-up et jambes", "Pop-up and legs", ["popup", "surfsquat", "rotationSurf", "fenteSautee", "equilibreSurf", "squatsaute"]), mob,
     fo("Épaules de rameur", "Paddler’s shoulders", ["paddle", "streamline", "rotEpaule", "scap", "superman", "pompes"], "haut"), fr("Sprints de rame", "Paddle sprints", ["sprints", "groupes", "groupes", "sprints-", "groupes"]), rec, facile]);
  prog("posture", "pilates", "#A855F7", ["Posture et centre · Pilates", "Posture and core · Pilates"], ["4 semaines pour un centre solide et une meilleure posture, avec des enchaînements de Pilates de plus en plus exigeants.", "4 weeks for a strong core and better posture, with increasingly demanding Pilates sequences."],
    [["Un centre plus solide", "Un dos plus droit au quotidien", "Plus de contrôle dans chaque mouvement"], ["A stronger core", "A straighter back every day", "More control in every movement"]],
    [fo("Le centre", "The core", ["hundred", "rollUp", "ciseaux", "deadbug", "planche"], "complet", "gainage"), mob, fo("Dos et fessiers", "Back and glutes", ["swimmingPil", "superman", "pontuni", "hydrant", "bird", "cercleJambe"], "complet"),
     fo("Abdos profonds", "Deep abs", ["teaser", "ciseaux", "hundred", "planchelat", "hollow"], "complet", "gainage"), mob, fo("Équilibre et posture", "Balance and posture", ["equilibre", "squat", "bird", "swimmingPil", "planche"], "complet"), rec], [40, 20, [2, 2, 3, 2], "doux"]);
}

/* --- Ce qu'affiche « Ton cardio » de chaque sport : ses outils et son programme --- */
const outilSport = (cle, g, f, e, df, de) => [f, e, df, de, MINUTEURS[cle].couleur, r => ouvrirMinuteurSport(cle, g, r)];
const SPORT_PLUS = {
  boxe: [[["Mode combat", "Fight mode", "Rounds avec cloche, repos et enchaînements annoncés par la voix", "Rounds with bell, rest and combinations called by the voice", "#DC2626", r => ouvrirCombat(r)]], "cardioBoxe"],
  ...Object.fromEntries(["tennis", "padel"].map(g => [g, [[outilSport("echanges", g, "Mode échanges", "Rally mode", "Des points comme en match, coups et déplacements annoncés par la voix", "Points like in a match, shots and movements called by the voice")], "raquette"]])),
  ...Object.fromEntries(["foot", "basket", "handball", "volley"].map(g => [g, [[outilSport("sprints", g, "Sprints répétés", "Repeated sprints", "Des sprints de 6 secondes, direction annoncée au dernier moment", "6-second sprints, direction called at the last moment")], "collectif"]])),
  course: [[["Mes allures", "My paces", "Tes vitesses d’entraînement calculées depuis ta VMA", "Your training speeds worked out from your top aerobic speed", "#2563EB", r => ouvrirAllures(r)]], "course510"],
  escalade: [[outilSport("suspensions", "escalade", "Suspensions", "Hangboard repeaters", "Minuteur de suspensions : 7 s accroché, 3 s de repos", "Hang timer: 7 s on, 3 s off")], "grimpe"],
  natation: [[outilSport("piscine", "natation", "Chrono piscine", "Pool clock", "Un départ toutes les X secondes, annoncé par la voix", "A start every X seconds, called by the voice")], "nageur"],
  cyclisme: [[], "velo"], ski: [[], "ski"], surf: [[], "surfeur"], pilates: [[], "posture"] };
