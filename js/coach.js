/* ============ OUTILS DU COACH : prévention des blessures, suivi, modèles de séances ============
   Prévention : le coach active un échauffement complet ciblé sur les blessures de son sport (objectif 1 à 3 fois par semaine)
   et choisit ce que le staff voit : nom par nom, ou seulement le total de l'équipe. Chaque fin de séance ajoute +1 à sa fiche de la semaine.
   Suivi (staff) : assiduité sur 4 semaines, joueurs à relancer, séances les plus suivies, prévention de l'équipe.
   Modèles : séances types prêtes à publier, adaptées au sport du club. Données et règles : js/serveur.js, firestore.rules. */
const lundiCle = j => decaler(j, -((new Date(j + "T12:00:00Z").getUTCDay() + 6) % 7));
const PREV_SP = () => Object.keys(ECHS).filter(k => ROUTINES[k] && !["haut", "bas", "complet", "yoga", "pilates"].includes(k));
const prevCfg = cb => cb && cb.prev && cb.prev.on && ROUTINES[cb.prev.sp] ? cb.prev : null;
const sportClub = cb => (prevCfg(cb) || {}).sp || PREV_SP().find(k => { const a = plat(T(ROUTINES[k].titre)), b = plat(cb.sport || ""); return b && (a.startsWith(b.slice(0, 4)) || b.startsWith(a.slice(0, 4))); });
const unePhoto = f => new Promise(r => { let x = null, fini = 0; x = f(v => { if (fini++) return; r(v); setTimeout(() => x && x()); }); });   // une seule lecture d'un flux en direct
const barre = (v, max) => `<span class="cl-barre"><i style="width:${max ? Math.round(100 * Math.min(1, v / max)) : 0}%"></i></span>`;
const pctTxt = (a, b) => b ? Math.round(100 * a / b) + " %" : "–";

/* --- Prévention : carte en tête de l'onglet Séances --- */
function prevLancer(cb) {
  const p = prevCfg(cb), s = seanceEch(p.sp, "complet"), t = L("Prévention", "Injury prevention") + " · " + T(ROUTINES[p.sp].titre);
  ROUTINES.prev = { ...s, titre: t, titreFr: "Prévention · " + (ROUTINES[p.sp].titreFr || ROUTINES[p.sp].titre), prevClub: { c: cb.id } }; CONSEILLES.prev = ROUTINES.prev.exercices; ouvrirRoutine("prev");
}
function prevFinie(x) {   // appelé par celebrer() (js/progres.js)
  if (!x || !SV || !CL.u) return; if (typeof compter === "function") compter("prevention");
  SV.prevFait(x.c, lundiCle(jourCle()), CL.u.pseudo).catch(() => {});
}
async function prevCarte(Z, cb) {
  const p = prevCfg(cb); if (!Z || !p) return;
  const s = lundiCle(jourCle()), mine = await SV.maPrev(cb.id, s).catch(() => null), n = mine ? mine.n : 0, E = ECHS[p.sp], d = seanceEch(p.sp, "complet").total;
  Z.innerHTML = `<div class="carnet cl-seance cl-prev"><div class="cl-s-haut"><small>🛡️ ${L("Prévention des blessures", "Injury prevention")} · ${L(`${p.obj} fois par semaine`, `${p.obj} times a week`)}</small></div>
    <b>${L("Échauffement complet", "Full warm-up")} · ${T(ROUTINES[p.sp].titre)}</b>
    <div class="bv-points s1-points">${Array.from({ length: p.obj }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>
    <p>${n >= p.obj ? "✓ " + L("Objectif de la semaine atteint, bravo !", "This week’s goal reached, well done!") : L(`Toi cette semaine : ${n} sur ${p.obj}.`, `You this week: ${n} of ${p.obj}.`)} <span id="prevEq"></span></p>
    <div class="partage-btns"><button class="toggle" id="prevGo">▶ ${L("Lancer", "Start")} · ${d} min</button>${staff() ? `<button class="toggle contour" id="prevSuivi">📊 ${L("Suivi", "Tracking")}</button>` : ""}</div>
    <details class="cl-suivi"><summary>${L("Pourquoi ?", "Why?")}</summary><p>${L(...E[5])}</p><p>${L("Fait avant chaque entraînement et chaque match, un échauffement de prévention complet réduit nettement les blessures ; l’effet se perd en dessous de 2 fois par semaine.", "Done before every practice and match, a full prevention warm-up clearly reduces injuries; the effect fades below twice a week.")}</p></details>
    <small class="sh-aide">${p.vue === "noms" ? L("Le staff du club voit qui l’a fait et combien de fois.", "Club staff can see who did it and how many times.") : L("Le staff du club ne voit que le total de l’équipe, pas les noms.", "Club staff only sees the team total, not names.")}</small></div>`;
  $("prevGo").onclick = () => prevLancer(cb); if ($("prevSuivi")) $("prevSuivi").onclick = () => { CL.onglet = "suivi"; rendu(); };
  desab.push(SV.ecouterPrevSem(cb.id, s, a => { const X = $("prevEq"); if (X) X.textContent = a ? L(`Équipe : ${a.n} séance${a.n > 1 ? "s" : ""}, ${a.j} joueur${a.j > 1 ? "s" : ""}.`, `Team: ${a.n} session${a.n > 1 ? "s" : ""}, ${a.j} player${a.j > 1 ? "s" : ""}.`) : L("Personne encore dans l’équipe : lance-toi !", "Nobody on the team yet: go first!"); }));
}

/* --- Prévention : réglages (coach seul) dans l'onglet Club --- */
function prevReglages(Z, cb) {
  if (!Z || cb.role !== "coach") return;
  const p = cb.prev || { on: false, sp: sportClub(cb) || PREV_SP()[0], obj: 2, vue: "noms" };
  Z.innerHTML = `<h2 class="sec">🛡️ ${L("Prévention des blessures", "Injury prevention")}</h2><div class="carnet cl-form">
    <p class="sh-aide">${L("Un échauffement complet ciblé sur les blessures de ton sport, à faire avant chaque entraînement et match. Chaque joueur le lance depuis l’onglet Séances ; tu suis la régularité de l’équipe.", "A full warm-up targeting the injuries of your sport, to do before every practice and match. Each player starts it from the Workouts tab; you track the team’s consistency.")}</p>
    <label class="cl-case"><input type="checkbox" id="pvOn"${p.on ? " checked" : ""}><span>${L("Activer pour le club", "Turn on for the club")}</span></label>
    <div class="champ-duo"><label class="champ"><span>${L("Sport", "Sport")}</span><select id="pvSp">${PREV_SP().map(k => `<option value="${k}"${k === p.sp ? " selected" : ""}>${T(ROUTINES[k].titre)}</option>`).join("")}</select></label>
    <label class="champ"><span>${L("Objectif", "Goal")}</span><select id="pvObj">${[1, 2, 3].map(n => `<option value="${n}"${n === p.obj ? " selected" : ""}>${L(`${n}× par semaine`, `${n}× a week`)}</option>`).join("")}</select></label></div>
    <span class="sh-aide">${L("Ce que le staff voit (les joueurs en sont informés sur la carte)", "What staff can see (players are told on the card)")}</span>
    <div class="chips" id="pvVue">${[["noms", "Nom par nom", "Name by name"], ["total", "Total de l’équipe seulement", "Team total only"]].map(([k, f, e]) => `<button class="toggle" data-v="${k}" aria-pressed="${p.vue === k}">${L(f, e)}</button>`).join("")}</div>
    <button class="toggle" id="pvSauve">${L("Enregistrer", "Save")}</button></div>`;
  let vue = p.vue; $("pvVue").onclick = e => { const b = e.target.closest("[data-v]"); if (!b) return; vue = b.dataset.v; $("pvVue").querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); };
  $("pvSauve").onclick = async () => { const v = { prev: { on: $("pvOn").checked, sp: $("pvSp").value, obj: +$("pvObj").value, vue, depuis: (cb.prev && cb.prev.depuis) || jourCle() } };
    try { await SV.modifierClub(cb.id, v); Object.assign(cb, v); $("pvSauve").textContent = "✓ " + L("Enregistré", "Saved"); } catch (x) { $("pvSauve").textContent = msgErr(x); } };
}

/* --- Onglet Suivi (staff) --- */
async function ongSuivi(Z, cb) {
  Z.innerHTML = `<p class="vide">…</p>`;
  const auj = jourCle(), d28 = decaler(auj, -27), d14 = decaler(auj, -13), p = prevCfg(cb), sems = [0, 1, 2, 3].map(i => decaler(lundiCle(auj), -7 * i)).reverse();
  const [mb, ses] = await Promise.all([unePhoto(f => SV.ecouterMembres(cb.id, f)), unePhoto(f => SV.ecouterSeances(cb.id, f))]);
  const passe = ses.filter(s => s.date <= auj && s.date >= d28), faits = await SV.faitsDe(cb.id, passe.map(s => s.id)),
    agg = p ? await SV.prevSemaines(cb.id, sems) : {}, noms = p && p.vue === "noms" ? await SV.prevNoms(cb.id, sems[0]) : null;
  if (CL.onglet !== "suivi" || !Z.isConnected) return;   // onglet quitté pendant le chargement
  const arrivee = m => m.depuis && m.depuis.toDate ? jourCle(m.depuis.toDate()) : d28,
    l = mb.map(m => { const dues = passe.filter(s => s.date >= arrivee(m)), ok = dues.filter(s => faits[s.id].includes(m.id)), rec = dues.filter(s => s.date >= d14),
      pv = noms ? noms.filter(x => x.uid === m.id) : [], pvSem = (pv.find(x => x.s === sems[3]) || {}).n || 0;
      return { m, dues: dues.length, ok: ok.length, decroche: m.role === "membre" && arrivee(m) <= d14 && rec.length >= 1 && !rec.some(s => faits[s.id].includes(m.id)), pv4: pv.reduce((a, x) => a + x.n, 0), pvSem }; }).sort((a, b) => a.ok / (a.dues || 1) - b.ok / (b.dues || 1));
  const dec = l.filter(x => x.decroche), moy = l.reduce((a, x) => a + x.ok, 0) / Math.max(1, l.reduce((a, x) => a + x.dues, 0)),
    top = passe.map(s => [s, faits[s.id].length]).sort((a, b) => b[1] - a[1]).slice(0, 5), court = j => j.slice(8) + "/" + j.slice(5, 7);
  Z.innerHTML = `<div id="suiviOk" class="cl-stats"><div class="carnet"><b>${passe.length}</b><small>${L("séances sur 4 semaines", "workouts over 4 weeks")}</small></div><div class="carnet"><b>${pctTxt(moy, 1)}</b><small>${L("de séances faites", "of workouts done")}</small></div><div class="carnet"><b>${dec.length}</b><small>${L("à relancer", "to nudge")}</small></div></div>
    ${dec.length ? `<h2 class="sec">${L("À relancer", "To nudge")}</h2><div class="carnet"><p class="sh-aide">${L("Aucune séance du club cochée depuis 2 semaines.", "No club workout ticked for 2 weeks.")}</p><p>${dec.map(x => `<span class="cl-qui">${echap(x.m.pseudo)}</span>`).join(" ")}</p><button class="toggle" id="suRelance">💬 ${L("Écrire un message de relance", "Write a nudge message")}</button></div>` : ""}
    ${p ? `<h2 class="sec">🛡️ ${L("Prévention", "Prevention")} · ${L(`objectif ${p.obj}×/semaine`, `goal ${p.obj}×/week`)}</h2><div class="carnet cl-sem">${sems.map(s => { const a = agg[s] || { n: 0, j: 0 }; return `<div><small>${L("Sem. du", "Week of")} ${court(s)}</small>${barre(a.j, mb.length)}<small>${a.j}/${mb.length} ${L("joueurs", "players")} · ${a.n} ${L("séances", "sessions")}</small></div>`; }).join("")}
      ${noms ? "" : `<p class="sh-aide">${L("Vue « total de l’équipe » : le détail par joueur n’est pas visible (réglage dans l’onglet Club).", "“Team total” view: per-player detail is hidden (setting in the Club tab).")}</p>`}</div>` : ""}
    <h2 class="sec">${L("Assiduité · 4 semaines", "Attendance · 4 weeks")}</h2><ul class="list cl-assid">${l.map(x => `<li><div><b style="color:${couleurPseudo(x.m.pseudo)}">${echap(x.m.pseudo)}</b>${barre(x.ok, x.dues)}<small>${x.dues ? `${x.ok}/${x.dues} ${L("séances", "workouts")} · ${pctTxt(x.ok, x.dues)}` : L("Aucune séance depuis son arrivée", "No workout since joining")}${noms ? ` · 🛡️ ${x.pvSem}/${p.obj} ${L("cette semaine", "this week")}, ${x.pv4} ${L("en 4 sem.", "in 4 wks")}` : ""}</small></div></li>`).join("")}</ul>
    ${top.length ? `<h2 class="sec">${L("Séances les plus suivies", "Most followed workouts")}</h2><ul class="list">${top.map(([s, n]) => `<li><div><b>${echap(s.titre)}</b><small>${dateLisible(s.date)}</small></div><span class="duree">${n}/${mb.length}</span></li>`).join("")}</ul>` : `<p class="vide">${L("Publie des séances pour voir l’assiduité de ton équipe.", "Post workouts to see your team’s attendance.")}</p>`}`;
  if ($("suRelance")) $("suRelance").onclick = () => { const pro = ses.filter(s => s.date >= auj).pop();
    CL.brouillon = L(`${dec.map(x => "@" + x.m.pseudo).join(" ")} on ne vous a pas vus sur les dernières séances 💪 ${pro ? `Prochaine : « ${pro.titre} » (${dateLisible(pro.date).toLowerCase()}).` : "Une petite séance cette semaine ?"} Dites-nous si quelque chose bloque !`,
      `${dec.map(x => "@" + x.m.pseudo).join(" ")} we haven’t seen you on the last workouts 💪 ${pro ? `Next one: “${pro.titre}” (${dateLisible(pro.date).toLowerCase()}).` : "A short workout this week?"} Let us know if anything is in the way!`);
    CL.onglet = "chat"; rendu(); };
}

/* --- Modèles de séances (fenêtre « Publier ») : [titre fr, titre en, routine, consigne fr, consigne en] --- */
function modeles(cb) {
  const sp = sportClub(cb), nom = sp ? T(ROUTINES[sp].titre) : "", R = sp && ROUTINES[SEANCE(sp)] ? SEANCE(sp) : "renfoComplet";
  return [sp && [`Échauffement d’avant-match · ${nom}`, `Pre-match warm-up · ${nom}`, sp, "À faire juste avant le match ou l’entraînement, en entier.", "Do it right before the match or practice, in full."],
    [`Renfo spécifique${nom ? " · " + nom : ""}`, `Sport strength${nom ? " · " + nom : ""}`, R, "Hors jours de match, 1 à 2 fois par semaine. Qualité avant quantité.", "Away from match days, 1 to 2 times a week. Quality over quantity."],
    ["Récup du lendemain de match", "Day-after-match recovery", "etComplet", "Le lendemain du match : étirements doux, sans forcer.", "The day after the match: gentle stretches, no forcing."],
    ["Cardio en autonomie", "Cardio on your own", "tabata", "Pendant la trêve ou en plus des entraînements : à fond sur les efforts, récupère bien entre.", "During the break or on top of practice: all out on the efforts, recover well in between."],
    ["Gainage et renfo général", "Core and general strength", "renfoComplet", "Sans matériel, à faire à la maison cette semaine.", "No equipment, to do at home this week."],
    ["Concentration avant match", "Pre-match focus", "coherFocus", "Dans le vestiaire ou la veille au soir : quelques minutes pour calmer le stress.", "In the changing room or the night before: a few minutes to calm the nerves."]].filter(m => m && ROUTINES[m[2]]);
}

/* --- Fin d'une séance lancée depuis un club : bouton pour revenir à ses séances et enchaîner (appelé par celebrer, js/progres.js) --- */
function finClub(r) {
  const x = r && (r.club || r.prevClub), cb = x && CL.clubs.find(c => c.id === x.c); if ($("fClub")) $("fClub").remove(); if (!cb) return;
  $("restart").insertAdjacentHTML("beforebegin", `<button class="toggle fin-club" id="fClub">👥 ${L("Retour au club", "Back to the club")} · ${echap(cb.nom)}<small>${L("pour enchaîner avec une autre séance", "to go on with another workout")}</small></button>`);
  $("fClub").onclick = () => ouvrirClubs({ vue: "club", c: cb.id, onglet: "seances" });
}
