/* ============ CLUBS : compte, clubs, séances du coach, suivi, chat ============
   Interface seulement : tout ce qui touche au serveur passe par js/serveur.js, chargé à la première ouverture des clubs
   (rien n'est téléchargé pour ceux qui ne s'en servent pas). Sur ce téléphone on garde seulement : « clubCompte » (déjà
   connecté une fois, pour afficher la carte de l'accueil sans attendre), « clubLu_<id> » (dernier message lu). */
let SV = null, CL = { u: undefined, clubs: [], attente: [], vue: "liste", c: null, onglet: "seances", rep: null }, desab = [], rejoindre = null;
const echap = t => String(t ?? "").replace(/[&<>"']/g, x => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[x]));
const couleurPseudo = s => `hsl(${[...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)} 70% ${document.documentElement.dataset.theme === "dark" ? 68 : 38}%)`;
const ERR = { "auth/email-already-in-use": ["Cet email a déjà un compte : connecte-toi.", "This email already has an account: sign in."], "auth/invalid-email": ["Adresse email invalide.", "Invalid email address."], "auth/weak-password": ["Mot de passe trop faible : 8 caractères minimum, dont une minuscule et un chiffre.", "Password too weak: 8 characters minimum, including a lowercase letter and a digit."], "auth/password-does-not-meet-requirements": ["Mot de passe trop faible : 8 caractères minimum, dont une minuscule et un chiffre.", "Password too weak: 8 characters minimum, including a lowercase letter and a digit."], "auth/invalid-credential": ["Email ou mot de passe incorrect.", "Wrong email or password."], "auth/wrong-password": ["Mot de passe incorrect.", "Wrong password."], "auth/too-many-requests": ["Trop d’essais : réessaie dans quelques minutes.", "Too many attempts: try again in a few minutes."], "auth/network-request-failed": ["Pas de connexion internet.", "No internet connection."], "2work/pseudo-pris": ["Ce pseudo est déjà pris, choisis-en un autre.", "This username is taken, pick another one."], "2work/pseudo-format": ["Pseudo : 3 à 20 caractères, lettres, chiffres, . _ ou -", "Username: 3 to 20 characters, letters, digits, . _ or -"], "permission-denied": ["Action non autorisée.", "Action not allowed."], "2work/trop-gros": ["Ton suivi dépasse 1 Mo une fois compressé : utilise la sauvegarde en fichier (Réglages).", "Your progress is over 1 MB compressed: use the file backup (Settings)."], unavailable: ["Pas de connexion internet.", "No internet connection."] };
const msgErr = e => L(...(ERR[e && e.code] || ["Une erreur est survenue, réessaie.", "Something went wrong, try again."]));
const ageDe = n => { const a = new Date(n), j = new Date(); return j.getFullYear() - a.getFullYear() - (j < new Date(j.getFullYear(), a.getMonth(), a.getDate()) ? 1 : 0); };
const club = () => CL.clubs.find(x => x.id === CL.c), staff = () => ["coach", "cocoach"].includes((club() || {}).role);
/* Sections d'un club (ex. club de boxe : boxe anglaise, MMA, JJB…) : cb.sections = [{ id, nom }], tenues par le staff ;
   chaque membre coche les siennes (cb.mesSec), le staff peut corriger. Une séance ou un chat de section n'est visible que de ses membres et du staff. */
const sectionsDe = cb => (cb && cb.sections) || [], nomSec = (cb, id) => (sectionsDe(cb).find(x => x.id === id) || { nom: "?" }).nom;
const mesSections = cb => ["coach", "cocoach"].includes(cb.role) ? sectionsDe(cb).map(x => x.id) : (cb.mesSec || []).filter(id => sectionsDe(cb).some(x => x.id === id));
function ecouterSeancesClub(cb, f) {   // séances du club entier + de mes sections, fusionnées par date (plus récentes d'abord)
  const parts = {}, ids = ["", ...mesSections(cb)], tout = () => f(ids.flatMap(k => parts[k] || []).sort((a, b) => a.date < b.date ? 1 : -1));
  const stops = ids.map(k => SV.ecouterSeances(cb.id, l => { parts[k] = l; if (ids.every(x => parts[x])) tout(); }, k)); return () => stops.forEach(x => x());
}
const ROLES = { coach: ["Coach", "Coach"], cocoach: ["Co-coach", "Co-coach"], membre: ["Membre", "Member"] };
const dateLisible = j => { const a = jourCle(), dm = decaler(a, 1); return j === a ? L("Aujourd’hui", "Today") : j === dm ? L("Demain", "Tomorrow") : new Date(j + "T12:00").toLocaleDateString(LANGUE === "en" ? "en-GB" : "fr-FR", { weekday: "short", day: "numeric", month: "short" }); };
const heure = t => t && t.toDate ? t.toDate().toLocaleTimeString(LANGUE === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
function stop() { desab.forEach(f => f()); desab = []; }

async function chargerServeur() {
  if (!SV) { SV = await import("./serveur.js?v=" + VER); SV.langue(LANGUE === "en" ? "en" : "fr");
    SV.surCompte(async u => { CL.u = u; if (u) { stocker("clubCompte", "1"); await rafraichir(); proposerRestauration(); sauvegardeAuto(); } else { CL.clubs = []; CL.attente = []; } if (ecranCourant === "clubs") rendu(); majCarteClubs(); }); }
  return SV;
}
async function rafraichir() { try { Object.assign(CL, await SV.mesClubs()); } catch (e) {} }
async function ouvrirClubs(vue) {
  stop(); if (vue) Object.assign(CL, vue);
  $("clCorps").innerHTML = `<p class="vide">${L("Connexion au serveur…", "Connecting…")}</p>`; ecran("clubs", () => scrollTo(0, 0));
  try { await chargerServeur(); } catch (e) { $("clCorps").innerHTML = `<p class="vide">📡 ${L("Les clubs ont besoin d’internet. Vérifie ta connexion et réessaie.", "Clubs need internet. Check your connection and try again.")}</p><button class="toggle" id="clReessai">${L("Réessayer", "Retry")}</button>`; $("clReessai").onclick = () => ouvrirClubs(); return; }
  if (CL.u) await rafraichir().catch(() => {});   // sections et rôles à jour (le coach a pu en créer)
  if (CL.u !== undefined) rendu();
}
$("clRetour").onclick = () => { stop(); if (CL.vue === "club") { CL.vue = "liste"; CL.c = null; retour(() => rendu()); } else retour(() => ecran("menu")); };

function rendu() {
  stop(); const C = $("clCorps");
  $("clTitre").textContent = CL.vue === "club" && club() ? club().nom : L("Clubs", "Clubs");
  $("clSub").textContent = CL.vue === "club" && club() ? [club().sport, L(...ROLES[club().role])].filter(Boolean).join(" · ") : L("Ton coach publie les séances, tout le club s’entraîne et discute ici.", "Your coach posts workouts, the whole club trains and chats here.");
  if (!CL.u) return renduCompte(C, "inscription");
  if (rejoindre) return renduRejoindre(C);
  if (CL.vue === "club" && club()) return renduClub(C);
  CL.vue = "liste";
  C.innerHTML = `${CL.clubs.length ? "" : `<p class="sh-aide cl-intro">${L("Rejoins le club de ton coach avec son lien ou son QR code, ou crée ton club si c’est toi le coach.", "Join your coach’s club with their link or QR code, or create your club if you are the coach.")}</p>`}
    <div class="choices">${CL.clubs.map(c => `<button class="choice cl-club" style="--c:${couleurPseudo(c.nom)}" data-club="${c.id}"><strong>${echap(c.nom)}${nonLu(c.id) ? ` <i class="cl-point" aria-label="${L("nouveaux messages", "new messages")}"></i>` : ""}</strong><span>${[echap(c.sport), L(...ROLES[c.role])].filter(Boolean).join(" · ")}</span></button>`).join("")}
      ${(CL.retraits || []).map(c => `<div class="carnet cl-attente">🚫 <b>${echap(c.nom)}</b><small>${L("L’équipe du club t’a retiré du club · motif : ", "The club staff removed you · reason: ")}${echap(motifLisible(c.motif))}</small><button class="lien" data-retrait="${c.id}">${L("J’ai compris", "Got it")}</button></div>`).join("")}
      ${CL.attente.map(c => `<div class="carnet cl-attente">⏳ <b>${echap(c.nom) || L("Club", "Club")}</b><small>${L("Demande envoyée : en attente de validation par le coach.", "Request sent: waiting for the coach to approve.")}</small></div>`).join("")}
      <button class="choice" style="--c:#16A34A" id="clRejoindre"><strong>＋ ${L("Rejoindre un club", "Join a club")}</strong><span>${L("Avec le lien ou le QR code du coach", "With the coach’s link or QR code")}</span></button>
      <button class="choice" style="--c:var(--brand)" id="clCreer"><strong>${L("Créer mon club", "Create my club")}</strong><span>${L("Tu deviens coach : publie des séances, suis ton groupe, discute", "You become the coach: post workouts, follow your group, chat")}</span></button></div>
    <h2 class="sec">☁️ ${L("Sauvegarde en ligne", "Online backup")}</h2><div class="carnet cl-compte" id="svCarte"><small>…</small></div>
    <h2 class="sec">${L("Mon compte", "My account")}</h2><div class="carnet cl-compte"><p><b style="color:${couleurPseudo(CL.u.pseudo)}">${echap(CL.u.pseudo)}</b><small>${echap(CL.u.email)}</small></p>
      <div class="partage-btns"><button class="toggle contour" id="clDeco">${L("Se déconnecter", "Sign out")}</button><button class="toggle contour cl-danger" id="clSuppr">${L("Supprimer mon compte", "Delete my account")}</button></div></div>`;
  C.querySelectorAll("[data-club]").forEach(b => b.onclick = () => { CL.vue = "club"; CL.c = b.dataset.club; CL.onglet = "seances"; ecran("clubs", rendu); scrollTo(0, 0); });
  C.querySelectorAll("[data-retrait]").forEach(b => b.onclick = async () => { await SV.lireRetrait(b.dataset.retrait); CL.retraits = CL.retraits.filter(x => x.id !== b.dataset.retrait); rendu(); });
  $("clRejoindre").onclick = feuilleRejoindre; $("clCreer").onclick = feuilleCreer;
  $("clDeco").onclick = async () => { await SV.deconnexion(); try { localStorage.removeItem("clubCompte"); } catch (e) {} };
  $("clSuppr").onclick = feuilleSupprimerCompte;
  renduSauvegarde();
}

/* --- Sauvegarde en ligne du suivi (facultative) : le même contenu que le fichier de sauvegarde, envoyé automatiquement après
   chaque séance et au plus une fois par jour à l'ouverture. Consentement explicite, car le suivi peut contenir des informations
   de santé (poids, programmes de reprise après blessure). Désactivable à tout moment : la copie en ligne est alors effacée. --- */
const svActive = () => lire("sauvegardeEnLigne") === "1";
const fichierSuivi = () => JSON.stringify({ app: "2WORK", version: 1, date: new Date().toISOString(), donnees: donneesAppli() });
let svDernier = 0;
async function sauvegardeAuto(force) {
  if (!svActive() || !SV || !CL.u || (!force && Date.now() - svDernier < 6e5)) return;
  svDernier = Date.now(); try { await SV.sauverEnLigne(fichierSuivi()); stocker("sauvegardeEnLigneDate", new Date().toISOString()); } catch (e) {}
}
const apresSeance = () => sauvegardeAuto(true);
async function renduSauvegarde() {
  const Z = $("svCarte"); if (!Z) return;
  const ko = t => { Z.querySelector(".cl-erreur").textContent = t; };
  if (!svActive()) {
    Z.innerHTML = `<p>${L("Retrouve ton historique, tes trophées, tes programmes et tes réglages sur un nouveau téléphone. Copie privée, visible par toi seul, mise à jour après chaque séance.", "Get your history, trophies, programmes and settings back on a new phone. Private copy, visible only to you, updated after each workout.")}</p>
      <label class="cl-case"><input type="checkbox" id="svAccord"><span>${L("J’accepte que mon suivi soit sauvegardé en ligne, y compris mon profil (âge, poids) et mes programmes de reprise après blessure. Je peux désactiver et effacer cette copie à tout moment.", "I agree that my progress is backed up online, including my profile (age, weight) and my back-after-injury programmes. I can turn it off and erase the copy at any time.")}</span></label>
      <p class="cl-erreur"></p><button class="toggle" id="svOn">${L("Activer la sauvegarde en ligne", "Turn on online backup")}</button>`;
    $("svOn").onclick = async () => { if (!$("svAccord").checked) return ko(L("Coche la case pour activer.", "Tick the box to turn it on."));
      $("svOn").disabled = true; stocker("sauvegardeEnLigne", "1"); try { await SV.sauverEnLigne(fichierSuivi()); stocker("sauvegardeEnLigneDate", new Date().toISOString()); renduSauvegarde(); } catch (x) { stocker("sauvegardeEnLigne", "0"); ko(msgErr(x)); $("svOn").disabled = false; } };
    return;
  }
  const info = await SV.infoSauvegarde().catch(() => null);
  Z.innerHTML = `<p>✓ <b>${L("Activée", "On")}</b> · ${info && info.t ? L("dernière copie le ", "last copy on ") + info.t.toLocaleString(LANGUE === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" }) + ` (${Math.max(1, Math.round(info.taille / 1024))} Ko)` : L("aucune copie pour l’instant", "no copy yet")}</p><p class="cl-erreur"></p>
    <div class="partage-btns"><button class="toggle" id="svMaint">${L("Sauvegarder maintenant", "Back up now")}</button>${info ? `<button class="toggle contour" id="svRest">${L("Restaurer sur ce téléphone", "Restore on this phone")}</button>` : ""}</div>
    <button class="lien" id="svOff">${L("Désactiver et effacer la copie en ligne", "Turn off and erase the online copy")}</button>`;
  $("svMaint").onclick = async () => { $("svMaint").disabled = true; try { await SV.sauverEnLigne(fichierSuivi()); renduSauvegarde(); } catch (x) { ko(x.code === "permission-denied" ? L("Une copie vient d’être faite : réessaie dans une minute.", "A copy was just made: try again in a minute.") : msgErr(x)); $("svMaint").disabled = false; } };
  if ($("svRest")) $("svRest").onclick = async () => { try { verifierRestauration(await SV.lireSauvegarde(info)); } catch (x) { ko(msgErr(x)); } };
  $("svOff").onclick = async () => { if (!$("svOff").dataset.conf) { $("svOff").dataset.conf = 1; return $("svOff").textContent = L("Confirmer : effacer la copie en ligne", "Confirm: erase the online copy"); }
    try { await SV.effacerSauvegarde(); stocker("sauvegardeEnLigne", "0"); renduSauvegarde(); } catch (x) { ko(msgErr(x)); } };
}
// nouveau téléphone (aucune séance ici) et copie en ligne trouvée : on propose de la restaurer, une seule fois
async function proposerRestauration() {
  if (lireHist().length || lire("svPropose") || !SV || !CL.u) return; stocker("svPropose", "1");
  const info = await SV.infoSauvegarde().catch(() => null); if (!info) return;
  stocker("sauvegardeEnLigne", "1"); verifierRestauration(await SV.lireSauvegarde(info));
}

/* --- Inscription et connexion --- */
function renduCompte(C, mode, apres) {   // apres : suite de l’accueil du premier lancement, une fois le compte créé ou connecté
  const ins = mode === "inscription";
  C.innerHTML = `<div class="chips cl-mode">${[["inscription", "Créer un compte", "Create an account"], ["connexion", "Se connecter", "Sign in"]].map(([k, f, e]) => `<button class="toggle" data-mode="${k}" aria-pressed="${k === mode}">${L(f, e)}</button>`).join("")}</div>
    <form class="carnet cl-form" id="clForm" novalidate>
      ${ins ? `<label class="champ"><span>${L("Pseudo (visible par les membres de tes clubs)", "Username (visible to your club members)")}</span><input id="cfPseudo" maxlength="20" autocomplete="nickname" autocapitalize="off" placeholder="${L("ex. Aidou_92", "e.g. Aidou_92")}"><small id="cfPseudoInfo" class="sh-aide"></small></label>` : ""}
      <label class="champ"><span>Email</span><input id="cfEmail" type="email" autocomplete="email" inputmode="email"></label>
      <label class="champ"><span>${L("Mot de passe", "Password")}${ins ? ` <small>${L("(8 caractères minimum, dont une minuscule et un chiffre)", "(8 characters minimum, including a lowercase letter and a digit)")}</small>` : ""}</span><input id="cfMdp" type="password" autocomplete="${ins ? "new-password" : "current-password"}" minlength="8"></label>
      ${ins ? `<label class="champ"><span>${L("Date de naissance", "Date of birth")}</span><input id="cfNais" type="date" max="${jourCle()}"></label>
        <label class="cl-case hidden" id="cfParentBloc"><input type="checkbox" id="cfParent"><span>${L("J’ai moins de 15 ans : j’ai lu ces conditions avec un parent (ou mon responsable légal) et nous sommes d’accord tous les deux pour que j’utilise les clubs.", "I am under 15: I read these terms with a parent (or legal guardian) and we both agree that I use clubs.")}</span></label>
        <label class="cl-case"><input type="checkbox" id="cfAccord"><span>${L("J’accepte les conditions d’utilisation et la politique de confidentialité : mon pseudo, mes messages et les séances que je coche sont visibles par les membres de mes clubs ; mon email et ma date de naissance restent privés.", "I accept the terms of use and the privacy policy: my username, messages and ticked workouts are visible to my club members; my email and date of birth stay private.")}</span></label>
        <p class="cl-liens">${[["cgu", "Conditions d’utilisation", "Terms of use"], ["confidentialite", "Confidentialité", "Privacy"]].map(([k, f, e]) => `<button type="button" class="lien" data-pg="${k}">${L(f, e)}</button>`).join(" · ")}</p>` : ""}
      <p class="cl-erreur" id="cfErreur" role="alert"></p>
      <button class="primary" type="submit" id="cfOk">${ins ? L("Créer mon compte", "Create my account") : L("Me connecter", "Sign in")}</button>
      ${ins ? "" : `<button class="lien-discret" type="button" id="cfOubli">${L("Mot de passe oublié ?", "Forgot password?")}</button>`}</form>
    <p class="sh-aide cl-note">${L("Le compte sert seulement aux clubs. Le reste de l’appli marche toujours sans compte, et ton suivi reste sur ton téléphone.", "The account is only for clubs. The rest of the app still works without an account, and your progress stays on your phone.")}</p>`;
  C.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => renduCompte(C, b.dataset.mode, apres));
  C.querySelectorAll("[data-pg]").forEach(b => b.onclick = () => { const [f, e, h] = PAGES[b.dataset.pg]; ouvrirFeuilleInfo(L(f, e), h()); });
  const err = t => { $("cfErreur").textContent = t; }, v = id => ($(id) ? $(id).value.trim() : "");
  if (ins) {
    let tp; $("cfPseudo").oninput = () => { clearTimeout(tp); const p = v("cfPseudo"), I = $("cfPseudoInfo");
      if (!p) return I.textContent = ""; if (!SV.PSEUDO_OK.test(p)) return I.textContent = L("3 à 20 caractères : lettres, chiffres, . _ -", "3 to 20 characters: letters, digits, . _ -");
      tp = setTimeout(async () => { I.textContent = (await SV.pseudoLibre(p).catch(() => true)) ? "✓ " + L("Disponible", "Available") : "✕ " + L("Déjà pris", "Already taken"); }, 400); };
    $("cfNais").onchange = () => $("cfParentBloc").classList.toggle("hidden", !(v("cfNais") && ageDe(v("cfNais")) < 15));
    if (lireProfil().naissance) { $("cfNais").value = lireProfil().naissance; $("cfNais").onchange(); }   // déjà donnée dans le profil
  }
  $("clForm").onsubmit = async e => {
    e.preventDefault(); err("");
    if (ins) { const n = v("cfNais");
      if (!SV.PSEUDO_OK.test(v("cfPseudo"))) return err(msgErr({ code: "2work/pseudo-format" }));
      if (!n || ageDe(n) < 4 || ageDe(n) > 110) return err(L("Indique ta date de naissance.", "Enter your date of birth."));
      if (ageDe(n) < 15 && !$("cfParent").checked) return err(L("Sous 15 ans, l’accord d’un parent est obligatoire (RGPD).", "Under 15, a parent’s consent is required (GDPR)."));
      if (!/^(?=.*[a-z])(?=.*[0-9]).{8,}$/.test($("cfMdp").value)) return err(msgErr({ code: "auth/weak-password" }));
      if (!$("cfAccord").checked) return err(L("Coche la case d’accord pour continuer.", "Tick the consent box to continue.")); }
    $("cfOk").disabled = true;
    try { ins ? await SV.inscription({ email: v("cfEmail"), mdp: $("cfMdp").value, pseudo: v("cfPseudo"), naissance: v("cfNais"), parental: ageDe(v("cfNais")) < 15 }) : await SV.connexion(v("cfEmail"), $("cfMdp").value);
      if (ins && !lireProfil().naissance) ecrireProfil("naissance", v("cfNais")); if (apres) apres(); }
    catch (x) { err(msgErr(x)); $("cfOk").disabled = false; }
  };
  if ($("cfOubli")) $("cfOubli").onclick = async () => { if (!v("cfEmail")) return err(L("Écris d’abord ton email ci-dessus.", "Type your email above first."));
    try { await SV.motDePasseOublie(v("cfEmail")); err(""); $("cfOubli").textContent = "✓ " + L("Email envoyé : suis le lien pour choisir un nouveau mot de passe.", "Email sent: follow the link to set a new password."); } catch (x) { err(msgErr(x)); } };
}
function feuilleSupprimerCompte() {
  ouvrirFeuilleInfo(L("Supprimer mon compte", "Delete my account"), `<p>${L("Ton compte, ton pseudo et ta place dans tes clubs sont supprimés. Les clubs dont tu es le coach sont supprimés avec leurs séances et leurs messages. Ton suivi sur ce téléphone n’est pas touché.", "Your account, username and club memberships are deleted. Clubs you coach are deleted with their workouts and messages. Your progress on this phone is not affected.")}</p>
    <label class="champ"><span>${L("Confirme avec ton mot de passe", "Confirm with your password")}</span><input type="password" id="csMdp" autocomplete="current-password"></label><p class="cl-erreur" id="csErr"></p><button class="primary cl-danger-plein" id="csOk">${L("Supprimer définitivement", "Delete permanently")}</button>`);
  $("csOk").onclick = async () => { $("csOk").disabled = true; try { await SV.supprimerCompte($("csMdp").value); fermerFeuille(); try { localStorage.removeItem("clubCompte"); } catch (e) {} } catch (x) { $("csErr").textContent = msgErr(x); $("csOk").disabled = false; } };
}

/* --- Créer et rejoindre --- */
function feuilleCreer() {
  ouvrirFeuilleInfo(L("Créer mon club", "Create my club"), `<label class="champ"><span>${L("Nom du club", "Club name")}</span><input id="ccNom" maxlength="40" placeholder="${L("ex. AS Rugby Lyon U18", "e.g. City Runners")}"></label>
    <label class="champ"><span>${L("Sport (facultatif)", "Sport (optional)")}</span><input id="ccSport" maxlength="30"></label>
    <label class="champ"><span>${L("Description (facultatif)", "Description (optional)")}</span><textarea id="ccDesc" class="choixVoix" rows="2" maxlength="300"></textarea></label><p class="cl-erreur" id="ccErr"></p>
    <button class="primary" id="ccOk">${L("Créer le club", "Create the club")}</button>`);
  $("ccOk").onclick = async () => { const nom = $("ccNom").value.trim(); if (nom.length < 2) return $("ccErr").textContent = L("Donne un nom au club.", "Give the club a name.");
    $("ccOk").disabled = true; try { const id = await SV.creerClub({ nom: propre(nom), sport: propre($("ccSport").value.trim()), desc: propre($("ccDesc").value.trim()), pseudo: CL.u.pseudo }); await rafraichir(); fermerFeuille(); Object.assign(CL, { vue: "club", c: id, onglet: "reglages" }); rendu(); } catch (x) { $("ccErr").textContent = msgErr(x); $("ccOk").disabled = false; } };
}
const lireLien = t => { try { const u = new URL(t.trim()); const c = u.searchParams.get("club"), k = u.searchParams.get("code"); return c && k ? { c, k } : null; } catch (e) { const m = /^([A-Za-z0-9]{10,})[\s/:-]+([a-z0-9]{6,12})$/.exec(t.trim()); return m ? { c: m[1], k: m[2] } : null; } };
function feuilleRejoindre() {
  const scan = "BarcodeDetector" in window && navigator.mediaDevices;
  ouvrirFeuilleInfo(L("Rejoindre un club", "Join a club"), `<p>${L("Le plus simple : ouvre le lien envoyé par ton coach, ou vise son QR code avec l’appareil photo du téléphone.", "Easiest: open the link your coach sent, or point your phone camera at their QR code.")}</p>
    ${scan ? `<button class="toggle" id="crScan">📷 ${L("Scanner le QR code ici", "Scan the QR code here")}</button><video id="crVideo" class="cl-scan hidden" playsinline muted></video>` : ""}
    <label class="champ"><span>${L("Ou colle le lien d’invitation", "Or paste the invite link")}</span><input id="crLien" autocomplete="off" placeholder="https://…?club=…"></label><p class="cl-erreur" id="crErr"></p><button class="primary" id="crOk">${L("Continuer", "Continue")}</button>`);
  const go = t => { const r = lireLien(t); if (!r) return $("crErr").textContent = L("Lien non reconnu : copie le lien complet envoyé par ton coach.", "Link not recognised: copy the full link your coach sent."); fermerFeuille(); rejoindre = r; rendu(); };
  $("crOk").onclick = () => go($("crLien").value);
  if (scan) $("crScan").onclick = async () => {
    const V = $("crVideo"), det = new BarcodeDetector({ formats: ["qr_code"] });
    try { V.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); } catch (e) { return $("crErr").textContent = L("Accès à la caméra refusé.", "Camera access denied."); }
    V.classList.remove("hidden"); await V.play();
    const fin = () => V.srcObject && V.srcObject.getTracks().forEach(t => t.stop());
    (async function boucle() { if (!$("crVideo")) return fin(); const r = await det.detect(V).catch(() => []); if (r[0]) { fin(); go(r[0].rawValue); } else requestAnimationFrame(boucle); })();
  };
}
async function renduRejoindre(C) {
  const { c, k } = rejoindre; C.innerHTML = `<p class="vide">${L("Vérification de l’invitation…", "Checking the invite…")}</p>`;
  if (CL.clubs.some(x => x.id === c)) { rejoindre = null; Object.assign(CL, { vue: "club", c, onglet: "seances" }); return rendu(); }
  const inv = await SV.lireInvitation(c, k).catch(() => null);
  if (!inv) { C.innerHTML = `<p class="vide">⚠️ ${L("Ce lien d’invitation n’est plus valable. Demande un nouveau lien à ton coach.", "This invite link is no longer valid. Ask your coach for a new link.")}</p><button class="toggle" id="rjRet">${L("Retour", "Back")}</button>`; $("rjRet").onclick = () => { rejoindre = null; rendu(); }; return; }
  C.innerHTML = `<div class="carnet cl-invit"><span class="cl-blason" style="--c:${couleurPseudo(inv.nom)}">${echap(inv.nom.slice(0, 2).toUpperCase())}</span><h2>${echap(inv.nom)}</h2><p>${L("Tu es invité à rejoindre ce club. Le coach validera ta demande ; ton pseudo", "You are invited to join this club. The coach will approve your request; your username")} <b>${echap(CL.u.pseudo)}</b> ${L("lui sera montré.", "will be shown to them.")}</p>
    <button class="primary" id="rjOk">${L("Demander à rejoindre", "Ask to join")}</button><button class="lien-discret" id="rjNon">${L("Annuler", "Cancel")}</button></div>`;
  $("rjNon").onclick = () => { rejoindre = null; rendu(); };
  $("rjOk").onclick = async () => { $("rjOk").disabled = true; try { await SV.demander(c, k, CL.u.pseudo, inv.nom); rejoindre = null; await rafraichir(); rendu(); } catch (x) { $("rjOk").disabled = false; $("rjOk").textContent = msgErr(x); } };
}

/* --- Un club : onglets Séances · Chat · Membres · Réglages --- */
function renduClub(C) {
  const cb = club(), O = [["seances", "Séances", "Workouts"], ["chat", "Chat", "Chat"], ["membres", "Membres", "Members"], ...(staff() ? [["suivi", "Suivi", "Tracking"]] : []), ["reglages", "Club", "Club"]];
  if (CL.onglet === "suivi" && !staff()) CL.onglet = "seances";
  C.innerHTML = `<div class="chips cl-onglets">${O.map(([k, f, e]) => `<button class="toggle" data-ong="${k}" aria-pressed="${CL.onglet === k}">${L(f, e)}${k === "chat" && nonLu(cb.id) ? ' <i class="cl-point"></i>' : ""}<span class="cl-badge hidden" id="badge_${k}"></span></button>`).join("")}</div><div id="clOng"></div>`;
  C.querySelectorAll("[data-ong]").forEach(b => b.onclick = () => { CL.onglet = b.dataset.ong; rendu(); });
  if (staff()) desab.push(SV.ecouterDemandes(cb.id, l => { const B = $("badge_membres"); if (B) { B.textContent = l.length; B.classList.toggle("hidden", !l.length); } }));
  ({ seances: ongSeances, chat: ongChat, membres: ongMembres, suivi: ongSuivi, reglages: ongReglages })[CL.onglet]($("clOng"), cb);
}

/* Séances : le staff publie (catalogue, séances enregistrées, programme), chacun lance et coche ; le staff voit qui a fait quoi */
function routineClub(s) {   // séance du club → routine locale « club_<id> » (même moteur que les favoris), pour la lancer et la cocher à la fin
  const b = ROUTINES[s.base]; if (!b) return null; const k = "club_" + s.id;
  const t = String(s.titre).replace(/[<>"'`&]/g, "").slice(0, 60);   // titre écrit par un coach : jamais de balise ni de guillemet
  ROUTINES[k] = { ...b, titre: t, titreFr: t, club: { c: CL.c, s: s.id, sec: s.sec || "", titre: t }, exercices: (s.ids || b.exercices || []).filter(i => EXERCICES[i]) };
  if (typeof CONSEILLES !== "undefined") CONSEILLES[k] = CONSEILLES[s.base] || ROUTINES[k].exercices; return k;
}
function ongSeances(Z, cb) {
  Z.innerHTML = `${staff() ? `<button class="primary cl-publier" id="spNouv">＋ ${L("Publier une séance", "Post a workout")}</button>` : ""}<div id="prevZone"></div><div id="spListe"><p class="vide">…</p></div>`;
  if (staff()) $("spNouv").onclick = () => feuillePublier(); prevCarte($("prevZone"), cb);
  const filtres = sectionsDe(cb).length && mesSections(cb).length ? [["*", L("Tout", "All")], ["", L("Club", "Club")], ...mesSections(cb).map(id => [id, nomSec(cb, id)])] : [];
  if (!filtres.some(f => f[0] === CL.filtre)) CL.filtre = "*";
  if (sectionsDe(cb).length && !staff() && !mesSections(cb).length) { $("prevZone").insertAdjacentHTML("beforebegin", `<div class="carnet cl-invite-sec"><p>🏷️ ${L("Ce club a des sections (", "This club has sections (")}${sectionsDe(cb).map(x => echap(x.nom)).join(", ")}${L(") : choisis les tiennes pour voir leurs séances et leur chat.", "): pick yours to see their workouts and chat.")}</p><button class="toggle" id="spChoisirSec">${L("Choisir", "Choose")}</button></div>`);
    $("spChoisirSec").onclick = () => feuilleSections(cb, CL.u.uid, [], async l => { await SV.changerMembre(cb.id, CL.u.uid, { sections: l }); cb.mesSec = l; rendu(); }); }
  if (filtres.length) $("prevZone").insertAdjacentHTML("afterend", `<div class="chips cl-filtre" id="spFiltre">${filtres.map(([k, n]) => `<button class="toggle" data-f="${k}" aria-pressed="${(CL.filtre ?? "*") === k}">${echap(n)}</button>`).join("")}</div>`);
  if ($("spFiltre")) $("spFiltre").onclick = e => { const b = e.target.closest("[data-f]"); if (b) { CL.filtre = b.dataset.f; rendu(); } };
  let ecoutesFaits = []; desab.push(() => ecoutesFaits.forEach(f => f()));
  desab.push(ecouterSeancesClub(cb, async tout => { const l = tout.filter(s => !filtres.length || (CL.filtre ?? "*") === "*" || s.sec === CL.filtre);
    const auj = jourCle(), av = l.filter(s => s.date >= auj).reverse(), pa = l.filter(s => s.date < auj), faits = await SV.mesFaits(cb.id, l);
    const carte = s => { const P = s.prog && PROGRAMMES.find(p => p[0] === s.prog);
      return `<div class="carnet cl-seance" data-s="${s.id}"><div class="cl-s-haut"><small>${s.sec ? `<span class="cl-sec">${echap(nomSec(cb, s.sec))}</span> ` : ""}${P ? L("Programme · ", "Programme · ") : ""}${dateLisible(s.date)}</small>${staff() ? `<button class="lien" data-sup="${s.id}" aria-label="${L("Supprimer", "Delete")}">🗑</button>` : ""}</div>
        <b>${echap(s.titre)}</b>${s.note ? `<p>${echap(s.note)}</p>` : ""}
        <div class="partage-btns"><button class="toggle" data-go="${s.id}">▶ ${P ? L("Ouvrir le programme", "Open the programme") : L("Lancer", "Start")}</button><button class="toggle contour${faits[s.id] ? " cl-fait" : ""}" data-fait="${s.id}">${faits[s.id] ? "✓ " + L("Fait", "Done") : L("Marquer comme fait", "Mark as done")}</button></div>
        ${staff() ? `<details class="cl-suivi" data-suivi="${s.id}"><summary>${L("Qui l’a faite ?", "Who did it?")} <span id="nb_${s.id}"></span></summary><div id="qui_${s.id}"></div></details>` : ""}</div>`; };
    $("spListe").innerHTML = (av.length ? `<h2 class="sec">${L("À venir", "Upcoming")}</h2>${av.map(carte).join("")}` : `<p class="vide">${L("Aucune séance prévue pour l’instant.", "No workout planned yet.")}${staff() ? "<br>" + L("Publie la première avec le bouton ci-dessus.", "Post the first one with the button above.") : ""}</p>`)
      + (pa.length ? `<h2 class="sec">${L("Passées", "Past")}</h2>${pa.slice(0, 15).map(carte).join("")}` : "");
    $("spListe").onclick = async e => { const b = e.target.closest("button"); if (!b) return; const d = b.dataset, s = l.find(x => x.id === (d.go || d.fait || d.sup));
      if (d.go) { if (s.prog) return PROGRAMMES.some(p => p[0] === s.prog) && ouvrirProg(s.prog); const k = routineClub(s); k ? ouvrirRoutine(k) : alert(L("Mets l’appli à jour pour ouvrir cette séance.", "Update the app to open this workout.")); }
      if (d.fait) { const oui = !b.classList.contains("cl-fait"); b.disabled = true; await SV.marquerFait(cb.id, s.id, CL.u.pseudo, oui, s.sec).catch(() => {}); b.disabled = false; b.classList.toggle("cl-fait", oui); b.textContent = oui ? "✓ " + L("Fait", "Done") : L("Marquer comme fait", "Mark as done"); }
      if (d.sup && b.dataset.conf) await SV.supprimerSeance(cb.id, s.id, s.sec); else if (d.sup) { b.dataset.conf = 1; b.textContent = L("Supprimer ?", "Delete?"); }
    };
    ecoutesFaits.forEach(f => f()); ecoutesFaits = [];
    if (staff()) { const mb = await new Promise(r => { const f = SV.ecouterMembres(cb.id, x => { r(x); f(); }); });
      Z.querySelectorAll("[data-suivi]").forEach(D => { const s = D.dataset.suivi; const sec = (l.find(x => x.id === s) || {}).sec, mbS = sec ? mb.filter(m => (m.sections || []).includes(sec) || ["coach", "cocoach"].includes(m.role)) : mb;
        ecoutesFaits.push(SV.ecouterFaits(cb.id, s, f => { const ok = new Set(f.map(x => x.id));
        $("nb_" + s).textContent = `${ok.size}/${mbS.length}`; $("qui_" + s).innerHTML = mbS.map(m => `<span class="cl-qui${ok.has(m.id) ? " ok" : ""}">${ok.has(m.id) ? "✓" : "✗"} ${echap(m.pseudo)}</span>`).join(""); }, sec)); }); }
  }));
}
function feuillePublier() {
  let type = "cat", choix = null, fam = null; const fav = lireFav ? lireFav() : [], MOD = modeles(club());
  // « Parcourir » : le catalogue rangé comme dans l'appli, famille par famille
  const FAM = [["ech", "🔥", "Échauffements par sport", "Warm-ups by sport", r => modeDe(r) === "echauffement"], ["sport", "💪", "Sports", "Sports", r => modeDe(r) === "seance" && r.grp && !["haut", "bas", "complet"].includes(r.grp)],
    ["corps", "🧍", "Renfo du corps", "Body strength", r => modeDe(r) === "seance" && ["haut", "bas", "complet"].includes(r.grp)], ["salle", "🏋️", "Salle de musculation", "Gym", r => modeDe(r) === "salle"], ["tabata", "⏱️", "Tabata", "Tabata", r => modeDe(r) === "tabata"],
    ["etir", "🧘", "Étirements", "Stretching", r => r.cat === "etir"], ["souffle", "🌬️", "Respiration", "Breathing", r => r.cat === "coherence"], ["rep", "🩹", "Retour après blessure", "Back after injury", r => r.blessure]];
  const famDe = r => FAM.find(f => f[4](r));
  const cats = () => Object.entries(ROUTINES).filter(([k, r]) => r.titre && !/^(club_|fav_|perso$)/.test(k)), progs = PROGRAMMES.filter(p => p[0] !== "perso");
  ouvrirFeuilleInfo(L("Publier une séance", "Post a workout"), `<div class="chips" id="pbType">${[["cat", "Parcourir", "Browse"], ["mod", "Modèles", "Templates"], ["fav", "Mes séances", "My workouts"], ["prog", "Programmes", "Programmes"]].map(([k, f, e]) => `<button class="toggle" data-t="${k}" aria-pressed="${k === type}">${L(f, e)}</button>`).join("")}</div>
    <label class="recherche"><input id="pbQ" type="search" placeholder="${L("Rechercher", "Search")}" autocomplete="off"></label><ul class="list cl-choix" id="pbListe"></ul>
    <div class="champ-duo"><label class="champ"><span id="pbDateT">${L("Date", "Date")}</span><input type="date" id="pbDate" value="${jourCle()}" min="${decaler(jourCle(), -30)}"></label><label class="champ"><span>${L("Titre affiché", "Displayed title")}</span><input id="pbTitre" maxlength="60"></label></div>
    ${sectionsDe(club()).length ? `<label class="champ"><span>${L("Pour", "For")}</span><select id="pbSec"><option value="">${L("Tout le club", "The whole club")}</option>${sectionsDe(club()).map(x => `<option value="${x.id}"${CL.filtre === x.id ? " selected" : ""}>${echap(x.nom)}</option>`).join("")}</select></label>` : ""}
    <label class="champ"><span>${L("Consigne pour le groupe (facultatif)", "Note for the group (optional)")}</span><textarea id="pbNote" class="choixVoix" rows="2" maxlength="300" placeholder="${L("ex. À faire avant l’entraînement de jeudi", "e.g. Do it before Thursday’s practice")}"></textarea></label><p class="cl-erreur" id="pbErr"></p>
    <button class="primary" id="pbOk">${L("Publier", "Post")}</button>`);
  const liste = () => { const q = plat($("pbQ").value.trim());
    if (type === "cat" && !q && !fam) { $("pbListe").innerHTML = FAM.map(f => [f, cats().filter(([, r]) => famDe(r) === f).length]).filter(x => x[1]).map(([f, n]) => `<li data-fam="${f[0]}"><span class="i-ico">${f[1]}</span><div><b>${L(f[2], f[3])}</b><small>${n} ${L("séances", "workouts")}</small></div><span class="duree">›</span></li>`).join(""); return; }
    const F = FAM.find(f => f[0] === fam), l = type === "cat" ? cats().filter(([, r]) => q || famDe(r) === F).map(([k, r]) => [k, T(r.titre), T(r.detail || "") || (q && famDe(r) ? L(famDe(r)[2], famDe(r)[3]) : "")]) : type === "mod" ? MOD.map((m, i) => ["mod:" + i, L(m[0], m[1]), L(m[3], m[4])]) : type === "fav" ? fav.filter(f => ROUTINES[f.base]).map(f => ["fav:" + f.id, propre(f.nom), T("{n} exercices", { n: f.ids.length })]) : progs.map(p => ["prog:" + p[0], L(p[1], p[2]), L(p[3], p[4])]);
    $("pbListe").innerHTML = (type === "cat" && F && !q ? `<li data-fam="" class="bloc-titre"><b>‹ ${F[1]} ${L(F[2], F[3])}</b></li>` : "") + l.filter(x => !q || plat(x[1] + " " + x[2]).includes(q)).slice(0, q ? 40 : 200).map(x => `<li data-k="${x[0]}" class="${choix === x[0] ? "cl-sel" : ""}"><div><b>${echap(x[1])}</b><small>${echap(x[2])}</small></div><span class="duree">${choix === x[0] ? "✓" : ""}</span></li>`).join("") || `<li><small>${type === "fav" ? L("Aucune séance enregistrée : crée-la d’abord dans Entraînement → Planifier ma séance.", "No saved workout: create it first in Training → Plan my workout.") : L("Aucun résultat.", "No results.")}</small></li>`;
    $("pbDateT").textContent = type === "prog" ? L("Début du programme", "Programme start") : L("Date", "Date"); };
  $("pbType").onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; type = b.dataset.t; choix = null; fam = null; $("pbType").querySelectorAll("[data-t]").forEach(x => x.setAttribute("aria-pressed", x === b)); liste(); };
  $("pbQ").oninput = liste;
  $("pbListe").onclick = e => { const f = e.target.closest("[data-fam]"); if (f) { fam = f.dataset.fam || null; liste(); $("pbListe").scrollTop = 0; return; } const li = e.target.closest("[data-k]"); if (!li) return; choix = li.dataset.k; $("pbTitre").value = li.querySelector("b").textContent; if (choix.startsWith("mod:") && !$("pbNote").value.trim()) $("pbNote").value = li.querySelector("small").textContent; liste(); };
  liste();
  $("pbOk").onclick = async () => {
    if (!choix) return $("pbErr").textContent = L("Choisis une séance dans la liste.", "Pick a workout from the list.");
    const v = { titre: propre($("pbTitre").value.trim()).slice(0, 60) || "?", date: $("pbDate").value || jourCle(), note: propre($("pbNote").value.trim()) };
    if (choix.startsWith("prog:")) v.prog = choix.slice(5); else if (choix.startsWith("mod:")) v.base = MOD[+choix.slice(4)][2]; else if (choix.startsWith("fav:")) { const f = fav.find(x => x.id === choix.slice(4)); v.base = f.base; v.ids = f.ids; } else v.base = choix;
    $("pbOk").disabled = true; try { await SV.publier(CL.c, v, $("pbSec") ? $("pbSec").value : ""); fermerFeuille(); } catch (x) { $("pbErr").textContent = msgErr(x); $("pbOk").disabled = false; }
  };
}
// fin d'une séance lancée depuis un club : cochée automatiquement (appelé par celebrer, js/progres.js)
// le serveur peut ne pas être chargé (séance reprise après redémarrage de l'appli…) : on le charge et on attend la connexion du compte (5 s au plus)
async function serveurPret() { try { await chargerServeur(); for (let i = 0; i < 20 && CL.u === undefined; i++) await new Promise(r => setTimeout(r, 250)); } catch (e) {} return !!(SV && CL.u); }
async function clubSeanceFinie(r) { if (r && r.club && lire("clubCompte") && await serveurPret()) SV.marquerFait(r.club.c, r.club.s, CL.u.pseudo, true, r.club.sec).catch(() => {}); }

/* Chat : pseudo en couleur, réponses citées, réactions, suppression, signalement ; le staff modère */
const REAC = ["👍", "❤️", "💪", "🔥", "😂"];
// mêmes contrôles que les règles du serveur (firestore.rules : poli, sansLien), pour prévenir avant l'envoi
const INSULTES = /^(?:[\s\S]*[^a-z])?(?:connard|connasse|salope|salaud|pute|encul|ntm|nique ta|niquer ta|fdp|fils de pute|batard|bâtard|pédé|negre|nègre|bougnoul|youpin|bitch|fuck|motherf|cunt|nigg|faggot|retardé mental|suicide-toi|va te pendre)/, LIEN = /(https?:\/\/|www[.]|[a-z0-9-]+[.](com|fr|net|org|io|ly|gg|me|xyz)\/)/;
const poliTexte = t => !INSULTES.test(t.toLowerCase());
// motifs de modération : toute sanction est motivée et le motif est montré à la personne concernée (DSA art. 17)
const MOTIFS = { insulte: ["Propos insultants ou harcèlement", "Insults or harassment"], spam: ["Spam ou publicité", "Spam or advertising"], illicite: ["Contenu illégal ou dangereux", "Illegal or dangerous content"], inapproprie: ["Contenu inapproprié", "Inappropriate content"], regles: ["Non-respect des règles du club", "Breaking the club rules"] };
const motifLisible = k => MOTIFS[k] ? L(...MOTIFS[k]) : k;
function choisirMotif(titre, fin) {
  ouvrirFeuilleInfo(titre, `<p class="sh-aide">${L("Choisis le motif : il sera montré à la personne concernée.", "Pick the reason: it will be shown to the person concerned.")}</p><div class="infos-liens">${Object.entries(MOTIFS).map(([k, v]) => `<button class="toggle contour" data-motif="${k}">${L(...v)}</button>`).join("")}</div>`);
  document.querySelectorAll("[data-motif]").forEach(b => b.onclick = () => { fermerFeuille(); fin(b.dataset.motif); });
}
const nonLuSal = (c, sal) => { const d = CL.der && CL.der[c + (sal ? "_" + sal : "")]; return !!(d && d.t && d.uid !== (CL.u && CL.u.uid) && d.t.toMillis() > +(lire("clubLu_" + c + (sal ? "_" + sal : "")) || 0)); };
const nonLu = c => { const cb = CL.clubs.find(x => x.id === c); return nonLuSal(c, "") || (cb ? mesSections(cb) : []).some(sal => nonLuSal(c, sal)); };
function ongChat(Z, cb) {
  const muet = cb.muet, salons = mesSections(cb); if (!salons.includes(CL.sal)) CL.sal = ""; const sal = CL.sal;
  Z.innerHTML = `${salons.length ? `<div class="chips cl-filtre" id="chSalons">${[["", L("Club", "Club")], ...salons.map(id => [id, nomSec(cb, id)])].map(([k, n]) => `<button class="toggle" data-sal="${k}" aria-pressed="${sal === k}">${echap(n)}${k !== sal && nonLuSal(cb.id, k) ? ' <i class="cl-point"></i>' : ""}</button>`).join("")}</div>` : ""}<div class="cl-chat" id="chFil"><p class="vide">…</p></div>
    <form class="cl-saisie" id="chForm">${muet ? `<p class="sh-aide">🔇 ${L("L’équipe du club t’a rendu muet", "The club staff has muted you")}${cb.motif ? L(" · motif : ", " · reason: ") + echap(motifLisible(cb.motif)) : ""}. ${L("Tu peux en parler au coach.", "You can talk to the coach about it.")}</p>` : `<p class="cl-erreur" id="chErr"></p><div class="cl-rep hidden" id="chRep"></div><textarea id="chTxt" rows="1" maxlength="1000" placeholder="${sal ? L("Écrire à la section ", "Message the section ") + echap(nomSec(cb, sal)) + "…" : L("Écrire au club…", "Message the club…")}" enterkeyhint="send"></textarea><button class="toggle" id="chEnv" aria-label="${L("Envoyer", "Send")}">➤</button>`}</form>`;
  let msgs = [], bas = true;
  desab.push(SV.ecouterMessages(cb.id, l => { msgs = l; const F = $("chFil"); if (!F) return; bas = bas || F.scrollTop + F.clientHeight > F.scrollHeight - 80;
    F.innerHTML = l.length ? l.map((m, i) => { const moi = m.uid === CL.u.uid, j = m.t && m.t.toDate ? jourCle(m.t.toDate()) : jourCle(), sep = !i || (l[i - 1].t && l[i - 1].t.toDate && jourCle(l[i - 1].t.toDate()) !== j);
      return `${sep ? `<p class="cl-jour">${dateLisible(j)}</p>` : ""}<div class="cl-msg${moi ? " moi" : ""}${m.suppr ? " efface" : ""}" data-m="${m.id}">${moi ? "" : `<b style="color:${couleurPseudo(m.pseudo)}">${echap(m.pseudo)}</b>`}
        ${m.rep ? `<q><b>${echap(m.rep.pseudo)}</b> ${echap(m.rep.extrait)}</q>` : ""}<p>${m.suppr ? (m.motif ? L("Retiré par l’équipe du club · motif : ", "Removed by the club staff · reason: ") + echap(motifLisible(m.motif)) : L("Message supprimé par son auteur", "Message deleted by its author")) : echap(m.texte).replace(/\n/g, "<br>")}</p><small>${heure(m.t)}</small>
        ${Object.entries(m.reac || {}).filter(([, u]) => u.length).map(([e, u]) => `<button class="cl-reac${u.includes(CL.u.uid) ? " moi" : ""}" data-r="${e}">${e} ${u.length}</button>`).join("")}</div>`; }).join("")
      : `<p class="vide">${L("Aucun message. Lance la discussion !", "No messages yet. Start the conversation!")}</p>`;
    if (bas) requestAnimationFrame(() => { F.scrollTop = F.scrollHeight; }); bas = false;
    if (l.length) { stocker("clubLu_" + cb.id + (sal ? "_" + sal : ""), Date.now()); (CL.der = CL.der || {})[cb.id + (sal ? "_" + sal : "")] = l[l.length - 1]; }
  }, sal));
  if ($("chSalons")) $("chSalons").onclick = e => { const b = e.target.closest("[data-sal]"); if (b) { CL.sal = b.dataset.sal; rendu(); } };
  if (!muet) {
    const T2 = $("chTxt"), env = async () => { const t = T2.value.trim(); if (!t) return;
      const refus = !poliTexte(t) ? L("Ce message contient un mot interdit par les règles du chat.", "This message contains a word banned by the chat rules.") : cb.role === "membre" && LIEN.test(t.toLowerCase()) ? L("Seuls le coach et les co-coachs peuvent partager des liens.", "Only the coach and co-coaches can share links.") : Date.now() - (CL.envoi || 0) < 2100 ? L("Doucement 🙂 un message toutes les 2 secondes.", "Easy 🙂 one message every 2 seconds.") : "";
      if (refus) { $("chErr").textContent = refus; return; } $("chErr").textContent = ""; CL.envoi = Date.now(); T2.value = ""; T2.style.height = ""; const rep = CL.rep; CL.rep = null; $("chRep").classList.add("hidden"); bas = true;
      try { await SV.envoyer(cb.id, t.slice(0, 1000), CL.u.pseudo, rep, sal); } catch (x) { T2.value = t; alert(msgErr(x)); } };
    $("chForm").onsubmit = e => { e.preventDefault(); env(); };
    if (CL.brouillon) { T2.value = CL.brouillon; CL.brouillon = null; T2.focus(); T2.dispatchEvent(new Event("input")); }
    T2.oninput = () => { T2.style.height = ""; T2.style.height = Math.min(120, T2.scrollHeight) + "px"; };
    T2.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); env(); } };
  }
  $("chFil").onclick = e => {
    const r = e.target.closest("[data-r]"), M = e.target.closest("[data-m]"); if (!M) return; const m = msgs.find(x => x.id === M.dataset.m); if (!m || m.suppr) return;
    if (r) return SV.reagir(cb.id, m.id, r.dataset.r, !(m.reac[r.dataset.r] || []).includes(CL.u.uid), sal).catch(() => {});
    const auteur = m.uid === CL.u.uid;
    ouvrirFeuilleInfo(L("Message", "Message"), `<p class="cl-apercu"><b>${echap(m.pseudo)}</b> ${echap(m.texte.slice(0, 140))}</p><div class="cl-emojis">${REAC.map(e => `<button data-e="${e}">${e}</button>`).join("")}</div>
      <div class="infos-liens">${muet ? "" : `<button class="toggle" id="mRep">↩ ${L("Répondre", "Reply")}</button>`}${auteur || staff() ? `<button class="toggle contour cl-danger" id="mSup">🗑 ${L("Supprimer le message", "Delete message")}</button>` : ""}${auteur ? "" : `<button class="toggle contour" id="mSig">⚑ ${L("Signaler au coach", "Report to the coach")}</button>`}</div>${auteur ? "" : `<p class="sh-aide">${L("Contenu illégal ou grave ? Écris aussi à ", "Illegal or serious content? Also write to ")}${contactLien()}.</p>`}`);
    document.querySelectorAll(".cl-emojis [data-e]").forEach(b => b.onclick = () => { fermerFeuille(); SV.reagir(cb.id, m.id, b.dataset.e, !(m.reac[b.dataset.e] || []).includes(CL.u.uid), sal).catch(() => {}); });
    if ($("mRep")) $("mRep").onclick = () => { fermerFeuille(); CL.rep = { m: m.id, pseudo: m.pseudo, extrait: m.texte.slice(0, 80) }; $("chRep").innerHTML = `↩ <b>${echap(m.pseudo)}</b> ${echap(CL.rep.extrait)} <button type="button" id="chRepX" aria-label="${L("Annuler", "Cancel")}">✕</button>`; $("chRep").classList.remove("hidden"); $("chRepX").onclick = () => { CL.rep = null; $("chRep").classList.add("hidden"); }; $("chTxt").focus(); };
    if ($("mSup")) $("mSup").onclick = () => { fermerFeuille(); auteur ? SV.effacerMessage(cb.id, m.id, "", sal).catch(x => alert(msgErr(x))) : choisirMotif(L("Retirer ce message", "Remove this message"), k => SV.effacerMessage(cb.id, m.id, k, sal).catch(x => alert(msgErr(x)))); };
    if ($("mSig")) $("mSig").onclick = async () => { await SV.signaler(cb.id, m.id, m.texte.slice(0, 200), m.pseudo, sal).catch(() => {}); $("mSig").textContent = "✓ " + L("Signalé au coach", "Reported to the coach"); $("mSig").disabled = true; };
  };
}

/* Membres : demandes à valider (staff), rôles, muet, exclusion ; chacun peut quitter */
function ongMembres(Z, cb) {
  Z.innerHTML = `<div id="mbDem"></div>${sectionsDe(cb).length && !staff() ? `<button class="toggle cl-messec" id="mbMesSec">🏷️ ${L("Mes sections", "My sections")} : ${(cb.mesSec || []).filter(id => sectionsDe(cb).some(x => x.id === id)).map(id => echap(nomSec(cb, id))).join(", ") || L("aucune", "none")} ›</button>` : ""}<ul class="list" id="mbListe"></ul><button class="toggle contour cl-danger" id="mbQuit">${cb.role === "coach" ? L("Supprimer le club (onglet Club)", "Delete the club (Club tab)") : L("Quitter le club", "Leave the club")}</button>`;
  if (staff()) desab.push(SV.ecouterDemandes(cb.id, l => { $("mbDem").innerHTML = l.length ? `<h2 class="sec">${L("Demandes", "Requests")} · ${l.length}</h2><ul class="list">${l.map(d => `<li><div><b style="color:${couleurPseudo(d.pseudo)}">${echap(d.pseudo)}</b><small>${L("veut rejoindre le club", "wants to join the club")}</small></div><button class="toggle" data-ok="${d.id}" data-p="${echap(d.pseudo)}">✓</button><button class="toggle contour" data-non="${d.id}">✕</button></li>`).join("")}</ul>` : "";
    $("mbDem").onclick = e => { const b = e.target.closest("button"); if (!b) return; b.disabled = true; (b.dataset.ok ? SV.accepter(cb.id, b.dataset.ok, b.dataset.p) : SV.refuser(cb.id, b.dataset.non)).catch(x => alert(msgErr(x))); }; }));
  let mb = [];
  desab.push(SV.ecouterMembres(cb.id, l => { mb = l.sort((a, b) => ["coach", "cocoach", "membre"].indexOf(a.role) - ["coach", "cocoach", "membre"].indexOf(b.role) || a.pseudo.localeCompare(b.pseudo));
    $("mbListe").innerHTML = `<li class="bloc-titre"><b>${l.length} ${L(l.length > 1 ? "membres" : "membre", l.length > 1 ? "members" : "member")}</b></li>` + mb.map(m => `<li data-mb="${m.id}"><div><b style="color:${couleurPseudo(m.pseudo)}">${echap(m.pseudo)}${m.id === CL.u.uid ? " " + L("(toi)", "(you)") : ""}</b><small>${L(...ROLES[m.role])}${m.muet ? " · 🔇 " + L("muet", "muted") : ""}${(m.sections || []).filter(id => sectionsDe(cb).some(x => x.id === id)).map(id => ` <span class="cl-sec">${echap(nomSec(cb, id))}</span>`).join("")}</small></div>${staff() && m.role !== "coach" && m.id !== CL.u.uid ? '<span class="duree">⋯</span>' : ""}</li>`).join(""); }));
  if ($("mbMesSec")) $("mbMesSec").onclick = () => feuilleSections(cb, CL.u.uid, cb.mesSec || [], async l => { await SV.changerMembre(cb.id, CL.u.uid, { sections: l }); cb.mesSec = l; rendu(); });
  $("mbListe").onclick = e => { const li = e.target.closest("[data-mb]"); if (!li || !staff()) return; const m = mb.find(x => x.id === li.dataset.mb); if (!m || m.role === "coach" || m.id === CL.u.uid) return;
    ouvrirFeuilleInfo(echap(m.pseudo), `<div class="infos-liens">${cb.role === "coach" ? `<button class="toggle" id="maRole">${m.role === "cocoach" ? L("Retirer le rôle de co-coach", "Remove co-coach role") : L("Nommer co-coach", "Make co-coach")}</button>` : ""}
      ${sectionsDe(cb).length ? `<button class="toggle contour" id="maSec">🏷️ ${L("Ses sections", "Their sections")}</button>` : ""}
      <button class="toggle contour" id="maMuet">${m.muet ? "🔊 " + L("Lui rendre la parole", "Unmute") : "🔇 " + L("Rendre muet dans le chat", "Mute in the chat")}</button><button class="toggle contour cl-danger" id="maExcl">${L("Exclure du club", "Remove from the club")}</button></div>`);
    const act = p => p.then(fermerFeuille).catch(x => alert(msgErr(x)));
    if ($("maSec")) $("maSec").onclick = () => { fermerFeuille(); feuilleSections(cb, m.id, m.sections || [], l => SV.changerMembre(cb.id, m.id, { sections: l })); };
    if ($("maRole")) $("maRole").onclick = () => act(SV.changerMembre(cb.id, m.id, { role: m.role === "cocoach" ? "membre" : "cocoach" }));
    $("maMuet").onclick = () => m.muet ? act(SV.changerMembre(cb.id, m.id, { muet: false, motif: "" })) : (fermerFeuille(), choisirMotif(L("Rendre muet", "Mute"), k => SV.changerMembre(cb.id, m.id, { muet: true, motif: k }).catch(x => alert(msgErr(x)))));
    $("maExcl").onclick = () => { fermerFeuille(); choisirMotif(L("Exclure ", "Remove ") + m.pseudo, k => SV.exclure(cb.id, m.id, k, cb.nom).catch(x => alert(msgErr(x)))); };
  };
  $("mbQuit").onclick = async () => { if (cb.role === "coach") { CL.onglet = "reglages"; return rendu(); }
    if (!$("mbQuit").dataset.conf) { $("mbQuit").dataset.conf = 1; return $("mbQuit").textContent = L("Confirmer : quitter le club", "Confirm: leave the club"); }
    await SV.quitter(cb.id).catch(() => {}); await rafraichir(); CL.vue = "liste"; rendu(); };
}

function feuilleSections(cb, uid, act, garder) {
  const moi = uid === CL.u.uid;
  ouvrirFeuilleInfo(moi ? L("Mes sections", "My sections") : L("Ses sections", "Their sections"), `<p class="sh-aide">${moi ? L("Coche les sections où tu t’entraînes : tu verras leurs séances et leur chat.", "Tick the sections you train in: you will see their workouts and chat.") : L("Le membre voit les séances et le chat des sections cochées.", "The member sees the workouts and chat of the ticked sections.")}</p>
    <div class="chips cl-choix-sec" id="fsSec">${sectionsDe(cb).map(x => `<button class="toggle" data-s="${x.id}" aria-pressed="${act.includes(x.id)}">${echap(x.nom)}</button>`).join("")}</div><p class="cl-erreur" id="fsErr"></p><button class="primary" id="fsOk">${L("Enregistrer", "Save")}</button>`);
  $("fsSec").onclick = e => { const b = e.target.closest("[data-s]"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); };
  $("fsOk").onclick = async () => { const l = [...$("fsSec").querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.s).slice(0, 12); $("fsOk").disabled = true;
    try { await garder(l); fermerFeuille(); } catch (x) { $("fsErr").textContent = msgErr(x); $("fsOk").disabled = false; } };
}
function reglagesSections(Z, cb) {   // staff : ajouter, renommer ou supprimer une section (12 au plus)
  const l = sectionsDe(cb).map(x => ({ ...x }));
  Z.innerHTML = `<h2 class="sec">🏷️ ${L("Sections du club", "Club sections")}</h2><div class="carnet cl-form"><p class="sh-aide">${L("Pour un club à plusieurs disciplines ou groupes (ex. boxe anglaise, MMA, JJB, boxe thaï, kick-boxing ; ou U13, U15, seniors). Chaque section a ses séances et son chat, visibles seulement de ses membres et du staff ; chaque membre coche les siennes dans l’onglet Membres.", "For a club with several disciplines or groups (e.g. boxing, MMA, BJJ, Muay Thai, kickboxing; or U13, U15, seniors). Each section has its own workouts and chat, visible only to its members and staff; each member ticks theirs in the Members tab.")}</p>
    <ul class="list" id="secListe">${l.map(x => `<li><div><b>${echap(x.nom)}</b></div><button class="lien" data-ren="${x.id}">✏️</button><button class="lien" data-sup="${x.id}" aria-label="${L("Supprimer", "Delete")}">🗑</button></li>`).join("") || `<li><small>${L("Aucune section : tout le club est ensemble.", "No sections: the whole club is together.")}</small></li>`}</ul>
    ${l.length < 12 ? `<div class="cl-ajout"><input id="secNom" class="choixVoix" maxlength="30" placeholder="${L("Nouvelle section, ex. MMA", "New section, e.g. MMA")}"><button class="toggle" id="secAjout">＋</button></div>` : ""}<p class="cl-erreur" id="secErr"></p></div>`;
  const garder = async nl => { try { await SV.modifierClub(cb.id, { sections: nl }); cb.sections = nl; reglagesSections(Z, cb); } catch (x) { $("secErr").textContent = msgErr(x); } };
  if ($("secAjout")) $("secAjout").onclick = () => { const n = propre($("secNom").value.trim()).slice(0, 30); if (!n) return;
    if (l.some(x => plat(x.nom) === plat(n))) return $("secErr").textContent = L("Cette section existe déjà.", "This section already exists.");
    garder([...l, { id: (plat(n).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "s") + "-" + Math.random().toString(36).slice(2, 6), nom: n }]); };
  $("secListe").onclick = async e => { const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ren) { const x = l.find(y => y.id === b.dataset.ren), n = prompt(L("Nouveau nom", "New name"), x.nom); if (n && propre(n.trim())) { x.nom = propre(n.trim()).slice(0, 30); garder(l); } return; }
    if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = L("Confirmer", "Confirm"); $("secErr").textContent = L("Supprimer la section efface ses séances et son chat.", "Deleting the section erases its workouts and chat."); return; }
    b.disabled = true; b.textContent = "…"; try { await SV.supprimerSection(cb.id, b.dataset.sup); } catch (x) { b.disabled = false; b.textContent = "🗑"; return $("secErr").textContent = L("Suppression interrompue (connexion ?) : la section est gardée, réessaie.", "Deletion interrupted (connection?): the section is kept, try again."); } garder(l.filter(x => x.id !== b.dataset.sup)); };
}

/* Réglages du club : lien d'invitation + QR code (staff), signalements, nom ; suppression (coach) */
function ongReglages(Z, cb) {
  Z.innerHTML = `${cb.desc ? `<p class="cl-desc">${echap(cb.desc)}</p>` : ""}${staff() ? `<h2 class="sec">${L("Inviter des membres", "Invite members")}</h2><div class="carnet cl-inv"><div id="rgQr" class="cl-qr"></div><p class="sh-aide">${L("Montre ce QR code ou envoie le lien. Chaque demande arrive dans l’onglet Membres, à valider.", "Show this QR code or send the link. Each request arrives in the Members tab for approval.")}</p><input id="rgLien" readonly>
      <div class="partage-btns"><button class="toggle" id="rgPart">${L("Partager le lien", "Share the link")}</button><button class="toggle contour" id="rgNeuf">${L("Nouveau lien", "New link")}</button></div></div>
    <div id="rgSig"></div><div id="rgSections"></div><h2 class="sec">${L("Infos du club", "Club info")}</h2><div class="carnet cl-form"><label class="champ"><span>${L("Nom", "Name")}</span><input id="rgNom" maxlength="40" value="${echap(cb.nom)}"></label><label class="champ"><span>${L("Sport", "Sport")}</span><input id="rgSport" maxlength="30" value="${echap(cb.sport)}"></label><label class="champ"><span>${L("Description", "Description")}</span><textarea id="rgDesc" class="choixVoix" rows="2" maxlength="300">${echap(cb.desc)}</textarea></label><button class="toggle" id="rgSauve">${L("Enregistrer", "Save")}</button></div>` : ""}
    <div id="rgPrev"></div>${cb.role === "coach" ? `<button class="toggle contour cl-danger" id="rgSuppr">${L("Supprimer le club", "Delete the club")}</button><p class="sh-aide">${L("Supprime le club, ses séances et tous ses messages, pour tous les membres.", "Deletes the club, its workouts and all its messages, for every member.")}</p>` : `<button class="toggle contour cl-danger" id="rgQuit">${L("Quitter le club", "Leave the club")}</button>`}`;
  if ($("rgQuit")) $("rgQuit").onclick = () => { CL.onglet = "membres"; rendu(); setTimeout(() => $("mbQuit").click(), 300); };
  if ($("rgSuppr")) $("rgSuppr").onclick = async () => { const b = $("rgSuppr"); if (!b.dataset.conf) { b.dataset.conf = 1; return b.textContent = L("Confirmer la suppression définitive", "Confirm permanent deletion"); }
    b.disabled = true; b.textContent = L("Suppression…", "Deleting…"); try { await SV.supprimerClub(cb.id); await rafraichir(); CL.vue = "liste"; rendu(); } catch (x) { b.textContent = msgErr(x); } };
  prevReglages($("rgPrev"), cb);
  if (!staff()) return;
  reglagesSections($("rgSections"), cb);
  const lien = k => `${location.origin}${location.pathname}?club=${cb.id}&code=${k}`;
  const montrer = async k => { $("rgLien").value = lien(k); $("rgQr").innerHTML = await qrSvg(lien(k)).catch(() => ""); };
  SV.invitation(cb.id).then(k => k ? montrer(k) : SV.nouvelleInvitation(cb.id, cb.nom).then(montrer));
  $("rgPart").onclick = () => partagerLien(L(`Rejoins le club ${cb.nom} sur 2 WORK :`, `Join the club ${cb.nom} on 2 WORK:`), $("rgLien").value, $("rgPart"));
  $("rgNeuf").onclick = async () => { if (!$("rgNeuf").dataset.conf) { $("rgNeuf").dataset.conf = 1; return $("rgNeuf").textContent = L("L’ancien lien ne marchera plus : confirmer", "The old link will stop working: confirm"); } montrer(await SV.nouvelleInvitation(cb.id, cb.nom)); $("rgNeuf").textContent = "✓"; };
  $("rgSauve").onclick = async () => { const v = { nom: propre($("rgNom").value.trim()).slice(0, 40) || cb.nom, sport: propre($("rgSport").value.trim()), desc: propre($("rgDesc").value.trim()) };
    try { await SV.modifierClub(cb.id, v); Object.assign(cb, v); $("rgSauve").textContent = "✓ " + L("Enregistré", "Saved"); $("clTitre").textContent = v.nom; } catch (x) { $("rgSauve").textContent = msgErr(x); } };
  desab.push(SV.ecouterSignalements(cb.id, l => { $("rgSig").innerHTML = l.length ? `<h2 class="sec">⚑ ${L("Messages signalés", "Reported messages")} · ${l.length}</h2><ul class="list">${l.map(r => `<li><div><b>${echap(r.auteur)}${r.sal ? " · " + echap(nomSec(cb, r.sal)) : ""}</b><small>${echap(r.extrait)}</small></div><button class="toggle contour cl-danger" data-del="${r.m}" data-sal="${r.sal || ""}" data-r="${r.id}">🗑</button><button class="toggle contour" data-ok="${r.id}">${L("Garder", "Keep")}</button></li>`).join("")}</ul>` : "";
    $("rgSig").onclick = async e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.del) return choisirMotif(L("Retirer ce message", "Remove this message"), async k => { await SV.effacerMessage(cb.id, b.dataset.del, k, b.dataset.sal).catch(() => {}); await SV.classerSignalement(cb.id, b.dataset.r).catch(() => {}); }); await SV.classerSignalement(cb.id, b.dataset.ok).catch(() => {}); }; }));
}
// QR code dessiné sur place (bibliothèque libre « qrcode-generator », hébergée avec l'appli et chargée seulement ici)
async function qrSvg(t) {
  if (!window.qrcode) await new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "js/qrcode.js?v=" + VER; s.onload = ok; s.onerror = ko; document.head.append(s); });
  const q = qrcode(0, "M"); q.addData(t); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

/* --- Carte de l'accueil : prochaine séance du club et messages non lus --- */
async function majCarteClubs() {
  const Z = $("clubCarte"); if (!Z) return;
  const vide = `<button class="sc-corps" style="--c:#2563EB" id="clubGo"><span class="sc-ico">👥</span><span><strong>${L("Clubs", "Clubs")}</strong><small>${L("Rejoins le club de ton coach ou crée le tien", "Join your coach’s club or create your own")}</small></span></button>`;
  if (!lire("clubCompte") || !CL.u) { Z.innerHTML = vide; $("clubGo").onclick = () => ouvrirClubs(); if (lire("clubCompte") && CL.u === undefined) chargerServeur().catch(() => {}); return; }
  if (!CL.clubs.length) { Z.innerHTML = vide; $("clubGo").onclick = () => ouvrirClubs(); return; }
  const auj = jourCle(), info = await Promise.all(CL.clubs.slice(0, 3).map(async c => ({ c, p: (await SV.prochaines(c.id, auj, mesSections(c)))[0], m: await SV.dernierMessage(c.id), ms: await Promise.all(mesSections(c).map(async sal => [c.id + "_" + sal, await SV.dernierMessage(c.id, sal)])) })));
  CL.der = Object.fromEntries(info.flatMap(x => [[x.c.id, x.m], ...x.ms]));
  Z.innerHTML = `<button class="sc-corps" style="--c:#2563EB" id="clubGo"><span class="sc-ico">👥</span><span><strong>${info.map(x => echap(x.c.nom) + (nonLu(x.c.id) ? ' <i class="cl-point"></i>' : "")).join(" · ")}</strong><small>${info.filter(x => x.p).map(x => `${dateLisible(x.p.date)} : ${echap(x.p.titre)}`).join(" · ") || L("Pas de séance prévue", "No workout planned")}</small></span></button>`;
  $("clubGo").onclick = () => CL.clubs.length === 1 ? ouvrirClubs({ vue: "club", c: CL.clubs[0].id, onglet: nonLu(CL.clubs[0].id) ? "chat" : "seances" }) : ouvrirClubs({ vue: "liste" });
}
$("semaineCarte").insertAdjacentHTML("afterend", `<div class="semaine-carte" id="clubCarte"></div>`);
// lien d'invitation ouvert (…?club=…&code=…) : on va droit aux clubs, après connexion si besoin
{ const p = new URLSearchParams(location.search); if (p.get("club") && p.get("code")) { rejoindre = { c: p.get("club"), k: p.get("code") }; history.replaceState(null, "", location.pathname); } }
const rejoindreEnAttente = () => !!rejoindre;
