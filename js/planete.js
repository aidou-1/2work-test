/* ============ PLANÈTE TITANE ============
   Style Titane : Échauffements, Entraînement et Retour au calme se passent sur une planète polaire (fonds/polaire.webp,
   rendu par outils/polaire.py). Toucher l'un des trois plonge vers l'astre à anneau puis atterrit ; revenir à un écran
   principal (accueil, progrès, outils…) remonte vers l'espace. Purement visuel : rien n'est enregistré. */
const PL_ECRANS = ["menu", "progres", "progs", "prog", "outils", "outil", "moi", "reglages", "accueil", "bienvenue", "clubs", "recap", "profil", "planning", "page", "infos", "muscle"];
const plCalme = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const plTitane = () => document.documentElement.dataset.style === "titane";
function fondPolaire() {
  if ($("polaire")) return;
  // flocons répartis de façon stable : taille, opacité, vitesse et départ différents
  const fl = Array.from({ length: 60 }, (_, i) => `<i style="left:${i * 73 % 100}%;--s:${1.5 + i * 37 % 7 * .5}px;--o:${.4 + i % 5 / 10};animation-duration:${7 + i * 53 % 9}s;animation-delay:-${i * 29 % 13 / 2}s"></i>`).join("");
  document.body.insertAdjacentHTML("afterbegin", `<div class="polaire" id="polaire" aria-hidden="true"><img src="fonds/polaire.webp" alt=""><b></b><b class="b2"></b><span>${fl}</span></div><div class="pl-flash" aria-hidden="true"></div>`);
}
// accueil → planète : zoom vers le centre de l'astre, voile de brume, puis l'écran demandé se pose sur la neige
function plonger(suite) {
  const H = document.documentElement, a = document.querySelector(".eau .astre"), r = a ? a.getBoundingClientRect() : { left: innerWidth * .6, top: 90, width: 0, height: 0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, m = document.querySelector("main").getBoundingClientRect();
  // origine du zoom : l'astre, en coordonnées de l'écran (fond fixe) et de la page (contenu, même défilé)
  H.style.setProperty("--ox", cx + "px"); H.style.setProperty("--oy", cy + "px"); H.style.setProperty("--mox", cx - m.left + "px"); H.style.setProperty("--moy", cy - m.top + "px");
  fondPolaire();
  if (plCalme()) { H.classList.add("polaire-on"); suite(); return; }
  H.classList.add("plonge");
  // la planète apparaît déjà derrière la brume, pour qu'aucun écran noir ne passe
  setTimeout(() => H.classList.add("polaire-on"), 450);
  setTimeout(() => { H.classList.add("polaire-on", "atterrit"); H.classList.remove("plonge"); suite(); scrollTo(0, 0); }, 950);
  setTimeout(() => H.classList.remove("atterrit"), 2000);
}
// planète → écran principal : la planète s'efface et l'accueil revient du fond de l'astre
function remonter() {
  const H = document.documentElement; if (!H.classList.contains("polaire-on")) return;
  H.classList.remove("polaire-on");
  if (!plCalme()) { H.classList.add("remonte"); setTimeout(() => H.classList.remove("remonte"), 1000); }
}
// les trois portes de l'accueil : la plongée passe avant leur action habituelle
document.addEventListener("click", e => {
  const b = e.target.closest("#mEch, #mSeance, #mCalme");
  if (!b || !plTitane() || plonger.encours || document.documentElement.classList.contains("polaire-on")) return;
  e.stopPropagation(); e.preventDefault(); plonger.encours = true;
  // la plongée tient lieu de transition : pas de seconde animation d'écran par-dessus
  plonger(() => { sansAnim = true; try { b.click(); } finally { sansAnim = false; plonger.encours = false; } });
}, true);
const afficherEcran0 = afficherEcran;
afficherEcran = function (nom) { if (PL_ECRANS.includes(nom) || !plTitane()) remonter(); return afficherEcran0.apply(this, arguments); };
