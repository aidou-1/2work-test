/* ============ FORME DU JOUR : questionnaire du matin, batterie, conseil d'effort, statistiques expliquées ============
   Le questionnaire (facultatif) note la nuit et l'état du corps ; on en tire une « batterie » de 0 à 100 % et un conseil d'effort.
   Données de santé : elles restent sur le téléphone (clé « forme »), sont gardées un an, vont dans le fichier de sauvegarde
   mais jamais dans la sauvegarde en ligne (js/clubs.js). Format : { "AAAA-MM-JJ": { h: heures, q, e, c, st } }, notes de 1 à 5. */
const lireForme = () => lireJSON("forme", {});
function stockerForme(F) {
  const lim = decaler(jourCle(), -365);   // conservation limitée à un an
  stocker("forme", JSON.stringify(Object.fromEntries(Object.entries(F).filter(([j]) => j >= lim))));
}
// questions : [clé, titre FR, EN, [emoji et libellé de 1 à 5]] ; « inv » : une note haute est mauvaise (courbatures, stress)
const QF = [["q", "Qualité du sommeil", "Sleep quality", ["😫", "😕", "😐", "🙂", "😴"], ["Très mauvaise", "Very poor"], ["Excellente", "Excellent"]],
  ["e", "Énergie", "Energy", ["🪫", "😩", "😐", "🙂", "⚡"], ["À plat", "Drained"], ["Au top", "Full of it"]],
  ["c", "Courbatures", "Soreness", ["✨", "🙂", "😐", "😣", "🥵"], ["Aucune", "None"], ["Fortes", "Strong"], 1],
  ["st", "Stress", "Stress", ["😌", "🙂", "😐", "😟", "🤯"], ["Zen", "Calm"], ["Très stressé", "Very stressed"], 1]];
const borne01 = v => Math.max(0, Math.min(1, v));
const chargeX = x => Math.round(x.s / 60 * ({ tabata: 3, seance: 2, salle: 2 }[x.m] || 1));   // minutes × intensité, comme la charge de Mes progrès
const chargeEntre = (h, de, a) => h.filter(x => x.j >= de && x.j <= a).reduce((t, x) => t + chargeX(x), 0);
// charge des 7 derniers jours rapportée à la moyenne hebdomadaire des 28 derniers jours (null sans 4 semaines d'historique : sinon la moyenne serait sous-estimée)
function ratioCharge(j = jourCle(), h = lireHist()) {
  const aigue = chargeEntre(h, decaler(j, -6), j), chro = chargeEntre(h, decaler(j, -27), j) / 4;
  return h.some(x => x.j <= decaler(j, -27)) && chro >= 20 ? aigue / chro : null;
}
/* Batterie (0-100) : sommeil 30 %, qualité 15 %, énergie 25 %, courbatures 15 %, stress 15 %, moins la fatigue des séances
   (semaine bien au-dessus de l'habitude, séance très dure la veille). Renvoie { v, parts } ou null sans réponse ce jour-là. */
function batterie(j = jourCle(), F = lireForme(), h = lireHist()) {
  const r = F[j]; if (!r) return null;
  const note = (k, inv) => (inv ? 5 - r[k] : r[k] - 1) / 4, parts = [[L("Sommeil", "Sleep"), borne01((r.h - 4) / 4) * 30, 30], [L("Qualité", "Quality"), note("q") * 15, 15], [L("Énergie", "Energy"), note("e") * 25, 25], [L("Courbatures", "Soreness"), note("c", 1) * 15, 15], [L("Stress", "Stress"), note("st", 1) * 15, 15]];
  const ra = ratioCharge(decaler(j, -1), h), veille = h.filter(x => x.j === decaler(j, -1)), dure = veille.some(x => x.ef >= 8 || x.rs === 3 || chargeX(x) >= 80);
  const malus = (ra && ra > 1.3 ? Math.min(15, (ra - 1.3) * 30) : 0) + (dure ? 5 : 0);
  if (malus) parts.push([L("Fatigue des séances", "Training fatigue"), -malus, 0]);
  return { v: Math.round(Math.max(0, Math.min(100, parts.reduce((t, p) => t + p[1], 0)))), parts, r };
}
// conseil d'effort : [seuil, emoji, titre FR, EN, détail FR, EN, couleur]
const PALIERS = [[75, "🟢", "Feu vert", "Green light", "Séance intense possible : effort 7 à 9 sur 10.", "Hard session on: effort 7 to 9 out of 10.", "#16A34A"],
  [55, "🟡", "Séance normale", "Normal session", "Effort modéré à soutenu : 5 à 7 sur 10.", "Moderate to steady effort: 5 to 7 out of 10.", "#CA8A04"],
  [35, "🟠", "Séance légère", "Light session", "Technique ou mobilité, effort 3 à 5 sur 10. Écourte si ça ne passe pas.", "Technique or mobility, effort 3 to 5 out of 10. Cut it short if it feels wrong.", "#EA580C"],
  [0, "🔴", "Récupération", "Recovery", "Étirements, cohérence cardiaque ou marche : ton corps reconstruit.", "Stretching, breathing or a walk: your body is rebuilding.", "#DC2626"]];
const palier = v => PALIERS.find(p => v >= p[0]);
function conseilsForme(B) {
  const r = B.r, l = [];
  if (r.h < 6) l.push(L("Nuit courte : pas de record ni de sprint maximal aujourd’hui, le risque de blessure monte.", "Short night: no records or all-out sprints today, injury risk goes up."));
  if (r.c >= 4) l.push(L("Fortes courbatures : travaille d’autres muscles ou bouge en douceur.", "Strong soreness: train other muscles or move gently."));
  if (r.st >= 4) l.push(L("Stress élevé : une séance modérée aide, une séance épuisante en rajoute.", "High stress: a moderate session helps, an exhausting one adds to it."));
  if (B.parts.some(p => p[1] < 0)) l.push(L("Tes dernières séances pèsent encore : la batterie en tient compte.", "Your recent sessions still weigh on you: the battery accounts for it."));
  return l;
}
const icoBatterie = v => `<span class="batt" style="--v:${v}%;--bc:${palier(v)[6]}" aria-hidden="true"><i></i></span>`;

/* --- Carte de l'accueil --- */
function majForme() {
  const Z = $("formeCarte"); if (!Z) return;
  const B = batterie();
  if (!B) Z.innerHTML = `<button class="sc-corps" id="fmOuvrir" style="--c:var(--brand)"><span class="sc-ico">🔋</span><span><strong>${L("Ta batterie du jour", "Today’s battery")}</strong><small>${L("5 questions, 20 secondes : sommeil, énergie, courbatures, stress", "5 questions, 20 seconds: sleep, energy, soreness, stress")}</small></span></button><button class="sc-go" id="fmGo" style="background:var(--brand)" aria-label="${L("Remplir le questionnaire", "Fill in the check-in")}">→</button>`;
  else { const P = palier(B.v); Z.innerHTML = `<button class="sc-corps" id="fmOuvrir" style="--c:${P[6]}">${icoBatterie(B.v)}<span><strong>${B.v} % · ${L(P[2], P[3])}</strong><small>${L(P[4], P[5])}</small></span></button>`; }
  $("fmOuvrir").onclick = () => B ? detailForme() : questionnaire();
  if ($("fmGo")) $("fmGo").onclick = () => questionnaire();
}
function detailForme() {
  const B = batterie(), P = palier(B.v), c = conseilsForme(B);
  ouvrirFeuilleInfo(L("Ta batterie du jour", "Today’s battery"), `<div class="batt-grand">${icoBatterie(B.v)}<b>${B.v} %</b></div><p><b>${P[1]} ${L(P[2], P[3])}</b> · ${L(P[4], P[5])}</p>
    ${c.length ? `<ul class="prog-obj">${c.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
    <h3>${L("D’où vient ce chiffre", "Where this number comes from")}</h3><ul class="carnet ef-liste">${B.parts.map(([n, v, m]) => `<li><span>${n}</span><b>${m ? Math.round(v) + " / " + m : Math.round(v)}</b></li>`).join("")}</ul>
    <p class="sh-aide">${L("Un repère, pas un diagnostic : si tu te sens mal, écoute ton corps avant le chiffre.", "A guide, not a diagnosis: if you feel unwell, listen to your body before the number.")}</p>
    <button class="toggle" id="fmModif">${L("Modifier mes réponses", "Edit my answers")}</button>`);
  $("fmModif").onclick = () => questionnaire();
}
function questionnaire() {
  const F = lireForme(), auj = jourCle(), r = { h: 7.5, q: 3, e: 3, c: 2, st: 2, ...(F[auj] || F[decaler(auj, -1)] || {}) };   // on part des réponses de la veille : souvent proches
  const ligne = ([k, fr, en, em, [bf, be], [hf, he]]) => `<div class="fm-q"><b>${L(fr, en)}</b><div class="fm-notes" role="radiogroup" aria-label="${L(fr, en)}">${em.map((e, i) => `<button class="toggle" role="radio" data-k="${k}" data-v="${i + 1}" aria-pressed="${r[k] === i + 1}" aria-checked="${r[k] === i + 1}" aria-label="${i + 1} / 5">${e}</button>`).join("")}</div><small><span>${L(bf, be)}</span><span>${L(hf, he)}</span></small></div>`;
  ouvrirFeuilleInfo(L("Comment tu te sens ?", "How do you feel?"), `<p class="sh-aide">${L("Réponds au réveil, c’est le plus fiable. Tes réponses restent sur ce téléphone.", "Answer when you wake up, it’s the most reliable. Your answers stay on this phone.")}</p>
    <div class="fm-q"><b>${L("Heures de sommeil", "Hours of sleep")}</b><div class="stepper"><button id="fmMoins" aria-label="${L("Une demi-heure de moins", "Half an hour less")}">−</button><output id="fmH"></output><button id="fmPlus" aria-label="${L("Une demi-heure de plus", "Half an hour more")}">+</button></div></div>
    ${QF.map(ligne).join("")}<button class="primary" id="fmOk">${L("Voir ma batterie", "See my battery")}</button>`);
  const majH = () => $("fmH").textContent = Math.floor(r.h) + " h" + (r.h % 1 ? " 30" : "");
  majH(); $("fmMoins").onclick = () => { r.h = Math.max(2, r.h - .5); majH(); }; $("fmPlus").onclick = () => { r.h = Math.min(13, r.h + .5); majH(); };
  document.querySelectorAll(".fm-notes [data-k]").forEach(b => b.onclick = () => { r[b.dataset.k] = +b.dataset.v; b.parentNode.querySelectorAll("button").forEach(x => { const on = x === b; x.setAttribute("aria-pressed", on); x.setAttribute("aria-checked", on); }); });
  $("fmOk").onclick = () => { F[auj] = { h: r.h, q: r.q, e: r.e, c: r.c, st: r.st }; stockerForme(F); majForme(); if (ecranCourant === "progres") ouvrirProgres(); detailForme(); };
}

/* --- Statistiques de Mes progrès : chaque carte explique le phénomène qu'elle montre --- */
const virgule = v => v.toFixed(1).replace(".", L(",", "."));
const moyenne = l => l.length ? l.reduce((a, b) => a + b, 0) / l.length : null;
const effortX = x => x.ef ?? (x.rs ? x.rs * 3 : null);   // effort ressenti sur 10 (cardio), sinon le ressenti de fin de séance (1-3) ramené sur 10
const carteStat = (titre, corps, pourquoi) => `<div class="carte stat-forme"><h2>${titre}</h2>${corps}<p class="sh-aide"><b>${L("Pourquoi ?", "Why?")}</b> ${pourquoi}</p></div>`;
function blocsForme() {
  const h = lireHist(), F = lireForme(), auj = jourCle(), out = [];
  // 1. batterie et sommeil des 14 derniers jours
  const js = Array.from({ length: 14 }, (_, k) => decaler(auj, k - 13)), pts = js.map((j, k) => [k, batterie(j, F, h), F[j]]).filter(p => p[2]);
  if (pts.length) {
    const X = k => 14 + k * 20.5, svg = `<svg class="courbe fm-courbe" viewBox="0 0 300 110" role="img" aria-label="${L("Sommeil et batterie des 14 derniers jours", "Sleep and battery over the last 14 days")}">
      ${pts.map(([k, , r]) => `<rect x="${X(k) - 6}" y="${100 - Math.min(r.h, 12) * 8}" width="12" height="${Math.min(r.h, 12) * 8}" rx="3"><title>${dateCourte(js[k])} · ${r.h} h</title></rect>`).join("")}
      <polyline points="${pts.map(([k, B]) => X(k) + "," + (100 - B.v * .95)).join(" ")}"/>${pts.map(([k, B]) => `<circle cx="${X(k)}" cy="${100 - B.v * .95}" r="3.5"><title>${dateCourte(js[k])} · ${B.v} %</title></circle>`).join("")}</svg>`;
    const hm = moyenne(pts.map(p => p[2].h));
    out.push(carteStat(L("Sommeil et batterie · 14 jours", "Sleep and battery · 14 days"), svg + `<p class="fm-legende"><i class="fm-l-barre"></i>${L("heures de sommeil", "hours of sleep")} (${L("moyenne", "average")} ${virgule(hm)} h) <i class="fm-l-ligne"></i>${L("batterie", "battery")}</p>`,
      L("Le sommeil est le moment où les muscles se réparent et où l’énergie se recharge. Sous 7 h par nuit plusieurs jours de suite, la récupération ralentit et les séances paraissent plus dures.", "Sleep is when muscles repair and energy refills. Under 7 h a night for several days, recovery slows and workouts feel harder.")));
  } else out.push(carteStat(L("Sommeil et batterie", "Sleep and battery"), `<p>${L("Remplis le questionnaire du matin (carte 🔋 de l’accueil) pour voir ta courbe ici.", "Fill in the morning check-in (🔋 card on the home screen) to see your curve here.")}</p><button class="toggle" id="fmStatGo">${L("Remplir maintenant", "Fill it in now")}</button>`, L("Suivre son sommeil et son état chaque matin permet de repérer la fatigue avant qu’elle ne devienne une blessure.", "Tracking sleep and how you feel each morning spots fatigue before it turns into an injury.")));
  // 2. charge aiguë / chronique
  const ra = ratioCharge(auj, h);
  if (ra !== null) {
    const z = ra < .8 ? [L("En baisse", "Dropping"), L("Tu t’entraînes moins que d’habitude : la forme se perd doucement après 2 à 3 semaines.", "You’re training less than usual: fitness slowly fades after 2 to 3 weeks."), "#94A3B8"]
      : ra <= 1.3 ? [L("Zone idéale", "Sweet spot"), L("Ta charge reste dans ce que ton corps encaisse : continue sur ce rythme.", "Your load stays within what your body can handle: keep this pace."), "#16A34A"]
      : ra <= 1.5 ? [L("Attention", "Careful"), L("Semaine plus chargée que d’habitude : garde un jour de récupération.", "Heavier week than usual: keep a recovery day."), "#CA8A04"]
      : [L("Surcharge", "Overload"), L("Beaucoup plus que d’habitude : c’est la situation où les blessures arrivent le plus. Lève le pied quelques jours.", "Far more than usual: this is when injuries happen most. Ease off for a few days."), "#DC2626"];
    out.push(carteStat(L("Charge de la semaine / habitude", "This week’s load / usual"), `<div class="fm-jauge" style="--p:${Math.min(100, ra / 2 * 100)}%;--zc:${z[2]}"><i></i><span style="left:40%">0,8</span><span style="left:65%">1,3</span><span style="left:75%">1,5</span></div><p><b style="color:${z[2]}">${ra.toFixed(2).replace(".", L(",", "."))} · ${z[0]}</b> — ${z[1]}</p>`,
      L("On compare la charge des 7 derniers jours (minutes × intensité) à ta moyenne des 4 dernières semaines. Le corps s’adapte à ce qu’il connaît : ce sont les hausses brutales, plus que la charge elle-même, qui fatiguent et blessent.", "We compare the last 7 days’ load (minutes × intensity) with your 4-week average. Your body adapts to what it knows: sudden jumps, more than the load itself, are what tire and injure.")));
  }
  // 3. sommeil et ressenti en séance
  const paires = h.filter(x => F[x.j] && effortX(x) != null).map(x => [F[x.j].h, effortX(x)]), court = paires.filter(p => p[0] < 7).map(p => p[1]), bon = paires.filter(p => p[0] >= 7).map(p => p[1]);
  out.push(carteStat(L("Sommeil et effort ressenti", "Sleep and perceived effort"), court.length >= 3 && bon.length >= 3
    ? (d => `<div class="fm-duo"><div><b>${virgule(moyenne(court))}</b><small>${L("après une nuit de moins de 7 h", "after a night under 7 h")}</small></div><div><b>${virgule(moyenne(bon))}</b><small>${L("après 7 h ou plus", "after 7 h or more")}</small></div></div><p>${Math.abs(d) < .5 ? L("Ton sommeil change peu ton ressenti pour l’instant.", "Sleep barely changes how hard workouts feel for you so far.") : d > 0 ? L(`Après une nuit courte, tes séances te paraissent ${virgule(d)} point${d >= 2 ? "s" : ""} plus dures sur 10.`, `After a short night, your workouts feel ${d.toFixed(1)} point${d >= 2 ? "s" : ""} harder out of 10.`) : L("Étonnant : tes nuits courtes ne rendent pas tes séances plus dures. Regarde si ces jours-là tu choisis des séances plus faciles.", "Surprising: short nights don’t make your workouts feel harder. Check whether you pick easier sessions on those days.")}</p>`)(moyenne(court) - moyenne(bon))
    : `<p>${L(`Il faut au moins 3 séances notées après une nuit courte et 3 après une bonne nuit (pour l’instant : ${court.length} et ${bon.length}). Remplis le questionnaire le matin et note ton ressenti en fin de séance.`, `You need at least 3 rated workouts after a short night and 3 after a good one (so far: ${court.length} and ${bon.length}). Fill in the morning check-in and rate how it felt at the end of each workout.`)}</p>`,
    L("Le manque de sommeil augmente l’effort perçu pour un même travail : le cœur, les muscles et la motivation tournent moins bien. C’est souvent l’explication d’une « mauvaise séance ».", "Lack of sleep raises perceived effort for the same work: heart, muscles and motivation run less well. It often explains a “bad session”.")));
  // 4. muscles travaillés : 4 dernières semaines contre les 4 d'avant
  const comptes = (de, a) => { const o = {}; h.filter(x => x.j >= de && x.j <= a).forEach(x => (x.e || []).forEach(id => EXERCICES[id] && Object.entries(volMuscles(EXERCICES[id].muscles)).forEach(([g, v]) => o[g] = (o[g] || 0) + v))); return o; };
  const M = comptes(decaler(auj, -27), auj), Mp = comptes(decaler(auj, -55), decaler(auj, -28)), tri = Object.keys(VOL_NOMS).sort((a, b) => (M[b] || 0) - (M[a] || 0)), mx = Math.max(1, ...Object.values(M)), oublies = tri.filter(g => (M[g] || 0) < mx * .15);
  if (Object.keys(M).length) out.push(carteStat(L("Muscles travaillés · 4 semaines", "Muscles trained · 4 weeks"), `<ul class="fm-barres">${tri.filter(g => M[g]).slice(0, 8).map(g => { const d = Mp[g] ? Math.round((M[g] - Mp[g]) / Mp[g] * 100) : null; return `<li><span>${L(...VOL_NOMS[g])}</span><i style="--p:${M[g] / mx * 100}%"></i><b class="${d > 0 ? "plus" : d < 0 ? "moins" : ""}">${d === null ? L("nouveau", "new") : (d > 0 ? "+" : "") + d + " %"}</b></li>`; }).join("")}</ul>${oublies.length ? `<p>${L("Peu ou pas travaillés", "Little or not trained")} : ${oublies.map(g => L(...VOL_NOMS[g])).join(", ")}.</p>` : ""}`,
    L("Un muscle se renforce s’il est sollicité régulièrement, et s’affaiblit sinon. Un déséquilibre (pectoraux sans dos, quadriceps sans ischios) tire sur les articulations : épaules et genoux en paient le prix. Le pourcentage compare aux 4 semaines d’avant.", "A muscle grows stronger when trained regularly and weaker otherwise. An imbalance (chest without back, quads without hamstrings) pulls on joints: shoulders and knees pay the price. The percentage compares with the 4 weeks before.")));
  // 5. sports et activités
  const parSport = (de, a) => { const o = {}; h.filter(x => x.j >= de && x.j <= a).forEach(x => { const k = x.c && CATS[x.c] ? x.c : x.m; o[k] = (o[k] || 0) + x.s / 60; }); return o; };
  const S = parSport(decaler(auj, -27), auj), Sp = parSport(decaler(auj, -55), decaler(auj, -28)), nomS = k => CATS[k] ? T(CATS[k].titre) : L(...(MODES_NOMS[k] || [k, k])), smx = Math.max(1, ...Object.values(S));
  if (Object.keys(S).length) out.push(carteStat(L("Temps par activité · 4 semaines", "Time per activity · 4 weeks"), `<ul class="fm-barres">${Object.keys(S).sort((a, b) => S[b] - S[a]).slice(0, 6).map(k => { const d = Sp[k] ? Math.round((S[k] - Sp[k]) / Sp[k] * 100) : null; return `<li><span>${nomS(k)}</span><i style="--p:${S[k] / smx * 100}%"></i><b class="${d > 0 ? "plus" : d < 0 ? "moins" : ""}">${Math.round(S[k])} min${d === null ? "" : " · " + (d > 0 ? "+" : "") + d + " %"}</b></li>`; }).join("")}</ul>`,
    L("Varier les activités répartit l’effort sur des muscles et des articulations différents ; se spécialiser fait progresser plus vite dans un sport. L’idéal : ton sport principal, plus du renfo et de la récup pour le protéger.", "Mixing activities spreads the load across different muscles and joints; specialising improves one sport faster. The ideal: your main sport, plus strength and recovery to protect it.")));
  // 6. régularité : jour et heure habituels
  const h56 = h.filter(x => x.j >= decaler(auj, -55));
  if (h56.length >= 4) {
    const jr = Array(7).fill(0); h56.forEach(x => jr[(new Date(x.j + "T12:00").getDay() + 6) % 7]++);
    const top = jr.indexOf(Math.max(...jr)), hrs = h56.filter(x => x.hr != null).map(x => x.hr), heure = hrs.length ? hrs.sort((a, b) => hrs.filter(v => v === b).length - hrs.filter(v => v === a).length)[0] : null, sem = new Set(h56.map(x => lundiDe(x.j))).size;
    out.push(carteStat(L("Tes habitudes · 8 semaines", "Your habits · 8 weeks"), `<div class="barres">${jr.map((n, k) => `<div class="${k === top ? "auj" : ""}"><b>${n || ""}</b><i style="--h:${n / Math.max(...jr) * 100}%;--k:${k}"></i>${JOURS()[k]}</div>`).join("")}</div><p>${L(`Ton jour fort : le ${JOURS_LONGS()[top]}${heure === null ? "" : `, vers ${heure} h`}. Active ${sem} semaine${sem > 1 ? "s" : ""} sur 8.`, `Your strongest day: ${JOURS_LONGS()[top]}${heure === null ? "" : `, around ${heure}:00`}. Active ${sem} week${sem > 1 ? "s" : ""} out of 8.`)}</p>`,
      L("Une habitude se construit sur un créneau fixe : même jour, même heure, la décision n’est plus à prendre. La régularité sur plusieurs semaines compte plus que l’intensité d’une seule séance.", "A habit is built on a fixed slot: same day, same time, there’s no decision left to make. Consistency over several weeks matters more than the intensity of any one session.")));
  }
  return `<h2 class="sec">${L("Forme et statistiques", "Fitness and stats")}</h2>` + out.join("") + (Object.keys(F).length ? `<button class="lien-discret" id="fmEffacer">${L("Effacer mes réponses au questionnaire", "Delete my check-in answers")}</button>` : "");
}
// boutons des statistiques, branchés après l'affichage de Mes progrès
function brancherForme() {
  if ($("fmStatGo")) $("fmStatGo").onclick = questionnaire;
  if ($("fmEffacer")) $("fmEffacer").onclick = () => { if (confirm(L("Effacer toutes tes réponses au questionnaire (sommeil, énergie, courbatures, stress) ?", "Delete all your check-in answers (sleep, energy, soreness, stress)?"))) { try { localStorage.removeItem("forme"); } catch (e) {} ouvrirProgres(); } };
}
