/* ============ PARTAGE ET EXPORT D'ACTIVITÉ ============
   Réseaux sociaux : carte image 1080 × 1920 envoyée par la feuille de partage du téléphone (Instagram, WhatsApp, Facebook, Snapchat…).
   Applis de suivi : fichier TCX (Garmin Training Center), importable dans Strava, Garmin Connect, TrainingPeaks, Runalyze…
   Calories estimées par équivalents métaboliques (MET, Compendium of Physical Activities) × poids du profil (70 kg par défaut). */
const MET = { echauffement: 3.5, calme: 2.3, souffle: 1.3, seance: 5, salle: 5, tabata: 8 };
let activite = null;
const kcalEst = a => Math.round((a.tb ? 8 : MET[a.m] || 4.5) * (typeof poidsKg === "function" ? poidsKg() : 70) * a.s / 3600);
function blocPartage() {
  const x = lireHist().slice(-1)[0]; if (!x) return "";
  activite = { ...x, fin: new Date(), titreFr: routine.titreFr || routine.titre, couleur: routine.couleur || "#4F46E5", noms: [...new Set(ids)].slice(0, 30).map(id => EXERCICES[id] && EXERCICES[id].nom).filter(Boolean) };
  return `<div class="carnet partage"><h3>📣 ${L("Partage ta séance", "Share your workout")}</h3><p>${L("Une carte à publier sur tes réseaux, ou un fichier d’activité pour tes applis de suivi.", "A card to post on social media, or an activity file for your tracking apps.")}</p>
    <div class="partage-btns"><button class="toggle" id="shImg">📸 ${L("Réseaux sociaux", "Social media")}</button><button class="toggle" id="shTcx">⌚ Strava, Garmin…</button></div><div id="shAide"></div></div>`;
}
const zoneAide = () => ($("feuille") && $("feuille").querySelector(".sh-zone")) || $("shAide");
function brancherPartage() { if ($("shImg")) { $("shImg").onclick = partagerCarte; $("shTcx").onclick = exporterTcx; preparerCarte(); } }
/* Partage : sur iPhone, la feuille ne s'ouvre que dans le geste même → image préparée à l'avance. Sinon : appui long sur mobile, téléchargement ailleurs. */
let carte = null;
function preparerCarte() { const a = activite; carte = null; carteSeance(a).toBlob(b => { if (activite === a) carte = b; }, "image/jpeg", .92); }
async function envoyer(b, nom, type, texte) {
  const f = navigator.canShare && [type, "application/xml", "text/plain"].map(t => new File([b], nom, { type: t })).find(x => navigator.canShare({ files: [x] }));
  if (f) try { await navigator.share(type.startsWith("image/") ? { files: [f] } : { files: [f], title: texte }); return "partage"; } catch (e) { if (e.name === "AbortError") return "annule"; }
  if (type.startsWith("image/") && /iP(hone|ad|od)|Android/.test(navigator.userAgent)) {
    zoneAide().innerHTML = `<img class="sh-img" src="${URL.createObjectURL(b)}" alt="${L("Carte de ta séance", "Your workout card")}"><p class="sh-aide">${L("Appuie longuement sur l’image, puis « Enregistrer » ou « Partager ».", "Long-press the image, then “Save” or “Share”.")}</p>`; return "image";
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return "telecharge";
}
function lignesTexte(x, t, max) { const l = []; let c = ""; t.split(" ").forEach(m => { if (x.measureText(c + " " + m).width > max && c) { l.push(c); c = m; } else c = c ? c + " " + m : m; }); return l.concat(c); }
/* Cartes à partager (séance, semaine, personnage) : toile 1080 de large, dégradé, bulles, titre « 2 WORK » et adresse du site ; puis 4 tuiles chiffrées */
function toileCarte(h, degrade, bulles = [[900, 240, 320], [120, 1180, 240], [980, 1640, 180]]) {
  const c = document.createElement("canvas"); c.width = 1080; c.height = h; const x = c.getContext("2d"), T1 = "'Barlow Condensed', Arial Narrow, sans-serif", T2 = "Barlow, Arial, sans-serif", g = x.createLinearGradient(0, 0, h > 1500 ? 1080 : 0, h);
  degrade.forEach(([p, col]) => g.addColorStop(p, col)); x.fillStyle = g; x.fillRect(0, 0, 1080, h);
  x.fillStyle = "rgba(255,255,255,.1)"; bulles.forEach(([u, v, r]) => { x.beginPath(); x.arc(u, v, r, 0, 7); x.fill(); });
  x.fillStyle = "#fff"; x.textAlign = "center"; x.font = `500 36px ${T2}`; x.fillText("aidou-1.github.io/2work", 540, h - 70); x.font = `800 72px ${T1}`; x.fillText("2 WORK", 540, h > 1500 ? 170 : 120);
  return { c, x, T1, T2 };
}
function tuilesCarte({ x, T1, T2 }, tuiles, y0) {
  tuiles.forEach(([v, t], k) => { const cx = k % 2 ? 790 : 290, cy = y0 + Math.floor(k / 2) * 330;
    x.fillStyle = "rgba(255,255,255,.15)"; x.beginPath(); x.roundRect ? x.roundRect(cx - 230, cy - 140, 460, 280, 44) : x.rect(cx - 230, cy - 140, 460, 280); x.fill();
    x.fillStyle = "#fff"; x.font = `800 150px ${T1}`; x.fillText(v, cx, cy + 40); x.font = `600 40px ${T2}`; x.fillText(t, cx, cy + 100); });
}
function carteSeance(a) {
  const K = toileCarte(1920, [[0, a.couleur], [.6, "#4F46E5"], [1, "#1E1B4B"]]), { c, x, T1, T2 } = K;
  x.font = `700 44px ${T2}`; x.globalAlpha = .85; x.fillText(L("SÉANCE TERMINÉE ✓", "WORKOUT COMPLETE ✓"), 540, 270); x.globalAlpha = 1;
  x.font = `800 104px ${T1}`; const tout = lignesTexte(x, a.t, 940), lt = tout.slice(0, 3); if (tout.length > 3) lt[2] = lt[2].replace(/[\s·]+$/, "") + "…"; lt.forEach((l, k) => x.fillText(l, 540, 410 + k * 110));
  const y0 = 410 + lt.length * 110 + 30, date = a.fin.toLocaleDateString(LANGUE === "en" ? "en-GB" : "fr-FR", { weekday: "long", day: "numeric", month: "long" });
  x.font = `600 42px ${T2}`; x.globalAlpha = .85; x.fillText(date.charAt(0).toUpperCase() + date.slice(1), 540, y0); x.globalAlpha = 1;
  const S = statsGlobales();
  tuilesCarte(K, [[Math.max(1, Math.round(a.s / 60)), L("minutes", "minutes")], [a.n, L("exercices", "exercises")], [kcalEst(a), L("kcal estimées", "est. kcal")], [S.serie, L(S.serie > 1 ? "jours d’affilée" : "jour d’affilée", "day streak")]], y0 + 230);
  let y = y0 + 790; const ex = a.noms.slice(0, Math.max(0, Math.min(5, Math.floor((1770 - y) / 58) - 1))); x.textAlign = "left"; x.font = `600 38px ${T2}`;
  ex.forEach(n => { x.globalAlpha = .9; x.fillText("✓  " + (n.length > 34 ? n.slice(0, 33) + "…" : n), 150, y); y += 58; });
  if (a.noms.length > ex.length) { x.globalAlpha = .7; const r = a.noms.length - ex.length; x.fillText(L(`+ ${r} ${r > 1 ? "autres exercices" : "autre exercice"}`, `+ ${r} more exercise${r > 1 ? "s" : ""}`), 150, y); }
  x.globalAlpha = 1;
  return c;
}
function partagerCarte() {
  const go = b => envoyer(b, "2work-seance.jpg", "image/jpeg").then(r => { if (r === "telecharge") zoneAide().innerHTML = `<p class="sh-ok">${L("Image enregistrée : publie-la depuis ta galerie sur Instagram, TikTok, Facebook ou WhatsApp.", "Image saved: post it from your gallery to Instagram, TikTok, Facebook or WhatsApp.")}</p>`; });
  carte ? go(carte) : carteSeance(activite).toBlob(go, "image/jpeg", .92);
}
function tcx(a) {
  const iso = t => new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z"), fin = +a.fin, deb = fin - a.s * 1000, pts = [];
  for (let t = 0; t <= a.s; t += 10) pts.push(`<Trackpoint><Time>${iso(deb + t * 1000)}</Time><DistanceMeters>0.0</DistanceMeters></Trackpoint>`);
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
<Activities><Activity Sport="Other"><Id>${iso(deb)}</Id>
<Lap StartTime="${iso(deb)}"><TotalTimeSeconds>${a.s}</TotalTimeSeconds><DistanceMeters>0.0</DistanceMeters><Calories>${kcalEst(a)}</Calories><Intensity>Active</Intensity><TriggerMethod>Manual</TriggerMethod>
<Track>${pts.join("")}</Track></Lap>
<Notes>${esc(a.t + " (2 WORK) · " + a.noms.join(", "))}</Notes>
<Creator xsi:type="Application_t"><Name>2 WORK</Name><Build><Version><VersionMajor>1</VersionMajor><VersionMinor>0</VersionMinor></Version></Build><LangID>${LANGUE.toUpperCase()}</LangID><PartNumber>000-00000-00</PartNumber></Creator>
</Activity></Activities></TrainingCenterDatabase>`;
}
async function exporterTcx() {
  const a = activite, nom = `2work-${a.j}-${a.t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 40)}.tcx`;
  const r = await envoyer(new Blob([tcx(a)], { type: "application/vnd.garmin.tcx+xml" }), nom, "application/vnd.garmin.tcx+xml", a.t);
  if (r === "annule") return;
  zoneAide().innerHTML = `<p class="sh-ok">${r === "partage" ? L("Fichier envoyé.", "File sent.") : L("Fichier d’activité enregistré dans tes téléchargements.", "Activity file saved to your downloads.")} ${L("Importe-le ensuite dans ton appli :", "Then import it into your app:")}</p>
    <div class="partage-liens"><a href="https://www.strava.com/upload/select" target="_blank" rel="noopener">Strava</a><a href="https://connect.garmin.com/modern/import-data" target="_blank" rel="noopener">Garmin Connect</a></div>
    <p class="sh-aide">${L("Strava : « + » puis « Téléverser une activité » · Garmin Connect : « Importer des données ». Fonctionne aussi avec TrainingPeaks, Runalyze et toute appli qui accepte les fichiers .tcx. Les calories sont estimées.", "Strava: “+” then “Upload activity” · Garmin Connect: “Import data”. Also works with TrainingPeaks, Runalyze and any app that accepts .tcx files. Calories are estimated.")}</p>`;
}

/* ============ PROFIL ============
   Stocké uniquement sur le téléphone (clé « profil »). Sert aux calories (MET × poids), à la fréquence cardiaque maximale
   (formule de Tanaka : 208 − 0,7 × âge) et aux recommandations. Le niveau est partagé avec le renfo (« niveauRenfo »). */
const OBJECTIFS = [["forme", "Être en forme", "Get fit", "#16A34A"], ["perte", "Perdre du poids", "Lose weight", "#EA580C"], ["muscle", "Prendre du muscle", "Build muscle", "#334E68"],
  ["perf", "Performer dans mon sport", "Perform in my sport", "#7B5EA7"], ["souplesse", "Souplesse et bien-être", "Flexibility and well-being", "#0F8A78"]];
const ageNais = n => { const a = new Date(n), j = new Date(); return j.getFullYear() - a.getFullYear() - (j < new Date(j.getFullYear(), a.getMonth(), a.getDate()) ? 1 : 0); };
const lireProfil = () => { const p = lireJSON("profil", {}); if (p.naissance) { const a = ageNais(p.naissance); if (a >= 4 && a <= 110) p.age = a; } return p; };   // l'âge suit la date de naissance
const poidsKg = () => { const p = +lireProfil().poids; return p >= 30 && p <= 250 ? p : 70; };
function ecrireProfil(champ, v) { const p = lireProfil(); p[champ] = v; stocker("profil", JSON.stringify(p)); if (champ === "niveau") stocker("niveauRenfo", v); }
const sportsRenfo = () => Object.keys(RENFOS).filter(k => CATS[k]);
function zonesFc(age) {
  const fc = Math.round(208 - .7 * age);
  return [fc, [[50, 60, "Récupération", "Recovery", "#60A5FA"], [60, 70, "Endurance", "Endurance", "#34D399"], [70, 80, "Tempo", "Tempo", "#FACC15"], [80, 90, "Seuil", "Threshold", "#FB923C"], [90, 100, "Maximum", "Maximum", "#F43F5E"]]
    .map(([a, b, f, e, c]) => [Math.round(fc * a / 100), Math.round(fc * b / 100), L(f, e), c])];
}
// date de naissance, poids et taille : champs de « Mon profil » (préfixe des identifiants : pf)
const champsCorps = (p, x) => `<label class="champ"><span>${L("Date de naissance", "Date of birth")} <small>(${L("facultatif · fréquence cardiaque et clubs", "optional · heart rate and clubs")})</small></span><input id="${x}Nais" type="date" max="${jourCle()}" value="${p.naissance || ""}"></label>
  <div class="champ-duo"><label class="champ"><span>${L("Poids (kg)", "Weight (kg)")} <small>(${L("facultatif", "optional")})</small></span><input id="${x}Poids" type="number" inputmode="decimal" min="30" max="250" step="0.5" value="${p.poids || ""}" placeholder="—"></label>
    <label class="champ"><span>${L("Taille (cm)", "Height (cm)")} <small>(${L("facultatif", "optional")})</small></span><input id="${x}Taille" type="number" inputmode="numeric" min="100" max="230" value="${p.taille || ""}" placeholder="—"></label></div>`;
function brancherCorps(x, ok = () => {}) {
  $(x + "Nais").onchange = e => { const v = e.target.value, a = v ? ageNais(v) : 0; ecrireProfil("naissance", a >= 4 && a <= 110 ? v : ""); if (!v) ecrireProfil("age", ""); ok(); };
  $(x + "Poids").oninput = e => { const v = parseFloat(e.target.value); ecrireProfil("poids", v >= 30 && v <= 250 ? v : ""); ok(); };
  $(x + "Taille").oninput = e => { const v = parseInt(e.target.value, 10); ecrireProfil("taille", v >= 100 && v <= 230 ? v : ""); ok(); };
}
let profilRetourVers = "reglages";
function ouvrirProfil(depuis) {
  profilRetourVers = depuis || "reglages";
  $("pfTitre").textContent = L("Mon profil", "My profile");
  $("pfSub").textContent = L("Ces informations restent sur ton téléphone. Elles servent à estimer tes calories et ta fréquence cardiaque, et à te recommander des séances.", "This information stays on your phone. It is used to estimate your calories and heart rate, and to recommend workouts.");
  renduProfil(); ecran("profil");
}
function renduProfil() {
  const p = lireProfil(), niv = lireNiv(), C = $("pfCorps");
  C.innerHTML = `<div id="pfAvatar">${blocAvatar()}</div><div class="carnet profil-form">
      <label class="champ"><span>${L("Prénom", "First name")} <small>(${L("facultatif", "optional")})</small></span><input id="pfNom" type="text" maxlength="20" autocomplete="given-name" value="${(p.nom || "").replace(/"/g, "&quot;")}"></label>
      ${champsCorps(p, "pf")}
      <span class="champ-titre">${L("Mon objectif", "My goal")}</span><div class="choix-grille">${OBJECTIFS.map(o => `<button class="toggle" data-obj="${o[0]}" aria-pressed="${p.objectif === o[0]}">${L(o[1], o[2])}</button>`).join("")}</div>
      <label class="champ"><span>${L("Mon sport principal", "My main sport")}</span><select id="pfSport"><option value="">${L("Aucun en particulier", "None in particular")}</option>${sportsRenfo().map(k => `<option value="${k}"${p.sport === k ? " selected" : ""}>${T(CATS[k].titre)}</option>`).join("")}</select></label>
      <span class="champ-titre">${L("Mon niveau", "My level")}</span><div class="stepper niv-choix">${NIV_RENFO.map(n => `<button class="toggle" data-niv="${n[0]}" aria-pressed="${n[0] === niv}">${L(n[1], n[2])}</button>`).join("")}</div>
      <span class="champ-titre">${L("Mon matériel", "My equipment")} <small>(${L("pour le Quick start et la bibliothèque", "for Quick start and the library")})</small></span><div class="choix-grille pair">${FAMILLES_MAT.map(m => `<button class="toggle" data-mat="${m[0]}" aria-pressed="${(p.materiel || []).includes(m[0])}">${L(m[1], m[2])}</button>`).join("")}</div>
      <button class="toggle contour" id="pfQuest">🧭 ${L("Refaire le questionnaire des sports", "Redo the sports questionnaire")}</button>
      <p class="pf-ok" id="pfOk"></p></div><div id="pfResultats"></div>`;
  $("pfQuest").onclick = () => { bienvenue.depuisProfil = profilRetourVers; ecran("bienvenue", () => bienvenue(1)); };
  const ok = () => { $("pfOk").textContent = "✓ " + L("Enregistré", "Saved"); clearTimeout(ok.t); ok.t = setTimeout(() => $("pfOk") && ($("pfOk").textContent = ""), 1500); resultatsProfil(); };
  $("pfNom").oninput = e => { ecrireProfil("nom", e.target.value.trim()); ok(); };
  brancherCorps("pf", ok);
  $("pfSport").onchange = e => { ecrireProfil("sport", e.target.value); ok(); };
  C.querySelectorAll("[data-obj]").forEach(b => b.onclick = () => { ecrireProfil("objectif", b.dataset.obj); C.querySelectorAll("[data-obj]").forEach(x => x.setAttribute("aria-pressed", x === b)); ok(); });
  C.querySelectorAll("[data-mat]").forEach(b => b.onclick = () => { const l = lireProfil().materiel || [], k = b.dataset.mat, n = l.includes(k) ? l.filter(x => x !== k) : [...l, k]; ecrireProfil("materiel", n); b.setAttribute("aria-pressed", n.includes(k)); ok(); });
  C.querySelectorAll("[data-niv]").forEach(b => b.onclick = () => { ecrireProfil("niveau", b.dataset.niv); C.querySelectorAll("[data-niv]").forEach(x => x.setAttribute("aria-pressed", x === b)); ok(); });
  brancherAvatar(); resultatsProfil();
}
function resultatsProfil() {
  const p = lireProfil(), R = $("pfResultats"); let h = "";
  if (p.age) { const [fc, z] = zonesFc(p.age);
    h += `<div class="carnet"><h3>❤️ ${L("Ta fréquence cardiaque", "Your heart rate")}</h3><p>${L("Maximum estimé", "Estimated maximum")} : <b>${fc} bpm</b> (${L("formule de Tanaka", "Tanaka formula")}). ${L("Utile si tu as une montre cardio.", "Useful if you have a heart-rate watch.")}</p>
      <div class="zones">${z.map(([a, b, n, c], i) => `<div style="--c:${c}"><b>Z${i + 1}</b><span>${n}</span><small>${a}–${b}</small></div>`).join("")}</div>
      <p class="sh-aide">${L("Tabata et circuits avancés : zones 4 et 5. Échauffement et récupération : zones 1 et 2. Estimation moyenne : ta vraie valeur peut varier de ± 10 bpm.", "Tabata and advanced circuits: zones 4 and 5. Warm-up and recovery: zones 1 and 2. Average estimate: your real value can vary by ± 10 bpm.")}</p></div>`; }
  if (p.poids) h += `<div class="carnet"><h3>🔥 ${L("Tes calories", "Your calories")}</h3><p>${L(`Les calories de tes séances sont maintenant calculées pour ${p.poids} kg : environ ${Math.round(5 * p.poids / 2)} kcal pour 30 minutes de renfo, ${Math.round(8 * p.poids / 4)} kcal pour 15 minutes de Tabata.`, `Your workout calories are now calculated for ${p.poids} kg: about ${Math.round(5 * p.poids / 2)} kcal for 30 minutes of strength work, ${Math.round(8 * p.poids / 4)} kcal for 15 minutes of Tabata.`)}</p></div>`;
  const reco = recommandations();
  if (reco.length) h += `<h2 class="sec">${L("Pour toi", "For you")}</h2><div class="choices" id="pfReco"></div>`;
  h += `<button class="primary" id="pfPlanning">📅 ${L("Planifier ma semaine", "Plan my week")}</button>`;
  R.innerHTML = h;
  reco.forEach(s => bouton($("pfReco"), s.t, s.s, s.c, s.go));
  $("pfPlanning").onclick = () => ouvrirPlanning("profil");
}
function recommandations() {
  const p = lireProfil(), sp = RENFOS[p.sport] ? p.sport : "", niv = lireNiv(), l = [];
  if (sp) l.push(TPL.R(sp), TPL.E(sp, "standard"));
  ({ forme: ["R:complet", "T:cardio"], perte: ["T:cardio", "R:complet"], muscle: ["S:hypertrophie:full"], perf: ["T:cardio"], souplesse: ["E:yoga:complet", "C:repos"] }[p.objectif] || (sp ? [] : ["R:complet", "C:complet"]))
    .forEach(k => l.push(tpl(k, niv)));
  return l.filter((s, i) => s && l.findIndex(x => x.t === s.t) === i).slice(0, 3);
}

/* ============ PLANNING DE LA SEMAINE ============
   « planning » = { jours: [0 = lundi … 6 = dimanche], heure: "18:00", lieu, clubs, prog, choix } (détail dans js/masemaine.js). Les séances sont placées selon l'objectif du profil,
   les clubs et le programme intégré, en alternant intensité et récupération. Rappels : fichier agenda .ics (événements hebdomadaires avec alerte 15 min avant). */
const TPL = {
  R: (g, nv = lireNiv()) => { const R = ROUTINES[SEANCE(g)], s = seanceRenfo(g, 0, nv); return { t: R.titre, s: `${L(...NIV_RENFO.find(n => n[0] === nv).slice(1, 3))} · ${s.total} min`, c: R.couleur, d: s.total, go: () => { ROUTINES.renfo = seanceRenfo(g, 0, nv); CONSEILLES.renfo = ROUTINES.renfo.exercices; ouvrirRoutine("renfo"); } }; },
  T: id => { const T0 = TABATAS.find(t => t[0] === id), s = seanceTabata(id); return { t: L(T0[1], T0[2]), s: `Tabata · ${s.total} min`, c: T0[3], d: s.total, go: () => { ROUTINES.tbt = seanceTabata(id); CONSEILLES.tbt = ROUTINES.tbt.exercices; ouvrirRoutine("tbt"); } }; },
  S: (m, sp) => { const s = seanceSalle(m, sp); return { t: s.titre, s: `${L("Salle", "Gym")} · ${s.total} min`, c: METHODES[m][0], d: s.total, go: () => { methodeCourante = m; ROUTINES.gym = seanceSalle(m, sp); CONSEILLES.gym = ROUTINES.gym.exercices; ouvrirRoutine("gym"); } }; },
  C: id => { const s = seanceRecup(id); return { t: s.titre, s: `${L("Récupération", "Recovery")} · ${s.total} min`, c: s.couleur, d: s.total, go: () => { ROUTINES.recup = seanceRecup(id); CONSEILLES.recup = ROUTINES.recup.exercices; ouvrirRoutine("recup"); } }; },
  E: (sp, f) => { const s = seanceEch(sp, f); return { t: s.titre, s: `${L("Échauffement", "Warm-up")} · ${s.total} min`, c: s.couleur, d: s.total, go: () => { ROUTINES.ech = seanceEch(sp, f); CONSEILLES.ech = ROUTINES.ech.exercices; ouvrirRoutine("ech"); } }; }
};
function tpl(cle, niv) {
  let [k, a, b] = cle.split(":");
  if (k === "T" && niv === "debutant") a = "decouverte";
  return TPL[k] && TPL[k](a, b);
}
const PLANS = {
  forme: ["R:complet", "T:cardio", "C:repos", "R:bas", "R:haut", "T:abdos", "C:soir"],
  perte: ["T:cardio", "R:complet", "C:repos", "T:complet", "R:bas", "T:jambes", "C:soir"],
  perf: ["R:@", "T:cardio", "C:repos", "R:@", "T:jambes", "R:complet", "C:soir"],
  souplesse: ["E:yoga:complet", "C:repos", "R:pilates", "C:soir", "E:pilates:complet", "C:bureau", "C:repos"],
  muscle: n => n <= 2 ? ["S:hypertrophie:full", "S:hypertrophie:full"] : n === 3 ? ["S:hypertrophie:push", "S:hypertrophie:pull", "S:hypertrophie:jambes"]
    : n === 4 ? ["S:hypertrophie:haut", "S:hypertrophie:bas", "S:hypertrophie:haut", "S:hypertrophie:bas"] : ["S:hypertrophie:push", "S:hypertrophie:pull", "S:hypertrophie:jambes", "S:hypertrophie:haut", "S:hypertrophie:bas", "C:repos", "C:soir"]
};
const lirePlanning = () => lireJSON("planning", null);
const JOURS_LONGS = () => L("lundi mardi mercredi jeudi vendredi samedi dimanche", "Monday Tuesday Wednesday Thursday Friday Saturday Sunday").split(" ");
const jourSemaine = (d = new Date()) => (d.getDay() + 6) % 7;
// semaine() : séances perso de la semaine, calculées dans js/masemaine.js (clubs, programme intégré, objectif)
function dateDuJour(j) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - jourSemaine(d) + j); return d; }
const cleDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
let planningRetourVers = "menu";
function ouvrirPlanning(depuis) {
  planningRetourVers = depuis || "menu";
  $("plTitre").textContent = L("Ma semaine", "My week");
  $("plSub").textContent = L("Tes clubs, tes jours perso et, si tu veux, un programme : l’appli place tout en alternant effort et récupération, sans refaire ce que ton club travaille déjà.", "Your clubs, your own days and, if you like, a programme: the app places everything, alternating effort and recovery, without repeating what your club already trains.");
  renduPlanning(); ecran("planning");
}
// l'écran (renduPlanning, listeSemaine) est dans js/masemaine.js
function exporterIcs() {
  const P = lirePlanning(), S = semaine(1), [hh, mm] = (P.heure || "18:00").split(":").map(Number), JJ = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const f = d => `${cleDate(d).replace(/-/g, "")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`, pli = l => l.match(/.{1,73}/g).join("\r\n ");
  const esc = s => String(s).replace(/[\\,;]/g, m => "\\" + m), now = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const ev = S.map(({ j, s }) => { const d = dateDuJour(j); d.setHours(hh, mm); if (d < new Date()) d.setDate(d.getDate() + 7);
    return ["BEGIN:VEVENT", `UID:2work-${JJ[j]}-${now}@aidou-1.github.io`, `DTSTAMP:${now}`, `DTSTART:${f(d)}`, `DURATION:PT${Math.max(10, s.d || 30)}M`, `RRULE:FREQ=WEEKLY;BYDAY=${JJ[j]}`, ...(P.lieu ? [pli(`LOCATION:${esc(P.lieu)}`)] : []),
      pli(`SUMMARY:2 WORK · ${esc(s.t)}`), pli(`DESCRIPTION:${esc(s.s + " — " + L("Ouvre 2 WORK pour lancer ta séance. Imprévu ? Plan B : 7 min de Quick start.", "Open 2 WORK to start your workout. Something came up? Plan B: 7 min of Quick start."))}`), "URL:https://aidou-1.github.io/2work/",
      "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", pli(`DESCRIPTION:2 WORK · ${esc(s.t)}`), "END:VALARM", "END:VEVENT"].join("\r\n"); });
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//2 WORK//Planning//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...ev, "END:VCALENDAR"].join("\r\n");
  envoyer(new Blob([ics], { type: "text/calendar" }), "2work-planning.ics", "text/calendar", L("Mon planning 2 WORK", "My 2 WORK plan")).then(r => {
    if (r !== "annule") $("plIcsAide").textContent = L("Ouvre le fichier pour ajouter tes séances à ton agenda (Calendrier, Google Agenda, Outlook). Si tu changes tes jours, refais l’export et supprime les anciens rendez-vous.", "Open the file to add your workouts to your calendar (Calendar, Google Calendar, Outlook). If you change your days, export again and delete the old events."); });
}
function majSemaine() {   // carte « Aujourd'hui » du menu et salutation
  if (typeof majForme === "function") majForme();
  const p = lireProfil(), Z = $("semaineCarte"); if (!Z) return;
  document.querySelector("#menu .entete h1").textContent = p.nom ? L(`On s’y met, ${p.nom} ?`, `Ready, ${p.nom}?`) : T("On s’y met ?");
  const S = semaine(), auj = jourSemaine(), x = S.find(s => s.j === auj), fait = lireHist().some(h => h.j === jourCle());
  if (!x && carteJourComplet(Z)) return;   // clubs ou programme : le club du jour, la mobilité prévue ou le repos
  if (!S.length) { Z.innerHTML = `<button class="sc-corps" id="scOuvrir"><span class="sc-ico">${ico("agenda")}</span><span><strong>${L("Planifie ta semaine", "Plan your week")}</strong><small>${L("Choisis tes jours, l’appli place tes séances", "Pick your days, the app places your workouts")}</small></span></button>`; }
  else { const pro = x ? null : S.find(s => s.j > auj) || S[0];
    Z.innerHTML = `<button class="sc-corps" id="scOuvrir" style="--c:${x ? x.s.c : "#64748B"}"><span class="sc-ico">${x ? (fait ? "✅" : "🎯") : "🌙"}</span><span><strong>${x ? (fait ? L("Séance du jour faite !", "Today’s workout done!") : L("Aujourd’hui", "Today") + " · " + x.s.t) : L("Aujourd’hui : repos", "Today: rest")}</strong><small>${x ? x.s.s : L("Prochaine séance", "Next workout") + " " + JOURS_LONGS()[pro.j] + " : " + pro.s.t}</small></span></button>${x && !fait ? `<button class="sc-go" id="scGo" aria-label="${L("Lancer", "Start")}">${ico("lecture")}</button>` : ""}`;
    if ($("scGo")) $("scGo").onclick = e => { e.stopPropagation(); x.s.go(); }; }
  // proposition du jour : récupération si la fatigue monte, sinon programme en cours, planning, ou séance d'après les derniers jours ; avec clubs ou programme, elle vient de Ma semaine
  const D = !fait && !modeComplet() && seanceDuJour(x);
  if (D) { Z.innerHTML = `<button class="sc-corps" id="scOuvrir" style="--c:${D.c}"><span class="sc-ico">${D.ico || "🎯"}</span><span><strong>${L("Aujourd’hui", "Today")} · ${D.t}</strong><small>${D.r || D.s}</small></span></button><button class="sc-go" id="scGo" aria-label="${L("Lancer", "Start")}">${ico("lecture")}</button>`; $("scGo").onclick = e => { e.stopPropagation(); D.go(); }; }
  $("scOuvrir").onclick = () => ouvrirPlanning("menu");
  if (x && !fait) {   // plan B : une version courte plutôt que rien, et le lieu prévu pour rappel
    const P = lirePlanning(); if (P.lieu) $("scOuvrir").querySelector("small").textContent += " · 📍 " + P.lieu;
    Z.insertAdjacentHTML("beforeend", `<button class="sc-go sc-planb" id="scB" aria-label="${L("Plan B : 7 minutes de Quick start", "Plan B: 7 minutes of Quick start")}"><small>${L("Plan B", "Plan B")}</small>7′</button>`);
    $("scB").onclick = () => composerExpress({ ...quickPrefs(), min: 7 }) || composerExpress({ min: 7, m: "sans", z: "tout", int: "normal" });
  }
}

/* ============ PROGRESSION AUTOMATIQUE ============
   Ressenti noté en fin de séance (1 facile · 2 juste bien · 3 trop dur), enregistré dans l'historique (« rs »).
   Renfo : 2 séances « faciles » de suite, ou 3 séances réussies de suite au même niveau → proposer le niveau supérieur ;
   2 séances « trop dures » de suite → proposer le niveau inférieur. */
function blocRessenti() {
  if (routine.cardioS) return blocEffort();
  if (!["seance", "salle", "tabata", "echauffement"].includes(mode) || routine.prog || routine.reprise) return "";
  return `<div class="carnet ressenti"><h3>💬 ${L("Comment c’était ?", "How was it?")}</h3><div class="stepper rs-choix">${[[1, "😌", "Facile", "Easy"], [2, "💪", "Juste bien", "Just right"], [3, "🥵", "Trop dur", "Too hard"]]
    .map(([v, e, f, en]) => `<button class="toggle" data-rs="${v}">${e} ${L(f, en)}</button>`).join("")}</div><div id="rsRes"></div></div>`;
}
function brancherRessenti() {
  const base = { cle: routineCle, int: quickPrefs().int, id: routine.reposId, rep: routine.repos, prop: routine.reposProp };   // état d'avant, pour recalculer si on change d'avis
  document.querySelectorAll("[data-rs]").forEach(b => b.onclick = () => {
    const v = +b.dataset.rs, h = lireHist(), x = h[h.length - 1]; if (!x) return;
    x.rs = v; stocker("historique", JSON.stringify(h));
    document.querySelectorAll("[data-rs]").forEach(y => y.setAttribute("aria-pressed", y === b));
    const ad = adapter(v, base); $("rsRes").innerHTML = conseilProgression(h, x) + (ad ? `<p class="sh-ok rs-adapt">⚙️ ${ad} <button class="lien" id="rsAnnul">${L("Annuler", "Undo")}</button></p>` : "");
    if ($("rsAnnul")) $("rsAnnul").onclick = () => { adapter(2, base); $("rsAnnul").parentNode.textContent = "↩︎ " + L("Réglage d’origine gardé.", "Original setting kept."); };
    const g = $("rsNiv"); if (g) g.onclick = () => { ecrireProfil("niveau", g.dataset.n); $("rsRes").innerHTML = `<p class="sh-ok">✓ ${L("C’est noté : tes prochaines séances de renfo seront en", "Got it: your next strength sessions will be")} ${L(...NIV_RENFO.find(n => n[0] === g.dataset.n).slice(1, 3))}.</p>`; };
  });
}
/* Séance adaptative : le ressenti règle tout seul la prochaine séance du même type (le niveau de renfo, lui, reste une proposition à accepter).
   Quick start : intensité un cran plus bas (trop dur) ou plus haut (facile). Séances au repos réglable (renfo, salle, programmes…) : +10 s (trop dur), −5 s (facile),
   entre la moitié et le double du repos conseillé. « Juste bien » remet le réglage d'avant la séance ; tout est annulable. */
function adapter(v, b) {
  if (b.cle === "express") { const o = ["calme", "normal", "intense"], n = o[Math.max(0, Math.min(2, o.indexOf(b.int) + (v === 1) - (v === 3)))];
    stocker("quickPrefs", JSON.stringify({ ...quickPrefs(), int: n })); return n === b.int ? "" : L(`Prochain Quick start en intensité « ${INTENSITES[n][2].toLowerCase()} ».`, `Next Quick start at “${INTENSITES[n][3].toLowerCase()}” intensity.`); }
  if (!b.id || !b.prop || !Number.isFinite(b.rep)) return "";
  const n = v === 3 ? Math.min(b.prop * 2, b.rep + 10) : v === 1 ? Math.max(Math.round(b.prop / 2), b.rep - 5) : b.rep; reposGarder(b.id, n);
  return n === b.rep ? "" : L(`Repos ${n > b.rep ? "allongé" : "raccourci"} à ${n} s pour la prochaine fois.`, `Rest ${n > b.rep ? "lengthened" : "shortened"} to ${n} s for next time.`);
}
function conseilProgression(h, x) {
  const ordre = NIV_RENFO.map(n => n[0]), i = ordre.indexOf(x.nv);
  if (x.nv && i >= 0) {
    const meme = h.filter(y => y.c === x.c && y.nv === x.nv && y.rs).slice(-3).map(y => y.rs), haut = ordre[i + 1], bas = ordre[i - 1];
    const nom = n => L(...NIV_RENFO.find(z => z[0] === n).slice(1, 3));
    if (haut && (meme.slice(-2).join() === "1,1" || meme.length === 3 && meme.every(r => r <= 2)))
      return `<p class="sh-ok">🚀 ${L(`Tu maîtrises le niveau ${nom(x.nv)} : prêt pour ${nom(haut)} ?`, `You have mastered ${nom(x.nv)}: ready for ${nom(haut)}?`)}</p><button class="toggle" id="rsNiv" data-n="${haut}">${L("Passer en", "Move to")} ${nom(haut)}</button>`;
    if (bas && meme.slice(-2).join() === "3,3")
      return `<p class="sh-ok">${L(`Deux séances difficiles de suite : le niveau ${nom(bas)} t’aidera à progresser sans te blesser.`, `Two hard sessions in a row: ${nom(bas)} will help you progress without injury.`)}</p><button class="toggle" id="rsNiv" data-n="${bas}">${L("Revenir en", "Go back to")} ${nom(bas)}</button>`;
  }
  return `<p class="sh-ok">${[L("Super, c’est noté ! Garde ce niveau encore une ou deux séances.", "Great, noted! Keep this level for another session or two."), L("Parfait : c’est exactement la bonne intensité pour progresser.", "Perfect: that is exactly the right intensity to progress."), L("Bien joué d’être allé au bout. Récupère bien, et n’hésite pas à baisser le niveau si besoin.", "Well done for finishing. Recover well, and lower the level if needed.")][x.rs - 1]}</p>`;
}
const repsCible = q => { const m = (q && q.presc || "").match(/(\d+)\s*[–-]\s*(\d+)/); return m ? [+m[1], +m[2]] : null; };

/* ============ PARTAGE DEPUIS L'HISTORIQUE ============ */
const COUL_MODE = { echauffement: "#1A3BC2", seance: "#6236C9", salle: "#334E68", tabata: "#D9480F", calme: "#0F8A78", souffle: "#3B82C4" };
function activiteDe(x) {
  const [a, m, j] = x.j.split("-").map(Number), deb = new Date(a, m - 1, j, x.hr ?? 12, 0);
  return { ...x, fin: new Date(+deb + x.s * 1000), couleur: COUL_MODE[x.m] || "#4F46E5", noms: (x.e || []).filter(id => EXERCICES[id]).filter((id, i, l) => l.indexOf(id) === i).map(id => EXERCICES[id].nom) };
}
function ouvrirFeuillePartage(x) {
  activite = activiteDe(x); fermerFeuille();
  document.body.insertAdjacentHTML("beforeend", `<div class="feuille-fond" id="feuille"><div class="feuille" role="dialog" aria-label="${L("Partager", "Share")}"><h3>📣 ${propre(x.t)}</h3><p class="sh-aide">${x.j.split("-").reverse().join("/")} · ${Math.max(1, Math.round(x.s / 60))} min</p>
    <div class="partage-btns"><button class="toggle" id="fsImg">📸 ${L("Réseaux sociaux", "Social media")}</button><button class="toggle" id="fsTcx">⌚ Strava, Garmin…</button></div><div class="sh-zone"></div><button class="toggle contour" id="fsFermer">${L("Fermer", "Close")}</button></div></div>`);
  $("feuille").onclick = e => { if (e.target.id === "feuille") fermerFeuille(); };
  $("fsFermer").onclick = fermerFeuille; $("fsImg").onclick = partagerCarte; $("fsTcx").onclick = exporterTcx; preparerCarte();
}
const fermerFeuille = () => $("feuille") && $("feuille").remove();
document.addEventListener("click", e => { const b = e.target.closest(".h-part"); if (b) { const x = lireHist()[+b.dataset.i]; if (x) ouvrirFeuillePartage(x); } });

/* ============ CONTACT DE L'ÉDITEUR ============
   Adresse dédiée à l'application (jamais l'adresse personnelle) : signalements, données personnelles, demandes des parents. */
const CONTACT = "2workbyaidou@gmail.com";
const contactLien = () => CONTACT ? `<a href="mailto:${CONTACT}">${CONTACT}</a>` : L("l’adresse de contact (bientôt disponible)", "the contact address (coming soon)");

/* ============ INFORMATIONS LÉGALES ============ */
const PAGES = {
  mentions: ["Mentions légales", "Legal notice", () => L(`<h3>Éditeur</h3><p>2 WORK est une application web gratuite, sans publicité, éditée à titre non professionnel par <b>Aidou</b>, personne physique (compte GitHub « aidou-1 »), qui a communiqué son identité à son hébergeur comme le permet la loi (LCEN, art. 1-1, II).</p>
    <p>Contact (questions, données personnelles, signalement d’un contenu illicite, demande d’un parent) : ${contactLien()}</p>
    <h3>Hébergeurs</h3><p><b>Application</b> : GitHub, Inc. (GitHub Pages) · 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis · <a href="https://github.com" target="_blank" rel="noopener">github.com</a></p>
    <p><b>Comptes et contenus des clubs</b> : Google Ireland Limited (Firebase, Google Cloud) · Gordon House, Barrow Street, Dublin 4, Irlande · <a href="https://firebase.google.com" target="_blank" rel="noopener">firebase.google.com</a></p>
    <h3>Signaler un contenu illicite</h3><p>Dans un club, touche le message puis « Signaler au coach ». Pour tout contenu illicite, y compris hors d’un club, écris à ${contactLien()} en indiquant le club, le pseudo, le contenu et la raison. Les contenus les plus graves peuvent aussi être signalés sur <a href="https://www.internet-signalement.gouv.fr" target="_blank" rel="noopener">internet-signalement.gouv.fr</a> (Pharos). Les règles complètes sont dans les conditions d’utilisation.</p>
    <h3>Propriété intellectuelle</h3><p>Les textes, séances, illustrations, vidéos et le nom 2 WORK sont la propriété de l’éditeur. Toute reproduction sans autorisation est interdite. Certaines illustrations et vidéos d’exercices sont réalisées avec l’aide d’outils d’intelligence artificielle ; elles montrent des personnages fictifs. Polices Barlow et Barlow Condensed : SIL Open Font License 1.1. Génération des QR codes : qrcode-generator (Kazuhiko Arase, licence MIT). Clubs : SDK Firebase (Google, licence Apache 2.0).</p>
    <h3>Sources scientifiques</h3><p>Les séances s’appuient sur des recommandations et études publiées (ACSM, Jeffreys 2007, Fradkin 2010, Lauersen 2014, Tabata 1996, Thorborg 2017, Behm 2016…), citées dans les guides de l’application. Elles sont données à titre informatif.</p>`,
    `<h3>Publisher</h3><p>2 WORK is a free, ad-free web app published on a non-professional basis by <b>Aidou</b>, a private individual (GitHub account “aidou-1”), who has given their identity to their host as French law allows (LCEN, art. 1-1, II).</p>
    <p>Contact (questions, personal data, reporting illegal content, parent requests): ${contactLien()}</p>
    <h3>Hosts</h3><p><b>App</b>: GitHub, Inc. (GitHub Pages) · 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA · <a href="https://github.com" target="_blank" rel="noopener">github.com</a></p>
    <p><b>Club accounts and content</b>: Google Ireland Limited (Firebase, Google Cloud) · Gordon House, Barrow Street, Dublin 4, Ireland · <a href="https://firebase.google.com" target="_blank" rel="noopener">firebase.google.com</a></p>
    <h3>Reporting illegal content</h3><p>In a club, tap the message then “Report to the coach”. For any illegal content, including outside a club, write to ${contactLien()} with the club, username, content and reason. The most serious content can also be reported to the French authorities at <a href="https://www.internet-signalement.gouv.fr" target="_blank" rel="noopener">internet-signalement.gouv.fr</a> (Pharos). Full rules are in the terms of use.</p>
    <h3>Intellectual property</h3><p>The texts, workouts, illustrations, videos and the 2 WORK name belong to the publisher. Reproduction without permission is prohibited. Some exercise illustrations and videos are made with the help of artificial intelligence tools; they show fictional characters. Barlow and Barlow Condensed fonts: SIL Open Font License 1.1. QR code generation: qrcode-generator (Kazuhiko Arase, MIT licence). Clubs: Firebase SDK (Google, Apache 2.0 licence).</p>
    <h3>Scientific sources</h3><p>Workouts are based on published guidelines and studies (ACSM, Jeffreys 2007, Fradkin 2010, Lauersen 2014, Tabata 1996, Thorborg 2017, Behm 2016…), cited in the app’s guides. They are provided for information.</p>`)],
  confidentialite: ["Confidentialité", "Privacy", () => L(`<h3>En bref</h3><p><b>Aucune publicité, aucun traceur, aucun compte obligatoire.</b> Tout ce que tu fais dans 2 WORK reste sur ton téléphone. Seuls les <b>clubs</b>, facultatifs, demandent un compte et envoient quelques données en ligne ; et, si tu l’acceptes, des <b>compteurs anonymes</b> (détail plus bas).</p>
    <h3>Données enregistrées sur ton appareil</h3><ul class="prog-obj"><li>Historique des séances, trophées, défis, programmes suivis</li><li>Charges notées en salle et ressenti de fin de séance</li><li>Séances de club notées (type de séance et intensité) : elles restent sur ce téléphone, hors sauvegarde en ligne (seulement dans le fichier de sauvegarde que tu crées toi-même), sont gardées un an et s’effacent avec « Supprimer toutes mes données »</li><li>Profil (prénom, date de naissance ou âge, poids, taille, objectif, sport, niveau) et planning</li><li>Réponses au questionnaire d’accueil (sports pratiqués et qui te tentent, environnements, style, matériel) : elles servent seulement à ordonner les sports dans l’appli</li><li>Réglages (langue, voix, thème)</li></ul>
    <p>Elles sont stockées dans le stockage local du navigateur (« localStorage ») et ne sont jamais envoyées à 2 WORK ni à un tiers. L’âge (calculé depuis la date de naissance), le poids et la taille sont facultatifs et servent uniquement à des calculs faits sur le téléphone (calories, fréquence cardiaque). Le compte est facultatif : rien n’est envoyé en ligne tant que tu ne le crées pas.</p>
    <h3>Forme du jour (questionnaire du matin)</h3><p>Si tu remplis le questionnaire facultatif (heures et qualité du sommeil, énergie, courbatures, stress, douleur ou gêne et zone concernée), tes réponses servent à calculer ta batterie et tes statistiques, <b>uniquement sur ton téléphone</b>. Ce sont des données de santé : elles ne sont jamais envoyées, ni à 2 WORK ni à ton club, et ne font pas partie de la sauvegarde en ligne (seulement du fichier de sauvegarde que tu crées toi-même). Elles sont gardées un an, et tu peux les effacer à tout moment dans « Mes progrès ».</p><h3>Capteur de mouvement</h3><p>Si le réglage « Mouvement du téléphone » est activé (et, sur iPhone, si tu l’acceptes), l’inclinaison du téléphone sert seulement à animer l’affichage. Elle est lue sur place, jamais enregistrée ni envoyée.</p><h3>Cookies et mesure d’audience</h3><p>2 WORK n’utilise ni cookie, ni traceur, ni publicité, ni outil de statistiques d’une autre entreprise. Les polices et les vidéos sont hébergées avec l’application.</p><p><b>Compteurs anonymes (facultatifs, avec ton accord) :</b> seulement si tu coches la case (fin de l’accueil ou Réglages), l’appli ajoute +1 à des totaux par jour, communs à tous (par exemple « séances faites le 14 novembre », « première semaine, jour 3 », « revenu 7 jours après »). Rien ne relie ces totaux à toi : ni nom, ni pseudo, ni email, ni identifiant d’appareil, ni données de santé ; seule la date du premier accord reste sur ton téléphone pour calculer les « retours ». Ils sont enregistrés dans la base européenne de 2 WORK (Firebase) et servent uniquement à savoir ce qui aide à garder l’habitude. Décoche la case quand tu veux : plus rien n’est compté.</p>
    <h3>Hébergement</h3><p>L’application est servie par GitHub Pages. Comme tout hébergeur, GitHub peut enregistrer des données techniques de connexion (adresse IP, navigateur) pour la sécurité du service. GitHub, Inc. étant située aux États-Unis, ces données peuvent y être transférées ; GitHub adhère au cadre de protection des données UE–États-Unis (Data Privacy Framework), reconnu par la Commission européenne : voir la <a href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">déclaration de confidentialité de GitHub</a>.</p>
    <h3>Apple Santé et Health Connect</h3><p>Dans l’application téléchargée depuis l’App Store ou Google Play, et seulement si tu l’actives, chaque séance terminée est enregistrée dans Apple Santé ou Health Connect (type de séance, durée, calories estimées). 2 WORK ne lit aucune de tes données de santé.</p>
    <h3>Vidéos hors ligne et sauvegarde</h3><p>Les vidéos téléchargées pour le hors ligne sont stockées sur ton téléphone. Le fichier de sauvegarde est créé à ta demande et reste là où tu choisis de le ranger.</p>
    <h3>Partage et export</h3><p>Une carte image, un fichier d’activité ou un fichier d’agenda ne sont créés que lorsque tu le demandes, et envoyés uniquement vers l’application que tu choisis (Instagram, Strava, Garmin Connect, ton agenda…), selon les règles de celle-ci.</p>
    <h3>Clubs (facultatif, avec compte)</h3><p>Si tu crées un compte pour les clubs, ces données sont enregistrées en ligne : ton <b>email</b> et ton <b>mot de passe</b> (chiffré, géré par Firebase Authentication, jamais visible par 2 WORK), ton <b>pseudo</b>, ta <b>date de naissance</b> et, sous 15 ans, l’accord parental (privés, visibles par toi seul ; sous 15 ans, seul le staff de tes clubs voit un badge « -15 », jamais ton âge), les clubs que tu rejoins, tes <b>messages</b> et réactions, et les séances de club que tu coches.</p>
    <p>Ton pseudo et tes messages sont visibles uniquement par les membres de tes clubs, et les séances que tu coches uniquement par le coach et les co-coachs ; ton email et ta date de naissance ne sont montrés à personne. Ton historique, ton profil et tes progrès restent sur ton téléphone, même avec un compte.</p><p><b>Sections du club :</b> si le club en a (ex. MMA, JJB), les sections que tu demandes et celles où le staff t’a accepté sont visibles des membres du club, et seuls les membres acceptés d’une section (et le staff) voient ses séances et son chat.</p><p><b>Suivi dans le club :</b> le coach et les co-coachs voient, pour les 4 dernières semaines, quelles séances du club chaque membre a cochées. Si le coach active la <b>prévention des blessures</b>, chaque échauffement de prévention terminé ajoute +1 à ta fiche de la semaine (pseudo et nombre de fois) et au total de l’équipe. Le coach choisit si le staff voit ce détail <b>nom par nom</b> ou seulement le <b>total de l’équipe</b> ; la carte de prévention te l’indique. Ces fiches sont effacées quand tu quittes le club, en es retiré, ou quand il est supprimé.</p>
    <p><b>Sauvegarde en ligne (facultative) :</b> seulement si tu l’actives (Clubs → Mon compte, avec une case de consentement), une copie compressée de ton suivi (historique, trophées, programmes, profil dont âge et poids, réglages) est enregistrée dans la même base européenne : historique et ressentis, trophées, programmes, profil (date de naissance, poids, taille), mensurations, tests, charges et programmes de reprise après blessure. Elle est inaccessible aux autres utilisateurs et l’éditeur ne la consulte pas ; elle est mise à jour après chaque séance. Ton accord est gardé dans ton compte : le retirer sur un téléphone arrête la copie sur tous, et la copie en ligne est alors effacée. Sur un nouveau téléphone, la copie automatique ne reprend qu’après que tu as choisi « Restaurer ».</p>
    <p><b>Responsable du traitement :</b> Aidou, éditeur de 2 WORK (voir les mentions légales), joignable à ${contactLien()}. <b>Sous-traitant :</b> Google Ireland Limited (Firebase), lié par les conditions de traitement des données de Firebase. <b>Où :</b> les clubs, séances et messages sont stockés dans une base Cloud Firestore située dans l’Union européenne. L’email, le mot de passe chiffré et les journaux de connexion (adresse IP, gardée quelques semaines par sécurité) sont gérés par Firebase Authentication, qui peut les traiter hors de l’Union européenne, notamment aux États-Unis : Google LLC est certifiée au cadre de protection des données UE–États-Unis (décision d’adéquation de la Commission européenne) et applique les clauses contractuelles types. Les échanges sont chiffrés (HTTPS) et des règles de sécurité vérifient chaque lecture et chaque écriture.</p>
    <p><b>Pourquoi :</b> faire fonctionner les clubs, sur la base de ton consentement donné à l’inscription (et, sous 15 ans, de celui d’un parent : consentement conjoint, art. 45 de la loi Informatique et Libertés). <b>Durée :</b> tant que ton compte existe ; après sa suppression, Google efface aussi ses copies de sauvegarde (au plus 180 jours). La date de naissance sert uniquement à vérifier l’âge. Le coach et les co-coachs peuvent retirer un message, rendre muet ou exclure un membre, toujours avec un motif montré à la personne concernée ; un message signalé est montré au coach et aux co-coachs.</p>
    <p>« Supprimer mon compte » (Clubs → Mon compte) efface immédiatement ton compte, ta sauvegarde en ligne, ta place dans tes clubs, tes séances cochées, tes fiches de prévention et les clubs dont tu es le coach ; tes messages sont vidés et n’affichent plus que « Compte supprimé ». Ton pseudo reste réservé (sans aucune autre donnée) pour que personne ne puisse se faire passer pour toi.</p><p><b>Durées de conservation :</b> messages du chat 12 mois, séances cochées 3 mois, fiches de prévention 8 semaines, signalements 6 mois, demandes d’entrée et avis d’exclusion 3 mois ; ils sont ensuite effacés automatiquement par l’appli du coach ou d’un co-coach, au plus tard la prochaine fois qu’il ouvre le club. Les compteurs anonymes sont des totaux sans aucune donnée personnelle. Le reste (compte, clubs, sauvegarde) est gardé tant que tu ne le supprimes pas.</p><p><b>Signalements et sanctions :</b> un signalement est anonyme (le coach ne voit pas qui l’a fait). Le motif d’une mise en sourdine n’est visible que par la personne concernée et l’équipe du club. Voir aussi la <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">confidentialité de Firebase</a>.</p>
    <h3>Avis et suggestions</h3><p>Les boutons « Donner mon avis » (y compris sur un sport en refonte) ouvrent un formulaire Google Forms anonyme : seul ce que tu choisis d’y écrire est envoyé, avec le nom du sport concerné le cas échéant, selon les <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">règles de confidentialité de Google</a>.</p>
    <h3>Tes droits</h3><p>Tu peux consulter tes données dans « Mes progrès » et « Mon profil », et les supprimer à tout moment avec le bouton ci-dessous ou en effaçant les données du site dans ton navigateur. Désinstaller ou effacer le navigateur les supprime aussi. Pour les données des clubs : « Télécharger mes données de compte » (Clubs → Mon compte) te donne en un fichier JSON tout ce que le serveur garde sur toi (compte, clubs, messages, séances cochées, prévention), et « Supprimer mon compte » l’efface. Tu as un droit d’accès, de rectification, d’effacement, de limitation, de portabilité, d’opposition et de retirer ton consentement à tout moment : écris à ${contactLien()}. Un parent peut demander par ce biais la suppression du compte de son enfant de moins de 15 ans. Tu peux aussi adresser une réclamation à la CNIL (<a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener">cnil.fr</a>).</p>`,
    `<h3>In short</h3><p><b>No ads, no trackers, no mandatory account.</b> Everything you do in 2 WORK stays on your phone. Only <b>clubs</b>, which are optional, need an account and send some data online; and, if you agree, <b>anonymous counters</b> (details below).</p><h3>Data stored on your device</h3><ul class="prog-obj"><li>Workout history, trophies, challenges, programmes</li><li>Gym weights and end-of-workout feedback</li><li>Logged club sessions (session type and intensity): they stay on this phone, outside the online backup (only in the backup file you create yourself), are kept for one year and are erased with “Delete all my data”</li><li>Profile (first name, date of birth or age, weight, height, goal, sport, level) and weekly plan</li><li>Answers to the welcome questionnaire (sports you play and want to try, settings, style, equipment): only used to order sports in the app</li><li>Settings (language, voice, theme)</li></ul>
    <p>They are kept in the browser’s local storage (“localStorage”) and are never sent to 2 WORK or any third party. Age (calculated from your date of birth), weight and height are optional and only used for calculations on the phone (calories, heart rate). The account is optional: nothing is sent online until you create it.</p>
    <h3>Daily fitness (morning check-in)</h3><p>If you fill in the optional check-in (hours and quality of sleep, energy, soreness, stress, pain or discomfort and where), your answers are used to calculate your battery and your stats, <b>only on your phone</b>. This is health data: it is never sent, neither to 2 WORK nor to your club, and is not part of the online backup (only of the backup file you create yourself). It is kept for one year, and you can delete it at any time in “My progress”.</p><h3>Motion sensor</h3><p>If the “Phone motion” setting is on (and, on iPhone, if you allow it), your phone’s tilt is only used to animate the display. It is read on the device, never stored or sent.</p><h3>Cookies and analytics</h3><p>2 WORK uses no cookies, no trackers, no ads and no third-party analytics tool. Fonts and videos are hosted with the app.</p><p><b>Anonymous counters (optional, with your consent):</b> only if you tick the box (end of onboarding or Settings), the app adds +1 to daily totals shared by everyone (for example “workouts done on 14 November”, “first week, day 3”, “came back 7 days later”). Nothing links these totals to you: no name, no username, no email, no device identifier, no health data; only the date of your first consent stays on your phone to compute the “returns”. They are stored in 2 WORK’s European database (Firebase) and are used only to learn what helps people keep the habit. Untick the box whenever you like: nothing more is counted.</p>
    <h3>Hosting</h3><p>The app is served by GitHub Pages. Like any host, GitHub may log technical connection data (IP address, browser) for security. As GitHub, Inc. is based in the United States, this data may be transferred there; GitHub participates in the EU–US Data Privacy Framework recognised by the European Commission: see <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">GitHub’s privacy statement</a>.</p>
    <h3>Apple Health and Health Connect</h3><p>In the app downloaded from the App Store or Google Play, and only if you turn it on, each completed workout is saved to Apple Health or Health Connect (workout type, duration, estimated calories). 2 WORK does not read any of your health data.</p>
    <h3>Offline videos and backup</h3><p>Videos downloaded for offline use are stored on your phone. The backup file is created when you ask and stays wherever you choose to keep it.</p>
    <h3>Sharing and export</h3><p>An image card, activity file or calendar file is only created when you ask for it, and only sent to the app you choose (Instagram, Strava, Garmin Connect, your calendar…), under that app’s rules.</p>
    <h3>Clubs (optional, with an account)</h3><p>If you create an account for clubs, this data is stored online: your <b>email</b> and <b>password</b> (encrypted, handled by Firebase Authentication, never visible to 2 WORK), your <b>username</b>, your <b>date of birth</b> and, under 15, parental consent (private, visible only to you; under 15, only your clubs’ staff see an “-15” badge, never your age), the clubs you join, your <b>messages</b> and reactions, and the club workouts you tick.</p>
    <p>Your username and messages are visible only to members of your clubs, and the workouts you tick only to the coach and co-coaches; your email and date of birth are shown to no one. Your history, profile and progress stay on your phone, even with an account.</p><p><b>Club sections:</b> if the club has some (e.g. MMA, BJJ), the sections you request and those staff accepted you into are visible to club members, and only a section’s accepted members (and staff) see its workouts and chat.</p><p><b>Tracking in the club:</b> the coach and co-coaches can see, for the last 4 weeks, which club workouts each member ticked. If the coach turns on <b>injury prevention</b>, each finished prevention warm-up adds +1 to your record for the week (username and number of times) and to the team total. The coach chooses whether staff see this detail <b>name by name</b> or only the <b>team total</b>; the prevention card tells you which. These records are deleted when you leave the club, are removed from it, or when it is deleted.</p>
    <p><b>Online backup (optional):</b> only if you turn it on (Clubs → My account, with a consent box), a compressed copy of your progress (history, trophies, programmes, profile including age and weight, settings) is stored in the same European database: history and how you felt, trophies, programmes, profile (date of birth, weight, height), body measurements, tests, loads and back-after-injury programmes. It is inaccessible to other users and the publisher does not look at it; it is updated after each workout. Your consent is kept in your account: withdrawing it on one phone stops the copy on all of them, and the online copy is then erased. On a new phone, the automatic copy only resumes once you choose “Restore”.</p>
    <p><b>Controller:</b> Aidou, publisher of 2 WORK (see the legal notice), reachable at ${contactLien()}. <b>Processor:</b> Google Ireland Limited (Firebase), bound by the Firebase data processing terms. <b>Where:</b> clubs, workouts and messages are stored in a Cloud Firestore database located in the European Union. Your email, encrypted password and sign-in logs (IP address, kept a few weeks for security) are handled by Firebase Authentication, which may process them outside the European Union, including in the United States: Google LLC is certified under the EU–US Data Privacy Framework (European Commission adequacy decision) and applies standard contractual clauses. Traffic is encrypted (HTTPS) and security rules check every read and write.</p>
    <p><b>Why:</b> to run clubs, based on your consent given at sign-up (and, under 15, a parent’s consent too: joint consent, art. 45 of the French Data Protection Act). <b>How long:</b> as long as your account exists; after deletion, Google also erases its backup copies (within 180 days). Your date of birth is only used to check your age. The coach and co-coaches can remove a message, mute or remove a member, always with a reason shown to the person concerned; a reported message is shown to the coach and co-coaches.</p>
    <p>“Delete my account” (Clubs → My account) immediately erases your account, online backup, club memberships, ticked workouts, prevention records and the clubs you coach; your messages are emptied and only show “Deleted account”. Your username stays reserved (with no other data) so nobody can impersonate you.</p><p><b>Retention periods:</b> chat messages 12 months, ticked workouts 3 months, prevention records 8 weeks, reports 6 months, join requests and removal notices 3 months; they are then deleted automatically by the coach’s or a co-coach’s app, at the latest the next time they open the club. Anonymous counters are totals with no personal data. The rest (account, clubs, backup) is kept until you delete it.</p><p><b>Reports and sanctions:</b> a report is anonymous (the coach does not see who made it). The reason for a mute is only visible to the person concerned and the club staff. See also <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">Firebase privacy</a>.</p>
    <h3>Feedback</h3><p>The “Give feedback” buttons (including on a sport being reworked) open an anonymous Google Forms form: only what you choose to write is sent, with the sport’s name where relevant, under <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google’s privacy policy</a>.</p>
    <h3>Your rights</h3><p>You can view your data in “My progress” and “My profile”, and delete it at any time with the button below or by clearing this site’s data in your browser. For club data: “Download my account data” (Clubs → My account) gives you, in one JSON file, everything the server keeps about you (account, clubs, messages, ticked workouts, prevention), and “Delete my account” erases it. You have the right to access, correct, erase, restrict, port and object, and to withdraw your consent at any time: write to ${contactLien()}. A parent can use this address to request deletion of their under-15 child’s account. You can also lodge a complaint with the CNIL (<a href="https://www.cnil.fr/en/" target="_blank" rel="noopener">cnil.fr</a>).</p>`) + `<button class="toggle contour danger" id="effacerTout">🗑 ${L("Supprimer toutes mes données", "Delete all my data")}</button><p class="sh-aide">${L("Efface ce téléphone et, si tu as un compte, ta copie en ligne (la sauvegarde en ligne s’arrête aussi sur tes autres téléphones). Ton compte des clubs se supprime dans Clubs → Mon compte.", "Erases this phone and, if you have an account, your online copy (online backup also stops on your other phones). Your clubs account is deleted in Clubs → My account.")}</p>`],
  cgu: ["Conditions d’utilisation", "Terms of use", () => L(`<p class="sh-aide">Version du 14 novembre 2026</p>
    <h3>1. Objet</h3><p>Ces conditions encadrent l’utilisation de 2 WORK, application gratuite d’échauffement, d’entraînement et de récupération, éditée à titre non professionnel (voir les mentions légales). Utiliser l’application, et en particulier créer un compte pour les clubs, vaut acceptation de ces conditions.</p>
    <h3>2. Accès</h3><p>L’application est gratuite et s’utilise sans compte. Seuls les clubs et la sauvegarde en ligne demandent un compte, créé (facultatif) depuis l’écran Clubs. Le service est fourni « en l’état » : il peut évoluer, être interrompu ou s’arrêter, sans garantie de disponibilité.</p>
    <h3>3. Santé</h3><p>Les séances sont données à titre informatif et ne remplacent pas l’avis d’un médecin, d’un kinésithérapeute ou d’un coach diplômé. Lis l’avertissement santé. Tu restes seul juge de ton effort : arrête-toi en cas de douleur ou de malaise.</p>
    <h3>4. Compte (clubs)</h3><ul class="prog-obj"><li>Tu donnes des informations exactes, tu gardes ton mot de passe secret et tu n’as qu’un compte.</li><li>Ton pseudo ne doit pas être injurieux, trompeur ni reprendre l’identité d’une autre personne.</li><li>Âge : il faut avoir au moins 10 ans pour créer un compte, et 18 ans pour créer un club ou être co-coach. Moins de 15 ans : l’inscription demande ton accord et celui d’un parent ; seul le staff de tes clubs voit que tu as moins de 15 ans (badge « -15 », jamais ton âge), et les liens sont masqués pour toi dans le chat. Un parent peut demander à tout moment la fermeture du compte de son enfant à ${contactLien()}.</li><li>Tu peux supprimer ton compte à tout moment (Clubs → Mon compte).</li></ul>
    <h3>5. Clubs</h3><p>Le créateur d’un club en est le coach ; il doit être majeur. Il valide les membres, publie les séances, peut nommer des co-coachs et modère son club. Il veille à proposer des séances adaptées au niveau et à l’âge de ses membres, sous sa propre responsabilité ; 2 WORK n’intervient pas dans l’organisation des clubs.</p>
    <h3>6. Règles du chat</h3><p>Sont interdits : le harcèlement, les insultes, les menaces et les propos discriminatoires ; les contenus sexuels, violents ou illégaux ; la publication d’informations personnelles d’autrui (adresse, téléphone, photos…) ; le spam et la publicité ; l’usurpation d’identité. Ne partage jamais ton adresse ou ton numéro dans un club. Respecte particulièrement les membres mineurs.</p>
    <h3>7. Signalement et modération</h3><ul class="prog-obj"><li>Chaque membre peut signaler un message au coach et aux co-coachs (touche le message → « Signaler au coach ») ; le signalement est anonyme.</li><li>Un filtre automatique bloque à l’envoi certaines insultes et, pour les simples membres, les liens vers d’autres sites ; aucun autre tri automatique n’est fait, les décisions sont prises par des personnes.</li><li>Toute personne, membre ou non, peut signaler un contenu illicite à ${contactLien()} en précisant le club, le pseudo, le contenu et la raison. Tu reçois un accusé de réception et une réponse dès que possible.</li><li>Sanctions possibles : retrait d’un message, mise en sourdine, exclusion du club ; l’éditeur peut aussi supprimer un club ou un compte en cas d’abus grave ou de contenu manifestement illicite. Chaque sanction est accompagnée d’un motif montré à la personne concernée, qui peut la contester auprès du coach ou à ${contactLien()}.</li><li>En cas de menace pour la vie ou la sécurité d’une personne, l’éditeur informe les autorités compétentes.</li></ul>
    <h3>8. Tes contenus</h3><p>Tu restes propriétaire de tes messages. Tu autorises leur affichage aux membres de tes clubs, tant qu’ils ne sont pas supprimés. Tu garantis avoir le droit de les publier.</p>
    <h3>9. Propriété intellectuelle</h3><p>L’application, ses textes, séances, illustrations et vidéos appartiennent à l’éditeur (voir les mentions légales). Tu peux t’en servir pour ton usage personnel et au sein de tes clubs, mais pas les copier ou les revendre.</p>
    <h3>10. Responsabilité</h3><p>L’éditeur fait de son mieux pour un service fiable et sûr, mais ne peut pas être tenu responsable d’un usage contraire à ces conditions, des contenus publiés par les membres, ni des conséquences d’un effort mal adapté à ta condition physique.</p>
    <h3>11. Données personnelles</h3><p>Voir la page Confidentialité.</p>
    <h3>12. Modifications et droit applicable</h3><p>Ces conditions peuvent évoluer : la version en vigueur est affichée ici avec sa date. Elles sont soumises au droit français. En cas de désaccord, écris d’abord à ${contactLien()} pour trouver une solution amiable.</p>`,
    `<p class="sh-aide">Version of 14 November 2026</p>
    <h3>1. Purpose</h3><p>These terms govern the use of 2 WORK, a free warm-up, training and recovery app, published on a non-professional basis (see the legal notice). Using the app, and in particular creating an account for clubs, means you accept these terms.</p>
    <h3>2. Access</h3><p>The app is free and works without an account. Only clubs and online backup need an account, created (optional) from the Clubs screen. The service is provided “as is”: it may change, be interrupted or stop, with no guarantee of availability.</p>
    <h3>3. Health</h3><p>Workouts are provided for information and do not replace advice from a doctor, physiotherapist or qualified coach. Read the health notice. You alone judge your effort: stop if you feel pain or unwell.</p>
    <h3>4. Account (clubs)</h3><ul class="prog-obj"><li>You give accurate information, keep your password secret and have only one account.</li><li>Your username must not be offensive, misleading or impersonate someone else.</li><li>Age: you must be at least 10 to create an account, and 18 to create a club or be a co-coach. Under 15: sign-up requires your agreement and a parent’s; only your clubs’ staff can see you are under 15 (an “-15” badge, never your age), and links are hidden for you in the chat. A parent can ask at any time for their child’s account to be closed at ${contactLien()}.</li><li>You can delete your account at any time (Clubs → My account).</li></ul>
    <h3>5. Clubs</h3><p>A club’s creator is its coach and must be an adult. They approve members, post workouts, can appoint co-coaches and moderate their club. They make sure workouts suit their members’ level and age, under their own responsibility; 2 WORK does not take part in running clubs.</p>
    <h3>6. Chat rules</h3><p>Not allowed: harassment, insults, threats and discriminatory remarks; sexual, violent or illegal content; posting other people’s personal information (address, phone, photos…); spam and advertising; impersonation. Never share your address or phone number in a club. Be especially respectful of members who are minors.</p>
    <h3>7. Reporting and moderation</h3><ul class="prog-obj"><li>Any member can report a message to the coach and co-coaches (tap the message → “Report to the coach”); the report is anonymous.</li><li>An automatic filter blocks some insults and, for regular members, links to other websites when sending; there is no other automated sorting, decisions are made by people.</li><li>Anyone, member or not, can report illegal content to ${contactLien()}, giving the club, username, content and reason. You get an acknowledgement and an answer as soon as possible.</li><li>Possible measures: removing a message, muting, removal from the club; the publisher may also delete a club or account for serious abuse or manifestly illegal content. Every measure comes with a reason shown to the person concerned, who can challenge it with the coach or at ${contactLien()}.</li><li>If someone’s life or safety is threatened, the publisher informs the competent authorities.</li></ul>
    <h3>8. Your content</h3><p>You keep ownership of your messages. You allow them to be shown to your club members until they are deleted. You confirm you have the right to post them.</p>
    <h3>9. Intellectual property</h3><p>The app, its texts, workouts, illustrations and videos belong to the publisher (see the legal notice). You may use them for your personal use and within your clubs, but not copy or resell them.</p>
    <h3>10. Liability</h3><p>The publisher does its best to provide a reliable and safe service, but cannot be held liable for use contrary to these terms, for content posted by members, or for the consequences of effort unsuited to your physical condition.</p>
    <h3>11. Personal data</h3><p>See the Privacy page.</p>
    <h3>12. Changes and governing law</h3><p>These terms may change: the current version is shown here with its date. They are governed by French law. In case of disagreement, first write to ${contactLien()} to find an amicable solution.</p>`)],
  sante: ["Avertissement santé", "Health notice", () => L(`<h3>Avant de commencer</h3><p>2 WORK propose des séances d’activité physique à titre informatif. L’application ne remplace pas l’avis d’un médecin, d’un kinésithérapeute ou d’un coach diplômé.</p>
    <p>Demande l’avis d’un médecin avant de commencer si tu as un problème cardiaque, une tension élevée, une maladie chronique, une blessure en cours, si tu es enceinte, si tu reprends après une longue pause ou si tu as plus de 45 ans et que tu ne fais pas de sport.</p>
    <h3>Pendant la séance</h3><ul class="prog-obj"><li>Arrête immédiatement en cas de douleur dans la poitrine, d’essoufflement anormal, de vertige, de malaise ou de douleur articulaire vive.</li><li>En cas d’urgence, appelle le <b>15</b> (SAMU) ou le <b>112</b>.</li><li>Adapte toujours l’intensité à tes sensations : aucune séance ne doit faire mal.</li></ul>
    <h3>Estimations</h3><p>Les calories, la fréquence cardiaque maximale et les zones sont des estimations moyennes. Les programmes de retour au sport après blessure ne sont pas des soins : ils sont à suivre avec l’accord de ton médecin ou kiné.</p>
    <h3>Mineurs</h3><p>Les moins de 18 ans doivent utiliser l’application avec l’accord d’un parent et éviter les charges lourdes sans encadrement.</p>`,
    `<h3>Before you start</h3><p>2 WORK provides exercise sessions for information only. The app does not replace advice from a doctor, physiotherapist or qualified coach.</p>
    <p>Ask a doctor before starting if you have a heart condition, high blood pressure, a chronic illness, a current injury, if you are pregnant, returning after a long break, or over 45 and inactive.</p>
    <h3>During the workout</h3><ul class="prog-obj"><li>Stop immediately if you feel chest pain, unusual breathlessness, dizziness, faintness or sharp joint pain.</li><li>In an emergency, call <b>112</b> (or your local emergency number).</li><li>Always adapt intensity to how you feel: no workout should hurt.</li></ul>
    <h3>Estimates</h3><p>Calories, maximum heart rate and zones are average estimates. Return-from-injury protocols should be followed with your doctor’s or physio’s agreement.</p>
    <h3>Minors</h3><p>Under-18s should use the app with a parent’s agreement and avoid heavy loads without supervision.</p>`)]
};
// « Supprimer toutes mes données » : copie en ligne effacée et compte déconnecté (le compte des clubs lui-même se supprime depuis Clubs),
// puis données, vidéos et pages hors ligne de ce téléphone
async function effacerToutAppareil(meme) {   // renvoie false (sans rien effacer) si un compte existe mais que le serveur est injoignable, sauf « meme »
  if (lire("clubCompte")) { let ok = false;
    try { if (typeof serveurPret === "function" && await serveurPret()) { await SV.changerAccordSauvegarde(false); await SV.effacerSauvegarde(); await SV.deconnexion().catch(() => {}); ok = true; } } catch (e) {}
    if (!ok && !meme) return false; }
  try { await Promise.all((await caches.keys()).map(k => caches.delete(k))); } catch (e) {}
  try { (indexedDB.databases ? (await indexedDB.databases()).map(d => d.name) : ["firebaseLocalStorageDb"]).forEach(n => n && indexedDB.deleteDatabase(n)); } catch (e) {}
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  return true;
}
function ouvrirPage(id) {
  const [fr, en, html] = PAGES[id];
  $("pgPageTitre").textContent = L(fr, en); $("pageCorps").innerHTML = `<div class="carnet page-texte">${html()}</div>`;
  const b = $("effacerTout");
  if (b) b.onclick = () => {
    if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = "⚠️ " + L("Toucher encore pour tout effacer définitivement", "Tap again to erase everything permanently"); return; }
    b.disabled = true; b.textContent = "…";
    effacerToutAppareil(b.dataset.conf === "2").then(ok => { if (ok) return location.reload(); b.disabled = false; b.dataset.conf = 2;
      b.textContent = "⚠️ " + L("Pas de connexion : ta copie en ligne et ton compte resteraient. Toucher encore pour effacer quand même ce téléphone", "No connection: your online copy and account would remain. Tap again to erase this phone anyway"); });
  };
  ecran("page");
}
// entrées dans les Réglages : profil en tête, informations en bas
(() => {
  const R = $("reglages"), sub = R.querySelector(".sub");
  sub.insertAdjacentHTML("afterend", `<button class="choice" id="rgProfil" style="--c:#DB2777"><strong>${L("Mon profil", "My profile")}</strong><span>${L("Âge, poids, objectif, sport, niveau", "Age, weight, goal, sport, level")}</span></button><button class="choice" id="rgPlanning" style="--c:#2563EB"><strong>${L("Ma semaine", "My week")}</strong><span>${L("Jours d’entraînement et rappels dans l’agenda", "Training days and calendar reminders")}</span></button>`);
  R.insertAdjacentHTML("beforeend", `<h2 class="sec">${L("Informations", "Information")}</h2><div class="infos-liens">${Object.entries(PAGES).map(([k, [f, e]]) => `<button class="toggle contour" data-page="${k}">${L(f, e)}</button>`).join("")}</div>`);
  $("rgProfil").onclick = () => ouvrirProfil("reglages"); $("rgPlanning").onclick = () => ouvrirPlanning("reglages");
  R.querySelectorAll("[data-page]").forEach(b => b.onclick = () => ouvrirPage(b.dataset.page));
  document.querySelector("#menu .tableau").insertAdjacentHTML("afterend", `<div class="semaine-carte" id="formeCarte"></div><div class="semaine-carte vita" id="vitaCarte"></div><div class="semaine-carte jeu" id="jeuCarte"></div><div class="semaine-carte" id="repriseCarte"></div><div class="semaine-carte" id="semaineCarte"></div><div class="semaine-carte quick" id="quickCarte"></div><div class="semaine-carte banniere" id="banniere"></div>`);
  $("profilRetour").onclick = () => retour(() => profilRetourVers === "planning" ? ouvrirPlanning(planningRetourVers) : ecran(profilRetourVers));
  $("planningRetour").onclick = () => retour(() => planningRetourVers === "profil" ? ouvrirProfil(profilRetourVers === "planning" ? "reglages" : profilRetourVers) : ecran(planningRetourVers));
  $("pageRetour").onclick = () => retour(() => ecran("reglages"));
})();

/* ============ APPLI INSTALLABLE ET HORS LIGNE ============
   Service worker (sw.js) + manifeste : icône sur l'écran d'accueil, plein écran, fonctionnement sans réseau.
   Une appli installée est aussi protégée de l'effacement automatique des données des sites par Safari (7 jours sans visite). */
const installee = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const iOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let invitInstall = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); invitInstall = e; if (ecranCourant === "reglages") renduAppli(); });
addEventListener("appinstalled", () => { invitInstall = null; protegerDonnees(); });
/* Mises à jour : la page arrive du réseau mais les scripts du cache ; quand une nouvelle version prend la main, on recharge une fois
   (seulement hors séance), sinon l'appli tournerait avec les anciens scripts jusqu'au lancement suivant. Retour dans l'appli = recherche de mise à jour. */
if ("serviceWorker" in navigator && /^https?:/.test(location.protocol) && !/claude/.test(location.hostname)) {
  const avant = !!navigator.serviceWorker.controller; let recharge = false;
  navigator.serviceWorker.register("sw.js").then(reg => document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); })).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!avant || recharge) return; recharge = true;
    const go = () => location.reload(); if (["menu", "accueil", "reglages", "outils", "moi"].includes(ecranCourant) && !$("feuille") && !$("tour")) go(); else addEventListener("pagehide", go, { once: true }); });
}
async function protegerDonnees() { try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; } catch (e) { return false; } }
if (installee()) protegerDonnees();
const UA = navigator.userAgent, android = () => /android/i.test(UA);
const navIntegre = () => /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|musical_ly|TikTok|Bytedance|Twitter|LinkedInApp|Pinterest|GSA\//i.test(UA);
const ICO_PARTAGE = `<svg class="ico-etape" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>`;
const ICO_AJOUT = `<svg class="ico-etape" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;
const ICO_MENU = `<svg class="ico-etape" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
async function installer() {
  if (installee()) return ouvrirFeuilleInfo(L("2 WORK est installée", "2 WORK is installed"), `<p>${L("Tu utilises déjà l’appli installée : plein écran, hors ligne et données protégées. ✅", "You are already using the installed app: full screen, offline and protected data. ✅")}</p>`);
  if (invitInstall && !iOS()) { invitInstall.prompt(); const r = await invitInstall.userChoice; invitInstall = null; if (r.outcome === "accepted") protegerDonnees(); renduAppli(); majBanniere(); return r.outcome === "accepted"; }
  ouvrirFeuilleInfo(L("Installer 2 WORK", "Install 2 WORK"), htmlInstall()); brancherInstall();
}
function htmlInstall() {   // étapes d'installation propres au téléphone et au navigateur (feuille « Installer » et guide d’installation)
  const atouts = `<p class="inst-atouts">${L("Gratuit · sans compte · fonctionne hors ligne · moins de 1 Mo", "Free · no account · works offline · under 1 MB")}</p>`;
  const etapes = l => `<ol class="etapes-inst">${l.map(x => `<li>${x}</li>`).join("")}</ol>`;
  let html;
  if (navIntegre()) html = `<p>${L("Tu es dans le navigateur d’une autre appli (Instagram, Facebook, TikTok…), qui ne permet pas d’installer 2 WORK.", "You are in another app’s browser (Instagram, Facebook, TikTok…), which cannot install 2 WORK.")}</p>`
    + etapes([L(`Touche ${ICO_MENU} ou <b>⋯</b> en haut de l’écran.`, `Tap ${ICO_MENU} or <b>⋯</b> at the top of the screen.`), L(`Choisis <b>« Ouvrir dans le navigateur »</b> (Safari sur iPhone, Chrome sur Android).`, `Choose <b>“Open in browser”</b> (Safari on iPhone, Chrome on Android).`), L("Touche à nouveau « Installer l’appli ».", "Tap “Install the app” again.")])
    + `<button class="toggle" id="instCopier">🔗 ${L("Copier le lien", "Copy the link")}</button>`;
  else if (iOS()) {
    const safari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(UA), ios26 = +((/Version\/(\d+)/.exec(UA) || /OS (\d+)_/.exec(UA) || [])[1]) >= 26, ipad = /ipad/i.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1), n = lireHist().length;
    html = atouts + (n ? `<div class="inst-avant"><b>💾 ${L("D’abord, sauvegarde ton suivi", "First, back up your progress")}</b><p>${L(`Sur iPhone, l’appli installée ne reprend pas les données de Safari. Sauvegarde ${n > 1 ? `tes ${n} séances` : "ta séance"} maintenant, puis dans l’appli : Réglages → Restaurer.`, `On iPhone, the installed app does not take over Safari’s data. Back up ${n > 1 ? `your ${n} workouts` : "your workout"} now, then in the app: Settings → Restore.`)}</p><button class="toggle" id="instSauver">💾 ${L("Sauvegarder", "Back up")}</button></div>` : "")
      + etapes(safari ? [ios26 ? L(`Touche <b>⋯</b> à côté de la barre d’adresse, puis <b>Partager</b> ${ICO_PARTAGE} (si la barre affiche déjà ${ICO_PARTAGE}, touche-le directement).`, `Tap <b>⋯</b> next to the address bar, then <b>Share</b> ${ICO_PARTAGE} (if the bar already shows ${ICO_PARTAGE}, tap it directly).`)
          : L(`Touche le bouton <b>Partager</b> ${ICO_PARTAGE} ${ipad ? "en haut à droite" : "en bas de l’écran"}.`, `Tap the <b>Share</b> button ${ICO_PARTAGE} ${ipad ? "at the top right" : "at the bottom of the screen"}.`),
          L(`Fais défiler et choisis <b>« Sur l’écran d’accueil »</b> ${ICO_AJOUT}. Absent ? Tout en bas, « Modifier les actions » permet de l’ajouter.`, `Scroll down and choose <b>“Add to Home Screen”</b> ${ICO_AJOUT}. Missing? At the very bottom, “Edit Actions” lets you add it.`),
          L(`${ios26 ? "Laisse <b>« Ouvrir en tant qu’app web »</b> activé, puis t" : "T"}ouche <b>Ajouter</b> : l’icône 2 WORK apparaît sur ton écran d’accueil.`, `${ios26 ? "Leave <b>“Open as Web App”</b> on, then t" : "T"}ap <b>Add</b>: the 2 WORK icon appears on your home screen.`)]
        : [L(`Touche le bouton <b>Partager</b> ${ICO_PARTAGE} dans la barre d’adresse.`, `Tap the <b>Share</b> button ${ICO_PARTAGE} in the address bar.`), L(`Choisis <b>« Ajouter à l’écran d’accueil »</b> ${ICO_AJOUT}.`, `Choose <b>“Add to Home Screen”</b> ${ICO_AJOUT}.`), L("Si l’option n’apparaît pas, ouvre cette page dans <b>Safari</b> et recommence.", "If the option does not appear, open this page in <b>Safari</b> and try again.")])
      + `<p class="sh-aide">${L("Ensuite, ouvre 2 WORK depuis son icône : plein écran, hors ligne, et tes données sont protégées.", "Then open 2 WORK from its icon: full screen, offline, and your data is protected.")}</p>`;
  } else if (android()) html = atouts + etapes([L(`Touche ${ICO_MENU} en haut à droite de Chrome.`, `Tap ${ICO_MENU} at the top right of Chrome.`), L("Choisis <b>« Installer l’application »</b> ou <b>« Ajouter à l’écran d’accueil »</b>.", "Choose <b>“Install app”</b> or <b>“Add to Home screen”</b>."), L("Confirme : l’icône 2 WORK apparaît avec tes autres applis.", "Confirm: the 2 WORK icon appears with your other apps.")])
    + `<p class="sh-aide">${L("Samsung Internet : menu ☰ puis « Ajouter la page à » → « Écran d’accueil ». Firefox : ⋮ puis « Installer ».", "Samsung Internet: menu ☰ then “Add page to” → “Home screen”. Firefox: ⋮ then “Install”.")}</p>`;
  else html = `<div class="inst-qr"><img src="icons/qr.png" width="180" height="180" alt="QR code"><p>${L("Scanne ce code avec l’appareil photo de ton téléphone pour ouvrir 2 WORK, puis touche « Installer l’appli ».", "Scan this code with your phone’s camera to open 2 WORK, then tap “Install the app”.")}</p></div>`
    + `<p class="sh-aide">${L("Sur ordinateur, avec Chrome ou Edge : icône d’installation à droite de la barre d’adresse.", "On a computer, with Chrome or Edge: install icon on the right of the address bar.")}</p>`;
  return html;
}
function brancherInstall() {
  if ($("instSauver")) $("instSauver").onclick = sauvegarder;
  if ($("instCopier")) $("instCopier").onclick = async () => { try { await navigator.clipboard.writeText(location.href.split("?")[0]); $("instCopier").textContent = "✓ " + L("Lien copié", "Link copied"); } catch (e) { $("instCopier").textContent = location.href.split("?")[0]; } };
}
function ouvrirFeuilleInfo(titre, html) {
  fermerFeuille();
  document.body.insertAdjacentHTML("beforeend", `<div class="feuille-fond" id="feuille"><div class="feuille" role="dialog" aria-label="${titre}"><h3>${titre}</h3>${html}<button class="toggle contour" id="fsFermer">${L("Fermer", "Close")}</button></div></div>`);
  $("feuille").onclick = e => { if (e.target.id === "feuille") fermerFeuille(); }; $("fsFermer").onclick = fermerFeuille;
}
// vidéos hors ligne : téléchargement de toutes les vidéos dans le cache dédié
const CACHE_VIDEOS = "2work-videos";
async function etatVideos() { try { const c = await caches.open(CACHE_VIDEOS); return (await c.keys()).length; } catch (e) { return -1; } }
async function telechargerVideos(maj) {
  const c = await caches.open(CACHE_VIDEOS), deja = new Set((await c.keys()).map(r => r.url.split("/").pop()));
  const l = VIDEOS.filter(id => EXERCICES[id] && !deja.has(id + ".mp4")); let n = VIDEOS.length - l.length, err = 0;
  for (let i = 0; i < l.length; i += 4) {
    await Promise.all(l.slice(i, i + 4).map(async id => { try { const r = await fetch(`videos/${id}.mp4`); if (!r.ok) throw 0; await c.put(new URL(`videos/${id}.mp4`, location.href).href, r); n++; } catch (e) { err++; } }));
    maj(n, VIDEOS.length);
  }
  VIDEOS.forEach(id => fetch(`vignettes/${id}.webp`).catch(() => {}));   // le service worker les garde pour le hors-ligne
  protegerDonnees(); return err;
}

/* ============ SAUVEGARDE ET RESTAURATION ============
   Fichier JSON avec toutes les données de l'appli (et seulement elles). Avant une restauration, les données actuelles sont copiées
   dans « sauvegardeAvantRestauration », et « Annuler la dernière restauration » (Réglages → Mes données) les remet. */
const CLE_APPLI = /^(forme|verre|mouvement|style|minuteur|tests|corps|cardioSupport|combat|minuteurs|boutique|progPerso|duel|avisDonnes|rappelNotif|avatar|charges|coach|defiSerie|duree\w*|favoris|historique|langue|langueVoix|muscleVu|musclesLus|niveauRenfo|nomVoix|planning|profil|recapVu|recupTabata|repriseAccord|repsTabata|theme|trophees|veille|voix|repos\w*|series\w*|cycles\w*|ouvrirReglages|sauvegardeDate|bienvenue2?|santeSync|banniere\w*|guideVu|bilanVu|boxe|clubJournal|quickPrefs|semaine1|s1Off|statsAccord|statsInstall|sonsUI|vibrations|volumeSons|forceVib|conseils|musique)$|^(prog_|reprise_|routine_|minutes_|sp_)/;   // sp_ : réglages des écrans de sport (jours, dates, objectifs…)
function donneesAppli() { const d = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (CLE_APPLI.test(k)) d[k] = localStorage.getItem(k); } } catch (e) {} return d; }
async function sauvegarder() {
  const j = jourCle(), f = JSON.stringify({ app: "2WORK", version: 1, date: new Date().toISOString(), donnees: donneesAppli() });
  const r = await envoyer(new Blob([f], { type: "application/json" }), `2work-sauvegarde-${j}.json`, "application/json", L("Sauvegarde 2 WORK", "2 WORK backup"));
  if (r !== "annule") { stocker("sauvegardeDate", j); renduDonnees(L("✓ Sauvegarde créée. Garde ce fichier en lieu sûr (iCloud Drive, Google Drive, e-mail…).", "✓ Backup created. Keep this file somewhere safe (iCloud Drive, Google Drive, email…).")); }
}
function choisirRestauration() {
  const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json";
  i.onchange = () => { const f = i.files[0]; if (!f) return; const lr = new FileReader(); lr.onload = () => verifierRestauration(lr.result); lr.readAsText(f); };
  i.click();
}
function verifierRestauration(txt, enLigne) {   // enLigne : copie venue de la sauvegarde en ligne (la copie automatique reprend après « Restaurer »)
  let s; try { s = JSON.parse(txt); } catch (e) { s = null; }
  if (!s || s.app !== "2WORK" || typeof s.donnees !== "object") return renduDonnees(L("⚠️ Ce fichier n’est pas une sauvegarde 2 WORK.", "⚠️ This file is not a 2 WORK backup."));
  const D = Object.fromEntries(Object.entries(s.donnees).filter(([k, v]) => CLE_APPLI.test(k) && typeof v === "string").map(([k, v]) => [k, propre(v)]));
  let nb = 0; try { nb = JSON.parse(D.historique || "[]").length; } catch (e) {}
  ouvrirFeuilleInfo(L("Restaurer cette sauvegarde ?", "Restore this backup?"), `<p>${L(`Sauvegarde du ${new Date(s.date).toLocaleDateString("fr-FR")} : ${nb} séance${nb > 1 ? "s" : ""}, profil, trophées et réglages.`, `Backup from ${new Date(s.date).toLocaleDateString("en-GB")}: ${nb} workout${nb > 1 ? "s" : ""}, profile, trophies and settings.`)}</p>
    <p class="sh-aide">${L("Tes données actuelles sont mises de côté sur ce téléphone avant la restauration : tu ne perds rien.", "Your current data is set aside on this phone before restoring: you lose nothing.")}</p><button class="primary" id="restOk">${L("Restaurer", "Restore")}</button>`);
  $("restOk").onclick = () => {
    const avant = donneesAppli();
    try { localStorage.setItem("sauvegardeAvantRestauration", JSON.stringify({ date: new Date().toISOString(), donnees: avant })); } catch (e) { return renduDonnees(L("⚠️ Mémoire du téléphone pleine : restauration impossible.", "⚠️ Phone storage full: restore failed.")); }
    if (!ecrireDonnees(D)) { ecrireDonnees(avant); return renduDonnees(L("⚠️ Mémoire du téléphone pleine : restauration annulée, tes données n’ont pas changé.", "⚠️ Phone storage full: restore cancelled, your data is unchanged.")); }
    if (enLigne) { stocker("sauvegardeEnLigne", "1"); try { localStorage.removeItem("svPause"); } catch (e) {} }   // la sauvegarde en ligne reprend sur ce téléphone
    location.reload();
  };
}
// remplace toutes les données de l'appli par D (les clés absentes de D sont retirées, sauf forme et clubJournal, absentes de la sauvegarde en ligne) ; tout ou rien
function ecrireDonnees(D) {
  try { Object.keys(donneesAppli()).filter(k => !(k in D) && !["forme", "clubJournal"].includes(k)).forEach(k => localStorage.removeItem(k)); Object.entries(D).forEach(([k, v]) => localStorage.setItem(k, v)); return true; } catch (e) { return false; }
}
function annulerRestauration() {
  let c; try { c = JSON.parse(localStorage.getItem("sauvegardeAvantRestauration")); } catch (e) { c = null; } if (!c || !c.donnees) return;
  if (!ecrireDonnees(c.donnees)) return renduDonnees(L("⚠️ Mémoire du téléphone pleine.", "⚠️ Phone storage full."));
  stocker("sauvegardeEnLigne", "0");   // sinon les anciennes données remplaceraient la copie en ligne : à réactiver dans Clubs si voulu
  try { localStorage.removeItem("sauvegardeAvantRestauration"); } catch (e) {} location.reload();
}
const joursDepuis = j => j ? Math.round((new Date(jourCle()) - new Date(j)) / 864e5) : null;

/* ============ APPLE SANTÉ / HEALTH CONNECT ============
   Disponible uniquement dans l'appli native (Capacitor + extension Capawesome Health, voir projet 2work_capacitor).
   Chaque séance terminée est enregistrée comme entraînement (type, début, fin, calories estimées). */
const santePlugin = () => window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.Plugins && Capacitor.Plugins.Health;
const santeActive = () => { try { return localStorage.getItem("santeSync") === "1"; } catch (e) { return false; } };
const nomSante = () => window.Capacitor && Capacitor.getPlatform && Capacitor.getPlatform() === "android" ? "Health Connect" : L("Apple Santé", "Apple Health");
async function activerSante(on) {
  const H = santePlugin(); if (!H) return;
  if (on) { try { await H.requestPermissions({ read: [], write: ["WORKOUT"] }); } catch (e) { return renduDonnees(L("Autorisation refusée : active-la dans les réglages du téléphone.", "Permission denied: enable it in your phone settings.")); } }
  stocker("santeSync", on ? "1" : "0"); renduDonnees();
}
async function envoyerSante(x) {
  const H = santePlugin(); if (!H || !santeActive()) return "";
  const a = activiteDe(x), cat = x.c || "";
  const type = x.tb ? "HIGH_INTENSITY_INTERVAL_TRAINING" : cat === "yoga" ? "YOGA" : cat === "pilates" ? "PILATES" : x.m === "salle" || x.m === "seance" ? "STRENGTH_TRAINING" : x.m === "calme" || x.m === "souffle" ? "STRETCHING" : "CALISTHENICS";
  const fin = new Date(), deb = new Date(+fin - x.s * 1000), base = { dataType: "WORKOUT", startDate: deb.toISOString(), endDate: fin.toISOString() };
  for (const t of [type, "OTHER"]) { try { await H.writeRecord({ ...base, workout: { workoutType: t, totalCalories: kcalEst(a) } }); return `<p class="sh-ok">❤️ ${L("Séance ajoutée à", "Workout added to")} ${nomSante()}</p>`; } catch (e) {} }
  return "";
}

/* ============ RÉGLAGES : APPLI ET DONNÉES ============ */
function renduAppli() {
  const Z = $("rgAppli"); if (!Z) return;
  Z.innerHTML = installee() ? `<p class="sh-ok">✅ ${L("2 WORK est installée sur ce téléphone : plein écran, hors ligne et données protégées.", "2 WORK is installed on this phone: full screen, offline and protected data.")}</p>`
    : `<p>${L("Icône sur l’écran d’accueil, plein écran, fonctionne sans réseau à la salle, et protège tes données de l’effacement automatique du navigateur.", "Home-screen icon, full screen, works without signal at the gym, and protects your data from the browser’s automatic clean-up.")}</p><button class="primary" id="rgInstaller">📲 ${L("Installer l’appli", "Install the app")}</button>`;
  if ($("rgInstaller")) $("rgInstaller").onclick = installer;
  etatVideos().then(n => { const V = $("rgVideos"); if (!V) return;
    if (n < 0) { V.innerHTML = `<p class="sh-aide">${L("Vidéos hors ligne : disponibles une fois l’appli installée depuis son adresse web.", "Offline videos: available once the app is installed from its web address.")}</p>`; return; }
    V.innerHTML = `<div class="reglage-ligne"><span><b>🎬 ${L("Vidéos hors ligne", "Offline videos")}</b><small id="vidTxt">${n >= VIDEOS.length ? L("Toutes les vidéos sont sur ton téléphone", "All videos are on your phone") : L(`${n}/${VIDEOS.length} enregistrées · environ 55 Mo au total`, `${n}/${VIDEOS.length} saved · about 55 MB in total`)}</small></span>${n >= VIDEOS.length ? `<button class="toggle contour" id="vidSuppr">${L("Supprimer", "Delete")}</button>` : `<button class="toggle" id="vidDl">${L("Télécharger", "Download")}</button>`}</div><div class="barre-dl hidden" id="vidBarre"><i></i></div>`;
    if ($("vidDl")) $("vidDl").onclick = async () => { $("vidDl").disabled = true; $("vidBarre").classList.remove("hidden");
      const err = await telechargerVideos((a, b) => { $("vidBarre").firstChild.style.width = (100 * a / b) + "%"; $("vidTxt").textContent = `${a}/${b}`; });
      if (err) $("vidTxt").textContent = L(`${err} vidéo(s) non téléchargée(s) : vérifie ta connexion et réessaie.`, `${err} video(s) not downloaded: check your connection and try again.`); else renduAppli(); };
    if ($("vidSuppr")) $("vidSuppr").onclick = async () => { await caches.delete(CACHE_VIDEOS); renduAppli(); };
  });
}
function renduDonnees(msg) {
  const Z = $("rgDonnees"); if (!Z) return;
  const d = joursDepuis((() => { try { return localStorage.getItem("sauvegardeDate"); } catch (e) { return null; } })()), H = santePlugin();
  Z.innerHTML = `<p>${d === null ? L("Aucune sauvegarde pour l’instant.", "No backup yet.") : d === 0 ? L("Dernière sauvegarde : aujourd’hui.", "Last backup: today.") : L(`Dernière sauvegarde : il y a ${d} jour${d > 1 ? "s" : ""}.`, `Last backup: ${d} day${d > 1 ? "s" : ""} ago.`)} ${L("Pratique pour changer de téléphone ou réinstaller l’appli.", "Handy when changing phones or reinstalling the app.")}</p>
    <div class="partage-btns"><button class="toggle" id="rgSauver">💾 ${L("Sauvegarder", "Back up")}</button><button class="toggle contour" id="rgRestaurer">↩︎ ${L("Restaurer", "Restore")}</button></div>${msg ? `<p class="sh-ok">${msg}</p>` : ""}
    <div class="reglage-ligne sante-ligne"><span><b>❤️ ${H ? nomSante() : L("Apple Santé et Health Connect", "Apple Health and Health Connect")}</b><small>${H ? L("Ajoute automatiquement chaque séance à tes données de santé", "Automatically adds each workout to your health data") : L("Prévu dans une future appli des stores. En attendant : export Strava ou Garmin en fin de séance.", "Planned for a future store app. Meanwhile: Strava or Garmin export at the end of a workout.")}</small></span>${H ? `<button class="toggle" id="rgSante" aria-pressed="${santeActive()}">${santeActive() ? L("Activé", "On") : L("Activer", "Turn on")}</button>` : ""}</div>`;
  let av = null; try { av = JSON.parse(localStorage.getItem("sauvegardeAvantRestauration")); } catch (e) {}
  if (av && av.date && Date.now() - new Date(av.date) < 3 * 864e5) {   // proposé 3 jours : au-delà, annuler effacerait les séances faites depuis
    Z.querySelector(".partage-btns").insertAdjacentHTML("afterend", `<button class="lien" id="rgAnnulRest">↩︎ ${L(`Annuler la dernière restauration (revenir aux données du ${new Date(av.date).toLocaleDateString("fr-FR")})`, `Undo the last restore (back to the data from ${new Date(av.date).toLocaleDateString("en-GB")})`)}</button>`);
    $("rgAnnulRest").onclick = () => { if (!$("rgAnnulRest").dataset.conf) { $("rgAnnulRest").dataset.conf = 1; return $("rgAnnulRest").textContent = L("Toucher encore : les séances faites depuis seront perdues, et la sauvegarde en ligne sera mise en pause", "Tap again: workouts done since will be lost, and online backup will be paused"); } annulerRestauration(); }; }
  $("rgSauver").onclick = sauvegarder; $("rgRestaurer").onclick = choisirRestauration;
  if ($("rgSante")) $("rgSante").onclick = () => activerSante(!santeActive());
}
(() => {
  const info = [...$("reglages").querySelectorAll("h2.sec")].pop();
  info.insertAdjacentHTML("beforebegin", `<h2 class="sec">${L("Appli et données", "App and data")}</h2><div class="carnet" id="rgAppli"></div><div class="carnet" id="rgVideosBloc"><div id="rgVideos"></div></div><div class="carnet" id="rgDonnees"></div>`);
})();
// bannière discrète sur le menu : sauvegarder (si jamais ou > 30 jours), refusable 7 jours (l'installation est proposée en grand à l'ouverture, js/guide.js)
function majBanniere() {
  const Z = $("banniere"); if (!Z) return; const n = lireHist().length, lu = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const repos = k => { const d = joursDepuis(lu(k)); return d !== null && d < 7; };
  let b = null;
  if (n >= 5 && !repos("banniereSauvegarde") && (joursDepuis(lu("sauvegardeDate")) ?? 99) > 30) b = ["banniereSauvegarde", "💾", L("Sauvegarde ton suivi", "Back up your progress"), L(`${n} séances à mettre à l’abri`, `${n} workouts to keep safe`), sauvegarder];
  if (!b) { Z.innerHTML = ""; return; }
  Z.innerHTML = `<button class="bn-corps"><span class="sc-ico">${b[1]}</span><span><strong>${b[2]}</strong><small>${b[3]}</small></span></button><button class="bn-fermer" aria-label="${L("Plus tard", "Later")}">✕</button>`;
  Z.querySelector(".bn-corps").onclick = b[4];
  Z.querySelector(".bn-fermer").onclick = () => { stocker(b[0], jourCle()); Z.innerHTML = ""; };
}

/* ============ ACCUEIL DU PREMIER LANCEMENT ============
   2 étapes, sans donnée personnelle : sports (pratiqués, qui tentent) → niveau, objectif, matériel (+ goûts facultatifs), puis l'accueil
   avec « Ta première semaine » en tête. Le profil (Réglages → Mon profil), le compte (Clubs) et l'installation (après la 1re séance)
   sont proposés plus tard, au moment où ils servent. Les réponses ordonnent les listes de sports (scorePref, js/catalogue.js). */
const besoinBienvenue = () => { try { return !localStorage.getItem("bienvenue2"); } catch (e) { return false; } };
function finBienvenue() { stocker("bienvenue", "1"); stocker("bienvenue2", "1"); const p = lireProfil(); if (!p.objectif) ecrireProfil("objectif", "forme"); if (!p.niveau && !lire("niveauRenfo")) ecrireProfil("niveau", "debutant"); }   // niveau inconnu : on démarre doucement
const ENVS_Q = [["salle", "En salle", "Indoors"], ["ext", "Dehors", "Outdoors"], ["eau", "Dans l’eau", "In the water"], ["montagne", "En montagne", "In the mountains"], ["maison", "À la maison", "At home"]];
const STYLES_Q = [["seul", "Seul, à mon rythme", "Solo, at my own pace"], ["equipe", "En équipe", "In a team"], ["duel", "En duel, raquette en main", "One-on-one, with a racket"], ["combat", "Sports de combat", "Combat sports"]];
const sportsQ = () => Object.keys(SP_PREF).filter(k => CATS[k] && k !== "renfo").map(k => [k, T(CATS[k].titre), T(CATS[k].titre)]);
const basculer = (cle, k) => { const l = lireProfil()[cle] || [], n = l.includes(k) ? l.filter(x => x !== k) : [...l, k]; ecrireProfil(cle, n); return n.includes(k); };
function bienvenue(etape = 1) {
  etape = Math.min(2, etape); bienvenue.etape = etape;
  const p = lireProfil(), C = $("bvCorps"), pts = `<div class="bv-points">${[1, 2].map(i => `<i class="${i <= etape ? "on" : ""}"></i>`).join("")}</div>`;
  const multi = (cle, l) => `<div class="chips">${l.map(([k, f, e]) => `<button class="toggle" data-m="${cle}" data-k="${k}" aria-pressed="${(p[cle] || []).includes(k)}">${L(f, e)}</button>`).join("")}</div>`;
  const un = (cle, l) => `<div class="chips" data-un="${cle}">${l.map(([k, f, e]) => `<button class="toggle" data-v="${k}" aria-pressed="${p[cle] === k}">${L(f, e)}</button>`).join("")}</div>`;
  if (etape === 1) {
    C.innerHTML = `${pts}<h1>${L("Bienvenue sur 2 WORK", "Welcome to 2 WORK")}</h1><p class="sub">${L("Échauffements, séances guidées à la voix et récupération, pour ton sport. Gratuit, sans pub, sans compte. Quels sports fais-tu ?", "Warm-ups, voice-guided workouts and recovery, for your sport. Free, no ads, no account. Which sports do you do?")}</p>
      <h2 class="sec">${L("Ceux que tu pratiques", "The ones you play")}</h2>${multi("sportsPratiques", sportsQ())}
      <h2 class="sec">${L("Ceux qui te tentent", "The ones you’d like to try")}</h2>${multi("sportsEnvie", sportsQ())}
      <button class="primary" id="bvSuite">${L("Continuer", "Continue")}</button>`;
    $("bvSuite").onclick = () => { const q = lireProfil(), s = (q.sportsPratiques || []).find(k => RENFOS[k]); if (!q.sport && s) ecrireProfil("sport", s); scrollTo(0, 0); bienvenue(2); };
  } else {
    C.innerHTML = `${pts}<h1>${L("Ton niveau", "Your level")}</h1><p class="sub">${L("Pour régler la durée et l’intensité de tes séances.", "To set the length and intensity of your workouts.")}</p>
      <h2 class="sec">${L("À quelle fréquence fais-tu du sport ?", "How often do you exercise?")}</h2>${un("niveau", [["debutant", "Je débute ou je reprends", "Starting or getting back into it"], ["inter", "1 à 2 fois par semaine", "1 to 2 times a week"], ["avance", "3 fois par semaine ou plus", "3 times a week or more"]])}
      <h2 class="sec">${L("Ton objectif", "Your goal")}</h2>${un("objectif", OBJECTIFS)}
      <h2 class="sec">${L("Ton matériel (facultatif)", "Your equipment (optional)")}</h2>${multi("materiel", FAMILLES_MAT)}
      <details class="bv-plus"><summary>${L("Affiner mes goûts (facultatif)", "Fine-tune my tastes (optional)")}</summary><h2 class="sec">${L("Où aimes-tu bouger ?", "Where do you like to move?")}</h2>${multi("envs", ENVS_Q)}<h2 class="sec">${L("Plutôt…", "Rather…")}</h2>${multi("styles", STYLES_Q)}</details>
      <label class="cl-case bv-accord"><input type="checkbox" id="bvStats"${statsOk() ? " checked" : ""}${STATS_TEST ? " disabled" : ""}><span>${TXT_STATS()}</span></label>
      <button class="primary" id="bvSuite">${L("C’est parti !", "Let’s go!")}</button>`;
    C.querySelectorAll("[data-un]").forEach(g => g.onclick = e => { const b = e.target.closest("[data-v]"); if (!b) return; ecrireProfil(g.dataset.un, b.dataset.v); g.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
    $("bvStats").onchange = e => accordStats(e.target.checked);
    $("bvSuite").onclick = quitterBienvenue;
  }
  C.querySelectorAll("[data-m]").forEach(b => b.onclick = () => b.setAttribute("aria-pressed", basculer(b.dataset.m, b.dataset.k)));
  $("bvPasser").textContent = L("Passer", "Skip"); $("bvPasser").classList.remove("hidden");
}
const quitterBienvenue = () => { finBienvenue(); const r = bienvenue.depuisProfil; bienvenue.depuisProfil = null; r ? ouvrirProfil(r) : ecran("menu"); };   // refait depuis Mon profil : on y revient
$("bvPasser").onclick = quitterBienvenue;
// raccourcis de l'icône installée (appui long) : ?go=ech | tabata | semaine | progres
// attend la fin du chargement : les fonctions visées sont définies dans des fichiers lus plus tard
addEventListener("DOMContentLoaded", () => { const go = new URLSearchParams(location.search).get("go"), f = { express5: () => ouvrirExpress({ min: 5 }), ech: vueCats, tabata: vueTabata, semaine: () => ouvrirPlanning("menu"), progres: ouvrirProgres }[go];
  if (go) history.replaceState(null, "", location.pathname);   // sinon un rechargement (langue, restauration) relancerait le raccourci
  if (f) { finBienvenue(); afficherEcran("menu"); f(); if (typeof armerRetour === "function") setTimeout(armerRetour, 400); } });

