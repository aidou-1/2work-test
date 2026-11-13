/* ============ ÉVÉNEMENTS ============ */
$("back").onclick = () => retour(() => routine && routine.retour ? routine.retour() : routine && routine.reprise ? ouvrirReprise(routine.reprise, true) : routine && routine.prog ? ouvrirProg(routine.prog, true) : routine && routine.perso ? (vueListe === "favoris" ? vueFavoris() : vuePlan()) : ecran(routine && routine.defi ? "menu" : "home"));
const MOTEUR = { tabata: [demarrerTab, suivantTab, precedentTab], souffle: [demarrerSouf, suivantSouf, precedentSouf] };
const moteur = i => (MOTEUR[mode] || [demarrer, suivant, precedent])[i];
/* Compte à rebours de PREP secondes avant chaque activité : le temps de poser le téléphone */
const PREP = 4;
function lancer() { clearInterval(tPret); fc.somme = fc.n = fc.max = 0; prefixeVoix = PH("go") + " "; aReprendre ? rejouer() : moteur(0)(); }
function preparer(s) {   // s : séance à reprendre (sinon départ normal ; un clic passe son événement, ignoré)
  aReprendre = s && s.cle ? s : null;
  let n = PREP;
  amorcerVoix();
  $("pretTime").textContent = n;
  ecran("pret");
  parler(PH("pret"));
  tPret = setInterval(() => {
    if (--n <= 0) return lancer();
    $("pretTime").textContent = n;
    if (n <= 3) sons.alerte(); else sons.tic();
  }, 1000);
}
$("start").onclick = preparer;
$("pretGo").onclick = lancer;
$("next").onclick = () => moteur(1)(false);
$("prev").onclick = () => moteur(2)();
$("pause").onclick = pause;
$("restart").onclick = () => retour(() => ecran("menu"));

/* Bouton Menu en haut à droite : en séance, un premier appui demande confirmation (3 s) */
let tQuit = null;
$("quitBtn").onclick = () => {
  const enSeance = ["session", "pret"].includes(ecranCourant);
  if (enSeance && $("quitBtn").dataset.conf !== "1") {
    $("quitBtn").dataset.conf = "1";
    $("quitBtn").textContent = T("Quitter ?");
    clearTimeout(tQuit);
    tQuit = setTimeout(() => { $("quitBtn").dataset.conf = ""; $("quitBtn").textContent = T("✕ Menu"); }, 3000);
    return;
  }
  clearTimeout(tQuit);
  clearInterval(timer); oublierSeance();
  enRepos = false; enPause = false;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  retour(() => ecran("menu"));
};

/* Menu principal et réglage du repos */
let vueListe = "cats";
const VUES = ["choicesP", "choicesG", "choicesB", "choicesF", "choicesCS", "choicesC", "choices", "choicesZ", "choicesM", "choicesR", "choicesK", "choicesE", "choicesT"];
function vue(nom, etat, titre, sous, avant) {
  ecran("home", () => {
    if (avant) avant();
    vueListe = etat;
    VUES.forEach(v => $(v).classList.toggle("hidden", v !== nom));
    $("hTitre").textContent = T(titre); $("hSub").textContent = T(sous);
    scrollTo(0, 0);
  });
}
const vueCats = () => vue("choicesC", "cats", "Échauffements", L("Méthode RAMP en 4 phases, adaptée à chaque sport. Choisis le tien.", "4-phase RAMP method, tailored to each sport. Pick yours."), listeSports);
const vuePlan = () => vue("choicesP", "plan", "Entraînement", "Crée et enregistre ta séance, suis un objectif en salle, renforce-toi pour ton sport ou lance un Tabata.");
const vueSCats = () => vue("choicesCS", "scats", "Renfo par sport", L("Séances en 4 blocs, 3 niveaux, prévention des blessures propre à chaque sport.", "4-block sessions, 3 levels, injury prevention specific to each sport."), listeRenfo);
function sousListe(conteneur, cat, etat, titre, sous) {
  const btns = [...$(conteneur).children].filter(b => b.dataset.cat === cat);
  if (btns.length === 1) return btns[0].click();
  vue(conteneur, etat, titre, sous, () => [...$(conteneur).children].forEach(b => b.classList.toggle("hidden", b.dataset.cat !== cat)));
}
const vueCat = cat => sousListe("choices", cat, "cat", CATS[cat].titre, "Choisis ton échauffement.");
const vueZones = () => vue("choicesZ", "zones", "Renfo du corps", "Choisis ta zone : haut, bas ou tout le corps.");
let grpCourant = "";
function vueMode(grp) {
  grpCourant = grp;
  vue("choicesM", "smode", ROUTINES[SEANCE(grp)].titre, L("Séance en 4 blocs construite pour ton sport. Choisis ton niveau.", "4-block session built for your sport. Choose your level."), () => renduRenfo(grp));
}
const vueK = (cat, titre, sous) => sousListe("choicesK", cat, "kcat", titre, sous);

function ouvrirListe(type) { type === "seance" ? vuePlan() : vueCats(); }
/* Écran de démarrage : le logo s'anime, la barre se remplit, puis l'appli s'ouvre seule (un toucher l'ouvre tout de suite) */
const entrer = () => { if (!$("accueil").classList.contains("hidden")) besoinInstallGuide() ? ecran("bienvenue", guideInstall) : suiteBienvenue(); };
const suiteBienvenue = () => besoinBienvenue() ? ecran("bienvenue", () => bienvenue(1)) : ecran("menu");
document.addEventListener("click", entrer); setTimeout(entrer, 2400);
$("mEch").onclick = () => ouvrirListe("echauffement");
$("mSeance").onclick = () => ouvrirListe("seance");
$("mCalme").onclick = vueCalme;
$("homeBack").onclick = () => retour(() => ({ cat: vueCats, zones: vueSCats, smode: () => ["haut", "bas", "complet"].includes(grpCourant) ? vueZones() : vueSCats(), scats: vuePlan, salle: vuePlan, methode: vueSalle, libres: vueSalle, blessure: vuePlan, favoris: vuePlan, kcat: vueCalme, tabata: vuePlan, ech: () => ROUTINES[echCle].cat === "renfo" ? vueCat("renfo") : vueCats() }[vueListe] || (() => ecran("menu")))());

function setRepos(r) {
  if (routine && routine.reglerRepos) { const v = Math.min(300, Math.max(0, r)); reposGarder(routine.reposId, v); ROUTINES[routineCle] = routine.reglerRepos(v); return ouvrirApercu(routineCle); }
  repos = Math.min(mode === "salle" ? 300 : mode === "tabata" ? 120 : 180, Math.max(0, r));
  if (mode === "tabata") stocker("reposTabata", repos);
  else if (routine && !routine.fixe) reposGarder((mode === "salle" ? "libre:" : "seance:") + routineCle, repos);
  if (routineCle) ouvrirApercu(routineCle);
}
const reposActuel = () => routine && routine.reglerRepos ? routine.repos : repos;   // pas de 15 s au-delà d'une minute
$("rMoins").onclick = () => { const v = reposActuel(); setRepos(v - (v > 60 ? 15 : 5)); };
$("rPlus").onclick = () => { const v = reposActuel(); setRepos(v + (v >= 60 ? 15 : 5)); };
$("cycMoins").onclick = () => setCycles(cycles - 1);
$("cycPlus").onclick = () => setCycles(cycles + 1);
$("repMoins").onclick = () => setReps(reps - 1);
$("repPlus").onclick = () => setReps(reps + 1);
$("recMoins").onclick = () => setRecup(recup - 5);
$("recPlus").onclick = () => setRecup(recup + 5);
$("dureeVal").closest(".reglage").after($("reposRow"));
$("reposRow").after($("repsRow"));
$("repsRow").after($("cyclesRow"));
$("cyclesRow").after($("recupRow"));

$("aRecherche").oninput = () => majAjout();
$("ajoutBtn").onclick = () => {
  const ouvert = $("ajout").classList.toggle("hidden") === false;
  $("ajoutBtn").textContent = T(ouvert ? "Fermer" : "Ajouter");
  $("ajoutBtn").setAttribute("aria-expanded", ouvert);
};
$("pList").onclick = ev => {
  const b = ev.target.closest(".suppr");
  if (!b) return;
  ids.splice(Number(b.dataset.i), 1);
  sauverIds();
  ouvrirApercu(routineCle);
};
/* Réorganiser : on maintient un exercice (0,4 s), il se décolle et suit le doigt librement ;
   les autres glissent pour lui laisser une place (pointillés), sans jamais le chevaucher. */
let drag = null;
const lignes = () => [...$("pList").children].filter(l => l.dataset.i !== undefined && !l.classList.contains("flottant"));
$("pList").addEventListener("contextmenu", ev => ev.preventDefault());
/* Séance : glisser vers la gauche passe à l'exercice suivant, vers la droite revient au précédent ; l'aperçu « Ensuite » fait de même */
{ let gx = 0, gy = 0, gt = 0; const S = $("session");
  S.addEventListener("touchstart", e => { const t = e.touches[0]; gx = t.clientX; gy = t.clientY; gt = Date.now(); }, { passive: true });
  S.addEventListener("touchend", e => { const t = e.changedTouches[0], dx = t.clientX - gx; if (Math.abs(dx) > 80 && Math.abs(t.clientY - gy) < 50 && Date.now() - gt < 600 && !e.target.closest(".controls, input")) { vibrer(20); $(dx < 0 ? "next" : "prev").click(); } }, { passive: true });
  $("ensuite").onclick = () => $("next").click(); }
$("pList").addEventListener("pointerdown", ev => {
  const li = ev.target.closest("li");
  if (!li || li.dataset.i === undefined || ev.target.closest(".suppr")) return;
  drag = { li, x: ev.clientX, y: ev.clientY, actif: false };
  drag.t = setTimeout(() => decoller(ev.clientX, ev.clientY), 400);
});
function decoller(x, y) {
  const li = drag.li, items = lignes(), r = li.getBoundingClientRect();
  Object.assign(drag, {
    actif: true, x, y, items, de: items.indexOf(li), vers: items.indexOf(li), h: r.height,
    dy: y - r.top, // position du doigt dans la carte
    pos: items.map(l => { const q = l.getBoundingClientRect(); return { top: q.top + scrollY, h: q.height }; })
  });
  const f = li.cloneNode(true);
  f.classList.add("flottant");
  Object.assign(f.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
  $("pList").appendChild(f); drag.f = f;
  $("pList").classList.add("tri");
  li.classList.add("place");
  vibrer(30);
}
function suivreDrag(y) {
  const d = drag;
  d.y = y;
  d.f.style.top = (y - d.dy) + "px";
  // place visée : nombre de cartes (hors celle déplacée) dont le milieu est au-dessus du centre de la carte flottante
  const centre = y - d.dy + d.h / 2 + scrollY;
  const vers = d.pos.filter((p, i) => i !== d.de && p.top + p.h / 2 < centre).length;
  if (vers === d.vers) return;
  d.vers = vers;
  vibrer(8);
  // les autres cartes s'écartent ; la place en pointillés se cale à l'endroit visé
  let decal = 0;
  d.items.forEach((l, i) => {
    if (i === d.de) return;
    const bas = d.de < vers && i > d.de && i <= vers, haut = vers < d.de && i >= vers && i < d.de;
    l.style.transform = bas ? `translateY(${-d.h}px)` : haut ? `translateY(${d.h}px)` : "";
    if (bas) decal += d.pos[i].h; else if (haut) decal -= d.pos[i].h;
  });
  d.li.style.transform = decal ? `translateY(${decal}px)` : "";
}
document.addEventListener("pointermove", ev => {
  if (!drag) return;
  if (!drag.actif) {
    if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 10) { clearTimeout(drag.t); drag = null; }
    return;
  }
  suivreDrag(ev.clientY);
  if (ev.clientY < 90) window.scrollBy(0, -14);
  else if (ev.clientY > window.innerHeight - 90) window.scrollBy(0, 14);
});
window.addEventListener("scroll", () => { if (drag && drag.actif) { drag.vers = -1; suivreDrag(drag.y); } }, { passive: true });
document.addEventListener("touchmove", ev => { if (drag && drag.actif) ev.preventDefault(); }, { passive: false });
function finDrag() {
  if (!drag) return;
  clearTimeout(drag.t);
  const d = drag;
  drag = null;
  if (!d.actif) return;
  // la carte se pose dans la place libre, puis la liste est enregistrée
  const cible = d.li.getBoundingClientRect();
  d.f.classList.add("pose");
  d.f.style.top = cible.top + "px";
  const poser = () => {
    const [x] = ids.splice(d.de, 1);
    ids.splice(d.vers, 0, x);
    sauverIds();
    ouvrirApercu(routineCle);
  };
  if (mouvementReduit()) return poser();
  setTimeout(poser, 220);
}
document.addEventListener("pointerup", finDrag);
document.addEventListener("pointercancel", finDrag);

$("ajout").onclick = ev => {
  const b = ev.target.closest(".ajouter");
  if (!b) return;
  ids.push(b.dataset.id);
  sauverIds();
  ouvrirApercu(routineCle);
};
$("defBtn").onclick = () => {
  ids = [...ROUTINES[routineCle].exercices];
  sauverIds();
  ouvrirApercu(routineCle);
};
$("moins").onclick = () => setDuree(dureeGlobale - pas());
$("plus").onclick = () => setDuree(dureeGlobale + pas());

function majVoixBtn() {
  ["voixBtn", "rVoixBtn"].forEach(id => { $(id).textContent = T(voixActive ? "Activée" : "Coupée"); $(id).setAttribute("aria-pressed", voixActive); });
}
$("rVoixBtn").onclick = () => $("voixBtn").click();
$("voixBtn").onclick = () => {
  voixActive = !voixActive;
  stocker("voix", voixActive ? "1" : "0");
  if (!voixActive && "speechSynthesis" in window) speechSynthesis.cancel();
  majVoixBtn();
};
majVoixBtn();

/* ============ RÉGLAGES ============ */
function remplirVoix() {
  const sel = $("voixChoix"), liste = voixDispo();
  sel.innerHTML = `<option value="">${T("Automatique (recommandée)")}</option>` + liste.map(v => `<option value="${v.name}">${v.name} · ${v.lang}</option>`).join("");
  sel.value = liste.some(v => v.name === nomVoix) ? nomVoix : "";
  $("voixAide").textContent = liste.length ? T(langueVoix === "fr" ? "{n} voix françaises sur ce téléphone" : "{n} voix anglaises sur ce téléphone", { n: liste.length }) : T("Aucune voix de cette langue trouvée sur ce téléphone");
  ["langFr", "langEn"].forEach(id => $(id).setAttribute("aria-pressed", (id === "langFr") === (langueVoix === "fr")));
}
function sauverVoix() { stocker("langueVoix", langueVoix); stocker("nomVoix", nomVoix); }
$("langFr").onclick = () => { langueVoix = "fr"; nomVoix = ""; sauverVoix(); remplirVoix(); };
$("langEn").onclick = () => { langueVoix = "en"; nomVoix = ""; sauverVoix(); remplirVoix(); };
$("voixChoix").onchange = ev => { nomVoix = ev.target.value; sauverVoix(); };
$("voixTest").onclick = () => {
  if (!("speechSynthesis" in window)) return;
  const avant = voixActive; voixActive = true; parler(PH("test"), 0); voixActive = avant;
};
if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", remplirVoix);
$("reglagesBtn").onclick = () => { remplirVoix(); ecran("reglages"); };
["appFr", "appEn"].forEach(id => {
  $(id).setAttribute("aria-pressed", (id === "appEn") === (LANGUE === "en"));
  $(id).onclick = () => {
    const l = id === "appEn" ? "en" : "fr";
    if (l === LANGUE) return;
    [["langue", l], ["langueVoix", l], ["nomVoix", ""], ["ouvrirReglages", "1"]].forEach(([k, v]) => stocker(k, v));
    location.reload();
  };
});
/* Traduit les textes fixes de la page (titres, boutons, libellés) quand l'appli est en anglais */
function traduireDOM() {
  if (LANGUE !== "en") return;
  const w = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) { const t = n.nodeValue.trim(); if (t && UI_EN[t] !== undefined) n.nodeValue = n.nodeValue.replace(t, UI_EN[t]); }
  $("aRecherche").placeholder = T("Rechercher un exercice");
  document.querySelectorAll("[aria-label], [alt]").forEach(el => ["aria-label", "alt"].forEach(a => { const v = el.getAttribute(a); if (v && UI_EN[v] !== undefined) el.setAttribute(a, UI_EN[v]); }));
  $("quitBtn").textContent = T("✕ Menu");
  document.title = "2 WORK";
}
traduireDOM();
// après un changement de langue, on revient directement sur les Réglages
try { if (localStorage.getItem("ouvrirReglages") === "1") { localStorage.removeItem("ouvrirReglages"); remplirVoix(); afficherEcran("reglages"); } } catch (e) {}
$("reglagesRetour").onclick = () => retour(() => ecran("menu"));

