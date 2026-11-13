/* ============ CHRONOS SPÉCIALISÉS : test navette et mode combat ============
   Tous deux calés sur l'horloge du téléphone (justes même après un passage en arrière-plan) et arrêtés dès qu'on quitte l'écran (tMin).
   Test navette : allers-retours entre deux repères à 20 m, au rythme des bips ; palier 1 à 8,5 km/h, puis + 0,5 km/h chaque minute.
   La vitesse du dernier palier tenu en entier donne une estimation de la vitesse maximale aérobie (VMA), gardée dans « tests » (id « navette »). */
const vNav = p => 8 + p * .5;
const derniereVma = () => { const l = lireTests().filter(x => x.id === "navette"); return l.length ? l[l.length - 1].v : 0; };
const alluresVma = (v = derniereVma()) => v ? L(`Tes allures d’après ton test (VMA ${v} km/h) : facile vers ${(v * .6).toFixed(1)} km/h, soutenu vers ${(v * .92).toFixed(1)} km/h, sprint au-dessus de ${(v * 1.1).toFixed(1)} km/h.`, `Your paces from your test (top aerobic speed ${v} km/h): easy around ${(v * .6).toFixed(1)} km/h, hard around ${(v * .92).toFixed(1)} km/h, sprint above ${(v * 1.1).toFixed(1)} km/h.`) : "";
function ouvrirNavette() {
  clearInterval(tMin); let t0 = 0, pal = 0, nav = -1;
  outil(L("Test navette", "Shuttle test"), L("Estime ta vitesse maximale aérobie (VMA) : elle sert ensuite à régler l’allure de tes séances cardio.", "Estimates your top aerobic speed: it is then used to set the pace of your cardio sessions."),
    `<div class="carnet"><h3>${L("Comment faire", "How it works")}</h3><p>${L("Place deux repères à 20 mètres l’un de l’autre, sur un sol plat. À chaque bip, tu dois avoir atteint le repère d’en face. Le rythme accélère un peu chaque minute. Arrête le test quand tu arrives en retard deux fois de suite.", "Set two markers 20 metres apart on flat ground. At each beep you must have reached the opposite marker. The pace gets slightly faster every minute. Stop the test when you are late twice in a row.")}</p>
      <p class="sh-aide">${L("Échauffe-toi 10 minutes avant. Test maximal : demande l’avis d’un médecin en cas de problème de santé.", "Warm up for 10 minutes first. Maximal test: ask a doctor if you have a health condition.")}</p></div>
     <p class="count" id="nvLab">${L("Palier 1 · 8,5 km/h", "Stage 1 · 8.5 km/h")}</p><div class="time petit" id="nvTemps">0:00</div><p class="sh-aide" id="nvInfo" style="text-align:center"></p>
     <div class="controls" style="grid-template-columns:1fr"><button id="nvGo" class="main">${L("Démarrer le test", "Start the test")}</button></div><div id="nvRes"></div>`, ouvrirTests);
  const fin = () => {
    clearInterval(tMin); garderEcran(false); const e = (Date.now() - t0) / 1000, p = Math.floor(e / 60), v = p ? vNav(p) + (e % 60 >= 30 ? .25 : 0) : 0; t0 = 0;
    $("nvGo").textContent = L("Recommencer", "Start again");
    if (!v) { $("nvRes").innerHTML = `<p class="sh-ok">${L("Test arrêté avant la fin du premier palier : pas de résultat enregistré.", "Test stopped before the end of the first stage: no result saved.")}</p>`; return; }
    stocker("tests", JSON.stringify([...lireTests().filter(x => !(x.id === "navette" && x.j === jourCle())), { j: jourCle(), id: "navette", v }]));
    $("nvRes").innerHTML = `<div class="carnet"><h3>✓ ${L("VMA estimée", "Estimated top aerobic speed")} : ${v} km/h</h3><p>${L(`${p} ${p > 1 ? "paliers tenus" : "palier tenu"} en entier.`, `${p} full stage${p > 1 ? "s" : ""} completed.`)} ${alluresVma(v)}</p><p class="sh-aide">${L("Estimation : ce test en navette donne souvent une valeur un peu plus basse qu’un test sur piste. Refais-le dans un mois, dans les mêmes conditions.", "Estimate: a shuttle test often gives a slightly lower value than a track test. Repeat it in a month, in the same conditions.")}</p></div>`;
  };
  const tic = () => {
    const e = (Date.now() - t0) / 1000, p = Math.floor(e / 60) + 1, n = Math.floor((e % 60) / (72 / vNav(p)));
    $("nvTemps").textContent = mmss(e); $("nvLab").textContent = L("Palier", "Stage") + " " + p + " · " + String(vNav(p)).replace(".", L(",", ".")) + " km/h";
    $("nvInfo").textContent = L("Une longueur toutes les ", "One length every ") + (72 / vNav(p)).toFixed(1) + " s";
    if (p !== pal) { pal = p; nav = 0; sons.change(); if (p > 1) parler(L("Palier ", "Stage ") + p); if (p > 21) fin(); }
    else if (n !== nav) { nav = n; sons.alerte(); }
  };
  $("nvGo").onclick = () => { if (t0) return fin(); amorcerVoix(); t0 = Date.now(); pal = 0; nav = -1; $("nvRes").innerHTML = ""; $("nvGo").textContent = L("J’arrête : noter mon résultat", "I stop: save my result"); garderEcran(true); parler(L("Test navette. Palier un.", "Shuttle test. Stage one.")); clearInterval(tMin); tMin = setInterval(tic, 100); tic(); };
}

/* --- Mode combat : rounds avec cloche, alerte des 10 dernières secondes, repos, et combinaisons annoncées au hasard (réglages gardés : « combat ») --- */
const COMBOS = [   // [FR, EN] ; simples puis avancées
  [["Jab", "Jab"], ["Jab, direct", "Jab, cross"], ["Double jab", "Double jab"], ["Jab, direct, crochet", "Jab, cross, hook"], ["Direct, crochet", "Cross, hook"], ["Jab au corps, direct", "Jab to the body, cross"], ["Jab, jab, direct", "Jab, jab, cross"], ["Bouge, puis jab", "Move, then jab"], ["Recule, puis direct", "Step back, then cross"]],
  [["Jab, direct, crochet, direct", "Jab, cross, hook, cross"], ["Jab, direct, esquive, direct", "Jab, cross, slip, cross"], ["Crochet au corps, crochet à la tête", "Hook to the body, hook to the head"], ["Direct, uppercut, crochet", "Cross, uppercut, hook"], ["Double jab, direct au corps", "Double jab, cross to the body"], ["Esquive, crochet, direct", "Slip, hook, cross"], ["Jab, uppercut, crochet, pas de côté", "Jab, uppercut, hook, side step"], ["Rafale de six directs", "Six straight punches, fast"], ["Feinte, direct, crochet au corps", "Feint, cross, hook to the body"]]];
const THEMES = {   // rounds à thème : [nom FR, EN, enchaînements [FR, EN]] ; « sac » alterne rafales de 10 s et déplacements
  libre: ["Libre", "Free"], corps: ["Travail au corps", "Body work", [["Jab au corps", "Jab to the body"], ["Double jab au corps, direct à la tête", "Double jab to the body, cross to the head"], ["Crochet au corps, crochet au corps", "Hook to the body, hook to the body"], ["Direct au corps, crochet à la tête", "Cross to the body, hook to the head"], ["Jab en haut, direct au corps", "Jab upstairs, cross to the body"], ["Uppercut au corps, crochet à la tête", "Uppercut to the body, hook to the head"]]],
  defense: ["Défense", "Defence", [["Esquive à gauche, esquive à droite", "Slip left, slip right"], ["Bloque, puis jab", "Block, then jab"], ["Un pas en arrière, un pas en avant", "One step back, one step in"], ["Garde haute, avance", "High guard, walk forward"], ["Rotation du buste, puis crochet", "Roll under, then hook"], ["Pas de côté, puis jab", "Side step, then jab"]]],
  contre: ["Contre-attaque", "Counter-punching", [["Esquive, direct", "Slip, cross"], ["Bloque, crochet", "Block, hook"], ["Recule, jab, direct", "Step back, jab, cross"], ["Pare, uppercut", "Parry, uppercut"], ["Esquive, crochet au corps, crochet à la tête", "Slip, hook to the body, hook to the head"], ["Rotation, direct, crochet", "Roll, cross, hook"]]],
  sac: ["Rafales au sac", "Bag flurries"], mixte: ["Mixte : un thème par round", "Mixed: one theme per round"] };
function ouvrirCombat(retourVers) {
  clearInterval(tMin); const R = { r: 6, d: 180, p: 60, c: 1, t: "libre", g: "d", ...lireJSON("combat", {}) }; let t0 = 0, cumul = 0, sec = -1, phase = "", prochain = 0, rafale = false;
  const theme = k => R.t === "mixte" ? ["libre", "corps", "defense", "contre"][k % 4] : R.t, mains = () => R.g === "d" ? L("Jab : main gauche · direct : main droite", "Jab: left hand · cross: right hand") : L("Jab : main droite · direct : main gauche", "Jab: right hand · cross: left hand");
  const total = () => R.r * R.d + (R.r - 1) * R.p, ecoule = () => (cumul + (t0 ? Date.now() - t0 : 0)) / 1000 - 10;   // 10 s de préparation
  outil(L("Mode combat", "Fight mode"), L("Des rounds comme en salle : la cloche, l’alerte des dix dernières secondes, et un coach qui annonce les enchaînements.", "Rounds like at the gym: the bell, the ten-second warning, and a coach calling the combinations."),
    `<div class="carnet" id="cbRegl"><span class="champ-titre">${L("Rounds", "Rounds")}</span>${chips("cr", [3, 4, 6, 8, 10, 12].map(n => [n, n, n]), R.r)}
      <span class="champ-titre">${L("Durée du round", "Round length")}</span>${chips("cd", [[120, "2 min", "2 min"], [180, "3 min", "3 min"]], R.d)}
      <span class="champ-titre">${L("Repos", "Rest")}</span>${chips("cp", [[30, "30 s", "30 s"], [60, "1 min", "1 min"]], R.p)}
      <span class="champ-titre">${L("Enchaînements annoncés", "Called combinations")}</span>${chips("cc", [[0, "Aucun", "None"], [1, "Simples", "Basic"], [2, "Avancés", "Advanced"]], R.c)}
      <span class="champ-titre">${L("Thème des rounds", "Round theme")}</span>${chips("ct", Object.entries(THEMES).map(([k, v]) => [k, v[0], v[1]]), R.t)}<span class="champ-titre">${L("Ta garde", "Your stance")}</span>${chips("cg", [["d", "Droitier", "Orthodox"], ["g", "Gaucher", "Southpaw"]], R.g)}</div>
     <p class="count" id="cbLab"></p><div class="time petit" id="cbTemps"></div><p class="combo" id="cbCombo" aria-live="polite"></p><p class="sh-aide" id="cbMains" style="text-align:center"></p>
     <div class="controls" style="grid-template-columns:1fr 1.6fr"><button id="cbStop">${L("Arrêter", "Stop")}</button><button id="cbGo" class="main">${L("Démarrer", "Start")}</button></div><div id="cbRes"></div>`, retourVers);
  const aff = () => { $("cbLab").textContent = `${R.r} rounds · ${mmss(total())} ${L("au total", "in total")}`; $("cbTemps").textContent = mmss(R.d); };
  [["cr", "r"], ["cd", "d"], ["cp", "p"], ["cc", "c"], ["ct", "t"], ["cg", "g"]].forEach(([n, k]) => brancherChips(n, v => { R[k] = /t|g/.test(k) ? v : +v; stocker("combat", JSON.stringify(R)); if (!t0 && !cumul) aff(); }));
  const fin = complet => {
    clearInterval(tMin); garderEcran(false); const fait = Math.max(0, Math.min(total(), Math.round(ecoule()))); t0 = cumul = 0; phase = ""; sec = -1;
    $("cbRegl").classList.remove("hidden"); $("cbGo").textContent = L("Démarrer", "Start"); $("cbCombo").textContent = ""; document.documentElement.style.setProperty("--accent", "var(--vert)"); aff();
    if (fait < 120) return;   // moins de 2 minutes : rien à noter
    const h = lireHist(), n = Math.min(R.r, Math.ceil(fait / (R.d + R.p)));
    h.push({ j: jourCle(), hr: new Date().getHours(), k: "combat", t: L("Mode combat", "Fight mode") + " · " + n + " rounds", m: "seance", s: fait, n, c: "boxe", b: 0, p: 0, g: 0, tb: 0, nv: "", e: [] });
    stocker("historique", JSON.stringify(h.slice(-3000))); const neufs = verifierTrophees();
    $("cbRes").innerHTML = `<div class="carnet"><h3>${complet ? "🥊 " + L("Combat terminé !", "Fight complete!") : L("Séance notée", "Session saved")}</h3><p>${n} rounds · ${Math.round(fait / 60)} min</p></div>` + blocGain() + neufs.map(t => `<div class="nouveau-trophee">${medaille(t, "n")}<div><small>${L("Nouveau trophée", "New trophy")}</small><b>${L(t[1], t[2])}</b></div></div>`).join("");
    if (complet) { confettis(); parler(L("Combat terminé. Bravo !", "Fight over. Well done!")); }
  };
  const tic = () => {
    const e = ecoule(), s = Math.floor(e); if (s === sec) return; sec = s;
    if (e < 0) { $("cbLab").textContent = L("Prépare-toi", "Get ready"); $("cbTemps").textContent = mmss(-s); if (s >= -3) sons.alerte(); return; }
    if (e >= total()) return fin(true);
    const k = Math.floor(e / (R.d + R.p)), dans = e - k * (R.d + R.p), combat = dans < R.d, reste = Math.ceil((combat ? R.d : R.d + R.p) - dans), ph = (combat ? "c" : "r") + k;
    $("cbLab").textContent = combat ? `Round ${k + 1}/${R.r}` : L("Repos · round suivant : ", "Rest · next round: ") + (k + 2) + "/" + R.r; $("cbTemps").textContent = mmss(reste);
    if (ph !== phase) { phase = ph; sons.change(); if (combat) setTimeout(sons.change, 350); document.documentElement.style.setProperty("--accent", combat ? "#DC2626" : "#10B981"); $("cbCombo").textContent = combat ? "" : L("Respire, bois une gorgée, relâche les épaules.", "Breathe, take a sip, relax your shoulders.");
      parler(combat ? "Round " + (k + 1) + (theme(k) !== "libre" ? ". " + L(...THEMES[theme(k)]).split(" :")[0] : "") : L("Repos", "Rest")); prochain = dans + 6; rafale = false; $("cbMains").textContent = combat ? mains() : ""; }
    else if (combat && reste === 10) { [0, .18, .36].forEach(d => bip(1900, 70, .3, "square", d)); vibrer([40, 40, 40]); parler(L("Dix secondes", "Ten seconds")); prochain = 1e9; }
    else if (!combat && reste === 10) parler(L("Dix secondes, en garde", "Ten seconds, guard up"));
    else if (!combat && reste <= 3) sons.alerte();
    else if (combat && theme(k) === "sac" && dans >= prochain) { rafale = !rafale; const c = rafale ? ["Rafale ! Dix secondes à fond", "Flurry! Ten seconds all out"] : ["Stop. Bouge autour du sac", "Stop. Move around the bag"]; $("cbCombo").textContent = L(...c); parler(c[langueVoix === "fr" ? 0 : 1], 700, 1.2); if (rafale) sons.alerte(); prochain = dans + 10; }
    else if (combat && R.c && dans >= prochain) { const th = theme(k), l = th === "libre" ? COMBOS.slice(0, R.c).flat() : THEMES[th][2], c = l[Math.floor(Math.random() * l.length)]; $("cbCombo").textContent = L(...c); parler(c[langueVoix === "fr" ? 0 : 1], 700, 1.3); prochain = dans + 5 + Math.random() * 4; }
  };
  $("cbGo").onclick = () => { amorcerVoix(); if (t0) { cumul += Date.now() - t0; t0 = 0; clearInterval(tMin); $("cbGo").textContent = L("Reprendre", "Resume"); return; }
    if (!cumul) { $("cbRes").innerHTML = ""; $("cbRegl").classList.add("hidden"); } t0 = Date.now(); $("cbGo").textContent = L("Pause", "Pause"); garderEcran(true); sec = -99; clearInterval(tMin); tMin = setInterval(tic, 200); tic(); };
  $("cbStop").onclick = () => (t0 || cumul) && fin(false);
  aff();
}
