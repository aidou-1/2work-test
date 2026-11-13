/* ============ SALLE DE MUSCULATION : séances par objectif ============
   L'utilisateur choisit un objectif (méthode), puis une séance type. La séance est construite comme en salle :
   échauffement général → séries d'approche → exercices polyarticulaires lourds → isolation → retour au calme.
   Paramètres issus des recommandations ACSM (2009), Schoenfeld et al. (2017, 2021) et des revues citées dans chaque fiche. */
// [couleur, nom FR, nom EN, accroche FR, accroche EN, principal [séries, reps, texte reps], accessoires [séries, reps, texte],
//  charge principale, charge accessoires, RIR, tempo, repos principal s, repos accessoires s, effort visé, circuit]
const METHODES = {
  force: ["#B91C1C", "Force maximale", "Maximal strength", "Soulever plus lourd : charges élevées, peu de répétitions, longs repos", "Lift heavier: heavy loads, few reps, long rests", [5, 4, "3–5"], [3, 6, "6–8"], "85–90 %", "75–80 %", "1–2", "2-1-X-0", 180, 90, "8–9", 0],
  hypertrophie: ["#7C3AED", "Prise de muscle", "Muscle growth", "Hypertrophie : volume, tension et contrôle pour développer le muscle", "Hypertrophy: volume, tension and control to build muscle", [4, 8, "6–10"], [3, 12, "10–15"], "70–80 %", "60–70 %", "1–3", "3-0-1-0", 120, 75, "7–9", 0],
  endurance: ["#0891B2", "Endurance & tonification", "Endurance & toning", "Charges légères, séries longues, repos courts : tonus et résistance à la fatigue", "Light loads, long sets, short rests: tone and fatigue resistance", [3, 15, "15"], [3, 20, "15–20"], "55–65 %", "50–60 %", "2–4", "2-0-1-0", 60, 45, "6–7", 0],
  puissance: ["#EA580C", "Puissance & explosivité", "Power & explosiveness", "Bouger vite et fort : la vitesse d’exécution avant la charge", "Move fast and strong: speed of movement before load", [5, 3, "3"], [3, 6, "5–6"], "40–60 %", "65–75 %", "3–4", "1-0-X-0", 150, 90, "7", 0],
  excentrique: ["#BE185D", "Excentrique (négatives)", "Eccentric (negatives)", "Descente très lente : plus de force, des tendons solides, du muscle", "Very slow lowering: more strength, stronger tendons, more muscle", [4, 6, "6"], [3, 8, "8"], "70–80 %", "60–70 %", "2", "5-0-1-0", 150, 90, "8", 0],
  concentrique: ["#2563EB", "Concentrique (sans courbatures)", "Concentric (low soreness)", "Accent sur la poussée explosive, descente sans freiner : moins de courbatures", "Focus on an explosive push, quick lowering: less soreness", [4, 8, "8"], [3, 10, "10"], "65–75 %", "60–70 %", "2–3", "1-0-X-1", 90, 60, "7", 0],
  isometrique: ["#0D9488", "Isométrique (pauses)", "Isometric (pauses)", "Tenir 3 s au point le plus dur : contrôle, gainage et tendons", "Hold 3 s at the hardest point: control, bracing and tendons", [4, 5, "5"], [3, 6, "6"], "70–75 %", "60–70 %", "2–3", "2-3-1-0", 120, 90, "7–8", 0],
  circuit: ["#16A34A", "Circuit brûle-graisses", "Fat-burning circuit", "Enchaînement sans pause d’exercices : cardio et muscles en même temps", "Exercises back to back: cardio and strength at the same time", [4, 12, "12–15"], [4, 12, "12–15"], "50–65 %", "50–65 %", "2–3", "2-0-1-0", 15, 15, "7–8", 1]
};
const METHODES_TXT = {   // principe, pour qui, fréquence, conseils (FR puis EN), science
  force: ["Peu de répétitions avec une charge proche de ton maximum. Le gain vient surtout du système nerveux : il apprend à recruter plus de fibres musculaires en même temps.", "Few reps with a load close to your maximum. Gains come mainly from the nervous system, which learns to recruit more muscle fibres at once.",
    "Pratiquants ayant déjà au moins 6 mois de musculation et une technique propre sur les mouvements de base.", "Lifters with at least 6 months of training and clean technique on the basic lifts.",
    "2 à 3 séances par semaine, 48 à 72 h entre deux séances pour le même muscle.", "2 to 3 sessions a week, 48 to 72 h between sessions for the same muscle.",
    [["Utilise un partenaire ou des sécurités sur les exercices lourds (squat, développé couché).", "Use a spotter or safety bars on heavy lifts (squat, bench press)."], ["Monte la barre le plus vite possible tout en restant contrôlé : l’intention de vitesse compte.", "Drive the bar up as fast as possible while staying in control: intent matters."], ["Respecte les longs repos : sortir trop tôt fait perdre de la force sur la série suivante.", "Respect the long rests: starting too soon costs strength on the next set."]],
    "ACSM (2009) recommande 1 à 6 répétitions à 80–100 % du maximum pour la force. La méta-analyse de Schoenfeld et al. (2017) montre que les charges lourdes donnent plus de force que les charges légères, à volume égal."],
  hypertrophie: ["Un volume important (nombre de séries par muscle), un temps sous tension contrôlé et des séries menées près de l’échec : ce sont les trois leviers principaux de la prise de muscle.", "High volume (sets per muscle), controlled time under tension and sets taken close to failure: the three main drivers of muscle growth.",
    "Tous niveaux. C’est la méthode la plus polyvalente pour gagner du muscle et de la force.", "All levels. The most versatile method to gain muscle and strength.",
    "2 séances par semaine et par muscle, soit 10 à 20 séries par muscle et par semaine.", "2 sessions per muscle each week, i.e. 10 to 20 sets per muscle per week.",
    [["Descends en 3 secondes en sentant le muscle travailler, remonte sans à-coup.", "Lower in 3 seconds, feeling the muscle, lift without jerking."], ["Ajoute 1 ou 2 répétitions, ou un peu de charge, d’une semaine à l’autre (surcharge progressive).", "Add 1 or 2 reps or a little weight from week to week (progressive overload)."], ["Mange assez de protéines (environ 1,6 g par kilo et par jour) et dors bien.", "Eat enough protein (about 1.6 g per kg per day) and sleep well."]],
    "Schoenfeld et al. (2017) : plus de séries par semaine donnent plus de muscle, jusqu’à environ 10 séries et plus par muscle. Schoenfeld et al. (2021) : des charges de 30 à 85 % fonctionnent si les séries sont menées près de l’échec. Morton et al. (2018) : environ 1,6 g de protéines par kilo et par jour."],
  endurance: ["Des charges légères répétées longtemps avec peu de repos. Le muscle apprend à résister à la fatigue et à mieux utiliser l’oxygène ; idéal pour se tonifier sans prendre beaucoup de volume.", "Light loads repeated many times with little rest. The muscle learns to resist fatigue and use oxygen better; ideal for toning without adding much size.",
    "Débutants, reprise, sports d’endurance, ou personnes qui veulent se tonifier.", "Beginners, comebacks, endurance athletes, or anyone wanting to tone up.",
    "2 à 4 séances par semaine.", "2 to 4 sessions a week.",
    [["Garde une technique impeccable jusqu’à la dernière répétition, même quand ça brûle.", "Keep perfect form to the last rep, even when it burns."], ["Respire de façon régulière : expire sur l’effort.", "Breathe steadily: breathe out on the effort."], ["Les repos courts font monter le cardio : c’est voulu.", "Short rests raise your heart rate: that is the point."]],
    "ACSM (2009) recommande 10 à 25 répétitions avec des charges légères à modérées et des repos courts pour l’endurance musculaire locale."],
  puissance: ["Des charges modérées déplacées le plus vite possible. On entraîne la vitesse de contraction et la capacité à produire beaucoup de force en peu de temps : utile pour sauter, sprinter, frapper.", "Moderate loads moved as fast as possible. It trains contraction speed and the ability to produce a lot of force quickly: useful to jump, sprint and strike.",
    "Sportifs (sports collectifs, combat, athlétisme) ayant déjà une bonne base de force.", "Athletes (team sports, combat, track) with a solid strength base.",
    "1 à 3 séances par semaine, toujours en début de séance, quand tu es frais.", "1 to 3 sessions a week, always early in the session while fresh.",
    [["Arrête la série dès que la vitesse diminue : on cherche la qualité, pas la fatigue.", "Stop the set as soon as speed drops: quality, not fatigue."], ["Chaque répétition doit être explosive à la montée, contrôlée à la descente.", "Every rep explosive on the way up, controlled on the way down."], ["Évite cette méthode si tu as une douleur articulaire.", "Avoid this method if you have joint pain."]],
    "Suchomel et al. (2018) et Cormie et al. (2011) : la puissance se développe avec des charges de 30 à 70 % déplacées à vitesse maximale, sur une base de force déjà construite."],
  excentrique: ["On ralentit volontairement la phase de descente (la phase « excentrique », quand le muscle s’allonge en freinant la charge). Le muscle est plus fort en freinant qu’en poussant : cette phase permet un stimulus intense.", "You deliberately slow the lowering phase (the eccentric phase, when the muscle lengthens while braking the load). Muscles are stronger when braking than pushing, so this phase gives an intense stimulus.",
    "Intermédiaires et confirmés qui veulent gagner en force et en solidité des tendons.", "Intermediate and advanced lifters who want more strength and sturdier tendons.",
    "1 séance par semaine et par muscle : les courbatures sont plus fortes, prévois 72 h de récupération.", "1 session per muscle per week: soreness is greater, allow 72 h to recover.",
    [["Compte 5 secondes à la descente, puis remonte normalement.", "Count 5 seconds on the way down, then lift normally."], ["Attends-toi à des courbatures la première semaine : elles diminuent ensuite (effet de protection).", "Expect soreness in the first week: it decreases afterwards (repeated-bout effect)."], ["Ne bloque pas ta respiration sur la longue descente.", "Don’t hold your breath during the long lowering."]],
    "Roig et al. (2009, BJSM) : l’entraînement excentrique donne plus de force et un peu plus de masse musculaire que le concentrique. Il est aussi très utilisé pour renforcer les tendons, comme celui d’Achille."],
  concentrique: ["On met l’accent sur la phase de poussée (concentrique), très rapide, et on redescend sans freiner fort. Comme ce sont surtout les phases de freinage qui causent les courbatures, cette méthode fatigue moins les muscles le lendemain.", "The focus is on a fast pushing (concentric) phase, with a quick lowering without heavy braking. As braking phases cause most soreness, this method leaves muscles less sore the next day.",
    "Reprise après une pause, sportifs la veille d’une compétition, ou périodes de fatigue. Privilégie les machines.", "Coming back from a break, athletes the day before competing, or tired periods. Prefer machines.",
    "2 à 3 séances par semaine possibles grâce à une récupération rapide.", "2 to 3 sessions a week thanks to fast recovery.",
    [["Sur les machines, laisse revenir la charge en 1 seconde, sans la lâcher.", "On machines, let the weight return in 1 second, without dropping it."], ["Pousse de façon explosive à chaque répétition.", "Push explosively on every rep."], ["Idéal pour garder la forme sans être courbaturé avant un match.", "Ideal to stay in shape without soreness before a match."]],
    "Les courbatures sont principalement liées aux contractions excentriques (Proske & Morgan, 2001) ; l’entraînement à dominante concentrique en provoque nettement moins."],
  isometrique: ["Tu fais une pause de 3 secondes au point le plus difficile de chaque répétition (en bas d’un squat, poitrine près de la barre…). Cela supprime l’élan, renforce le contrôle et le gainage, et charge les tendons de façon douce.", "You pause for 3 seconds at the hardest point of each rep (bottom of a squat, bar near the chest…). It removes momentum, builds control and bracing, and loads tendons gently.",
    "Tous niveaux, très utile pour corriger la technique ou en cas de tendons sensibles.", "All levels, very useful to fix technique or with sensitive tendons.",
    "2 à 3 séances par semaine.", "2 to 3 sessions a week.",
    [["Pendant la pause, reste gainé et immobile : pas de rebond.", "During the pause, stay braced and still: no bouncing."], ["Respire court pendant la pause, ne bloque pas.", "Take short breaths during the pause, don’t hold."], ["Choisis une charge un peu plus légère que d’habitude.", "Pick a slightly lighter load than usual."]],
    "Oranchuk et al. (2019) : l’isométrie améliore la force et la raideur des tendons. Rio et al. (2015) : les contractions tenues réduisent la douleur des tendons."],
  circuit: ["Les exercices s’enchaînent avec seulement 15 secondes de transition, puis une récupération à la fin de chaque tour. Le cœur reste élevé tout le long : on combine renforcement et cardio pour une forte dépense énergétique.", "Exercises follow each other with only 15 seconds of transition, then a recovery at the end of each round. Heart rate stays high throughout: strength and cardio combined for high energy expenditure.",
    "Tous niveaux, perte de poids, manque de temps.", "All levels, weight loss, short on time.",
    "2 à 4 séances par semaine, en alternant avec des séances plus lourdes.", "2 to 4 sessions a week, alternating with heavier sessions.",
    [["Prépare tout le matériel avant de commencer pour enchaîner sans attendre.", "Set up all your equipment before starting so you can move without waiting."], ["Choisis des charges qui te permettent de faire toutes les répétitions proprement.", "Pick loads that let you complete every rep cleanly."], ["Bois entre les tours.", "Drink between rounds."]],
    "Muñoz-Martínez et al. (2017) : l’entraînement en circuit améliore la condition cardiorespiratoire et la force chez l’adulte."]
};
// séance type : [nom FR, nom EN, muscles FR, muscles EN, exercices (2 premiers = polyarticulaires lourds), échauffement, retour au calme]
const SPLITS = {
  jambes: ["Jambes complètes", "Full legs", "Quadriceps, ischios, fessiers, mollets", "Quads, hamstrings, glutes, calves", ["squatBarre", "rdlBarre", "presseCuisses", "legCurl", "legExt", "molletsMachine"], ["ankles", "kneeup", "cossack", "wgs", "squat"], ["quadDebout", "ischioCouche", "figure4", "molletMur"]],
  fessiers: ["Fessiers & ischios", "Glutes & hamstrings", "Grand et moyen fessier, ischio-jambiers", "Glutes and hamstrings", ["hipThrust", "rdlBarre", "bulgare", "kickbackPoulie", "abducteurs", "adducteursMachine"], ["hydrant", "pont", "lateral", "wgs", "hip9090"], ["figure4", "ischioCouche", "papillon", "fenteBasse"]],
  push: ["Push · pecs, épaules, triceps", "Push · chest, shoulders, triceps", "Pectoraux, épaules, triceps", "Chest, shoulders, triceps", ["benchBarre", "militaire", "inclineHalteres", "crossover", "dbLateral", "poulieTriceps"], ["armcircles", "armcross", "scap", "bandPullApart", "pompes"], ["murPecs", "brasCroise", "triceps", "nuqueLat"]],
  pull: ["Pull · dos, biceps", "Pull · back, biceps", "Grand dorsal, trapèzes, arrière d’épaule, biceps", "Lats, traps, rear delts, biceps", ["tractions", "ezRow", "rowPoulie", "facePull", "curlPupitre", "curlMarteau"], ["armcircles", "catcow", "thread", "bandPullApart", "scap"], ["enfantStat", "brasCroise", "dosMains", "nuqueLat"]],
  haut: ["Haut du corps", "Upper body", "Pectoraux, dos, épaules, bras", "Chest, back, shoulders, arms", ["benchBarre", "ezRow", "militaire", "poulieTirage", "ezCurl", "poulieTriceps"], ["armcircles", "armcross", "scap", "thread", "pompes"], ["murPecs", "enfantStat", "brasCroise", "triceps"]],
  bas: ["Bas du corps (machines)", "Lower body (machines)", "Quadriceps, ischios, fessiers, adducteurs", "Quads, hamstrings, glutes, adductors", ["hackSquat", "presseCuisses", "legCurl", "legExt", "adducteursMachine", "abducteurs"], ["ankles", "kneeup", "heelkick", "lateral", "squat"], ["quadDebout", "ischioCouche", "papillon", "molletMur"]],
  full: ["Full body", "Full body", "Tout le corps en une séance", "Whole body in one session", ["squatBarre", "benchBarre", "ezRow", "rdlBarre", "militaire", "poulieCrunch"], ["armcircles", "twist", "kneeup", "inchworm", "wgs"], ["chien", "fenteBasse", "murPecs", "enfantStat"]]
};
const tempoSec = t => t.split("-").reduce((s, x) => s + (x === "X" ? 1 : +x), 0);
function seanceSalle(mId, sId, choix) {
  const M = METHODES[mId], [c, nFr, nEn, , , mp, ac, chP, chA, rir, tempo, rP, rA0, rpe, circuit] = M, S = SPLITS[sId];
  const reposId = "salle:" + mId + ":" + sId, rep = choix ?? reposLu(reposId, rP), k = rP ? rep / rP : 1, rA = r5(rA0 * k), rTour = r5(90 * k);
  const ok = l => l.filter(e => EXERCICES[e]), ex = ok(S[4]), dur = reps => Math.min(90, Math.max(15, reps * tempoSec(tempo) + 4));
  const presc = (reps, ch) => `${reps} ${L("reps", "reps")} · tempo ${tempo} · ${ch} ${L("du max", "of max")} · RIR ${rir}`;
  const plan = [], blocs = [], add = (q) => plan.push(q);
  // 1. échauffement général
  const ech = ok(S[5]); blocs.push({ n: L("Échauffement général", "General warm-up"), l: ech.map(e => [e, "30 s", ""]) });
  ech.forEach((e, k) => add({ id: e, d: 30, r: k < ech.length - 1 ? 5 : 15, bn: blocs[0].n, lab: blocs[0].n + " · " + (k + 1) + "/" + ech.length }));
  // 2. séries d'approche sur le premier exercice
  if (!circuit) {
    const n = L("Séries d’approche", "Warm-up sets"); blocs.push({ n, l: [[ex[0], "2 × 10 / 5", L("Série légère (~40 %) puis moyenne (~60 %)", "Light (~40 %) then medium (~60 %) set")]] });
    add({ id: ex[0], d: 30, r: 60, bn: n, lab: n + " · 1/2", presc: L("10 reps légères, environ 40 % : on prépare les articulations", "10 light reps, about 40 %: prepare the joints") });
    add({ id: ex[0], d: 20, r: 90, bn: n, lab: n + " · 2/2", presc: L("5 reps à environ 60 % : on prépare le système nerveux", "5 reps at about 60 %: prime the nervous system") });
  }
  // 3. corps de séance
  const nC = L(circuit ? "Circuit" : "Corps de séance", circuit ? "Circuit" : "Main workout"), lignes = [];
  if (circuit) {
    const T = mp[0];
    for (let t = 1; t <= T; t++) ex.forEach((e, k) => add({ id: e, d: dur(mp[1]), r: k < ex.length - 1 ? rep : t < T ? rTour : 20, ft: k === ex.length - 1 && t < T, bn: nC, lab: nC + " · " + L("tour", "round") + " " + t + "/" + T + " · " + (k + 1) + "/" + ex.length, presc: presc(mp[2], chP) }));
    ex.forEach(e => lignes.push([e, mp[0] + " " + L("tours", "rounds") + " × " + mp[2], `tempo ${tempo} · ${chP} · ${reposTxt(rep)} ${L("entre exercices", "between exercises")}, ${reposTxt(rTour)} ${L("entre tours", "between rounds")}`]));
  } else ex.forEach((e, k) => {
    const [ser, reps, txt] = k < 2 ? mp : ac, ch = k < 2 ? chP : chA, r = k < 2 ? rep : rA;
    for (let s = 1; s <= ser; s++) add({ id: e, d: dur(reps), r: s < ser ? r : k < ex.length - 1 ? r + 30 : 20, bn: nC, serie: s, series: ser, lab: EXERCICES[e].nom + " · " + L("série", "set") + " " + s + "/" + ser, presc: presc(txt, ch) });
    lignes.push([e, ser + " × " + txt, `tempo ${tempo} · ${ch} · RIR ${rir} · ${L("repos", "rest")} ${reposTxt(r)}`]);
  });
  blocs.push({ n: nC, l: lignes });
  // 4. retour au calme
  const rac = ok(S[6]), nR = L("Retour au calme", "Cool-down"); blocs.push({ n: nR, l: rac.map(e => [e, "30 s", ""]) });
  rac.forEach((e, k) => add({ id: e, d: 30, r: k < rac.length - 1 ? 5 : 0, bn: nR, lab: nR + " · " + (k + 1) + "/" + rac.length }));
  const T = METHODES_TXT[mId], cs = T[6][Math.floor(Math.random() * T[6].length)];
  const total = Math.round(plan.reduce((s, q) => s + q.d + q.r, 0) / 60);
  const html = `<li class="etude prog-carte-jour" style="--accent:${c}"><div><small><b>${L(nFr, nEn)} · ${L(S[0], S[1])}</b></small><small>🎯 ${L(METHODES[mId][3], METHODES[mId][4])}</small><small>⚖️ ${L("Charge : choisis un poids qui te laisse", "Load: pick a weight that leaves")} ${rir} ${L("répétitions en réserve (RIR) en fin de série.", "reps in reserve (RIR) at the end of the set.")}</small><small>💡 ${L(...cs)}</small></div></li>`
    + blocs.map(b => `<li class="bloc-titre"><div><b>${b.n}</b></div></li>` + b.l.map(([id, a, s]) => `<li class="bloc-ex">${vignette(id)}<div><b>${EXERCICES[id].nom}</b><small>${s || EXERCICES[id].muscles}</small></div><span class="duree">${a}</span></li>`).join("")).join("");
  return { type: "seance", gym: 1, circuit, fixe: true, couleur: c, plan, exercices: plan.map(q => q.id), listeHtml: html, rpe, total,
    repos: rep, reposProp: rP, reposId, reglerRepos: v => seanceSalle(mId, sId, v),
    titre: L(S[0], S[1]) + " · " + L(nFr, nEn), titreFr: S[0] + " · " + nFr, detail: "" };
}
function ficheMethode(mId) {
  const M = METHODES[mId], T = METHODES_TXT[mId], E = LANGUE === "en" ? 1 : 0, rP = M[11], rA = M[12];
  const rep = r => r >= 120 ? r / 60 + " min" : r + " s";
  return `<details class="prog-info" style="--c:${M[0]}" open><summary>${L("La méthode en détail", "The method in detail")}</summary>
    <h3>${L("Le principe", "The principle")}</h3><p>${T[0 + E]}</p>
    <h3>${L("Pour qui ?", "Who is it for?")}</h3><p>${T[2 + E]}</p>
    <h3>${L("Les paramètres", "The parameters")}</h3>
    <table class="params"><tr><th></th><th>${L("Exercices de base", "Main lifts")}</th><th>${L("Exercices d’isolation", "Accessories")}</th></tr>
      <tr><td>${L("Séries", "Sets")}</td><td>${M[14] ? M[5][0] + " " + L("tours", "rounds") : M[5][0]}</td><td>${M[14] ? "—" : M[6][0]}</td></tr>
      <tr><td>${L("Répétitions", "Reps")}</td><td>${M[5][2]}</td><td>${M[6][2]}</td></tr>
      <tr><td>${L("Charge (% du max)", "Load (% of max)")}</td><td>${M[7]}</td><td>${M[8]}</td></tr>
      <tr><td>${L("Répétitions en réserve", "Reps in reserve")}</td><td colspan="2">${M[9]}</td></tr>
      <tr><td>Tempo</td><td colspan="2">${M[10]}</td></tr>
      <tr><td>${L("Repos", "Rest")}</td><td>${rep(rP)}</td><td>${M[14] ? L("90 s entre les tours", "90 s between rounds") : rep(rA)}</td></tr></table>
    <p class="aide">${L("Tempo 3-0-1-0 = 3 s pour descendre, 0 s de pause en bas, 1 s pour monter, 0 s de pause en haut. X = le plus vite possible. RIR = nombre de répétitions que tu pourrais encore faire à la fin de la série (RIR 2 = tu t’arrêtes 2 répétitions avant l’échec). Pas besoin de connaître ton maximum : le RIR suffit pour choisir la charge.", "Tempo 3-0-1-0 = 3 s down, 0 s pause at the bottom, 1 s up, 0 s pause at the top. X = as fast as possible. RIR = reps you could still do at the end of the set (RIR 2 = you stop 2 reps before failure). No need to know your max: RIR is enough to pick the load.")}</p>
    <h3>${L("Fréquence et récupération", "Frequency and recovery")}</h3><p>${T[4 + E]}</p>
    <h3>${L("Conseils de coach", "Coach tips")}</h3><ul class="prog-obj">${T[6].map(c => `<li>${c[E]}</li>`).join("")}</ul>
    <h3>${L("Ce que dit la science", "What the science says")}</h3><p>${T[7]}</p>
    <p class="prog-avert">${L("Conseils d’entraînement généraux, pas un avis médical. Sur les charges lourdes, fais-toi assister ou utilise les sécurités du rack. En cas de douleur articulaire, arrête l’exercice.", "General training advice, not medical advice. On heavy lifts, use a spotter or the rack safeties. Stop the exercise if you feel joint pain.")}</p></details>
    <h2 class="sec">${L("Choisis ta séance", "Pick your session")}</h2>`;
}
let methodeCourante = "hypertrophie";
function vueSalle() {
  vue("choicesG", "salle", "Salle de musculation", L("Choisis ton objectif : chaque méthode a ses séries, répétitions, charges, tempo et temps de repos.", "Pick your goal: each method has its own sets, reps, loads, tempo and rest times."), () => {
    $("choicesG").innerHTML = "";
    Object.entries(METHODES).forEach(([k, M]) => bouton($("choicesG"), L(M[1], M[2]), L(M[3], M[4]), M[0], () => vueMethode(k)));
    bouton($("choicesG"), L("Séances libres (réglables)", "Free sessions (adjustable)"), L("Leg day, chest day, push, pull… : tu règles toi-même séries, durée et repos", "Leg day, chest day, push, pull…: set the sets, time and rest yourself"), "#475569", () => vueLibres());
  });
}
function vueMethode(k) {
  methodeCourante = k; const M = METHODES[k];
  vue("choicesG", "methode", L(M[1], M[2]), L(M[3], M[4]), () => {
    $("choicesG").innerHTML = ficheMethode(k);
    Object.entries(SPLITS).forEach(([s, S]) => { const r = seanceSalle(k, s);
      bouton($("choicesG"), L(S[0], S[1]), L(S[2], S[3]) + " · " + L("environ", "about") + " " + r.total + " min", M[0], () => { ROUTINES.gym = seanceSalle(k, s); CONSEILLES.gym = ROUTINES.gym.exercices; ouvrirRoutine("gym"); }); });
  });
}
function vueLibres() {
  vue("choicesG", "libres", "Séances libres", "Séances typiques, jouées en séries. Durée, repos et nombre de séries réglables.", () => {
    $("choicesG").innerHTML = "";
    Object.keys(ROUTINES).filter(k => ROUTINES[k].salle).forEach(k => bouton($("choicesG"), ROUTINES[k].titre, ROUTINES[k].detail + " · " + T("{n} exercices", { n: ROUTINES[k].exercices.length }), ROUTINES[k].couleur, () => ouvrirRoutine(k)));
  });
}

/* ============ RETOUR AU CALME : séances de récupération complètes ============
   3 phases : retour progressif au calme (mobilité douce) → étirements statiques ciblés → respiration lente allongée.
   Étirements : 30 s par muscle et par côté (ACSM). Ils améliorent la souplesse et la détente ;
   ils ne préviennent pas les courbatures (Herbert et al., Cochrane 2011) : on le dit honnêtement. */
// [id, titre FR, titre EN, quand FR, quand EN, couleur, mobilité douce, étirements, respiration (s), conseil FR, conseil EN]
const RECUPS = [
  ["course", "Après la course ou le cardio", "After running or cardio", "Mollets, ischios, quadriceps, hanches", "Calves, hamstrings, quads, hips", "#0EA5E9", ["ankles", "armcircles", "twist"], ["molletMur", "soleaire", "quadDebout", "ischioCouche", "fenteBasse", "figure4"], 90, ["Marche 2 à 3 minutes avant de commencer : le cœur redescend en douceur.", "Walk for 2 to 3 minutes before starting: your heart rate comes down gently."]],
  ["jambes", "Après une séance jambes", "After a leg session", "Quadriceps, ischios, fessiers, adducteurs", "Quads, hamstrings, glutes, adductors", "#AD5A0C", ["ankles", "catcow"], ["quadDebout", "fenteBasse", "ischioCouche", "figure4", "papillon", "molletMur"], 90, ["Étire sans forcer : des muscles fatigués se blessent plus facilement.", "Stretch without forcing: tired muscles are easier to strain."]],
  ["haut", "Après une séance haut du corps", "After an upper-body session", "Pectoraux, épaules, dos, bras, nuque", "Chest, shoulders, back, arms, neck", "#6236C9", ["armcircles", "twist"], ["murPecs", "brasCroise", "triceps", "dosMains", "nuqueLat", "enfantStat"], 90, ["Relâche les épaules loin des oreilles à chaque expiration.", "Drop your shoulders away from your ears on every breath out."]],
  ["complet", "Après une séance complète", "After a full-body session", "Du haut en bas du corps", "From head to toe", "#3949AB", ["catcow", "armcircles"], ["quadDebout", "ischioCouche", "fenteBasse", "murPecs", "brasCroise", "torsionAllongee", "enfantStat"], 90, ["Bois un grand verre d’eau pendant ou juste après ces étirements.", "Drink a large glass of water during or right after these stretches."]],
  ["collectif", "Après un sport collectif ou de raquette", "After a team or racket sport", "Adducteurs, ischios, quadriceps, mollets, hanches", "Adductors, hamstrings, quads, calves, hips", "#16A34A", ["ankles", "twist"], ["papillon", "fenteLatTenue", "ischioCouche", "quadDebout", "molletMur", "figure4"], 90, ["Les changements de direction sollicitent les adducteurs : prends ton temps sur ces étirements.", "Changes of direction load the adductors: take your time on these stretches."]],
  ["bureau", "Après une journée assise", "After a day sitting", "Nuque, pectoraux, hanches, dos", "Neck, chest, hips, back", "#64748B", ["grandissement", "catcow"], ["nuqueLat", "murPecs", "fenteBasse", "figure4", "torsionAllongee", "enfantStat"], 90, ["Ouvre ce que la position assise ferme : l’avant des hanches et la poitrine.", "Open what sitting closes: the front of the hips and the chest."]],
  ["soir", "Avant de dormir", "Before bed", "Dos, hanches, respiration lente", "Back, hips, slow breathing", "#4338CA", ["catcow"], ["enfantStat", "genouxPoitrine", "torsionAllongee", "figure4", "papillon"], 180, ["Lumière tamisée, téléphone en mode avion après la séance : ton sommeil sera meilleur.", "Dim the lights and put your phone in flight mode afterwards: you will sleep better."]],
  ["repos", "Jour de repos (récupération active)", "Rest day (active recovery)", "Mobilité douce et étirements longs", "Gentle mobility and long stretches", "#0D9488", ["catcow", "armcircles", "ankles", "twist", "hip9090"], ["cascade", "chien", "fenteBasse", "figure4", "enfantStat"], 120, ["Bouger doucement un jour de repos aide à se sentir moins raide le lendemain.", "Moving gently on a rest day helps you feel less stiff the next day."]]
];
const unilat = id => /mi-temps|halfway|chaque côté|each side/i.test(EXERCICES[id].description);
/* Changements en cours d'exercice (côté, jambe, bras, main, pied, sens) : lus dans la description (« Change de jambe à mi-temps »…),
   ou plusieurs temps pour les cas particuliers. Chaque changement : bandeau, voix, son, vibration ; entre-temps, « 1re jambe / 2e jambe »… */
const CH_TXT = { jambe: ["Change de jambe !", "Switch legs!", "1re jambe", "2e jambe", "First leg", "Second leg"], pied: ["Change de pied !", "Switch feet!", "1er pied", "2e pied", "First foot", "Second foot"],
  bras: ["Change de bras !", "Switch arms!", "1er bras", "2e bras", "First arm", "Second arm"], main: ["Change de main !", "Switch hands!", "1re main", "2e main", "First hand", "Second hand"],
  cote: ["Change de côté !", "Switch sides!", "1er côté", "2e côté", "First side", "Second side"], sens: ["Change de sens !", "Switch direction!", "1er sens", "2e sens", "First direction", "Second direction"] };
const CH_SPEC = {   // [fraction du temps, annonce FR, annonce EN] + libellés des étapes
  cercleJambe: { t: [[.25, "Change de sens !", "Switch direction!"], [.5, "Change de jambe !", "Switch legs!"], [.75, "Change de sens !", "Switch direction!"]],
    seg: [["1re jambe · 1er sens", "1re jambe · 2e sens", "2e jambe · 1er sens", "2e jambe · 2e sens"], ["Leg 1 · direction 1", "Leg 1 · direction 2", "Leg 2 · direction 1", "Leg 2 · direction 2"]] },
  nuqueIso: { t: [[.25, "Main derrière la tête !", "Hand behind your head!"], [.5, "Main sur le côté droit !", "Hand on the right side!"], [.75, "Main sur le côté gauche !", "Hand on the left side!"]],
    seg: [["Front", "Arrière de la tête", "Côté droit", "Côté gauche"], ["Forehead", "Back of the head", "Right side", "Left side"]] },
  armcircles: "sens", legfwd: "jambe", legside: "jambe", ankles: "pied", surfsquat: "pied" };
const CACHE_CH = {};
function changements(id) {   // { t: [[fraction, fr, en]…], seg: [[fr…], [en…]], double: joué des deux côtés (durée doublée en échauffement) }
  if (id in CACHE_CH) return CACHE_CH[id];
  const e = EXERCICES[id]; let r = null;
  if (e) {
    const sp = CH_SPEC[id], m = /change de (jambe|pied|bras|main|côté)/i.exec(e.description), k = typeof sp === "string" ? sp : m ? { "côté": "cote" }[m[1].toLowerCase()] || m[1].toLowerCase() : unilat(id) ? "cote" : null;
    if (sp && typeof sp === "object") r = { ...sp, double: true };
    else if (k) { const c = CH_TXT[k]; r = { t: [[.5, c[0], c[1]]], seg: [[c[2], c[3]], [c[4], c[5]]], double: k !== "sens" }; }
  }
  return CACHE_CH[id] = r;
}
const instantsCh = e => { const c = e.duree >= 10 && changements(e.id); return c ? c.t.map(([f]) => Math.round(e.duree * (1 - f))) : []; };   // valeurs de « reste »
const coteDe = id => !!changements(id);
function bandeauCote(t, flash) { const b = $("cote"); b.textContent = t; b.classList.toggle("hidden", !t); b.classList.toggle("flash", !!flash); }
function changerCote(e, j) {   // j-ième changement de l'exercice e
  const c = changements(e.id), [, fr, en] = c.t[j]; bandeauCote("↔ " + L(fr, en), 1); parler(langueVoix === "fr" ? fr : en, 0, 1);
  bip(660, 120, .15); bip(880, 160, .15, "sine", .14); vibrer([40, 60, 40]);
  setTimeout(() => { if (!$("cote").classList.contains("hidden") && liste[index] === e) bandeauCote(c.seg[LANGUE === "en" ? 1 : 0][j + 1]); }, 2500);
}
function seanceRecup(id) {
  const [, tFr, tEn, mFr, mEn, c, mob, etir, souffle, cs] = RECUPS.find(r => r[0] === id), ok = l => l.filter(e => EXERCICES[e]);
  const plan = [], blocs = [], add = (bn, e, d, i, n) => plan.push({ id: e, d, r: 0, bn, lab: bn + " · " + i + "/" + n });
  const nM = L("Retour progressif au calme", "Gradual cool-down"), nE = L("Étirements ciblés", "Targeted stretches"), nR = L("Respiration et relâchement", "Breathing and relaxation");
  const m = ok(mob), e = ok(etir), dm = id === "repos" ? 45 : 30;
  m.forEach((x, k) => add(nM, x, dm, k + 1, m.length)); blocs.push([nM, m.map(x => [x, dm + " s"]), L("Mouvements lents et amples pour faire redescendre le cœur et la respiration.", "Slow, wide movements to bring your heart rate and breathing down.")]);
  e.forEach((x, k) => add(nE, x, unilat(x) ? 60 : 40, k + 1, e.length)); blocs.push([nE, e.map(x => [x, unilat(x) ? L("2 × 30 s", "2 × 30 s") : "40 s"]), L("Position tenue, sans à-coups, tension légère et jamais douloureuse. « 2 × 30 s » = 30 s de chaque côté.", "Held position, no bouncing, mild tension and never painful. “2 × 30 s” = 30 s each side.")]);
  add(nR, "relaxation", souffle, 1, 1); blocs.push([nR, [["relaxation", Math.round(souffle / 60 * 10) / 10 + " min"]], L("Inspire 4 s par le nez en gonflant le ventre, expire 6 s par la bouche : le corps passe en mode récupération.", "Breathe in for 4 s through your nose, filling your belly, and out for 6 s: your body switches to recovery mode.")]);
  const total = Math.round(plan.reduce((s, q) => s + q.d, 0) / 60);
  const html = `<li class="etude prog-carte-jour" style="--accent:${c}"><div><small><b>${L(mFr, mEn)}</b></small><small>💡 ${L(...cs)}</small></div></li>`
    + blocs.map(([n, l, d]) => `<li class="bloc-titre"><div><b>${n}</b><small>${d}</small></div></li>` + l.map(([x, a]) => `<li class="bloc-ex">${vignette(x)}<div><b>${EXERCICES[x].nom}</b><small>${EXERCICES[x].muscles}</small></div><span class="duree">${a}</span></li>`).join("")).join("");
  return { type: "calme", recup: 1, fixe: true, couleur: c, plan, exercices: plan.map(q => q.id), listeHtml: html, rpe: "1–2", total, titre: L(tFr, tEn), titreFr: tFr, detail: "" };
}
function ficheRecup() {
  return `<details class="prog-info" style="--c:#0F8A78"><summary>${L("Bien récupérer : le guide", "Recovering well: the guide")}</summary>
    <h3>${L("Pourquoi un retour au calme ?", "Why cool down?")}</h3><p>${L("Après l’effort, le cœur bat encore vite et les muscles sont chauds. Quelques minutes de mouvements lents puis d’étirements permettent de redescendre progressivement, de retrouver de l’amplitude et de passer du mode « effort » au mode « récupération ».", "After exercise your heart is still racing and your muscles are warm. A few minutes of slow movement then stretching bring you down gradually, restore range of motion and switch you from “effort” mode to “recovery” mode.")}</p>
    <h3>${L("Les 3 phases d’une séance", "The 3 phases of a session")}</h3><ul class="prog-obj">
      <li><b>${L("Retour progressif", "Gradual cool-down")}</b> — ${L("2 à 3 minutes de mobilité douce, le cœur redescend.", "2 to 3 minutes of gentle mobility as your heart rate drops.")}</li>
      <li><b>${L("Étirements statiques", "Static stretches")}</b> — ${L("30 secondes par muscle et par côté, sans à-coups.", "30 seconds per muscle and per side, no bouncing.")}</li>
      <li><b>${L("Respiration lente", "Slow breathing")}</b> — ${L("1 à 3 minutes allongé, l’expiration plus longue que l’inspiration.", "1 to 3 minutes lying down, breathing out longer than in.")}</li></ul>
    <h3>${L("Les règles d’or de l’étirement", "Golden rules of stretching")}</h3><ul class="prog-obj">
      <li>${L("Une tension légère, jamais de douleur.", "Mild tension, never pain.")}</li><li>${L("Pas de rebonds : on tient la position et on respire.", "No bouncing: hold the position and breathe.")}</li>
      <li>${L("Expire en allant un peu plus loin, le muscle se relâche mieux.", "Breathe out as you go a little further: the muscle relaxes better.")}</li><li>${L("Évite d’étirer fort un muscle qui vient d’être blessé.", "Avoid strongly stretching a freshly injured muscle.")}</li></ul>
    <h3>${L("Récupérer en dehors de la séance", "Recovering outside the session")}</h3><ul class="prog-obj">
      <li>${L("Sommeil : 7 à 9 h par nuit, c’est le premier outil de récupération.", "Sleep: 7 to 9 hours a night, the number one recovery tool.")}</li>
      <li>${L("Hydratation : bois régulièrement, davantage s’il fait chaud ou si tu as beaucoup transpiré.", "Hydration: drink regularly, more when it is hot or you sweated a lot.")}</li>
      <li>${L("Alimentation : un repas avec des protéines et des glucides dans les heures qui suivent l’effort.", "Nutrition: a meal with protein and carbohydrates in the hours after exercise.")}</li>
      <li>${L("Repos : au moins 1 à 2 jours plus calmes par semaine.", "Rest: at least 1 to 2 easier days a week.")}</li></ul>
    <h3>${L("Ce que dit la science", "What the science says")}</h3><p>${L("L’ACSM recommande de tenir chaque étirement 10 à 30 secondes, 2 à 4 fois, pour gagner en souplesse. Une revue Cochrane (Herbert et al., 2011) montre en revanche que s’étirer ne réduit presque pas les courbatures : les étirements servent surtout la souplesse et la détente. La respiration lente avec expiration allongée active le système nerveux parasympathique, celui du repos (Zaccaro et al., 2018).", "The ACSM recommends holding each stretch for 10 to 30 seconds, 2 to 4 times, to improve flexibility. A Cochrane review (Herbert et al., 2011), however, shows that stretching barely reduces muscle soreness: stretching mainly serves flexibility and relaxation. Slow breathing with a longer exhale activates the parasympathetic “rest” nervous system (Zaccaro et al., 2018).")}</p></details>`;
}
function vueCalme() {
  vue("choicesR", "calme", "Retour au calme", L("Récupère après ta séance : mobilité douce, étirements ciblés et respiration.", "Recover after your workout: gentle mobility, targeted stretches and breathing."), () => {
    $("choicesR").innerHTML = `<h2 class="sec">${L("À la carte", "À la carte")}</h2>`;
    bouton($("choicesR"), "Étirements par zone", "10 séances réglables, une par zone du corps", "#2A9D8F", () => vueK("etir", "Étirements", "Choisis la zone du corps à étirer."));
    bouton($("choicesR"), "Cohérence cardiaque", "Respiration guidée : express, classique, récupération", "#3B82C4", () => vueK("coherence", "Cohérence cardiaque", "Choisis ta séance de respiration."));
    $("choicesR").insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Après quoi ?", "After what?")}</h2>` + ficheRecup());
    RECUPS.forEach(([id, tFr, tEn, mFr, mEn, c]) => { const r = seanceRecup(id);
      bouton($("choicesR"), L(tFr, tEn), L(mFr, mEn) + " · " + r.total + " min", c, () => { ROUTINES.recup = seanceRecup(id); CONSEILLES.recup = ROUTINES.recup.exercices; ouvrirRoutine("recup"); }); });
  });
}

/* ============ ÉCHAUFFEMENTS : MÉTHODE RAMP ============
   RAMP (Jeffreys, 2007) : Raise (élever la température), Activate & Mobilise, Potentiate (préparer au geste, intensité croissante).
   Fradkin et al. (2010) : l'échauffement améliore la performance dans 79 % des critères étudiés.
   Behm et al. (2016) : étirements statiques < 60 s par muscle intégrés à un échauffement dynamique = effet négligeable sur la performance.
   ECHS[clé de routine] = [élever, mobiliser, activer, préparer au geste, conseil FR, conseil EN, pourquoi FR, pourquoi EN] */
const ECHS = {
  course: [["footwork", "kneeup", "heelkick"], ["legfwd", "legside", "wgs", "dogpedal", "hip9090"], ["pont", "calfraise", "rdl"], ["askip", "squatsaute", "skater"],
    ["Termine par 2 ou 3 accélérations progressives de 60 m avant une séance rapide ou une course.", "Finish with 2 or 3 progressive 60 m strides before a fast session or a race."],
    ["À chaque foulée, la jambe encaisse 2 à 3 fois le poids du corps. Les blessures du coureur touchent surtout le genou, le mollet et le tendon d’Achille : on prépare tendons et chevilles aux impacts.", "With every stride your leg absorbs 2 to 3 times your body weight. Runners’ injuries mostly affect the knee, calf and Achilles tendon: we prepare tendons and ankles for impact."]],
  foot: [["footwork", "heelkick", "kneeup"], ["legfwd", "legside", "hip9090", "wgs", "cossack"], ["copenhague", "pont", "lateral"], ["askip", "pasChasse", "frappeVide", "squatsaute"],
    ["Ajoute quelques passes et frappes avec ballon à la fin, en augmentant la puissance.", "Add a few passes and shots with a ball at the end, gradually increasing power."],
    ["Adducteurs et ischios sont les muscles les plus souvent blessés au football. Les échauffements de type FIFA 11+ réduisent d’environ 30 % les blessures quand ils sont faits au moins deux fois par semaine (Thorborg et al., 2017).", "Adductors and hamstrings are the most frequently injured muscles in football. FIFA 11+-type warm-ups cut injuries by about 30% when done at least twice a week (Thorborg et al., 2017)."]],
  basket: [["footwork", "jumpingJack", "kneeup"], ["ankles", "legside", "legfwd", "wgs", "hip9090"], ["calfraise", "lateral", "equilibre"], ["pasChasse", "skater", "sautContre", "sautTir"],
    ["Travaille les réceptions : genoux dans l’axe des pieds, atterrissage silencieux.", "Focus on landings: knees in line with your feet, land quietly."],
    ["L’entorse de cheville est la blessure la plus fréquente au basket. L’équilibre et des réceptions de sauts bien contrôlées préparent la cheville et le genou aux changements d’appui.", "Ankle sprains are the most common basketball injury. Balance work and well-controlled jump landings prepare your ankle and knee for changes of direction."]],
  handball: [["jumpingJack", "footwork", "kneeup"], ["armcircles", "rotEpaule", "legfwd", "legside", "thread"], ["scap", "lateral", "pont"], ["pasChasse", "skater", "lancer", "sautTir"],
    ["Finis par des tirs avec ballon à 50 %, puis 75 %, avant de tirer à fond.", "Finish with shots at 50%, then 75%, before shooting at full power."],
    ["L’épaule du tireur et le genou (réceptions, pivots) sont les zones les plus exposées. Un programme d’échauffement de l’épaule a réduit d’environ 28 % les problèmes d’épaule chez les handballeurs (Andersson et al., 2017).", "The thrower’s shoulder and the knee (landings, pivots) are the most exposed areas. A shoulder warm-up programme reduced shoulder problems in handball players by about 28% (Andersson et al., 2017)."]],
  volley: [["jumpingJack", "footwork", "kneeup"], ["armcircles", "rotEpaule", "thread", "legside", "ankles"], ["scap", "calfraise", "lateral"], ["pasChasse", "squatsaute", "sautContre", "lancer"],
    ["Avant le match, enchaîne quelques attaques et services à intensité croissante.", "Before the match, do a few spikes and serves at increasing intensity."],
    ["Les sauts répétés sollicitent le tendon rotulien et les chevilles, les smashs et les services sollicitent l’épaule : on prépare les deux.", "Repeated jumps load the patellar tendon and ankles, while spikes and serves load the shoulder: we prepare both."]],
  tennis: [["footwork", "jumpingJack", "kneeup"], ["armcircles", "rotEpaule", "twist", "openbook", "legside"], ["scap", "lateral", "planchelat"], ["pasChasse", "lungetwist", "coupDroit", "squatsaute"],
    ["Commence l’échange près du filet, recule progressivement et garde les services pour la fin.", "Start rallying close to the net, move back gradually and save serves for the end."],
    ["Le service et le coup droit font tourner l’épaule et le tronc très vite, et les déplacements latéraux sollicitent adducteurs et mollets. Épaule, coude et tronc doivent être chauds avant de frapper fort.", "Serves and forehands rotate the shoulder and trunk very fast, and lateral movement loads the adductors and calves. Shoulder, elbow and trunk must be warm before hitting hard."]],
  padel: [["footwork", "jumpingJack", "kneeup"], ["armcircles", "rotEpaule", "twist", "cossack", "legside"], ["scap", "lateral", "planchelat"], ["pasChasse", "lungetwist", "coupDroit", "skater"],
    ["Échange d’abord en douceur au fond du court, puis monte au filet pour les volées.", "Rally gently from the back of the court first, then move up to the net for volleys."],
    ["Les blessures les plus fréquentes au padel touchent le coude, l’épaule, le mollet et la cheville : on les prépare aux frappes et aux démarrages rapides.", "The most common padel injuries affect the elbow, shoulder, calf and ankle: we prepare them for shots and quick starts."]],
  boxe: [["footwork", "jumpingJack", "kneeup"], ["armcircles", "thread", "openbook", "wipers", "cossack"], ["scap", "planchetouch", "tspin"], ["slips", "shadow", "squatsaute"],
    ["Termine par un round de shadow : technique au début, vitesse à la fin.", "Finish with a round of shadow boxing: technique first, speed at the end."],
    ["La puissance des coups vient des jambes et de la rotation du tronc ; les épaules doivent tenir la garde longtemps. On prépare la chaîne complète, des chevilles aux poings.", "Punching power comes from the legs and trunk rotation, and the shoulders must hold the guard for a long time. We prepare the whole chain, from ankles to fists."]],
  escalade: [["jumpingJack", "climbers"], ["armcircles", "rotEpaule", "catcow", "thread", "hip9090", "wgs"], ["scap", "bird", "planche"], ["suspension", "tspin", "pompes"],
    ["Fais ensuite 2 ou 3 voies faciles, sur grosses prises, avant d’attaquer ton niveau.", "Then climb 2 or 3 easy routes on big holds before tackling your level."],
    ["Doigts (poulies), épaules et coudes encaissent les plus fortes charges. Ils se préparent progressivement : jamais de petites prises à froid.", "Fingers (pulleys), shoulders and elbows take the biggest loads. Prepare them progressively: never small holds while cold."]],
  cyclisme: [["pedalage", "kneeup", "jumpingJack"], ["catcow", "openbook", "hip9090", "legfwd", "scorpion"], ["pont", "bird", "calfraise"], ["fente", "squatsaute", "skater"],
    ["Sur le vélo, roule ensuite 10 minutes en souplesse avant d’appuyer.", "On the bike, then ride easy for 10 minutes before pushing."],
    ["La position assise et penchée raidit le dos et l’avant des hanches, et les fessiers travaillent peu à vélo : on mobilise le dos, on ouvre les hanches et on réveille les fessiers.", "The seated, bent-over position stiffens the back and the front of the hips, and the glutes do little on a bike: we mobilise the back, open the hips and wake up the glutes."]],
  natation: [["jumpingJack", "kneeup"], ["armcircles", "armcross", "rotEpaule", "thread", "openbook", "ankles"], ["scap", "superman", "deadbug"], ["crawlSec", "battements", "squatsaute"],
    ["Dans l’eau, nage ensuite 200 à 400 m tranquille en variant les nages.", "In the water, then swim 200 to 400 m easy, mixing strokes."],
    ["L’« épaule du nageur » est la plainte la plus fréquente : chaque séance compte des centaines de rotations du bras. La coiffe des rotateurs et les omoplates doivent être activées avant d’entrer dans l’eau.", "“Swimmer’s shoulder” is the most common complaint: each session involves hundreds of arm rotations. The rotator cuff and shoulder blades must be switched on before getting in the water."]],
  ski: [["jumpingJack", "kneeup", "heelkick"], ["ankles", "legfwd", "legside", "twist", "cossack"], ["skisquat", "lateral", "equilibre"], ["skihop", "squatsaute", "skater"],
    ["Fais la première descente sur une piste facile, à vitesse modérée.", "Make your first run on an easy slope at moderate speed."],
    ["Le genou est la zone la plus touchée au ski, et il fait souvent froid au pied des pistes. On prépare quadriceps, fessiers et équilibre avant la première descente.", "The knee is the most commonly injured area in skiing, and it is often cold at the bottom of the slopes. We prepare quads, glutes and balance before the first run."]],
  surf: [["jumpingJack", "paddle", "kneeup"], ["armcircles", "thread", "cobra", "hip9090", "cossack"], ["superman", "surfsquat", "scap"], ["popup", "squatsaute", "skater"],
    ["Échauffe-toi sur la plage : l’eau froide refroidit vite les muscles.", "Warm up on the beach: cold water quickly cools your muscles."],
    ["Rame, pop-up et position basse sollicitent les épaules, le bas du dos et les hanches. Un pop-up rapide et précis se prépare à sec.", "Paddling, pop-ups and the low stance load the shoulders, lower back and hips. A quick, precise pop-up is prepared on dry land."]],
  yoga: [["grandissement", "catcow"], ["thread", "cobra", "dogpedal", "hip9090", "enfant"], ["bird", "pont", "planche"], ["wgs", "cascade", "inchworm"],
    ["Synchronise chaque mouvement avec ta respiration, sans jamais forcer.", "Sync every movement with your breath, never forcing."],
    ["Préparer la colonne, les hanches et la respiration permet d’aborder les postures plus profondes en sécurité.", "Preparing your spine, hips and breathing lets you approach deeper poses safely."]],
  pilates: [["grandissement", "catcow"], ["rollUp", "cercleJambe", "thread", "hip9090", "twist"], ["bird", "pont", "deadbug"], ["hundred", "planchelat", "ours"],
    ["Garde le bassin stable et le nombril rentré pendant tout l’échauffement.", "Keep your pelvis stable and your belly button drawn in throughout the warm-up."],
    ["Le Pilates demande un centre actif (transverse, plancher pelvien) et une colonne mobile vertèbre par vertèbre : on prépare les deux.", "Pilates needs an active core (transverse abdominis, pelvic floor) and a spine that moves one vertebra at a time: we prepare both."]],
  haut: [["jumpingJack", "kneeup"], ["armcircles", "armcross", "thread", "openbook", "catcow"], ["scap", "superman", "planchetouch"], ["pompesMur", "inchworm", "pompes"],
    ["Avant de charger, fais 1 ou 2 séries légères du premier exercice de ta séance.", "Before loading up, do 1 or 2 light sets of the first exercise of your session."],
    ["Épaules, omoplates et haut du dos doivent être mobiles et actifs avant de pousser ou de tirer lourd : c’est la meilleure protection de l’épaule.", "Shoulders, shoulder blades and upper back must be mobile and active before heavy pushing or pulling: it is the best protection for the shoulder."]],
  bas: [["jumpingJack", "kneeup", "heelkick"], ["hip9090", "legfwd", "legside", "wgs", "ankles"], ["pont", "hydrant", "calfraise"], ["squat", "fente", "sumo", "rdl"],
    ["Avant de charger, fais 1 ou 2 séries légères du premier exercice de ta séance.", "Before loading up, do 1 or 2 light sets of the first exercise of your session."],
    ["Hanches, chevilles et fessiers mobiles et actifs = des squats et des fentes plus profonds, mieux placés et plus sûrs pour le dos et les genoux.", "Mobile, active hips, ankles and glutes = deeper, better-positioned squats and lunges that are safer for your back and knees."]],
  complet: [["jumpingJack", "kneeup"], ["armcircles", "catcow", "wgs", "hip9090", "thread"], ["pont", "scap", "bird"], ["squat", "inchworm", "lungetwist", "pompesMur"],
    ["Avant de charger, fais 1 ou 2 séries légères du premier exercice de ta séance.", "Before loading up, do 1 or 2 light sets of the first exercise of your session."],
    ["Une séance complète sollicite toutes les articulations : on les passe en revue, des chevilles aux épaules, avant de monter en intensité.", "A full-body session works every joint: we go through them all, from ankles to shoulders, before increasing intensity."]]
};
// [id, nom FR, nom EN, exercices par phase, durées par phase (s), usage FR, usage EN]
const FMT_ECH = [["express", "Express", "Express", [2, 3, 2, 2], [40, 35, 40, 30], "Quand tu es pressé : l’essentiel avant de te lancer.", "When you are short on time: the essentials before you start."],
  ["standard", "Standard", "Standard", [3, 5, 3, 3], [40, 35, 40, 30], "Le bon équilibre avant un entraînement.", "The right balance before a training session."],
  ["complet", "Complet", "Full", [4, 7, 5, 4], [40, 35, 40, 30], "Avant un match, une compétition ou par temps froid.", "Before a match, a competition or in cold weather."]];
const PHASES_ECH = [["Élever la température", "Raise your temperature", "Cardio léger et progressif : le cœur accélère, les muscles se réchauffent. Tu dois pouvoir parler.", "Light, progressive cardio: your heart rate rises and your muscles warm up. You should still be able to talk."],
  ["Mobiliser les articulations", "Mobilise your joints", "Mouvements amples et contrôlés, sans à-coups, dans toute l’amplitude disponible.", "Wide, controlled movements, no jerking, through your full available range."],
  ["Activer les muscles clés", "Activate key muscles", "On réveille les muscles qui stabilisent et protègent les articulations les plus sollicitées par ton sport.", "Wake up the muscles that stabilise and protect the joints your sport loads the most."],
  ["Préparer au geste", "Prepare for action", "Gestes de ton sport et exercices dynamiques à intensité croissante, jusqu’à presque 100 % sur le dernier.", "Sport-specific and dynamic moves at increasing intensity, up to almost 100% on the last one."]];
const INTENS = { 2: [70, 90], 3: [60, 80, 95], 4: [60, 75, 85, 95] };
// exercices génériques par phase, ajoutés après ceux du sport quand le format en demande plus (jamais en double)
const ECH_PLUS = [["footwork", "kneeup", "heelkick", "climbers"], ["armcircles", "hip9090", "wgs", "legfwd", "legside", "openbook", "thread", "catcow", "inchworm", "cossack"], ["pont", "calfraise", "squat", "planche", "deadbug", "lateral", "bird"], ["askip", "skater", "squatsaute", "lungetwist"]];
function seanceEch(cle, fmt) {
  const R = ROUTINES[cle], E = ECHS[cle], [, fFr, fEn, nb, dur] = FMT_ECH.find(f => f[0] === fmt), ok = l => l.filter(e => EXERCICES[e]);
  const plan = [], blocs = [];
  PHASES_ECH.forEach(([nFr, nEn, dFr, dEn], p) => {
    const l = [...new Set(ok([...E[p], ...ECH_PLUS[p]]))].filter(x => !plan.some(q => q.id === x)).slice(0, nb[p]), n = L(nFr, nEn), pc = p === 3 ? INTENS[l.length] || [] : [];
    const items = l.map((x, k) => { const u = !!(changements(x) || {}).double, cote = Math.min(30, Math.round(dur[p] * .75 / 5) * 5), d = u ? cote * 2 : dur[p];
      plan.push({ id: x, d, r: p === 3 ? 10 : 0, bn: n, lab: `${n} · ${k + 1}/${l.length}${pc[k] ? " · " + pc[k] + " %" : ""}` });
      return [x, (u ? "2 × " + cote : DEUX_PASSAGES.includes(x) ? "2 × " + d : d) + " s" + (pc[k] ? " · " + pc[k] + " %" : "")]; });
    blocs.push([`${p + 1}. ${n}`, items, L(dFr, dEn)]);
  });
  const total = Math.round(plan.reduce((s, q) => s + q.d * (DEUX_PASSAGES.includes(q.id) ? 2 : 1) + q.r, 0) / 60), titre = L(fFr, fEn) + " · " + R.titre;
  const html = `<li class="etude prog-carte-jour" style="--accent:${R.couleur}"><div><small><b>${R.detail}</b></small><small>💡 ${L(E[4][0], E[4][1])}</small></div></li>`
    + blocs.map(([n, l, d]) => `<li class="bloc-titre"><div><b>${n}</b><small>${d}</small></div></li>` + l.map(([x, a]) => `<li class="bloc-ex">${vignette(x)}<div><b>${EXERCICES[x].nom}</b><small>${EXERCICES[x].muscles}</small></div><span class="duree">${a}</span></li>`).join("")).join("");
  return { cat: R.cat, fixe: true, ramp: 1, couleur: R.couleur, plan, exercices: plan.map(q => q.id), listeHtml: html, rpe: "3–6", total, titre, titreFr: fFr + " · " + (R.titreFr || R.titre), detail: R.detail };
}
function ficheEch() {
  return `<details class="prog-info" style="--c:#1A3BC2"><summary>${L("Bien s’échauffer : le guide", "Warming up well: the guide")}</summary>
    <h3>${L("Pourquoi s’échauffer ?", "Why warm up?")}</h3><p>${L("Un muscle plus chaud est plus souple, plus rapide et plus fort. L’échauffement accélère le cœur et la respiration, augmente l’afflux de sang dans les muscles et réveille la coordination. Résultat : de meilleures performances et moins de blessures.", "A warmer muscle is more supple, faster and stronger. Warming up raises your heart rate and breathing, increases blood flow to the muscles and sharpens coordination. The result: better performance and fewer injuries.")}</p>
    <h3>${L("La méthode RAMP en 4 phases", "The 4-phase RAMP method")}</h3><ul class="prog-obj">
      ${PHASES_ECH.map(([a, b, c, d], i) => `<li><b>${i + 1}. ${L(a, b)}</b> — ${L(c, d)}</li>`).join("")}</ul>
    <h3>${L("Combien de temps ?", "How long?")}</h3><ul class="prog-obj">
      ${FMT_ECH.map(f => `<li><b>${L(f[1], f[2])}</b> — ${L(f[5], f[6])}</li>`).join("")}
      <li>${L("Lance ton sport dans les 10 minutes qui suivent : l’effet s’estompe si tu attends trop.", "Start your sport within 10 minutes: the effect fades if you wait too long.")}</li></ul>
    <h3>${L("Les règles d’or", "Golden rules")}</h3><ul class="prog-obj">
      <li>${L("Du plus doux au plus intense, du général au spécifique.", "From easiest to most intense, from general to specific.")}</li>
      <li>${L("Pas d’étirements statiques longs avant un effort explosif : garde-les pour le retour au calme.", "No long static stretches before explosive effort: save them for the cool-down.")}</li>
      <li>${L("Par temps froid ou tôt le matin, allonge la première phase.", "In cold weather or early in the morning, extend the first phase.")}</li>
      <li>${L("Aucun exercice ne doit faire mal. Une gêne qui augmente = on arrête.", "No exercise should hurt. Discomfort that gets worse = stop.")}</li></ul>
    <h3>${L("Tu es prêt quand…", "You are ready when…")}</h3><p>${L("tu transpires légèrement, ta respiration est plus rapide mais tu peux encore parler, tes mouvements sont fluides et tu te sens « réveillé ».", "you are sweating lightly, your breathing is faster but you can still talk, your movements feel smooth and you feel “switched on”.")}</p>
    <h3>${L("Ce que dit la science", "What the science says")}</h3><p>${L("Une revue de 32 études (Fradkin et al., 2010) montre que l’échauffement améliore la performance dans 79 % des critères mesurés. Les programmes d’échauffement neuromusculaire comme le FIFA 11+ réduisent d’environ 30 % les blessures chez les footballeurs (Thorborg et al., 2017). Les étirements statiques de plus de 60 secondes par muscle peuvent diminuer la force et la vitesse, alors que des étirements courts intégrés à un échauffement dynamique n’ont presque pas d’effet (Behm et al., 2016).", "A review of 32 studies (Fradkin et al., 2010) found that warming up improved performance in 79% of the criteria measured. Neuromuscular warm-up programmes such as FIFA 11+ reduce injuries in footballers by about 30% (Thorborg et al., 2017). Static stretches held for more than 60 seconds per muscle can reduce strength and speed, while short stretches within a dynamic warm-up have almost no effect (Behm et al., 2016).")}</p></details>`;
}
let echCle = "";
function vueEch(cle) {
  echCle = cle; const R = ROUTINES[cle], E = ECHS[cle];
  vue("choicesE", "ech", R.titre, L("Échauffement en 4 phases, construit pour ton sport. Choisis ta durée.", "4-phase warm-up built for your sport. Choose your length."), () => {
    $("choicesE").innerHTML = `<div class="etude ech-fiche" style="--accent:${R.couleur}"><b>${L("Ce qu’on prépare", "What we prepare")} : ${R.detail}</b><p>${L(E[5][0], E[5][1])}</p></div><h2 class="sec">${L("Choisis ta durée", "Choose your length")}</h2>`;
    FMT_ECH.forEach(([f, nFr, nEn, , , uFr, uEn]) => { const s = seanceEch(cle, f);
      bouton($("choicesE"), `${L(nFr, nEn)} · ${s.total} min`, `${L(uFr, uEn)} ${s.exercices.length} ${L("exercices", "exercises")}`, R.couleur, () => { ROUTINES.ech = seanceEch(cle, f); CONSEILLES.ech = ROUTINES.ech.exercices; ouvrirRoutine("ech"); }); });
    $("choicesE").insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Personnaliser", "Customise")}</h2>`);
    bouton($("choicesE"), L("Version libre", "Free version"), L(`${R.exercices.length} exercices à modifier : ajoute, retire, règle la durée et enregistre-la`, `${R.exercices.length} exercises to edit: add, remove, set the length and save it`), R.couleur, () => ouvrirRoutine(cle));
  });
}
// liste des sports regroupée par famille, guide en tête
[...$("choices").children].forEach(b => { if (ECHS[b.dataset.cle]) b.onclick = () => vueEch(b.dataset.cle); });
const parCat = {}; [...$("choicesC").children].forEach(b => parCat[b.dataset.k] = b);
const GROUPES_ECH = [["Sports collectifs", "Team sports", "foot basket handball volley"], ["Raquettes", "Racket sports", "tennis padel"], ["Endurance", "Endurance", "course cyclisme natation"],
  ["Combat et grimpe", "Combat and climbing", "boxe escalade"], ["Glisse", "Board sports", "ski surf"], ["Corps et esprit", "Mind and body", "yoga pilates"], ["Avant la musculation", "Before strength training", "renfo"]];
/* Les sports pratiqués le plus souvent ces 90 derniers jours (toutes séances de l'historique confondues) passent en tête des listes, sous « Tes sports » */
function sportsFrequents(dispo, max = 4) {
  const depuis = jourCle(new Date(Date.now() - 90 * 864e5)), n = {};
  lireHist().forEach(x => { if (x.j >= depuis && dispo.includes(x.c)) n[x.c] = (n[x.c] || 0) + 1; });
  return Object.keys(n).sort((a, b) => n[b] - n[a]).slice(0, max);
}
const tesSports = (C, l, ajouter) => { if (!l.length) return; C.insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Tes sports", "Your sports")}</h2>`); l.forEach(ajouter); };
function listeSports() {   // guide en tête, sports regroupés par famille (reconstruit à chaque ouverture pour suivre la langue)
  const C = $("choicesC"); C.innerHTML = ficheEch();
  const F = sportsFrequents(GROUPES_ECH.flatMap(g => g[2].split(" "))); tesSports(C, F, k => parCat[k] && C.appendChild(parCat[k]));
  GROUPES_ECH.forEach(([fr, en, l]) => { const r = l.split(" ").filter(k => !F.includes(k)); if (!r.length) return; C.insertAdjacentHTML("beforeend", `<h2 class="sec">${L(fr, en)}</h2>`); r.forEach(k => parCat[k] && C.appendChild(parCat[k])); });
  Object.values(parCat).forEach(b => !b.isConnected && C.appendChild(b));
}

/* ============ RENFO PAR SPORT ============
   Lauersen et al. (2014, 25 essais, 26 610 sportifs) : le renforcement musculaire réduit les blessures sportives à moins d'un tiers.
   Séance en 4 blocs : échauffement (tiré de ECHS) → circuit principal (tours/effort/repos selon le niveau) → prévention ciblée → retour au calme (tiré de RECUPS).
   RENFOS[groupe] = [qualités FR, EN, pourquoi FR, EN, exercices de prévention, séance de retour au calme] */
const RENFOS = {
  course: ["Jambes en unilatéral, mollets et tendon d’Achille, gainage", "Single-leg strength, calves and Achilles tendon, core", "Le renforcement améliore l’économie de course : tu dépenses moins d’énergie à la même vitesse (méta-analyse Balsalobre-Fernández et al., 2016). Il protège aussi mollets et tendons des milliers d’impacts de chaque sortie.", "Strength training improves running economy: you use less energy at the same speed (meta-analysis by Balsalobre-Fernández et al., 2016). It also protects calves and tendons from the thousands of impacts in every run.", ["alfredson", "equilibre", "hydrant"], "course"],
  foot: ["Ischios, adducteurs, explosivité, gainage", "Hamstrings, adductors, explosiveness, core", "Le travail excentrique des ischios réduit d’environ moitié les blessures aux ischios (van Dyk et al., 2019) et le programme Copenhague réduit d’environ 40 % les problèmes d’aine (Harøy et al., 2019).", "Eccentric hamstring work cuts hamstring injuries by about half (van Dyk et al., 2019) and the Copenhagen programme reduces groin problems by about 40% (Harøy et al., 2019).", ["copenhague", "extender", "equilibre"], "collectif"],
  basket: ["Détente, appuis latéraux, chevilles et genoux stables", "Jumping power, lateral footwork, stable ankles and knees", "L’entraînement neuromusculaire (équilibre, sauts contrôlés, renforcement) réduit les blessures du genou et de la cheville dans les sports de sauts et de pivots.", "Neuromuscular training (balance, controlled jumps, strength work) reduces knee and ankle injuries in jumping and pivoting sports.", ["equilibre", "alfredson", "hydrant"], "collectif"],
  handball: ["Épaule du tireur, appuis, sauts, gainage", "Throwing shoulder, footwork, jumps, core", "Un programme de renforcement de l’épaule a réduit d’environ 28 % les problèmes d’épaule chez les handballeurs (Andersson et al., 2017).", "A shoulder strengthening programme reduced shoulder problems in handball players by about 28% (Andersson et al., 2017).", ["rotEpaule", "scap", "equilibre"], "collectif"],
  volley: ["Détente, épaules, gainage, genoux", "Jumping power, shoulders, core, knees", "Les sauts répétés sollicitent le tendon rotulien : les exercices tenus comme la chaise renforcent les cuisses sans à-coups. Une coiffe des rotateurs forte protège l’épaule à l’attaque.", "Repeated jumps load the patellar tendon: held exercises like the wall sit strengthen the thighs smoothly. A strong rotator cuff protects the shoulder when spiking.", ["rotEpaule", "chaise", "equilibre"], "collectif"],
  tennis: ["Jambes, rotation du tronc, coiffe des rotateurs, avant-bras", "Legs, trunk rotation, rotator cuff, forearms", "Les extensions de poignet lentes (excentriques) renforcent l’avant-bras, très sollicité à chaque frappe, et une coiffe forte protège l’épaule au service.", "Slow (eccentric) wrist extensions strengthen the forearm, which works hard on every shot, and a strong rotator cuff protects the shoulder when serving.", ["rotEpaule", "poignetExc", "equilibre"], "collectif"],
  padel: ["Jambes, gainage, rotation, épaules et avant-bras", "Legs, core, rotation, shoulders and forearms", "Coude, épaule, mollet et cheville sont les zones les plus touchées au padel : on les renforce en priorité.", "Elbow, shoulder, calf and ankle are the most commonly injured areas in padel: we strengthen them first.", ["poignetExc", "rotEpaule", "alfredson"], "collectif"],
  boxe: ["Puissance des jambes et du tronc, épaules endurantes, gainage", "Leg and trunk power, enduring shoulders, core", "La force d’un coup vient surtout des jambes et de la rotation du tronc : des jambes puissantes et un gainage solide rendent les coups plus forts, des épaules endurantes tiennent la garde.", "Punching power comes mostly from the legs and trunk rotation: powerful legs and a solid core make punches stronger, while enduring shoulders hold the guard.", ["rotEpaule", "scap", "nuqueIso"], "haut"],
  escalade: ["Tirage, épaules, gainage, avant-bras", "Pulling strength, shoulders, core, forearms", "Des omoplates actives et une coiffe forte protègent l’épaule, très sollicitée bras en l’air. Le gainage garde les pieds sur les prises dans les dévers.", "Active shoulder blades and a strong rotator cuff protect the shoulder, which works hard overhead. Core strength keeps your feet on the holds on overhangs.", ["scap", "rotEpaule", "poignetExc"], "haut"],
  cyclisme: ["Cuisses, fessiers, gainage, dos", "Thighs, glutes, core, back", "La musculation améliore l’économie et la performance des cyclistes entraînés (Rønnestad et Mujika, 2014), et le gainage protège le dos dans la position penchée.", "Strength training improves economy and performance in trained cyclists (Rønnestad and Mujika, 2014), and core work protects the back in the bent-over position.", ["bird", "hydrant", "planchelat"], "course"],
  natation: ["Dorsaux, coiffe des rotateurs, gainage, battements", "Lats, rotator cuff, core, kicking", "L’« épaule du nageur » est la plainte n°1 : renforcer la coiffe et les muscles des omoplates est la base de la prévention. Le gainage garde le corps aligné dans l’eau.", "“Swimmer’s shoulder” is the number one complaint: strengthening the rotator cuff and shoulder-blade muscles is the basis of prevention. Core work keeps your body aligned in the water.", ["rotEpaule", "scap", "bird"], "haut"],
  ski: ["Quadriceps, fessiers, ischios, équilibre", "Quads, glutes, hamstrings, balance", "Le ligament croisé antérieur est la blessure grave la plus fréquente au ski. Des ischios forts et un bon équilibre aident à protéger le genou, des cuisses endurantes retardent la fatigue.", "The anterior cruciate ligament is the most common serious skiing injury. Strong hamstrings and good balance help protect the knee, and enduring thighs delay fatigue.", ["equilibre", "copenhague", "extender"], "jambes"],
  surf: ["Épaules et dos pour la rame, pop-up explosif, gainage, jambes", "Shoulders and back for paddling, explosive pop-up, core, legs", "La rame représente la plus grande partie du temps passé à l’eau : des épaules et un dos endurants et protégés, puis un pop-up explosif, font la différence.", "Paddling takes up most of your time in the water: enduring, well-protected shoulders and back, then an explosive pop-up, make the difference.", ["rotEpaule", "scap", "bird"], "complet"],
  pilates: ["Centre du corps, posture, stabilité", "Core, posture, stability", "Un centre fort et stable (transverse, multifides, plancher pelvien) améliore la posture et la qualité de chaque mouvement.", "A strong, stable core (transverse abdominis, multifidus, pelvic floor) improves posture and the quality of every movement.", ["equilibre", "bird", "scap"], "repos"],
  haut: ["Pectoraux, dos, épaules, bras, abdos", "Chest, back, shoulders, arms, abs", "Équilibrer la poussée et le tirage, et renforcer la coiffe des rotateurs, protège l’épaule et améliore la posture.", "Balancing pushing and pulling, and strengthening the rotator cuff, protects the shoulder and improves posture.", ["rotEpaule", "bird", "nuqueIso"], "haut"],
  bas: ["Cuisses, fessiers, ischios, mollets", "Thighs, glutes, hamstrings, calves", "Des jambes fortes améliorent l’équilibre et protègent genoux et dos au quotidien comme dans le sport.", "Strong legs improve balance and protect your knees and back in daily life as well as in sport.", ["equilibre", "copenhague", "alfredson"], "jambes"],
  complet: ["Tout le corps", "Whole body", "Une séance complète développe force et endurance de la tête aux pieds, avec un temps de prévention pour les épaules et l’équilibre.", "A full-body session builds strength and endurance from head to toe, with a prevention block for the shoulders and balance.", ["equilibre", "rotEpaule", "bird"], "complet"]
};
// [id, nom FR, EN, tours, effort (s), repos (s), récup entre tours (s), RPE, nb d'exercices, texte FR, EN]
const NIV_RENFO = [["debutant", "Débutant", "Beginner", 2, 30, 30, 60, "5–6", 6, "2 tours de 6 exercices, 30 s d’effort et 30 s de repos : on apprend les bons gestes.", "2 rounds of 6 exercises, 30 s work and 30 s rest: learn good technique."],
  ["inter", "Intermédiaire", "Intermediate", 3, 40, 20, 60, "6–7", 8, "3 tours de 8 exercices, 40 s d’effort et 20 s de repos.", "3 rounds of 8 exercises, 40 s work and 20 s rest."],
  ["avance", "Avancé", "Advanced", 4, 45, 15, 90, "7–8", 8, "4 tours de 8 exercices, 45 s d’effort et 15 s de repos.", "4 rounds of 8 exercises, 45 s work and 15 s rest."]];
const exHtml = l => l.map(([x, a]) => `<li class="bloc-ex">${vignette(x)}<div><b>${EXERCICES[x].nom}</b><small>${EXERCICES[x].muscles}</small></div><span class="duree">${a}</span></li>`).join("");
const blocHtml = ([n, l, d]) => `<li class="bloc-titre"><div><b>${n}</b><small>${d}</small></div></li>` + exHtml(l);
function seanceRenfo(grp, mat, niv, choix) {
  const cle = SEANCE(grp) + (mat ? "Mat" : ""), R = ROUTINES[cle], F = RENFOS[grp], E = ECHS[grp], ok = l => l.filter(e => EXERCICES[e]);
  const [, nFr, nEn, tours, eff, rep0, rt0, rpe, nb] = NIV_RENFO.find(n => n[0] === niv), plan = [], blocs = [];
  const reposId = "renfo:" + cle + ":" + niv, rep = choix ?? reposLu(reposId, rep0), rt = r5(rt0 * (rep0 ? rep / rep0 : 1));
  const bloc = (n, l, t, r, rT, desc, aff) => {
    for (let i = 1; i <= t; i++) l.forEach(([x, dd], k) => plan.push({ id: x, d: dd, r: k < l.length - 1 ? r : i < t ? rT : 15, bn: n, t: i, tt: t, ft: k === l.length - 1 && i < t,
      lab: n + (t > 1 ? L(" · tour {t}/{n}", " · round {t}/{n}").replace("{t}", i).replace("{n}", t) : "") + ` · ${k + 1}/${l.length}` }));
    blocs.push([n, l.map(([x, dd]) => [x, aff ? aff(x, dd) : dd + " s"]), desc]); };
  const cote = x => unilat(x) ? 60 : 40, aff2 = (x, d) => unilat(x) ? "2 × 30 s" : d + " s";
  const ech = ok([E[0][0], E[1][0], E[1][1], E[2][0]]), main = ok(R.exercices).slice(0, nb), prev = ok(F[4]), rac = ok(RECUPS.find(r => r[0] === F[5])[7]).slice(0, 3);
  bloc(L("Échauffement", "Warm-up"), ech.map(x => [x, 30]), 1, 5, 0, L("4 exercices pour monter en température et préparer les articulations.", "4 exercises to warm up and prepare your joints."));
  bloc(L("Circuit principal", "Main circuit"), main.map(x => [x, eff]), tours, rep, rt, L(`${tours} tours · ${eff} s d’effort / ${rep} s de repos · ${rt} s de récupération entre les tours`, `${tours} rounds · ${eff} s work / ${rep} s rest · ${rt} s recovery between rounds`), (x, d) => tours + " × " + d + " s");
  bloc(L("Prévention des blessures", "Injury prevention"), prev.map(x => [x, cote(x)]), 1, 15, 0, L("Exercices ciblés sur les zones les plus exposées dans ton sport, à faire sans douleur.", "Targeted exercises for the areas most at risk in your sport, done without pain."), aff2);
  bloc(L("Retour au calme", "Cool-down"), rac.map(x => [x, cote(x)]), 1, 5, 0, L("Étirements doux, tension légère, respiration lente.", "Gentle stretches, mild tension, slow breathing."), aff2);
  plan[plan.length - 1].r = 0;
  const total = Math.round(plan.reduce((s, q) => s + q.d + q.r, 0) / 60), titre = (R.titre.split(" · ")[0]) + " · " + L(nFr, nEn) + (mat ? " · " + L("matériel", "equipment") : "");
  const html = `<li class="etude prog-carte-jour" style="--accent:${R.couleur}"><div><small><b>${L(F[0], F[1])}</b></small><small>💡 ${L("Effort visé", "Target effort")} ${rpe}/10 : ${L("tu dois finir chaque série avec encore 1 à 3 répétitions en réserve.", "finish each set with 1 to 3 reps still in reserve.")}</small></div></li>` + blocs.map(blocHtml).join("");
  return { type: "seance", cat: R.grp, renfoS: 1, niv, fixe: true, couleur: R.couleur, plan, exercices: plan.map(q => q.id), listeHtml: html, rpe, total, titre, titreFr: titre, detail: R.detail,
    repos: rep, reposProp: rep0, reposId, reglerRepos: v => seanceRenfo(grp, mat, niv, v) };
}
function ficheRenfo() {
  return `<details class="prog-info" style="--c:#7B5EA7"><summary>${L("Se renforcer pour son sport : le guide", "Strength for your sport: the guide")}</summary>
    <h3>${L("Pourquoi se renforcer ?", "Why strength train?")}</h3><p>${L("Des muscles plus forts protègent les articulations et les tendons, rendent les gestes plus puissants et retardent la fatigue. C’est l’outil de prévention des blessures le plus efficace connu à ce jour.", "Stronger muscles protect joints and tendons, make movements more powerful and delay fatigue. It is the most effective injury-prevention tool known today.")}</p>
    <h3>${L("Une séance en 4 blocs", "A 4-block session")}</h3><ul class="prog-obj">
      <li><b>${L("Échauffement", "Warm-up")}</b> — ${L("2 minutes pour préparer le corps.", "2 minutes to get your body ready.")}</li>
      <li><b>${L("Circuit principal", "Main circuit")}</b> — ${L("les exercices clés de ton sport, en plusieurs tours.", "the key exercises for your sport, over several rounds.")}</li>
      <li><b>${L("Prévention", "Prevention")}</b> — ${L("les zones les plus souvent blessées dans ton sport.", "the areas most often injured in your sport.")}</li>
      <li><b>${L("Retour au calme", "Cool-down")}</b> — ${L("étirements doux et respiration.", "gentle stretches and breathing.")}</li></ul>
    <h3>${L("Choisis ton niveau", "Choose your level")}</h3><ul class="prog-obj">${NIV_RENFO.map(n => `<li><b>${L(n[1], n[2])}</b> — ${L(n[9], n[10])}</li>`).join("")}</ul>
    <h3>${L("Les règles d’or", "Golden rules")}</h3><ul class="prog-obj">
      <li>${L("2 à 3 séances par semaine, avec 48 h entre deux séances des mêmes muscles.", "2 to 3 sessions a week, with 48 hours between sessions for the same muscles.")}</li>
      <li>${L("Jamais la veille d’un match ou d’une compétition.", "Never the day before a match or competition.")}</li>
      <li>${L("La technique d’abord : un geste propre vaut mieux qu’une répétition de plus.", "Technique first: a clean movement beats one more rep.")}</li>
      <li>${L("Progresse petit à petit : un tour de plus, moins de repos ou une variante plus difficile toutes les 2 à 3 semaines.", "Progress gradually: one more round, less rest or a harder variation every 2 to 3 weeks.")}</li>
      <li>${L("Une douleur articulaire ou tendineuse qui augmente = on arrête l’exercice.", "Joint or tendon pain that gets worse = stop the exercise.")}</li></ul>
    <h3>${L("Ce que dit la science", "What the science says")}</h3><p>${L("Une méta-analyse de 25 essais et 26 610 sportifs (Lauersen et al., 2014) montre que le renforcement musculaire réduit les blessures sportives à moins d’un tiers et presque de moitié les blessures de surmenage, bien plus que les étirements.", "A meta-analysis of 25 trials and 26,610 athletes (Lauersen et al., 2014) found that strength training cut sports injuries to less than a third and overuse injuries by almost half, far more than stretching.")}</p></details>`;
}
const GROUPES_RENFO = [["Sports collectifs", "Team sports", "foot basket handball volley"], ["Raquettes", "Racket sports", "tennis padel"], ["Endurance", "Endurance", "course cyclisme natation"],
  ["Combat et grimpe", "Combat and climbing", "boxe escalade"], ["Glisse", "Board sports", "ski surf"], ["Corps et esprit", "Mind and body", "pilates"]];
function listeRenfo() {
  const C = $("choicesCS"); C.innerHTML = ficheRenfo();
  const F = sportsFrequents(GROUPES_RENFO.flatMap(g => g[2].split(" "))), ajout = k => bouton(C, CATS[k].titre, SP[k] ? L(...SP[k].resume) : L(RENFOS[k][0], RENFOS[k][1]), CATS[k].couleur, () => vueMode(k)); tesSports(C, F, ajout);
  GROUPES_RENFO.forEach(([fr, en, l]) => { const r = l.split(" ").filter(k => !F.includes(k)); if (!r.length) return; C.insertAdjacentHTML("beforeend", `<h2 class="sec">${L(fr, en)}</h2>`); r.forEach(ajout); });
  C.insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Sans sport précis", "No specific sport")}</h2>`);
  bouton(C, "Renfo du corps", "Haut du corps, bas du corps ou tout le corps", CATS.renfo.couleur, () => vueZones());
}
const lireNiv = () => { try { return localStorage.getItem("niveauRenfo") || "inter"; } catch (e) { return "inter"; } };
function renduRenfo(grp) {
  const R = ROUTINES[SEANCE(grp)], F = RENFOS[grp], niv = lireNiv(), C = $("choicesM");
  C.innerHTML = `<div class="etude ech-fiche" style="--accent:${R.couleur}"><b>${L("Les qualités à développer", "Qualities to build")} : ${L(F[0], F[1])}</b><p>${L(F[2], F[3])}</p></div>
    <h2 class="sec">${L("Ton niveau", "Your level")}</h2><div class="stepper niv-choix">${NIV_RENFO.map(n => `<button class="toggle" data-n="${n[0]}" aria-pressed="${n[0] === niv}">${L(n[1], n[2])}</button>`).join("")}</div>
    <p class="niv-txt">${L(...NIV_RENFO.find(n => n[0] === niv).slice(9))}</p><h2 class="sec">${L("Ton renfo", "Your strength session")}</h2>`;
  C.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { stocker("niveauRenfo", b.dataset.n); renduRenfo(grp); });
  [[0, "Poids du corps", "Bodyweight", "Sans matériel, partout", "No equipment, anywhere"], [1, "Avec matériel", "With equipment", "Kettlebell, haltères, barre Z, banc, poulie, élastique…", "Kettlebell, dumbbells, EZ bar, bench, cable, band…"]].forEach(([m, fr, en, dFr, dEn]) => { const s = seanceRenfo(grp, m, niv);
    bouton(C, `${L(fr, en)} · ${s.total} min`, `${L(dFr, dEn)} · ${L("4 blocs", "4 blocks")}`, R.couleur, () => { ROUTINES.renfo = seanceRenfo(grp, m, lireNiv()); CONSEILLES.renfo = ROUTINES.renfo.exercices; ouvrirRoutine("renfo"); }); });
  C.insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Ton cardio", "Your cardio")}</h2>`);
  bouton(C, grp === "boxe" ? L("Cardio boxe", "Boxing cardio") : L("Cardio par intervalles", "Interval cardio"), L("Sprints, intervalles, pyramide" + (grp === "boxe" ? ", rounds de combat" : "") + " : dehors, sur tapis, à vélo, à la corde…", "Sprints, intervals, pyramid" + (grp === "boxe" ? ", fight rounds" : "") + ": outdoors, treadmill, bike, rope…"), "#DC2626", () => ouvrirCardio(grp));
  const SP = SPORT_PLUS[grp] || [[], ""], PG = PROGRAMMES.find(p => p[0] === SP[1]);   // outils propres au sport et programme de 4 semaines (js/sports.js)
  SP[0].forEach(([f, e, df, de, c, fn]) => bouton(C, L(f, e), L(df, de), c, () => fn(() => vueMode(grp))));
  if (PG) bouton(C, L("Programme : ", "Programme: ") + L(PG[1], PG[2]), L("4 semaines guidées, jour par jour", "4 guided weeks, day by day"), PG[5], () => ouvrirProg(PG[0]));
  C.insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Personnaliser", "Customise")}</h2>`);
  [["", "Poids du corps"], ["Mat", "Avec matériel"]].forEach(([s, t]) => { const k = SEANCE(grp) + s;
    bouton(C, `${L("Version libre", "Free version")} · ${T(t).toLowerCase()}`, L(`${ROUTINES[k].exercices.length} exercices à modifier, durées et repos réglables, à enregistrer`, `${ROUTINES[k].exercices.length} exercises to edit, adjustable work and rest, to save`), R.couleur, () => ouvrirRoutine(k)); });
  if (CATS[grp]) C.insertAdjacentHTML("beforeend", `<div class="etude ech-fiche" style="--accent:#94A3B8"><b>${L("Bientôt pour ce sport", "Coming soon for this sport")}</b><p>${L("Parcours sur plusieurs semaines jusqu’à ton objectif, technique, puissance, récupération, tests et fiches savoir, sur le modèle de la boxe.", "A multi-week plan up to your goal, technique, power, recovery, tests and knowledge cards, following the boxing model.")}</p></div>`);
}

/* ============ TABATA ============
   Tabata et al. (1996) : 8 × (20 s à très haute intensité / 10 s de repos) = 4 min. En 6 semaines, +14 % de VO2max et +28 % de capacité anaérobie.
   TABATAS = [id, nom FR, EN, couleur, niveau FR, EN, blocs (2 exercices alternés par bloc), récup entre blocs (s), texte FR, EN] */
const TABATAS = [
  ["decouverte", "Tabata découverte", "Tabata starter", "#F59E0B", "Débutant", "Beginner", [["jumpingJack", "squat"], ["kneeup", "pompesMur"]], 90, "Des exercices simples pour apprendre le format : chacun va à son rythme.", "Simple exercises to learn the format: go at your own pace."],
  ["original", "Tabata original", "Original Tabata", "#DC2626", "Avancé", "Advanced", [["burpees", "burpees"]], 60, "Le protocole de l’étude de 1996 : un seul exercice, 4 minutes à fond.", "The protocol from the 1996 study: one exercise, 4 minutes all out."],
  ["cardio", "Tabata cardio", "Cardio Tabata", "#EA580C", "Intermédiaire", "Intermediate", [["jumpingJack", "kneeup"], ["climbers", "skater"], ["squatsaute", "heelkick"], ["burpees", "footwork"]], 60, "4 blocs pour faire grimper le cœur et brûler un maximum.", "4 blocks to send your heart rate up and burn as much as possible."],
  ["jambes", "Tabata jambes", "Leg Tabata", "#0D9488", "Intermédiaire", "Intermediate", [["squat", "fentesalt"], ["squatsaute", "skater"], ["pontuni", "chaise"]], 60, "Cuisses et fessiers en feu, avec un bloc plus doux pour finir.", "Thighs and glutes on fire, with a gentler block to finish."],
  ["haut", "Tabata haut du corps", "Upper-body Tabata", "#7C3AED", "Intermédiaire", "Intermediate", [["pompes", "planchetouch"], ["pike", "climbers"], ["pompesserrees", "ours"]], 60, "Pectoraux, épaules, triceps et gainage.", "Chest, shoulders, triceps and core."],
  ["abdos", "Tabata abdos", "Abs Tabata", "#2563EB", "Intermédiaire", "Intermediate", [["climbers", "russian"], ["crunchInverse", "hollow"], ["planchelat", "deadbug"]], 60, "Toute la sangle abdominale, en dynamique et en gainage.", "Your whole core, both dynamic and static."],
  ["complet", "Tabata full body", "Full-body Tabata", "#BE123C", "Avancé", "Advanced", [["burpees", "squatsaute"], ["pompes", "climbers"], ["fentesalt", "planchetouch"], ["skater", "russian"]], 60, "Le plus complet et le plus exigeant : tout le corps en 4 blocs.", "The most complete and demanding: the whole body in 4 blocks."]
];
function seanceTabata(id) {
  const [, tFr, tEn, c, nvFr, nvEn, B, rec] = TABATAS.find(t => t[0] === id), plan = [], blocs = [], n = B.length;
  const ech = ["jumpingJack", "armcircles", "hip9090", "squat", "kneeup"].filter(e => EXERCICES[e]), nE = L("Échauffement", "Warm-up");
  ech.forEach((x, k) => plan.push({ id: x, d: 30, r: 5, bn: nE, lab: `${nE} · ${k + 1}/${ech.length}` })); plan[plan.length - 1].r = 20;
  blocs.push([nE, ech.map(x => [x, "30 s"]), L("Indispensable avant un effort aussi intense : monte progressivement.", "Essential before such an intense effort: build up gradually.")]);
  B.forEach((p, b) => { const nB = L("Bloc", "Block") + " " + (b + 1) + "/" + n;
    for (let i = 0; i < 8; i++) plan.push({ id: p[i % 2], d: 20, r: i < 7 ? 10 : b < n - 1 ? rec : 20, bn: nB, lab: `${nB} · ${L("intervalle", "interval")} ${i + 1}/8` });
    blocs.push([nB, [...new Set(p)].map(x => [x, p[0] === p[1] ? "8 × 20 s" : "4 × 20 s"]), L(`8 intervalles de 20 s à fond / 10 s de repos, exercices en alternance${b < n - 1 ? ` · ${rec} s de récupération après le bloc` : ""}`, `8 intervals of 20 s all out / 10 s rest, alternating exercises${b < n - 1 ? ` · ${rec} s recovery after the block` : ""}`)]); });
  const rac = ["relaxation", "quadDebout", "murPecs"].filter(e => EXERCICES[e]), nR = L("Retour au calme", "Cool-down");
  rac.forEach((x, k) => plan.push({ id: x, d: x === "relaxation" ? 60 : unilat(x) ? 60 : 40, r: 5, bn: nR, lab: `${nR} · ${k + 1}/${rac.length}` })); plan[plan.length - 1].r = 0;
  blocs.push([nR, rac.map(x => [x, x === "relaxation" ? "1 min" : unilat(x) ? "2 × 30 s" : "40 s"]), L("Laisse le cœur redescendre, puis étire doucement.", "Let your heart rate drop, then stretch gently.")]);
  const total = Math.round(plan.reduce((s, q) => s + q.d + q.r, 0) / 60);
  const html = `<li class="etude prog-carte-jour" style="--accent:${c}"><div><small><b>${L(nvFr, nvEn)} · ${n} ${L(n > 1 ? "blocs" : "bloc", n > 1 ? "blocks" : "block")} Tabata · ${n * 4} min ${L("d’effort intense", "of intense work")}</b></small><small>💡 ${L("« À fond » veut dire 9/10 : à la fin de chaque intervalle, tu ne pourrais pas tenir 5 secondes de plus.", "“All out” means 9/10: at the end of each interval you could not keep going for 5 more seconds.")}</small></div></li>` + blocs.map(blocHtml).join("");
  return { type: "seance", tbt: 1, fixe: true, couleur: c, plan, exercices: plan.map(q => q.id), listeHtml: html, rpe: "9", total, titre: L(tFr, tEn), titreFr: tFr, detail: "" };
}
function ficheTabata() {
  return `<details class="prog-info" style="--c:#D9480F"><summary>${L("Le Tabata : le guide", "Tabata: the guide")}</summary>
    <h3>${L("C’est quoi ?", "What is it?")}</h3><p>${L("Un bloc Tabata, c’est 8 fois 20 secondes d’effort à fond et 10 secondes de repos : 4 minutes qui font monter le cœur au maximum. On enchaîne un ou plusieurs blocs avec une minute de récupération entre chaque.", "One Tabata block is 8 rounds of 20 seconds all out and 10 seconds rest: 4 minutes that push your heart rate to the max. You do one or more blocks with a minute of recovery between them.")}</p>
    <h3>${L("D’où ça vient ?", "Where does it come from?")}</h3><p>${L("Du professeur Izumi Tabata et de son équipe (1996) : en 6 semaines, ce format a amélioré à la fois l’endurance (+14 % de VO2max) et la capacité à produire des efforts intenses (+28 %), en seulement quelques minutes par séance.", "From Professor Izumi Tabata and his team (1996): in 6 weeks this format improved both endurance (+14% VO2max) and the capacity for intense efforts (+28%), in just a few minutes per session.")}</p>
    <h3>${L("Les règles d’or", "Golden rules")}</h3><ul class="prog-obj">
      <li>${L("Toujours un échauffement avant : il est inclus dans chaque séance.", "Always warm up first: it is included in every session.")}</li>
      <li>${L("Intensité 9/10 sur chaque intervalle, mais jamais au détriment de la technique.", "9/10 intensity on every interval, but never at the expense of technique.")}</li>
      <li>${L("2 à 3 séances par semaine au maximum, jamais deux jours de suite.", "2 to 3 sessions a week at most, never two days in a row.")}</li>
      <li>${L("Débutant ? Commence par « Tabata découverte » et ralentis si besoin.", "Beginner? Start with “Tabata starter” and slow down if needed.")}</li>
      <li>${L("Problème cardiaque, tension ou reprise après une longue pause : demande d’abord l’avis d’un médecin.", "Heart problem, blood pressure or returning after a long break: check with a doctor first.")}</li></ul>
    <h3>${L("Pour progresser", "To progress")}</h3><p>${L("Compte tes répétitions sur chaque intervalle et essaie de garder le même nombre jusqu’au 8e : c’est le vrai signe de progrès. Ajoute ensuite un bloc.", "Count your reps in each interval and try to keep the same number up to the 8th: that is the real sign of progress. Then add a block.")}</p></details>`;
}
function vueTabata() {
  vue("choicesT", "tabata", "Tabata", L("20 s à fond, 10 s de repos, 8 fois. Choisis ta séance ou règle ton minuteur.", "20 s all out, 10 s rest, 8 times. Pick a session or set your own timer."), () => {
    const C = $("choicesT"); C.innerHTML = `<h2 class="sec">${L("Minuteur libre", "Free timer")}</h2>`;
    bouton(C, "Minuteur Tabata", "Effort, repos, répétitions et cycles réglables, sans exercice imposé", "#D9480F", () => ouvrirRoutine("tabata"));
    C.insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Séances prêtes", "Ready-made sessions")}</h2>` + ficheTabata());
    TABATAS.forEach(([id, tFr, tEn, c, nvFr, nvEn, B, , dFr, dEn]) => { const s = seanceTabata(id);
      bouton(C, `${L(tFr, tEn)} · ${s.total} min`, `${L(nvFr, nvEn)} · ${B.length} ${L(B.length > 1 ? "blocs" : "bloc", B.length > 1 ? "blocks" : "block")} · ${L(dFr, dEn)}`, c, () => { ROUTINES.tbt = seanceTabata(id); CONSEILLES.tbt = ROUTINES.tbt.exercices; ouvrirRoutine("tbt"); }); });
  });
}

