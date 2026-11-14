/* ============ PREMIÈRE SEMAINE ET COMPTEURS ANONYMES ============
   Première semaine : 7 séances courtes construites d'après l'accueil (sport, matériel, niveau), une carte en tête de l'accueil,
   une étape par jour conseillée, jamais de pénalité si on saute un jour (on reprend où on en était). Clé « semaine1 » = { d, f: [jours faits], j: dernier jour fait (date), fin }.
   Compteurs anonymes (seulement avec l'accord « statsAccord ») : des totaux par jour (« 2026-11-14_seance » = 37), sans identifiant ni pseudo,
   envoyés à Firestore par son API REST (sans charger le SDK) ; les règles n'acceptent que des hausses de 1 à 20. Voir ?stats pour les lire. */
const STATS_DB = "projects/app-2work/databases/(default)/documents", STATS_API = "https://firestore.googleapis.com/v1/";
const STATS_CLE = "AIzaSyC9nhsZoxp84rfkaFIFdMK0CwoUPejHLoo";   // clé web publique, limitée aux adresses de 2 WORK
// site test (et copies locales) : jamais de compteurs, pour ne pas fausser les chiffres du vrai site
const STATS_TEST = /\/2work-test\//.test(location.pathname) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const statsOk = () => !STATS_TEST && lire("statsAccord") === "1";
const nomStat = s => String(s).toLowerCase().normalize("NFD").replace(/[^a-z0-9_]/g, "").slice(0, 40) || "autre";
function compter(...cles) {
  if (!statsOk()) return; const j = jourCle(), q = lireJSON("statsFile", {});
  cles.forEach(c => { const id = j + "_" + nomStat(c); q[id] = Math.min(20, (q[id] || 0) + 1); }); stocker("statsFile", JSON.stringify(q)); envoyerStats();
}
async function envoyerStats() {
  if (STATS_TEST) return; const q = lireJSON("statsFile", {}), ids = Object.keys(q); if (!ids.length || !navigator.onLine || envoyerStats.en) return; envoyerStats.en = 1;
  try {
    const r = await fetch(`${STATS_API}${STATS_DB}:commit?key=${STATS_CLE}`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writes: ids.map(id => ({ transform: { document: `${STATS_DB}/stats/${id}`, fieldTransforms: [{ fieldPath: "n", increment: { integerValue: String(q[id]) } }] } })) }) });
    if (r.ok || r.status === 400 || r.status === 403) stocker("statsFile", "{}");   // refusé par les règles : on n'insiste pas
  } catch (e) {}
  envoyerStats.en = 0;
}
function accordStats(oui) {
  if (STATS_TEST) return;
  stocker("statsAccord", oui ? "1" : "0"); [$("rgStats"), $("bvStats")].forEach(c => c && (c.checked = oui)); if (!oui) return stocker("statsFile", "{}");
  if (!lire("statsInstall")) { stocker("statsInstall", jourCle()); compter("install"); } jourStats();
}
function jourStats() {   // une fois par jour : « actif », et les retours aux jours 1, 3, 7, 14 et 30 depuis l'accord
  if (!statsOk() || lire("statsJour") === jourCle()) return; stocker("statsJour", jourCle());
  const d = Math.round((new Date(jourCle()) - new Date(lire("statsInstall") || jourCle())) / 864e5); compter("actif", ...([1, 3, 7, 14, 30].includes(d) ? ["retour_j" + d] : []));
}
addEventListener("online", envoyerStats); addEventListener("DOMContentLoaded", () => { $("rgStats").checked = statsOk(); jourStats(); envoyerStats(); if (/[?&]stats\b/.test(location.search)) setTimeout(ouvrirStats, 600); });
const TXT_STATS = () => (STATS_TEST ? L("<b>Site test : aucun compteur n’est envoyé d’ici.</b> ", "<b>Test site: no counters are sent from here.</b> ") : "") + L("Aider à améliorer 2 WORK : compter anonymement l’utilisation (installations, séances faites, retours dans l’appli). Aucun nom, aucun identifiant, aucune donnée de santé ; tu peux l’arrêter dans Réglages.",
  "Help improve 2 WORK: count usage anonymously (installs, workouts done, returns to the app). No name, no identifier, no health data; you can turn it off in Settings.");
$("reglages").querySelector(".infos-liens").insertAdjacentHTML("beforebegin", `<label class="cl-case"><input type="checkbox" id="rgStats"${STATS_TEST ? " disabled" : ""}><span>${TXT_STATS()}</span></label>`);
$("rgStats").onchange = e => accordStats(e.target.checked);
async function ouvrirStats() {   // lecture des compteurs des 14 derniers jours (lisibles par tous : ce ne sont que des totaux)
  ouvrirFeuilleInfo(L("Compteurs anonymes", "Anonymous counters"), `<p class="sh-aide" id="stTxt">${L("Chargement…", "Loading…")}</p><div id="stTab"></div>`);
  try {
    const depuis = jourCle(new Date(Date.now() - 13 * 864e5)), docs = [];
    let t = ""; do { const r = await (await fetch(`${STATS_API}${STATS_DB}/stats?pageSize=300&key=${STATS_CLE}${t ? "&pageToken=" + t : ""}`)).json(); docs.push(...(r.documents || [])); t = r.nextPageToken; } while (t && docs.length < 3000);
    const T = {}; docs.forEach(d => { const id = d.name.split("/").pop(), j = id.slice(0, 10), k = id.slice(11); if (j >= depuis) (T[k] = T[k] || {})[j] = +d.fields.n.integerValue; });
    const jours = Array.from({ length: 14 }, (_, i) => jourCle(new Date(Date.now() - (13 - i) * 864e5)));
    $("stTxt").textContent = L("Totaux par jour, sans aucun identifiant. Seuls les appareils qui ont donné leur accord comptent.", "Daily totals, with no identifier. Only devices that agreed are counted.");
    $("stTab").innerHTML = `<div style="overflow-x:auto"><table class="params"><tr><th></th>${jours.map(j => `<th>${j.slice(8)}</th>`).join("")}<th>Σ</th></tr>${Object.keys(T).sort().map(k => `<tr><td>${k}</td>${jours.map(j => `<td>${T[k][j] || ""}</td>`).join("")}<td><b>${Object.values(T[k]).reduce((a, b) => a + b, 0)}</b></td></tr>`).join("")}</table></div>`;
  } catch (e) { $("stTxt").textContent = L("Impossible de lire les compteurs (connexion ?).", "Could not read the counters (connection?)."); }
}

/* --- Première semaine --- */
const S1 = () => lireJSON("semaine1", null), s1Garder = s => stocker("semaine1", JSON.stringify(s));
const s1Prochain = s => [1, 2, 3, 4, 5, 6, 7].find(i => !s.f.includes(i)) || 7;
const s1Eligible = () => !S1() && lire("s1Off") !== "1" && lireHist().length < 3;
const s1Sport = () => { const p = lireProfil(); return [...(p.sportsPratiques || []), ...(p.sportsEnvie || []), p.sport].find(k => k && ECHS[k]) || "complet"; };
function s1Jour(n) {   // séance du jour n (1 à 7) : { t, s, c, d, go } ; une semaine de reprise : renfo et Tabata un cran en dessous (6 à 21 min, 34 au plus pour les avancés)
  const p = lireProfil(), nv = p.niveau || lireNiv(), deb = nv === "debutant", fort = nv === "avance", m = (p.materiel || []).length ? "mien" : "sans", sp = s1Sport(), sr = RENFOS[sp] ? sp : "complet";
  const quick = min => ({ t: L(`Renfo express · ${min} min`, `Express strength · ${min} min`), s: L(m === "mien" ? "Tout le corps, avec ton matériel" : "Tout le corps, sans matériel", m === "mien" ? "Full body, with your equipment" : "Full body, no equipment"), c: "#0EA5E9", d: min, go: () => composerExpress({ min, m, z: "tout", int: deb ? "calme" : "normal" }) || composerExpress({ min, m: "sans", z: "tout", int: "normal" }) });
  return [() => TPL.E(sp, "express"), () => quick(8), () => TPL.C("repos"), () => TPL.R(sr, fort ? "inter" : "debutant"), () => quick(12), () => TPL.T(fort ? "cardio" : "decouverte"), () => TPL.C("soir")][n - 1]();
}
const S1_BUT = [["Échauffe-toi pour ton sport", "Warm up for your sport"], ["Ton premier renfo", "Your first strength session"], ["Récupère en douceur", "Recover gently"], ["Renforce-toi pour ton sport", "Get stronger for your sport"],
  ["Un peu plus long", "A bit longer"], ["Fais monter le cardio", "Raise your heart rate"], ["Étirements du soir, et bilan", "Evening stretches, and review"]];
function s1Lancer(n) { s1Jour(n).go(); if (routine) routine.s1 = n; }   // la séance ouverte porte son jour : celebrer() le valide à la fin
function s1Commencer() { s1Garder({ d: jourCle(), f: [] }); compter("s1_debut"); s1Lancer(1); }
function s1Valider(n) {   // appelé par celebrer() à la fin d'une séance lancée depuis la carte
  const s = S1(); if (!s || s.f.includes(n)) return; s.f.push(n); s.j = jourCle(); s1Garder(s); compter("s1_j" + n); if (s.f.length === 7) compter("s1_fini");
}
function majS1() {
  let Z = $("s1Carte"); if (!Z) { const v = $("vitaCarte"); if (!v) return; v.insertAdjacentHTML("beforebegin", `<div class="semaine-carte" id="s1Carte"></div>`); Z = $("s1Carte"); }
  const s = S1(); Z.classList.toggle("hidden", !(s1Eligible() || (s && !s.fin)));
  if (Z.classList.contains("hidden")) return;
  const pts = f => `<div class="bv-points s1-points">${[1, 2, 3, 4, 5, 6, 7].map(i => `<i class="${f.includes(i) ? "on" : ""}"></i>`).join("")}</div>`;
  if (!s) {
    Z.innerHTML = `<div class="quick-corps"><strong>🌱 ${L("Ta première semaine", "Your first week")}</strong><small>${L("7 séances courtes (6 à 20 min environ), construites pour ton sport et ton matériel. Une par jour si tu peux ; un jour sauté, on reprend simplement où tu en étais.", "7 short workouts (about 6 to 20 min), built for your sport and equipment. One a day if you can; skip a day and you simply pick up where you left off.")}</small>
      <div class="partage-btns"><button class="toggle" id="s1Go">${L("Commencer · jour 1", "Start · day 1")}</button><button class="toggle contour" id="s1Non">${L("Non merci", "No thanks")}</button></div></div>`;
    $("s1Go").onclick = s1Commencer; $("s1Non").onclick = () => { stocker("s1Off", "1"); majS1(); }; return;
  }
  if (s.f.length === 7) {
    Z.innerHTML = `<div class="quick-corps"><strong>🎉 ${L("Première semaine terminée !", "First week done!")}</strong>${pts(s.f)}<small>${L("7 séances : l’habitude commence. La suite, c’est de garder le rythme : un programme de 4 semaines, ton sport ou un club.", "7 workouts: the habit is starting. Next, keep the rhythm: a 4-week programme, your sport or a club.")}</small>
      <div class="partage-btns"><button class="toggle" id="s1Prog">🗓️ ${L("Programmes", "Programmes")}</button><button class="toggle" id="s1Sp">${L("Mes sports", "My sports")}</button><button class="toggle" id="s1Cl">👥 ${L("Clubs", "Clubs")}</button></div><button class="lien-discret" id="s1Fin">${L("Fermer", "Close")}</button></div>`;
    $("s1Prog").onclick = () => ouvrirProgs(); $("s1Sp").onclick = () => vueSCats(); $("s1Cl").onclick = () => ouvrirClubs(); $("s1Fin").onclick = () => { s1Garder({ ...s, fin: 1 }); majS1(); }; return;
  }
  const n = s1Prochain(s), x = s1Jour(n), fait = s.j === jourCle();
  Z.innerHTML = `<div class="quick-corps"><strong>🌱 ${L("Ta première semaine", "Your first week")} · ${L("jour", "day")} ${n}/7</strong>${pts(s.f)}
    <small>${fait ? "✓ " + L("Séance du jour faite. Reviens demain pour la suivante, ou continue si tu as de l’énergie.", "Today’s workout done. Come back tomorrow for the next one, or keep going if you have energy.") : L(...S1_BUT[n - 1])}</small>
    <button class="choice s1-seance" style="--c:${x.c}" id="s1Go"><strong>${x.t}</strong><span>${x.s}</span></button>
    <button class="lien-discret" id="s1Stop">${L("Arrêter la première semaine", "Stop the first week")}</button></div>`;
  $("s1Go").onclick = () => s1Lancer(n); $("s1Stop").onclick = () => { s1Garder({ ...s, fin: 1 }); majS1(); };
}
