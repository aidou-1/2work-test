/* ============ OUTILS : bibliothèque, séance express, minuteurs, tests de forme, suivi du corps, calculateurs ============
   Un écran d'accueil (#outils) et un écran générique (#outil) rempli par chaque outil. Données : clés « tests » et « corps »
   (incluses dans la sauvegarde), matériel dans le profil (« materiel »). */
const lire = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
let retourOutil = null;
function outil(titre, sous, html, retourVers) {
  retourOutil = retourVers || ouvrirOutils;
  $("oTitre").textContent = titre; $("oSub").textContent = sous; $("oCorps").innerHTML = html;   // rempli tout de suite : l'outil branche ses boutons sans attendre la transition
  ecran("outil", ecranCourant === "outil" ? undefined : () => scrollTo(0, 0));
}
$("outilRetour").onclick = () => retour(() => retourOutil());
function ouvrirOutils() { ecran("outils"); }
$("nOutils").onclick = () => ecranCourant !== "outils" && ouvrirOutils();
$("otTitre").textContent = L("Outils", "Tools"); $("otSub").textContent = L("Tout ce qui complète tes séances : exercices, minuteurs, tests, mesures et calculs.", "Everything around your workouts: exercises, timers, tests, measurements and calculators.");
[["Bibliothèque d’exercices", "Exercise library", "Les {n} exercices en vidéo, par zone et par matériel", "All {n} exercises on video, by area and equipment", "#2563EB", () => ouvrirBiblio()],
 ["Quick start", "Quick start", "15 min, sans matériel, focus cuisses, très intense… coche et c’est parti", "15 min, no equipment, leg focus, very intense… tick and go", "#0EA5E9", () => ouvrirExpress()],
 ["Minuteurs", "Timers", "Chrono, compte à rebours, EMOM et AMRAP", "Stopwatch, countdown, EMOM and AMRAP", "#D9480F", () => ouvrirMinuteur()],
 ["Mode combat", "Fight mode", "Rounds de boxe avec cloche, repos et enchaînements annoncés", "Boxing rounds with bell, rest and called combinations", "#DC2626", () => ouvrirCombat()],
 ["Retour après blessure", "Back after injury", "Cheville, genou, dos, épaule… 12 séances progressives en 3 phases", "Ankle, knee, back, shoulder… 12 progressive sessions in 3 phases", "#0EA5E9", () => ouvrirProgs(false, "rep")],
 ["Tests de forme", "Fitness tests", "VMA, pompes, squats, gainage, souplesse : mesure tes progrès chaque mois", "Top aerobic speed, push-ups, squats, plank, flexibility: measure your progress every month", "#16A34A", () => ouvrirTests(null)],
 ["Suivi du corps", "Body tracking", "Poids et mensurations, avec leur courbe", "Weight and measurements, with their chart", "#DB2777", () => ouvrirCorps()],
 ["Calculateurs", "Calculators", "Charge maximale (1RM), pourcentages de charge, allures de course", "One-rep max (1RM), load percentages, running paces", "#7C3AED", () => ouvrirCalculs()]]
  .forEach(([f, e, df, de, c, fn]) => bouton($("otListe"), L(f, e), L(df, de).replace("{n}", Object.keys(EXERCICES).length), c, fn));

/* --- Matériel : 8 familles ; le besoin d'un exercice est lu dans son texte « muscles · matériel » (virgule = et, « ou » = au choix) --- */
const FAMILLES_MAT = [["halteres", "Haltères", "Dumbbells", /haltère|dumbbell/i], ["kettlebell", "Kettlebell", "Kettlebell", /kettlebell/i], ["elastique", "Élastique", "Resistance band", /élastique|band/i],
  ["banc", "Banc", "Bench", /banc|bench|pupitre/i], ["traction", "Barre de traction", "Pull-up bar", /barre de traction|pull-up/i], ["barre", "Barre et disques", "Barbell and plates", /barre|\bbar\b|barbell|disque|plate|poids simple|rack/i],
  ["roulette", "Roulette abdos", "Ab wheel", /roulette|wheel/i], ["salle", "Machines et poulies", "Machines and cables", /machine|poulie|presse|press|pulley|cable|corde|rope/i]];
const monMatos = () => lireProfil().materiel || [];
const besoins = id => ((EXERCICES[id].muscles.split(" · ")[1] || "").split(/, ?/).filter(Boolean)).map(x => x.split(/ ou | or /).map(a => (FAMILLES_MAT.find(m => m[3].test(a)) || ["salle"])[0]));
const faisable = (id, dispo) => besoins(id).every(alt => alt.some(k => dispo.includes(k)));
const ZONES = [["tout", "Tout", "All", null], ["bas", "Bas du corps", "Lower body", /quadri|fessier|ischio|mollet|adduct|hanche|cuisse|cheville|glute|hamstring|calf|calves|\bhip|thigh|ankle|quads/i],
  ["haut", "Haut du corps", "Upper body", /pector|épaule|\bdos\b|dorsal|biceps|triceps|trapèze|bras|chest|shoulder|\bback\b|\blats?\b|\barms?\b|trap/i], ["tronc", "Abdos et gainage", "Core", /abdo|gainage|oblique|lombaire|tronc|\bcore\b|\babs\b|lower back/i]];
const dansZone = (id, z) => { const re = ZONES.find(x => x[0] === z)[3]; return !re || re.test(EXERCICES[id].muscles.split(" · ")[0]); };
const chips = (attr, liste, actif) => `<div class="chips">${liste.map(([k, f, e]) => `<button class="toggle" data-${attr}="${k}" aria-pressed="${k === actif}">${L(f, e)}</button>`).join("")}</div>`;
const brancherChips = (attr, fn) => $("oCorps").querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => { $("oCorps").querySelectorAll(`[data-${attr}]`).forEach(x => x.setAttribute("aria-pressed", x === b)); fn(b.dataset[attr]); });
const CHOIX_MAT = [["tous", "Tout matériel", "Any equipment"], ["sans", "Sans matériel", "No equipment"], ["mien", "Mon matériel", "My equipment"]];
const filtreMat = (id, m) => m === "tous" || (m === "sans" ? !EXERCICES[id].mat : faisable(id, monMatos()));

/* --- Bibliothèque d'exercices --- */
function ouvrirBiblio() {
  let z = "tout", m = "tous";
  outil(L("Bibliothèque", "Library"), L("Touche un exercice pour voir sa vidéo et ses consignes.", "Tap an exercise to see its video and cues."),
    `<label class="recherche"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="bRecherche" type="search" placeholder="${T("Rechercher un exercice")}" autocomplete="off"></label>
     ${chips("z", [...ZONES, ["etir", "Étirements", "Stretches"]], z)}${chips("m", CHOIX_MAT, m)}<p class="sh-aide" id="bNb"></p><ul class="list" id="bListe"></ul>`);
  const plat = t => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const maj = () => {
    const q = plat($("bRecherche").value.trim());
    const l = Object.keys(EXERCICES).filter(id => (z === "etir" ? EXERCICES[id].etir : dansZone(id, z)) && filtreMat(id, m) && (!q || plat(EXERCICES[id].nom + " " + EXERCICES[id].muscles + " " + (VOIX[id] || "")).includes(q)));
    $("bNb").textContent = L(`${l.length} exercice${l.length > 1 ? "s" : ""}`, `${l.length} exercise${l.length > 1 ? "s" : ""}`) + (m === "mien" && !monMatos().length ? L(" · indique ton matériel dans Réglages → Mon profil", " · set your equipment in Settings → My profile") : "");
    $("bListe").innerHTML = l.map(id => `<li data-ex="${id}">${vignette(id)}<div><b>${EXERCICES[id].nom}</b><small>${EXERCICES[id].muscles}</small></div><span class="duree">›</span></li>`).join("") || `<li><small>${L("Aucun exercice ne correspond.", "No exercise matches.")}</small></li>`;
  };
  setTimeout(() => { $("bRecherche").oninput = maj; brancherChips("z", v => { z = v; maj(); }); brancherChips("m", v => { m = v; maj(); });
    $("bListe").onclick = e => { const li = e.target.closest("[data-ex]"); if (li) ficheExercice(li.dataset.ex); }; maj(); }, 0);
}
function ficheExercice(id) {
  const e = EXERCICES[id], c = consignes(id);
  ouvrirFeuilleInfo(e.nom, `${e.video ? `<video class="media" src="${e.video}" autoplay loop muted playsinline></video>` : dessiner(e)}<p>${e.description}</p><p class="sh-aide">${e.muscles}</p>
    ${c.length ? `<ol class="prog-obj">${c.map(x => `<li>${x}</li>`).join("")}</ol>` : ""}<button class="primary" id="feCreer">＋ ${L("Créer une séance avec cet exercice", "Build a workout with this exercise")}</button>`);
  $("feCreer").onclick = () => { fermerFeuille(); stocker("routine_perso", JSON.stringify([id])); ouvrirRoutine("perso"); };
}

/* --- Quick start : on coche ses contraintes (temps, matériel, zone, intensité) et le circuit est prêt ; quatre raccourcis en un appui --- */
const INTENSITES = { calme: [30, 30, "Tranquille", "Easy"], normal: [40, 20, "Normale", "Normal"], intense: [45, 15, "Très intense", "Very intense"] };
function composerExpress({ min = 10, z = "tout", m = "sans", int = "normal" }) {   // renvoie faux s'il n'y a pas assez d'exercices
  const dyn = id => /saut|burpee|climber|jump|skater|sprint|explos/i.test(EXERCICES[id].nom + " " + EXERCICES[id].description);
  const pool = Object.keys(EXERCICES).filter(id => !EXERCICES[id].etir && EXERCICES[id].duree >= 40 && dansZone(id, z) && (m === "sans" ? !EXERCICES[id].mat : faisable(id, monMatos())) && (z !== "tout" || ZONES.slice(1).some(x => dansZone(id, x[0]))) && (int !== "calme" || !dyn(id)));
  if (pool.length < 3) return false;
  const hasard = l => l.map(x => [Math.random() - (int === "intense" && dyn(x) ? 1 : 0), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);   // très intense : les exercices dynamiques d'abord
  // tout le corps : on alterne bas, haut et tronc pour ne pas enchaîner deux fois la même zone
  const paniers = z === "tout" ? ZONES.slice(1).map(x => hasard(pool.filter(id => dansZone(id, x[0])))) : [hasard(pool)], choix = [], [effort, pause, f, e] = INTENSITES[int];
  for (let k = 0; choix.length < Math.min(8, pool.length) && k < 60; k++) { const id = paniers[k % paniers.length].shift(); if (id && !choix.includes(id)) choix.push(id); }
  try { localStorage.removeItem("routine_express"); } catch (err) {}
  ROUTINES.express = { type: "seance", retour: () => ouvrirExpress(), titre: "Quick start · " + min + " min" + (int === "normal" ? "" : " · " + L(f, e).toLowerCase()), detail: "", couleur: int === "intense" ? "#DC2626" : "#0EA5E9",
    exercices: Array.from({ length: Math.max(3, Math.round(min * 60 / (effort + pause))) }, (_, i) => choix[i % choix.length]) };
  CONSEILLES.express = pool; ouvrirRoutine("express"); dureeGlobale = effort; repos = pause; ouvrirApercu("express");   // effort et repos de l'intensité choisie (toujours réglables dans l'aperçu)
  return true;
}
/* Accueil : « Tu ne sais pas quoi faire ? » — on choisit seulement son temps, la séance part tout de suite, avec son matériel s'il est enregistré */
function majQuick() {
  const Z = $("quickCarte"); if (!Z) return; const m = monMatos().length ? "mien" : "sans";
  Z.innerHTML = `<div class="quick-corps"><strong>${ico("eclair")} ${L("Tu ne sais pas quoi faire ?", "Not sure what to do?")}</strong><small>${L("Choisis juste ton temps et fonce : l’appli compose une séance avec ce que tu as sous la main" + (m === "mien" ? " (ton matériel compris)." : ", sans matériel."), "Just pick your time and go: the app builds a workout with what you have at hand" + (m === "mien" ? " (including your equipment)." : ", no equipment."))}</small>
    <div class="quick-temps">${[5, 10, 15, 20, 30].map(n => `<button class="toggle" data-qmin="${n}">${n} min</button>`).join("")}</div><button class="lien" id="quickPlus">${L("Plus de choix : zone, intensité, matériel ›", "More options: area, intensity, equipment ›")}</button></div>`;
  Z.querySelectorAll("[data-qmin]").forEach(b => b.onclick = () => ouvrirExpress({ min: +b.dataset.qmin, m })); $("quickPlus").onclick = () => ouvrirExpress();
}
function ouvrirExpress(direct) {
  if (direct && composerExpress(direct)) return;
  const c = { min: 15, z: "tout", m: monMatos().length ? "mien" : "sans", int: "normal" };
  outil("Quick start", L("Coche tes contraintes, l’appli compose la séance. Ou pars en un appui avec un raccourci.", "Tick your constraints and the app builds the workout. Or start in one tap with a shortcut."),
    `<div class="chips">${[[ico("eclair") + " 15 min · " + L("sans matériel", "no equipment"), { min: 15 }], [ico("flamme") + " 10 min · " + L("très intense", "very intense"), { min: 10, int: "intense" }], [ico("cible") + " 15 min · " + L("focus cuisses", "leg focus"), { min: 15, z: "bas" }], [ico("pile") + " 5 min · " + L("recharge", "recharge"), { min: 5 }]]
      .map(([t, o]) => `<button class="toggle" data-pre='${JSON.stringify(o)}'>${t}</button>`).join("")}</div>
     <div class="carnet"><span class="champ-titre">${L("Durée", "Duration")}</span>${chips("d", [5, 10, 15, 20, 30].map(n => [n, n + " min", n + " min"]), c.min)}
      <span class="champ-titre">${L("Matériel", "Equipment")}</span>${chips("m", CHOIX_MAT.slice(1), c.m)}
      <span class="champ-titre">Focus</span>${chips("z", [["tout", "Tout le corps", "Full body"], ["bas", "Cuisses et fessiers", "Legs and glutes"], ["haut", "Haut du corps", "Upper body"], ["tronc", "Abdos", "Core"]], c.z)}
      <span class="champ-titre">${L("Intensité", "Intensity")}</span>${chips("i", Object.entries(INTENSITES).map(([k, v]) => [k, v[2], v[3]]), c.int)}<p class="sh-aide" id="xAide"></p></div>
     <button class="primary" id="xGo">${ico("eclair")} ${L("Composer ma séance", "Build my workout")}</button>`);
  const aide = t => { $("xAide").textContent = t || (c.m === "mien" ? (monMatos().length ? monMatos().map(k => L(...FAMILLES_MAT.find(x => x[0] === k).slice(1, 3))).join(", ") : L("Aucun matériel enregistré : ajoute-le dans Réglages → Mon profil.", "No equipment saved: add it in Settings → My profile.")) : L(`${INTENSITES[c.int][0]} s d’effort, ${INTENSITES[c.int][1]} s de repos.`, `${INTENSITES[c.int][0]} s work, ${INTENSITES[c.int][1]} s rest.`)); };
  const go = o => composerExpress(o) || aide(L("Pas assez d’exercices avec ces contraintes : élargis la zone ou le matériel.", "Not enough exercises with these constraints: widen the area or equipment."));
  brancherChips("d", v => { c.min = +v; }); brancherChips("z", v => { c.z = v; }); brancherChips("m", v => { c.m = v; aide(); }); brancherChips("i", v => { c.int = v; aide(); }); aide();
  $("oCorps").querySelectorAll("[data-pre]").forEach(b => b.onclick = () => go(JSON.parse(b.dataset.pre)));
  $("xGo").onclick = () => go(c);
}

/* ============ AVATAR ET VITALITÉ ============
   Avatar simple réglable dans le profil (« avatar » : genre, peau, couleur et longueur des cheveux). Sa vitalité (0 à 100) suit l'activité :
   chaque séance d'au moins 5 minutes rapporte 26 points, qui fondent de 22 % par jour. En feu à 80, à plat sous 20. */
const PEAUX = ["#FBD9C0", "#F1C09A", "#D99B6C", "#A9683F", "#6E4226"], CHEVEUX = ["#1F1611", "#5A3A22", "#A8632B", "#E3B55B", "#C2410C", "#9CA3AF"];
const lireAvatar = () => ({ g: "g", peau: 1, chev: 1, lon: 0, ...lireProfil().avatar });
function vitalite(h = lireHist(), auj = new Date(jourCle())) {
  return Math.min(100, Math.round(h.reduce((v, x) => { const d = Math.round((auj - new Date(x.j)) / 864e5); return d >= 0 && d < 14 ? v + 26 * Math.min(1, x.s / 300) * Math.pow(.78, d) : v; }, 0)));
}
const etatVita = v => v >= 80 ? ["feu", "En feu 🔥", "On fire 🔥"] : v >= 50 ? ["forme", "Plein d’énergie ⚡", "Full of energy ⚡"] : v >= 20 ? ["baisse", "Énergie en baisse", "Energy dropping"] : ["plat", "À plat 😴", "Drained 😴"];
function avatarSvg(v = vitalite(), a = lireAvatar()) {   // buste : la tête du personnage (js/moi.js) et le haut qu'il porte
  const e = etatVita(v)[0], [dos, visage] = tetePerso(a, e), tee = article(a.tee) || article("t0");
  return `<svg class="avatar av-${e}" viewBox="0 0 120 130" aria-hidden="true">
    ${e === "feu" ? `<g class="av-flammes"><path d="M60 2c6 14 34 22 34 56 0 10-4 18-8 24H34c-4-6-8-14-8-24C26 30 50 22 60 2z" fill="#F97316"/><path d="M60 16c4 10 22 16 22 40 0 8-3 14-6 18H44c-3-4-6-10-6-18 0-22 16-28 22-40z" fill="#FDE047"/></g>` : e === "forme" ? `<circle class="av-aura" cx="60" cy="58" r="50" fill="none" stroke="#FACC15" stroke-width="3" stroke-dasharray="6 9"/>` : ""}
    ${dos}<path d="M22 130c0-26 16-36 38-36s38 10 38 36z" fill="${tee[5]}"/><path d="M50 92h20v8q-10 8-20 0z" fill="${PEAUX[a.peau] || PEAUX[1]}"/>${visage}</svg>`;
}
function majVitalite() {   // carte du menu : avatar, barre de vitalité et série (les 5 minutes pour la recharger : carte Quick start juste en dessous)
  const Z = $("vitaCarte"); if (!Z) return; const v = vitalite(), e = etatVita(v), fait = lireHist().some(x => x.j === jourCle()), sr = series(lireHist());
  Z.innerHTML = `<button class="vita-av" id="vitaAv" aria-label="${L("Modifier mon avatar", "Edit my avatar")}">${avatarSvg(v)}</button><div class="vita-txt"><strong>${L(e[1], e[2])}</strong><div class="vita-barre vb-${e[0]}" role="progressbar" aria-label="${L("Vitalité", "Vitality")}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(4, v)}%"></i></div>
    <small>${L("Vitalité", "Vitality")} ${v} % · 🔥 ${sr.cur} ${L(sr.cur > 1 ? "jours d’affilée" : "jour d’affilée", sr.cur > 1 ? "days in a row" : "day in a row")}${sr.joker ? " · 🛡️" : ""} · ${fait ? L("rechargée aujourd’hui, reviens demain", "recharged today, come back tomorrow") : v >= 80 ? L("garde le feu allumé", "keep the fire burning") : L("5 minutes suffisent pour la remonter", "5 minutes is enough to raise it")}</small></div>`;
  $("vitaAv").onclick = () => ouvrirMoi();
}
function blocAvatar() {   // profil : le personnage et sa vitalité ; l'apparence se règle dans l'onglet Moi
  const v = vitalite(), e = etatVita(v);
  return `<div class="carnet avatar-edit"><div class="vita-av grand">${avatarSvg(v)}</div><div><strong>${L(e[1], e[2])} · ${v} %</strong><div class="vita-barre vb-${e[0]}"><i style="width:${Math.max(4, v)}%"></i></div>
    <small class="sh-aide">${L("Sa vitalité monte à chaque séance (5 minutes suffisent) et redescend sans activité.", "Vitality rises with every workout (5 minutes is enough) and drops without activity.")}</small></div>
    <button class="toggle contour" id="pfMoi" style="grid-column:1/-1">${L("Personnaliser mon personnage", "Customise my character")}</button></div>`;
}
const brancherAvatar = () => { $("pfMoi").onclick = () => { moiVue = "apparence"; essai = ""; ouvrirMoi(); }; };

/* --- Minuteurs libres : chrono, compte à rebours, EMOM (un départ par minute), AMRAP (un maximum de tours dans le temps) ; calés sur l'heure réelle --- */
let mn = { type: "chrono", min: 5, t0: 0, cumul: 0, marche: false, tours: 0, sec: -1 };
const mnEcoule = () => (mn.cumul + (mn.marche ? Date.now() - mn.t0 : 0)) / 1000;
const mmss = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
function ouvrirMinuteur() {
  clearInterval(tMin); mn = { ...mn, t0: 0, cumul: 0, marche: false, tours: 0, sec: -1 };
  outil(L("Minuteurs", "Timers"), L("Calés sur l’horloge du téléphone : ils restent justes même si tu changes d’appli.", "Synced to the phone clock: they stay accurate even if you switch apps."),
    `${chips("t", [["chrono", "Chrono", "Stopwatch"], ["rebours", "Compte à rebours", "Countdown"], ["emom", "EMOM", "EMOM"], ["amrap", "AMRAP", "AMRAP"]], mn.type)}
     <p class="sh-aide" id="mnAide"></p>
     <div class="reglage" id="mnRegl"><label>${L("Durée", "Duration")}<small>${L("En minutes", "In minutes")}</small></label><div class="stepper"><button id="mnMoins" aria-label="−1 min">−</button><output id="mnMin"></output><button id="mnPlus" aria-label="+1 min">+</button></div></div>
     <p class="count" id="mnLab"></p><div class="time petit" id="mnTemps">0:00</div>
     <button class="plus-repos hidden" id="mnTour"></button>
     <div class="controls" style="grid-template-columns:1fr 1.6fr"><button id="mnZero">${L("Remettre à zéro", "Reset")}</button><button id="mnGo" class="main"></button></div>`);
  const AIDES = { chrono: ["Mesure une durée libre.", "Time anything."], rebours: ["Sonne à la fin du temps choisi, avec 3 bips d’alerte.", "Rings at the end of the chosen time, with 3 warning beeps."],
    emom: ["« Every Minute On the Minute » : à chaque cloche, fais tes répétitions puis récupère jusqu’à la minute suivante.", "Every Minute On the Minute: at each bell, do your reps then rest until the next minute."],
    amrap: ["« As Many Rounds As Possible » : enchaîne un maximum de tours dans le temps, et touche « + 1 tour » à chaque tour fini.", "As Many Rounds As Possible: complete as many rounds as you can in the time, and tap “+ 1 round” after each one."] };
  const aff = () => {
    const e = mnEcoule(), tot = mn.min * 60, fini = mn.type !== "chrono" && e >= tot, s = Math.floor(e);
    if (mn.type === "chrono") { $("mnTemps").textContent = mmss(e) + "." + Math.floor(e * 10 % 10); $("mnLab").textContent = ""; }
    else if (mn.type === "emom") { $("mnTemps").textContent = fini ? "0:00" : mmss(Math.ceil(60 - e % 60)); $("mnLab").textContent = L("Minute", "Minute") + " " + Math.min(mn.min, Math.floor(e / 60) + 1) + "/" + mn.min; }
    else { $("mnTemps").textContent = mmss(Math.max(0, Math.ceil(tot - e))); $("mnLab").textContent = mn.type === "amrap" ? L("Tours", "Rounds") + " : " + mn.tours : ""; }
    if (mn.marche && s !== mn.sec) {   // une fois par seconde : bips d'alerte et cloche
      mn.sec = s; const reste = mn.type === "emom" ? 60 - s % 60 : tot - s;
      if (mn.type !== "chrono" && !fini && reste <= 3 && reste > 0) sons.alerte();
      if (mn.type === "emom" && s > 0 && s % 60 === 0 && !fini) sons.change();
    }
    if (fini && mn.marche) { mn.cumul = tot * 1000; mn.marche = false; clearInterval(tMin); sons.change(); garderEcran(false); mnBilan(); }
    $("mnGo").textContent = mn.marche ? T("Pause") : fini ? L("Terminé ✓", "Done ✓") : e > 0 ? T("Reprendre") : L("Démarrer", "Start");
    $("mnGo").disabled = fini;
  };
  const mnBilan = () => {   // EMOM et AMRAP comptent comme une séance dans l'historique
    if (!["emom", "amrap"].includes(mn.type)) return;
    const h = lireHist(); h.push({ j: jourCle(), hr: new Date().getHours(), k: mn.type, t: mn.type.toUpperCase() + " " + mn.min + " min", m: "minuteur", s: mn.min * 60, n: mn.type === "amrap" ? mn.tours : mn.min, c: "", b: 0, p: 0, g: 0, tb: 0, nv: "", e: [] });
    stocker("historique", JSON.stringify(h.slice(-3000))); verifierTrophees();
    $("mnLab").textContent = mn.type === "amrap" ? L(`Bravo : ${mn.tours} tour${mn.tours > 1 ? "s" : ""} en ${mn.min} min, ajouté à ton historique.`, `Well done: ${mn.tours} round${mn.tours > 1 ? "s" : ""} in ${mn.min} min, added to your history.`) : L(`Bravo : ${mn.min} minutes tenues, ajouté à ton historique.`, `Well done: ${mn.min} minutes done, added to your history.`);
  };
  const regler = () => { $("mnMin").textContent = mn.min + " min"; $("mnRegl").classList.toggle("hidden", mn.type === "chrono"); $("mnTour").classList.toggle("hidden", mn.type !== "amrap"); $("mnTour").textContent = L("+ 1 tour", "+ 1 round"); $("mnAide").textContent = L(...AIDES[mn.type]); aff(); };
  const zero = () => { clearInterval(tMin); mn.cumul = 0; mn.marche = false; mn.tours = 0; mn.sec = -1; garderEcran(false); aff(); };
  setTimeout(() => {
    brancherChips("t", v => { mn.type = v; zero(); regler(); });
    $("mnMoins").onclick = () => { mn.min = Math.max(1, mn.min - 1); zero(); regler(); }; $("mnPlus").onclick = () => { mn.min = Math.min(90, mn.min + 1); zero(); regler(); };
    $("mnZero").onclick = zero; $("mnTour").onclick = () => { if (mn.marche) { mn.tours++; aff(); } };
    $("mnGo").onclick = () => { if (mn.marche) { mn.cumul += Date.now() - mn.t0; mn.marche = false; clearInterval(tMin); garderEcran(false); } else { mn.t0 = Date.now(); mn.marche = true; if (mnEcoule() < 1) sons.change(); tMin = setInterval(aff, 100); garderEcran(true); } aff(); };
    regler();
  }, 0);
}

/* --- Courbe simple (tests, poids) : valeurs dans l'ordre chronologique --- */
function courbe(v, coul = "#6366F1") {
  if (v.length < 2) return "";
  const mi = Math.min(...v), ma = Math.max(...v), W = 300, H = 90, x = i => 8 + i * (W - 16) / (v.length - 1), y = n => H - 10 - (ma === mi ? .5 : (n - mi) / (ma - mi)) * (H - 22);
  return `<svg class="graphe" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${v.map((n, i) => x(i).toFixed(1) + "," + y(n).toFixed(1)).join(" ")}" fill="none" stroke="${coul}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${x(v.length - 1)}" cy="${y(v[v.length - 1])}" r="4" fill="${coul}"/></svg>`;
}
const dateCourte = j => { const [a, m, d] = j.split("-"); return new Date(a, m - 1, d).toLocaleDateString(L("fr-FR", "en-GB"), { day: "numeric", month: "short" }); };

/* --- Tests de forme : à refaire environ une fois par mois, dans les mêmes conditions --- */
// [id, nom FR, EN, unité FR, EN, protocole FR, EN]
const TESTS = [["pompes", "Pompes max", "Max push-ups", "rép.", "reps", "Un maximum de pompes sans pause, poitrine près du sol à chaque fois. Sur les genoux si besoin, mais toujours pareil d’un test à l’autre.", "As many push-ups as you can without pausing, chest close to the floor each time. On your knees if needed, but always the same way from one test to the next."],
  ["squats", "Squats en 1 minute", "Squats in 1 minute", "rép.", "reps", "Le plus de squats complets en 60 secondes, cuisses parallèles au sol. Lance le compte à rebours 1 min dans Minuteurs.", "As many full squats as you can in 60 seconds, thighs parallel to the floor. Use the 1-minute countdown in Timers."],
  ["planche", "Gainage planche", "Plank hold", "s", "s", "Planche sur les avant-bras, corps aligné : arrête le chrono dès que le bassin descend ou monte.", "Forearm plank, body in a straight line: stop the stopwatch as soon as your hips drop or rise."],
  ["chaise", "Chaise contre le mur", "Wall sit", "s", "s", "Dos au mur, cuisses à l’horizontale, mains hors des cuisses : tiens le plus longtemps possible.", "Back against the wall, thighs horizontal, hands off your thighs: hold as long as you can."],
  ["souplesse", "Souplesse (doigts-orteils)", "Flexibility (sit and reach)", "cm", "cm", "Assis jambes tendues, penche-toi sans à-coup : distance entre le bout des doigts et les orteils. Positif si tu dépasses les orteils, négatif sinon.", "Sitting with straight legs, lean forward smoothly: distance between fingertips and toes. Positive if you reach past your toes, negative otherwise."]];
TESTS.unshift(["navette", "Test navette (VMA)", "Shuttle test (top aerobic speed)", "km/h", "km/h", "Allers-retours sur 20 mètres au rythme des bips, de plus en plus vite : le test guidé note tout seul ta vitesse maximale aérobie.", "20-metre shuttles in time with the beeps, faster and faster: the guided test records your top aerobic speed by itself."]);
const lireTests = () => lireJSON("tests", []);
let retourTests = null;
function ouvrirTests(rv) {
  if (rv !== undefined && rv !== 0) retourTests = rv || null;
  const R = lireTests();
  outil(L("Tests de forme", "Fitness tests"), L("Refais chaque test environ une fois par mois, échauffé et dans les mêmes conditions : c’est la courbe qui compte, pas le chiffre du jour.", "Repeat each test about once a month, warmed up and in the same conditions: the trend matters, not today’s number."),
    TESTS.map(([id, f, e, uf, ue, pf, pe]) => { const l = R.filter(x => x.id === id), d = l[l.length - 1], best = l.length ? Math.max(...l.map(x => x.v)) : null, age = d ? joursDepuis(d.j) : null;
      return `<div class="carnet"><h3>${L(f, e)}</h3><p>${L(pf, pe)}</p>${courbe(l.map(x => x.v), "#16A34A")}
        <p class="sh-ok">${d ? L(`Dernier : ${d.v} ${uf} (${dateCourte(d.j)}) · record : ${best} ${uf}`, `Last: ${d.v} ${ue} (${dateCourte(d.j)}) · best: ${best} ${ue}`) + (l.length > 1 ? " · " + (d.v - l[0].v >= 0 ? "+" : "") + (d.v - l[0].v) + " " + L("depuis le début", "since the start") : "") : L("Pas encore de mesure.", "No result yet.")}${age !== null && age >= 28 ? " · " + L("à refaire !", "time to retest!") : ""}</p>
        ${id === "navette" ? `<button class="primary" id="navGo">${L("Lancer le test guidé", "Start the guided test")}</button>` : ""}
        <div class="favForm"><input class="choixVoix" type="number" inputmode="decimal" step="${id === "navette" ? .5 : 1}" data-test="${id}" placeholder="${L("Résultat en", "Result in")} ${L(uf, ue)}"><button class="toggle" data-ok="${id}">${L("Noter", "Save")}</button></div></div>`; }).join(""), retourTests || undefined);
  $("navGo").onclick = ouvrirNavette;
  setTimeout(() => $("oCorps").querySelectorAll("[data-ok]").forEach(b => b.onclick = () => {
    const v = parseFloat($("oCorps").querySelector(`[data-test="${b.dataset.ok}"]`).value); if (!Number.isFinite(v) || v < -60 || v > 2000) return;
    stocker("tests", JSON.stringify([...lireTests().filter(x => !(x.id === b.dataset.ok && x.j === jourCle())), { j: jourCle(), id: b.dataset.ok, v }])); const y = scrollY; ouvrirTests(0); setTimeout(() => scrollTo(0, y), 60); }), 0);
}

/* --- Suivi du corps : poids et mensurations (une mesure par jour), courbe du poids --- */
const MESURES = [["poids", "Poids", "Weight", "kg"], ["taille", "Tour de taille", "Waist", "cm"], ["poitrine", "Poitrine", "Chest", "cm"], ["hanches", "Hanches", "Hips", "cm"], ["bras", "Bras", "Arm", "cm"], ["cuisse", "Cuisse", "Thigh", "cm"]];
const lireCorps = () => lireJSON("corps", []);
function ouvrirCorps() {
  const C = lireCorps(), der = C[C.length - 1] || {}, pds = C.filter(x => x.poids), p0 = pds[0], p1 = pds[pds.length - 1];
  outil(L("Suivi du corps", "Body tracking"), L("Mesure-toi toujours au même moment (le matin à jeun, par exemple). Ces données restent sur ton téléphone.", "Always measure at the same time (in the morning before eating, for instance). This data stays on your phone."),
    `<div class="carnet"><h3>${L("Nouvelle mesure", "New entry")}</h3><p>${L("Remplis seulement ce que tu veux suivre.", "Fill in only what you want to track.")}</p>
      <div class="champ-duo">${MESURES.map(([k, f, e, u]) => `<label class="champ"><span>${L(f, e)} (${u})</span><input type="number" inputmode="decimal" step="0.1" data-mes="${k}" placeholder="${der[k] || "—"}"></label>`).join("")}</div>
      <button class="primary" id="coOk">${L("Enregistrer la mesure du jour", "Save today’s entry")}</button><p class="pf-ok" id="coEtat"></p></div>
     ${pds.length ? `<div class="carnet"><h3>${L("Poids", "Weight")}</h3>${courbe(pds.map(x => x.poids), "#DB2777")}<p class="sh-ok">${p1.poids} kg (${dateCourte(p1.j)})${pds.length > 1 ? " · " + (p1.poids - p0.poids >= 0 ? "+" : "") + (p1.poids - p0.poids).toFixed(1) + " kg " + L("depuis le", "since") + " " + dateCourte(p0.j) : ""}</p></div>` : ""}
     ${C.length ? `<div class="carnet"><h3>${L("Historique", "History")}</h3><table class="params"><tr><th></th>${MESURES.map(m => `<th>${L(m[1], m[2]).split(" ").pop()}</th>`).join("")}<th></th></tr>${C.slice(-12).reverse().map(x => `<tr><td>${dateCourte(x.j)}</td>${MESURES.map(m => `<td>${x[m[0]] ?? "·"}</td>`).join("")}<td><button class="suppr" data-del="${x.j}" aria-label="${L("Supprimer", "Delete")}">×</button></td></tr>`).join("")}</table></div>` : ""}`);
  setTimeout(() => {
    $("coOk").onclick = () => { const e = { j: jourCle() }; $("oCorps").querySelectorAll("[data-mes]").forEach(i => { const v = parseFloat(i.value); if (v > 0 && v < 400) e[i.dataset.mes] = Math.round(v * 10) / 10; });
      if (Object.keys(e).length < 2) { $("coEtat").textContent = L("Saisis au moins une valeur.", "Enter at least one value."); return; }
      const auj = lireCorps().find(x => x.j === e.j) || {};
      stocker("corps", JSON.stringify([...lireCorps().filter(x => x.j !== e.j), { ...auj, ...e }].sort((a, b) => a.j < b.j ? -1 : 1).slice(-730)));
      if (e.poids >= 30 && e.poids <= 250) ecrireProfil("poids", e.poids);   // les calories des séances suivent le dernier poids
      ouvrirCorps(); };
    $("oCorps").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { stocker("corps", JSON.stringify(lireCorps().filter(x => x.j !== b.dataset.del))); ouvrirCorps(); });
  }, 0);
}

/* --- Calculateurs : 1RM (moyenne Epley / Brzycki) et charges par pourcentage ; allures de course (prévisions de Riegel) --- */
function ouvrirCalculs() {
  outil(L("Calculateurs", "Calculators"), L("Des estimations pour régler tes charges et tes allures : à ajuster selon tes sensations.", "Estimates to set your loads and paces: adjust to how you feel."),
    `<div class="carnet"><h3>${ico("haltere")} ${L("Charge maximale (1RM)", "One-rep max (1RM)")}</h3><p>${L("Entre une série réussie proche de l’échec (10 répétitions au plus).", "Enter a set taken close to failure (10 reps at most).")}</p>
      <div class="champ-duo"><label class="champ"><span>${L("Charge (kg)", "Load (kg)")}</span><input id="rmKg" type="number" inputmode="decimal" step="0.5" placeholder="60"></label><label class="champ"><span>${L("Répétitions", "Reps")}</span><input id="rmReps" type="number" inputmode="numeric" min="1" max="15" placeholder="8"></label></div><div id="rmRes"></div></div>
     <div class="carnet"><h3>${ico("course")} ${L("Allures de course", "Running paces")}</h3><p>${L("Entre une course récente courue à fond.", "Enter a recent all-out run.")}</p>
      <div class="champ-duo"><label class="champ"><span>${L("Distance (km)", "Distance (km)")}</span><input id="alKm" type="number" inputmode="decimal" step="0.1" placeholder="5"></label><label class="champ"><span>${L("Temps (min:s)", "Time (min:s)")}</span><input id="alT" type="text" inputmode="numeric" placeholder="25:00"></label></div><div id="alRes"></div></div>`);
  setTimeout(() => {
    const rm = () => { const kg = parseFloat($("rmKg").value), r = parseInt($("rmReps").value, 10); if (!(kg > 0) || !(r >= 1 && r <= 15)) { $("rmRes").innerHTML = ""; return; }
      const max = r === 1 ? kg : (kg * (1 + r / 30) + kg * 36 / (37 - r)) / 2, arr = x => Math.round(x * 2) / 2;
      $("rmRes").innerHTML = `<p class="sh-ok">${L("1RM estimé", "Estimated 1RM")} : <b>${arr(max)} kg</b>${r > 10 ? " · " + L("moins fiable au-delà de 10 répétitions", "less reliable beyond 10 reps") : ""}</p>
        <table class="params"><tr><th>%</th><th>${L("Charge", "Load")}</th><th>${L("Répétitions visées", "Target reps")}</th><th>${L("Travail", "Focus")}</th></tr>${[[95, "2", "Force max", "Max strength"], [90, "3-4", "Force", "Strength"], [85, "5-6", "Force", "Strength"], [80, "7-8", "Muscle", "Muscle"], [75, "9-10", "Muscle", "Muscle"], [70, "11-12", "Muscle", "Muscle"], [60, "15-20", "Endurance", "Endurance"], [50, "20+", "Technique, vitesse", "Technique, speed"]]
          .map(([p, n, f, e]) => `<tr><td>${p} %</td><td>${arr(max * p / 100)} kg</td><td>${n}</td><td>${L(f, e)}</td></tr>`).join("")}</table>`; };
    const al = () => { const km = parseFloat($("alKm").value), m = $("alT").value.trim().split(/[:h' ]+/).filter(Boolean).map(Number), t = m.length === 3 ? m[0] * 3600 + m[1] * 60 + m[2] : m.length === 2 ? m[0] * 60 + m[1] : m[0] * 60;
      if (!(km > 0) || !(t > 0) || m.some(isNaN)) { $("alRes").innerHTML = ""; return; }
      const allure = s => mmss(Math.round(s)) + " /km", duree = s => s >= 3600 ? Math.floor(s / 3600) + " h " + String(Math.floor(s % 3600 / 60)).padStart(2, "0") : mmss(Math.round(s)), prev = d => t * Math.pow(d / km, 1.06), a10 = prev(10) / 10, age = lireProfil().age, z = age ? zonesFc(age)[1] : null, fc = i => z ? ` · ${z[i][0]}–${z[i][1]} bpm` : "";
      $("alRes").innerHTML = `<p class="sh-ok">${L("Allure", "Pace")} : <b>${allure(t / km)}</b> · ${(km / t * 3600).toFixed(1)} km/h</p>
        <table class="params"><tr><th>${L("Prévision", "Prediction")}</th><th>${L("Temps", "Time")}</th><th>${L("Allure", "Pace")}</th></tr>${[[5, "5 km"], [10, "10 km"], [21.0975, L("Semi", "Half")], [42.195, "Marathon"]].map(([d, n]) => `<tr><td>${n}</td><td>${duree(prev(d))}</td><td>${allure(prev(d) / d)}</td></tr>`).join("")}</table>
        <table class="params"><tr><th>${L("Séance", "Session")}</th><th>${L("Allure repère", "Guide pace")}</th></tr>
          <tr><td>${L("Footing facile", "Easy run")}</td><td>${allure(a10 + 60)} – ${allure(a10 + 90)}${fc(1)}</td></tr><tr><td>${L("Seuil", "Threshold")}</td><td>${allure(prev(21.0975) / 21.0975)}${fc(3)}</td></tr><tr><td>${L("Fractionné", "Intervals")}</td><td>${allure(prev(5) / 5 - 5)}${fc(4)}</td></tr></table>
        <p class="sh-aide">${L("Prévisions par la formule de Riegel, fiables si tu es entraîné pour la distance visée." + (z ? "" : " Indique ton âge dans Mon profil pour voir les fréquences cardiaques."), "Predictions use Riegel’s formula, reliable if you are trained for the target distance." + (z ? "" : " Add your age in My profile to see heart rates."))}</p>`; };
    ["rmKg", "rmReps"].forEach(i => { $(i).oninput = rm; }); ["alKm", "alT"].forEach(i => { $(i).oninput = al; });
  }, 0);
}

/* ============ DÉFIER UN AMI : une séance envoyée par lien (?defi=…), ouverte telle quelle dans son appli ============ */
const coderLien = d => btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), decoderLien = c => JSON.parse(decodeURIComponent(escape(atob(c.replace(/-/g, "+").replace(/_/g, "/")))));
async function partagerLien(texte, url, b) { try { if (navigator.share) await navigator.share({ title: "2 WORK", text: texte, url }); else { await navigator.clipboard.writeText(texte + " " + url); b.textContent = L("✓ Lien copié", "✓ Link copied"); } } catch (e) {} }
function lienDefi() {
  const d = { t: routine.defi ? routine.titre.split(" · ").pop() : routine.titre, i: ids, d: dureeGlobale, r: mode === "seance" || mode === "salle" ? repos : 0, de: lireProfil().nom || "", dj: routine.defi ? 1 : 0 };
  return location.origin + location.pathname + "?defi=" + coderLien(d);
}
$("amiBtn").onclick = async () => {
  const url = lienDefi(), n = lireProfil().nom, t = routine.titre, texte = routine.defi
    ? L(`${n || "Ton ami"} te défie de réussir le défi du jour sur 2 WORK : « ${t.split(" · ").pop()} ». À toi de jouer !`, `${n || "Your friend"} challenges you to complete today’s daily challenge on 2 WORK: “${t.split(" · ").pop()}”. Your turn!`)
    : L(`${n || "Ton ami"} te défie de réussir sa séance sur 2 WORK : « ${t} », ${ids.length} exercices. Relève le défi !`, `${n || "Your friend"} challenges you to complete their workout on 2 WORK: “${t}”, ${ids.length} exercises. Take the challenge!`);
  return partagerLien(texte, url, $("amiBtn"));
};
function ouvrirDefiAmi(code) {   // renvoie vrai si le lien est valide
  try {
    const d = decoderLien(code), de = propre(d.de || "").slice(0, 20);
    if (!Array.isArray(d.i) || !d.i.length || d.i.length > 80 || !d.i.every(id => EXERCICES[id]) || !(d.d >= 5 && d.d <= 120) || !(d.r >= 0 && d.r <= 300)) return false;
    ROUTINES.ami = { type: "seance", fixe: true, amiDj: !!d.dj, retour: () => ecran("menu"), ami: de, titre: (de ? L("Défi de ", "Challenge from ") + de + " · " : L("Défi · ", "Challenge · ")) + propre(d.t || "").slice(0, 60), detail: "", couleur: "#DB2777", duree: d.d, repos: d.r, exercices: d.i };
    CONSEILLES.ami = d.i; history.replaceState(null, "", location.pathname); finBienvenue(); afficherEcran("menu"); ouvrirRoutine("ami"); return true;
  } catch (e) { return false; }
}
setTimeout(() => { const c = new URLSearchParams(location.search).get("defi"); if (c) ouvrirDefiAmi(c); }, 0);

/* ============ RAPPELS PAR NOTIFICATION ============
   Les jours planifiés, à l'heure du rappel, si la séance du jour n'est pas faite. Le web ne sait pas programmer une notification à heure
   fixe appli fermée : le rappel part quand l'appli est ouverte ou en arrière-plan, et sur Android (appli installée) le service worker
   vérifie aussi de lui-même quelques fois par jour (Periodic Background Sync). Sur iPhone, l'agenda (.ics) reste le rappel fiable. */
const rappelActif = () => lire("rappelNotif") === "1" && "Notification" in window && Notification.permission === "granted";
const msgRappel = () => { const n = lireProfil().nom, s = series(lireHist()).cur;   // un message différent chaque jour, avec le prénom et la série
  return duJour([L(`${n ? n + ", c" : "C"}’est l’heure de ta séance 💪`, `${n ? n + ", it" : "It"}’s time for your workout 💪`), L(`Ta séance t’attend${n ? ", " + n : ""} 🔥`, `Your workout is waiting${n ? ", " + n : ""} 🔥`),
    s > 1 ? L(`Jour ${s + 1} de ta série : on continue ?`, `Day ${s + 1} of your streak: shall we go on?`) : L("Dix minutes suffisent pour commencer 🙌", "Ten minutes is enough to get started 🙌"), L(`Ton futur toi te dira merci${n ? ", " + n : ""} 🙌`, `Your future self will thank you${n ? ", " + n : ""} 🙌`)]); };
const msgSoir = (v, s) => [L(`⚡ La vitalité de ton avatar est à ${v} %`, `⚡ Your avatar’s vitality is at ${v}%`), L("Juste 5 minutes suffisent pour la faire remonter" + (s > 0 ? ` et sauver ta série de ${s} jour${s > 1 ? "s" : ""}` : "") + ". On y va ?", "Just 5 minutes is enough to raise it" + (s > 0 ? ` and save your ${s}-day streak` : "") + ". Shall we?")];
async function majRappelSW() {   // copie pour le service worker (il n'a pas accès au stockage de la page)
  try { const P = lirePlanning(), c = await caches.open("2work-etat"), s = series(lireHist()).cur;
    await c.put("rappel.json", new Response(JSON.stringify({ actif: rappelActif(), heure: P && P.heure || "18:00", jours: Object.fromEntries(semaine().map(x => [x.j, x.s.t])), fait: lireHist().some(h => h.j === jourCle()) ? jourCle() : "",
      envoye: lire("rappelEnvoye") || "", titre: msgRappel(), envoyeSoir: lire("rappelSoir") || "", hist: lireHist().slice(-40).map(x => [x.j, x.s]), soir: msgSoir("{v}", 0) })));
  } catch (e) {}
}
async function verifierRappel() {
  if (!rappelActif() || lireHist().some(h => h.j === jourCle())) return;
  const P = lirePlanning(), x = semaine().find(s => s.j === jourSemaine()), d = new Date(), hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"), s = series(lireHist()).cur;
  const envoyer = async (cle, titre, body, data) => { try { const r = await navigator.serviceWorker.getRegistration(); if (!r) return; await r.showNotification(titre, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "2work-" + cle + "-" + jourCle(), data }); stocker(cle, jourCle()); majRappelSW(); } catch (e) {} };
  if (P && x && hm >= (P.heure || "18:00") && lire("rappelEnvoye") !== jourCle()) envoyer("rappelEnvoye", msgRappel(), x.s.t + " · " + x.s.s, "./?go=semaine");
  else if (hm >= "19:00" && vitalite() < 70 && lire("rappelSoir") !== jourCle()) envoyer("rappelSoir", ...msgSoir(vitalite(), s), "./?go=express5");   // le soir, sans séance : 5 minutes pour recharger l'avatar
}
async function basculerRappel() {
  if (rappelActif()) stocker("rappelNotif", "0");
  else { if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await navigator.serviceWorker.getRegistration())) return L("Notifications indisponibles dans ce navigateur : utilise les rappels de l’agenda.", "Notifications are unavailable in this browser: use the calendar reminders.");
    if (await Notification.requestPermission() !== "granted") return L("Notifications refusées : autorise-les pour 2 WORK dans les réglages du téléphone.", "Notifications denied: allow them for 2 WORK in your phone settings.");
    stocker("rappelNotif", "1");
    try { const r = await navigator.serviceWorker.getRegistration(); if (r && r.periodicSync) await r.periodicSync.register("rappel", { minInterval: 3 * 36e5 }); } catch (e) {} }
  await majRappelSW(); verifierRappel(); return "";
}
function blocRappel(msg) {   // sous le planning de la semaine
  const Z = $("plNotif"); if (!Z) return; const on = rappelActif();
  Z.innerHTML = `<div class="carnet"><div class="reglage-ligne"><span><b>${ico("cloche")} ${L("Notifications de rappel", "Reminder notifications")}</b><small>${L("Rappel les jours prévus, et le soir si la vitalité de ton avatar baisse : 5 minutes pour la recharger", "Reminder on planned days, and in the evening if your avatar’s vitality drops: 5 minutes to recharge it")}</small></span><button class="toggle" id="plNotifBtn" aria-pressed="${on}">${on ? L("Activées", "On") : L("Activer", "Turn on")}</button></div>
    <p class="sh-aide">${msg || (iOS() ? L("Sur iPhone, la notification ne part que si l’appli installée a été ouverte dans la journée : garde aussi les rappels de l’agenda.", "On iPhone, the notification is only sent if the installed app was opened that day: keep the calendar reminders too.") : L("Sur Android avec l’appli installée, le rappel arrive même appli fermée, à quelques heures près selon le téléphone. Pour une heure exacte, ajoute aussi les rappels à ton agenda.", "On Android with the app installed, the reminder arrives even when the app is closed, within a few hours depending on the phone. For an exact time, also add the reminders to your calendar."))}</p></div>`;
  $("plNotifBtn").onclick = async () => blocRappel(await basculerRappel());
}
setInterval(verifierRappel, 60000); document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && verifierRappel()); setTimeout(() => { majRappelSW(); verifierRappel(); }, 3000);

bouton($("choicesP"), "Quick start", L("15 min, sans matériel, focus cuisses, très intense… coche et c’est parti", "15 min, no equipment, leg focus, very intense… tick and go"), "#0EA5E9", () => ouvrirExpress());
$("choicesP").insertBefore($("choicesP").lastChild, $("choicesP").children[1]);

/* ============ CEINTURE CARDIO BLUETOOTH ============
   Web Bluetooth (Chrome et Edge sur Android et ordinateur ; absent de Safari, donc de l'iPhone) : service standard « heart_rate »
   des ceintures et brassards. Fréquence en direct pendant la séance, avec la zone si l'âge est dans le profil ; moyenne et maximum
   gardés avec la séance. Rien ne quitte le téléphone. */
let fc = { app: null, bpm: 0, somme: 0, n: 0, max: 0 };
function majCardio(msg) {
  const P = $("fcPastille"), on = !!fc.app, age = lireProfil().age, Z = age && fc.bpm ? zonesFc(age)[1] : null, i = Z ? Math.max(0, Z.findIndex(z => fc.bpm <= z[1])) : -1, zi = Z && fc.bpm > Z[4][1] ? 4 : i;
  P.classList.toggle("hidden", !on || !fc.bpm); P.textContent = "❤️ " + fc.bpm + " bpm" + (Z ? " · Z" + (zi + 1) + " " + Z[zi][2] : ""); P.style.setProperty("--c", Z ? Z[zi][3] : "#E11D48");
  $("cardioRow").classList.toggle("hidden", !navigator.bluetooth);
  $("cardioBtn").textContent = on ? L("✓ Connectée", "✓ Connected") : L("Connecter", "Connect"); $("cardioBtn").setAttribute("aria-pressed", on);
  $("cardioInfo").textContent = msg || (on ? (fc.app.name || "Bluetooth") + (fc.bpm ? " · " + fc.bpm + " bpm" : "") : L("Bluetooth : ta fréquence cardiaque en direct pendant la séance", "Bluetooth: your live heart rate during the workout"));
}
$("cardioBtn").onclick = async () => {
  if (fc.app) { fc.app.gatt.disconnect(); return; }
  try {
    const d = await navigator.bluetooth.requestDevice({ filters: [{ services: ["heart_rate"] }] }), c = await (await (await d.gatt.connect()).getPrimaryService("heart_rate")).getCharacteristic("heart_rate_measurement");
    c.addEventListener("characteristicvaluechanged", e => { const v = e.target.value; fc.bpm = v.getUint8(0) & 1 ? v.getUint16(1, true) : v.getUint8(1);   // 1er octet : format 8 ou 16 bits
      if (ecranCourant === "session" && !enPause && fc.bpm) { fc.somme += fc.bpm; fc.n++; fc.max = Math.max(fc.max, fc.bpm); } majCardio(); });
    d.addEventListener("gattserverdisconnected", () => { fc.app = null; fc.bpm = 0; majCardio(); });
    await c.startNotifications(); fc.app = d; majCardio();
  } catch (e) { if (e.name !== "NotFoundError") majCardio(L("Connexion impossible : porte la ceinture (électrodes humides) et active le Bluetooth.", "Could not connect: wear the strap (moistened electrodes) and turn Bluetooth on.")); }
};
majCardio();

/* ============ BARRE DE NAVIGATION ============ */
$("nMenu").onclick = () => ecranCourant !== "menu" && retour(() => ecran("menu"));
$("nProgres").onclick = () => ecranCourant !== "progres" && ouvrirProgres();
$("nProgs").onclick = () => ecranCourant !== "progs" && ouvrirProgs();
if (LANGUE === "en") document.querySelectorAll("[data-en]").forEach(e => { e.textContent = e.dataset.en; });   // libellés fixes ajoutés hors du dictionnaire UI_EN

/* ============ AVIS ============
   Note sur 5, ce qui plaît, ce qui gêne, message libre et contexte anonyme (aucun nom, aucune donnée de santé).
   Envoi par la page du formulaire Google, préremplie : ses réponses arrivent dans une feuille Google, prête à trier et analyser.
   AVIS_FORM = identifiant du formulaire publié (après /forms/d/e/) et numéros « entry. » de ses questions, tirés du lien prérempli.
   Le contexte technique va dans sa propre question si le formulaire en a une (AVIS_FORM.contexte), sinon à la suite du commentaire.
   Sans formulaire renseigné, l'avis part par la feuille de partage du téléphone, comme avant. */
const AVIS_FORM = { id: "1FAIpQLSftVfIv8XIvV0uDcGJi9fCrXXidM8E-PtThj7YDlqMEoZee6w", note: "1743096007", aime: "141393001", gene: "1201111177", message: "1354644341", pratique: "324741575" };
const AVIS_THEMES = [["Séances guidées", "Guided workouts"], ["Voix et consignes", "Voice and cues"], ["Boxe et mode combat", "Boxing and fight mode"], ["Cardio", "Cardio"], ["Programmes", "Programmes"],
  ["Personnage et boutique", "Character and shop"], ["Progrès et niveaux", "Progress and levels"], ["Design", "Design"], ["Facilité d’utilisation", "Ease of use"], ["Bugs ou lenteurs", "Bugs or slowness"]];
// L'avis s'ouvre sur la page Google du formulaire, déjà remplie : la personne n'a qu'à toucher « Envoyer ».
// (Un envoi direct, sans passer par cette page, arrivait dans la feuille avec toutes les cases vides.)
const lienAvis = r => `https://docs.google.com/forms/d/e/${AVIS_FORM.id}/viewform?usp=pp_url&` + new URLSearchParams(Object.entries(AVIS_FORM.contexte ? r : { ...r, message: [r.message, "— " + r.contexte].filter(Boolean).join("\n"), contexte: "" })
  .filter(([k, v]) => AVIS_FORM[k] && v !== "").map(([k, v]) => ["entry." + AVIS_FORM[k], String(v)]));
function ouvrirAvis(sujet) {   // sujet : sport en refonte dont on demande l’avis (facultatif)
  let note = 0; const zone = (k, ph) => `<textarea id="avisTxt-${k}" class="choixVoix avis-zone" rows="2" maxlength="800" placeholder="${ph}"></textarea>`, groupe = (k, l) => `<div class="chips avis-choix" data-g="${k}">${l.map(([f, e], i) => `<button class="toggle" data-i="${i}" aria-pressed="false">${L(f, e)}</button>`).join("")}</div>`;
  if (typeof sujet !== "string") sujet = "";
  ouvrirFeuilleInfo(sujet ? L("Ton avis : ", "Your feedback: ") + sujet : L("Ton avis sur 2 WORK", "Your feedback on 2 WORK"), `<p class="sh-aide">${L("Deux minutes pour dire ce qui marche et ce qui coince : chaque avis est lu et sert à décider des prochaines améliorations.", "Two minutes to say what works and what does not: every review is read and decides the next improvements.")}</p>
    <div class="avis-etoiles">${[1, 2, 3, 4, 5].map(k => `<button data-n="${k}" aria-label="${k}/5">★</button>`).join("")}</div>
    <span class="champ-titre">${L("Ce que tu as aimé", "What you liked")}</span>${groupe("aime", AVIS_THEMES.slice(0, -1))}${zone("aime", L("Dis-nous ce qui t’a plu, avec un exemple si possible…", "Tell us what you liked, with an example if you can…"))}
    <span class="champ-titre">${L("Ce qui t’a gêné ou manqué", "What bothered you or was missing")}</span>${groupe("gene", AVIS_THEMES)}${zone("gene", L("Dis-nous ce qui t’a gêné ou ce qui t’a manqué…", "Tell us what bothered you or what was missing…"))}
    <span class="champ-titre">${L("Penses-tu que cette appli peut t’être pratique ?", "Do you think this app can be useful to you?")}</span><div class="chips avis-choix" data-g="pratique">${[["Oui", "Yes"], ["Non", "No"]].map(([f, e]) => `<button class="toggle" data-v="${f}" aria-pressed="false">${L(f, e)}</button>`).join("")}</div>
    <textarea id="avisTxt" class="choixVoix" rows="4" maxlength="1500" placeholder="${sujet ? L("Ce que tu changerais ou ajouterais pour ce sport : exercices, séances, réalisme…", "What you would change or add for this sport: exercises, sessions, realism…") : L("Autre chose à nous dire ? (facultatif)", "Anything else to tell us? (optional)")}"></textarea>
    <p class="sh-aide">🔒 ${L("Avis anonyme : partent seulement ta note, tes choix, ton message et quelques infos techniques (nombre de séances, niveau, type de téléphone, langue).", "Anonymous feedback: only your rating, choices, message and a few technical details (number of workouts, level, phone type, language) are sent.")}</p>
    <button class="primary" id="avisOk">${L("Envoyer mon avis", "Send my feedback")}</button><p class="sh-ok" id="avisEtat"></p>`);
  const E = [...document.querySelectorAll(".avis-etoiles button")], etat = t => { $("avisEtat").textContent = t; };
  E.forEach(b => b.onclick = () => { note = +b.dataset.n; E.forEach(x => x.classList.toggle("on", +x.dataset.n <= note)); });
  document.querySelectorAll(".avis-choix .toggle").forEach(b => b.onclick = () => { if (b.dataset.v) b.parentNode.querySelectorAll(".toggle").forEach(x => x !== b && x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); });   // « pratique » : un seul choix
  const choisis = g => [[...document.querySelectorAll(`[data-g="${g}"] [aria-pressed="true"]`)].map(b => AVIS_THEMES[+b.dataset.i][0]).join(", "), $("avisTxt-" + g).value.trim()].filter(Boolean).join("\n");   // thèmes cochés, puis le texte rédigé en dessous   // libellés français : la feuille reste homogène quelle que soit la langue
  $("avisOk").onclick = async () => {
    const P = document.querySelector('[data-g="pratique"] [aria-pressed="true"]'), r = { note: note || "", aime: choisis("aime"), gene: choisis("gene"), message: $("avisTxt").value.trim(), pratique: P ? P.dataset.v : "" };
    if (!note && !r.aime && !r.gene && !r.message && !r.pratique) return etat(L("Choisis une note, un thème ou écris un mot.", "Pick a rating, a topic or write a few words."));
    if (sujet) r.message = [`[${L("Refonte", "Rework")} · ${sujet}]`, r.message].filter(Boolean).join("\n");
    r.contexte = [`${lireHist().length} ${L("séances", "workouts")}`, `${L("niveau", "level")} ${niveauXp().n}`, installee() ? L("appli installée", "installed app") : L("navigateur", "browser"),
      iOS() ? "iOS" : /android/i.test(navigator.userAgent) ? "Android" : L("ordinateur", "computer"), LANGUE].filter(Boolean).join(" · ");
    stocker("avisDonnes", (+lire("avisDonnes") || 0) + 1);
    if (AVIS_FORM.id) { window.open(lienAvis(r), "_blank", "noopener"); return etat(L("Ton avis est prêt sur la page qui vient de s’ouvrir : touche « Envoyer » en bas pour le transmettre. Merci ! 🙏", "Your feedback is ready on the page that just opened: tap “Envoyer” (Submit) at the bottom to send it. Thanks! 🙏")); }
    const texte = `${L("Avis 2 WORK", "2 WORK feedback")} ${"★".repeat(note)}${"☆".repeat(5 - note)}\n${r.aime ? "👍 " + r.aime + "\n" : ""}${r.gene ? "👎 " + r.gene + "\n" : ""}${r.message}\n\n— ${r.contexte}`;
    try {
      if (navigator.share) await navigator.share({ title: L("Avis 2 WORK", "2 WORK feedback"), text: texte });
      else { await navigator.clipboard.writeText(texte); return etat(L("Avis copié : colle-le dans un message à la personne qui t’a partagé l’appli.", "Feedback copied: paste it in a message to the person who shared the app with you.")); }
      etat(L("Merci ! 🙏", "Thank you! 🙏"));
    } catch (e) { if (e.name !== "AbortError") etat(L("Envoi impossible ici : fais une capture d’écran de ton avis.", "Cannot send from here: take a screenshot of your feedback.")); }
  };
}
$("avisFin").onclick = ouvrirAvis;
$("reglages").querySelector(".infos-liens").insertAdjacentHTML("afterbegin", `<button class="toggle" id="rgAvis">${ico("bulle")} ${L("Donner mon avis", "Give feedback")}</button>`);
$("rgAvis").onclick = ouvrirAvis;
/* Réglages → « Mettre à jour l'appli » : vide la copie hors ligne des pages et scripts (jamais les données, vidéos ni vignettes), puis recharge depuis le serveur */
async function forcerMiseAJour() {
  $("rgMaj").textContent = L("Mise à jour…", "Updating…");
  try { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.update(); await Promise.all((await caches.keys()).filter(n => /^2work-v/.test(n)).map(n => caches.delete(n))); } catch (e) {}
  location.reload();
}
$("reglages").querySelector(".infos-liens").insertAdjacentHTML("beforeend", `<button class="toggle" id="rgMaj">🔄 ${L("Mettre à jour l’appli", "Update the app")}</button><small class="sh-aide" id="rgVersion"></small>`);
$("rgMaj").onclick = forcerMiseAJour;
if (window.caches) caches.keys().then(l => { const v = l.find(n => /^2work-v/.test(n)); if (v) $("rgVersion").textContent = L("Version ", "Version ") + v.replace("2work-v", ""); }).catch(() => {});

/* ============ BOUTON « RETOUR » DU TÉLÉPHONE ============
   Hors du menu, une entrée d'historique est posée : le retour du téléphone (Android, geste iOS) la consomme et déclenche
   le retour de l'appli (feuille ouverte, schéma en plein écran, bouton ← Retour, sinon ✕ Menu) au lieu de fermer l'appli. */
let piege = false;
const armerRetour = () => { if (!piege && !["menu", "accueil"].includes(ecranCourant)) { try { history.pushState({ app: 1 }, ""); piege = true; } catch (e) {} } };
addEventListener("popstate", ev => {
  if (ev.state && ev.state.app) { piege = true; return; }   // on vient de revenir sur l'entrée piège : rien à faire
  piege = false; sansAnim = true;   // le geste du téléphone anime déjà la page : l'appli change d'écran d'un coup, sans seconde animation
  const plein = document.querySelector(".schema-carte.plein"), b = $(ecranCourant) && $(ecranCourant).querySelector(".back");
  try {
    if ($("feuille")) fermerFeuille(); else if (plein) plein.click(); else if (ecranCourant === "recap") $("rcFermer").click();
    else if (ecranCourant === "bienvenue") $("bvPasser").click(); else if (ecranCourant === "end") $("restart").click();
    else if (b) b.click(); else if (!["menu", "accueil"].includes(ecranCourant)) $("quitBtn").click();
  } finally { sansAnim = false; }
  if (!["menu", "accueil"].includes(ecranCourant)) history.forward();   // encore hors du menu : l'entrée piège existe toujours, on y retourne (une entrée reposée sans appui serait ignorée par le navigateur)
});
addEventListener("click", () => setTimeout(armerRetour, 400), true);   // posé après un appui (geste de l'utilisateur, exigé par les navigateurs), une fois l'écran changé

/* Écran toujours allumé pendant le décompte et la séance (Wake Lock, iPhone iOS 16.4+ et Android) */
let veilleActive = true, verrou = null;
try { veilleActive = localStorage.getItem("veille") !== "0"; } catch (e) {}
async function garderEcran(on) {
  try {
    if (on && veilleActive && "wakeLock" in navigator && !verrou) { verrou = await navigator.wakeLock.request("screen"); verrou.addEventListener("release", () => { verrou = null; }); }
    else if ((!on || !veilleActive) && verrou) { const v = verrou; verrou = null; await v.release(); }
  } catch (e) {}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") garderEcran(["pret", "session"].includes(ecranCourant)); });
function majVeille() { $("veilleBtn").textContent = T(veilleActive ? "Activé" : "Coupé"); $("veilleBtn").setAttribute("aria-pressed", veilleActive); }
$("veilleBtn").onclick = () => { veilleActive = !veilleActive; stocker("veille", veilleActive ? "1" : "0"); majVeille(); };
majVeille();
