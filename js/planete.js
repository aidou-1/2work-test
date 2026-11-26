/* ============ PLANÈTE TITANE ============
   Style Titane : toucher le fond de l'accueil (hors boutons et cartes) fait plonger vers l'astre à anneau,
   puis atterrir sur une planète polaire (fonds/polaire.webp, rendu 3D calculé hors ligne par outils/polaire.py).
   Purement visuel : rien n'est enregistré. */
function plonger() {
  const a = document.querySelector(".eau .astre"), r = a ? a.getBoundingClientRect() : { left: innerWidth * .6, top: 90, width: 0, height: 0 }, H = document.documentElement;
  // le zoom part du centre de l'astre, où qu'il soit sur l'écran (téléphone ou ordinateur)
  H.style.setProperty("--ox", r.left + r.width / 2 + "px"); H.style.setProperty("--oy", r.top + r.height / 2 + "px");
  let P = $("planete");
  if (!P) {
    const flocons = Array.from({ length: 70 }, (_, i) => `<i style="left:${i * 73 % 100}%;--s:${1.5 + i * 37 % 7 * .5}px;--o:${.45 + i % 5 / 10};animation-duration:${6 + i * 53 % 9}s;animation-delay:-${i * 29 % 13 / 2}s"></i>`).join("");
    document.body.insertAdjacentHTML("beforeend", `<section id="planete" class="planete" role="dialog" aria-modal="true" aria-label="${L("Planète Titane", "Planet Titanium")}" hidden>
      <div class="pl-scene"><img src="fonds/polaire.webp" alt=""><div class="pl-brume"></div><div class="pl-brume b2"></div><div class="pl-neige" aria-hidden="true">${flocons}</div></div><div class="pl-flash" aria-hidden="true"></div>
      <div class="pl-ui"><div><span class="pl-tag">${L("Base 2 WORK · pôle nord", "2 WORK base · north pole")}</span><h1>${L("Planète Titane", "Planet Titanium")}</h1><p>${L("−38 °C, vent de 40 km/h. Une lueur filtre du rocher : ta séance t’attend dans la grotte.", "−38 °C, 40 km/h wind. A glow seeps from the rock: your workout is waiting in the cave.")}</p></div>
      <div class="pl-btns"><button class="primary" id="plGo">${L("Entrer dans la grotte", "Enter the cave")}</button><button class="toggle contour" id="plRetour">${L("Revenir à l’accueil", "Back to home")}</button></div></div></section>`);
    P = $("planete");
    $("plRetour").onclick = () => remonter();
    // la grotte mène à l'entraînement
    $("plGo").onclick = () => { remonter(true); $("mSeance").click(); };
  }
  P.hidden = false; H.classList.add("plonge");
  requestAnimationFrame(() => requestAnimationFrame(() => P.classList.add("on")));
  setTimeout(() => $("plRetour").focus({ preventScroll: true }), 2600);
}
function remonter(vite) {
  const P = $("planete"), H = document.documentElement; if (!P) return;
  P.classList.remove("on"); H.classList.remove("plonge");
  setTimeout(() => { P.hidden = true; }, vite ? 0 : 900);
}
document.addEventListener("click", e => {
  if (document.documentElement.dataset.style !== "titane" || ecranCourant !== "menu" || document.documentElement.classList.contains("plonge")) return;
  if (e.target.closest("button, a, input, select, textarea, label, nav, .tableau, .choices, .semaine-carte, .carnet, .feuille-fond, #banniere")) return;
  plonger();
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.documentElement.classList.contains("plonge")) remonter(); });
