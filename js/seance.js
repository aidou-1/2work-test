/* ============ ÉTAT ============ */
const $ = id => document.getElementById(id);
let routine = null, routineCle = null, liste = [], index = 0, reste = 0, timer = null, enPause = false, audio = null;

/* Durée commune à tous les exercices (réglable, mémorisée sur l’appareil) */
let dureeGlobale = 20;

/* Voix : annonce le nom de chaque exercice (synthèse vocale du navigateur) */
let voixActive = true, tVoix = null;

/* Liste d’exercices de la routine en cours (modifiable, mémorisée par routine sur l’appareil) */
let ids = [];
let mode = "echauffement", repos = 20, enRepos = false, reps = 8, recup = 60, cycles = 3;

/* Charge les durées mémorisées : réglages séparés pour les échauffements et les séances */
/* Repos entre exercices / séries : proposé selon le type de séance, réglable dans l'aperçu, mémorisé séance par séance
   (clé « reposSeances », incluse dans la sauvegarde). Pas de repos réglable là où il n'a pas de sens : échauffement, retour au calme, respiration. */
const REPOS_LIBRES = { legDay: 120, backDay: 120, fullBody: 90, chestDay: 90, pushDay: 90, pullDay: 90, gluteDay: 90, shoulderDay: 75, armDay: 60, absDay: 45 };
const reposLu = (id, def) => { try { const v = JSON.parse(localStorage.getItem("reposSeances") || "{}")[id]; if (Number.isFinite(v)) return v; } catch (e) {} return def; };
function reposGarder(id, v) { try { const m = JSON.parse(localStorage.getItem("reposSeances") || "{}"); m[id] = v; localStorage.setItem("reposSeances", JSON.stringify(m)); } catch (e) {} }
const reposPropose = (m, cle) => m === "salle" ? REPOS_LIBRES[cle] || 90 : ROUTINES[cle] && ROUTINES[cle].blessure ? 30 : 20;
const reposTxt = r => r < 60 ? r + " s" : Math.floor(r / 60) + " min" + (r % 60 ? " " + String(r % 60).padStart(2, "0") : "");
const r5 = x => Math.max(0, Math.round(x / 5) * 5);
function chargerDuree(cle = routineCle) {
  const lire = (cle, min, max, def) => {
    try { const n = parseInt(localStorage.getItem(cle), 10); if (n >= min && n <= max) return n; } catch (e) {}
    return def;
  };
  if (ROUTINES[cle] && ROUTINES[cle].fixe) {
    dureeGlobale = ROUTINES[cle].duree; repos = ROUTINES[cle].repos;
  } else if (mode === "tabata") {
    dureeGlobale = lire("dureeTabata", 5, 120, 20);
    repos = lire("reposTabata", 0, 120, 10);
    reps = lire("repsTabata", 1, 30, 8);
    recup = lire("recupTabata", 0, 300, 60);
    cycles = lire("cyclesTabata", 1, 30, 3);
  } else if (mode === "salle") {
    dureeGlobale = lire("dureeSalle", 5, 120, 45);
    repos = reposLu("libre:" + cle, lire("reposSalle", 0, 300, reposPropose("salle", cle)));
    cycles = lire("seriesSalle", 1, 6, 3);
  } else if (mode === "seance") {
    dureeGlobale = lire("dureeSeance", 5, 120, 40);
    repos = reposLu("seance:" + cle, lire("repos", 0, 180, reposPropose("seance", cle)));
  } else if (mode === "calme") {
    dureeGlobale = lire("dureeCalme", 5, 120, 30);
  } else if (mode === "souffle") {
    dureeGlobale = lire("minutes_" + cle, 1, 30, ROUTINES[cle].minutes);
  } else {
    dureeGlobale = Math.min(60, lire("dureeGlobale", 5, 120, 20));
  }
}

function chargerIds(cle) {
  if (ROUTINES[cle].fixe) return [...ROUTINES[cle].exercices];
  try {
    const s = JSON.parse(localStorage.getItem("routine_" + cle));
    if (Array.isArray(s) && s.every(id => EXERCICES[id])) return s;
  } catch (e) {}
  return [...ROUTINES[cle].exercices];
}

function sauverIds() {
  if (routine && routine.fixe) return;
  stocker("routine_" + routineCle, JSON.stringify(ids));
}

function fermerAjout() {
  $("ajout").classList.add("hidden");
  $("aRecherche").value = "";
  $("ajoutBtn").textContent = T("Ajouter");
  $("ajoutBtn").setAttribute("aria-expanded", "false");
}

function majAjout() {
  const dedans = new Set(ids);
  $("defBtn").disabled = ids.join() === ROUTINES[routineCle].exercices.join();
  // recherche : sans accents ni majuscules, sur le nom (dans les deux langues) et les muscles
  const plat = t => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const q = plat($("aRecherche").value.trim()), ok = id => !q || plat(EXERCICES[id].nom + " " + (EXERCICES[id].nomFr || "") + " " + EXERCICES[id].muscles + " " + (VOIX[id] || "")).includes(q);
  const reco = (CONSEILLES[routineCle] || []).filter(id => !dedans.has(id) && ok(id));
  const autres = Object.keys(EXERCICES).filter(id => !dedans.has(id) && !reco.includes(id) && ok(id));
  const li = id => `<li>${vignette(id)}<div><b>${EXERCICES[id].nom}</b><small>${EXERCICES[id].muscles}</small></div><button class="ajouter" data-id="${id}" aria-label="${T("Ajouter {n}", { n: EXERCICES[id].nom })}">+</button></li>`;
  $("aReco").innerHTML = reco.length ? reco.map(li).join("") : `<li><small>${T("Tous les exercices conseillés sont déjà dans ta routine.")}</small></li>`;
  $("aAutres").innerHTML = autres.length ? autres.map(li).join("") : `<li><small>${q ? T("Aucun exercice ne correspond à « {q} ».", { q: $("aRecherche").value.trim() }) : T("Aucun autre exercice disponible.")}</small></li>`;
}
try { if (localStorage.getItem("voix") === "0") voixActive = false; } catch (e) {}

/* Voix : uniquement « Paul », en anglais. Noms lus en anglais */
const VOIX = {
  inchworm: "Inchworm", wgs: "World’s greatest stretch", openbook: "Active open book", thread: "Thread the needle", wipers: "Windshield wipers",
  catcow: "Active cat cow", cossack: "Cossack squat", shadow: "Shadow boxing with pivots", dogpedal: "Downward dog with pedaling", scorpion: "Scorpion",
  hip9090: "Ninety ninety hip switches", rdl: "Single leg Romanian deadlift", fente: "Reverse lunge with arms up", pont: "Dynamic glute bridge",
  askip: "A skip", armcircles: "Arm circles", armcross: "Cross and open arms", scap: "Scapular push ups", twist: "Standing trunk rotations",
  tspin: "Plank with T rotation", slips: "Boxing slips", footwork: "Light footwork", lateral: "Lateral lunge", bird: "Bird dog",
  sumo: "Sumo squat with toe touch", cobra: "Cobra to downward dog", legfwd: "Front and back leg swings", legside: "Side leg swings",
  heelkick: "Butt kicks", kneeup: "High knees", lungetwist: "Walking lunge with rotation", calfraise: "Calf raises", skater: "Skater steps",
  hydrant: "Fire hydrant", ankles: "Ankle circles", squat: "Squat", fentesalt: "Alternating forward lunges", pontuni: "Single leg glute bridge",
  mollet1: "Single leg calf raises", chaise: "Wall sit", planche: "Plank", planchelat: "Side plank", climbers: "Mountain climbers",
  squatsaute: "Jump squats", deadbug: "Dead bug", pompes: "Push ups", pompesserrees: "Close grip push ups", burpees: "Burpees",
  russian: "Russian twists", superman: "Superman", planchetouch: "Plank with shoulder taps", enfant: "Active child’s pose",
  cascade: "Waterfall forward fold", paddle: "Surf paddling", popup: "Surf pop up", surfsquat: "Surfer squat", skisquat: "Skier position",
  skihop: "Skier side hops",
  grandissement: "Reach tall",
  nuqueFlex: "Chin to chest neck stretch",
  nuqueLat: "Side neck stretch",
  brasCroise: "Cross body shoulder stretch",
  triceps: "Triceps stretch",
  dosMains: "Chest opener",
  poignets: "Wrist stretch",
  murPecs: "Wall chest stretch",
  genouxPoitrine: "Knee to chest",
  torsionAllongee: "Lying spinal twist",
  lateralDebout: "Standing side bend",
  flexionAssise: "Seated forward fold",
  figure4: "Figure four stretch",
  papillon: "Butterfly stretch",
  quadDebout: "Standing quad stretch",
  ischioCouche: "Lying hamstring stretch",
  molletMur: "Wall calf stretch",
  soleaire: "Bent knee calf stretch",
  straddle: "Seated straddle stretch",
  fenteLatTenue: "Side lunge stretch",
  fenteBasse: "Low lunge hip stretch",
  enfantStat: "Child’s pose",
  chien: "Downward dog",
  goblet: "Goblet squat",
  kbSwing: "Kettlebell swing",
  kbPress: "Kettlebell press",
  dbPress: "Dumbbell bench press",
  dbRow: "One arm dumbbell row",
  dbShoulder: "Dumbbell shoulder press",
  dbLunge: "Dumbbell reverse lunge",
  dbCurl: "Dumbbell curl",
  dbRDL: "Dumbbell Romanian deadlift",
  dbLateral: "Lateral raises",
  bulgare: "Bulgarian split squat",
  hipThrust: "Hip thrust",
  stepUp: "Step ups",
  dips: "Bench dips",
  ezCurl: "EZ bar curl",
  ezSkull: "Skull crushers",
  ezRow: "EZ bar bent over row",
  ezBench: "EZ bar bench press",
  poulieTirage: "Lat pulldown",
  poulieTriceps: "Triceps pushdown",
  poulieCrunch: "Cable crunch",
  poulieBucheron: "Cable wood chop",
  bandRow: "Band seated row",
  bandChest: "Band chest press",
  bandWalk: "Banded side steps",
  bandPullApart: "Band pull apart",
  roue: "Ab wheel rollout",
  discRussian: "Plate Russian twists",
  discWood: "Plate wood chop",
  tractions: "Pull ups",
  chinups: "Chin ups",
  relevesJambes: "Hanging leg raises",
  pike: "Pike push ups",
  hollow: "Hollow body hold",
  lancer: "Throwing motion", pasChasse: "Defensive shuffles", sautTir: "Jump shots", rotEpaule: "Shoulder rotations",
  bandRotExt: "Band external rotation", pedalage: "Air cycling"
};
Object.assign(VOIX, VOIX_SALLE);
const PASSAGES = { wgs: ["autre côté", "other side"], rdl: ["autre jambe", "other leg"], askip: ["autre jambe", "other leg"], genouxPoitrine: ["autre jambe", "other leg"] };   // faits d'un côté puis, juste après, de l'autre
const DEUX_PASSAGES = Object.keys(PASSAGES);
const dire = e => langueVoix === "fr" ? e.nomFr || e.nom : (VOIX[e.id] || e.nom) + (e.autreCote ? ", " + PASSAGES[e.id][1] : "");

/* Voix : langue des annonces (en / fr) et personne qui parle, choisies dans les Réglages.
   « Automatique » : Paul en anglais s'il existe, sinon la meilleure voix locale de la langue (Android compris). */
let langueVoix = "en", nomVoix = "";
try { langueVoix = localStorage.getItem("langueVoix") || LANGUE; nomVoix = localStorage.getItem("nomVoix") || ""; } catch (e) {}
const PHRASES = {
  en: { pret: "Get ready", repos: "Rest. Next: ", serie: ", set ", recup: "Recovery", tour: "Round ", go: "Let’s go!", test: "Hello, I will guide your workout. Let's go!" },
  fr: { pret: "Prépare-toi", repos: "Repos. Ensuite : ", serie: ", série ", recup: "Récupération", tour: "Tour ", go: "C’est parti !", test: "Bonjour, je vais te guider pendant ta séance. C'est parti !" }
};
const PH = k => PHRASES[langueVoix][k];
const voixDispo = () => ("speechSynthesis" in window ? speechSynthesis.getVoices() : []).filter(v => v.lang.toLowerCase().startsWith(langueVoix));
function choisirVoix() {
  const liste = voixDispo();
  return liste.find(v => v.name === nomVoix)
    || (langueVoix === "en" && liste.find(v => /\bpaul\b/i.test(v.name)))
    || liste.find(v => /google|enhanced|premium|natural/i.test(v.name) && v.lang.toLowerCase().startsWith(langueVoix === "fr" ? "fr-fr" : "en-us"))
    || liste.find(v => v.localService) || liste[0];
}

/* Voix de secours : si la synthèse vocale manque ou reste muette (Android sans moteur vocal, voix non installée, lecture bloquée),
   un second essai part avec la voix par défaut du téléphone, puis l'annonce s'affiche en bandeau à l'écran. */
let tSecours = null, tBandeau = null, prefixeVoix = "";   // prefixeVoix : dit juste avant la prochaine annonce (« C'est parti ! » au lancement)
function bandeauVoix(texte) { const b = $("voixSecours"); b.textContent = "🔊 " + texte; b.classList.remove("hidden"); clearTimeout(tBandeau); tBandeau = setTimeout(() => b.classList.add("hidden"), 4500); }
const amorcerVoix = () => { try { if ("speechSynthesis" in window) { speechSynthesis.speak(new SpeechSynthesisUtterance("")); } } catch (e) {} };   // à appeler dans l'appui : sur téléphone, la voix ne peut parler plus tard que si elle a démarré pendant un geste
function parler(texte, delai = 700, vitesse = 0.95) {
  if (!voixActive || !texte) return;
  texte = prefixeVoix + texte; prefixeVoix = "";
  clearTimeout(tVoix); clearTimeout(tSecours);
  if (!("speechSynthesis" in window)) return bandeauVoix(texte);
  speechSynthesis.cancel();
  const essai = secours => {
    const u = new SpeechSynthesisUtterance(texte), v = secours ? null : choisirVoix();
    let parti = false;
    const rate = () => { clearTimeout(tSecours); if (parti) return; parti = true; if (secours) return bandeauVoix(texte); speechSynthesis.cancel(); essai(true); };
    u.lang = v ? v.lang : langueVoix === "fr" ? "fr-FR" : "en-US"; u.rate = vitesse; if (v) u.voice = v;
    u.onstart = u.onend = () => { parti = true; clearTimeout(tSecours); };
    u.onerror = e => { if (!["interrupted", "canceled"].includes(e.error)) rate(); };
    speechSynthesis.resume(); speechSynthesis.speak(u);   // resume : Android reste parfois bloqué en pause
    tSecours = setTimeout(rate, 2500);   // ni début ni erreur après 2,5 s : la voix est restée muette
  };
  tVoix = setTimeout(() => essai(false), delai);
}
try { const d = parseInt(localStorage.getItem("dureeGlobale"), 10); if (d >= 5 && d <= 120) dureeGlobale = d; } catch (e) {}

const CLE_DUREE = { salle: "dureeSalle", tabata: "dureeTabata", seance: "dureeSeance", calme: "dureeCalme", echauffement: "dureeGlobale" };
const pas = () => mode === "souffle" ? 1 : 5;
function setDuree(d) {
  dureeGlobale = mode === "souffle" ? Math.min(30, Math.max(1, d)) : Math.min(mode === "echauffement" ? 60 : 120, Math.max(5, d));
  if (!routine || !routine.fixe) stocker(mode === "souffle" ? "minutes_" + routineCle : CLE_DUREE[mode], dureeGlobale);
  if (routineCle) ouvrirApercu(routineCle);
}

let tPret, tMin = null, ecranCourant = "accueil", sensRetour = false, genEcran = 0, sansAnim = false;
const mouvementReduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/* Change d'écran. "avant" : modifications du DOM à faire dans la même transition (ex. changer de liste).
   Pour revenir en arrière, appeler retour(() => ...) : la transition part dans l'autre sens. */
function ecran(nom, avant) {
  if (nom !== "pret") clearInterval(tPret);
  const change = nom !== ecranCourant || avant, sens = sensRetour ? "retour" : "avant";
  sensRetour = false;
  const g = ++genEcran;   // un écran demandé entre-temps l'emporte (sinon une transition en retard couperait le chrono)
  const maj = () => { if (avant) avant(); if (g === genEcran) afficherEcran(nom); };
  if (!change || mouvementReduit() || sansAnim) return maj();
  document.documentElement.dataset.sens = ecranCourant === "accueil" ? "splash" : sens;   // sortie de l'écran de démarrage : le menu s'ouvre en cercle depuis le logo
  if (document.startViewTransition) return document.startViewTransition(maj).ready.catch(() => {});   // une transition interrompue par la suivante n'est pas une erreur
  maj();
  const el = $(nom); el.classList.remove("entre-avant", "entre-retour"); void el.offsetWidth; el.classList.add("entre-" + sens);
}
const retour = fn => { sensRetour = true; fn(); };
function afficherEcran(nom) {
  ecranCourant = nom;
  if (nom !== "session") clearInterval(timer);
  $("plusRepos").classList.add("hidden");   // aucun chrono ne tourne hors de la séance
  if (["menu", "reglages", "accueil", "profil", "planning", "page", "bienvenue", "outils", "outil", "moi", "infos", "clubs"].includes(nom)) document.documentElement.style.setProperty("--accent", nom.startsWith("outil") ? "var(--vert)" : "var(--brand)");
  if (typeof garderEcran === "function") garderEcran(nom === "pret" || nom === "session");
  ["accueil","menu","home","preview","session","pret","end","reglages","muscle","progres","progs","prog","recap","profil","planning","page","bienvenue","outils","outil","moi","infos","clubs"].forEach(s => $(s).classList.toggle("hidden", s !== nom));
  $("quitBtn").classList.toggle("hidden", ["menu", "accueil", "reglages", "muscle", "progres", "progs", "prog", "recap", "profil", "planning", "page", "bienvenue", "outils", "outil", "moi", "infos", "clubs"].includes(nom));
  if (nom === "menu" && typeof majTableau === "function") majTableau();
  if (nom === "menu" && typeof majSemaine === "function") majSemaine();
  if (nom === "menu" && typeof majBanniere === "function") majBanniere();
  if (nom === "reglages" && typeof renduAppli === "function") { renduAppli(); renduDonnees(); }
  $("defiBtn").classList.toggle("hidden", nom !== "menu");
  $("muscleBtn").classList.toggle("hidden", nom !== "menu");
  if (nom === "menu" && typeof majMuscleBtn === "function") majMuscleBtn();
  if (nom === "menu" && typeof majEtoile === "function") majEtoile();
  $("quitBtn").dataset.conf = "";
  $("quitBtn").textContent = T("✕ Menu");
  if (nom !== "outil") clearInterval(tMin);   // un minuteur libre ne tourne que sur son écran
  const onglet = { menu: "nMenu", progres: "nProgres", progs: "nProgs", outils: "nOutils", moi: "nMoi", reglages: "reglagesBtn" }[nom];   // barre de navigation : écrans principaux seulement
  $("nav").classList.toggle("hidden", !onglet); [...$("nav").children].forEach(b => b.setAttribute("aria-current", b.id === onglet ? "page" : "false"));
  if (nom === "menu") { majReprise(); majVitalite(); majJeu(); majQuick();  if (typeof guideAuto === "function") guideAuto(); if (typeof majCarteClubs === "function") majCarteClubs(); if (typeof majS1 === "function") majS1(); }
  if (!["pret", "session"].includes(nom)) { clearTimeout(tSecours); $("voixSecours").classList.add("hidden"); }   // pas d'annonce de secours hors séance
  majVerrou();
}

/* ============ SON (bip généré, aucun fichier) ============ */
/* Chrono calé sur l'heure réelle : remplace setInterval(fn, 1000). Si le téléphone a gelé ou ralenti la page (changement d'appli,
   écran verrouillé), les secondes manquantes sont rattrapées d'un coup au retour, sans rafale de bips ; le rattrapage s'arrête à la fin
   de l'exercice en cours (le suivant repart en temps réel), pour ne jamais sauter plusieurs exercices sans les avoir vus. */
let muet = false, horlogeActive = 0;
function horloge(fn) {
  const moi = ++horlogeActive; let prevu = Date.now() + 1000;
  return setInterval(() => {
    let n = Math.min(900, Math.floor((Date.now() - prevu) / 1000) + 1);
    for (; n > 0 && moi === horlogeActive; n--) { prevu += 1000; muet = n > 1; try { fn(); } finally { muet = false; } }
    if (n > 0) prevu = Date.now() + 1000;
  }, 200);
}
// Sortie commune des sons : au-delà de 100 % de volume, un limiteur évite la saturation quand plusieurs bips se superposent (cloche, alerte)
let limiteur = null;
const sortie = () => { if (!limiteur) { limiteur = audio.createDynamicsCompressor(); limiteur.threshold.value = -3; limiteur.knee.value = 0; limiteur.ratio.value = 20; limiteur.attack.value = .002; limiteur.release.value = .1; limiteur.connect(audio.destination); } return limiteur; };
function bip(freq = 880, ms = 150, vol = 0.15, forme = "sine", decalage = 0, attaque = 0.015) {
  try {
    if (!volSons || muet) return;
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state !== "running") audio.resume();   // « suspended », ou « interrupted » sur iPhone après la voix
    const o = audio.createOscillator(), g = audio.createGain();
    vol *= volSons; o.type = forme; o.frequency.value = freq;
    o.connect(g); g.connect(sortie());
    const t = audio.currentTime + decalage, fin = t + ms / 1000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attaque);
    g.gain.exponentialRampToValueAtTime(0.0001, fin);
    o.start(t); o.stop(fin + 0.02);
  } catch (e) { /* le son est facultatif */ }
}

/* Session audio (iPhone, Safari 16.4+) : « ambient » = les sons se mélangent à la musique d'une autre appli (Spotify, Deezer…) sans la couper,
   mais le bouton silencieux les coupe ; « playback » = sons garantis même en silencieux, mais la musique s'arrête. Réglage « musique ».
   Le son est (ré)activé à chaque toucher, car iOS ne le démarre qu'après un geste. */
let avecMusique = true;
try { avecMusique = localStorage.getItem("musique") !== "0"; } catch (e) {}
const majSession = () => { try { if (navigator.audioSession) navigator.audioSession.type = avecMusique ? "ambient" : "playback"; } catch (e) {} };
majSession();
document.addEventListener("pointerdown", () => { try {
  if (!audio) { audio = new (window.AudioContext || window.webkitAudioContext)(); const b = audio.createBufferSource(); b.buffer = audio.createBuffer(1, 1, 22050); b.connect(audio.destination); b.start(0); }
  if (audio.state !== "running") audio.resume();
} catch (e) {} }, true);
/* ============ ÉCRAN VERROUILLÉ ET ÉCOUTEURS ============
   Media Session : pause, suivant et précédent depuis l'écran verrouillé, la montre ou les écouteurs. Les téléphones n'affichent ces
   commandes que si l'appli joue un son en continu : une piste silencieuse tourne donc pendant la séance, ce qui prend la place de la
   musique d'une autre appli. Actif seulement quand le réglage « Écouter ma musique en même temps » est coupé. */
let silence = null;
function pisteSilence() {
  if (silence) return silence;
  const n = 8000 * 10, o = new Uint8Array(44 + n), d = new DataView(o.buffer);   // WAV muet de 10 s (Android ignore les sons de moins de 5 s)
  [[0, 0x52494646], [8, 0x57415645], [12, 0x666d7420], [36, 0x64617461]].forEach(([p, v]) => d.setUint32(p, v));
  [[4, 36 + n], [16, 16], [24, 8000], [28, 8000], [40, n]].forEach(([p, v]) => d.setUint32(p, v, true));
  [[20, 1], [22, 1], [32, 1], [34, 8]].forEach(([p, v]) => d.setUint16(p, v, true));
  o.fill(128, 44);
  silence = new Audio(URL.createObjectURL(new Blob([o], { type: "audio/wav" }))); silence.loop = true;
  return silence;
}
function majVerrou() {
  const actif = ["pret", "session"].includes(ecranCourant) && !avecMusique;
  try {
    if (actif && !enPause) pisteSilence().play().catch(() => {}); else if (silence) silence.pause();
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = actif ? new MediaMetadata({ title: $(ecranCourant === "pret" ? "pretNom" : "name").textContent, artist: "2 WORK" + (routine ? " · " + routine.titre : ""), artwork: [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }] }) : null;
    navigator.mediaSession.playbackState = !actif ? "none" : enPause ? "paused" : "playing";
  } catch (e) {}
}
if ("mediaSession" in navigator) [["play", () => enPause && pause()], ["pause", () => !enPause && pause()], ["nexttrack", () => moteur(1)(false)], ["previoustrack", () => moteur(2)()]]
  .forEach(([a, f]) => { try { navigator.mediaSession.setActionHandler(a, () => { if (ecranCourant === "session") f(); }); } catch (e) {} });
new MutationObserver(majVerrou).observe($("name"), { childList: true, characterData: true, subtree: true });   // le titre affiché suit l'exercice en cours

/* ============ ANNEAU DU CHRONO ============
   Il se vide au rythme des secondes, quel que soit le moteur (exercice, repos, Tabata, respiration) : il suit simplement le nombre affiché.
   Un nombre qui remonte = nouvelle phase, l'anneau se remplit d'un coup ; il vise toujours la seconde suivante pour arriver à zéro pile à la fin. */
let anneauTotal = 1, anneauPrec = 0;
new MutationObserver(() => {
  const v = parseInt($("time").textContent, 10) || 0, A = $("anneau"), C = 276.5, neuf = v > anneauPrec;
  if (neuf) { anneauTotal = Math.max(1, v); A.style.transition = "none"; A.style.strokeDashoffset = 0; void A.getBoundingClientRect(); A.style.transition = ""; }
  anneauPrec = v; A.style.strokeDashoffset = -C * (1 - Math.max(0, v - 1) / anneauTotal);   // décalage négatif : l'anneau se vide dans le sens des aiguilles d'une montre
  $("anneauBox").classList.toggle("fin", v <= 3 && v > 0);
}).observe($("time"), { childList: true, characterData: true, subtree: true });

/* ============ REPRISE D'UNE SÉANCE INTERROMPUE ============
   À chaque changement d'exercice, l'état de la séance est noté sur le téléphone. Si l'appli est fermée ou rechargée en pleine séance,
   le menu propose pendant 6 h de la reprendre à l'exercice en cours. Effacé à la fin de la séance ou quand on la quitte volontairement. */
let aReprendre = null;
function noterSeance() {
  if (routine) stocker("seanceEnCours", JSON.stringify({ quand: Date.now(), cle: routineCle, routine, mode, ids, liste: ["tabata", "souffle"].includes(mode) ? [] : liste, index, tab, i: souf.i, dureeGlobale, repos, reps, recup, cycles, totalPrevu }, (k, v) => k === "listeHtml" ? undefined : v));
}
function oublierSeance() { try { localStorage.removeItem("seanceEnCours"); } catch (e) {} }
function majReprise() {
  const Z = $("repriseCarte"), s = lireJSON("seanceEnCours", null); if (!Z) return;
  if (!s || !s.routine || Date.now() - s.quand > 6 * 36e5 || !(s.ids || []).every(id => EXERCICES[id])) { Z.innerHTML = ""; return; }
  const ou = s.liste.length ? " · " + L("étape", "step") + " " + (s.index + 1) + "/" + s.liste.length : "";
  Z.innerHTML = `<button class="sc-corps" style="--c:${propre(s.routine.couleur)}"><span class="sc-ico">${ico("reprise")}</span><span><strong>${L("Reprendre ta séance", "Resume your workout")}</strong><small>${propre(s.routine.titre)}${ou}</small></span></button><button class="bn-fermer" aria-label="${L("Abandonner cette séance", "Discard this workout")}">✕</button>`;
  Z.firstChild.onclick = () => reprendreSeance(s); Z.lastChild.onclick = () => { oublierSeance(); Z.innerHTML = ""; };
}
function reprendreSeance(s) {   // remet l'état en place puis repasse par le décompte « Prépare-toi »
  ({ mode, ids, dureeGlobale, repos, reps, recup, cycles, totalPrevu } = s);
  routineCle = s.cle; routine = ROUTINES[s.cle] = { ...ROUTINES[s.cle], ...s.routine }; if (s.liste.length) liste = s.liste;
  document.documentElement.style.setProperty("--accent", routine.couleur);
  preparer(s);
}
function rejouer() {   // après le décompte : la séance repart à l'exercice (ou à la phase) où elle s'était arrêtée
  const s = aReprendre; aReprendre = null;
  if (s.mode === "tabata") { demarrerTab(); tab = s.tab; afficherTab(); }
  else if (s.mode === "souffle") { demarrerSouf(); souf.i = Math.min(s.i, souf.plan.length - 1); afficherSouf(); }
  else { demarrer(); index = Math.min(s.index, liste.length - 1); afficher(); }
}

/* Les 3 sons de la séance, assez aigus et présents pour s'entendre sur un haut-parleur de téléphone */
const sons = {
  // chaque seconde : « toc » sec de bois
  tic: () => { bip(1150, 45, .22, "triangle", 0, .002); bip(2300, 25, .06, "sine", 0, .002); },
  // 3 dernières secondes : bip plus aigu, plus long et plus fort, impossible à confondre
  alerte: () => { bip(1320, 220, .4, "triangle", 0, .004); bip(2640, 160, .12, "sine", 0, .004); vibrer(35); },
  // changement d’exercice : cloche de boxe anglaise (frappes rapides, résonance métallique)
  change: () => {
    [[1, 1], [2, 0.6], [2.76, 0.45], [5.4, 0.25]].forEach(([r, a]) => bip(700 * r, 1700 / Math.pow(r, 0.7), 0.32 * a, "sine", 0, 0.003));
    vibrer([70, 50, 70]);
  }
};

/* ============ RETOURS SONORES ET VIBRATIONS ============
   Sons courts générés selon le bouton (entrer, revenir, activer/couper, +/−, lancer). Vibrations : API standard (Android) ;
   iPhone (iOS 18+) : toucher un interrupteur caché donne un léger retour haptique, pendant un geste. Réglages « sonsUI », « vibrations ». */
let sonsUI = true, vibrations = true, volSons = 1, forceVib = 1, bruit = null, haptique = null;
try { sonsUI = localStorage.getItem("sonsUI") !== "0"; vibrations = localStorage.getItem("vibrations") !== "0"; volSons = (+(localStorage.getItem("volumeSons") ?? 100)) / 100; forceVib = +localStorage.getItem("forceVib") || 1; } catch (e) {}
const FORCES = { vib1: .5, vib2: 1, vib3: 1.7 };
function glisse(f0, f1, ms, vol) {   // « whoosh » : bruit filtré dont la fréquence glisse
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume();
    if (!bruit) { bruit = audio.createBuffer(1, audio.sampleRate * .4, audio.sampleRate); const d = bruit.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain(), t = audio.currentTime, fin = t + ms / 1000;
    src.buffer = bruit; f.type = "bandpass"; f.Q.value = 1.4; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, fin);
    if (!volSons) return; vol *= volSons; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + ms / 3000); g.gain.exponentialRampToValueAtTime(.0001, fin);
    src.connect(f); f.connect(g); g.connect(sortie()); src.start(t); src.stop(fin + .02);
  } catch (e) {}
}
function vibrer(motif) {
  if (!vibrations || muet) return;
  try {
    if (navigator.vibrate) return void navigator.vibrate([].concat(motif).map((d, i) => i % 2 ? d : Math.round(d * forceVib)));
    if (!/iP(hone|od)/.test(navigator.userAgent)) return;
    if (!haptique) {
      haptique = document.createElement("label"); haptique.innerHTML = '<input type="checkbox" switch tabindex="-1">'; haptique.setAttribute("aria-hidden", "true");
      haptique.style.cssText = "position:fixed;left:-200px;top:0;opacity:0;pointer-events:none"; haptique.addEventListener("click", e => e.stopPropagation()); document.body.appendChild(haptique);
    }
    haptique.click();
  } catch (e) {}
}
const RETOURS = {   // [son, vibration]
  tap: [() => bip(1500, 22, .035, "sine", 0, .002), 8],
  nav: [() => { glisse(450, 2200, 170, .05); bip(1250, 28, .025, "sine", 0, .002); }, 10],
  retour: [() => glisse(2000, 420, 160, .045), 8],
  oui: [() => { bip(660, 60, .05); bip(990, 90, .05, "sine", .06); }, 12],
  non: [() => { bip(880, 60, .045); bip(587, 90, .04, "sine", .06); }, 6],
  plus: [() => bip(1175, 40, .045, "sine", 0, .003), 5],
  moins: [() => bip(880, 40, .045, "sine", 0, .003), 5],
  go: [() => { bip(523, 90, .07, "triangle"); bip(784, 170, .07, "triangle", .08); }, [15, 40, 25]]
};
function retourUI(t) { const [son, v] = RETOURS[t]; if (sonsUI) son(); vibrer(v); }
document.addEventListener("click", ev => {
  if (haptique && haptique.contains(ev.target)) return;
  if (!$("accueil").classList.contains("hidden")) return retourUI("go");   // « touche l'écran pour continuer »
  const b = ev.target.closest("button, summary, a[href], select, input[type=checkbox], input[type=radio]");
  if (!b || b.disabled) return;
  const st = !b.matches(".toggle") && b.closest(".stepper");
  retourUI(st ? (b === st.firstElementChild ? "moins" : "plus")
    : b.matches(".back, [id$=Retour], .lien-discret") ? "retour"
    : b.matches("#start, #pretGo, .primary") ? "go"
    : b.hasAttribute("aria-pressed") ? (b.getAttribute("aria-pressed") === "true" ? "non" : "oui")   // état avant le clic
    : b.matches(".choice, summary, .etape") ? "nav" : "tap");
}, true);

/* ============ ACCUEIL ============ */
const modeDe = r => r.tabata ? "tabata" : r.souffle ? "souffle" : r.salle ? "salle" : r.type === "seance" ? "seance" : r.type === "calme" ? "calme" : "echauffement";
function ouvrirRoutine(cle) {
  mode = modeDe(ROUTINES[cle]); chargerDuree(cle); ids = chargerIds(cle); fermerAjout(); ouvrirApercu(cle);
}
Object.entries(ROUTINES).forEach(([cle, r]) => {
  const b = document.createElement("button");
  if (r.type === "seance") return;
  b.className = "choice"; b.style.setProperty("--c", r.couleur);
  b.innerHTML = `<strong>${r.titre}</strong><span>${r.detail}${r.souffle ? "" : " · " + T("{n} exercices", { n: r.exercices.length })}</span>`;
  b.onclick = () => ouvrirRoutine(cle);
  b.dataset.cle = cle;
  if (r.cat) b.dataset.cat = r.cat;
  $(r.type === "calme" ? "choicesK" : "choices").appendChild(b);
});
Object.entries(CATS).forEach(([k, c]) => {
  const b = document.createElement("button");
  b.className = "choice"; b.style.setProperty("--c", c.couleur);
  b.innerHTML = `<strong>${c.titre}</strong><span>${c.detail}</span>`;
  b.onclick = () => vueCat(k); b.dataset.k = k;
  $("choicesC").appendChild(b);
});
function bouton(parent, titre, detail, couleur, fn) {
  const b = document.createElement("button");
  b.className = "choice"; b.style.setProperty("--c", couleur);
  b.innerHTML = `<strong>${T(titre)}</strong><span>${T(detail)}</span>`;
  b.onclick = fn;
  parent.appendChild(b); return b;
}
bouton($("choicesP"), "Sports", "14 sports : ta semaine, les séances, la technique, le renfo et les tests de chacun", "#7B5EA7", () => vueSCats());
bouton($("choicesP"), "Salle de musculation", "Par objectif : force, prise de muscle, excentrique, isométrie…", "#334E68", () => vueSalle());
Object.keys(ROUTINES).filter(k => ROUTINES[k].blessure).forEach(k => bouton($("choicesB"), ROUTINES[k].titre, ROUTINES[k].detail + " · " + T("{n} exercices", { n: ROUTINES[k].exercices.length }), ROUTINES[k].couleur, () => ouvrirRoutine(k)));
bouton($("choicesP"), "Tabata", "7 séances prêtes (cardio, jambes, abdos…) ou minuteur libre", "#D9480F", () => vueTabata());
const SEANCE = k => Object.keys(ROUTINES).find(c => ROUTINES[c].grp === k && !ROUTINES[c].mat);
[["haut", "Haut du corps"], ["bas", "Bas du corps"], ["complet", "Haut et bas du corps"]].forEach(([k, t]) => bouton($("choicesZ"), t, ROUTINES[SEANCE(k)].detail, ROUTINES[SEANCE(k)].couleur, () => vueMode(k)));

function ouvrirApercu(cle) {
  routine = ROUTINES[cle]; routineCle = cle;
  const tb = mode === "tabata", so = mode === "souffle", sa = mode === "salle";
  // en salle, chaque exercice est joué en plusieurs séries (repos entre chaque)
  liste = (routine.plan ? routine.plan.map(q => ({ ...EXERCICES[q.id], id: q.id, duree: q.d, r: q.r, bn: q.bn, t: q.t, tt: q.tt, ft: q.ft, lab: q.lab, presc: q.presc, serie: q.serie, series: q.series })) : ids.flatMap(id => Array.from({ length: sa ? cycles : 1 }, (_, k) => ({ ...EXERCICES[id], id, duree: dureeGlobale, ...(sa && { serie: k + 1, series: cycles }) }))))
    .flatMap(e => { const a = PASSAGES[e.id] && " · " + L(...PASSAGES[e.id]); return a ? [{ ...e, r: 0 }, { ...e, autreCote: 1, nom: e.nom + a, lab: e.lab && e.lab + a }] : [e]; });
  $("dureeVal").textContent = dureeGlobale + (so ? " min" : " s");
  const rr = routine.reglerRepos, rProp = rr ? routine.reposProp : !routine.fixe && (sa || mode === "seance") ? reposPropose(mode, cle) : null;
  $("reposRow").classList.toggle("hidden", rr ? false : mode !== "seance" && !tb && !sa);
  $("reposVal").textContent = reposTxt(+(rr ? routine.repos : repos) || 0);
  $("repsRow").classList.toggle("hidden", !tb);
  $("cyclesRow").classList.toggle("hidden", !tb && !sa);
  const lc = document.querySelector('label[for="cyclesVal"]');
  lc.firstChild.textContent = T(sa ? "Séries par exercice" : "Nombre de cycles");
  lc.querySelector("small").textContent = T(sa ? "Chaque exercice est répété, avec un repos entre les séries" : "Enchaînements répétés, avec une récupération entre chaque");
  $("cyclesVal").textContent = cycles;
  $("pList").classList.toggle("hidden", tb);
  $("ajoutBtn").closest(".reglage").classList.toggle("hidden", tb || so || !!routine.fixe);
  $("favRow").classList.toggle("hidden", tb || so || !!routine.fixe); majFavRow();
  $("amiRow").classList.toggle("hidden", tb || so || !!routine.plan || !ids.length); $("amiBtn").textContent = L("Envoyer", "Send");
  const enLangue = T(langueVoix === "fr" ? "(en français)" : "(en anglais)");
  $("voixInfo").textContent = T(so ? "Annonce quand inspirer, retenir et expirer : idéal allongé, sans regarder l’écran" : "Annonce le nom de chaque exercice") + " " + enLangue;
  $("recupRow").classList.toggle("hidden", !tb);
  $("repsVal").textContent = reps;
  $("recupVal").textContent = recup + " s";
  const ld = document.querySelector('label[for="dureeVal"]'), lr = document.querySelector('label[for="reposVal"]');
  ld.firstChild.textContent = T(sa ? "Durée de l’exercice" : tb ? "Temps d’exercice" : so ? "Durée de la séance" : mode === "calme" ? "Durée de chaque étirement" : "Durée par exercice");
  ld.querySelector("small").textContent = T(tb ? "Durée de chaque effort" : so ? "En minutes, les exercices s’adaptent" : "Appliquée à tous les exercices");
  lr.firstChild.textContent = tb ? T("Temps de repos") : (sa || routine.gym) && !routine.circuit ? L("Repos entre les séries", "Rest between sets") : T("Repos entre exercices");
  lr.querySelector("small").textContent = tb ? T("Pause entre deux répétitions") : rProp != null ? L("Proposé pour cette séance : ", "Suggested for this session: ") + reposTxt(rProp) + (routine.gym && !routine.circuit ? L(" · accessoires ajustés en proportion", " · accessories scaled to match") : routine.plan ? L(" · récupération entre les tours ajustée en proportion", " · recovery between rounds scaled to match") : "") : T("Pause avant l’exercice suivant");
    document.documentElement.style.setProperty("--accent", routine.couleur);
  const plan = so ? planSouf(routine, dureeGlobale) : [];
  const total = so ? plan.reduce((t, q) => t + q.sec, 0) : mode === "tabata"
    ? cycles * (reps * dureeGlobale + (reps - 1) * repos) + (cycles - 1) * recup
    : liste.reduce((s, e) => s + e.duree, 0) + (routine.plan ? liste.reduce((s, e) => s + e.r, 0) : mode === "seance" || sa ? repos * Math.max(0, liste.length - 1) : 0);
  totalPrevu = total;
  $("pTitle").textContent = mode !== "echauffement" || routine.fav ? routine.titre : T("Échauffement {t}", { t: LANGUE === "en" ? routine.titre : routine.titre.toLowerCase() });
  const nb = (n, un, plus, v) => T(n > 1 ? plus : un, { n, ...v });
  const min = String(Math.round(total / 60 * 10) / 10).replace(".", LANGUE === "en" ? "." : ",");
  $("pInfo").textContent = (tb ? nb(cycles, "{n} cycle", "{n} cycles") : so ? nb(routine.blocs.length, "{n} exercice", "{n} exercices") : sa ? T(cycles > 1 ? "{n} exercices × {s} séries" : "{n} exercices × {s} série", { n: ids.length, s: cycles }) : T("{n} exercices", { n: liste.length })) + " · " + T("environ {m} min", { m: min });
  $("dureeVal").closest(".reglage").classList.toggle("hidden", !!routine.plan); if (routine.plan && !rr) $("reposRow").classList.add("hidden");
  if (routine.plan) $("pInfo").textContent = L("environ {m} min · effort visé {r}/10", "about {m} min · target effort {r}/10").replace("{m}", Math.round(total / 60)).replace("{r}", routine.rpe);
  $("pList").innerHTML = routine.listeHtml ? routine.listeHtml : routine.blocsProg ? `<li class="etude prog-carte-jour"><div><small><b>${L("Semaine", "Week")} ${routine.semaine + 1} · ${L(SEMAINES[routine.semaine][0], SEMAINES[routine.semaine][1])}</b></small><small>🎯 ${routine.objectif}</small><small>💡 ${routine.conseil}</small></div></li>`
      + routine.blocsProg.map(b => `<li class="bloc-titre"><div><b>${b.n}</b><small>${b.t > 1 ? L("{t} tours", "{t} rounds").replace("{t}", b.t) + " · " : ""}${b.ex.length} ${L("exercices", "exercises")} · ${b.ex[0][1]} s${b.r ? " / " + b.r + " s " + L("de repos", "rest") : ""}${b.t > 1 ? " · " + b.rt + " s " + L("entre les tours", "between rounds") : ""}</small></div></li>`
        + b.ex.map(([id, d]) => `<li class="bloc-ex">${vignette(id)}<div><b>${EXERCICES[id].nom}</b><small>${EXERCICES[id].muscles}</small></div><span class="duree">${d} s</span></li>`).join("")).join("")
    : so
    ? routine.blocs.map((b, j) => `<li><div><b>${j + 1}. ${b.titre} · ${Math.round(plan.filter(q => q.j === j).reduce((t, q) => t + q.sec, 0) / 6) / 10} min</b><small>${b.resume}</small></div></li>`).join("")
      + `<li><div><small>${routine.etude} ${T("Séance de bien-être, pas un avis médical : arrête-toi en cas de vertige.")}</small></div></li>`
    : ids.length
    ? (routine.ami ? `<li class="etude defi"><div><small><b>🤝 ${L(`Ton ami ${routine.ami} te défie de réussir ${routine.amiDj ? "le défi du jour" : "cette séance"}. Relève le défi !`, `Your friend ${routine.ami} challenges you to complete ${routine.amiDj ? "the daily challenge" : "this workout"}. Take it on!`)}</b></small></div></li>` : "") + ids.map((id, i) => `<li data-i="${i}">${vignette(id)}<div><b>${EXERCICES[id].nom}</b><small>${EXERCICES[id].muscles}</small></div>${routine.fixe ? "" : `<button class="suppr" data-i="${i}" aria-label="${T("Retirer {n}", { n: EXERCICES[id].nom })}">×</button>`}</li>`).join("")
      + (routine.defi ? `<li class="etude defi"><div><small><b>${T("Le défi change chaque jour à minuit. Termine-le pour allonger ta série !")}</b></small></div></li>` : "")
      + (routine.blessure ? `<li class="etude"><div><small>${routine.etude}</small><small><b>${T("Pas un avis médical : reprends seulement après accord de ton médecin ou kiné. Aucun exercice ne doit faire mal : en cas de douleur, arrête.")}</b></small></div></li>` : "")
    : `<li><small>${T("Aucun exercice. Ajoutes-en au moins un pour commencer.")}</small></li>`;
  $("start").disabled = !tb && !so && ids.length === 0;
  if (!tb && !so) majAjout();
  ecran("preview");
}

/* ============ SÉANCE ============ */
function demarrer() {
  index = 0; enPause = false; enRepos = false;
  $("name").className = "name"; $("name").style.color = "";
  amorcerVoix();
  $("bars").innerHTML = liste.map(() => "<i><b></b></i>").join("");
  ecran("session");
  sons.change();
  afficher();
}

/* Vidéos d'exercices : fichiers videos/<id>.mp4 déposés à côté de index.html.
   Pour en ajouter une, il suffit d'ajouter son identifiant à VIDEOS. Si le fichier manque, le dessin s'affiche. */
const VIDEOS = ["esBrasTendus", "esChute", "esDrapeau", "esExtenseurs", "esJete", "esLolotte", "esMousqueton", "esPieds", "esRepos", "esSuspension", "esTalon", "naBattCote", "naBrasseGlisse", "naBulles", "naCoulee", "naCulbute", "naDosUnBras", "naOndulation", "naPapillonUnBras", "naPoings", "naRattrapage", "naRepere", "naRespi", "plBallon", "plBascule", "plCercle", "plCiseaux", "plCorkscrew", "plDoubleLeg", "plOpenLeg", "plRollingBall", "plSaw", "plSeal", "plShoulderBridge", "plSideKick", "plSingleLeg", "plSpineStretch", "plSwan", "sfBottom", "sfCanard", "sfChute", "sfCutback", "sfEquilibre", "sfMousse", "sfPopUp", "sfRameEau", "sfRameSec", "sfTakeOff", "sfTortue", "skAlternatif", "skBaton", "skCarving", "skChasseNeige", "skConversion", "skDerapage", "skDescenteBox", "skGodille", "skPatineur", "skPoudreuse", "skSautsSlalom", "skUnSki", "cyDanseuse", "cyDescente", "cyRelance", "cyUneJambe", "cyVelocite", "cyVirage", "hbDefense", "hbDribble", "hbFeinte", "hbGbBasse", "hbGbParade", "hbGbPosition", "hbPasseDeux", "hbPasseMur", "hbTir", "pdBinome", "pdLob", "pdVibora", "pdVitre", "pdVolee", "vbAttaque", "vbDefense", "vbDeux", "vbManchette", "vbPasse", "vbService", "bk1c1", "bkCross", "bkDefense", "bkDribble", "bkLancer", "bkLayup", "bkPasseDeux", "bkPasseMur", "bkRebond", "bkSautUni", "bkTir", "tnCoupDroit", "tnMur", "tnRetour", "tnRevers", "tnService", "tnVolee", "ftAppuis", "ftConduite", "ftControle", "ftCrochet", "ftDuel", "ftFrappe", "ftJonglage", "ftMurPasse", "ftPasseDeux", "ftTete", "gdDetente", "gdPlongeon", "gdPosition", "gdPrise", "gdReflexes", "gdRelance", "rnBras", "rnDescente", "rnLignes", "rnMarcheCote", "bxAigle", "bxAli", "bxBloc", "bxBoxJump", "bxBoxSquat", "bxClam", "bxCombo", "bxContre", "bxCorps", "bxCrochetAr", "bxCrochetAv", "bxDepth", "bxDirect", "bxEntree", "bxFenteDev", "bxFenteGenou", "bxFenteLat", "bxFentePdc", "bxGarde", "bxGlisses", "bxIsoCoup", "bxIsoMur", "bxJab", "bxKbSouleve", "bxLancerCoup", "bxLancerGenoux", "bxLandmine", "bxMoulin", "bxPallof", "bxPivot", "bxPompeYoga", "bxRelevesAlt", "bxRetrait", "bxRoule", "bxSautHalt", "bxShadowElast", "bxSlamRot", "bxSquatDev", "bxTirageRot", "bxTrapBar", "bxTrx", "bxUpperAr", "bxUpperAv", "burpeeSprawl", "genouxMur", "chasseGarde", "rafaleSac", "traineau", "inchworm", "squatBarre", "poulieTirage", "pecDeck", "rowPoulie", "shoulderMachine", "legExt", "wgs", "openbook", "thread", "wipers", "catcow", "cossack", "shadow", "dogpedal", "scorpion", "hip9090", "rdl", "fente", "pont", "askip", "armcircles", "armcross", "scap", "twist", "tspin", "slips", "bird", "cobra", "footwork", "heelkick", "kneeup", "lateral", "legfwd", "legside", "lungetwist", "sumo", "ankles", "calfraise", "cascade", "enfant", "hydrant", "paddle", "popup", "skater", "skisquat", "surfsquat", "battements", "crawlSec", "frappeVide", "lancer", "pasChasse", "pedalage", "rotEpaule", "sautContre", "sautTir", "skihop", "chaise", "climbers", "coupDroit", "fentesalt", "mollet1", "planche", "planchelat", "pontuni", "squat", "suspension", "burpees", "deadbug", "hollow", "pike", "planchetouch", "pompes", "pompesserrees", "russian", "squatsaute", "superman", "dbCurl", "dbLateral", "dbLunge", "dbPress", "dbRDL", "dbRow", "dbShoulder", "goblet", "kbPress", "kbSwing", "bulgare", "dips", "ezBench", "ezCurl", "ezRow", "ezSkull", "hipThrust", "poulieCrunch", "poulieTriceps", "stepUp", "bandChest", "bandPullApart", "bandRow", "bandWalk", "chinups", "discRussian", "discWood", "poulieBucheron", "roue", "tractions", "abducteurs", "benchBarre", "facePull", "legCurl", "molletsMachine", "presseCuisses", "pullover", "relevesJambes", "souleveTerre", "chestPress", "crossover", "curlMarteau", "extNuque", "grandissement", "inclineHalteres", "militaire", "nuqueFlex", "oiseau", "shrugs", "brasCroise", "dosMains", "flexionAssise", "genouxPoitrine", "lateralDebout", "murPecs", "nuqueLat", "poignets", "torsionAllongee", "triceps", "enfantStat", "fenteBasse", "fenteLatTenue", "figure4", "ischioCouche", "molletMur", "papillon", "quadDebout", "soleaire", "straddle", "alfredson", "cercleJambe", "chien", "copenhague", "equilibre", "extender", "hundred", "nuqueIso", "poignetExc", "rollUp", "bandRotExt", "jumpingJack", "pompesMur", "assisDebout", "donkeyKick", "crunchInverse", "ours", "rdlBarre", "hackSquat", "kickbackPoulie", "adducteursMachine", "curlPupitre", "relaxation", "splitStep", "fenteEtoile", "rotElastique", "bandejaVide", "receptionSaut", "pasDefensifs", "sprintNavette", "nordique", "lancerMedecine", "sautsRebond", "fouleesBond", "jambesTendues", "squatUni", "tractionBloquee", "doigtsElastique", "streamline", "nageElastique", "squatFreine", "fenteSautee", "rotationSurf", "equilibreSurf", "teaser", "swimmingPil", "ciseaux"];
/* Vignette des listes : image fixe tirée de la vidéo (vignettes/<id>.webp, chargée seulement à l'approche de l'écran), sinon le petit dessin */
const vignette = id => EXERCICES[id].video
  ? `<img class="mini" src="vignettes/${id}.webp" alt="" loading="lazy" decoding="async" width="72" height="49" onerror="this.outerHTML=mini('${id}')">`
  : mini(id);
VIDEOS.forEach(id => { if (EXERCICES[id]) EXERCICES[id].video = `videos/${id}.mp4`; });
/* Mouvement répété (la vidéo tourne en boucle) ou posture tenue (la vidéo s'arrête sur la position à tenir : instant repéré
   image par image dans chaque vidéo). L'isométrie de la nuque enchaîne 4 positions : posture, mais vidéo en boucle. */
const ARRET = {"chaise": 2.65, "planche": 2.5, "planchelat": 3.35, "hollow": 4.6, "ours": 3.95, "suspension": 3.0, "equilibre": 3.1, "skisquat": 3.0, "grandissement": 2.95, "nuqueFlex": 3.75, "nuqueLat": 2.75, "brasCroise": 0.9, "triceps": 3.4, "dosMains": 3.75, "poignets": 2.5, "murPecs": 2.15, "genouxPoitrine": 0.9, "torsionAllongee": 3.5, "lateralDebout": 2.55, "flexionAssise": 2.75, "figure4": 4.2, "papillon": 3.1, "quadDebout": 2.0, "ischioCouche": 3.45, "molletMur": 2.55, "soleaire": 3.4, "straddle": 3.4, "fenteLatTenue": 2.4, "fenteBasse": 3.1, "enfantStat": 4.05, "chien": 2.6, "relaxation": 3.35};
const posture = id => id in ARRET || id === "nuqueIso";
function typeEx(e) {
  const b = $("typeEx"); if (!e) return b.textContent = "";
  b.className = "type-ex " + (posture(e.id) ? "tenue" : "mvt");
  b.textContent = e.allure !== undefined ? L(...[["🟢 Allure facile · respire", "🟢 Easy pace · breathe"], ["🟠 Allure dure · reste régulier", "🟠 Hard pace · stay even"], ["🔴 À fond · donne tout", "🔴 All out · give everything"]][e.allure]) : posture(e.id) ? L("⏸ Posture · tiens la position de fin de la vidéo", "⏸ Hold · keep the end position of the video") : L("🔁 Mouvement · répète le geste de la vidéo", "🔁 Movement · repeat the motion in the video");
}
/* Texte de l'exercice : trois étapes courtes (placement, mouvement, point d'attention) tirées des consignes, dans la langue de l'appli ;
   à défaut, la description d'origine. La prescription de la séance (séries, charge) reste en tête. */
function etapesEx(e) {
  const c = typeof CONSIGNES !== "undefined" && CONSIGNES[e.id] ? CONSIGNES[e.id][LANGUE === "en" ? 1 : 0].split("|") : [], T3 = L("Position|Mouvement|Attention", "Set-up|Movement|Watch out").split("|");
  return (e.presc ? `<b class="presc">${e.presc}</b>` : "") + (c.length === 3 ? c.map((t, i) => `<span class="pas"><i>${T3[i]}</i>${t}</span>`).join("") : e.description);
}
/* Repère de mouvement : petite pastille animée dans le coin de la vidéo (haut-bas, côté à côté, rotation ou saut), déduite du texte
   de l'exercice. Rien pour les postures tenues : la vidéo s'y arrête déjà sur la position. */
function repereMvt(e) {
  if (posture(e.id)) return "";
  const t = e.nom + " " + e.description, k = /saut|jump|burpee|skip/i.test(t) ? "s" : /rotation|tourne|twist|pivot|cercle|circle|rotate|torsion/i.test(t) ? "r" : /latéral|lateral|côté|side|chassé|écarte|sideways/i.test(t) ? "h" : "v";
  const d = { v: "M6 9l6-6 6 6M6 15l6 6 6-6", h: "M9 6l-6 6 6 6M15 6l6 6-6 6", r: "M20 12a8 8 0 1 1-3-6.2M17 2v4h-4", s: "M6 14l6-6 6 6M6 20l6-6 6 6" }[k];
  return `<span class="guide g-${k}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg></span>`;
}
function media(e) {
  const box = $("mediaBox"), fige = ARRET[e.id];
  if (!e.video) return box.innerHTML = dessiner(e);
  box.innerHTML = `<video class="media${e.autreCote ? " miroir" : ""}" src="${e.video}" autoplay ${fige ? "" : "loop "}muted playsinline preload="auto" aria-label="${e.nom} en vidéo"></video>`;
  box.insertAdjacentHTML("beforeend", repereMvt(e));
  const v = box.querySelector("video"); v.onerror = () => { if (v.isConnected) box.innerHTML = dessiner(e); };   // une vidéo déjà remplacée ne doit pas écraser la suivante
  if (fige) v.ontimeupdate = () => { if (v.currentTime >= fige) { v.pause(); if (v.currentTime - fige > .3) v.currentTime = fige; v.ontimeupdate = null; } };
}

/* Fondu du contenu de la séance à chaque nouvel exercice */
function fondu() { const el = $("session"); el.classList.remove("frais"); void el.offsetWidth; el.classList.add("frais"); }

function afficher() {
  noterSeance(); fondu();
  const e = liste[index], kc = e.duree >= 10 && changements(e.id);
  programmerConseils(e, conseilDejaDit === index); conseilDejaDit = -1;
  bandeauCote(kc ? kc.seg[LANGUE === "en" ? 1 : 0][0] : "");
  reste = e.duree;
  $("count").textContent = e.lab ? e.lab : e.bn ? e.bn + (e.tt > 1 ? L(" · tour {t}/{n}", " · round {t}/{n}").replace("{t}", e.t).replace("{n}", e.tt) : "") + " · " + (index + 1) + "/" + liste.length : e.series ? T("Exercice {a} sur {b} · série {c} sur {d}", { a: Math.floor(index / e.series) + 1, b: liste.length / e.series, c: e.serie, d: e.series }) : T("Exercice {a} sur {b}", { a: index + 1, b: liste.length });
  $("name").textContent = e.nom; typeEx(e);
  $("time").style.color = "";
  parler(annonce(e, liste[index - 1]));
  $("desc").innerHTML = etapesEx(e);
  $("zones").textContent = e.muscles;
  media(e);
  const sv = liste.slice(index + 1).find(x => x.id !== e.id);   // aperçu du prochain mouvement différent ; un appui y passe
  $("ensuite").innerHTML = sv ? `${vignette(sv.id)}<span><small>${L("Ensuite", "Up next")}</small><b>${sv.nom}</b></span>` : "";
  [...$("bars").children].forEach((el, i) => {
    el.classList.toggle("done", i < index);
    el.firstChild.style.width = i < index ? "100%" : "0";
  });
  majTemps();
  clearInterval(timer);
  timer = horloge(tic);
  $("pause").textContent = T(enPause ? "Reprendre" : "Pause");
}

function majTemps() {
  $("time").textContent = reste;
  const e = liste[index];
  $("bars").children[index].firstChild.style.width = ((e.duree - reste) / e.duree * 100) + "%";
}

function tic() {
  if (enPause) return;
  reste--;
  if (reste <= 3 && reste > 0) sons.alerte(); else if (reste > 3 && (!enRepos || routine.tbt)) sons.tic();
  if (reste <= 0) return suivant(true);
  if (enRepos) { $("time").textContent = reste; return; }
  const jc = instantsCh(liste[index]).indexOf(reste);
  if (jc >= 0) changerCote(liste[index], jc);
  else if (!direConseil(reste)) coach(liste[index], reste);
  majTemps();
}

function suivant(auto) {
  if (enRepos) { enRepos = false; index++; if (auto) sons.change(); return afficher(); }
  if (index >= liste.length - 1) return terminer();
  if (auto && (mode === "seance" || mode === "salle") && (liste[index].r ?? repos) > 0) return afficherRepos();
  index++;
  if (auto) sons.change();
  afficher();
}

function precedent() { if (enRepos) enRepos = false; else if (index > 0) index--; afficher(); }

/* ============ TABATA ============
   Un cycle = un exercice répété "reps" fois (effort + repos). Entre deux cycles : récupération. */
let tab = { c: 0, r: 0, ph: "ex" };

function demarrerTab() {
  tab = { c: 0, r: 0, ph: "ex" };
  enPause = false; enRepos = false;
  amorcerVoix();
  $("bars").innerHTML = "<i><b></b></i>".repeat(cycles);
  ecran("session");
  sons.change();
  afficherTab();
}

function afficherTab() { $("ensuite").innerHTML = "";
  noterSeance(); fondu(); bandeauCote(""); typeEx();
  const P = { ex: [T("EXERCICE"), dureeGlobale, "#D9480F"], rep: [T("REPOS"), repos, "#2F7D3A"], rec: [T("RÉCUPÉRATION"), recup, "#3A6EA5"] }[tab.ph];
  reste = P[1];
  $("count").textContent = tab.ph === "rec"
    ? T("Cycle {a} terminé · prochain : cycle {b} sur {c}", { a: tab.c + 1, b: tab.c + 2, c: cycles })
    : T("Cycle {a} sur {b} · Répétition {c} sur {d}", { a: tab.c + 1, b: cycles, c: tab.r + 1, d: reps });
  $("name").className = "name grand";
  $("name").textContent = P[0];
  $("name").style.color = P[2];
  $("time").style.color = P[2];
  $("time").textContent = reste;
  $("desc").textContent = ""; $("zones").textContent = ""; $("mediaBox").innerHTML = "";
  [...$("bars").children].forEach((el, i) => {
    const pct = i < tab.c ? 100 : i > tab.c ? 0
      : tab.ph === "rec" ? 100 : Math.round((tab.r + (tab.ph === "rep" ? 1 : 0)) / reps * 100);
    el.firstChild.style.width = pct + "%";
    el.classList.toggle("done", pct === 100);
  });
  clearInterval(timer);
  timer = horloge(ticTab);
  $("pause").textContent = T(enPause ? "Reprendre" : "Pause");
  if (tab.ph === "rec") parler(PH("recup"));
  else if (tab.ph === "ex" && tab.r === 0) parler(PH("tour") + (tab.c + 1));
}

function ticTab() {
  if (enPause) return;
  reste--;
  if (reste <= 3 && reste > 0) sons.alerte(); else if (reste > 3) sons.tic();
  if (reste <= 0) return suivantTab(true);
  $("time").textContent = reste;
}

function suivantTab(auto) {
  const n = cycles;
  if (tab.ph === "ex") {
    if (tab.r < reps - 1) { if (repos > 0) tab.ph = "rep"; else tab.r++; }
    else if (tab.c < n - 1) { if (recup > 0) tab.ph = "rec"; else { tab.c++; tab.r = 0; } }
    else return terminer();
  } else if (tab.ph === "rep") { tab.r++; tab.ph = "ex"; }
  else { tab.c++; tab.r = 0; tab.ph = "ex"; }
  if (auto) sons.change();
  afficherTab();
}

function precedentTab() {
  if (tab.ph !== "ex") tab.ph = "ex";
  else if (tab.r > 0) tab.r--;
  else if (tab.c > 0) { tab.c--; tab.r = reps - 1; }
  afficherTab();
}

function setCycles(n) {
  cycles = Math.min(mode === "salle" ? 6 : 30, Math.max(1, n));
  stocker(mode === "salle" ? "seriesSalle" : "cyclesTabata", cycles);
  if (routineCle) ouvrirApercu(routineCle);
}
function setReps(n) {
  reps = Math.min(30, Math.max(1, n));
  stocker("repsTabata", reps);
  if (routineCle) ouvrirApercu(routineCle);
}
function setRecup(n) {
  recup = Math.min(300, Math.max(0, n));
  stocker("recupTabata", recup);
  if (routineCle) ouvrirApercu(routineCle);
}

/* ============ COHÉRENCE CARDIAQUE ============
   Respiration guidée : inspire / expire en alternance, avec un cercle qui gonfle et se dégonfle. */
let souf = { plan: [], i: 0 };

/* Déroule les blocs en une liste de phases ; les durées sont mises à l'échelle de la durée choisie (minutes) */
function planSouf(r, minutes) {
  const f = minutes * 60 / r.blocs.reduce((t, b) => t + b.duree, 0), plan = [];
  r.blocs.forEach((b, j) => {
    const len = b.cycle.reduce((t, p) => t + p[1], 0), n = Math.max(1, Math.round(b.duree * f / len));
    for (let c = 0; c < n; c++) b.cycle.forEach(([label, sec, to]) => plan.push({ j, c, n, label, sec, to }));
  });
  return plan;
}

function demarrerSouf() {
  souf = { plan: planSouf(routine, dureeGlobale), i: 0 };
  enPause = false; enRepos = false;
  amorcerVoix();
  $("bars").innerHTML = routine.blocs.map(() => "<i><b></b></i>").join("");
  ecran("session");
  sons.change();
  afficherSouf();
}

function afficherSouf() { $("ensuite").innerHTML = "";
  noterSeance(); bandeauCote(""); typeEx();
  const p = souf.plan[souf.i], b = routine.blocs[p.j], de = souf.i ? souf.plan[souf.i - 1].to : 0.45;
  const c = p.to > de ? "var(--accent)" : p.to < de ? "#2F7D3A" : "var(--muted)";
  const debutBloc = p.c === 0 && p.label === b.cycle[0][0];
  reste = p.sec;
  $("count").textContent = T("Exercice {a} sur {b} · {t}", { a: p.j + 1, b: routine.blocs.length, t: b.titre });
  $("name").className = "name grand";
  $("name").textContent = LANGUE === "en" ? SOUFFLE_VOIX[p.label].toUpperCase() : p.label;
  $("name").style.color = c; $("time").style.color = c;
  $("time").textContent = reste;
  $("desc").textContent = b.consigne;
  $("zones").textContent = T("Cycle {a} sur {b}", { a: p.c + 1, b: p.n });
  $("mediaBox").innerHTML = `<div class="souffle"><i style="--de:${de};--vers:${p.to};animation-duration:${p.sec}s;animation-play-state:${enPause ? "paused" : "running"}"></i></div>`;
  [...$("bars").children].forEach((el, j) => {
    const phases = souf.plan.filter(q => q.j === j), faites = phases.filter(q => souf.plan.indexOf(q) < souf.i).length;
    const pct = j < p.j ? 100 : j > p.j ? 0 : Math.round(faites / phases.length * 100);
    el.firstChild.style.width = pct + "%"; el.classList.toggle("done", pct === 100);
  });
  clearInterval(timer);
  timer = horloge(ticSouf);
  $("pause").textContent = T(enPause ? "Reprendre" : "Pause");
  if (debutBloc && souf.i) { bip(660, 900, 0.12); bip(880, 900, 0.08, "sine", 0.15); }
  else if (p.to !== de) bip(p.to > de ? 523 : 392, 650, 0.1);
  // voix : titre de l'exercice au début de chaque bloc, puis chaque changement de phase (immédiat, débit calme)
  const prec = souf.i ? souf.plan[souf.i - 1].label : "";
  if (debutBloc || p.label !== prec) parler((debutBloc ? (langueVoix === "fr" ? b.titreFr || b.titre : b.voix) + ". " : "") + (langueVoix === "fr" ? p.label.charAt(0) + p.label.slice(1).toLowerCase() : SOUFFLE_VOIX[p.label]), 0, 0.85);
}

function ticSouf() {
  if (enPause) return;
  reste--;
  if (reste <= 0) return suivantSouf();
  $("time").textContent = reste;
}

function suivantSouf() {
  if (souf.i >= souf.plan.length - 1) return terminer();
  souf.i++;
  afficherSouf();
}

function precedentSouf() { if (souf.i > 0) souf.i--; afficherSouf(); }

/* Phase de repos entre deux exercices (séances) : on voit déjà le prochain exercice */
function afficherRepos() {
  fondu(); bandeauCote(""); typeEx(liste[index + 1]);
  enRepos = true;
  const e = liste[index + 1], fin = liste[index].ft;
  reste = liste[index].r ?? repos;
  $("count").textContent = e.series ? T("Repos · prochaine : série {a} sur {b}", { a: e.serie, b: e.series }) : T("Repos · prochain : exercice {a} sur {b}", { a: index + 2, b: liste.length });
  $("name").textContent = fin ? L("Récupération", "Recovery") : T("Repos");
  if (e.lab) $("count").textContent = L("Repos · ensuite : ", "Rest · next: ") + e.lab;
  else if (e.bn && e.bn !== liste[index].bn) $("count").textContent = L("Repos · ensuite : ", "Rest · next: ") + e.bn;
  $("time").style.color = "var(--muted)";
  $("time").textContent = reste;
  $("desc").textContent = T(e.series ? "Prochaine série : " : "Prochain exercice : ") + e.nom + ". " + e.description;
  $("zones").textContent = e.muscles;
  media(e);
  [...$("bars").children].forEach((el, i) => {
    el.classList.toggle("done", i <= index);
    el.firstChild.style.width = i <= index ? "100%" : "0";
  });
  clearInterval(timer);
  timer = horloge(tic);
  $("pause").textContent = T(enPause ? "Reprendre" : "Pause");
  bip(440, 350, 0.2, "sine"); vibrer(220); $("conseil").textContent = "";
  const c0 = conseilsActifs && reste >= 10 && !(e.serie > 1 || e.t > 1) && consignes(e.id)[0];
  parler(PH("repos") + annonce(e, liste[index], true) + (c0 ? ". " + c0 : "")); if (c0) conseilDejaDit = index + 1;
  $("plusRepos").classList.remove("hidden");
}
$("plusRepos").onclick = () => { if (enRepos) { reste += 15; $("time").textContent = reste; } };

function terminer() {
  clearInterval(timer); horlogeActive++; oublierSeance();
  const R0 = routine || {};
  sons.change();
  const [titre, sous] = {
    echauffement: R0.ramp ? [L("Échauffement terminé", "Warm-up complete"), L("Tu es prêt ! Lance ton sport dans les 10 minutes pour garder tout l’effet.", "You are ready! Start your sport within 10 minutes to keep the full effect.")] : ["Échauffement terminé", "Tu es prêt pour ta séance."],
    renfo: [L("Renfo terminé", "Strength session complete"), L("Muscles et tendons plus solides : hydrate-toi et laisse 48 h avant de retravailler les mêmes muscles.", "Stronger muscles and tendons: drink some water and allow 48 hours before working the same muscles again.")],
    tbt: [L("Tabata terminé", "Tabata complete"), L("Ton cœur a travaillé au maximum ! Récupère bien : pas de Tabata demain.", "Your heart worked at its max! Recover well: no Tabata tomorrow.")],
    calme: ["Étirements terminés", "Tes muscles te remercient. Pense à t’hydrater."],
    souffle: ["Respiration terminée", "Reste un instant, les yeux fermés, avant de reprendre."],
    recup: ["Récupération terminée", "Bois un grand verre d’eau et prends soin de ton sommeil ce soir."]
  }[R0.recup ? "recup" : R0.tbt ? "tbt" : (R0.renfoS || R0.grp) && mode === "seance" ? "renfo" : mode] || ["Séance terminée", "Bien joué ! Pense à t’hydrater et à t’étirer."];
  $("fTitre").textContent = T(titre); $("fSub").textContent = T(sous);
  celebrer();
  if (routine.ami) { $("fTitre").textContent = L("Défi relevé !", "Challenge completed!"); $("fSub").textContent = L(`Tu as terminé le défi de ${routine.ami}. À ton tour : envoie-lui une séance depuis son aperçu.`, `You finished the challenge from ${routine.ami}. Your turn: send them a workout from its preview.`); }
  if (routine.defi) { const n = defiReussi(); $("fTitre").textContent = T("Défi réussi !"); $("fSub").textContent = T(n > 1 ? "Série : {n} jours d’affilée. Reviens demain pour un nouveau défi !" : "Reviens demain pour un nouveau défi !", { n }); }
  ecran("end");
}

function pause() {
  enPause = !enPause;
  $("pause").textContent = T(enPause ? "Reprendre" : "Pause");
  const vid = document.querySelector("#mediaBox video");
  if (vid) enPause ? vid.pause() : vid.play().catch(() => {});
  const rond = document.querySelector(".souffle i");
  if (rond) rond.style.animationPlayState = enPause ? "paused" : "running";
  majVerrou();
}

/* ============ DÉFI DU JOUR ============
   Calendrier fixe : 30 défis qui se suivent jour après jour depuis le 22 octobre 2026, puis recommencent.
   Le même pour tout le monde, il change à minuit (heure du téléphone). */
const DEFIS = [["Jambes de feu", "Legs on fire", "Squats, fentes, sauts : les cuisses vont chauffer", "Squats, lunges, jumps: your thighs will burn", ["squat", "fente", "squatsaute", "chaise", "calfraise"], 45, 15], ["Gainage d’acier", "Iron core", "Cinq positions de gainage sans tricher", "Five core holds, no cheating", ["planche", "planchelat", "deadbug", "hollow", "planchetouch"], 40, 15], ["Pompes en série", "Push-up series", "Pompes, épaules et triceps", "Push-ups, shoulders and triceps", ["pompes", "pompesserrees", "pike", "tspin", "scap"], 35, 20], ["Mobilité totale", "Full mobility", "Hanches, dos et épaules libérés", "Free up hips, back and shoulders", ["wgs", "catcow", "scorpion", "hip9090", "openbook", "thread"], 40, 10], ["Cardio express", "Cardio express", "Le cœur monte vite dans les tours", "Your heart rate will climb fast", ["burpees", "climbers", "kneeup", "heelkick", "skater"], 35, 15], ["Pilates", "Pilates", "Centre du corps et contrôle", "Core and control", ["hundred", "rollUp", "cercleJambe", "pont", "superman"], 40, 15], ["Fessiers sculptés", "Glute builder", "Pont, abduction et charnière de hanche", "Bridges, abduction and hip hinges", ["pont", "pontuni", "hydrant", "lateral", "rdl"], 45, 15], ["Explosivité", "Explosive power", "Sauts puissants et réactifs", "Powerful, snappy jumps", ["squatsaute", "fentesalt", "skihop", "sautContre", "popup"], 30, 20], ["Dos solide", "Strong back", "Extension, posture et omoplates", "Extension, posture and shoulder blades", ["superman", "bird", "cobra", "scap", "catcow"], 40, 15], ["Abdos express", "Express abs", "Cinq exercices pour la sangle abdominale", "Five moves for your abs", ["russian", "hollow", "climbers", "deadbug", "battements"], 35, 15], ["Équilibre", "Balance", "Sur une jambe, sans poser le pied", "On one leg, no touching down", ["equilibre", "rdl", "pontuni", "lungetwist", "mollet1"], 40, 15], ["Boxe shadow", "Shadow boxing", "Coups, esquives et jeu de jambes", "Punches, slips and footwork", ["shadow", "slips", "footwork", "burpees", "kneeup"], 40, 15], ["Spécial bureau", "Desk reset", "Nuque, épaules et dos après une journée assis", "Neck, shoulders and back after a day sitting", ["grandissement", "nuqueLat", "armcross", "twist", "catcow", "cascade"], 40, 10], ["Jambes d’acier", "Steel legs", "Positions tenues : ça brûle sans bouger", "Static holds: it burns without moving", ["chaise", "surfsquat", "skisquat", "lateral", "calfraise"], 45, 15], ["Haut du corps", "Upper body blast", "Pompes, épaules et gainage", "Push-ups, shoulders and core", ["pompes", "planchetouch", "pike", "tspin", "inchworm"], 40, 20], ["HIIT 30/30", "HIIT 30/30", "30 secondes à fond, 30 secondes de repos", "30 seconds all-out, 30 seconds rest", ["burpees", "squatsaute", "climbers", "fentesalt", "skater", "kneeup"], 30, 30], ["Spécial coureur", "Runner’s special", "Gammes et renforcement pour courir mieux", "Drills and strength to run better", ["askip", "heelkick", "kneeup", "fente", "calfraise", "rdl"], 40, 15], ["Spécial foot", "Football special", "Frappes, appuis et changements de direction", "Kicks, footwork and cutting", ["frappeVide", "skater", "pasChasse", "fentesalt", "lateral"], 40, 15], ["Détente verticale", "Vertical leap", "Sauts de basket et de volley", "Basketball and volleyball jumps", ["sautContre", "sautTir", "pasChasse", "squatsaute", "skihop"], 35, 20], ["Spécial ski", "Ski special", "Cuisses, appuis latéraux et rebonds", "Thighs, lateral push and bounces", ["skisquat", "skihop", "lateral", "chaise", "skater"], 40, 15], ["Spécial surf", "Surf special", "Rame, pop-up et équilibre", "Paddling, pop-up and balance", ["popup", "paddle", "surfsquat", "cobra", "superman"], 40, 15], ["Spécial natation", "Swim special", "Épaules, dos et battements", "Shoulders, back and kicks", ["crawlSec", "battements", "superman", "armcircles", "planche"], 40, 15], ["Hanches libres", "Open hips", "Mobilité profonde des hanches", "Deep hip mobility", ["hip9090", "figure4", "cossack", "fenteBasse", "papillon", "scorpion"], 40, 10], ["Gainage dynamique", "Dynamic core", "Le gainage qui bouge", "Core work on the move", ["climbers", "planchetouch", "tspin", "russian", "hollow"], 35, 15], ["Le classique", "The classic", "Pompes, squats et planche", "Push-ups, squats and plank", ["pompes", "squat", "pompesserrees", "sumo", "planche"], 40, 15], ["Dos souple", "Supple back", "Étirements doux de la colonne", "Gentle spine stretches", ["catcow", "cobra", "enfant", "chien", "torsionAllongee", "wipers"], 40, 10], ["Full body 5 minutes", "5-minute full body", "Tout le corps en cinq minutes chrono", "Your whole body in five minutes", ["burpees", "squat", "pompes", "climbers", "fente"], 45, 15], ["Épaules solides", "Solid shoulders", "Mobilité et force des épaules", "Shoulder mobility and strength", ["armcircles", "scap", "pike", "rotEpaule", "tspin", "planchetouch"], 35, 15], ["Spécial raquette", "Racket special", "Tennis et padel : appuis et rotation", "Tennis and padel: footwork and rotation", ["coupDroit", "pasChasse", "lateral", "skater", "lungetwist"], 40, 15], ["Le grand final", "The grand finale", "Le défi le plus dur du mois", "The toughest challenge of the month", ["burpees", "squatsaute", "pompes", "climbers", "planche", "fentesalt"], 45, 15]];
const jourNum = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 9, 22)) / 864e5);
const duJour = (liste, d) => liste[((jourNum(d) % liste.length) + liste.length) % liste.length];
const jourCle = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function defiDuJour(d) {
  const [tFr, tEn, dFr, dEn, pool, duree, rep] = duJour(DEFIS, d);
  const ok = pool.filter(id => EXERCICES[id]);
  const EN = LANGUE === "en", titre = (EN ? "Daily challenge · " : "Défi du jour · ") + (EN ? tEn : tFr);
  ROUTINES.defi = { type: "seance", defi: true, fixe: true, titre, titreFr: "Défi du jour · " + tFr, detail: EN ? dEn : dFr, couleur: "#F59E0B", duree, repos: rep, exercices: ok };
  CONSEILLES.defi = ok;
}
const lireJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } };
function majEtoile() {
  const fait = lireJSON("defiSerie", {}).jour === jourCle();
  $("defiBtn").classList.toggle("fait", fait); $("defiFait").classList.toggle("hidden", !fait);
  const d = duJour(DEFIS); $("defiTxt").textContent = fait ? L("Réussi · nouveau défi demain", "Done · new challenge tomorrow") : L(d[0], d[1]);
}
function defiReussi() {
  const s = lireJSON("defiSerie", {}), hier = new Date(); hier.setDate(hier.getDate() - 1);
  const n = s.jour === jourCle() ? s.n : s.jour === jourCle(hier) ? s.n + 1 : 1;
  stocker("defiSerie", JSON.stringify({ jour: jourCle(), n }));
  return n;
}
$("defiBtn").onclick = () => { defiDuJour(); ouvrirRoutine("defi"); };
setInterval(() => ecranCourant === "menu" && majEtoile(), 60000);   // passage de minuit pendant que l'appli est ouverte

/* ============ MUSCLE DU JOUR ============
   Calendrier fixe : 100 muscles, un par jour depuis le 22 octobre 2026, en alternant jambes, tronc, bras et tête. Change à minuit.
   Sources : Gray's Anatomy (42e éd., 2020), Kapandji - Anatomie fonctionnelle, et les études citées dans chaque fiche. */
const MUSCLES = [["grandFessier", ["pont", "hipThrust", "squat", "bulgare", "fente"], ["Grand fessier", "Fesses · hanche", "De l’arrière de l’os iliaque, du sacrum et du coccyx jusqu’à l’arrière du fémur (tubérosité glutéale) et à la bandelette ilio-tibiale.", "Étend la hanche (ramène la cuisse vers l’arrière) et la fait tourner vers l’extérieur. Ses fibres hautes participent à l’écartement de la cuisse.", "Il te redresse quand tu te relèves d’une chaise, que tu montes un escalier, que tu sprintes ou que tu sautes. Il est peu sollicité quand tu marches doucement sur du plat.", "C’est le muscle le plus volumineux du corps humain. Son grand développement est lié à la station debout et à la course chez l’être humain."], ["Gluteus maximus", "Buttocks · hip", "From the back of the ilium, the sacrum and the coccyx to the back of the femur (gluteal tuberosity) and the iliotibial band.", "Extends the hip (moves the thigh backwards) and rotates it outwards. Its upper fibres help move the thigh out to the side.", "It straightens you up when you rise from a chair, climb stairs, sprint or jump. It works little when you walk slowly on flat ground.", "It is the most voluminous muscle in the human body. Its large size is linked to upright posture and running in humans."]], ["pectoral", ["pompes", "benchBarre", "pecDeck", "crossover", "chestPress"], ["Grand pectoral", "Poitrine", "De la moitié interne de la clavicule, du sternum et des cartilages des six premières côtes jusqu’à l’avant de l’humérus.", "Rapproche le bras du corps et le fait passer devant la poitrine (adduction horizontale), le tourne vers l’intérieur. Son faisceau claviculaire aide à lever le bras vers l’avant.", "Il te sert à pousser une porte, te relever du sol, lancer, serrer quelqu’un dans tes bras et grimper.", "Ses fibres se croisent avant de s’attacher sur l’humérus : celles du bas se fixent plus haut que celles du haut, ce qui lui permet de rester efficace même bras levé."], ["Pectoralis major", "Chest", "From the inner half of the clavicle, the sternum and the cartilages of the first six ribs to the front of the humerus.", "Brings the arm towards and across the body (horizontal adduction) and rotates it inwards. Its clavicular part helps raise the arm forward.", "You use it to push a door, get up from the floor, throw, hug someone and climb.", "Its fibres twist before attaching to the humerus: the lower fibres attach higher than the upper ones, which keeps it effective even with the arm raised."]], ["myocarde", ["burpees", "climbers", "skater", "squatsaute"], ["Myocarde (muscle cardiaque)", "Cœur", "Un muscle strié particulier dont les cellules sont reliées entre elles pour se contracter ensemble ; il forme les parois des quatre cavités du cœur.", "Il se contracte de façon automatique et rythmique, sans que tu le commandes, pour éjecter le sang dans les artères.", "Il fait circuler le sang dans tout le corps, environ 100 000 battements par jour.", "L’entraînement d’endurance augmente le volume de sang éjecté à chaque battement : c’est pour cela que le cœur des sportifs bat plus lentement au repos."], ["Myocardium (heart muscle)", "Heart", "A special striated muscle whose cells are linked so they contract together; it forms the walls of the heart’s four chambers.", "It contracts automatically and rhythmically, without you controlling it, to push blood into the arteries.", "It circulates blood through the whole body, about 100,000 beats a day.", "Endurance training increases the volume of blood pumped at each beat: that is why athletes’ hearts beat more slowly at rest."]], ["grandDroit", ["hollow", "poulieCrunch", "relevesJambes", "deadbug", "hundred"], ["Grand droit de l’abdomen", "Avant du ventre", "Du pubis jusqu’au bas du sternum (processus xiphoïde) et aux cartilages des 5e à 7e côtes. Il est divisé par des bandes tendineuses.", "Enroule le tronc vers l’avant (flexion du buste) et bascule le bassin vers l’arrière. Il augmente aussi la pression dans l’abdomen.", "Il t’aide à te redresser quand tu es allongé, à tousser, à expirer fort et à garder le tronc rigide quand tu portes, pousses ou frappes.", "Les « tablettes de chocolat » viennent de ces intersections tendineuses : leur nombre est déterminé par l’anatomie, pas par l’entraînement. Les rendre visibles dépend surtout de la graisse abdominale."], ["Rectus abdominis", "Front of the belly", "From the pubis to the bottom of the sternum (xiphoid process) and the cartilages of ribs 5 to 7. It is divided by tendinous bands.", "Curls the trunk forward (trunk flexion) and tilts the pelvis backwards. It also raises the pressure inside the abdomen.", "It helps you sit up from lying, cough, breathe out forcefully and keep your trunk rigid when you carry, push or strike.", "The “six-pack” comes from these tendinous intersections: their number is set by anatomy, not training. Seeing them depends mostly on belly fat."]], ["quadriceps", ["squat", "legExt", "fente", "presseCuisses", "chaise"], ["Quadriceps", "Avant de la cuisse", "Quatre chefs : le droit fémoral part du bassin (épine iliaque antéro-inférieure), les trois vastes partent du fémur. Ils se rejoignent dans le tendon quadricipital, qui englobe la rotule et se termine par le tendon rotulien sur le tibia.", "Étend le genou. Le droit fémoral, qui croise aussi la hanche, aide en plus à fléchir la hanche.", "Il te permet de te relever, de monter les marches et surtout de freiner : en descente, à la réception d’un saut, il travaille en s’allongeant (contraction excentrique) pour amortir.", "La rotule agit comme une poulie : elle éloigne le tendon de l’axe du genou et augmente ainsi le bras de levier, donc la force d’extension."], ["Quadriceps", "Front of the thigh", "Four heads: the rectus femoris starts on the pelvis (anterior inferior iliac spine), the three vasti start on the femur. They merge into the quadriceps tendon, which wraps the kneecap and ends as the patellar tendon on the tibia.", "Extends the knee. The rectus femoris, which also crosses the hip, additionally helps flex the hip.", "It lets you stand up, climb stairs and above all brake: going downhill or landing from a jump, it works while lengthening (eccentric contraction) to absorb the impact.", "The kneecap acts like a pulley: it moves the tendon away from the knee axis, increasing the lever arm and therefore the extension force."]], ["grandDorsal", ["tractions", "poulieTirage", "pullover", "dbRow", "rowPoulie"], ["Grand dorsal", "Bas et côtés du dos", "Le plus large muscle du corps. Il part des vertèbres de T7 à L5, du fascia du bas du dos, de la crête iliaque et des dernières côtes, et se termine à l’avant de l’humérus.", "Tire le bras vers le bas et vers l’arrière (extension et adduction de l’épaule) et le tourne vers l’intérieur.", "Il te sert à grimper, à nager le crawl, à ramer, à te hisser et à pousser sur des béquilles ou un fauteuil.", "Parce qu’il relie le bassin au bras, il participe aussi à la stabilité du bas du dos et à la transmission de force entre le haut et le bas du corps."], ["Latissimus dorsi", "Lower back and sides", "The widest muscle in the body. It starts on the vertebrae from T7 to L5, the lower-back fascia, the iliac crest and the last ribs, and attaches to the front of the humerus.", "Pulls the arm down and back (shoulder extension and adduction) and rotates it inwards.", "You use it to climb, swim front crawl, row, pull yourself up and push on crutches or a wheelchair.", "Because it links the pelvis to the arm, it also contributes to lower-back stability and to transferring force between the upper and lower body."]], ["ischios", ["rdl", "legCurl", "pont", "extender", "souleveTerre"], ["Ischio-jambiers", "Arrière de la cuisse", "Trois muscles (biceps fémoral, semi-tendineux, semi-membraneux) partent de l’ischion, l’os sur lequel tu t’assois (le chef court du biceps part du fémur). Ils se terminent sous le genou, sur le péroné et sur la face interne du tibia.", "Fléchissent le genou et étendent la hanche. Ils travaillent donc sur deux articulations à la fois.", "En course, ils freinent la jambe qui part vers l’avant juste avant que le pied touche le sol. Ils protègent aussi le genou en limitant le glissement du tibia vers l’avant, comme le fait le ligament croisé antérieur.", "C’est la blessure musculaire la plus fréquente dans les sports de sprint comme le football (Ekstrand et al., 2011). Le travail en allongement, comme le Nordic hamstring, en réduit nettement le risque."], ["Hamstrings", "Back of the thigh", "Three muscles (biceps femoris, semitendinosus, semimembranosus) start on the ischial tuberosity, the bone you sit on (the short head of the biceps starts on the femur). They end below the knee, on the fibula and the inner tibia.", "Flex the knee and extend the hip, so they work across two joints at once.", "When running, they brake the leg swinging forward just before the foot strikes the ground. They also protect the knee by limiting forward sliding of the tibia, like the anterior cruciate ligament does.", "It is the most common muscle injury in sprint sports such as football (Ekstrand et al., 2011). Lengthening work, such as the Nordic hamstring, clearly reduces the risk."]], ["deltoide", ["militaire", "dbLateral", "oiseau", "shoulderMachine", "dbShoulder"], ["Deltoïde", "Épaule", "Du tiers externe de la clavicule, de l’acromion et de l’épine de l’omoplate jusqu’au milieu de la face externe de l’humérus (tubérosité deltoïdienne). Il a trois faisceaux.", "Le faisceau antérieur lève le bras vers l’avant, le moyen l’écarte sur le côté, le postérieur le tire vers l’arrière.", "Il te permet de lever les bras pour attraper un objet en hauteur, te coiffer, lancer ou nager.", "Il ne travaille jamais seul : pendant qu’il soulève le bras, le supra-épineux (un muscle de la coiffe) plaque la tête de l’humérus dans sa cavité, sinon elle remonterait et viendrait buter sous l’acromion."], ["Deltoid", "Shoulder", "From the outer third of the clavicle, the acromion and the spine of the scapula to the middle of the outer humerus (deltoid tuberosity). It has three parts.", "The front part raises the arm forward, the middle part lifts it to the side, the rear part pulls it back.", "It lets you raise your arms to reach something high, do your hair, throw or swim.", "It never works alone: while it lifts the arm, the supraspinatus (a rotator cuff muscle) presses the head of the humerus into its socket, otherwise it would ride up and hit the acromion."]], ["masseter", [], ["Masséter", "Joue, angle de la mâchoire", "De l’arcade zygomatique (la pommette) jusqu’à l’angle et la face externe de la mâchoire inférieure.", "Ferme la bouche en remontant la mâchoire.", "Il te permet de mâcher et de serrer les dents ; il se contracte aussi quand tu fais un effort intense.", "Rapporté à sa taille, c’est l’un des muscles les plus puissants du corps. Il est très sollicité chez les personnes qui grincent des dents la nuit (bruxisme)."], ["Masseter", "Cheek, angle of the jaw", "From the zygomatic arch (cheekbone) to the angle and outer surface of the lower jaw.", "Closes the mouth by lifting the jaw.", "It lets you chew and clench your teeth; it also tightens during intense effort.", "Relative to its size, it is one of the most powerful muscles in the body. It works very hard in people who grind their teeth at night (bruxism)."]], ["transverse", ["planche", "deadbug", "bird", "hundred", "catcow"], ["Transverse de l’abdomen", "Ceinture profonde du ventre", "Le plus profond des muscles abdominaux. Ses fibres horizontales partent des six dernières côtes, du fascia du bas du dos et de la crête iliaque, et se rejoignent au milieu du ventre (ligne blanche).", "Comprime le ventre comme une ceinture. Il ne fait presque pas bouger le tronc mais le rigidifie.", "Il stabilise le bas du dos avant même que tu bouges un bras ou une jambe, et participe à l’expiration forcée, à la toux et à l’effort de poussée.", "Hodges et Richardson (1996) ont montré qu’il se contracte juste avant les mouvements des bras chez les personnes sans douleur, et avec un retard chez celles qui ont mal au dos."], ["Transversus abdominis", "Deep belly corset", "The deepest abdominal muscle. Its horizontal fibres start on the last six ribs, the lower-back fascia and the iliac crest, and meet in the middle of the belly (linea alba).", "Compresses the belly like a belt. It barely moves the trunk but stiffens it.", "It stabilises the lower back even before you move an arm or a leg, and takes part in forced breathing out, coughing and bearing down.", "Hodges and Richardson (1996) showed that it contracts just before arm movements in pain-free people, and with a delay in people with low back pain."]], ["tricepsSural", ["calfraise", "mollet1", "molletsMachine", "alfredson", "skihop"], ["Triceps sural (mollet)", "Arrière de la jambe", "Les deux jumeaux (gastrocnémiens) partent du bas du fémur, le soléaire part du tibia et du péroné. Les trois se terminent sur le talon (calcanéus) par le tendon d’Achille.", "Pousse la pointe du pied vers le bas (flexion plantaire). Les jumeaux aident aussi à fléchir le genou.", "Il te propulse à chaque pas, en course et en saut, et te permet de tenir sur la pointe des pieds. Le soléaire, riche en fibres endurantes, travaille en continu pour te garder debout sans tomber vers l’avant.", "Le tendon d’Achille est le tendon le plus épais et le plus solide du corps. En course, il encaisse plusieurs fois le poids du corps à chaque foulée."], ["Triceps surae (calf)", "Back of the lower leg", "The two heads of the gastrocnemius start at the bottom of the femur, the soleus starts on the tibia and fibula. All three end on the heel bone (calcaneus) through the Achilles tendon.", "Points the foot down (plantar flexion). The gastrocnemius also helps flex the knee.", "It propels you at every step, when running and jumping, and lets you stand on tiptoe. The soleus, rich in endurance fibres, works constantly to keep you upright without falling forward.", "The Achilles tendon is the thickest and strongest tendon in the body. When running, it takes several times body weight at each stride."]], ["trapeze", ["shrugs", "facePull", "oiseau", "bandPullApart", "scap"], ["Trapèze", "Haut du dos et nuque", "De la base du crâne, du ligament de la nuque et des vertèbres de C7 à T12 jusqu’à la clavicule, à l’acromion et à l’épine de l’omoplate. On distingue trois faisceaux.", "Le faisceau supérieur élève l’omoplate, le moyen la rapproche de la colonne, l’inférieur l’abaisse. Le supérieur et l’inférieur la font aussi tourner vers le haut pour lever le bras au-dessus de la tête.", "Il porte tes sacs, maintient tes épaules en place et te permet de lever les bras au-dessus de la tête sans que l’épaule se coince.", "Quand on est stressé, on hausse souvent les épaules sans s’en rendre compte : le faisceau supérieur est alors contracté en permanence, ce qui peut entretenir des tensions de nuque."], ["Trapezius", "Upper back and neck", "From the base of the skull, the nuchal ligament and the vertebrae from C7 to T12 to the clavicle, the acromion and the spine of the scapula. It has three parts.", "The upper part lifts the shoulder blade, the middle part pulls it towards the spine, the lower part pulls it down. The upper and lower parts also rotate it upwards so you can raise the arm overhead.", "It carries your bags, holds your shoulders in place and lets you raise your arms overhead without the shoulder pinching.", "When stressed, people often shrug without noticing: the upper part then stays contracted, which can sustain neck tension."]], ["moyenFessier", ["lateral", "bandWalk", "hydrant", "planchelat", "abducteurs"], ["Moyen fessier", "Côté de la hanche", "De la face externe de l’os iliaque jusqu’au grand trochanter (la bosse osseuse sur le côté du haut du fémur).", "Écarte la cuisse sur le côté (abduction). Ses fibres avant font tourner la hanche vers l’intérieur.", "À chaque pas, quand tu es sur une seule jambe, il empêche ton bassin de tomber du côté de la jambe levée. Il est essentiel pour la course, les changements de direction et l’équilibre.", "Quand il est faible, le bassin bascule à chaque pas : c’est le signe de Trendelenburg. Cette faiblesse est souvent associée aux douleurs de genou chez les coureurs."], ["Gluteus medius", "Side of the hip", "From the outer surface of the ilium to the greater trochanter (the bony bump on the side of the upper femur).", "Moves the thigh out to the side (abduction). Its front fibres rotate the hip inwards.", "At every step, while you stand on one leg, it stops your pelvis from dropping towards the lifted leg. It is key for running, cutting and balance.", "When it is weak, the pelvis drops at each step: this is the Trendelenburg sign. This weakness is often linked to knee pain in runners."]], ["biceps", ["dbCurl", "ezCurl", "curlMarteau", "chinups", "rowPoulie"], ["Biceps brachial", "Avant du bras", "Deux chefs : le court part de l’apophyse coracoïde, le long d’un tubercule juste au-dessus de la cavité de l’épaule. Ils se terminent sur le radius (tubérosité radiale) et sur une expansion vers l’avant-bras.", "Fléchit le coude et tourne l’avant-bras paume vers le haut (supination). Il aide un peu à lever le bras vers l’avant.", "Il te sert à porter un sac, à te hisser et surtout à visser ou à tourner une clé, des gestes de supination.", "C’est le supinateur le plus puissant de l’avant-bras, ce qui explique pourquoi on visse plus fort qu’on ne dévisse quand on est droitier (avec une vis classique)."], ["Biceps brachii", "Front of the arm", "Two heads: the short head starts on the coracoid process, the long head on a tubercle just above the shoulder socket. They attach to the radius (radial tuberosity) and to an expansion into the forearm.", "Flexes the elbow and turns the forearm palm up (supination). It slightly helps raise the arm forward.", "You use it to carry a bag, pull yourself up and above all to drive a screw or turn a key, which are supination movements.", "It is the strongest supinator of the forearm, which is why right-handers screw in more strongly than they unscrew (with a standard screw)."]], ["oculomoteurs", [], ["Muscles oculomoteurs", "Autour de chaque œil", "Six muscles par œil (quatre droits et deux obliques), qui partent du fond de l’orbite et s’attachent sur le globe oculaire.", "Orientent l’œil dans toutes les directions et coordonnent les deux yeux.", "Ils te permettent de suivre une balle, de lire et de garder une image nette quand tu bouges la tête.", "Ils produisent les mouvements les plus rapides du corps : les saccades, ces sauts du regard que tu fais environ trois fois par seconde."], ["Extraocular muscles", "Around each eye", "Six muscles per eye (four recti and two obliques), starting at the back of the eye socket and attaching to the eyeball.", "Point the eye in every direction and coordinate both eyes.", "They let you follow a ball, read and keep a sharp image when you move your head.", "They make the fastest movements in the body: saccades, the jumps of gaze you make about three times per second."]], ["adducteurs", ["copenhague", "cossack", "lateral", "fenteLatTenue", "papillon"], ["Adducteurs", "Intérieur de la cuisse", "Un groupe de cinq muscles (long, court et grand adducteurs, pectiné, gracile) qui partent du pubis et de l’ischion et se terminent le long de l’arrière du fémur. Le gracile descend jusqu’au tibia.", "Rapprochent la cuisse de l’axe du corps (adduction). Selon la position de la hanche, ils aident aussi à la fléchir ou à l’étendre.", "Ils stabilisent le bassin à la marche, servent à frapper un ballon, à patiner et à changer de direction. Ils freinent aussi l’écartement des jambes lors d’une glissade.", "Les douleurs d’aine sont parmi les blessures les plus fréquentes au football. Le programme de Copenhague a réduit de 41 % les problèmes d’aine (Harøy et al., 2019)."], ["Adductors", "Inner thigh", "A group of five muscles (adductor longus, brevis and magnus, pectineus, gracilis) that start on the pubis and ischium and attach along the back of the femur. The gracilis reaches down to the tibia.", "Bring the thigh towards the midline (adduction). Depending on hip position, they also help flex or extend it.", "They stabilise the pelvis when walking, and are used to kick a ball, skate and change direction. They also brake the legs from splitting when you slip.", "Groin pain is among the most common injuries in football. The Copenhagen programme cut groin problems by 41% (Harøy et al., 2019)."]], ["obliques", ["russian", "planchelat", "poulieBucheron", "discWood", "twist"], ["Obliques", "Côtés du ventre", "L’oblique externe part des côtes basses et descend vers l’avant jusqu’à la crête iliaque et la ligne blanche. L’oblique interne, juste en dessous, a des fibres croisées dans l’autre sens.", "Font tourner le tronc et l’inclinent sur le côté. L’oblique externe tourne le buste du côté opposé, l’oblique interne du même côté : ils travaillent en équipe en diagonale.", "Ils transmettent la force des jambes vers les bras quand tu lances, frappes ou rames, et empêchent ton tronc de se tordre quand tu portes une charge d’un seul côté.", "Les fibres de l’oblique externe vont dans le même sens que tes doigts quand tu mets les mains dans les poches."], ["Obliques", "Sides of the belly", "The external oblique starts on the lower ribs and runs down and forward to the iliac crest and the linea alba. The internal oblique, just beneath, has fibres crossing the other way.", "Rotate and side-bend the trunk. The external oblique turns the trunk to the opposite side, the internal to the same side: they work as a diagonal team.", "They transfer force from the legs to the arms when you throw, strike or row, and stop your trunk from twisting when you carry a load on one side.", "The fibres of the external oblique run the same way as your fingers when you put your hands in your front pockets."]], ["triceps", ["dips", "poulieTriceps", "ezSkull", "pompesserrees", "militaire"], ["Triceps brachial", "Arrière du bras", "Trois chefs : le long part de l’omoplate juste sous la cavité de l’épaule, le latéral et le médial partent de l’arrière de l’humérus. Ils se terminent sur l’olécrane, la pointe du coude.", "Étend le coude. Le chef long, qui croise l’épaule, aide aussi à tirer le bras vers l’arrière.", "Il te sert à pousser : te relever d’un fauteuil avec les mains, faire des pompes, lancer, pousser une porte.", "Il représente environ deux tiers du volume musculaire du bras : pour avoir des bras plus épais, il compte plus que le biceps."], ["Triceps brachii", "Back of the arm", "Three heads: the long head starts on the shoulder blade just below the socket, the lateral and medial heads on the back of the humerus. They attach to the olecranon, the tip of the elbow.", "Extends the elbow. The long head, which crosses the shoulder, also helps pull the arm back.", "You use it to push: getting up from a chair with your hands, push-ups, throwing, pushing a door.", "It makes up about two thirds of the muscle volume of the upper arm: for thicker arms, it matters more than the biceps."]], ["psoas", ["kneeup", "climbers", "relevesJambes", "askip", "hundred"], ["Psoas-iliaque", "Profondeur de la hanche", "Le psoas part des côtés des vertèbres lombaires (T12 à L4), l’iliaque part de la face interne de l’os iliaque. Ils se rejoignent pour se terminer sur le petit trochanter, à l’intérieur du haut du fémur.", "C’est le fléchisseur de hanche le plus puissant : il monte la cuisse vers le ventre, ou ramène le buste vers les cuisses quand les jambes sont fixées.", "Il monte le genou à chaque pas de course, te permet de monter une marche et de te redresser quand tu es allongé.", "C’est le seul muscle qui relie directement les vertèbres lombaires au fémur : il fait le pont entre le tronc et la jambe."], ["Iliopsoas", "Deep in the hip", "The psoas starts on the sides of the lumbar vertebrae (T12 to L4), the iliacus on the inner surface of the ilium. They merge to attach to the lesser trochanter, on the inside of the upper femur.", "It is the strongest hip flexor: it lifts the thigh towards the belly, or brings the trunk towards the thighs when the legs are fixed.", "It drives the knee up at each running stride, lets you step up onto a stair and sit up when lying down.", "It is the only muscle that directly links the lumbar vertebrae to the femur, bridging the trunk and the leg."]], ["zygomatique", [], ["Grand zygomatique", "Joue", "De l’os zygomatique (la pommette) jusqu’au coin de la bouche.", "Tire le coin de la bouche vers le haut et l’extérieur.", "C’est le muscle du sourire.", "Les muscles du visage sont attachés à la peau et non à un os des deux côtés : c’est ce qui rend les expressions possibles."], ["Zygomaticus major", "Cheek", "From the zygomatic bone (cheekbone) to the corner of the mouth.", "Pulls the corner of the mouth up and out.", "It is the smiling muscle.", "Facial muscles attach to skin rather than to bone at both ends: that is what makes facial expressions possible."]], ["tibialAnt", ["ankles", "equilibre", "skater", "askip"], ["Tibial antérieur", "Avant de la jambe", "De la face externe du tibia jusqu’à l’intérieur du pied (premier cunéiforme et base du premier métatarsien).", "Relève la pointe du pied (flexion dorsale) et tourne la plante du pied vers l’intérieur (inversion).", "À la marche, il relève le pied pendant que la jambe passe vers l’avant pour que les orteils n’accrochent pas le sol. Il contrôle aussi la pose du pied après le contact du talon.", "Quand il est paralysé, le pied tombe et frotte le sol : c’est le « pied tombant ». Il est aussi en cause dans certaines douleurs à l’avant du tibia chez les coureurs débutants."], ["Tibialis anterior", "Front of the lower leg", "From the outer surface of the tibia to the inside of the foot (medial cuneiform and base of the first metatarsal).", "Lifts the front of the foot (dorsiflexion) and turns the sole inwards (inversion).", "When walking, it lifts the foot while the leg swings forward so the toes don’t catch the ground. It also controls foot placement after the heel strikes.", "When it is paralysed, the foot drops and drags: this is called “foot drop”. It is also involved in some pain at the front of the shin in beginner runners."]], ["coiffe", ["bandRotExt", "rotEpaule", "facePull", "oiseau", "armcircles"], ["Coiffe des rotateurs", "Autour de l’épaule", "Quatre muscles qui partent de l’omoplate (supra-épineux, infra-épineux, petit rond, subscapulaire) et entourent la tête de l’humérus comme une coiffe.", "Ils maintiennent la tête de l’humérus centrée dans sa cavité. Le supra-épineux aide à écarter le bras, l’infra-épineux et le petit rond le tournent vers l’extérieur, le subscapulaire vers l’intérieur.", "Ils rendent l’épaule stable alors que c’est l’articulation la plus mobile du corps : lancer, porter, faire des pompes ou nager en dépend.", "Les lésions de la coiffe, surtout du supra-épineux, sont une cause très fréquente de douleur d’épaule, et deviennent plus courantes avec l’âge."], ["Rotator cuff", "Around the shoulder", "Four muscles that start on the shoulder blade (supraspinatus, infraspinatus, teres minor, subscapularis) and wrap around the head of the humerus like a cuff.", "They keep the head of the humerus centred in its socket. The supraspinatus helps lift the arm sideways, the infraspinatus and teres minor rotate it outwards, the subscapularis inwards.", "They make the shoulder stable even though it is the most mobile joint in the body: throwing, carrying, push-ups and swimming depend on them.", "Rotator cuff tears, especially of the supraspinatus, are a very common cause of shoulder pain and become more frequent with age."]], ["erecteurs", ["superman", "bird", "souleveTerre", "rdl", "catcow"], ["Érecteurs du rachis", "Le long de la colonne", "Trois colonnes de muscles (ilio-costal, longissimus, épineux) qui longent la colonne du sacrum jusqu’aux côtes, aux vertèbres et à la base du crâne.", "Redressent et cambrent la colonne (extension) et l’inclinent sur le côté quand un seul côté travaille.", "Ils te maintiennent droit, et quand tu te penches pour soulever un objet, ils contrôlent la descente en s’allongeant, puis te redressent.", "Quand tu es complètement penché en avant, jambes tendues, ils se relâchent presque totalement et les ligaments prennent le relais : c’est le phénomène de flexion-relaxation."], ["Erector spinae", "Along the spine", "Three columns of muscle (iliocostalis, longissimus, spinalis) running along the spine from the sacrum to the ribs, the vertebrae and the base of the skull.", "Straighten and arch the spine (extension) and side-bend it when only one side works.", "They keep you upright, and when you bend over to lift something, they control the lowering by lengthening, then straighten you back up.", "When you are fully bent forward with straight legs, they almost switch off and the ligaments take over: this is the flexion-relaxation phenomenon."]], ["piriforme", ["figure4", "hip9090", "scorpion", "pont"], ["Piriforme (pyramidal)", "Profondeur de la fesse", "De la face avant du sacrum jusqu’au sommet du grand trochanter, en passant par la grande échancrure sciatique.", "Tourne la cuisse vers l’extérieur quand la hanche est tendue ; quand la hanche est fléchie, il aide plutôt à écarter la cuisse.", "Il stabilise la tête du fémur dans la hanche à la marche et en course, avec les autres petits rotateurs profonds.", "Le nerf sciatique passe juste sous lui, et parfois à travers lui : une tension de ce muscle peut irriter le nerf, c’est le syndrome du piriforme."], ["Piriformis", "Deep in the buttock", "From the front of the sacrum to the top of the greater trochanter, passing through the greater sciatic notch.", "Rotates the thigh outwards when the hip is straight; when the hip is flexed, it rather helps move the thigh out to the side.", "Together with the other small deep rotators, it holds the head of the femur in the hip when walking and running.", "The sciatic nerve runs just below it, and sometimes through it: tension in this muscle can irritate the nerve, known as piriformis syndrome."]], ["rhomboides", ["rowPoulie", "dbRow", "bandPullApart", "scap", "ezRow"], ["Rhomboïdes", "Entre les omoplates", "Des vertèbres de C7 à T5 jusqu’au bord interne de l’omoplate.", "Rapprochent l’omoplate de la colonne (rétraction) et la font tourner vers le bas.", "Ils tiennent tes épaules en arrière, stabilisent l’omoplate quand tu tires une charge vers toi et équilibrent l’action des pectoraux.", "Ils sont situés sous le trapèze : on ne les voit pas, mais un dos qui tire bien les omoplates en arrière en dépend en grande partie."], ["Rhomboids", "Between the shoulder blades", "From the vertebrae C7 to T5 to the inner border of the shoulder blade.", "Pull the shoulder blade towards the spine (retraction) and rotate it downwards.", "They hold your shoulders back, stabilise the shoulder blade when you pull a load towards you and balance the pull of the chest muscles.", "They lie under the trapezius: you can’t see them, but a back that pulls the shoulder blades back well relies on them heavily."]], ["tfl", ["lateral", "bandWalk", "skater", "legside"], ["Tenseur du fascia lata", "Avant et côté de la hanche", "De l’épine iliaque antéro-supérieure (la pointe osseuse à l’avant du bassin) jusqu’à la bandelette ilio-tibiale, qui descend le long de la cuisse jusqu’au tibia.", "Écarte la cuisse, aide à fléchir la hanche et à la tourner vers l’intérieur, et tend la bandelette ilio-tibiale.", "Avec le moyen fessier, il stabilise le bassin à la marche ; la bandelette qu’il tend stabilise aussi l’extérieur du genou.", "Le « syndrome de la bandelette ilio-tibiale » est une cause fréquente de douleur à l’extérieur du genou chez les coureurs et les cyclistes."], ["Tensor fasciae latae", "Front and side of the hip", "From the anterior superior iliac spine (the bony point at the front of the pelvis) to the iliotibial band, which runs down the thigh to the tibia.", "Moves the thigh out to the side, helps flex and internally rotate the hip, and tightens the iliotibial band.", "With the gluteus medius, it stabilises the pelvis when walking; the band it tightens also stabilises the outside of the knee.", "“Iliotibial band syndrome” is a common cause of pain on the outside of the knee in runners and cyclists."]], ["langue", [], ["Langue", "Bouche", "Un ensemble de muscles : les intrinsèques, entièrement dans la langue, et les extrinsèques, qui la relient à la mâchoire, à l’os hyoïde, au crâne et au palais.", "Les intrinsèques changent sa forme (allonger, aplatir, enrouler), les extrinsèques la déplacent (sortir, rentrer, monter, descendre).", "Elle est indispensable pour parler, mâcher, avaler et sentir les goûts.", "C’est un « hydrostat musculaire », comme une trompe d’éléphant : elle n’a pas d’os et bouge en déplaçant son propre volume. L’idée que ce serait le muscle le plus fort du corps est un mythe."], ["Tongue", "Mouth", "A group of muscles: the intrinsic ones, entirely within the tongue, and the extrinsic ones, linking it to the jaw, hyoid bone, skull and palate.", "The intrinsic muscles change its shape (lengthen, flatten, curl), the extrinsic ones move it (out, in, up, down).", "It is essential for speaking, chewing, swallowing and tasting.", "It is a “muscular hydrostat”, like an elephant’s trunk: it has no bone and moves by shifting its own volume. The idea that it is the strongest muscle in the body is a myth."]], ["dentele", ["scap", "pompes", "planche", "burpees", "pike"], ["Dentelé antérieur", "Côtés de la cage thoracique", "Des 8 ou 9 premières côtes, par des digitations en forme de dents, jusqu’au bord interne de l’omoplate, en passant sous celle-ci.", "Écarte l’omoplate vers l’avant (protraction) et la fait tourner vers le haut. Il plaque l’omoplate contre le thorax.", "Il te permet de pousser devant toi, de donner un coup de poing et de lever le bras au-dessus de la tête. Les boxeurs l’ont souvent très développé.", "Quand son nerf (le nerf thoracique long) est lésé, l’omoplate se décolle du dos comme une aile : c’est la scapula alata, ou omoplate ailée."], ["Serratus anterior", "Sides of the rib cage", "From the first 8 or 9 ribs, through tooth-like slips, to the inner border of the shoulder blade, passing underneath it.", "Moves the shoulder blade forward (protraction) and rotates it upwards. It presses the shoulder blade against the chest wall.", "It lets you push things in front of you, throw a punch and raise the arm overhead. Boxers often have it very developed.", "When its nerve (the long thoracic nerve) is injured, the shoulder blade sticks out like a wing: this is called a winged scapula."]], ["diaphragme", ["hundred", "catcow", "deadbug", "enfant"], ["Diaphragme", "Entre le thorax et l’abdomen", "Un muscle en forme de dôme qui part du bas du sternum, des six dernières côtes et des vertèbres lombaires (par ses piliers), et se termine sur un tendon central.", "En se contractant, il s’aplatit et descend : le volume du thorax augmente et l’air entre dans les poumons. Au repos, l’expiration se fait passivement quand il se relâche.", "C’est le principal muscle de la respiration. Il participe aussi à la stabilité du tronc en augmentant la pression dans l’abdomen, avec les abdominaux et le plancher pelvien.", "Il se contracte environ 20 000 fois par jour sans que tu y penses, mais c’est l’un des rares muscles vitaux que tu peux aussi commander volontairement : c’est la base de la cohérence cardiaque."], ["Diaphragm", "Between chest and abdomen", "A dome-shaped muscle that starts on the bottom of the sternum, the last six ribs and the lumbar vertebrae (through its crura), and ends on a central tendon.", "When it contracts, it flattens and moves down: chest volume increases and air flows into the lungs. At rest, breathing out happens passively as it relaxes.", "It is the main breathing muscle. It also helps stabilise the trunk by raising pressure inside the abdomen, together with the abs and the pelvic floor.", "It contracts about 20,000 times a day without you thinking about it, yet it is one of the few vital muscles you can also control at will: this is the basis of coherent breathing."]], ["piedIntrinseque", ["equilibre", "calfraise", "ankles", "mollet1"], ["Muscles intrinsèques du pied", "Plante du pied", "Une vingtaine de petits muscles qui naissent et se terminent dans le pied lui-même, organisés en plusieurs couches sous la voûte plantaire.", "Bougent les orteils (les fléchir, les écarter) et surtout soutiennent la voûte plantaire.", "Ils ajustent en permanence l’équilibre quand tu es debout, et rendent le pied rigide au moment de la poussée en marche et en course.", "Le pied contient 26 os et 33 articulations : ces petits muscles sont la base du travail d’équilibre après une entorse de cheville."], ["Intrinsic foot muscles", "Sole of the foot", "About twenty small muscles that start and end within the foot itself, arranged in several layers under the arch.", "Move the toes (flex and spread them) and above all support the arch.", "They constantly fine-tune your balance when standing, and stiffen the foot for push-off when walking and running.", "The foot has 26 bones and 33 joints: these small muscles are the basis of balance training after an ankle sprain."]], ["brachial", ["curlMarteau", "dbCurl", "ezCurl", "chinups", "tractions"], ["Brachial", "Avant du bras, sous le biceps", "De la moitié basse de l’avant de l’humérus jusqu’à l’ulna (processus coronoïde et tubérosité ulnaire).", "Fléchit le coude, quelle que soit la position de la main, paume en haut, en bas ou de côté.", "C’est le vrai « moteur » de la flexion du coude dans la vie courante : porter, tirer, approcher un objet de toi.", "Comme il s’attache sur l’ulna, qui ne tourne pas, il garde toute sa force paume vers le bas, contrairement au biceps : c’est pour cela que le curl marteau le sollicite beaucoup."], ["Brachialis", "Front of the arm, under the biceps", "From the lower half of the front of the humerus to the ulna (coronoid process and ulnar tuberosity).", "Flexes the elbow whatever the hand position: palm up, down or sideways.", "It is the real “engine” of elbow flexion in daily life: carrying, pulling, bringing an object towards you.", "Because it attaches to the ulna, which does not rotate, it keeps its full strength palm down, unlike the biceps: that is why hammer curls work it so much."]], ["droitFemoral", ["squat", "fente", "legExt", "kneeup", "quadDebout"], ["Droit fémoral", "Milieu de l’avant de la cuisse", "Le seul chef du quadriceps qui part du bassin : de l’épine iliaque antéro-inférieure et du bord du cotyle jusqu’à la rotule, puis au tibia par le tendon rotulien.", "Étend le genou et fléchit la hanche, car il croise les deux articulations.", "Il est très sollicité pour frapper un ballon, sprinter et sauter, des gestes qui combinent flexion de hanche et extension de genou.", "C’est le chef du quadriceps qui se blesse le plus souvent, notamment chez les footballeurs, au moment de la frappe."], ["Rectus femoris", "Middle of the front thigh", "The only quadriceps head that starts on the pelvis: from the anterior inferior iliac spine and the rim of the hip socket to the kneecap, then to the tibia through the patellar tendon.", "Extends the knee and flexes the hip, because it crosses both joints.", "It works hard when kicking a ball, sprinting and jumping, movements that combine hip flexion and knee extension.", "It is the quadriceps head most often injured, especially in footballers at the moment of kicking."]], ["larynx", [], ["Muscles du larynx", "Gorge, au niveau de la pomme d’Adam", "De petits muscles (crico-thyroïdien, thyro-aryténoïdien, crico-aryténoïdiens…) tendus entre les cartilages du larynx.", "Ouvrent et ferment les cordes vocales, et règlent leur tension.", "Ils produisent la voix, ajustent sa hauteur, et ferment les voies respiratoires quand tu avales ou fais un effort.", "En parlant, les cordes vocales vibrent environ 100 fois par seconde chez l’homme et 200 fois chez la femme."], ["Laryngeal muscles", "Throat, at the Adam’s apple", "Small muscles (cricothyroid, thyroarytenoid, cricoarytenoids…) stretched between the cartilages of the larynx.", "Open and close the vocal folds and set their tension.", "They produce the voice, adjust its pitch, and close the airway when you swallow or strain.", "When speaking, the vocal folds vibrate about 100 times per second in men and 200 times in women."]], ["extPoignet", ["poignetExc", "poignets", "dbRow", "tractions"], ["Extenseurs du poignet", "Dessus de l’avant-bras", "Plusieurs muscles (court et long extenseurs radiaux du carpe, extenseur ulnaire du carpe) qui partent surtout de l’épicondyle latéral, la bosse externe du coude, et se terminent sur les os de la main.", "Relèvent le poignet (extension) et l’inclinent sur le côté.", "Ils stabilisent le poignet chaque fois que tu serres quelque chose : sans eux, serrer le poing ferait fléchir le poignet et la prise serait faible.", "Le « tennis-elbow » (épicondylite latérale) touche surtout le tendon du court extenseur radial du carpe, et la grande majorité des personnes touchées ne jouent pas au tennis : les gestes répétés de préhension au travail en sont une cause fréquente."], ["Wrist extensors", "Top of the forearm", "Several muscles (extensor carpi radialis brevis and longus, extensor carpi ulnaris) that start mainly on the lateral epicondyle, the outer bump of the elbow, and attach to the bones of the hand.", "Lift the wrist (extension) and tilt it sideways.", "They stabilise the wrist whenever you grip something: without them, making a fist would bend the wrist and the grip would be weak.", "“Tennis elbow” (lateral epicondylitis) mainly affects the tendon of the extensor carpi radialis brevis, and most people who get it don’t play tennis: repeated gripping at work is a common cause."]], ["planchPelvien", ["pont", "deadbug", "hundred", "bird"], ["Plancher pelvien", "Fond du bassin", "Un hamac de muscles (surtout le releveur de l’anus) tendu entre le pubis, le coccyx et les côtés du bassin.", "Soutient les organes du bassin, ferme les orifices (continence) et se contracte en réflexe quand la pression monte dans l’abdomen.", "Il travaille à chaque toux, éternuement, saut ou charge soulevée, en équipe avec le diaphragme et le transverse.", "Il concerne aussi les hommes : son renforcement aide par exemple à retrouver la continence après une opération de la prostate."], ["Pelvic floor", "Base of the pelvis", "A hammock of muscles (mainly the levator ani) stretched between the pubis, the coccyx and the sides of the pelvis.", "Supports the pelvic organs, closes the openings (continence) and contracts reflexively when pressure rises in the abdomen.", "It works with every cough, sneeze, jump or lift, as a team with the diaphragm and the transversus abdominis.", "It matters for men too: training it helps, for example, to regain continence after prostate surgery."]], ["vasteMedial", ["squat", "legExt", "chaise", "fente", "presseCuisses"], ["Vaste médial", "Intérieur du genou, au-dessus de la rotule", "De la face interne du fémur (ligne âpre) jusqu’au bord interne de la rotule et au tendon du quadriceps. Ses fibres basses, très obliques, forment une « goutte » au-dessus du genou.", "Étend le genou avec le reste du quadriceps ; ses fibres obliques tirent la rotule vers l’intérieur.", "Il aide à garder la rotule bien centrée dans son rail quand tu te relèves, montes des marches ou atterris d’un saut.", "Il fond très vite après une blessure ou une opération du genou : c’est souvent le premier muscle que les kinés font retravailler."], ["Vastus medialis", "Inside of the knee, above the kneecap", "From the inner femur (linea aspera) to the inner edge of the kneecap and the quadriceps tendon. Its lower, very oblique fibres form a “teardrop” above the knee.", "Extends the knee with the rest of the quadriceps; its oblique fibres pull the kneecap inwards.", "It helps keep the kneecap centred in its groove when you stand up, climb stairs or land from a jump.", "It wastes away very quickly after a knee injury or surgery: it is often the first muscle physios retrain."]], ["elevateurScap", ["shrugs", "nuqueLat", "armcircles", "scap"], ["Élévateur de la scapula", "Côté et arrière du cou", "Des apophyses transverses des vertèbres C1 à C4 jusqu’à l’angle supérieur de l’omoplate.", "Soulève l’omoplate et la fait tourner vers le bas ; incline le cou du même côté.", "Il soulève tes épaules quand tu portes un sac et stabilise le cou.", "C’est l’un des points de tension les plus fréquents chez les personnes qui travaillent longtemps devant un écran."], ["Levator scapulae", "Side and back of the neck", "From the transverse processes of vertebrae C1 to C4 to the upper corner of the shoulder blade.", "Lifts the shoulder blade and rotates it downwards; side-bends the neck.", "It raises your shoulders when you carry a bag and stabilises the neck.", "It is one of the most common tension spots in people who spend long hours at a screen."]], ["vasteLateral", ["squat", "fente", "presseCuisses", "legExt", "skater"], ["Vaste latéral", "Extérieur de la cuisse", "Du grand trochanter et de la ligne âpre du fémur jusqu’au bord externe de la rotule et au tendon du quadriceps.", "Étend le genou ; c’est le plus volumineux des quatre chefs du quadriceps.", "Il fournit une grande partie de la force pour te relever, pédaler, monter et sauter.", "C’est le muscle le plus utilisé pour les biopsies en recherche sur le sport : on y prélève un minuscule fragment pour étudier les fibres musculaires."], ["Vastus lateralis", "Outer thigh", "From the greater trochanter and the linea aspera of the femur to the outer edge of the kneecap and the quadriceps tendon.", "Extends the knee; it is the largest of the four quadriceps heads.", "It supplies much of the force to stand up, pedal, climb and jump.", "It is the muscle most used for biopsies in sports research: a tiny sample is taken to study muscle fibres."]], ["orbiculaireOeil", [], ["Orbiculaire de l’œil", "Autour des yeux", "Un anneau de muscle autour de l’œil, dans les paupières et autour de l’orbite.", "Ferme les paupières, doucement pour cligner, fortement pour plisser les yeux.", "Il protège et humidifie l’œil en clignant environ 15 à 20 fois par minute.", "C’est lui qui distingue un vrai sourire : le « sourire de Duchenne » plisse les yeux, un sourire forcé ne bouge souvent que la bouche."], ["Orbicularis oculi", "Around the eyes", "A ring of muscle around the eye, in the eyelids and around the eye socket.", "Closes the eyelids, gently to blink, strongly to squint.", "It protects and moistens the eye by blinking about 15 to 20 times a minute.", "It is what marks a genuine smile: the “Duchenne smile” crinkles the eyes, a forced smile often moves only the mouth."]], ["soleaire", ["calfraise", "molletsMachine", "alfredson", "soleaire", "chaise"], ["Soléaire", "Mollet, sous les jumeaux", "De la tête du péroné et du haut de l’arrière du tibia jusqu’au talon, par le tendon d’Achille.", "Pousse la pointe du pied vers le bas (flexion plantaire), quelle que soit la position du genou, car il ne croise pas le genou.", "C’est un muscle postural : debout, il travaille en continu pour t’empêcher de basculer vers l’avant. Il est aussi très sollicité en course lente et en endurance.", "On l’appelle parfois le « deuxième cœur » : en se contractant, il chasse le sang des veines de la jambe vers le haut. C’est pour cela que bouger les pieds en avion limite le risque de phlébite."], ["Soleus", "Calf, beneath the gastrocnemius", "From the head of the fibula and the upper back of the tibia to the heel, through the Achilles tendon.", "Points the foot down (plantar flexion) whatever the knee position, because it does not cross the knee.", "It is a postural muscle: when standing, it works constantly to stop you tipping forward. It also works hard in slow running and endurance.", "It is sometimes called the “second heart”: when it contracts, it pushes blood in the leg veins upwards. That is why moving your feet on a plane lowers the risk of blood clots."]], ["grandRond", ["tractions", "poulieTirage", "pullover", "dbRow"], ["Grand rond", "Bas de l’omoplate", "De l’angle inférieur de l’omoplate jusqu’à l’avant de l’humérus, à côté du grand dorsal.", "Tire le bras vers le bas et l’arrière et le tourne vers l’intérieur.", "Il aide le grand dorsal dans les tractions, le rameur et la nage ; on le surnomme le « petit aide du grand dorsal ».", "Il forme avec le petit rond et le triceps des passages (espaces axillaires) où circulent des nerfs et des vaisseaux de l’épaule."], ["Teres major", "Lower shoulder blade", "From the lower corner of the shoulder blade to the front of the humerus, next to the latissimus dorsi.", "Pulls the arm down and back and rotates it inwards.", "It helps the latissimus in pull-ups, rowing and swimming; it is nicknamed the “lat’s little helper”.", "With the teres minor and the triceps, it forms passages (axillary spaces) through which shoulder nerves and vessels run."]], ["carreLombes", ["planchelat", "bird", "superman", "lateralDebout"], ["Carré des lombes", "Bas du dos, sur les côtés", "De la crête iliaque jusqu’à la 12e côte et aux apophyses transverses des vertèbres L1 à L4.", "Incline le tronc sur le côté, remonte la hanche du même côté et stabilise la 12e côte quand tu inspires.", "Il stabilise le bas du dos quand tu portes une charge d’un seul côté ou que tu marches.", "Le chercheur Stuart McGill a montré que la planche latérale le fait travailler fortement sans trop charger la colonne."], ["Quadratus lumborum", "Sides of the lower back", "From the iliac crest to the 12th rib and the transverse processes of vertebrae L1 to L4.", "Side-bends the trunk, hikes the hip on the same side and steadies the 12th rib when you breathe in.", "It stabilises the lower back when you carry a load on one side or walk.", "Researcher Stuart McGill showed that the side plank works it hard without loading the spine much."]], ["gastrocnemien", ["calfraise", "mollet1", "skihop", "squatsaute", "molletMur"], ["Gastrocnémien (jumeaux)", "Relief du mollet", "Deux chefs qui partent de l’arrière des condyles du fémur, juste au-dessus du genou, et se terminent sur le talon par le tendon d’Achille.", "Pousse la pointe du pied vers le bas et aide à fléchir le genou. Il est surtout efficace genou tendu.", "Riche en fibres rapides, il fournit la poussée explosive des sauts et des sprints.", "La déchirure du jumeau interne, souvent lors d’une accélération, s’appelle le « tennis leg » parce qu’elle est classique chez les joueurs de tennis."], ["Gastrocnemius", "Bulge of the calf", "Two heads that start on the back of the femoral condyles, just above the knee, and end on the heel through the Achilles tendon.", "Points the foot down and helps flex the knee. It is most effective with the knee straight.", "Rich in fast fibres, it provides the explosive push of jumps and sprints.", "A tear of its inner head, often when accelerating, is called “tennis leg” because it is classic in tennis players."]], ["petitPectoral", ["bandPullApart", "scap", "murPecs", "armcross"], ["Petit pectoral", "Sous le grand pectoral", "Des 3e, 4e et 5e côtes jusqu’à l’apophyse coracoïde, une petite saillie de l’omoplate sous la clavicule.", "Abaisse l’omoplate et la bascule vers l’avant ; il soulève les côtes lors d’une inspiration forcée.", "Il stabilise l’omoplate quand tu pousses vers le bas, par exemple pour te relever d’une chaise avec les bras.", "Quand il est raccourci, il enroule les épaules vers l’avant ; les nerfs et vaisseaux du bras passent juste dessous."], ["Pectoralis minor", "Beneath the pectoralis major", "From the 3rd, 4th and 5th ribs to the coracoid process, a small projection of the shoulder blade below the clavicle.", "Pulls the shoulder blade down and tips it forward; lifts the ribs during forced breathing in.", "It stabilises the shoulder blade when you push down, for example to get up from a chair with your arms.", "When shortened, it rounds the shoulders forward; the arm’s nerves and vessels pass just underneath it."]], ["temporal", [], ["Temporal", "Tempe", "D’une large zone du côté du crâne (fosse temporale) jusqu’à l’apophyse coronoïde de la mâchoire, en passant sous la pommette.", "Ferme la bouche et ramène la mâchoire vers l’arrière.", "Il travaille avec le masséter pour mâcher et serrer les dents.", "Pose les doigts sur tes tempes et serre les dents : tu le sens se gonfler."], ["Temporalis", "Temple", "From a wide area on the side of the skull (temporal fossa) to the coronoid process of the jaw, passing under the cheekbone.", "Closes the mouth and pulls the jaw backwards.", "It works with the masseter to chew and clench your teeth.", "Put your fingers on your temples and clench your teeth: you can feel it bulge."]], ["bicepsFemoral", ["rdl", "legCurl", "pont", "extender", "dbRDL"], ["Biceps fémoral", "Arrière et extérieur de la cuisse", "Le chef long part de l’ischion, le chef court de la ligne âpre du fémur. Ils se terminent sur la tête du péroné, à l’extérieur du genou.", "Fléchit le genou et le tourne vers l’extérieur quand il est fléchi ; le chef long étend aussi la hanche.", "Il freine la jambe en fin de foulée et participe à l’extension de hanche quand tu sprintes ou sautes.", "Son chef long est l’ischio-jambier le plus souvent blessé en sprint : il est étiré au maximum juste avant que le pied touche le sol."], ["Biceps femoris", "Back and outside of the thigh", "The long head starts on the ischial tuberosity, the short head on the linea aspera of the femur. They attach to the head of the fibula, on the outside of the knee.", "Flexes the knee and rotates it outwards when bent; the long head also extends the hip.", "It brakes the leg at the end of the swing and helps extend the hip when you sprint or jump.", "Its long head is the hamstring most often injured in sprinting: it is stretched to the maximum just before the foot strikes the ground."]], ["subclavier", ["armcircles", "scap", "shrugs"], ["Subclavier", "Sous la clavicule", "De la première côte jusqu’à la face inférieure de la clavicule.", "Abaisse la clavicule et la plaque contre le sternum.", "Il stabilise l’articulation entre la clavicule et le sternum pendant les mouvements du bras.", "En cas de fracture de la clavicule, il forme un coussin qui protège les gros vaisseaux situés juste en dessous."], ["Subclavius", "Below the clavicle", "From the first rib to the underside of the clavicle.", "Pulls the clavicle down and holds it against the sternum.", "It steadies the joint between the clavicle and the sternum during arm movements.", "If the clavicle breaks, it acts as a cushion that protects the large vessels lying just beneath."]], ["multifides", ["bird", "superman", "deadbug", "catcow"], ["Multifides", "Le long de la colonne, en profondeur", "De petits faisceaux qui vont du sacrum jusqu’à la 2e vertèbre cervicale, chacun enjambant deux à quatre vertèbres.", "Contrôlent les vertèbres une à une, freinent la flexion et la rotation, et participent à l’extension.", "Ils assurent la stabilité fine de la colonne à chaque mouvement du tronc.", "Hides et ses collègues (1996, 2001) ont montré qu’ils s’atrophient après un premier épisode de mal de dos et ne récupèrent pas seuls ; des exercices ciblés réduisent les récidives."], ["Multifidus", "Deep along the spine", "Small bundles running from the sacrum to the 2nd cervical vertebra, each spanning two to four vertebrae.", "Control the vertebrae one by one, brake flexion and rotation, and help with extension.", "They provide fine stability of the spine with every trunk movement.", "Hides and colleagues (1996, 2001) showed they shrink after a first episode of low back pain and don’t recover on their own; targeted exercise reduces recurrences."]], ["semiTendineux", ["legCurl", "rdl", "pont", "ischioCouche", "souleveTerre"], ["Semi-tendineux", "Arrière et intérieur de la cuisse", "De l’ischion jusqu’à la face interne du haut du tibia, par un long tendon qui fait partie de la « patte d’oie ».", "Fléchit le genou, le tourne vers l’intérieur et étend la hanche.", "Il stabilise l’intérieur du genou et participe aux changements de direction et à la course.", "Son tendon est souvent prélevé pour reconstruire le ligament croisé antérieur. Il peut ensuite se reformer en partie."], ["Semitendinosus", "Back and inside of the thigh", "From the ischial tuberosity to the inner upper tibia, through a long tendon that is part of the “pes anserinus”.", "Flexes the knee, rotates it inwards and extends the hip.", "It stabilises the inside of the knee and helps with cutting and running.", "Its tendon is often harvested to rebuild the anterior cruciate ligament. It can then partly regrow."]], ["supraEpineux", ["dbLateral", "bandRotExt", "armcircles", "rotEpaule"], ["Supra-épineux", "Au-dessus de l’omoplate", "De la fosse au-dessus de l’épine de l’omoplate jusqu’au sommet de la grosse tubérosité de l’humérus, en passant sous l’acromion.", "Aide le deltoïde à écarter le bras et plaque la tête de l’humérus dans sa cavité.", "Il travaille dès que tu lèves le bras sur le côté, pour attraper, lancer ou porter.", "C’est le tendon de la coiffe le plus souvent abîmé, car il passe dans un tunnel étroit sous l’acromion."], ["Supraspinatus", "Above the shoulder blade", "From the hollow above the spine of the shoulder blade to the top of the greater tubercle of the humerus, passing under the acromion.", "Helps the deltoid lift the arm sideways and presses the head of the humerus into its socket.", "It works as soon as you raise your arm to the side, to reach, throw or carry.", "It is the most frequently damaged rotator cuff tendon, because it runs through a narrow tunnel under the acromion."]], ["stapedien", [], ["Stapédien", "Oreille moyenne", "Il part de la paroi de l’oreille moyenne et s’attache sur l’étrier, le plus petit os du corps.", "En se contractant, il freine l’étrier et atténue la transmission des sons forts.", "Il protège en partie l’oreille interne des bruits intenses par un réflexe automatique.", "C’est le plus petit muscle squelettique du corps : environ un millimètre. Quand il est paralysé, les sons paraissent anormalement forts."], ["Stapedius", "Middle ear", "It starts on the wall of the middle ear and attaches to the stirrup, the smallest bone in the body.", "When it contracts, it damps the stirrup and reduces the transmission of loud sounds.", "It partly protects the inner ear from loud noise through an automatic reflex.", "It is the smallest skeletal muscle in the body: about one millimetre. When it is paralysed, sounds seem abnormally loud."]], ["semiMembraneux", ["legCurl", "rdl", "pont", "souleveTerre", "extender"], ["Semi-membraneux", "Arrière et intérieur de la cuisse, en profondeur", "De l’ischion jusqu’à l’arrière du plateau interne du tibia, avec des expansions vers la capsule du genou.", "Fléchit le genou, le tourne vers l’intérieur et étend la hanche.", "En plus de bouger le genou, il tend la capsule arrière et tire le ménisque interne vers l’arrière pendant la flexion, ce qui le protège d’un pincement.", "C’est le plus profond et souvent le plus puissant des trois ischio-jambiers."], ["Semimembranosus", "Deep back and inside of the thigh", "From the ischial tuberosity to the back of the inner tibial plateau, with expansions to the knee capsule.", "Flexes the knee, rotates it inwards and extends the hip.", "Besides moving the knee, it tightens the back of the capsule and pulls the inner meniscus back during flexion, protecting it from being pinched.", "It is the deepest and often the strongest of the three hamstrings."]], ["intercostaux", ["hundred", "catcow", "openbook", "thread"], ["Intercostaux", "Entre les côtes", "Trois couches de muscles (externes, internes, intimes) tendues dans chacun des 11 espaces entre les côtes.", "Les intercostaux externes soulèvent les côtes à l’inspiration, les internes les abaissent lors de l’expiration forcée.", "Ils rigidifient la cage thoracique et aident le diaphragme à respirer, surtout à l’effort.", "Leurs fibres sont croisées : les externes descendent vers l’avant, les internes vers l’arrière, comme les obliques de l’abdomen."], ["Intercostals", "Between the ribs", "Three layers of muscle (external, internal, innermost) stretched across each of the 11 spaces between the ribs.", "The external intercostals lift the ribs when breathing in, the internal ones lower them when breathing out forcefully.", "They stiffen the rib cage and help the diaphragm breathe, especially during effort.", "Their fibres cross: the externals run down and forward, the internals down and back, like the abdominal obliques."]], ["infraEpineux", ["bandRotExt", "facePull", "oiseau", "rotEpaule"], ["Infra-épineux", "Arrière de l’omoplate", "De la fosse sous l’épine de l’omoplate jusqu’au milieu de la grosse tubérosité de l’humérus.", "C’est le principal rotateur externe de l’épaule ; il empêche aussi la tête de l’humérus de glisser vers l’arrière.", "Il freine le bras après un lancer, un smash ou un service, et te permet de te coiffer ou de te gratter la nuque.", "Chez les lanceurs et les volleyeurs, il peut s’atrophier à cause d’une compression de son nerf, parfois sans aucune douleur."], ["Infraspinatus", "Back of the shoulder blade", "From the hollow below the spine of the shoulder blade to the middle of the greater tubercle of the humerus.", "It is the main external rotator of the shoulder; it also stops the head of the humerus sliding backwards.", "It brakes the arm after a throw, a smash or a serve, and lets you comb your hair or scratch the back of your neck.", "In throwers and volleyball players, it can waste away from compression of its nerve, sometimes with no pain at all."]], ["grandAdducteur", ["cossack", "sumo", "squat", "copenhague", "lateral"], ["Grand adducteur", "Intérieur de la cuisse, en profondeur", "Des branches du pubis et de l’ischion jusqu’à toute la longueur de la ligne âpre du fémur et au tubercule de l’adducteur, juste au-dessus du genou.", "Rapproche la cuisse ; sa partie arrière, qui part de l’ischion, étend aussi la hanche comme un ischio-jambier.", "Il est très sollicité dans les squats profonds, la montée d’escaliers et les mouvements de jambes écartées.", "Il est percé d’un passage, le hiatus de l’adducteur, par lequel l’artère et la veine fémorales passent derrière le genou."], ["Adductor magnus", "Deep inner thigh", "From the pubic and ischial rami to the whole length of the linea aspera of the femur and the adductor tubercle, just above the knee.", "Brings the thigh in; its back part, starting on the ischial tuberosity, also extends the hip like a hamstring.", "It works hard in deep squats, stair climbing and wide-legged movements.", "It has an opening, the adductor hiatus, through which the femoral artery and vein pass behind the knee."]], ["ciliaire", [], ["Muscle ciliaire", "À l’intérieur de l’œil", "Un anneau de muscle lisse situé derrière l’iris, relié au cristallin par de fins ligaments.", "En se contractant, il détend les ligaments et laisse le cristallin s’arrondir pour voir de près (accommodation).", "Il fait la mise au point quand tu lis ou regardes ton téléphone.", "Avec l’âge, c’est surtout le cristallin qui durcit : vers 45 ans, la mise au point de près devient difficile, c’est la presbytie."], ["Ciliary muscle", "Inside the eye", "A ring of smooth muscle behind the iris, linked to the lens by fine ligaments.", "When it contracts, it slackens the ligaments and lets the lens round up for near vision (accommodation).", "It focuses your eyes when you read or look at your phone.", "With age, it is mainly the lens that stiffens: around 45, focusing up close becomes hard, which is presbyopia."]], ["petitRond", ["bandRotExt", "facePull", "oiseau"], ["Petit rond", "Bord externe de l’omoplate", "Du bord externe de l’omoplate jusqu’au bas de la grosse tubérosité de l’humérus.", "Tourne le bras vers l’extérieur, avec l’infra-épineux, et stabilise l’épaule.", "Il participe à tous les gestes où la main part vers l’extérieur ou vers l’arrière de la tête.", "Contrairement aux autres muscles de la coiffe, il est innervé par le nerf axillaire, le même que le deltoïde."], ["Teres minor", "Outer border of the shoulder blade", "From the outer border of the shoulder blade to the lower part of the greater tubercle of the humerus.", "Rotates the arm outwards, with the infraspinatus, and stabilises the shoulder.", "It is involved whenever the hand moves outwards or behind the head.", "Unlike the other cuff muscles, it is supplied by the axillary nerve, the same as the deltoid."]], ["longAdducteur", ["copenhague", "cossack", "fenteLatTenue", "lateral", "papillon"], ["Long adducteur", "Intérieur du haut de la cuisse", "Du corps du pubis jusqu’au tiers moyen de la ligne âpre du fémur.", "Rapproche la cuisse et aide à fléchir la hanche.", "Il sert à frapper un ballon de l’intérieur du pied, à patiner et à changer brusquement de direction.", "C’est l’adducteur le plus souvent blessé chez les footballeurs. Son bord forme une limite du triangle fémoral, où l’on prend le pouls à l’aine."], ["Adductor longus", "Inner upper thigh", "From the body of the pubis to the middle third of the linea aspera of the femur.", "Brings the thigh in and helps flex the hip.", "You use it to kick a ball with the inside of the foot, skate and change direction sharply.", "It is the adductor most often injured in footballers. Its border forms one edge of the femoral triangle, where the pulse is felt in the groin."]], ["scalenes", ["nuqueLat", "nuqueIso", "grandissement"], ["Scalènes", "Côtés du cou, en profondeur", "Trois muscles (antérieur, moyen, postérieur) qui partent des vertèbres cervicales et descendent jusqu’aux deux premières côtes.", "Soulèvent les deux premières côtes à l’inspiration et inclinent le cou sur le côté.", "Ils participent à chaque respiration, même au repos, et beaucoup plus quand tu es essoufflé.", "Les nerfs du bras passent entre le scalène antérieur et le moyen : une compression à cet endroit donne des fourmillements dans la main."], ["Scalenes", "Deep sides of the neck", "Three muscles (anterior, middle, posterior) that start on the neck vertebrae and run down to the first two ribs.", "Lift the first two ribs when breathing in and side-bend the neck.", "They take part in every breath, even at rest, and much more when you are out of breath.", "The nerves to the arm pass between the anterior and middle scalenes: compression there causes tingling in the hand."]], ["subscapulaire", ["pompes", "crossover", "pecDeck", "rotEpaule"], ["Subscapulaire", "Face avant de l’omoplate", "De toute la face avant de l’omoplate, collée aux côtes, jusqu’à la petite tubérosité de l’humérus.", "Tourne le bras vers l’intérieur et empêche la tête de l’humérus de glisser vers l’avant.", "Il te permet de mettre la main dans le dos, de lancer et de pousser ; c’est un gardien de la stabilité avant de l’épaule.", "C’est le muscle le plus gros et le plus puissant de la coiffe des rotateurs."], ["Subscapularis", "Front surface of the shoulder blade", "From the whole front surface of the shoulder blade, lying against the ribs, to the lesser tubercle of the humerus.", "Rotates the arm inwards and stops the head of the humerus sliding forward.", "It lets you reach behind your back, throw and push; it guards the front stability of the shoulder.", "It is the largest and strongest muscle of the rotator cuff."]], ["pectine", ["papillon", "cossack", "kneeup", "lateral"], ["Pectiné", "Haut de l’intérieur de la cuisse", "De la ligne pectinée du pubis jusqu’à la ligne pectinée du fémur, juste sous le petit trochanter.", "Rapproche la cuisse et fléchit la hanche.", "Il participe à la marche, à la montée du genou et à la stabilité de la hanche.", "Il est souvent innervé par deux nerfs à la fois (fémoral et obturateur), un vestige de sa double origine embryonnaire."], ["Pectineus", "Upper inner thigh", "From the pectineal line of the pubis to the pectineal line of the femur, just below the lesser trochanter.", "Brings the thigh in and flexes the hip.", "It contributes to walking, knee drive and hip stability.", "It is often supplied by two nerves at once (femoral and obturator), a remnant of its double embryonic origin."]], ["frontal", [], ["Frontal", "Front", "Relié à l’arrière du crâne par une large membrane (l’aponévrose épicrânienne), il descend jusqu’à la peau des sourcils.", "Lève les sourcils et plisse le front horizontalement.", "Il sert à exprimer la surprise ou l’attention et à dégager le regard.", "C’est l’un des muscles les plus ciblés par les injections de toxine botulique pour lisser les rides du front."], ["Frontalis", "Forehead", "Linked to the back of the skull by a broad sheet (the epicranial aponeurosis), it runs down to the skin of the eyebrows.", "Raises the eyebrows and wrinkles the forehead horizontally.", "It expresses surprise or attention and clears your field of view.", "It is one of the muscles most targeted by botulinum toxin injections to smooth forehead lines."]], ["petitFessier", ["lateral", "bandWalk", "planchelat", "hydrant", "abducteurs"], ["Petit fessier", "Côté de la hanche, sous le moyen fessier", "De la face externe de l’os iliaque jusqu’à l’avant du grand trochanter.", "Écarte la cuisse et la tourne vers l’intérieur ; il centre la tête du fémur dans la hanche.", "Avec le moyen fessier, il stabilise le bassin à chaque appui sur une jambe.", "L’atteinte de ses tendons est une cause fréquente de douleur sur le côté de la hanche, surtout chez les femmes de plus de 40 ans."], ["Gluteus minimus", "Side of the hip, under the gluteus medius", "From the outer surface of the ilium to the front of the greater trochanter.", "Moves the thigh out to the side and rotates it inwards; it centres the femoral head in the hip.", "With the gluteus medius, it stabilises the pelvis every time you stand on one leg.", "Problems with its tendons are a common cause of pain on the side of the hip, especially in women over 40."]], ["coracoBrachial", ["pecDeck", "crossover", "militaire", "armcircles"], ["Coraco-brachial", "Haut de l’intérieur du bras", "De l’apophyse coracoïde jusqu’au milieu de la face interne de l’humérus.", "Lève le bras vers l’avant et le rapproche du corps.", "Il stabilise l’épaule et aide à ramener le bras devant toi, par exemple pour serrer quelqu’un.", "Il est traversé par un nerf, le nerf musculo-cutané, qui commande ensuite le biceps et le brachial."], ["Coracobrachialis", "Upper inner arm", "From the coracoid process to the middle of the inner humerus.", "Raises the arm forward and brings it towards the body.", "It stabilises the shoulder and helps bring the arm in front of you, for example to hug someone.", "It is pierced by a nerve, the musculocutaneous nerve, which then controls the biceps and brachialis."]], ["sartorius", ["cossack", "papillon", "figure4", "kneeup"], ["Sartorius (couturier)", "Diagonale de l’avant de la cuisse", "De l’épine iliaque antéro-supérieure jusqu’à la face interne du haut du tibia (patte d’oie), en traversant la cuisse en diagonale.", "Fléchit, écarte et tourne vers l’extérieur la hanche, et fléchit le genou.", "Il intervient pour croiser les jambes, monter une jambe sur l’autre genou ou t’asseoir en tailleur.", "C’est le muscle le plus long du corps humain. Son nom vient de la position assise en tailleur des couturiers d’autrefois."], ["Sartorius", "Diagonal across the front thigh", "From the anterior superior iliac spine to the inner upper tibia (pes anserinus), crossing the thigh diagonally.", "Flexes, abducts and externally rotates the hip, and flexes the knee.", "It helps you cross your legs, put one foot on the other knee or sit cross-legged.", "It is the longest muscle in the human body. Its name comes from the Latin for tailor, after the cross-legged sitting of old-time tailors."]], ["splenius", ["nuqueIso", "grandissement", "superman"], ["Splénius", "Arrière du cou", "Du ligament de la nuque et des vertèbres de C7 à T6 jusqu’à la base du crâne (splénius de la tête) et aux premières vertèbres cervicales (splénius du cou).", "Étend la tête et le cou, et les tourne du même côté.", "Il te permet de regarder vers le haut et de tourner la tête, et il tient la tête quand tu te penches en avant.", "C’est un des muscles souvent touchés lors d’un « coup du lapin » en voiture."], ["Splenius", "Back of the neck", "From the nuchal ligament and the vertebrae C7 to T6 to the base of the skull (splenius capitis) and the upper neck vertebrae (splenius cervicis).", "Extends the head and neck and turns them to the same side.", "It lets you look up and turn your head, and holds the head when you lean forward.", "It is one of the muscles often strained in a car whiplash injury."]], ["ancone", ["dips", "poulieTriceps", "pompesserrees"], ["Anconé", "Arrière et extérieur du coude", "De l’épicondyle latéral de l’humérus jusqu’à la face externe de l’olécrane.", "Aide le triceps à étendre le coude et stabilise l’articulation quand l’avant-bras tourne.", "Il garde le coude stable quand tu tournes une poignée ou visses en gardant le bras tendu.", "C’est un petit muscle triangulaire qu’on sent se contracter juste à côté de la pointe du coude."], ["Anconeus", "Back and outside of the elbow", "From the lateral epicondyle of the humerus to the outer side of the olecranon.", "Helps the triceps extend the elbow and steadies the joint when the forearm rotates.", "It keeps the elbow stable when you turn a handle or a screwdriver with the arm straight.", "It is a small triangular muscle you can feel contract right next to the tip of the elbow."]], ["buccinateur", [], ["Buccinateur", "Joue, en profondeur", "Des mâchoires supérieure et inférieure, à hauteur des molaires, jusqu’au coin des lèvres.", "Plaque la joue contre les dents et comprime l’air dans la bouche.", "Il garde les aliments entre les dents pendant la mastication et te permet de souffler fort.", "Son nom vient du latin buccinator, « joueur de trompette » : c’est lui qui gonfle et pousse l’air chez les trompettistes."], ["Buccinator", "Deep cheek", "From the upper and lower jaws, at the level of the molars, to the corner of the lips.", "Presses the cheek against the teeth and squeezes air in the mouth.", "It keeps food between the teeth while chewing and lets you blow hard.", "Its name comes from the Latin buccinator, “trumpeter”: it is what pushes air out in trumpet players."]], ["gracile", ["papillon", "cossack", "copenhague", "lateral"], ["Gracile", "Intérieur de la cuisse, en surface", "Du pubis jusqu’à la face interne du haut du tibia (patte d’oie). C’est le seul adducteur qui croise le genou.", "Rapproche la cuisse, fléchit le genou et le tourne vers l’intérieur.", "Il stabilise l’intérieur du genou et aide à serrer les jambes.", "Fin et long, il peut être prélevé sans gêne notable pour réparer un ligament ou même redonner du mouvement à un visage paralysé."], ["Gracilis", "Superficial inner thigh", "From the pubis to the inner upper tibia (pes anserinus). It is the only adductor that crosses the knee.", "Brings the thigh in, flexes the knee and rotates it inwards.", "It stabilises the inside of the knee and helps squeeze the legs together.", "Long and thin, it can be harvested without much loss to repair a ligament or even restore movement to a paralysed face."]], ["brachioRadial", ["curlMarteau", "dbCurl", "ezCurl", "tractions"], ["Brachio-radial", "Dessus de l’avant-bras, côté pouce", "Du bord externe de l’humérus, au-dessus du coude, jusqu’à l’extrémité du radius au poignet.", "Fléchit le coude, surtout quand le pouce est vers le haut ; ramène l’avant-bras en position neutre.", "Il est très actif pour porter un seau, un sac ou une valise et pour les gestes rapides de flexion.", "C’est un fléchisseur du coude, pourtant il est commandé par le nerf radial, le nerf des extenseurs."], ["Brachioradialis", "Top of the forearm, thumb side", "From the outer edge of the humerus above the elbow to the end of the radius at the wrist.", "Flexes the elbow, especially with the thumb up; brings the forearm to a neutral position.", "It is very active when carrying a bucket, a bag or a suitcase and in quick bending movements.", "It is an elbow flexor, yet it is controlled by the radial nerve, the nerve of the extensors."]], ["poplite", ["squat", "legCurl", "equilibre", "pontuni"], ["Poplité", "Arrière du genou, en profondeur", "Du condyle externe du fémur jusqu’à l’arrière du haut du tibia.", "Fait tourner légèrement le tibia vers l’intérieur (ou le fémur vers l’extérieur) au début de la flexion.", "Il « déverrouille » le genou quand tu pars d’une jambe complètement tendue pour la plier, et protège le ménisque externe.", "Sans lui, le genou resterait comme bloqué en extension complète : il donne le top départ de chaque flexion."], ["Popliteus", "Deep back of the knee", "From the outer condyle of the femur to the back of the upper tibia.", "Slightly rotates the tibia inwards (or the femur outwards) at the start of flexion.", "It “unlocks” the knee when you go from a fully straight leg to bending it, and protects the outer meniscus.", "Without it, the knee would stay locked in full extension: it starts every bend."]], ["semiEpineuxTete", ["superman", "nuqueIso", "bird"], ["Semi-épineux de la tête", "Arrière du cou, en profondeur", "Des apophyses transverses des vertèbres C4 à T6 jusqu’à l’os occipital, à l’arrière du crâne.", "C’est le plus puissant extenseur de la tête ; il aide aussi à l’incliner.", "Il tient ta tête droite en permanence, ce qui représente une charge de 4 à 6 kg.", "Plus tu penches la tête vers ton téléphone, plus il doit forcer : la charge sur le cou augmente fortement avec l’inclinaison."], ["Semispinalis capitis", "Deep back of the neck", "From the transverse processes of vertebrae C4 to T6 to the occipital bone at the back of the skull.", "It is the strongest extensor of the head; it also helps tilt it.", "It constantly holds your head up, a load of 4 to 6 kg.", "The more you tilt your head towards your phone, the harder it must work: the load on the neck rises sharply with the tilt."]], ["supinateur", ["poignets", "dbCurl", "curlMarteau"], ["Supinateur", "Haut de l’avant-bras, en profondeur", "De l’épicondyle latéral et du haut de l’ulna, il s’enroule autour du haut du radius.", "Tourne l’avant-bras paume vers le haut (supination), surtout pour les mouvements lents et sans résistance.", "Il te sert à tourner une poignée, une clé ou à présenter ta main paume ouverte.", "Le nerf radial le traverse : à cet endroit, il peut être comprimé et donner des douleurs ressemblant à un tennis-elbow."], ["Supinator", "Deep upper forearm", "From the lateral epicondyle and the upper ulna, it wraps around the upper radius.", "Turns the forearm palm up (supination), mainly for slow movements without resistance.", "You use it to turn a handle or a key, or to show your open palm.", "The radial nerve passes through it: there, it can be compressed and cause pain resembling tennis elbow."]], ["orbiculaireBouche", [], ["Orbiculaire de la bouche", "Lèvres", "Un anneau de muscle qui entoure la bouche et forme l’essentiel des lèvres.", "Ferme la bouche, serre et avance les lèvres.", "Il te permet de parler, siffler, boire à la paille, souffler et embrasser.", "Il ne s’attache presque à aucun os : il est relié aux nombreux autres muscles du visage qui convergent vers la bouche."], ["Orbicularis oris", "Lips", "A ring of muscle around the mouth that forms most of the lips.", "Closes the mouth, presses and pushes out the lips.", "It lets you speak, whistle, drink through a straw, blow and kiss.", "It barely attaches to bone: it is connected to the many other facial muscles that converge on the mouth."]], ["tibialPost", ["calfraise", "equilibre", "ankles", "mollet1"], ["Tibial postérieur", "Arrière de la jambe, en profondeur", "De la membrane entre le tibia et le péroné jusqu’au naviculaire et à plusieurs os du dessous du pied, en passant derrière la malléole interne.", "Tourne la plante du pied vers l’intérieur (inversion) et pousse la pointe vers le bas.", "C’est le principal muscle qui soutient la voûte plantaire interne quand tu marches et cours.", "Quand son tendon s’abîme, la voûte s’affaisse progressivement : c’est la première cause de pied plat acquis chez l’adulte."], ["Tibialis posterior", "Deep back of the lower leg", "From the membrane between the tibia and fibula to the navicular and several bones under the foot, passing behind the inner ankle bone.", "Turns the sole inwards (inversion) and points the foot down.", "It is the main muscle supporting the inner arch when you walk and run.", "When its tendon degenerates, the arch slowly collapses: it is the leading cause of adult-acquired flatfoot."]], ["pronateurs", ["poignets", "poignetExc", "dbCurl"], ["Rond et carré pronateurs", "Avant-bras", "Le rond pronateur va de l’épicondyle médial au milieu du radius ; le carré pronateur est un petit carré tendu entre le bas de l’ulna et le bas du radius.", "Tournent l’avant-bras paume vers le bas (pronation). Le carré est le principal pronateur, le rond aide quand il faut de la force ou de la vitesse.", "Ils servent à verser un liquide, taper sur un clavier, dévisser ou faire un revers.", "Le nerf médian passe entre les deux chefs du rond pronateur ; le carré pronateur maintient aussi le radius et l’ulna serrés l’un contre l’autre."], ["Pronator teres and quadratus", "Forearm", "Pronator teres runs from the medial epicondyle to the middle of the radius; pronator quadratus is a small square between the lower ulna and lower radius.", "Turn the forearm palm down (pronation). The quadratus is the main pronator, the teres helps when force or speed is needed.", "They let you pour a drink, type on a keyboard, unscrew or hit a backhand.", "The median nerve passes between the two heads of pronator teres; pronator quadratus also holds the radius and ulna together."]], ["fibulaires", ["equilibre", "ankles", "skater", "calfraise"], ["Fibulaires (péroniers)", "Extérieur de la jambe", "Le long fibulaire et le court fibulaire partent du péroné, passent derrière la malléole externe ; le long passe sous le pied jusqu’au premier métatarsien, le court se termine sur le cinquième métatarsien.", "Tournent la plante du pied vers l’extérieur (éversion) et aident à pousser la pointe vers le bas.", "Ils empêchent la cheville de se tordre vers l’intérieur sur un terrain irrégulier : ce sont les protecteurs de l’entorse.", "Lors d’une entorse, le court fibulaire peut arracher un petit fragment de la base du cinquième métatarsien : c’est une fracture classique."], ["Fibularis (peroneal) muscles", "Outside of the lower leg", "Fibularis longus and brevis start on the fibula and pass behind the outer ankle bone; the longus runs under the foot to the first metatarsal, the brevis ends on the fifth metatarsal.", "Turn the sole outwards (eversion) and help point the foot down.", "They stop the ankle from rolling inwards on uneven ground: they are your sprain protectors.", "During a sprain, fibularis brevis can pull off a small piece of the base of the fifth metatarsal: a classic fracture."]], ["sousOccipitaux", ["grandissement", "nuqueIso", "nuqueFlex"], ["Sous-occipitaux", "Sous la base du crâne", "Quatre petits muscles (grand et petit droits postérieurs, obliques supérieur et inférieur) tendus entre la base du crâne et les deux premières vertèbres cervicales.", "Réalisent les petits mouvements fins de la tête : hocher, tourner légèrement, ajuster.", "Ils stabilisent ton regard quand tu bouges, en informant le cerveau en permanence de la position de la tête.", "Ce sont parmi les muscles les plus riches du corps en capteurs de position (fuseaux neuromusculaires) ; ils sont souvent tendus dans les céphalées de tension."], ["Suboccipitals", "Below the base of the skull", "Four small muscles (rectus capitis posterior major and minor, obliquus capitis superior and inferior) between the base of the skull and the first two neck vertebrae.", "Perform the fine, small head movements: nodding, slight turning, adjusting.", "They steady your gaze as you move by constantly telling the brain where the head is.", "They are among the muscles richest in position sensors (muscle spindles); they are often tight in tension headaches."]], ["flechPoignet", ["poignets", "dbCurl", "tractions", "suspension"], ["Fléchisseurs du poignet", "Face interne de l’avant-bras", "Plusieurs muscles (fléchisseurs radial et ulnaire du carpe) qui partent de l’épicondyle médial, la bosse interne du coude, et se terminent sur les os de la main.", "Plient le poignet (flexion) et l’inclinent du côté du pouce ou de l’auriculaire.", "Ils servent à tenir une raquette, lancer, porter et à verrouiller le poignet quand tu serres.", "Leur tendinopathie au coude est l’« épicondylite médiale », surnommée « coude du golfeur »."], ["Wrist flexors", "Inner forearm", "Several muscles (flexor carpi radialis and ulnaris) that start on the medial epicondyle, the inner bump of the elbow, and attach to the bones of the hand.", "Bend the wrist (flexion) and tilt it towards the thumb or the little finger.", "They let you hold a racket, throw, carry and lock the wrist when you grip.", "Their tendon problem at the elbow is “medial epicondylitis”, nicknamed “golfer’s elbow”."]], ["longFlechOrteils", ["calfraise", "equilibre", "mollet1"], ["Long fléchisseur des orteils", "Arrière de la jambe, en profondeur", "De l’arrière du tibia jusqu’aux dernières phalanges des orteils 2 à 5, en passant sous le pied.", "Fléchit les orteils et aide à pousser la pointe du pied vers le bas.", "Il agrippe le sol, soutient la voûte et contribue à l’équilibre et à la poussée en fin de pas.", "Ses tendons croisent sous le pied ceux du long fléchisseur de l’hallux : ce croisement s’appelle le « nœud de Henry »."], ["Flexor digitorum longus", "Deep back of the lower leg", "From the back of the tibia to the last bones of toes 2 to 5, passing under the foot.", "Flexes the toes and helps point the foot down.", "It grips the ground, supports the arch and contributes to balance and push-off at the end of each step.", "Its tendons cross those of flexor hallucis longus under the foot: this crossing is called the “knot of Henry”."]], ["pterygoidien", [], ["Ptérygoïdien latéral", "Profondeur de la mâchoire", "De l’os sphénoïde, à la base du crâne, jusqu’au col du condyle de la mâchoire et au disque de l’articulation temporo-mandibulaire.", "Avance la mâchoire, aide à ouvrir la bouche et fait les mouvements de côté pour broyer les aliments.", "Il guide la mâchoire et son disque articulaire à chaque ouverture de la bouche et à chaque mastication.", "Ses tensions sont souvent en cause dans les claquements et douleurs de l’articulation de la mâchoire."], ["Lateral pterygoid", "Deep in the jaw", "From the sphenoid bone, at the base of the skull, to the neck of the jaw condyle and the disc of the jaw joint.", "Pushes the jaw forward, helps open the mouth and makes the side-to-side grinding movements.", "It guides the jaw and its joint disc every time you open your mouth and chew.", "Its tension is often involved in clicking and pain in the jaw joint."]], ["longFlechHallux", ["calfraise", "equilibre", "mollet1", "skihop"], ["Long fléchisseur de l’hallux", "Arrière de la jambe, en profondeur", "De l’arrière du péroné jusqu’à la dernière phalange du gros orteil.", "Fléchit le gros orteil et aide à pousser la pointe du pied vers le bas.", "C’est lui qui donne la toute dernière poussée du gros orteil à chaque pas, en marche comme en sprint.", "Les danseuses classiques le sollicitent énormément sur pointes : sa tendinopathie est surnommée la « tendinite du danseur »."], ["Flexor hallucis longus", "Deep back of the lower leg", "From the back of the fibula to the last bone of the big toe.", "Flexes the big toe and helps point the foot down.", "It gives the final push off the big toe at every step, whether walking or sprinting.", "Ballet dancers load it enormously on pointe: its tendon problem is nicknamed “dancer’s tendinitis”."]], ["longPalmaire", ["poignets", "suspension"], ["Long palmaire", "Milieu de la face interne du poignet", "De l’épicondyle médial jusqu’à l’aponévrose palmaire, une nappe fibreuse sous la peau de la paume.", "Aide faiblement à plier le poignet et tend la peau de la paume.", "Son rôle est mineur pour la force de la main.", "Il est absent chez environ 15 % des gens. Pour le voir, touche ton pouce avec ton auriculaire et plie le poignet : un tendon fin apparaît au milieu. Il sert souvent de greffon."], ["Palmaris longus", "Middle of the inner wrist", "From the medial epicondyle to the palmar aponeurosis, a fibrous sheet under the skin of the palm.", "Weakly helps bend the wrist and tightens the skin of the palm.", "Its role in hand strength is minor.", "It is missing in about 15% of people. To see it, touch your thumb to your little finger and bend your wrist: a thin tendon appears in the middle. It is often used as a graft."]], ["scm", ["nuqueIso", "nuqueLat", "nuqueFlex", "grandissement"], ["Sterno-cléido-mastoïdien", "Côtés du cou", "Du sternum (manubrium) et du tiers interne de la clavicule jusqu’à la mastoïde, la bosse osseuse derrière l’oreille.", "Quand un seul côté travaille, il tourne la tête du côté opposé et l’incline de son côté. Les deux ensemble fléchissent le cou. Il aide aussi à inspirer lors d’un effort intense.", "Il te permet de tourner la tête pour regarder derrière toi, de relever la tête quand tu es allongé et de respirer plus fort quand tu es essoufflé.", "Le torticolis du nourrisson est souvent dû à un raccourcissement de ce muscle d’un seul côté."], ["Sternocleidomastoid", "Sides of the neck", "From the sternum (manubrium) and the inner third of the clavicle to the mastoid process, the bony bump behind the ear.", "When one side works, it turns the head to the opposite side and tilts it to its own side. Both sides together flex the neck. It also helps breathe in during intense effort.", "It lets you turn your head to look behind you, lift your head when lying down and breathe harder when out of breath.", "Infant torticollis is often caused by this muscle being shortened on one side."]], ["longExtOrteils", ["ankles", "askip", "kneeup", "skater"], ["Long extenseur des orteils", "Avant et extérieur de la jambe", "Du plateau externe du tibia et du péroné jusqu’au dessus des orteils 2 à 5.", "Relève les orteils et la pointe du pied, et tourne légèrement la plante vers l’extérieur.", "Avec le tibial antérieur, il relève l’avant du pied pendant que la jambe passe vers l’avant, pour ne pas trébucher.", "Ses tendons se voient très bien sur le dessus du pied quand tu relèves les orteils."], ["Extensor digitorum longus", "Front and outside of the lower leg", "From the outer tibial plateau and the fibula to the top of toes 2 to 5.", "Lifts the toes and the front of the foot, and slightly turns the sole outwards.", "With tibialis anterior, it lifts the front of the foot while the leg swings forward, so you don’t trip.", "Its tendons are easy to see on top of the foot when you lift your toes."]], ["digastrique", [], ["Digastrique", "Sous la mâchoire", "Deux ventres reliés par un tendon intermédiaire qui glisse dans une boucle fixée sur l’os hyoïde : l’un part de derrière l’oreille (mastoïde), l’autre du menton.", "Ouvre la bouche en abaissant la mâchoire et soulève l’os hyoïde quand tu avales.", "Il intervient pour bâiller, ouvrir grand la bouche, parler et déglutir.", "Ses deux ventres sont commandés par deux nerfs crâniens différents (trijumeau et facial), car ils viennent de deux régions embryonnaires distinctes."], ["Digastric", "Under the jaw", "Two bellies joined by an intermediate tendon sliding through a sling on the hyoid bone: one starts behind the ear (mastoid), the other at the chin.", "Opens the mouth by lowering the jaw and lifts the hyoid bone when you swallow.", "It is used to yawn, open wide, speak and swallow.", "Its two bellies are controlled by two different cranial nerves (trigeminal and facial), because they come from two separate embryonic regions."]], ["flechDoigts", ["suspension", "tractions", "dbRow", "souleveTerre"], ["Fléchisseurs des doigts", "Face interne de l’avant-bras", "Le fléchisseur superficiel se termine sur les phalanges moyennes, le fléchisseur profond sur les dernières phalanges. Ils partent de l’épicondyle médial, de l’ulna et du radius.", "Plient les doigts, et aident à plier le poignet.", "C’est le moteur de ta prise : porter des courses, grimper, te suspendre, tenir une barre.", "Leurs neuf tendons passent avec le nerf médian dans le canal carpien : quand il est trop serré, la main fourmille."], ["Finger flexors", "Inner forearm", "The superficial flexor ends on the middle finger bones, the deep flexor on the end bones. They start on the medial epicondyle, the ulna and the radius.", "Bend the fingers and help bend the wrist.", "They are the engine of your grip: carrying shopping, climbing, hanging, holding a bar.", "Their nine tendons pass through the carpal tunnel with the median nerve: when it gets too tight, the hand tingles."]], ["abducteurHallux", ["equilibre", "calfraise", "ankles"], ["Abducteur de l’hallux", "Bord interne de la plante du pied", "De la face interne du calcanéus (talon) jusqu’à la base de la première phalange du gros orteil.", "Écarte le gros orteil des autres et aide à le fléchir.", "Il soutient la voûte plantaire interne et aide à garder l’équilibre debout et sur une jambe.", "Sa faiblesse est associée à l’hallux valgus (« oignon »), où le gros orteil dévie vers les autres."], ["Abductor hallucis", "Inner edge of the sole", "From the inner side of the calcaneus (heel) to the base of the first bone of the big toe.", "Moves the big toe away from the others and helps flex it.", "It supports the inner arch and helps balance when standing and on one leg.", "Its weakness is linked to hallux valgus (a bunion), where the big toe drifts towards the others."]], ["extDoigts", ["poignetExc", "poignets", "bandPullApart"], ["Extenseur des doigts", "Dessus de l’avant-bras", "De l’épicondyle latéral jusqu’au dessus des doigts 2 à 5, où ses tendons forment des expansions.", "Tend les doigts et aide à relever le poignet.", "Il ouvre la main pour lâcher un objet, taper au clavier ou jouer d’un instrument.", "Ses tendons sont reliés entre eux sur le dos de la main : c’est pour cela qu’il est difficile de lever l’annulaire seul quand les autres doigts sont pliés."], ["Extensor digitorum", "Top of the forearm", "From the lateral epicondyle to the top of fingers 2 to 5, where its tendons form expansions.", "Straightens the fingers and helps lift the wrist.", "It opens the hand to release an object, type or play an instrument.", "Its tendons are linked on the back of the hand: that is why it is hard to lift the ring finger alone when the other fingers are bent."]], ["plantaireGrele", ["calfraise", "mollet1"], ["Plantaire grêle", "Arrière du genou et du mollet", "Un petit corps musculaire au-dessus du condyle externe du fémur, prolongé par un tendon très long et très fin jusqu’au talon.", "Aide faiblement à fléchir le genou et à pousser la pointe du pied vers le bas.", "Son rôle est mineur ; il contiendrait de nombreux capteurs et participerait à la perception de la position du pied.", "Il est absent chez environ une personne sur dix, et son long tendon est un greffon pratique pour les chirurgiens."], ["Plantaris", "Back of the knee and calf", "A small muscle belly above the outer femoral condyle, continued by a very long, thin tendon to the heel.", "Weakly helps flex the knee and point the foot down.", "Its role is minor; it may contain many sensors and help sense foot position.", "It is missing in about one person in ten, and its long tendon is a handy graft for surgeons."]], ["flechisseursCou", ["grandissement", "nuqueIso", "nuqueFlex", "bird"], ["Fléchisseurs profonds du cou", "Avant de la colonne cervicale", "Le long du cou et le long de la tête, collés à l’avant des vertèbres cervicales, de la base du crâne jusqu’aux premières vertèbres thoraciques.", "Fléchissent légèrement la tête et le cou (le geste de rentrer le menton) et stabilisent la colonne cervicale, vertèbre par vertèbre.", "Ils tiennent ta tête alignée au-dessus des épaules, par exemple devant un écran, et protègent le cou lors des mouvements rapides.", "Jull et ses collègues ont montré qu’ils sont souvent moins actifs chez les personnes qui ont mal au cou, et que les réentraîner par de petits mouvements de menton réduit la douleur."], ["Deep neck flexors", "Front of the cervical spine", "The longus colli and longus capitis, lying against the front of the neck vertebrae, from the base of the skull to the first thoracic vertebrae.", "Gently flex the head and neck (the chin-tuck movement) and stabilise the cervical spine, vertebra by vertebra.", "They keep your head aligned over your shoulders, for example in front of a screen, and protect the neck during quick movements.", "Jull and colleagues showed they are often less active in people with neck pain, and that retraining them with small chin-tuck movements reduces pain."]], ["platysma", [], ["Platysma (peaucier du cou)", "Avant du cou", "Une fine nappe musculaire sous la peau, du haut de la poitrine jusqu’à la mâchoire et au coin de la bouche.", "Tend la peau du cou et tire les coins de la bouche vers le bas.", "Il participe aux expressions de peur, de dégoût ou d’effort intense.", "C’est un vestige du muscle qui permet au cheval de faire frissonner sa peau pour chasser les mouches."], ["Platysma", "Front of the neck", "A thin muscle sheet under the skin, from the upper chest to the jaw and the corner of the mouth.", "Tightens the skin of the neck and pulls the corners of the mouth down.", "It shows up in expressions of fear, disgust or intense effort.", "It is a remnant of the muscle that lets a horse twitch its skin to shoo flies."]], ["thenar", ["poignets", "suspension"], ["Muscles thénariens (pouce)", "Base du pouce", "Trois petits muscles (court abducteur, court fléchisseur et opposant du pouce) qui forment le relief à la base du pouce.", "Écartent, plient et surtout opposent le pouce aux autres doigts.", "L’opposition du pouce rend possibles la pince fine, l’écriture et la manipulation d’outils.", "Ils sont commandés surtout par le nerf médian : dans un syndrome du canal carpien avancé, ce relief fond."], ["Thenar muscles (thumb)", "Base of the thumb", "Three small muscles (abductor pollicis brevis, flexor pollicis brevis, opponens pollicis) forming the pad at the base of the thumb.", "Move the thumb out, bend it and above all oppose it to the other fingers.", "Thumb opposition makes the fine pinch, writing and tool use possible.", "They are mainly controlled by the median nerve: in advanced carpal tunnel syndrome, this pad wastes away."]], ["pelviTroch", ["figure4", "hip9090", "pont", "scorpion"], ["Pelvi-trochantériens", "Profondeur de la fesse", "Un groupe de petits muscles (obturateurs interne et externe, jumeaux supérieur et inférieur, carré fémoral) qui vont du bassin, autour du trou obturé, jusqu’au grand trochanter.", "Tournent la cuisse vers l’extérieur et plaquent la tête du fémur dans le cotyle.", "Ce sont les stabilisateurs fins de la hanche, un peu comme la coiffe des rotateurs pour l’épaule.", "L’obturateur interne fait un virage à angle droit autour de l’ischion, qui lui sert de poulie, avant de rejoindre le fémur."], ["Deep hip rotators", "Deep in the buttock", "A group of small muscles (obturator internus and externus, superior and inferior gemellus, quadratus femoris) running from the pelvis, around the obturator foramen, to the greater trochanter.", "Rotate the thigh outwards and press the femoral head into the socket.", "They are the fine stabilisers of the hip, a bit like the rotator cuff for the shoulder.", "The obturator internus makes a right-angle turn around the ischium, used as a pulley, before reaching the femur."]], ["hypothenar", ["poignets", "suspension"], ["Muscles hypothénariens", "Bord de la main, côté auriculaire", "Trois petits muscles (abducteur, court fléchisseur et opposant du 5e doigt) qui forment le relief du bord interne de la paume.", "Écartent, plient et rapprochent l’auriculaire du pouce.", "Ils creusent la paume pour former une coupe et renforcent la prise d’objets ronds.", "Ils sont commandés par le nerf ulnaire, celui qui donne la sensation de « décharge » quand on se cogne le coude."], ["Hypothenar muscles", "Little-finger edge of the hand", "Three small muscles (abductor, short flexor and opponens of the little finger) forming the pad on the inner edge of the palm.", "Move the little finger out, bend it and bring it towards the thumb.", "They cup the palm and strengthen your grip on round objects.", "They are controlled by the ulnar nerve, the one that gives the “funny bone” jolt when you bang your elbow."]], ["iliaque", ["kneeup", "climbers", "relevesJambes", "fenteBasse"], ["Iliaque", "Intérieur du bassin", "De la fosse iliaque, la face interne en forme de cuvette de l’os iliaque, jusqu’au petit trochanter, avec le psoas.", "Fléchit la hanche et bascule le bassin vers l’avant quand la cuisse est fixée.", "Il monte le genou, te permet de te redresser assis et stabilise le bassin.", "Il est innervé par le nerf fémoral : un hématome dans ce muscle, chez un patient sous anticoagulants par exemple, peut comprimer ce nerf."], ["Iliacus", "Inside the pelvis", "From the iliac fossa, the bowl-shaped inner surface of the ilium, to the lesser trochanter, together with the psoas.", "Flexes the hip and tilts the pelvis forward when the thigh is fixed.", "It drives the knee up, lets you sit up and stabilises the pelvis.", "It is supplied by the femoral nerve: a bleed in this muscle, for instance in a patient on blood thinners, can compress that nerve."]], ["pyramidal", ["hollow", "relevesJambes", "hundred"], ["Pyramidal de l’abdomen", "Bas du ventre, au-dessus du pubis", "Un petit triangle qui part du pubis et monte devant le grand droit jusqu’à la ligne blanche.", "Tend la ligne blanche, la bande fibreuse au milieu du ventre.", "Il participe modestement à la paroi abdominale ; son rôle exact est encore discuté.", "Il manque chez environ 10 à 20 % des gens, d’un côté ou des deux."], ["Pyramidalis", "Lower belly, above the pubis", "A small triangle that starts on the pubis and rises in front of the rectus abdominis to the linea alba.", "Tightens the linea alba, the fibrous band down the middle of the belly.", "It plays a modest part in the abdominal wall; its exact role is still debated.", "It is missing in about 10 to 20% of people, on one or both sides."]], ["arrecteurs", [], ["Muscles arrecteurs des poils", "Peau", "De minuscules muscles lisses qui relient chaque follicule pileux à la couche superficielle de la peau.", "En se contractant, ils redressent le poil et font apparaître la chair de poule.", "Ils réagissent au froid, à la peur et aux émotions fortes, comme la musique qui donne des frissons.", "Chez les animaux à fourrure, redresser les poils emprisonne de l’air pour garder la chaleur ou faire paraître plus gros : chez nous, c’est surtout un vestige."], ["Arrector pili muscles", "Skin", "Tiny smooth muscles linking each hair follicle to the upper layer of the skin.", "When they contract, they make the hair stand up and cause goosebumps.", "They react to cold, fear and strong emotions, like music that gives you chills.", "In furry animals, raising the hair traps air for warmth or makes them look bigger: in us, it is mostly a remnant."]], ["interosseux", ["pompes", "suspension", "poignets"], ["Interosseux et lombricaux", "Dans la paume", "Les interosseux sont logés entre les os de la main ; les lombricaux naissent sur les tendons du fléchisseur profond et rejoignent les tendons extenseurs.", "Les interosseux écartent et rapprochent les doigts ; les lombricaux plient la base des doigts tout en tendant les autres phalanges.", "Ils permettent la précision des doigts : écrire, jouer du piano, tenir une carte entre deux doigts.", "Les lombricaux sont des muscles rares qui relient un tendon à un autre tendon, sans s’attacher à un os."], ["Interossei and lumbricals", "Inside the palm", "The interossei lie between the bones of the hand; the lumbricals arise from the tendons of the deep flexor and join the extensor tendons.", "The interossei spread and close the fingers; the lumbricals bend the knuckles while straightening the other finger joints.", "They give the fingers their precision: writing, playing the piano, holding a card between two fingers.", "The lumbricals are unusual muscles that link one tendon to another, without attaching to bone."]], ["psoasMineur", ["relevesJambes", "hollow", "deadbug"], ["Petit psoas", "Devant le grand psoas", "Des vertèbres T12 et L1 jusqu’à l’éminence ilio-pubienne, sur le bassin, par un long tendon plat.", "Fléchit faiblement la colonne lombaire et bascule le bassin vers l’arrière.", "Son rôle est modeste : il aiderait à stabiliser le bassin et la colonne.", "Il est absent chez environ la moitié des gens : c’est l’un des muscles les plus variables du corps."], ["Psoas minor", "In front of the psoas major", "From the T12 and L1 vertebrae to the iliopubic eminence on the pelvis, through a long flat tendon.", "Weakly flexes the lumbar spine and tilts the pelvis backwards.", "Its role is modest: it may help stabilise the pelvis and spine.", "It is missing in about half of people: it is one of the most variable muscles in the body."]]];
const muscleDuJour = d => duJour(MUSCLES, d);
const majMuscleBtn = () => { try { $("muscleNouveau").classList.toggle("vu", localStorage.getItem("muscleVu") === jourCle()); } catch (e) {} };
function ouvrirMuscle() {
  const [id, exos, fr, en] = muscleDuJour(), [nom, zone, attaches, actions, utilite, savais] = LANGUE === "en" ? en : fr;
  stocker("muscleVu", jourCle()); const lus = lireJSON("musclesLus", []); if (!lus.includes(id)) stocker("musclesLus", JSON.stringify([...lus, id]));
  $("mZone").textContent = T("Muscle du jour") + " · " + zone; $("mNom").textContent = nom;
  const bloc = (t, txt, c = "") => `<div class="fiche ${c}"><h2>${T(t)}</h2><p>${txt}</p></div>`;
  const ex = exos.filter(e => EXERCICES[e]);
  $("mCorps").innerHTML = schemaMuscle(id) + bloc("Où il s’attache", attaches) + bloc("Comment il fonctionne", actions) + bloc("À quoi il sert", utilite)
    + (ex.length ? `<h2 class="sec">${T("Pour le travailler")}</h2><ul class="list">${ex.map(e => `<li>${vignette(e)}<div><b>${EXERCICES[e].nom}</b><small>${EXERCICES[e].muscles}</small></div></li>`).join("")}</ul>` : "")
    + bloc("Le savais-tu ?", savais, "savais")
    + `<p class="sources">${T("Sources : Gray’s Anatomy (42e éd., 2020), Kapandji – Anatomie fonctionnelle, et les études citées. Un nouveau muscle chaque jour à minuit.")}</p>`;
  document.documentElement.style.setProperty("--accent", "#E11D48");
  ecran("muscle");
}
$("muscleBtn").onclick = ouvrirMuscle;
$("muscleRetour").onclick = () => retour(() => ecran("menu"));
setInterval(() => ecranCourant === "menu" && majMuscleBtn(), 60000);

