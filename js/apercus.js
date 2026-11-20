/* ============ APERÇUS : le ressenti et les performances expliqués selon l'état du jour ============
   Une séance notée (effort ressenti « ef » sur 10, effort visé « ec ») est comparée à l'état de ce jour-là : réponses de la batterie (forme.js),
   charge des 7 derniers jours par rapport à l'habitude, séance ou club dur la veille, jours sans repos, heure de la séance, reprise après une pause,
   séance faite pour la première fois. Les tests (« tests ») et les charges en salle (« charges ») sont lus de la même façon : baisse ou record.
   Affichage : une phrase, 2 ou 3 conseils et un « Pourquoi ? » dépliable ; les explications complètes sont dans « Comprendre ton corps ».
   Rien n'est envoyé : tout est calculé sur le téléphone à partir des données déjà enregistrées. */

// facteurs : [titre FR, EN, ce qui s'est passé FR, EN, mécanisme FR, EN, conseil FR, EN, sens : -1 rend l'effort plus dur, 1 plus facile]
const FACTEURS = {
  sommeil: ["Nuit courte", "Short night", "tu avais peu dormi", "you had slept little",
    "Pendant le sommeil profond, le corps reconstitue les réserves d’énergie des muscles (le glycogène) et le système nerveux récupère. Avec moins de 7 h, ces réserves sont incomplètes et le cerveau envoie un signal de fatigue plus fort : pour le même travail, le cœur monte plus vite et l’effort paraît plus dur.",
    "During deep sleep the body refills the muscles’ energy stores (glycogen) and the nervous system recovers. With under 7 h, those stores are incomplete and the brain sends a stronger fatigue signal: for the same work, your heart rate climbs faster and the effort feels harder.",
    "Vise 7 à 9 h, et couche-toi 30 min plus tôt la veille d’une grosse séance.", "Aim for 7 to 9 h, and go to bed 30 min earlier before a big session.", -1],
  qualite: ["Sommeil agité", "Restless sleep", "ton sommeil était de mauvaise qualité", "your sleep was poor",
    "Un sommeil haché réduit les phases profondes, celles où l’hormone de croissance répare les muscles. Même avec assez d’heures, la récupération reste partielle.",
    "Broken sleep cuts the deep phases, when growth hormone repairs muscle. Even with enough hours, recovery stays partial.",
    "Écrans coupés 30 min avant de dormir, chambre fraîche et sombre, pas d’effort intense juste avant le coucher.", "Screens off 30 min before bed, a cool dark room, no hard effort right before bedtime.", -1],
  energie: ["Énergie basse", "Low energy", "tu te sentais à plat", "you felt drained",
    "Une énergie basse le matin reflète souvent un manque de récupération, un repas insuffisant ou un début de maladie. Le corps économise : il rend chaque effort plus pénible pour te freiner.",
    "Low morning energy often reflects poor recovery, too little food or the start of an illness. The body saves energy: it makes each effort feel worse to hold you back.",
    "Mange un repas avec des glucides 2 à 3 h avant la séance, et bois régulièrement.", "Eat a meal with carbohydrates 2 to 3 h before training, and drink regularly.", -1],
  stress: ["Stress", "Stress", "tu étais stressé", "you were stressed",
    "Le stress garde le système nerveux en mode alerte (hormones du stress comme le cortisol). Il consomme de l’énergie, perturbe le sommeil et augmente la perception de l’effort : la tête fatigue avant les muscles.",
    "Stress keeps the nervous system on alert (stress hormones such as cortisol). It burns energy, disturbs sleep and raises perceived effort: the mind tires before the muscles.",
    "5 minutes de cohérence cardiaque avant la séance (Retour au calme) ; un jour très stressant, préfère une séance modérée.", "5 minutes of paced breathing before training (Cool-down); on a very stressful day, pick a moderate session.", -1],
  courbatures: ["Courbatures", "Soreness", "tu avais des courbatures", "you were sore",
    "Les courbatures viennent de petites lésions des fibres musculaires en train de se réparer. Ces fibres produisent moins de force pendant 2 à 4 jours : chaque répétition demande donc plus d’effort.",
    "Soreness comes from small tears in muscle fibres that are being repaired. Those fibres produce less force for 2 to 4 days, so every rep takes more effort.",
    "Mobilité douce, marche et hydratation ; travaille d’autres muscles ou baisse l’intensité tant qu’elles sont fortes.", "Gentle mobility, walking and fluids; train other muscles or lower the intensity while they are strong.", -1],
  douleur: ["Douleur", "Pain", "tu avais une douleur ou une gêne", "you had pain or discomfort",
    "Une douleur change la façon de bouger : le corps compense avec d’autres muscles, moins efficaces pour ce geste. Le mouvement coûte plus d’énergie, et le cerveau freine pour protéger la zone.",
    "Pain changes the way you move: the body compensates with other muscles that are less efficient for that movement. It costs more energy, and the brain holds back to protect the area.",
    "Laisse la zone au repos ; si la douleur est vive, gonfle ou dure plus de quelques jours, montre-la à un médecin.", "Rest the area; if the pain is sharp, swollen or lasts more than a few days, see a doctor.", -1],
  charge: ["Semaine chargée", "Heavy week", "ta semaine était bien plus chargée que d’habitude", "your week was much heavier than usual",
    "Quand la charge des 7 derniers jours dépasse nettement celle des 4 semaines précédentes, la fatigue s’accumule plus vite qu’elle ne se résorbe. L’effort ressenti monte avant que la performance baisse : c’est un signal d’alerte précoce, et le risque de blessure augmente.",
    "When the last 7 days’ load clearly exceeds the previous 4 weeks, fatigue builds faster than it clears. Perceived effort rises before performance drops: it is an early warning sign, and injury risk goes up.",
    "Allège 2 à 3 jours, ou choisis « Alléger la semaine prochaine » dans ton bilan du dimanche.", "Ease off for 2 to 3 days, or choose “Lighten next week” in your Sunday review.", -1],
  veille: ["Grosse séance la veille", "Big session the day before", "tu avais fait une séance ou un club dur la veille", "you had a hard session or club day the day before",
    "Après un effort intense, il faut 24 à 48 h pour reconstituer les réserves d’énergie et laisser le système nerveux récupérer. Enchaîner deux jours durs, c’est repartir avec un réservoir à moitié plein.",
    "After a hard effort, it takes 24 to 48 h to refill energy stores and let the nervous system recover. Two hard days in a row means starting with a half-empty tank.",
    "Garde 48 h entre deux séances dures : Ma semaine les place pour toi.", "Keep 48 h between two hard sessions: My week places them for you.", -1],
  affilee: ["Pas de jour de repos", "No rest day", "tu t’entraînais plusieurs jours d’affilée", "you had trained several days in a row",
    "On progresse pendant la récupération, pas pendant l’effort : c’est là que le corps répare et renforce les tissus. Sans jour de repos, la fatigue s’empile et l’adaptation ne se fait pas.",
    "You improve during recovery, not during the effort: that is when the body repairs and strengthens tissue. Without a rest day, fatigue stacks up and adaptation doesn’t happen.",
    "Place au moins un vrai jour de repos tous les 3 à 4 jours d’entraînement.", "Plan at least one real rest day every 3 to 4 training days.", -1],
  matin: ["Séance très tôt", "Very early session", "la séance était très tôt le matin", "the session was very early",
    "Le matin, la température du corps et l’éveil du système nerveux sont au plus bas : muscles et tendons sont moins souples, la coordination moins fine. Le même effort paraît plus dur tant que le corps n’est pas réveillé.",
    "In the morning, body temperature and nervous-system arousal are at their lowest: muscles and tendons are stiffer, coordination less sharp. The same effort feels harder until the body has woken up.",
    "Allonge l’échauffement de 5 à 10 minutes et garde les efforts maximaux pour plus tard dans la journée.", "Warm up 5 to 10 minutes longer and keep all-out efforts for later in the day.", -1],
  soir: ["Séance tardive", "Late session", "la séance était tard le soir", "the session was late in the evening",
    "Le soir, la fatigue de la journée (cours, travail, stress) s’ajoute à celle de la séance. Et un effort intense tard réveille le système nerveux, ce qui peut retarder l’endormissement.",
    "In the evening, the day’s fatigue (school, work, stress) adds to the session’s. And a hard effort late wakes the nervous system up, which can delay falling asleep.",
    "Si possible, avance la séance ; sinon garde un effort modéré et finis par 5 min de respiration lente.", "If you can, train earlier; otherwise keep the effort moderate and finish with 5 min of slow breathing.", -1],
  reprise: ["Reprise après une pause", "Back after a break", "tu reprenais après une pause", "you were back after a break",
    "Après 10 jours ou plus sans entraînement, une partie des adaptations diminue, surtout le cardio : le cœur et les muscles utilisent l’oxygène un peu moins bien. Il faut quelques séances pour retrouver ses repères.",
    "After 10 days or more without training, some adaptations fade, especially cardio: heart and muscles use oxygen a little less well. It takes a few sessions to get back on track.",
    "Fais 2 ou 3 séances à effort réduit avant de reprendre ton niveau habituel.", "Do 2 or 3 sessions at reduced effort before going back to your usual level.", -1],
  decouverte: ["Séance nouvelle", "New session", "c’était la première fois que tu faisais cette séance", "it was your first time doing this session",
    "La première fois, le cerveau apprend les mouvements : il active plus de muscles que nécessaire et la coordination coûte de l’énergie. Dès la 2e ou 3e fois, le geste devient économique et l’effort ressenti baisse.",
    "The first time, the brain is learning the movements: it switches on more muscles than needed and coordination costs energy. By the 2nd or 3rd time, the movement becomes economical and perceived effort drops.",
    "Refais-la dans la semaine : tu verras la différence.", "Do it again this week: you will feel the difference.", -1],
  forme: ["Bonne forme", "Good shape", "ta batterie était haute", "your battery was high",
    "Bien reposé, avec des réserves d’énergie pleines et un système nerveux frais, le corps produit plus de force pour le même signal du cerveau : l’effort paraît plus facile.",
    "Well rested, with full energy stores and a fresh nervous system, the body produces more force for the same signal from the brain: the effort feels easier.",
    "Profite de ces jours pour tes séances les plus dures ou un test.", "Use those days for your hardest sessions or a test.", 1],
  adaptation: ["Ton corps s’adapte", "Your body is adapting", "tu as progressé", "you have progressed",
    "À force de répéter un effort, le cœur pompe plus de sang à chaque battement, les muscles se renforcent et le geste devient plus économique : le même travail coûte moins. C’est la progression, et pour continuer il faut augmenter un peu la difficulté (surcharge progressive).",
    "By repeating an effort, the heart pumps more blood per beat, muscles get stronger and the movement becomes more economical: the same work costs less. That is progress, and to keep going you need to raise the difficulty a little (progressive overload).",
    "Si c’est le cas 2 ou 3 fois de suite, monte d’un niveau ou ajoute un tour.", "If it happens 2 or 3 times in a row, move up a level or add a round.", 1]
};
// ordre d'importance quand plusieurs causes jouent : d'abord la fatigue accumulée et la douleur, puis le sommeil, puis le contexte
const ORDRE_F = ["douleur", "veille", "charge", "sommeil", "courbatures", "affilee", "stress", "energie", "qualite", "reprise", "decouverte", "matin", "soir"];
const nomF = k => L(FACTEURS[k][0], FACTEURS[k][1]), ceQuiF = k => L(FACTEURS[k][2], FACTEURS[k][3]), pourquoiF = k => L(FACTEURS[k][4], FACTEURS[k][5]), conseilF = k => L(FACTEURS[k][6], FACTEURS[k][7]);
// effort visé d'une séance : moyenne de la fourchette « 6–7 », sinon une valeur par type de séance
const cibleEffort = (r = routine, m = mode) => { const n = String(r && r.rpe || "").match(/\d+(?:[.,]\d+)?/g); return n ? Math.round(n.map(x => +x.replace(",", ".")).reduce((a, b) => a + b, 0) / n.length * 2) / 2 : ({ tabata: 8, salle: 7, seance: 6, echauffement: 4, souffle: 2 }[m] || 6); };
const etiqJour = j => new Date(j + "T12:00").toLocaleDateString(L("fr-FR", "en-GB"), { weekday: "long", day: "numeric", month: "short" });

// état d'un jour : facteurs qui rendent l'effort plus dur (ou plus facile), avec la batterie de ce jour-là
function etatDu(j, h = lireHist(), hr) {
  // batterie au moment de la séance si l'heure est connue (elle se vide dans la journée), sinon celle du réveil
  const F = lireForme(), B = F[j] ? (hr !== undefined ? batterieA(j, hr * 60 + 30, F, h) : batterie(j, F, h)) : null, r = B && B.r, veille = decaler(j, -1), l = [];
  if (r) { if (r.h < 7) l.push("sommeil"); if (r.q <= 2) l.push("qualite"); if (r.e <= 2) l.push("energie"); if (r.st >= 4) l.push("stress"); if (r.c >= 4) l.push("courbatures"); if (r.dl) l.push("douleur"); }
  const ra = ratioCharge(veille, h); if (ra && ra > 1.3) l.push("charge");
  if (h.some(x => x.j === veille && (x.ef >= 8 || x.rs === 3 || chargeX(x) >= 80)) || clubsDu(veille).some(c => c.dur)) l.push("veille");
  let n = 0; for (let k = 1; k <= 6; k++) { const d = decaler(j, -k); if (h.some(x => x.j === d) || clubsDu(d).length) n++; else break; }
  if (n >= habitudeClub().seuilAffilee) l.push("affilee");   // seuil selon le nombre d'entraînements habituels en club
  return { l, B, ra };
}
// aperçu d'une séance de l'historique (x) : { sens, phrase, facteurs, conseils }
function apercuSeance(x, h = lireHist()) {
  if (x.ef === undefined) return null;
  const i = h.indexOf(x), ec = x.ec || 6, ecart = x.ef - ec, avant = i < 0 ? h.filter(y => y.j < x.j) : h.slice(0, i), E = etatDu(x.j, h.filter(y => y !== x), x.hr), f = [...E.l];
  if (x.hr !== undefined && x.hr < 8) f.push("matin"); else if (x.hr >= 21) f.push("soir");
  const der = avant.filter(y => y.j < x.j).map(y => y.j).sort().pop(); if (der && (new Date(x.j) - new Date(der)) / 864e5 >= 10) f.push("reprise");
  if (x.k && !avant.some(y => y.k === x.k && y.t === x.t)) f.push("decouverte");
  const sens = ecart >= 1.5 ? "dur" : ecart <= -1.5 ? "facile" : "ok", bat = E.B ? ` ${L("Batterie", "Battery")} ${E.B.v} %.` : "";
  const intro = L(`Ressenti ${x.ef}/10 pour un effort visé de ${ec}/10`, `Felt ${x.ef}/10 for a target effort of ${ec}/10`);
  let facteurs = [], phrase;
  if (sens === "dur") {
    const tri = [...f].sort((a, b) => ORDRE_F.indexOf(a) - ORDRE_F.indexOf(b)), reste = tri.length - 4; facteurs = tri.slice(0, 4);
    phrase = `${intro} : ${L("nettement plus dur que prévu.", "much harder than planned.")}${bat} ` + (facteurs.length ? L("Raisons les plus probables : ", "Most likely reasons: ") + facteurs.map(ceQuiF).join(", ") + (reste > 0 ? L(` (et ${reste} autre${reste > 1 ? "s" : ""} cause${reste > 1 ? "s" : ""})`, ` (and ${reste} more)`) : "") + "." : L("Aucune cause évidente dans tes données : pense à l’alimentation, à l’hydratation, à la chaleur ou à un début de maladie. Remplis ta batterie le matin pour qu’on comprenne mieux.", "No obvious cause in your data: think about food, fluids, heat or the start of an illness. Fill in your battery in the morning so we can understand better."));
  } else if (sens === "facile") {
    facteurs = [...(E.B && E.B.v >= 75 ? ["forme"] : []), "adaptation"];
    phrase = `${intro} : ${L("tu avais de la marge.", "you had room to spare.")}${bat} ` + (E.B && E.B.v >= 75 ? L("Ta bonne forme du jour y est pour beaucoup, et ton corps s’est sans doute adapté.", "Your good shape today played a big part, and your body has probably adapted.") : L("Ton corps s’est sans doute adapté à cette séance.", "Your body has probably adapted to this session."));
  } else phrase = `${intro} : ${L("séance bien dosée, ressenti conforme.", "well-judged session, effort as expected.")}${bat}` + (f.length ? " " + L("Même si ", "Even though ") + f.slice(0, 2).map(ceQuiF).join(L(" et ", " and ")) + L(" : bien géré.", ": well handled.") : "");
  return { x, sens, phrase, facteurs, conseils: facteurs.slice(0, 3).map(conseilF), ecart };
}
// aperçus des performances mesurées (tests, charges en salle) des 30 derniers jours : baisse de plus de 5 % ou record, expliqués par l'état du jour
function apercusPerf(h = lireHist()) {
  const lim = decaler(jourCle(), -30), out = [], vus = new Set();
  const lire = (l, cle, val, nom, unite) => [...l].reverse().forEach(e => {
    if (e.j < lim || vus.has(cle(e))) return; vus.add(cle(e));
    const avant = l.filter(y => cle(y) === cle(e) && y.j < e.j).map(val); if (!avant.length) return;
    // chrono : un temps plus court est un progrès, l'écart est donc inversé
    const k = TEST_COURT.includes(cle(e)) ? -1 : 1, best = k > 0 ? Math.max(...avant) : Math.min(...avant), v = val(e), d = best ? k * (v / best - 1) * 100 : 0; if (d > -5 && k * v <= k * best) return;
    const E = etatDu(e.j, h), rec = k * v > k * best, fac = rec ? (E.B && E.B.v >= 75 ? ["forme"] : []) : E.l.slice(0, 3);
    out.push({ j: e.j, perf: 1, titre: `${nom(e)} · ${v} ${unite(e)}${rec ? " 🏆" : ""}`, sens: rec ? "facile" : "dur", facteurs: fac, conseils: fac.map(conseilF).slice(0, 2),
      phrase: rec ? L(`🏆 Record : ${nom(e)} ${v} ${unite(e)} (avant ${best}).`, `🏆 Record: ${nom(e)} ${v} ${unite(e)} (before ${best}).`) + (E.B ? " " + L(`Batterie ${E.B.v} % ce jour-là`, `Battery ${E.B.v}% that day`) + (E.B.v >= 75 ? L(" : le repos paie.", ": rest pays off.") : ".") : "")
        : L(`${nom(e)} : ${v} ${unite(e)}, sous ton meilleur résultat (${best}, ${Math.round(d)} %).`, `${nom(e)}: ${v} ${unite(e)}, below your best (${best}, ${Math.round(d)}%).`) + (fac.length ? " " + L("Ce jour-là, ", "That day, ") + fac.map(ceQuiF).join(", ") + L(" : la fatigue masque ta vraie capacité, ce n’est pas une perte de niveau.", ": fatigue hides your real ability, it is not a loss of level.") : "") });
  });
  const testDe = id => [...TESTS, ...(typeof TESTS_AT !== "undefined" ? TESTS_AT : [])].find(t => t[0] === id);
  lire(lireTests(), e => e.id, e => +e.v, e => testDe(e.id) ? L(testDe(e.id)[1], testDe(e.id)[2]) : e.id, e => testDe(e.id) ? L(testDe(e.id)[3], testDe(e.id)[4]) : "");
  lire(lireCharges(), e => e.id, e => rm1(e.kg, e.r), e => (EXERCICES[e.id] || {}).nom || e.id, () => L("kg (force max estimée)", "kg (estimated max)"));
  return out;
}

/* --- Affichage --- */
const apercuHtml = (A, court) => !A ? "" : `<div class="apercu ap-${A.sens}"><b>${A.sens === "dur" ? "🔍 " + L("Pourquoi c’était plus dur ?", "Why was it harder?") : A.sens === "facile" ? "🚀 " + L("Pourquoi c’était plus facile ?", "Why was it easier?") : "✅ " + L("Séance bien dosée", "Well-judged session")}</b>
  <p>${A.phrase}</p>${A.conseils.length ? `<ul>${A.conseils.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
  ${A.facteurs.length ? `<details><summary>${L("Pourquoi ? L’explication", "Why? The explanation")}</summary>${A.facteurs.map(k => `<p><b>${nomF(k)}</b> · ${pourquoiF(k)}</p>`).join("")}</details>` : ""}
  ${court ? "" : `<button class="lien" data-comprendre>📚 ${L("Comprendre ton corps : toutes les explications", "Understand your body: all explanations")}</button>`}</div>`;
const brancherApercu = Z => Z.querySelectorAll("[data-comprendre]").forEach(b => b.onclick = ouvrirComprendre);
function ouvrirComprendre() {
  ouvrirFeuilleInfo(L("Comprendre ton corps", "Understand your body"), `<p class="sh-aide">${L("Ce qui change ton ressenti et tes performances d’un jour à l’autre, et quoi faire. Explications simplifiées, qui ne remplacent pas l’avis d’un professionnel de santé.", "What changes how an effort feels and how you perform from one day to the next, and what to do. Simplified explanations, not a substitute for a health professional’s advice.")}</p>
    ${Object.keys(FACTEURS).map(k => `<details class="comprendre"><summary>${nomF(k)}</summary><p>${pourquoiF(k)}</p><p>👉 ${conseilF(k)}</p></details>`).join("")}`);
}
// rubrique « Aperçus » de Mes progrès : tendance des 14 derniers jours, derniers aperçus (séances notées et performances)
function blocApercus() {
  const h = lireHist(), lim = decaler(jourCle(), -14), notes = h.filter(x => x.ef !== undefined), rec = notes.filter(x => x.j >= lim).map(x => apercuSeance(x, h));
  const items = [...notes.slice(-8).map(x => apercuSeance(x, h)), ...apercusPerf(h)].filter(Boolean).sort((a, b) => (b.j || b.x.j).localeCompare(a.j || a.x.j)).slice(0, 8);
  APERCUS_VUS = items;
  if (!items.length) return `<h2 class="sec">🔍 ${L("Aperçus", "Insights")}</h2><div class="carte"><p class="vide">${L("Note ton effort sur 10 à la fin de tes séances : l’appli t’expliquera pourquoi une séance a paru plus dure ou plus facile, selon ton état du jour.", "Rate your effort out of 10 at the end of your workouts: the app will explain why a session felt harder or easier, based on how you were that day.")}</p><button class="lien" data-comprendre>📚 ${L("Comprendre ton corps", "Understand your body")}</button></div>`;
  const nD = rec.filter(A => A.sens === "dur").length, nF = rec.filter(A => A.sens === "facile").length, freq = {};
  rec.forEach(A => A.sens === "dur" && A.facteurs.forEach(k => freq[k] = (freq[k] || 0) + 1));
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return `<h2 class="sec">🔍 ${L("Aperçus", "Insights")}</h2><div class="carte apercus">
    ${rec.length ? `<p class="ap-tend">${L("14 derniers jours", "Last 14 days")} : ${L(`<b>${nD}</b> séance(s) plus dure(s) que prévu, <b>${nF}</b> plus facile(s), <b>${rec.length - nD - nF}</b> conforme(s).`, `<b>${nD}</b> harder than planned, <b>${nF}</b> easier, <b>${rec.length - nD - nF}</b> as planned.`)}${nF >= 2 && nF > nD ? " " + L("Souvent trop facile : pense à monter d’un niveau.", "Often too easy: think about moving up a level.") : ""}${top ? " " + L(`Cause la plus fréquente : <b>${nomF(top[0]).toLowerCase()}</b> (${top[1]} fois). ${conseilF(top[0])}`, `Most frequent cause: <b>${nomF(top[0]).toLowerCase()}</b> (${top[1]} ${top[1] > 1 ? "times" : "time"}). ${conseilF(top[0])}`) : ""}</p>` : ""}
    <ul class="ap-liste">${items.map((A, i) => `<li><button class="ap-ligne ap-${A.sens}" data-ap="${i}"><small>${etiqJour(A.j || A.x.j)}${A.x ? " · " + echap(A.x.t || "") : ""}</small><span>${A.x ? `${A.x.ef}/10 · ${L("visé", "target")} ${A.x.ec || 6}/10` : A.titre}</span><i aria-hidden="true">›</i></button></li>`).join("")}</ul>
    <button class="lien" data-comprendre>📚 ${L("Comprendre ton corps : toutes les explications", "Understand your body: all explanations")}</button></div>`;
}
let APERCUS_VUS = [];
function brancherApercus() {
  const Z = $("prCorps"); if (!Z) return; brancherApercu(Z);
  Z.querySelectorAll("[data-ap]").forEach(b => b.onclick = () => { const A = APERCUS_VUS[+b.dataset.ap]; ouvrirFeuilleInfo(etiqJour(A.j || A.x.j) + (A.x ? " · " + (A.x.t || "") : ""), apercuHtml(A)); brancherApercu($("feuille")); });
}
