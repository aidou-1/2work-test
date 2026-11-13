/* ============ MOTIVATION : niveaux, défis de la semaine, bilan hebdomadaire, courbes et records ============
   Tout se calcule à partir de l'historique : aucune donnée nouvelle à stocker, donc rien à perdre ni à migrer.
   Expérience (XP) : 10 points par séance + ses minutes × l'intensité de son type, + 50 par défi de semaine réussi (+ 50 si les trois le sont).
   Défis : trois par semaine (volume, intensité, récupération), tirés selon le numéro de la semaine, donc identiques pour tout le monde. */
const lundiDe = (j = jourCle()) => { const d = new Date(j + "T12:00"); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return jourCle(d); };
const decaler = (j, n) => { const d = new Date(j + "T12:00"); d.setDate(d.getDate() + n); return jourCle(d); };
const numSemaine = l => Math.round(new Date(l + "T12:00") / 6048e5);
const estCardio = x => x.m === "tabata" || x.tb || x.ef !== undefined || x.k === "combat";
const xpSeance = x => 10 + Math.round(x.s / 60 * ({ tabata: 3, seance: 2, salle: 2 }[x.m] || 1)) + (x.bx || 0);   // bx : bonus des objets du home gym, figé à la fin de la séance
const minDe = l => Math.round(l.reduce((t, x) => t + x.s, 0) / 60);
const DEFIS_SEM = [   // trois familles ; [texte FR, EN, cible, mesure sur les séances de la semaine]
  [["3 séances cette semaine", "3 workouts this week", 3, l => l.length], ["4 séances cette semaine", "4 workouts this week", 4, l => l.length], ["60 minutes d’entraînement", "60 minutes of training", 60, minDe], ["90 minutes d’entraînement", "90 minutes of training", 90, minDe], ["3 jours actifs différents", "3 different active days", 3, l => new Set(l.map(x => x.j)).size]],
  [["2 séances de cardio ou Tabata", "2 cardio or Tabata sessions", 2, l => l.filter(estCardio).length], ["2 séances de renfo ou de salle", "2 strength or gym sessions", 2, l => l.filter(x => ["seance", "salle"].includes(x.m) && !estCardio(x)).length], ["2 défis du jour", "2 daily challenges", 2, l => l.filter(x => x.k === "defi").length]],
  [["15 minutes de mobilité ou d’étirements", "15 minutes of mobility or stretching", 15, l => minDe(l.filter(x => ["calme", "souffle", "echauffement"].includes(x.m)))], ["2 retours au calme", "2 cool-downs", 2, l => l.filter(x => ["calme", "souffle"].includes(x.m)).length]]];
function defisSemaine(l = lundiDe(), h = lireHist()) {
  const fin = decaler(l, 6), sem = h.filter(x => x.j >= l && x.j <= fin), n = numSemaine(l);
  return DEFIS_SEM.map((f, k) => { const [fr, en, cible, mes] = f[(n + k) % f.length], v = Math.min(cible, mes(sem)); return { fr, en, cible, v, ok: v >= cible }; });
}
function xpTotal(h = lireHist()) {
  const sems = [...new Set(h.map(x => lundiDe(x.j)))];
  return h.reduce((t, x) => t + xpSeance(x), 0) + sems.reduce((t, l) => { const n = defisSemaine(l, h).filter(d => d.ok).length; return t + n * 50 + (n === 3 ? 50 : 0); }, 0);
}
const RANGS = [["Débutant", "Beginner"], ["Régulier", "Regular"], ["Motivé", "Motivated"], ["Sportif", "Sporty"], ["Athlète", "Athlete"], ["Compétiteur", "Competitor"], ["Expert", "Expert"], ["Élite", "Elite"], ["Champion", "Champion"], ["Légende", "Legend"]];
const seuilXp = n => 75 * n * (n - 1);   // XP nécessaires pour atteindre le niveau n : 0, 150, 450, 900, 1500…
function niveauXp(xp = xpTotal()) { let n = 1; while (seuilXp(n + 1) <= xp) n++; const a = seuilXp(n), b = seuilXp(n + 1); return { n, xp, nom: L(...RANGS[Math.min(n, RANGS.length) - 1]), dans: xp - a, pour: b - a, pct: Math.round((xp - a) / (b - a) * 100) }; }
const barreXp = N => `<div class="vita-barre vb-xp" role="progressbar" aria-label="${L("Progression vers le niveau suivant", "Progress to the next level")}" aria-valuenow="${N.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(3, N.pct)}%"></i></div>`;
const carteDefis = (D, plus = "") => `<div class="carte"><h2>${L("Défis de la semaine", "Weekly challenges")} · ${D.filter(d => d.ok).length}/3</h2>${listeDefis(D)}${plus}</div>`;
const listeDefis = D => `<ul class="defis-sem">${D.map(d => `<li class="${d.ok ? "ok" : ""}"><span>${d.ok ? "✓" : "○"} ${L(d.fr, d.en)}</span><b>${d.v}/${d.cible}</b><i style="--p:${d.v / d.cible * 100}%"></i></li>`).join("")}</ul>`;

/* --- Bilan de la semaine : chiffres, comparaison avec la semaine d'avant, carte à partager --- */
function statsSemaine(l = lundiDe(), h = lireHist()) {
  const de = L0 => h.filter(x => x.j >= L0 && x.j <= decaler(L0, 6)), s = de(l), p = de(decaler(l, -7)), ef = s.filter(x => x.ef !== undefined).map(x => x.ef);
  return { l, s, n: s.length, min: minDe(s), jours: new Set(s.map(x => x.j)).size, xp: s.reduce((t, x) => t + xpSeance(x), 0), charge: s.reduce((t, x) => t + xpSeance(x) - 10, 0), ef: ef.length ? Math.max(...ef) : null, defis: defisSemaine(l, h), minPrec: minDe(p), nPrec: p.length };
}
function carteSemaine(S) {
  const K = toileCarte(1920, [[0, "#F97316"], [.55, "#C2410C"], [1, "#1C1210"]]), { c, x, T1, T2 } = K, N = niveauXp(), sr = series(lireHist());
  x.font = `800 120px ${T1}`; x.fillText(L("MA SEMAINE", "MY WEEK"), 540, 400); x.font = `600 44px ${T2}`; x.globalAlpha = .85; x.fillText(dateCourte(S.l) + " – " + dateCourte(decaler(S.l, 6)), 540, 480); x.globalAlpha = 1;
  tuilesCarte(K, [[S.min, L("minutes", "minutes")], [S.n, L(S.n > 1 ? "séances" : "séance", S.n > 1 ? "workouts" : "workout")], [S.jours, L(S.jours > 1 ? "jours actifs" : "jour actif", S.jours > 1 ? "active days" : "active day")], [sr.cur, L(sr.cur > 1 ? "jours d’affilée" : "jour d’affilée", "day streak")]], 720);
  x.font = `800 76px ${T1}`; x.fillText(L("NIVEAU", "LEVEL") + " " + N.n + " · " + N.nom.toUpperCase(), 540, 1370);
  x.textAlign = "left"; x.font = `600 40px ${T2}`; S.defis.forEach((d, k) => { x.globalAlpha = d.ok ? 1 : .6; x.fillText((d.ok ? "✓  " : "○  ") + L(d.fr, d.en), 150, 1490 + k * 66); });
  x.globalAlpha = 1; return c;
}
function ouvrirBilan(l = lundiDe(), retourVers = () => ecran("menu")) {
  const S = statsSemaine(l), d = S.min - S.minPrec, fait = S.defis.filter(x => x.ok).length; stocker("bilanVu", l);
  outil(L("Ma semaine", "My week"), dateCourte(l) + " – " + dateCourte(decaler(l, 6)), !S.n ? `<p class="vide">${L("Aucune séance cette semaine pour l’instant : 5 minutes suffisent pour lancer la machine.", "No workout this week yet: 5 minutes is enough to get going.")}</p>` :
    `<div class="kpis">${[[S.min, L("minutes", "minutes"), "#10B981"], [S.n, L("séances", "workouts"), "#2F5BFF"], [S.jours + "/7", L("jours actifs", "active days"), "#F59E0B"], ["+" + (S.xp + fait * 50 + (fait === 3 ? 50 : 0)), "XP", "#E11D48"]].map(([v, t, c]) => `<div class="kpi" style="--c:${c}"><b>${v}</b><span>${t}</span></div>`).join("")}</div>
     <div class="carte"><h2>${L("Par rapport à la semaine d’avant", "Compared with the week before")}</h2><p>${!S.nPrec ? L("Pas de séance la semaine d’avant : tu repars sur de bonnes bases.", "No workout the week before: you are off to a fresh start.") : d > 0 ? L(`${d} minutes de plus (${S.minPrec} → ${S.min}). Belle progression !`, `${d} more minutes (${S.minPrec} → ${S.min}). Nice progress!`) : d < 0 ? L(`${-d} minutes de moins (${S.minPrec} → ${S.min}). Une semaine plus légère fait aussi partie de l’entraînement.`, `${-d} fewer minutes (${S.minPrec} → ${S.min}). A lighter week is part of training too.`) : L("Exactement le même volume : la régularité paie.", "Exactly the same volume: consistency pays off.")}${S.ef !== null ? " " + L(`Effort ressenti le plus haut : ${S.ef}/10.`, `Highest perceived effort: ${S.ef}/10.`) : ""}</p></div>
     ${carteDefis(S.defis)}${l === lundiDe() ? blocDuel(S) : ""}
     <button class="primary" id="bilanPartage">📸 ${L("Partager ma semaine", "Share my week")}</button><div id="shAide"></div>`, retourVers);
  if ($("duelGo")) $("duelGo").onclick = () => envoyerDuel($("duelGo"));
  if ($("bilanPartage")) $("bilanPartage").onclick = () => carteSemaine(S).toBlob(b => envoyer(b, "2work-semaine.jpg", "image/jpeg").then(r => { if (r === "telecharge") zoneAide().innerHTML = `<p class="sh-ok">${L("Image enregistrée dans tes téléchargements.", "Image saved to your downloads.")}</p>`; }), "image/jpeg", .92);
}

/* --- Carte du menu : niveau, barre d'XP, défis de la semaine ; le dimanche soir et le lundi, le bilan de la semaine écoulée --- */
function majJeu() {
  const Z = $("jeuCarte"); if (!Z) return; const N = niveauXp(), d = new Date(), j = d.getDay(), E = document.querySelector("#menu .entete");
  const lb = j === 1 ? decaler(lundiDe(), -7) : j === 0 && d.getHours() >= 17 ? lundiDe() : "", aBilan = lb && lire("bilanVu") !== lb && statsSemaine(lb).n;
  if (!$("nivBadge")) { E.insertAdjacentHTML("beforeend", `<button class="niv-badge" id="nivBadge"></button>`); $("nivBadge").onclick = ouvrirNiveau; }
  $("nivBadge").setAttribute("aria-label", L("Niveau", "Level") + " " + N.n + " · " + N.nom); $("nivBadge").style.setProperty("--p", N.pct + "%"); $("nivBadge").innerHTML = `<b>${N.n}</b><small>${L("Niv.", "Lvl")}</small>`;
  Z.innerHTML = aBilan ? `<button class="jeu-bilan" id="jeuBilan">📊 ${L("Ton bilan de la semaine est prêt", "Your weekly summary is ready")} ›</button>` : "";
  if ($("jeuBilan")) $("jeuBilan").onclick = () => ouvrirBilan(lb);
}
/* Écran du niveau : avancement, ce que rapporte chaque type de séance, défis en cours, et récompenses offertes tous les 3 niveaux (js/moi.js) */
function ouvrirNiveau() {
  const N = niveauXp(), D = defisSemaine(), R = ARTICLES.filter(x => x[4] < 0).sort((a, b) => b[4] - a[4]), FAM = { tee: ["Tenue", "Outfit"], acc: ["Accessoire", "Accessory"], mur: ["Mur du home gym", "Home gym wall"], sol: ["Sol du home gym", "Home gym floor"], obj: ["Objet du home gym", "Home gym item"] };
  const gain = (min, f) => 10 + min * f, ligne = (t, x) => `<li><span>${t}</span><b>+${x} XP</b></li>`;
  outil(L("Niveau", "Level") + " " + N.n + " · " + N.nom, L("Chaque séance te fait gagner des points d’expérience (XP). Ils font monter ton niveau et servent à acheter tenues et décors dans l’onglet Moi.", "Every workout earns experience points (XP). They raise your level and buy outfits and decor in the Me tab."),
    `<div class="carte niv-carte"><div class="niv-tete"><b class="xp-rond">${N.n}</b><span><strong>${N.dans} / ${N.pour} XP</strong>${barreXp(N)}<small>${L("Encore", "Another")} ${N.pour - N.dans} XP ${L("pour le niveau", "to reach level")} ${N.n + 1}${N.n < RANGS.length ? " · " + L(...RANGS[N.n]) : ""}</small></span><b class="xp-rond suivant">${N.n + 1}</b></div>
       <p class="sh-aide">${L("Total gagné", "Total earned")} : ${N.xp} XP · ${L("à dépenser", "to spend")} : ${solde()} XP. ${L("Dépenser des XP ne fait jamais baisser ton niveau.", "Spending XP never lowers your level.")}</p></div>
     <div class="carte"><h2>${L("Ce que tu vas gagner", "What you will earn")}</h2><ul class="carnet ef-liste records">
       ${ligne(L("Échauffement ou étirements · 10 min", "Warm-up or stretching · 10 min"), gain(10, 1))}${ligne(L("Renfo, salle ou cardio · 20 min", "Strength, gym or cardio · 20 min"), gain(20, 2))}${ligne(L("Renfo, salle ou cardio · 30 min", "Strength, gym or cardio · 30 min"), gain(30, 2))}${ligne(L("Tabata · 8 min", "Tabata · 8 min"), gain(8, 3))}${ligne(L("Chaque défi de la semaine réussi", "Each weekly challenge completed"), 50)}${ligne(L("Bonus si les trois défis sont réussis", "Bonus when all three challenges are done"), 50)}</ul>
       <p class="sh-aide">${L("Règle : 10 XP par séance, plus ses minutes × 1 (échauffement, récupération), × 2 (renfo, salle, cardio) ou × 3 (Tabata).", "Rule: 10 XP per workout, plus its minutes × 1 (warm-up, recovery), × 2 (strength, gym, cardio) or × 3 (Tabata).")}</p></div>
     ${carteDefis(D)}
     <h2 class="sec">${L("Récompenses de palier", "Milestone rewards")}</h2><div class="carte"><ul class="paliers">${R.map(x => { const n = -x[4], ok = N.n >= n, c = typeof x[5] === "string" && x[5][0] === "#" ? x[5] : x[6] && x[6][0] === "#" ? x[6] : "#F5B301";
       return `<li class="${ok ? "ok" : ""}"><b class="xp-rond${ok ? "" : " verrou"}">${n}</b><i style="--c:${c}"></i><span><strong>${L(x[2], x[3])}</strong><small>${L(...FAM[x[1]])} · ${ok ? L("débloqué, à retrouver dans Moi", "unlocked, find it in Me") : L("dans", "in") + " " + (n - N.n) + " " + L(n - N.n > 1 ? "niveaux" : "niveau", n - N.n > 1 ? "levels" : "level")}</small></span></li>`; }).join("")}</ul>
       <button class="toggle contour" id="nivMoi">${L("Ouvrir ma boutique", "Open my shop")}</button></div>`, () => ecran("menu"));
  $("nivMoi").onclick = () => { essai = ""; ouvrirMoi(); };
}

/* --- Fin de séance : XP gagnés, passage de niveau, défis qui viennent d'être réussis --- */
function blocGain() {
  const h = lireHist(), der = h[h.length - 1]; if (der && der.bx === undefined) { der.bx = bonusGym(der); stocker("historique", JSON.stringify(h)); }
  const av = h.slice(0, -1), A = niveauXp(xpTotal(av)), B = niveauXp(xpTotal(h)), l = lundiDe(), dA = defisSemaine(l, av), neufs = defisSemaine(l, h).filter((d, k) => d.ok && !dA[k].ok);
  if (B.n > A.n) setTimeout(() => { confettis(); [784, 1047, 1319, 1568].forEach((f, i) => bip(f, 200, .14, "triangle", i * .12)); }, 2200);
  return `<div class="nouveau-trophee gain-xp"><svg class="perso-fete" viewBox="0 30 120 200" aria-hidden="true">${persoSvg(lireAvatar(), "feu", "victoire")}</svg><div><small>+${B.xp - A.xp} XP${der && der.bx ? L(` (dont +${der.bx} grâce à ton home gym)`, ` (+${der.bx} from your home gym)`) : ""}${B.n > A.n ? " · " + L("niveau supérieur !", "level up!") : ""}</small><b>${L("Niveau", "Level")} ${B.n} · ${B.nom}</b>${barreXp(B)}</div></div>`
    + ARTICLES.filter(x => -x[4] > A.n && -x[4] <= B.n).map(x => `<div class="nouveau-trophee"><b class="xp-rond ok">🎁</b><div><small>${L("Récompense de palier débloquée", "Milestone reward unlocked")}</small><b>${L(x[2], x[3])}</b><span>${L("À retrouver dans l’onglet Moi", "Find it in the Me tab")}</span></div></div>`).join("")
    + neufs.map(d => `<div class="nouveau-trophee"><b class="xp-rond ok">✓</b><div><small>${L("Défi de la semaine réussi · +50 XP", "Weekly challenge done · +50 XP")}</small><b>${L(d.fr, d.en)}</b></div></div>`).join("");
}

/* --- Mes progrès : niveau, défis, charge des 8 dernières semaines, effort ressenti, records --- */
function blocsJeu() {
  const h = lireHist(), N = niveauXp(), l = lundiDe(), D = defisSemaine(l, h), sr = series(h);
  const sems = Array.from({ length: 8 }, (_, k) => statsSemaine(decaler(l, (k - 7) * 7), h)), mx = Math.max(60, ...sems.map(s => s.charge)), moy = Math.round(sems.slice(0, 7).reduce((t, s) => t + s.charge, 0) / 7);
  const ef = h.filter(x => x.ef !== undefined).slice(-12), pts = ef.map((x, k) => [10 + k * (280 / Math.max(1, ef.length - 1)), 92 - x.ef * 8.4]);
  const parSem = {}; h.forEach(x => { const k = lundiDe(x.j); (parSem[k] = parSem[k] || []).push(x); });
  const mSem = Object.values(parSem), vma = lireTests().filter(x => x.id === "navette"), rec = [[h.length ? Math.round(Math.max(...h.map(x => x.s)) / 60) + " min" : "", L("Séance la plus longue", "Longest workout")], [mSem.length ? Math.max(...mSem.map(minDe)) + " min" : "", L("Meilleure semaine", "Best week")], [mSem.length ? Math.max(...mSem.map(s => s.length)) : "", L("Séances en une semaine", "Workouts in a week")],
    [sr.best ? sr.best + L(" j", " d") : "", L("Meilleure série", "Best streak")], [h.some(x => x.fcMax) ? Math.max(...h.map(x => x.fcMax || 0)) + " bpm" : "", L("Fréquence cardiaque max", "Max heart rate")], [vma && vma.length ? Math.max(...vma.map(t => t.v)) + " km/h" : "", L("Meilleure VMA estimée", "Best estimated top aerobic speed")]].filter(r => r[0] !== "");
  return `<div id="jeuBloc" class="carte jeu-carte"><h2>${L("Niveau", "Level")} ${N.n} · ${N.nom}</h2>${barreXp(N)}<p class="sh-aide">${N.dans} / ${N.pour} XP · ${L("encore", "another")} ${N.pour - N.dans} XP ${L("pour le niveau", "to reach level")} ${N.n + 1}. ${L("Chaque séance rapporte 10 XP, plus ses minutes multipliées par son intensité.", "Each workout earns 10 XP, plus its minutes multiplied by its intensity.")}</p>
      <p class="joker">🛡️ ${sr.joker ? L("Joker de la semaine utilisé : ta série a survécu à un jour sans séance.", "This week’s joker is used: your streak survived a day without a workout.") : L("Joker de la semaine disponible : un jour sans séance ne cassera pas ta série.", "This week’s joker is available: one day without a workout will not break your streak.")}</p></div>
    ${carteDefis(D, `<button class="toggle contour" id="voirBilan">${L("Voir le bilan de ma semaine", "See my weekly summary")}</button>`)}
    <div class="carte"><h2>${L("Charge d’entraînement · 8 semaines", "Training load · 8 weeks")}</h2><div class="barres b8">${sems.map((s, k) => `<div class="${k === 7 ? "auj" : ""}"><b>${s.charge || ""}</b><i style="--h:${s.charge / mx * 100}%;--k:${k}"></i>${dateCourte(s.l).replace(/\D+$/, "").trim()}</div>`).join("")}</div>
      <p class="sh-aide">${L("Charge = minutes × intensité de la séance. Moyenne des 7 semaines précédentes : ", "Load = minutes × session intensity. Average of the 7 previous weeks: ")}${moy}. ${moy && sems[7].charge > moy * 1.5 ? L("Cette semaine est nettement au-dessus : prévois une journée de récupération.", "This week is well above it: plan a recovery day.") : ""}</p></div>
    ${ef.length > 1 ? `<div class="carte"><h2>${L("Effort ressenti · séances cardio", "Perceived effort · cardio sessions")}</h2><svg class="courbe" viewBox="0 0 300 100" role="img" aria-label="${L("Effort ressenti des dernières séances", "Perceived effort of recent sessions")} : ${ef.map(x => x.ef).join(", ")}">
      ${[0, 5, 10].map(v => `<line x1="10" x2="290" y1="${92 - v * 8.4}" y2="${92 - v * 8.4}"/><text x="0" y="${95 - v * 8.4}">${v}</text>`).join("")}<polyline points="${pts.map(p => p.join(",")).join(" ")}"/>${pts.map((p, k) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5"><title>${dateCourte(ef[k].j)} · ${ef[k].ef}/10</title></circle>`).join("")}</svg>
      <p class="sh-aide">${L("Moyenne", "Average")} : ${(ef.reduce((t, x) => t + x.ef, 0) / ef.length).toFixed(1)}/10 ${L("sur", "over")} ${ef.length} ${L("séances", "sessions")}.</p></div>` : ""}
    ${rec.length ? `<div class="carte"><h2>${L("Records personnels", "Personal records")}</h2><ul class="carnet ef-liste records">${rec.map(([v, t]) => `<li><span>${t}</span><b>${v}</b></li>`).join("")}</ul></div>` : ""}`;
}

/* --- Séance du jour (accueil) : x = séance prévue au planning aujourd'hui, s'il y en a une. Renvoie { t, s, c, go, r: raison, ico } --- */
function seanceDuJour(x) {
  const h = lireHist(), l = lundiDe(), auj = jourCle(), niv = lireNiv(), S = statsSemaine(l, h), prec = [1, 2, 3, 4].map(k => statsSemaine(decaler(l, -7 * k), h).charge).filter(Boolean), moy = prec.length ? prec.reduce((a, b) => a + b) / prec.length : 0;
  const hier = h.filter(y => y.j === decaler(auj, -1)), dur = y => y.ef >= 9 || y.m === "tabata", der = h[h.length - 1], vide = der ? Math.round((new Date(auj + "T12:00") - new Date(der.j + "T12:00")) / 864e5) : 99;
  const fatigue = moy >= 40 && S.charge > moy * 1.5 ? L("Ta charge de la semaine dépasse nettement ta moyenne : récupère aujourd’hui.", "Your weekly load is well above your average: recover today.")
    : h.slice(-2).length === 2 && h.slice(-2).every(y => dur(y) && y.j >= decaler(auj, -2)) ? L("Deux séances très dures de suite : place à la récupération.", "Two very hard sessions in a row: time to recover.") : "";
  if (fatigue) return { ...tpl("C:repos", niv), r: fatigue, ico: "🧘" };
  const RP = REPRISES.find(R => repAvance(R[0]) > 0 && repAvance(R[0]) < NB_REP);   // reprise après blessure en cours : une séance un jour sur deux
  if (RP) return h.some(y => y.b && y.j === decaler(auj, -1)) ? { ...tpl("C:repos", niv), r: L("Reprise après blessure : un jour sur deux. Aujourd’hui, récupération douce.", "Return after injury: every other day. Today, gentle recovery."), ico: "🧘" }
    : { t: L("Reprise · ", "Return · ") + L(RP[1], RP[2]), s: L("Séance", "Session") + " " + (repAvance(RP[0]) + 1) + "/" + NB_REP, c: RP[3], ico: "🩹", go: () => ouvrirReprise(RP[0]) };
  const P = PROGRAMMES.map(p => [p, progAvance(p[0])]).filter(([, a]) => a > 0 && a < NB_PROG).sort((a, b) => b[1] - a[1])[0];
  if (P) return { t: L(P[0][1], P[0][2]), s: L("Programme · jour", "Programme · day") + " " + (P[1] + 1) + "/" + NB_PROG, c: P[0][5], go: () => ouvrirProg(P[0][0]) };
  if (x) return x.s;
  const plan = PLANS[lireProfil().objectif], sem = Array.isArray(plan) ? plan : PLANS.forme, cle = vide >= 3 ? "R:complet" : hier.some(y => ["seance", "salle", "tabata"].includes(y.m)) ? "C:repos" : sem[(new Date().getDay() + 6) % 7].replace("@", "complet"), T0 = tpl(cle, niv);
  return T0 && { ...T0, r: vide >= 3 && vide < 99 ? L(`${vide} jours sans séance : on relance avec une séance complète.`, `${vide} days without a workout: restart with a full-body session.`) : cle === "C:repos" ? L("Séance intense hier : aujourd’hui, on récupère.", "Hard session yesterday: today is for recovery.") : "", ico: cle === "C:repos" ? "🧘" : "🎯" };
}

/* --- Duel de la semaine : on envoie son total d'XP de la semaine par lien (?duel=…), l'ami le retrouve dans son bilan (clé « duel ») --- */
const lienDuel = () => location.origin + location.pathname + "?duel=" + coderLien({ n: lireProfil().nom || "", x: statsSemaine().xp, l: lundiDe() });
function blocDuel(S) {
  const d = lireJSON("duel", null), ok = d && d.l === S.l, e = ok ? S.xp - d.x : 0;
  return `<div class="carte"><h2>⚔️ ${L("Duel de la semaine", "Weekly duel")}</h2>${ok ? `<ul class="carnet ef-liste records"><li><span>${propre(d.n) || L("Ton ami", "Your friend")}</span><b>${d.x} XP</b></li><li><span>${L("Toi", "You")}</span><b>${S.xp} XP</b></li></ul><p>${e > 0 ? L(`Tu mènes de ${e} XP. Envoie ton score pour le lui montrer !`, `You lead by ${e} XP. Send your score to show them!`) : e < 0 ? L(`Il te manque ${-e} XP pour passer devant : une séance de 20 minutes en rapporte 50.`, `You need ${-e} XP to take the lead: a 20-minute workout earns 50.`) : L("Égalité parfaite : la prochaine séance fera la différence.", "A perfect tie: the next workout will decide.")}</p>`
    : `<p>${L("Envoie ton total d’XP de la semaine à un ami : il verra s’il fait mieux, et pourra te renvoyer le sien.", "Send your weekly XP total to a friend: they will see whether they beat it, and can send theirs back.")}</p>`}<button class="toggle contour" id="duelGo">${ok ? L("Envoyer mon score", "Send my score") : L("Défier un ami", "Challenge a friend")}</button></div>`;
}
async function envoyerDuel(b) {
  const n = lireProfil().nom, url = lienDuel(), texte = L(`${n || "Ton ami"} a gagné ${statsSemaine().xp} XP cette semaine sur 2 WORK. Tu fais mieux ?`, `${n || "Your friend"} earned ${statsSemaine().xp} XP this week on 2 WORK. Can you beat it?`);
  return partagerLien(texte, url, b);
}
addEventListener("DOMContentLoaded", () => { const c = new URLSearchParams(location.search).get("duel"); if (!c) return;
  try { const d = decoderLien(c); if (!(d.x >= 0 && d.x < 1e5) || !/^\d{4}-\d\d-\d\d$/.test(d.l)) return;
    stocker("duel", JSON.stringify({ n: propre(d.n || "").slice(0, 20), x: Math.round(d.x), l: d.l })); history.replaceState(null, "", location.pathname); finBienvenue(); afficherEcran("menu"); ouvrirBilan(); } catch (e) {} });

/* --- Programme sur mesure : 4 semaines assemblées à partir des journées des programmes existants, selon l'objectif, le rythme et l'intensité.
   Gardé dans « progPerso » (même format que PROGRAMMES) et placé en tête de la liste ; son avancement suit la clé habituelle prog_perso. --- */
const PERSO_OBJ = [["forme", "Être en forme", "Get fit", ["force", "cardio", "force", "hiit", "gainage", "cardio"]], ["perte", "Perdre du poids", "Lose weight", ["hiit", "cardio", "force", "hiit", "cardio", "gainage"]],
  ["force", "Gagner en force", "Get stronger", ["force", "gainage", "force", "hiit", "force", "cardio"]], ["souplesse", "Mobilité et posture", "Mobility and posture", ["mobilite", "gainage", "mobilite", "force", "mobilite", "cardio"]]];
const PERSO_RYTHME = { 3: [1, 0, 1, 0, 1, 0, 0], 4: [1, 1, 0, 1, 0, 1, 0], 5: [1, 1, 0, 1, 1, 0, 1], 6: [1, 1, 1, 0, 1, 1, 1] }, PERSO_INT = [[25, 25, [2, 2, 3, 2], "doux"], [30, 20, [2, 3, 3, 2], "dyn"], [35, 25, [3, 3, 4, 2], "dyn"]];
function composerProgPerso(obj, n, int, mat = "sans") {
  const O = PERSO_OBJ.find(o => o[0] === obj), banque = t => PROGRAMMES.filter(p => p[0] !== "perso").flatMap(p => p[10]).filter(d => d[0] === t && d[3].every(e => EXERCICES[e])), vus = {}, tire = t => { const b = banque(t); vus[t] = (vus[t] || 0) + 1; return b[(vus[t] - 1) % b.length]; };
  // avec du matériel : les journées de renforcement reprennent 5 exercices faisables avec ce matériel, dans la même zone du corps (au moins 3, sinon la journée reste au poids du corps)
  const dispo = mat === "salle" ? [...FAMILLES_MAT.map(m => m[0]), "salle"] : mat === "mien" ? monMatos() : [], equiper = d => { if (d[0] !== "force" || !dispo.length) return d;
    const z = ["bas", "haut"].includes(d[4]) ? d[4] : "tout", l = MATOS.filter(id => !EXERCICES[id].etir && faisable(id, dispo) && dansZone(id, z)), pas = Math.max(1, Math.floor(l.length / 5));
    return l.length < 3 ? d : [d[0], d[1] + " · matériel", d[2] + " · equipment", l.filter((_, i) => i % pas === 0).slice(0, 5), d[4]]; };
  let k = 0, r = 0; const sem = PERSO_RYTHME[n].map(tr => tr ? equiper(tire(O[3][k++])) : tire(r++ % 2 ? "mobilite" : "recup"));
  return ["perso", "Mon programme · " + O[1], "My programme · " + O[2], `Programme sur mesure : ${n} séances et ${7 - n} jours de récupération par semaine, pendant 4 semaines.`, `Custom programme: ${n} workouts and ${7 - n} recovery days a week, for 4 weeks.`, "#0EA5E9", [["Doux", "Gentle"], ["Modéré", "Moderate"], ["Intense", "Intense"]][int], "",
    [O[1], n + " séances par semaine", "Progression sur 4 semaines"], [O[2], n + " workouts a week", "4-week progression"], sem, PERSO_INT[int]];
}
function ouvrirProgPerso() {
  const R = { o: "forme", n: 4, i: Math.max(0, NIV_RENFO.findIndex(x => x[0] === lireNiv())), m: monMatos().length ? "mien" : "sans" }, a = progAvance("perso"), existe = PROGRAMMES[0][0] === "perso";
  outil(L("Mon programme sur mesure", "My custom programme"), L("Quatre choix, et l’appli assemble 4 semaines de séances, avec la bonne alternance d’efforts et de récupération.", "Four choices, and the app builds 4 weeks of workouts, with the right balance of effort and recovery."),
    `<div class="carnet"><span class="champ-titre">${L("Ton objectif", "Your goal")}</span>${chips("po", PERSO_OBJ.map(o => o.slice(0, 3)), R.o)}<span class="champ-titre">${L("Séances par semaine", "Workouts a week")}</span>${chips("pn", [3, 4, 5, 6].map(v => [v, v, v]), R.n)}
      <span class="champ-titre">${L("Intensité", "Intensity")}</span>${chips("pi", [[0, "Douce", "Gentle"], [1, "Modérée", "Moderate"], [2, "Intense", "Intense"]], R.i)}
      <span class="champ-titre">${L("Matériel", "Equipment")}</span>${chips("pm", [["sans", "Poids du corps", "Bodyweight"], ["mien", "Mon matériel", "My equipment"], ["salle", "Salle complète", "Full gym"]], R.m)}<p class="sh-aide" id="ppMat"></p></div><div id="ppApercu"></div>
     ${existe && a ? `<p class="prog-avert">${L(`Tu as déjà un programme sur mesure (jour ${a}/${NB_PROG}) : en créer un nouveau le remplace et repart du jour 1. Tes séances déjà faites restent dans l’historique.`, `You already have a custom programme (day ${a}/${NB_PROG}): creating a new one replaces it and restarts at day 1. Your completed workouts stay in your history.`)}</p>` : ""}
     <button class="primary" id="ppCreer">${L("Créer mon programme", "Create my programme")}</button>`, () => ouvrirProgs(true));
  const apercu = () => { const P = composerProgPerso(R.o, R.n, R.i, R.m), eq = P[10].filter(d => / · matériel$/.test(d[1])).length;
    $("ppMat").textContent = R.m === "sans" ? "" : R.m === "mien" && !monMatos().length ? L("Aucun matériel enregistré : indique-le dans ton profil, ou choisis « Salle complète ».", "No equipment saved: add it in your profile, or pick “Full gym”.") : eq ? L(`${eq} ${eq > 1 ? "journées" : "journée"} de renforcement avec matériel ; le cardio, le gainage et la récupération restent au poids du corps.`, `${eq} strength day${eq > 1 ? "s" : ""} with equipment; cardio, core and recovery stay bodyweight.`) : L("Pas assez d’exercices possibles avec ce matériel : le programme reste au poids du corps.", "Not enough exercises possible with this equipment: the programme stays bodyweight."); $("ppApercu").innerHTML = `<h2 class="sec">${L("Ta semaine type", "Your typical week")}</h2><ul class="carnet ef-liste records">${P[10].map((d, k) => `<li><span>${L("Jour", "Day")} ${k + 1} · ${L(d[1], d[2])}</span><b style="color:${PTYPES[d[0]][0]}">${L(PTYPES[d[0]][1], PTYPES[d[0]][2])}</b></li>`).join("")}</ul>`; return P; };
  [["po", "o", String], ["pn", "n", Number], ["pi", "i", Number], ["pm", "m", String]].forEach(([c, k, f]) => brancherChips(c, v => { R[k] = f(v); apercu(); })); apercu();
  $("ppCreer").onclick = () => { const P = apercu(); if (PROGRAMMES[0][0] === "perso") PROGRAMMES.shift(); PROGRAMMES.unshift(P); stocker("progPerso", JSON.stringify(P)); stocker("prog_perso", 0); ouvrirProg("perso"); };
}
{ const pp = lireJSON("progPerso", null); if (Array.isArray(pp) && pp[0] === "perso" && Array.isArray(pp[10])) PROGRAMMES.unshift(pp); }
