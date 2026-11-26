/* ============ PLANÈTE TITANE ============
   Style Titane : chaque parcours a son lieu sur la planète polaire (rendus 3D par outils/polaire.py) :
   Échauffements = plaine du pic, Entraînement = crêtes, Retour au calme = lac gelé sous l'aurore.
   Le fond change en fondu, sans autre transition ; les écrans principaux (accueil, progrès…) gardent l'espace. */
const PL_LIEUX = { mEch: "pic", mSeance: "crete", mCalme: "lac" };
const PL_ECRANS = ["menu", "progres", "progs", "prog", "outils", "outil", "moi", "reglages", "accueil", "bienvenue", "clubs", "recap", "profil", "planning", "page", "infos", "muscle"];
function lieuPolaire(l) {
  const H = document.documentElement;
  if (!$("polaire")) {
    // flocons répartis de façon stable : taille, opacité, vitesse et départ différents
    const fl = Array.from({ length: 60 }, (_, i) => `<i style="left:${i * 73 % 100}%;--s:${1.5 + i * 37 % 7 * .5}px;--o:${.4 + i % 5 / 10};animation-duration:${7 + i * 53 % 9}s;animation-delay:-${i * 29 % 13 / 2}s"></i>`).join("");
    document.body.insertAdjacentHTML("afterbegin", `<div class="polaire" id="polaire" aria-hidden="true">${Object.values(PL_LIEUX).map(v => `<img data-l="${v}" alt="">`).join("")}<b></b><b class="b2"></b><span>${fl}</span></div>`);
  }
  // image chargée au premier passage seulement (hors ligne : déjà en cache)
  if (l) { const im = document.querySelector(`#polaire img[data-l="${l}"]`); if (!im.src) im.src = `fonds/polaire-${l}.webp`; H.dataset.lieu = l; }
  H.classList.toggle("polaire-on", !!l);
}
document.addEventListener("click", e => { const b = e.target.closest("#mEch, #mSeance, #mCalme"); if (b && document.documentElement.dataset.style === "titane") lieuPolaire(PL_LIEUX[b.id]); }, true);
const afficherEcran0 = afficherEcran;
afficherEcran = function (nom) { if (PL_ECRANS.includes(nom)) lieuPolaire(""); return afficherEcran0.apply(this, arguments); };
