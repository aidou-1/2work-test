/* ============ CARDIO PAR INTERVALLES (boxe et tous les sports) ============
   Séances à la carte : on choisit son support du jour (dehors, tapis, vélo, corde, sac, shadow, sur place) et son niveau, l'appli
   construit la séance : échauffement cardio de 4 min, efforts courts à très haute intensité, récupération complète entre les
   efforts, retour au calme. L'intensité se règle à l'effort ressenti (sur 10) et, avec une ceinture, à la fréquence cardiaque
   (« zone rouge » : 90 % et plus du maximum estimé). Préférence gardée : clé « cardioSupport ».
   Les mouvements de cardio ne sont pas énumérables dans EXERCICES : ils restent hors de la bibliothèque et du Quick start. */
const SUPPORTS = [   // [clé, nom FR, EN, [facile, soutenu, à fond] FR, EN, conseil FR, EN, sports réservés]
  ["course", "Course dehors", "Outdoor run", ["Trot très facile", "Course soutenue", "Sprint"], ["Easy jog", "Hard run", "Sprint"], "Choisis une ligne droite dégagée ou une côte douce. Pousse fort sur les bras.", "Pick a clear straight or a gentle hill. Drive your arms hard."],
  ["cote", "Course en côte", "Hill run", ["Descente en marchant", "Montée soutenue", "Sprint en côte"], ["Walk back down", "Hard climb", "Hill sprint"], "Choisis une pente régulière. Penche-toi légèrement, pousse loin derrière toi et redescends toujours en marchant.", "Pick an even slope. Lean slightly, push far behind you and always walk back down."],
  ["tapis", "Tapis de course", "Treadmill", ["Marche rapide ou trot", "Course soutenue", "Sprint sur tapis"], ["Brisk walk or jog", "Hard run", "Treadmill sprint"], "Règle la vitesse avant l’effort. Pose les pieds sur les bords pendant le repos.", "Set the speed before the effort. Step onto the side rails during the rest."],
  ["velo", "Vélo", "Bike", ["Pédalage souple", "Pédalage soutenu", "Sprint à vélo"], ["Easy spin", "Hard ride", "Bike sprint"], "Mets assez de résistance pour pousser fort sans mouliner dans le vide.", "Use enough resistance to push hard without spinning out."],
  ["corde", "Corde à sauter", "Jump rope", ["Corde tranquille", "Corde rythmée", "Corde à fond"], ["Easy skipping", "Steady fast skipping", "All-out skipping"], "Petits sauts sur l’avant du pied, coudes près du corps, poignets qui tournent.", "Small hops on the balls of your feet, elbows in, wrists turning."],
  ["sac", "Sac de frappe", "Heavy bag", ["Jeu de jambes autour du sac", "Enchaînements appuyés", "Rafale au sac"], ["Footwork around the bag", "Hard combinations", "Bag flurry"], "Garde les mains hautes entre les frappes et reste mobile sur tes appuis.", "Keep your hands up between punches and stay light on your feet.", "boxe"],
  ["shadow", "Shadow boxing", "Shadow boxing", ["Shadow relâché", "Shadow soutenu", "Rafale en shadow"], ["Loose shadow boxing", "Hard shadow boxing", "Shadow flurry"], "Frappe en vitesse sans verrouiller les coudes, et bouge après chaque série.", "Punch fast without locking your elbows, and move after every combination.", "boxe"],
  ["nage", "Natation", "Swimming", ["Nage tranquille", "Nage soutenue", "Sprint en nage"], ["Easy swimming", "Hard swimming", "Swim sprint"], "Crawl ou brasse. Pendant le repos, accroche-toi au bord et respire calmement.", "Front crawl or breaststroke. During the rest, hold the wall and breathe calmly.", "natation surf"],
  ["rame", "Rame", "Paddling", ["Rame tranquille", "Rame soutenue", "Sprint de rame"], ["Easy paddling", "Hard paddling", "Paddle sprint"], "Allongé sur ta planche, poitrine haute, mains qui entrent loin devant. Sans planche, rame à plat ventre sur un banc ou au sol.", "Lying on your board, chest up, hands entering far ahead. Without a board, paddle lying face down on a bench or the floor.", "surf"],
  ["place", "Sur place, sans matériel", "On the spot, no equipment", ["Marche active sur place", "Montées de genoux rythmées", "Montées de genoux à fond"], ["Marching on the spot", "Steady high knees", "All-out high knees"], "Reste sur l’avant du pied, buste droit, et pompe fort avec les bras.", "Stay on the balls of your feet, chest tall, and pump your arms hard."]];
const ALLURES = [   // facile, soutenu, à fond : [durée type, effort /10, description FR, EN, consigne dite FR, EN]
  [60, "3", "Allure très facile : tu respires calmement et tu peux parler. Effort ressenti 3 sur 10.", "Very easy pace: calm breathing, you can talk. Perceived effort 3 out of 10.", "Relâche les épaules et la mâchoire.|Avance à une allure très facile. Tu dois pouvoir parler sans effort.", "Relax your shoulders and jaw.|Move at a very easy pace. You should be able to talk easily."],
  [120, "8", "Allure dure mais tenable : la même du début à la fin de l’intervalle. Effort ressenti 8 sur 10.", "Hard but sustainable pace: the same from start to finish. Perceived effort 8 out of 10.", "Installe ton rythme dès le départ.|Tiens une allure dure, mais régulière jusqu’au bout. Ne pars pas trop vite.", "Settle into your pace right away.|Hold a hard but even pace to the end. Do not start too fast."],
  [30, "9–10", "Tout ce que tu as, dès la première seconde. Effort ressenti 9 à 10 sur 10.", "Everything you have, from the very first second. Perceived effort 9 to 10 out of 10.", "Prêt à partir à fond.|Donne tout dès la première seconde, et ne garde rien pour la suite.", "Ready to go all out.|Give everything from the first second and hold nothing back."]];
// Pas de vidéo pour ces efforts : une jauge d'intensité (10 barres) tient lieu d'illustration, en grand pendant la séance et en vignette dans les listes
const jauge = (a, petit) => { const n = [3, 8, 10][a], c = ["#10B981", "#F59E0B", "#DC2626"][a], b = Array.from({ length: 10 }, (_, i) => `<rect x="${12 + i * 22}" y="${96 - i * 7}" width="15" height="${24 + i * 7}" rx="4" fill="${i < n ? c : "#CBD5E1"}" opacity="${i < n ? 1 : .45}"/>`).join("");
  return petit ? `<svg class="mini" viewBox="0 0 240 130" aria-hidden="true">${b}</svg>`
    : `<div class="media allure" style="--c:${c}"><svg viewBox="0 0 240 130" aria-hidden="true">${b}</svg><b>${L("Effort", "Effort")} ${ALLURES[a][1]} / 10</b><span>${L(...[["Facile : tu peux parler", "Easy: you can talk"], ["Dur mais régulier : quelques mots", "Hard but even: a few words"], ["À fond : impossible de parler", "All out: talking is impossible"]][a])}</span></div>`; };
SUPPORTS.forEach(([k, , , fr, en, cFr, cEn]) => ALLURES.forEach(([d, , dFr, dEn, vFr, vEn], a) => {
  const id = "c_" + k + a, EN = LANGUE === "en";
  Object.defineProperty(EXERCICES, id, { value: { nom: (EN ? en : fr)[a], nomFr: fr[a], duree: d, video: null, allure: a, mini: jauge(a, 1), visuel: jauge(a), description: (EN ? dEn : dFr) + " " + (EN ? cEn : cFr), muscles: L("Cœur, souffle, jambes", "Heart, lungs, legs"), mat: false } });
  if (typeof VOIX !== "undefined") VOIX[id] = en[a];
  if (typeof CONSIGNES !== "undefined") CONSIGNES[id] = [vFr + "|" + cFr, vEn + "|" + cEn];
}));

/* Les séances : [clé, nom FR, EN, couleur, effort visé, résumé FR, EN, blocs(v)] où v = 0 débutant, 1 intermédiaire, 2 avancé.
   Un bloc renvoie des pas [allure 0-2, durée s, repos s]. « moins » (semaine d'affûtage d'un programme) retire environ un tiers du volume. */
const fois = (n, f) => Array.from({ length: n }, (_, i) => f(i)).flat();
const CARDIOS = [
  ["sprints", "Sprints 30 secondes", "30-second sprints", "#DC2626", "9–10", "Des sprints à fond, séparés par une vraie récupération : c’est la qualité de chaque sprint qui compte.", "All-out sprints with full recovery in between: the quality of each sprint is what counts.",
    (v, m) => fois([4, 6, 8][v] - m * 2, () => [[2, 30, 150]])],
  ["groupes", "Sprints groupés", "Grouped sprints", "#EA580C", "9–10", "Trois sprints très courts qui s’enchaînent, puis deux minutes pour récupérer : comme les rafales d’un round.", "Three very short sprints back to back, then two minutes to recover: like the flurries of a round.",
    (v, m) => fois([4, 6, 8][v] - m * 2, () => [[2, 10, 10], [2, 10, 10], [2, 10, 120]])],
  ["tolerance", "Intervalles 2 minutes", "2-minute intervals", "#7C3AED", "8", "Deux minutes dures à allure régulière, deux minutes de repos : tu apprends à tenir quand ça brûle.", "Two hard minutes at an even pace, two minutes of rest: you learn to hold on when it burns.",
    (v, m) => fois([3, 4, 6][v] - m, () => [[1, 120, 120]])],
  ["pyramide", "Pyramide", "Pyramid", "#2563EB", "8–9", "Les efforts s’allongent puis raccourcissent, avec un repos égal à l’effort : idéal pour apprendre à doser.", "Efforts get longer then shorter, with rest equal to the effort: ideal for learning to pace yourself.",
    (v, m) => [[30, 60, 90, 60, 30], [30, 60, 90, 120, 90, 60, 30], [30, 60, 90, 120, 120, 90, 60, 30]][Math.max(0, v - m)].map(d => [d > 30 ? 1 : 2, d, d])],
  ["rounds", "Rounds de combat", "Fight rounds", "#BE123C", "9", "Des rounds où tu alternes rafale à fond et déplacement léger, avec une minute de repos : le rythme d’un combat.", "Rounds alternating all-out flurries and light movement, with one minute of rest: the rhythm of a fight.",
    (v, m) => fois([3, 4, 6][v] - m, () => fois(v ? 6 : 4, k => [[2, v ? 20 : 15, 0, 1], [0, v ? 10 : 15, k === (v ? 5 : 3) ? 60 : 0]])), "boxe"],
  ["points", "Points de match", "Match points", "#0EA5E9", "9", "Des efforts de 8 secondes comme un échange, 20 secondes de récupération comme entre deux points : le rythme exact d’un match.", "8-second efforts like a rally, 20 seconds of recovery like between points: the exact rhythm of a match.",
    (v, m) => fois([3, 4, 6][v] - m, () => fois(6, j => [[2, 8, j === 5 ? 120 : 20]])), "tennis padel"],
  ["rsa", "Sprints répétés", "Repeated sprints", "#16A34A", "9–10", "Six sprints de 6 secondes avec 24 secondes pour récupérer : la qualité qui fait la différence en fin de match.", "Six 6-second sprints with 24 seconds to recover: the quality that makes the difference late in a match.",
    (v, m) => fois([2, 3, 4][v] - m, () => fois(6, j => [[2, 6, j === 5 ? 180 : 24]])), "foot basket handball volley"],
  ["intermittent", "Intermittent 15/15", "15/15 intermittent", "#7C3AED", "8", "Quinze secondes vite, quinze secondes lentement, sans t’arrêter : beaucoup de souffle gagné pour peu de temps passé.", "Fifteen seconds fast, fifteen seconds easy, without stopping: a lot of fitness for little time.",
    (v, m) => fois([2, 3, 3][v] - m, () => fois([8, 10, 12][v], j => [[1, 15, 0], [0, 15, j === [8, 10, 12][v] - 1 ? 180 : 0]])), "foot basket handball course ski"],
  ["seuil", "Intervalles au seuil", "Threshold intervals", "#2563EB", "7", "Des efforts de plusieurs minutes, durs mais contrôlés, avec deux minutes de récupération : ils repoussent le moment où tu t’essouffles.", "Efforts of several minutes, hard but controlled, with two minutes of recovery: they push back the point where you run out of breath.",
    (v, m) => fois([3, 4, 5][v] - m, () => [[1, [240, 360, 480][v], 120]]), "course cyclisme natation ski surf escalade"],
  ["facile", "Récupération active", "Active recovery", "#14B8A6", "3", "Un effort continu très facile pour faire circuler le sang et mieux récupérer entre deux séances dures.", "A very easy continuous effort to get the blood flowing and recover better between two hard sessions.",
    (v, m) => fois([3, 4, 6][v] - m, () => [[0, 300, 0]])]];
const cardioPref = () => ({ s: "course", ...lireJSON("cardioSupport", {}) });
const pourSport = (l, grp) => !l || l.split(" ").includes(grp);   // séance ou support réservé à certains sports (liste de sports séparés par des espaces)
const supportDe = (grp, s = cardioPref().s) => SUPPORTS.find(x => x[0] === s && pourSport(x[7], grp)) || SUPPORTS[0];
const duTxt = s => s < 60 ? s + " s" : Math.floor(s / 60) + " min" + (s % 60 ? " " + s % 60 : "");
const zoneRouge = () => { const a = lireProfil().age; return a ? Math.round(zonesFc(a)[0] * .9) : 0; };

function seanceCardio(grp, cle, niv = lireNiv(), moins = 0) {
  const C = CARDIOS.find(c => c[0] === cle), S = supportDe(grp), v = Math.max(0, NIV_RENFO.findIndex(n => n[0] === niv)), id = a => "c_" + S[0] + a, plan = [], blocs = [];
  const bloc = (n, pas, desc) => { const nb = pas.filter(p => p[0]).length, parR = v ? 6 : 4; let k = 0;   // pas marqué (4e valeur) : rafale d'un round
    pas.forEach(([a, d, r, raf]) => { if (a || !nb) k++; plan.push({ id: id(a), d, r, bn: n, lab: raf ? `Round ${Math.ceil(k / parR)}/${nb / parR} · ${L("rafale", "flurry")} ${(k - 1) % parR + 1}/${parR}` : n + " · " + (nb && !a ? L("facile", "easy") : k + "/" + (nb || pas.length)) }); });
    blocs.push([n, Object.entries(pas.reduce((o, [a, d]) => ({ ...o, [a + ":" + d]: (o[a + ":" + d] || 0) + 1 }), {})).map(([q, x]) => [id(+q[0]), (x > 1 ? x + " × " : "") + duTxt(+q.slice(2))]), desc]); };
  bloc(L("Échauffement", "Warm-up"), [[0, 120, 0], [1, 60, 0], [0, 20, 0], [2, 10, 0], [0, 20, 0], [2, 10, 60]], L("4 minutes progressives, avec deux accélérations pour préparer le cœur et les jambes.", "4 progressive minutes with two accelerations to prepare your heart and legs."));
  const corps = C[7](v, moins ? 1 : 0), rep = [...new Set(corps.map(p => p[2]).filter(Boolean))].map(duTxt).join(" / ");
  bloc(L(C[1], C[2]), corps, cle === "facile" ? L("Sans t’arrêter, à une allure où tu peux parler.", "Without stopping, at a pace where you can talk.") : L(`Récupération ${rep} : marche lentement ou arrête-toi, jusqu’à te sentir prêt à repartir aussi fort.`, `Recovery ${rep}: walk slowly or stop, until you feel ready to go just as hard again.`));
  plan[plan.length - 1].r = cle === "facile" ? 0 : 60;
  if (cle !== "facile") bloc(L("Retour au calme", "Cool-down"), [[0, 180, 0]], L("Trois minutes très faciles pour faire redescendre le cœur.", "Three very easy minutes to bring your heart rate down."));
  plan[plan.length - 1].r = 0;
  const total = Math.round(plan.reduce((s, q) => s + q.d + q.r, 0) / 60), zr = zoneRouge(), nv = NIV_RENFO[v], titre = L(C[1], C[2]) + " · " + L(S[1], S[2]);
  const html = `<li class="etude prog-carte-jour" style="--accent:${C[3]}"><div><small><b>${L(S[1], S[2])} · ${L(nv[1], nv[2])}</b></small><small>🎯 ${L(C[5], C[6])}</small>
    <small>❤️ ${cle === "facile" ? L("Reste en zone facile : si tu ne peux plus parler, ralentis.", "Stay in the easy zone: if you can no longer talk, slow down.") : zr ? L(`Zone rouge : ${zr} bpm et plus sur les efforts durs (90 % de ton maximum estimé). Repars quand le cœur est bien redescendu.`, `Red zone: ${zr} bpm and above on hard efforts (90% of your estimated maximum). Go again once your heart rate has come back down.`) : L("Sans ceinture cardio, fie-toi à l’effort ressenti. Avec ta date de naissance dans le profil, l’appli calcule ta zone rouge.", "Without a heart-rate strap, go by perceived effort. With your date of birth in the profile, the app works out your red zone.")}</small>
    <small>💡 ${L(S[5], S[6])}</small>${/course|tapis|cote/.test(S[0]) && alluresVma() ? `<small>🏃 ${alluresVma()}</small>` : ""}</div></li>` + blocs.map(blocHtml).join("");
  return { type: "seance", cat: grp, cardioS: cle, niv: nv[0], fixe: true, couleur: C[3], plan, exercices: plan.map(q => q.id), listeHtml: html, rpe: C[4], total, titre, titreFr: C[1] + " · " + S[1], detail: "" };
}

/* Effort ressenti (0 à 10) noté en fin de séance cardio, gardé avec la séance dans l'historique (« ef ») et comparé à l'effort visé. */
const blocEffort = () => `<div class="carnet ressenti"><h3>💬 ${L("Ton effort ressenti sur 10", "Your perceived effort out of 10")}</h3><p class="sh-aide">${L("0 aucun effort · 5 modéré · 8 très dur · 10 maximum. Effort visé : ", "0 no effort · 5 moderate · 8 very hard · 10 maximum. Target effort: ")}${routine.rpe}</p>
  <div class="ef-choix">${Array.from({ length: 11 }, (_, v) => `<button class="toggle" data-ef="${v}">${v}</button>`).join("")}</div><div id="efRes"></div></div>`;
function brancherEffort() {
  document.querySelectorAll("[data-ef]").forEach(b => b.onclick = () => {
    const v = +b.dataset.ef, h = lireHist(), x = h[h.length - 1], cible = parseInt(routine.rpe); if (!x) return;
    x.ef = v; x.ec = cible; stocker("historique", JSON.stringify(h));
    const ordre = NIV_RENFO.map(n => n[0]), i = ordre.indexOf(x.nv), trois = h.filter(y => y.ef !== undefined && y.ec >= 8 && y.nv === x.nv).slice(-3), vers = trois.length < 3 || i < 0 ? "" : trois.every(y => y.ef <= y.ec - 2) ? ordre[i + 1] : trois.every(y => y.ef > y.ec || y.ef === 10 && y.ec < 9) ? ordre[i - 1] : "";   // 3 séances dures de suite trop faciles ou trop dures → changer de niveau
    document.querySelectorAll("[data-ef]").forEach(y => y.setAttribute("aria-pressed", y === b));
    $("efRes").innerHTML = `<p class="sh-ok">✓ ${cible < 5 ? (v > 4 ? L("Trop soutenu pour une récupération : la prochaine fois, ralentis jusqu’à pouvoir parler.", "Too hard for a recovery session: next time, slow down until you can talk.") : L("Parfait : une vraie séance facile, c’est ce qui te fait récupérer.", "Perfect: a truly easy session is what helps you recover."))
      : v < cible - 1 ? L("Tu avais de la marge : pars plus fort sur chaque effort, ou passe au niveau supérieur.", "You had more in the tank: go harder on each effort, or move up a level.")
      : v > cible + (cible < 9) ? L("Très dur aujourd’hui : garde ce niveau, et soigne ton sommeil avant la prochaine séance dure.", "Very hard today: stay at this level, and look after your sleep before the next hard session.")
      : L("Pile dans la cible. Laisse 48 h avant ta prochaine séance dure.", "Right on target. Leave 48 h before your next hard session.")}</p>` + (vers ? `<p class="sh-aide">${L("Trois séances dures de suite ", "Three hard sessions in a row ")}${ordre.indexOf(vers) > i ? L("en dessous de l’effort visé : le niveau est devenu trop facile.", "below the target effort: this level has become too easy.") : L("au-dessus de l’effort visé : le niveau est trop dur pour l’instant.", "above the target effort: this level is too hard for now.")}</p><button class="toggle" id="efNiv">${L("Passer au niveau", "Switch to level")} ${L(...NIV_RENFO.find(n => n[0] === vers).slice(1, 3))}</button>` : "");
    if ($("efNiv")) $("efNiv").onclick = () => { stocker("niveauRenfo", vers); $("efNiv").outerHTML = `<p class="sh-ok">✓ ${L("C’est noté pour tes prochaines séances.", "Noted for your next sessions.")}</p>`; };
  });
}
function ouvrirCardio(grp = grpCourant || "boxe") {
  const boxe = grp === "boxe", P = cardioPref(), S = supportDe(grp), zr = zoneRouge(), notes = lireHist().filter(x => x.ef !== undefined).slice(-5).reverse();
  outil(boxe ? L("Cardio boxe", "Boxing cardio") : L("Cardio par intervalles", "Interval cardio"), L("Des efforts courts et très intenses, une vraie récupération entre chaque : la façon la plus efficace de gagner du souffle pour ton sport.", "Short, very intense efforts with real recovery in between: the most effective way to build fitness for your sport."),
    `<div class="carnet"><span class="champ-titre">${L("Où t’entraînes-tu aujourd’hui ?", "Where are you training today?")}</span>${chips("cs", SUPPORTS.filter(x => pourSport(x[7], grp)).map(x => [x[0], x[1], x[2]]), S[0])}
      <span class="champ-titre">${L("Ton niveau", "Your level")}</span>${chips("cn", NIV_RENFO.map(n => [n[0], n[1], n[2]]), lireNiv())}
      <p class="sh-aide">${L("Trois règles : échauffe-toi toujours, donne tout sur chaque effort, et ne raccourcis jamais le repos. ", "Three rules: always warm up, give everything on each effort, and never cut the rest short. ")}${zr ? L(`Ta zone rouge commence à ${zr} bpm.`, `Your red zone starts at ${zr} bpm.`) : ""} ${alluresVma() || L("Fais le test navette (Outils → Tests de forme) pour connaître tes allures.", "Take the shuttle test (Tools → Fitness tests) to know your paces.")}</p></div>
     <h2 class="sec">${L("Choisis ta séance", "Choose your session")}</h2><div id="cListe"></div>${notes.length ? `<h2 class="sec">${L("Tes derniers efforts ressentis", "Your latest perceived efforts")}</h2><ul class="carnet ef-liste">${notes.map(x => `<li><span>${x.j.slice(8)}/${x.j.slice(5, 7)} · ${propre(x.t)}</span><b>${x.ef}/10</b></li>`).join("")}</ul>` : ""}
     <p class="prog-avert">${L("Efforts très intenses : demande l’avis d’un médecin en cas de problème de santé, et arrête-toi en cas de douleur dans la poitrine, de vertige ou de malaise. Garde 48 h entre deux séances dures.", "Very intense efforts: ask a doctor if you have a health condition, and stop if you feel chest pain, dizziness or unwell. Leave 48 h between two hard sessions.")}</p>`, () => vueMode(grp));
  const liste = () => { $("cListe").innerHTML = ""; CARDIOS.filter(c => pourSport(c[8], grp)).forEach(c => { const s = seanceCardio(grp, c[0]);
    bouton($("cListe"), `${L(c[1], c[2])} · ${s.total} min`, L(c[5], c[6]), c[3], () => { ROUTINES.cardioS = { ...seanceCardio(grp, c[0]), retour: () => ouvrirCardio(grp) }; CONSEILLES.cardioS = []; ouvrirRoutine("cardioS"); }); }); };
  brancherChips("cs", s => { stocker("cardioSupport", JSON.stringify({ ...P, s })); liste(); }); brancherChips("cn", n => { stocker("niveauRenfo", n); liste(); }); liste();
}
