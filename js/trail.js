/* ============ TRAIL : réglages indépendants, historique ancien conservé ============ */
function migrerTrail() {
  const ancien = lireJSON("sp_course", {});
  if (ancien.obj === "trail" && !lire("sp_trail")) {
    // Une copie unique garde le profil route et les séances rn_ intacts.
    stocker("sp_trail", JSON.stringify({ ...ancien, obj: "court", historiqueCourse: true }));
  }
}
const OBJ_TR = [["court", "Court (< 42 km)", "Short (< 42 km)"], ["long", "Long (42–80 km)", "Long (42–80 km)"], ["ultra", "Ultra (> 80 km)", "Ultra (> 80 km)"]];
const TERRAIN_TR = [["cote", "Côte", "Hill"], ["escaliers", "Escaliers", "Stairs"], ["tapis", "Tapis inclinable", "Incline treadmill"], ["rien", "Terrain plat uniquement", "Flat ground only"]];
const nivTr = x => nivRn({ P: { ...x.P, obj: "trail" } });
const cibleTr = x => Math.max(10, Math.min(x.dur, [25, 40, 50][nivTr(x)]) * Math.min(1, x.f));
const echTr = x => echRn({ ...x, P: { ...x.P, obj: "trail" } }, false);
const budgetTr = x => Math.max(60, Math.floor(cibleTr(x) * 60 - tempsRn([...echTr(x), coreRn(), ...calmeRn()])));
const finirTr = (x, blocs, remplir = true) => {
  const reste = budgetTr(x) - tempsRn(blocs);
  return [...echTr(x), ...blocs, ...(remplir && reste >= 30 ? [blocRn("Endurance facile", "Easy endurance", [eltRn("rn_ef", reste, txtRn("ef"))])] : []), coreRn(), ...calmeRn()];
};
const terrainTr = x => x.P.terrain || "rien";
const consigneTr = x => terrainTr(x) === "escaliers" ? L("Escalier régulier, sec, rampe disponible ; redescends en marchant sans sauter de marche.", "Even dry stairs, rail available; walk down without skipping steps.") : terrainTr(x) === "tapis" ? L("Inclinaison modérée, maîtrise la commande ; récupération à plat. Le tapis ne prépare pas aux descentes.", "Moderate incline, familiar controls; recover flat. A treadmill does not train descents.") : terrainTr(x) === "rien" ? L("Sur plat : effort régulier, sans simuler un dénivelé. Complète par la force ; pas de descente technique possible ici.", "On flat ground: even effort without claiming elevation gain. Add strength; technical descents cannot be trained here.") : L("Pente connue, non exposée et sans obstacle ; marche si nécessaire.", "Familiar unexposed slope without obstacles; walk as needed.");
const effortTr = x => terrainTr(x) === "rien" ? "rn_ef" : terrainTr(x) === "escaliers" || !nivTr(x) ? "rnMarcheCote" : "rn_montee";
function fractionsTr(x, fr, en, d, r, caps, effort) {
  const b = budgetTr(x), t = Math.min(d, b), n = Math.max(1, Math.min(Math.floor(caps[nivTr(x)] * Math.min(1, x.f)), Math.floor((b + r) / (t + r))));
  return finirTr(x, [blocRn(fr, en, [eltRn(effortTr(x), t, RPE_SP(effort, consigneTr(x)))], L(`${n} × ${duTxt(t)}, récupération ${duTxt(r)} en marchant. Le format peut réduire le nombre de passages.`, `${n} × ${duTxt(t)}, ${duTxt(r)} walking recovery. The format may reduce repeat count.`), n, r)]);
}
exosSp([
  ["stepDown", 60, "", "", "", "Descente de marche contrôlée", "Controlled step-down", "Quadriceps, hanche, contrôle du genou", "Quads, hip, knee control",
    "Sur une marche basse stable de 10 à 15 cm, près d’un appui, descends en 3 secondes jusqu’à effleurer le sol du talon libre, puis remonte. Genou dans l’axe du pied. 4 à 6 répétitions par côté, puis repos. Sans marche : fente statique au sol. Arrête si douleur ou perte de contrôle.", "On a stable low 10 to 15 cm step near support, lower over 3 seconds until the free heel lightly touches the floor, then rise. Knee aligned with foot. 4 to 6 reps per side, then rest. Without a step: floor split squat. Stop for pain or loss of control.", "fente", "Appui à portée de main.|Descends en trois secondes, genou dans l’axe.|Change de côté à mi-temps. Sans marche, fente au sol.", "Support within reach.|Lower for three seconds, knee aligned.|Switch halfway. Without a step, floor split squat."],
  ["hopStick", 40, "", "", "", "Petit saut et réception tenue", "Small hop and hold", "Chevilles, hanche, équilibre", "Ankles, hip, balance",
    "Sur sol plat sec, fais un tout petit saut sur place puis tiens la réception 2 à 3 secondes. 3 répétitions par côté, repos ensuite. Commence sur deux pieds ; sur un pied seulement si stable et sans douleur. Débutant ou fatigue : équilibre sans saut, yeux ouverts.", "On flat dry ground, make a tiny hop in place and hold the landing for 2 to 3 seconds. 3 reps per side, then rest. Start on two feet; single-leg only if stable and pain-free. Beginner or tired: eyes-open balance without jumping.", "receptionSaut", "Petit saut, sans chercher la hauteur.|Tiens la réception deux à trois secondes.|Trois répétitions par côté puis repos. Équilibre sans saut si besoin.", "Tiny hop, no height target.|Hold for two to three seconds.|Three reps per side then rest. Balance without jumping if needed."],
  ["tibialis", 40, "", "", "", "Relevés de pointes", "Toe raises", "Avant de la jambe", "Front of lower leg",
    "Debout près d’un appui, talons au sol, relève les pointes puis repose lentement. 8 à 12 répétitions sans douleur, puis repos. Réduis l’amplitude ou fais-le assis si difficile.", "Stand near support, heels grounded, lift toes then lower slowly. 8 to 12 pain-free reps, then rest. Reduce range or sit if difficult.", "calfraise", "Talons au sol.|Relève les pointes, repose lentement.|Huit à douze répétitions puis repos.", "Heels down.|Lift toes, lower slowly.|Eight to twelve reps then rest."],
  ["trBatons", 60, "", "", "", "Marche et coordination des bâtons", "Walking and pole coordination", "Jambes, bras, tronc", "Legs, arms, trunk",
    "Sur pente douce connue, marche avec petits pas et bras alternés. Si tu as des bâtons et si le parcours les autorise, plante-les près du corps sans gêner autrui. Sans bâtons : mains sur les cuisses. Ne les découvre pas le jour de course.", "On a familiar gentle slope, walk with short steps and alternating arms. If poles are available and permitted, plant near the body without obstructing others. Without poles: hands on thighs. Do not first try them on race day.", "rnMarcheCote", "Petits pas, bras alternés.|Bâtons près du corps si autorisés.|Sans bâtons, mains sur les cuisses.", "Short steps, alternating arms.|Poles near body if permitted.|Without poles, hands on thighs."],
  ["trDescenteLongue", 60, "", "", "", "Descente progressive", "Progressive downhill", "Quadriceps, chevilles", "Quads, ankles",
    "Pente douce connue, sèche et sans exposition. Commence par 5 min cumulées en courts passages, avec remontée marchée. Augmente vers 10 puis 20 min cumulées seulement après plusieurs séances bien tolérées, sans accélérer en même temps. Marche si fatigue ou contrôle insuffisant. Pas de descente rapide dans les escaliers.", "Familiar gentle dry unexposed slope. Start with 5 cumulative minutes in short bouts, walking uphill. Build to 10 then 20 cumulative minutes only after several well-tolerated sessions, without also increasing speed. Walk for fatigue or poor control. No fast stair descents.", "rnDescente", "Pente douce connue.|Petits passages contrôlés, remontée marchée.|La qualité prime sur le temps. Arrête si douleur.", "Familiar gentle slope.|Short controlled bouts, walk uphill.|Quality before time. Stop for pain."],
  ["trMonteeTest", 660, "", "", "", "Test de montée · 11 min", "Uphill test · 11 min", "Endurance en montée", "Uphill endurance",
    "Coureur régulier, reposé, sans douleur : échauffe-toi 10 à 15 min puis monte 11 min sur une pente mesurée, régulière, non technique. Course ou marche, effort soutenu contrôlé. Note le D+ réellement mesuré, pas l’altitude finale. D+ × 60 / 11 donne les mètres par heure. Même parcours et conditions pour comparer ; marche ensuite. Arrête en cas de malaise.", "Regular runner, rested and pain-free: warm up for 10 to 15 min then climb for 11 min on a measured even nontechnical slope. Run or walk at controlled hard effort. Record actual elevation gained, not final altitude. Gain × 60 / 11 gives metres per hour. Compare on the same course and conditions; walk afterwards. Stop for faintness.", "rnMarcheCote", "Après échauffement, montée régulière onze minutes.|Note le dénivelé positif réel.|Marche ensuite. Arrête en cas de malaise.", "After warming up, climb evenly for eleven minutes.|Record actual elevation gain.|Walk afterwards. Stop for faintness."]
]);
const TRS = {
  nature: { ...RNS.ef, t: ["Endurance nature", "Nature endurance"], f: (k, x) => finirTr(x, [blocRn("Endurance nature", "Nature endurance", [eltRn("rn_ef", budgetTr(x), RPE_SP("3–4", consigneTr(x)))])]) },
  sl: { ...RNS.sl, t: ["Sortie longue · temps et D+", "Long outing · time and gain"], f: (k, x) => {
    const objectif = { court: .8, long: .9, ultra: 1 }[x.P.obj] || .8, t = Math.max(60, Math.floor(budgetTr(x) * objectif / 60) * 60), dp = Math.round(Math.min(+x.P.dp || 0, [100, 300, 500][nivTr(x)]) * t / 3600);
    return finirTr(x, [blocRn("Sortie longue", "Long outing", [eltRn("rn_ef", t, RPE_SP("3–4", consigneTr(x)))], L(`${Math.round(t / 60)} min ; repère de D+ ${dp} m si terrain adapté, à réduire selon tes sorties récentes. Le D+ de course ne doit pas être reproduit à chaque séance.`, `${Math.round(t / 60)} min; elevation guide ${dp} m if terrain allows, reduce to recent tolerance. Do not reproduce race elevation every session.`))], false);
  } },
  cotesCourtes: { ...RNS.cotes, t: ["Côtes courtes · 8–12 passages", "Short hills · 8–12 repeats"], d: ["Cible progressive : 8 à 12 × 30–45 s ; débutant et format court : moins de passages, marche possible.", "Progressive target: 8 to 12 × 30–45 s; beginner and short format: fewer repeats, walking allowed."], f: (k, x) => fractionsTr(x, "Côtes courtes", "Short hills", [30, 30, 45][nivTr(x)], 60, [6, 10, 12], "6–8") },
  cotesLongues: { ...RNS.cotesLongues, t: ["Côtes longues · 3–5 passages", "Long hills · 3–5 repeats"], d: ["Cible 3 à 5 × 4–6 min en courant ou en marche active. Réduite selon le niveau et le budget du format.", "Target 3 to 5 × 4–6 min running or power hiking. Reduced by level and format budget."], f: (k, x) => fractionsTr(x, "Côtes longues", "Long hills", [240, 240, 360][nivTr(x)], 120, [2, 3, 5], "5–7") },
  seuil: { ...RNS.seuil, t: ["Seuil en côte", "Uphill threshold"], f: (k, x) => fractionsTr(x, "Seuil en côte", "Uphill threshold", [120, 240, 360][nivTr(x)], 120, [2, 3, 3], "6–7") },
  descente: { ...RNS.gammes, t: ["Descente technique progressive", "Progressive technical descent"], rpe: "3–4", d: ["De 5 à 20 min cumulées après adaptation, en courts passages contrôlés. Pas de descente sur tapis ni d’escalier rapide.", "From 5 to 20 cumulative minutes after adaptation, in short controlled bouts. No treadmill descent or fast stairs."], f: (k, x) => {
    if (terrainTr(x) !== "cote") return finirTr(x, [blocRn("Contrôle sans descente", "Control without descent", [eltRn("rnFenteSol", 60, consigneTr(x), 30), eltRn("rnEquilibre", 40)], L("Le terrain disponible ne permet pas de travailler la descente : renforcement et équilibre au sol.", "Available terrain does not allow downhill practice: floor strength and balance."))], false);
    const cap = Math.min([5, 10, 20][Math.max(0, Math.min(2, +x.P.descente || 0))], [5, 10, 20][nivTr(x)]), d = cap === 20 ? 120 : 60, n = Math.max(1, Math.min(cap * 60 / d, Math.floor((budgetTr(x) + 120) / (d + 120))));
    return finirTr(x, [blocRn("Descentes cumulées", "Cumulative descents", [eltRn("trDescenteLongue", d, RPE_SP("3–4", L("Marche au début, parcours connu ; remontée au repos.", "Walk initially, familiar route; walk uphill during recovery.")))], L(`${n * d / 60} min de descente cumulée ; remontées marchées de 2 min minimum, à prolonger selon le terrain.`, `${n * d / 60} cumulative downhill minutes; walk uphill at least 2 min, extend to terrain.`), n, 120)], false);
  } },
  force: { ...RNS.force, t: ["Force excentrique", "Eccentric strength"], d: ["Quadriceps et hanches : descentes lentes, appui stable, amplitude tolérée. Sans banc : fentes au sol. Garde 2 à 3 répétitions en réserve.", "Quads and hips: slow lowering, stable support, tolerated range. Without a bench: floor split squats. Keep 2 to 3 reps in reserve."], f: (k, x) => {
    const n = Math.max(1, Math.min([1, 2, 3][nivTr(x)], Math.floor((budgetTr(x) + 60) / 330)));
    return finirTr(x, [blocRn("Force excentrique", "Eccentric strength", [eltRn("squatFreine", 40, L("6 répétitions, descente en 3 s, puis repos.", "6 reps, lower over 3 s, then rest."), 30), eltRn(x.mat.includes("box") ? "skDescenteBox" : "rnFenteSol", 60, L("4 à 6 par côté, faible hauteur ; au sol sans banc.", "4 to 6 each side, low height; floor option without bench."), 30), eltRn(x.mat.includes("box") ? "stepDown" : "rnFenteSol", 60, "", 30), eltRn("rdl", 40)], L("2 à 3 répétitions en réserve, sans douleur. Sans matériel : fentes au sol.", "2 to 3 reps in reserve, pain-free. Without equipment: floor split squats."), n, 60)], false);
  } },
  chevilles: { ...RNS.plio, t: ["Chevilles et pieds", "Ankles and feet"], d: ["Équilibre yeux ouverts, mollets et relevés de pointes. Ensuite, 3 petits sauts par côté si stable, sans douleur et reposé. Sans marche : mollets au sol.", "Eyes-open balance, calves and toe raises. Then 3 small hops each side if stable, pain-free and rested. Without a step: floor calf work."], f: (k, x) => {
    const n = Math.max(1, Math.min([1, 2, 3][nivTr(x)], Math.floor((budgetTr(x) + 60) / 330)));
    return finirTr(x, [blocRn("Appuis", "Foot control", [eltRn("rnEquilibre", 40, L("Yeux ouverts, appui à proximité.", "Eyes open, support nearby."), 30), eltRn(nivTr(x) ? "hopStick" : "rnEquilibre", 40, "", 60), eltRn("tibialis", 40, "", 30), eltRn(x.mat.includes("box") ? "alfredson" : "rnMolletsFlechis", 40, L("6 descentes lentes par côté, appui disponible ; amplitude confortable, sans douleur ni descente forcée. Sans marche : mollets au sol. Pas un protocole de soin.", "6 slow lowers per side with support; comfortable pain-free range, no forced heel drop. Without a step: floor calf raises. Not a treatment protocol."))], "", n, 60)], false);
  } },
  enchaine: { ...RNS.ef, t: ["Week-end enchaîné · deuxième jour", "Back-to-back weekend · second day"], d: ["Long ou ultra, coureur expérimenté et déjà adapté : lendemain d’une sortie longue, marche-course facile et plus courte. Annule si douleur, fatigue ou contrôle insuffisant.", "Long or ultra, experienced and already adapted: after a long outing, shorter easy run-walk. Cancel for pain, fatigue or poor control."], f: (k, x) => finirTr(x, [blocRn("Deuxième jour facile", "Easy second day", [eltRn("rn_marche", Math.round(budgetTr(x) * .5), RPE_SP("2–3", L("Marche prioritaire, raccourcis selon ton état.", "Prioritise walking, shorten to how you feel.")))])], false) },
  affutage: RNS.affutage,
  recup: RNS.recup
};
Object.values(TRS).forEach(S => Object.assign(S, { max: 1, fixe: 1, sansMob: 1, sansEch: 1 }));
const SAVOIR_TR = [
  ["⛰️", "Descente et quadriceps", "Descents and quadriceps", "La répétition de descentes peut réduire les courbatures sans supprimer la perte de force. Associe force excentrique et descentes progressives, avec récupération. Moins de courbatures ne signifie pas que les jambes ont récupéré. Commence par 5 min cumulées ; 10 puis 20 min seulement après plusieurs séances bien tolérées.", "Repeated descents may reduce soreness without removing strength loss. Combine eccentric strength with progressive downhill practice and recovery. Less soreness does not mean recovered legs. Start at 5 cumulative minutes; 10 then 20 only after several well-tolerated sessions."],
  ["🦶", "Chevilles : stabilité et fatigue", "Ankles: stability and fatigue", "Travaille l’équilibre yeux ouverts, les mollets et de petites réceptions contrôlées. En terrain irrégulier, ralentis avec la fatigue. Après une entorse, reprends avec un professionnel si nécessaire ; gonflement ou impossibilité d’appui : fais évaluer.", "Train eyes-open balance, calves and small controlled landings. Slow down on uneven terrain when tired. After a sprain seek professional return advice if needed; swelling or inability to bear weight needs assessment."],
  ["👣", "Pieds : ampoules et frottements", "Feet: blisters and chafing", "Teste chaussures et chaussettes en sortie, garde les pieds aussi secs que possible, traite tôt un point chaud. Pas de matériel neuf le jour J. Plaie infectée, douleur ou problème de sensibilité : avis professionnel.", "Test shoes and socks in training, keep feet as dry as possible and address hot spots early. No new kit on race day. Infected wounds, pain or altered sensation need professional advice."],
  ["🎒", "Matériel obligatoire et course", "Required race kit", "Lis la liste propre à ta course et la météo : eau, réserve alimentaire, protection pluie/froid, couverture, sifflet, téléphone chargé, éclairage selon le parcours. Teste le sac chargé, les ravitaillements et les bâtons autorisés. Informe un proche de ton itinéraire, conserve une marge et renonce si les conditions se dégradent.", "Read your race’s own kit list and forecast: water, food, rain/cold protection, blanket, whistle, charged phone and lighting as required. Test a loaded pack, aid stations and permitted poles. Tell someone your route, keep a margin and turn back if conditions worsen."],
  ["🍌", "Alimentation pendant l’effort", "Fuelling during exercise", "Sur une sortie longue, commence par 30 à 50 g de glucides par heure selon tolérance, en prises régulières, testées à l’entraînement. C’est un repère pour l’ultra, pas une cible imposée à tous. Bois selon la soif, la chaleur et les points d’eau ; évite de te forcer à boire. Prévois une réserve adaptée à l’isolement. Si troubles digestifs, ajuste avec un professionnel.", "On a long outing, start with 30 to 50 g carbohydrate per hour as tolerated, in regular portions tested in training. This is an ultra guide, not a target imposed on everyone. Drink to thirst, heat and water availability; avoid forced drinking. Carry reserves suited to remoteness. Adjust with professional advice for digestive problems."],
  ["📆", "Blocs, affûtage et limites du format", "Blocks, taper and format limits", "Fondations, développement puis spécifique. Avant la course : 2 semaines allégées, 3 pour l’ultra, environ 40 à 50 % de volume en moins et un peu d’intensité familière. J-2 facultatif, repos J-1. Les formats 20/35/50 min sont des séances complémentaires, pas une préparation complète au trail long ou à l’ultra.", "Foundations, development then specific work. Before racing: 2 lighter weeks, 3 for ultra, about 40 to 50% less volume with a little familiar intensity. Optional J-2, rest J-1. The 20/35/50-min formats are complementary sessions, not complete long-trail or ultra preparation."]
];
const OBJECTIF_TR = {
  objs: OBJ_TR, blocs: BLOCS_RN, dur: ["sl", "cotesCourtes", "cotesLongues", "seuil", "descente", "force", "chevilles"], longue: "sl", taper: P => P.obj === "ultra" ? 3 : 2,
  jour: ["🏁", "Jour de trail", "Trail race day"], ech: "course", profil: ["Mon profil trail", "My trail profile"], date: ["Date du trail (facultatif)", "Trail date (optional)"], n: [2, 3, 4, 5, 6],
  sem: (P, bloc) => ["nature", "sl", "force", nivTr({ P }) ? (bloc === 1 ? "chevilles" : bloc === 2 ? "cotesCourtes" : "cotesLongues") : "nature", "nature", "recup"],
  fiche: () => ""
};
function trSemaine(P = spPref("trail")) {
  const S = semaineObjectif(OBJECTIF_TR, P, 1), course = P.date ? new Date(P.date + "T12:00") : null;
  const W = course ? Math.floor((lundi(course) - S.L0) / 6048e5) : null;
  const taper = W !== null && W >= 0 && W < OBJECTIF_TR.taper(P), dures = OBJECTIF_TR.dur;
  // l'affûtage du trail suit son propre calcul en semaines : sinon pas de mention « affûtage » sans semaine affûtée
  if (taper) S.f = W ? .6 : .5; else if (S.f < 1) { S.f = 1; S.info = S.info.replace(L(" · affûtage", " · taper"), ""); }
  // Le calendrier commun est filtré pour ne pas forcer une charge près du club ou d’une course.
  S.jours.forEach((j, d) => {
    const ecart = course ? Math.round((new Date(course.getFullYear(), course.getMonth(), course.getDate()) - j.d) / 864e5) : null;
    if (ecart === 0) j.l = ["jourJ"];
    else if (ecart === 1) j.l = ["repos"];
    else if (ecart === 2) j.l = j.club ? [] : ["affutage"];
    else if (ecart !== null && ecart < 0) j.l = [];
    else j.l = j.l.filter(c => !j.club && (!taper || !["sl", "force", "descente", "chevilles"].includes(c)) && (!dures.includes(c) || ![d - 1, d + 1].some(v => S.jours[(v + 7) % 7].club || (v >= 0 && v < 7 && S.jours[v].l.some(q => dures.includes(q))))));
  });
  if (!taper && P.enchaine && P.obj !== "court" && nivTr({ P }) === 2 && !S.jours[4].club && !S.jours[5].club && !S.jours[6].club && !S.jours[4].l.some(c => dures.includes(c)) && (!course || (course - S.L0) / 864e5 > 21)) {
    S.jours.forEach(j => { j.l = j.l.filter(c => c !== "sl"); }); S.jours[5].l = ["sl"]; S.jours[6].l = ["enchaine"];
  }
  return S;
}
function trParcours(h) {
  const P = h.P, S = trSemaine(P), B = BLOCS_RN[S.bloc - 1];
  h.html(`<div class="carnet"><h3>${L(B[0], B[1])}</h3><p>${S.info}${S.f < 1 ? L(" · volume réduit", " · reduced volume") : ""}</p><p>${L("Les séances exigeantes évitent les jours de club et leurs voisins. Le calendrier peut proposer moins de séances. Les formats courts complètent une préparation adaptée au parcours.", "Demanding sessions avoid club days and their neighbours. Fewer sessions may be offered. Short formats complement preparation suited to the course.")}</p></div>`);
  semaineSp(h, S, c => c === "jourJ" ? "🏁 " + L("Jour de trail", "Trail race day") : c === "repos" ? L("Repos", "Rest") : L(...TRS[c].t), c => ["jourJ", "repos"].includes(c) ? null : c, c => c === "affutage" ? undefined : S.f);
  const historique = lireHist().filter(x => x.k && (x.k.startsWith("tr_") || P.historiqueCourse && x.k.startsWith("rn_")));
  h.html(`<p class="sh-aide">${L(`${historique.length} séances conservées, ancien historique course inclus pour les profils migrés.`, `${historique.length} sessions retained, including legacy running history for migrated profiles.`)}</p><h2 class="sec">${L("Mon profil trail", "My trail profile")}</h2><div class="carnet bx-prof">
    <span class="champ-titre">${L("Format", "Format")}</span>${chips("tro", OBJ_TR, P.obj)}
    <span class="champ-titre">${L("Niveau", "Level")}</span>${chips("trn", NIV_RN, P.niv)}
    <label for="trDate">${L("Date", "Date")}</label><input class="choixVoix" type="date" id="trDate" value="${P.date}" min="${jourCle()}"><button class="toggle" id="trDateX">${L("Effacer", "Clear")}</button>
    <label for="trDp">${L("Dénivelé positif de la course (m)", "Race elevation gain (m)")}</label><input class="choixVoix" id="trDp" type="number" min="0" max="30000" step="50" value="${P.dp}">
    <span class="champ-titre">${L("Terrain disponible", "Available terrain")}</span>${chips("trt", TERRAIN_TR, P.terrain)}
    <span class="champ-titre">${L("Séances par semaine", "Sessions per week")}</span>${chips("trk", [2, 3, 4, 5, 6].map(n => [n, n, n]), P.n)}
    <span class="champ-titre">${L("Jours de club", "Club days")}</span>${choixJours("trj", P.jours)}
    <span class="champ-titre">${L("Descente déjà bien tolérée (min cumulées)", "Already tolerated descents (cumulative min)")}</span>${chips("trd", [[0, "5 min", "5 min"], [1, "10 min", "10 min"], [2, "20 min", "20 min"]], P.descente)}
    <button class="toggle" id="trEnchaine" aria-pressed="${!!P.enchaine}">${L("Week-end enchaîné (long/ultra, confirmé adapté)", "Back-to-back weekend (long/ultra, adapted experienced runner)")}</button></div>`);
  const maj = p => { spGarder("trail", p); h.rendu(); };
  [["tro", "obj"], ["trn", "niv"], ["trt", "terrain"]].forEach(([a, k]) => brancherChips(a, v => maj({ ...spPref("trail"), [k]: v })));
  [["trk", "n"], ["trd", "descente"]].forEach(([a, k]) => brancherChips(a, v => maj({ ...spPref("trail"), [k]: +v })));
  brancherJours(h, "trj", "jours", maj);
  $("trDate").onchange = e => maj({ ...spPref("trail"), date: e.target.value });
  $("trDateX").onclick = () => maj({ ...spPref("trail"), date: "" });
  $("trDp").onchange = e => maj({ ...spPref("trail"), dp: Math.max(0, Math.min(30000, +e.target.value || 0)) });
  $("trEnchaine").onclick = () => maj({ ...spPref("trail"), enchaine: !spPref("trail").enchaine });
}
SP.trail = { nom: ["Trail", "Trail running"], sous: ["Monter, descendre, durer : une préparation adaptée au terrain et au niveau.", "Climb, descend, endure: preparation suited to terrain and level."], resume: ["Court, long, ultra : côtes, descentes, force, tests et matériel", "Short, long, ultra: hills, descents, strength, tests and kit"],
  c: "#0E7C86", cle: "sp_trail", pre: "tr_", get def() { migrerTrail(); return { obj: "court", niv: "debutant", n: 3, date: "", dp: 0, terrain: "rien", descente: 0, enchaine: false }; },
  mat: ["kb", "elastique", "box"], S: TRS, mob: MOB_RN, calme: SP.course.calme, mobTxt: SP.course.mobTxt, coreNom: SP.course.coreNom, core: SP.course.core, savoir: SAVOIR_TR, objectif: OBJECTIF_TR,
  onglets: [["parcours", "Parcours", "Plan", trParcours, 1],
    ["cotes", "Côtes et descentes", "Hills and descents", h => { h.cartes(["cotesCourtes", "cotesLongues", "seuil", "descente"]); h.gestes(["rnMarcheCote", "trDescenteLongue", "trBatons"]); h.fiche(0); }],
    ["force", "Force et chevilles", "Strength and ankles", h => { h.cartes(["force", "chevilles"]); h.gestes(["stepDown", "hopStick", "tibialis"]); h.fiche(1); }],
    ["endurance", "Endurance", "Endurance", h => { h.cartes(["nature", "sl"]); if (h.P.obj !== "court") h.carte("enchaine"); h.cartes(["recup", "affutage"]); h.fiche(5); }],
    ["tests", "Tests", "Tests", h => { h.html(`<div class="carnet"><p>${L("VMA : navette ou 6 min pour un repère estimé. Montée : 11 min sur pente mesurée, D+ × 60 / 11 en m/h. Step-down : 10 répétitions par côté, note séparément les répétitions contrôlées ; l’asymétrie n’est pas un diagnostic.", "Aerobic speed: shuttle or 6 min for an estimated guide. Climb: 11 min on a measured slope, gain × 60 / 11 in m/h. Step-down: 10 reps each side, record controlled reps separately; asymmetry is not a diagnosis.")}</p><p>${L("Reposé, échauffement 10–15 min, sans douleur ; mêmes conditions pour comparer. Pas de test maximal nécessaire pour commencer.", "Rested, warm up 10–15 min, pain-free; same conditions for comparison. No maximal test needed to start.")}</p></div>`); const montee = +derTest("trMontee"), gauche = +derTest("trStepG"), droite = +derTest("trStepD");
      h.html(`<div class="carnet"><p>${Number.isFinite(montee) ? L(`Dernière montée : ${Math.round(montee * 60 / 11)} m de D+/h.`, `Latest climb: ${Math.round(montee * 60 / 11)} m ascent/hour.`) : L("Pas encore de test de montée.", "No uphill test yet.")}</p><p>${Number.isFinite(gauche) && Number.isFinite(droite) ? L(`Step-down gauche ${gauche}/10 · droite ${droite}/10 · écart ${Math.abs(gauche - droite)} répétition(s). Compare des tests du même jour.`, `Step-down left ${gauche}/10 · right ${droite}/10 · difference ${Math.abs(gauche - droite)} rep(s). Compare same-day tests.`) : L("Note les deux côtés pour comparer le contrôle.", "Record both sides to compare control.")}</p></div>`);
      h.gestes(["trMonteeTest", "stepDown"]);
      bouton(h.C(), L("Test navette", "Shuttle test"), L("VMA guidée au bip", "Beep-guided aerobic speed"), SP.trail.c, ouvrirNavette);
      bouton(h.C(), L("Noter les tests", "Record tests"), L("Montée, step-down et VMA", "Climb, step-down and aerobic speed"), SP.trail.c, () => ouvrirTests(() => ouvrirSport("trail", "tests"))); }, 1],
    ["materiel", "Matériel et course", "Kit and race", h => { h.fiche(2); h.fiche(3); h.fiche(4); h.gestes(["trBatons"]); }, 1],
    ["savoir", "Savoir", "Knowledge", h => h.savoir(), 1]]
};
TESTS.push(
  ["trMontee", "Montée · D+ sur 11 min", "Climb · gain over 11 min", "m", "m", "Après échauffement, note le D+ mesuré en 11 min. Multiplie par 60 / 11 pour les m/h. Même pente et conditions, course ou marche, effort contrôlé. Pas de pente sûre disponible : reporte le test.", "After warming up, enter measured elevation gain over 11 min. Multiply by 60 / 11 for m/h. Same slope and conditions, run or walk, controlled effort. No safe slope: postpone."],
  ["trStepG", "Step-down · gauche", "Step-down · left", "rép./10", "reps/10", "Marche basse stable, appui disponible, 10 répétitions lentes au plus, même hauteur de chaque côté. Note celles contrôlées à gauche, puis à droite. Arrête si douleur ; l’écart guide le travail mais ne diagnostique rien.", "Stable low step, support nearby, up to 10 slow reps, same height both sides. Record controlled left reps, then right reps. Stop for pain; the difference guides work but diagnoses nothing."],
  ["trStepD", "Step-down · droite", "Step-down · right", "rép./10", "reps/10", "Même protocole que le côté gauche : maximum 10 répétitions contrôlées sans douleur.", "Same protocol as left: at most 10 controlled pain-free reps."]
);
CATS.course.titre = L("Course sur route", "Road running");
CATS.trail = { titre: L("Trail", "Trail running"), detail: L("Côtes, descentes, chevilles", "Hills, descents, ankles"), couleur: SP.trail.c };

// Ma semaine et le parcours passent par semaineObjectif : le trail y branche son propre calendrier.
OBJECTIF_TR.semaine = trSemaine;

// Ces deux écrans sont audités ; le bandeau générique reste sur les autres sports.
[SP.course, SP.trail].forEach(G => G.onglets.forEach(O => {
  const rendre = O[3]; O[3] = h => { h.C().querySelector(".sp-refonte")?.remove(); rendre(h); };
}));
