/* ============ PLANÈTE TITANE ============
   Style Titane : chaque parcours a son lieu (fonds/polaire-*.webp, images finales retouchées à partir des rendus de outils/polaire.py et outils/anneaux.py) :
   Échauffements = plaine du pic, Entraînement = dans les anneaux (outils/anneaux.py), Retour au calme = lac gelé à bulles sous l'aurore.
   Le fond change en fondu, sans autre transition ; les écrans principaux (accueil, progrès…) gardent l'espace. */
const PL_LIEUX = { mEch: "pic", mSeance: "anneaux", mCalme: "lac" };
const PL_ECRANS = ["menu", "progres", "progs", "prog", "outils", "outil", "moi", "reglages", "accueil", "bienvenue", "clubs", "recap", "profil", "planning", "page", "infos", "muscle"];
function lieuPolaire(l) {
  const H = document.documentElement;
  if (!$("polaire")) {
    // flocons répartis de façon stable : taille, opacité, vitesse et départ différents
    const fl = Array.from({ length: 60 }, (_, i) => `<i style="left:${i * 73 % 100}%;--s:${1.5 + i * 37 % 7 * .5}px;--o:${.4 + i % 5 / 10};animation-duration:${7 + i * 53 % 9}s;animation-delay:-${i * 29 % 13 / 2}s"></i>`).join("");
    // débris en orbite dans les anneaux : taille, vitesse, hauteur et flou différents donnent la profondeur
    const debris = `<p class="pl-debris">${Array.from({ length: 9 }, (_, i) => `<img src="fonds/eclat${i % 6 + 1}.webp" alt="" style="--t:${18 + i * 7 % 23}s;--d:-${i * 5.3 % 30}s;--y:${28 + i * 37 % 46}vh;--s:${[14, 22, 34, 48, 26, 18, 70, 30, 40][i]}px;--f:${i === 6 ? 3 : i % 4 === 3 ? 1 : 0}px;--r:${i % 2 ? 1 : -1}">`).join("")}</p>`;
    // effets calés sur l'image : le cadre a ses proportions et la recouvre comme elle (pourcentages = positions dans l'image)
    const etoiles = Array.from({ length: 14 }, (_, i) => `<em style="left:${i * 61 % 97}%;top:${i * 43 % 58}%;--d:-${i * 0.7 % 4}s;--t:${2.5 + i % 4}s"></em>`).join("");
    const cadre = `<div class="pl-cadre"><i class="pl-fente"></i><i class="pl-blizzard"></i><i class="pl-blizzard b2"></i><i class="pl-aurore"></i><i class="pl-reflet"></i>${etoiles}</div>`;
    document.body.insertAdjacentHTML("afterbegin", `<div class="polaire" id="polaire" aria-hidden="true">${Object.values(PL_LIEUX).map(v => `<img data-l="${v}" alt="">`).join("")}<b></b><b class="b2"></b><span>${fl}</span>${debris}${cadre}</div>`);
  }
  // image chargée au premier passage seulement (hors ligne : déjà en cache)
  if (l) { const im = document.querySelector(`#polaire img[data-l="${l}"]`); if (!im.src) im.src = `fonds/polaire-${l}.webp`; H.dataset.lieu = l; }
  H.classList.toggle("polaire-on", !!l);
}
document.addEventListener("click", e => { const b = e.target.closest("#mEch, #mSeance, #mCalme"); if (b && document.documentElement.dataset.style === "titane") lieuPolaire(PL_LIEUX[b.id]); }, true);
const afficherEcran0 = afficherEcran;
afficherEcran = function (nom) { if (PL_ECRANS.includes(nom)) lieuPolaire(""); return afficherEcran0.apply(this, arguments); };
