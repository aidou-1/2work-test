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
/* Programme de prévention, sur le modèle des programmes neuromusculaires qui ont fait leurs preuves (échauffement neuromusculaire en foot ; épaule en handball ;
   genou en sports de saut) : 1. course progressive, 2. force, pliométrie et équilibre (3 niveaux, un de plus toutes les 4 semaines depuis l'activation),
   3. zone propre au sport, 4. course rapide. Environ 15 à 18 min, au moins 2 fois par semaine, avant l'entraînement ou le match. */
const PREV_NIV = [
  [["planche", 30], ["planchelat", 60], ["nordique", 30], ["copenhague", 40], ["equilibre", 60], ["squat", 40], ["receptionSaut", 30]],
  [["planche", 40], ["planchelat", 60], ["nordique", 40], ["copenhague", 50], ["equilibre", 60], ["squatUni", 60], ["receptionSaut", 40], ["sautsRebond", 30]],
  [["planchetouch", 45], ["planchelat", 60], ["nordique", 45], ["copenhague", 60], ["equilibre", 80], ["squatUni", 80], ["fenteSautee", 40], ["bkSautUni", 40]]];
const PREV_ZONE = { epaule: [["Épaule", "Shoulder"], [["bandRotExt", 60], ["bandPullApart", 40], ["rotEpaule", 30], ["scap", 30]]], genou: [["Genou (tendon rotulien)", "Knee (patellar tendon)"], [["squatFreine", 40], ["chaise", 45]]],
  mollet: [["Mollets et tendon d’Achille", "Calves and Achilles"], [["mollet1", 60], ["soleaire", 60]]], hanche: [["Hanches et fessiers", "Hips and glutes"], [["pontuni", 60], ["bandWalk", 40]]] };
const PREV_SP_ZONES = { foot: [], handball: ["epaule"], basket: ["genou", "mollet"], volley: ["genou", "epaule"], tennis: ["epaule", "mollet"], padel: ["epaule", "mollet"], course: ["mollet", "hanche"],
  natation: ["epaule"], escalade: ["epaule"], boxe: ["epaule"], cyclisme: ["hanche"], ski: ["hanche"], surf: ["epaule"] };
const prevOk = l => l.filter(([x]) => EXERCICES[x] && faisable(x, monMatos()));   // sans élastique, on garde les exercices sans matériel
const prevNiveau = p => Math.min(3, 1 + Math.floor(Math.max(0, (new Date(jourCle()) - new Date(p.depuis || jourCle())) / 864e5) / 28));
function seancePrev(p) {
  const n = prevNiveau(p), nom = T(ROUTINES[p.sp].titre), zones = PREV_SP_ZONES[p.sp] || ["hanche"];
  return seanceBlocs({ couleur: "#16A34A", rpe: "4–7", cat: "prevention", titre: L("Prévention", "Injury prevention") + " · " + nom + " · " + L("niveau", "level") + " " + n,
    intro: `<b>${p.sp === "foot" ? L("Construit sur le principe des échauffements neuromusculaires de prévention étudiés en football.", "Built on the principle of the injury-prevention neuromuscular warm-ups studied in football.") : L("Sur le modèle des programmes de prévention qui ont fait leurs preuves (échauffement neuromusculaire du foot, épaule du handball, genou des sports de saut).", "Modelled on proven prevention programmes (football neuromuscular warm-up, handball shoulder, jumping-sport knee).")}</b> ${L(`Niveau ${n}/3 : un de plus toutes les 4 semaines. Au moins 2 fois par semaine, juste avant l’entraînement ou le match ; la technique avant la vitesse.`, `Level ${n}/3: one more every 4 weeks. At least twice a week, right before practice or the match; technique before speed.`)}`,
    blocs: [[L("Course progressive", "Progressive running"), L("Du footing aux gammes : le cœur monte doucement.", "From jogging to drills: the heart rate rises gently."), [["kneeup", 40], ["heelkick", 40], ["askip", 40], ["lateral", 60], ["pasChasse", 30], ["rnLignes", 30]], 5],
      [L("Force, sauts et équilibre", "Strength, jumps and balance"), L("Genoux dans l’axe, réceptions souples et silencieuses. Arrête un exercice qui fait mal.", "Knees in line, soft and quiet landings. Stop any exercise that hurts."), prevOk(PREV_NIV[n - 1]), 15],
      ...zones.map(z => [L(...PREV_ZONE[z][0]), L("La zone la plus exposée dans ton sport.", "The most exposed area in your sport."), prevOk(PREV_ZONE[z][1]), 10]),
      [L("Course rapide", "Fast running"), L("Accélérations progressives jusqu’à 90 %, retour en marchant.", "Gradual accelerations up to 90%, walk back."), n === 1 ? [["rnLignes", 30], ["rnLignes", 30]] : [["rnLignes", 30], ["sprintNavette", 30]], 30]].map((b, i) => [`${i + 1}. ${b[0]}`, ...b.slice(1)]) });
}
function prevLancer(cb) {
  ROUTINES.prev = { ...seancePrev(prevCfg(cb)), prevClub: { c: cb.id }, retour: retourClub(cb.id) }; CONSEILLES.prev = ROUTINES.prev.exercices; ouvrirRoutine("prev");
}
async function prevFinie(x) {   // appelé par celebrer() (js/progres.js)
  if (!x) return; if (typeof compter === "function") compter("prevention");
  if (await serveurPret()) SV.prevFait(x.c, lundiCle(jourCle()), CL.u.pseudo).catch(() => {});
}
async function prevCarte(Z, cb) {
  const p = prevCfg(cb); if (!Z || !p) return;
  const s = lundiCle(jourCle()), mine = await SV.maPrev(cb.id, s).catch(() => null), n = mine ? mine.n : 0, E = ECHS[p.sp], d = seancePrev(p).total;
  Z.innerHTML = `<div class="carnet cl-seance cl-prev"><div class="cl-s-haut"><small>🛡️ ${L("Prévention des blessures", "Injury prevention")} · ${L(`${p.obj} fois par semaine`, `${p.obj} times a week`)}</small></div>
    <b>${L("Programme de prévention", "Prevention programme")} · ${T(ROUTINES[p.sp].titre)} · ${L("niveau", "level")} ${prevNiveau(p)}/3</b>
    <div class="bv-points s1-points">${Array.from({ length: p.obj }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>
    <p>${n >= p.obj ? "✓ " + L("Objectif de la semaine atteint, bravo !", "This week’s goal reached, well done!") : L(`Toi cette semaine : ${n} sur ${p.obj}.`, `You this week: ${n} of ${p.obj}.`)} <span id="prevEq"></span></p>
    <div class="partage-btns"><button class="toggle" id="prevGo">▶ ${L("Lancer", "Start")} · ${d} min</button>${staff() ? `<button class="toggle contour" id="prevSuivi">📊 ${L("Suivi", "Tracking")}</button>` : ""}</div>
    <details class="cl-suivi"><summary>${L("Pourquoi ?", "Why?")}</summary><p>${L(...E[5])}</p><p>${L("Les programmes de ce type (course, force, sauts, équilibre, faits en entier) réduisent nettement les blessures dans les études, à condition d’être faits au moins 2 fois par semaine, toute la saison. Ce programme en reprend la structure ; il ne remplace pas l’avis d’un professionnel de santé en cas de douleur.", "Programmes of this kind (running, strength, jumps, balance, done in full) clearly reduce injuries in studies, provided they are done at least twice a week, all season. This programme follows their structure; it does not replace a health professional’s advice if you are in pain.")}</p></details>
    <small class="sh-aide">${p.vue === "noms" ? L("Le staff du club voit qui l’a fait et combien de fois.", "Club staff can see who did it and how many times.") : L("Le staff du club ne voit que le total de l’équipe, pas les noms.", "Club staff only sees the team total, not names.")}</small></div>`;
  $("prevGo").onclick = () => prevLancer(cb); if ($("prevSuivi")) $("prevSuivi").onclick = () => { CL.onglet = "suivi"; rendu(); };
  desab.push(SV.ecouterPrevSem(cb.id, s, a => { const X = $("prevEq"); if (X) X.textContent = a ? L(`Équipe : ${a.n} séance${a.n > 1 ? "s" : ""}, ${a.j} joueur${a.j > 1 ? "s" : ""}.`, `Team: ${a.n} session${a.n > 1 ? "s" : ""}, ${a.j} player${a.j > 1 ? "s" : ""}.`) : L("Personne encore dans l’équipe : lance-toi !", "Nobody on the team yet: go first!"); }));
}

/* --- Prévention : réglages (coach seul) dans l'onglet Club --- */
function prevReglages(Z, cb) {
  if (!Z || cb.role !== "coach") return;
  const p = cb.prev || { on: false, sp: sportClub(cb) || PREV_SP()[0], obj: 2, vue: "total" };   // par défaut, le staff ne voit que le total (protection des données par défaut)
  Z.innerHTML = `<h2 class="sec">🛡️ ${L("Prévention des blessures", "Injury prevention")}</h2><div class="carnet cl-form">
    <p class="sh-aide">${L("Un programme de prévention (échauffement complet) ciblé sur les blessures de ton sport, à faire avant chaque entraînement et match. Chaque joueur le lance depuis l’onglet Séances ; tu suis la régularité de l’équipe.", "A prevention programme (full warm-up) targeting the injuries of your sport, to do before every practice and match. Each player starts it from the Workouts tab; you track the team’s consistency.")}</p>
    <label class="cl-case"><input type="checkbox" id="pvOn"${p.on ? " checked" : ""}><span>${L("Activer pour le club", "Turn on for the club")}</span></label>
    <div class="champ-duo"><label class="champ"><span>${L("Sport", "Sport")}</span><select id="pvSp">${PREV_SP().map(k => `<option value="${k}"${k === p.sp ? " selected" : ""}>${T(ROUTINES[k].titre)}</option>`).join("")}</select></label>
    <label class="champ"><span>${L("Objectif", "Goal")}</span><select id="pvObj">${[...(p.obj === 1 ? [1] : []), 2, 3].map(n => `<option value="${n}"${n === p.obj ? " selected" : ""}>${L(`${n}× par semaine`, `${n}× a week`)}</option>`).join("")}</select></label></div>
    <span class="sh-aide">${L("Ce que le staff voit (les joueurs en sont informés sur la carte). Passer à « nom par nom » rend aussi visibles les semaines passées : préviens ton équipe avant.", "What staff can see (players are told on the card). Switching to “name by name” also shows past weeks: tell your team first.")}</span>
    <div class="chips" id="pvVue">${[["noms", "Nom par nom", "Name by name"], ["total", "Total de l’équipe seulement", "Team total only"]].map(([k, f, e]) => `<button class="toggle" data-v="${k}" aria-pressed="${p.vue === k}">${L(f, e)}</button>`).join("")}</div>
    <button class="toggle" id="pvSauve">${L("Enregistrer", "Save")}</button></div>`;
  let vue = p.vue; $("pvVue").onclick = e => { const b = e.target.closest("[data-v]"); if (!b) return; vue = b.dataset.v; $("pvVue").querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); };
  $("pvSauve").onclick = async () => { const v = { prev: { on: $("pvOn").checked, sp: $("pvSp").value, obj: +$("pvObj").value, vue, depuis: cb.prev && cb.prev.on && cb.prev.sp === $("pvSp").value && cb.prev.depuis || jourCle() } };   // niveau 1 au changement de sport ou à la réactivation
    try { await SV.modifierClub(cb.id, v); Object.assign(cb, v); $("pvSauve").textContent = "✓ " + L("Enregistré", "Saved"); } catch (x) { $("pvSauve").textContent = msgErr(x); } };
}

/* --- Retours des 7 derniers jours (staff) : effort ressenti de chaque membre, gêne s'il a donné son accord, et alertes ---
   Alerte charge : effort de 8 ou plus au moins 3 jours sur 7. Alerte gêne : forte un jour, ou présente au moins 2 jours. */
function blocRetours(mb, rts) {
  const par = m => rts.filter(r => r.uid === m.id).sort((a, b) => a.j < b.j ? -1 : 1), zn = l => [...new Set(l.flatMap(r => r.zn || []))].map(z => typeof ZONES_FM !== "undefined" && Object.hasOwn(ZONES_FM, z) ? L(ZONES_FM[z][0], ZONES_FM[z][1]).toLowerCase() : echap(String(z).slice(0, 20))).join(", ");
  const l = mb.filter(m => m.role !== "coach").map(m => { const r = par(m), efs = r.map(x => x.ef), dls = r.filter(x => x.dl);
    return { m, r, moy: efs.length ? Math.round(efs.reduce((a, b) => a + b, 0) / efs.length * 10) / 10 : null, dur: efs.filter(v => v >= 8).length, dl: dls, alerte: efs.filter(v => v >= 8).length >= 3 || dls.some(x => x.dl === 2) || dls.length >= 2 }; });
  if (!l.length) return "";
  const al = l.filter(x => x.alerte), ligne = x => `<li><div><b style="color:${couleurPseudo(x.m.pseudo)}">${echap(x.m.pseudo)}</b>${x.m.partage === false ? `<small>${L("Ne partage pas son suivi", "Does not share their progress")}</small>`
    : x.r.length ? `<span class="cl-jours">${[...Array(7)].map((_, i) => { const j = decaler(jourCle(), i - 6), y = x.r.find(r => r.j === j); return `<i class="${y ? y.ef >= 8 ? "dur" : "ok" : ""}" title="${j}">${y ? y.ef : "·"}</i>`; }).join("")}</span><small>${L("Effort moyen", "Average effort")} ${String(x.moy).replace(".", L(",", "."))}/10${x.dur ? ` · ${x.dur} ${L("jour(s) à 8 ou plus", "day(s) at 8+")}` : ""}${x.dl.length ? ` · ⚠️ ${L("gêne", "discomfort")} ${x.dl.length} ${L("jour(s)", "day(s)")}${zn(x.dl) ? " (" + zn(x.dl) + ")" : ""}` : ""}</small>`
    : `<small>${L("Rien de noté cette semaine", "Nothing logged this week")}</small>`}</div></li>`;
  return `<h2 class="sec">${L("Retours · 7 derniers jours", "Feedback · last 7 days")}</h2>
    ${al.length ? `<div class="carnet cl-alerte"><b>⚠️ ${L("À surveiller", "To watch")}</b><p>${al.map(x => `<span class="cl-qui">${echap(x.m.pseudo)}</span>`).join(" ")}</p><p class="sh-aide">${L("Effort très haut plusieurs jours, ou gêne signalée : allège sa prochaine séance et parle avec lui. Une douleur qui dure se montre à un professionnel de santé.", "Very high effort several days, or discomfort reported: lighten their next session and talk with them. Lasting pain should be seen by a health professional.")}</p></div>` : ""}
    <ul class="list cl-assid">${l.map(ligne).join("")}</ul><p class="sh-aide">${L("Effort le plus haut de chaque jour, sur 10, envoyé par le membre (séances de l’appli et clubs notés). La gêne n’apparaît que pour ceux qui ont donné leur accord.", "Highest effort of each day, out of 10, sent by the member (app workouts and logged clubs). Discomfort only shows for those who consented.")}</p>`;
}
/* --- Onglet Suivi (staff) --- */
async function ongSuivi(Z, cb) {
  Z.innerHTML = `<p class="vide">…</p>`;
  const auj = jourCle(), d28 = decaler(auj, -27), d14 = decaler(auj, -13), p = prevCfg(cb), sems = [0, 1, 2, 3].map(i => decaler(lundiCle(auj), -7 * i)).reverse();
  const SC = sectionsDe(cb); if (!SC.some(x => x.id === CL.suiviSec)) CL.suiviSec = "*"; const fs = CL.suiviSec;
  const [mbT, sesT] = await Promise.all([unePhoto(f => SV.ecouterMembres(cb.id, f)), unePhoto(f => ecouterSeancesClub(cb, f))]);
  const dans = (m, s) => !s.sec || (m.sections || []).includes(s.sec),   // une séance de section ne compte que pour ses membres
    mb = fs === "*" ? mbT : mbT.filter(m => (m.sections || []).includes(fs)), ses = fs === "*" ? sesT : sesT.filter(s => !s.sec || s.sec === fs);
  const d7 = decaler(auj, -6), rts = await SV.retoursDepuis(cb.id, d7).catch(() => []);
  const passe = ses.filter(s => s.date <= auj && s.date >= d28), faits = await SV.faitsDe(cb.id, passe),
    agg = p ? await SV.prevSemaines(cb.id, sems) : {}, noms = p && p.vue === "noms" ? await SV.prevNoms(cb.id, sems[0]) : null;
  if (CL.onglet !== "suivi" || !Z.isConnected) return;   // onglet quitté pendant le chargement
  const arrivee = m => m.depuis && m.depuis.toDate ? jourCle(m.depuis.toDate()) : d28,
    l = mb.map(m => { const dues = passe.filter(s => s.date >= arrivee(m) && dans(m, s)), ok = dues.filter(s => faits[s.id].includes(m.id)), rec = dues.filter(s => s.date >= d14),
      pv = noms ? noms.filter(x => x.uid === m.id) : [], pvSem = (pv.find(x => x.s === sems[3]) || {}).n || 0;
      return { m, dues: dues.length, ok: ok.length, decroche: m.role === "membre" && arrivee(m) <= d14 && rec.length >= 1 && !rec.some(s => faits[s.id].includes(m.id)), pv4: pv.reduce((a, x) => a + x.n, 0), pvSem }; }).sort((a, b) => a.ok / (a.dues || 1) - b.ok / (b.dues || 1));
  const dec = l.filter(x => x.decroche), moy = l.reduce((a, x) => a + x.ok, 0) / Math.max(1, l.reduce((a, x) => a + x.dues, 0)),
    top = passe.map(s => [s, faits[s.id].length, mb.filter(m => dans(m, s)).length]).sort((a, b) => b[1] - a[1]).slice(0, 5), court = j => j.slice(8) + "/" + j.slice(5, 7);
  Z.innerHTML = `${SC.length ? `<div class="chips cl-filtre" id="suSec">${[["*", L("Tout le club", "Whole club")], ...SC.map(x => [x.id, x.nom])].map(([k, n]) => `<button class="toggle" data-f="${k}" aria-pressed="${fs === k}">${echap(n)}</button>`).join("")}</div>` : ""}<div id="suiviOk" class="cl-stats"><div class="carnet"><b>${passe.length}</b><small>${L("séances sur 4 semaines", "workouts over 4 weeks")}</small></div><div class="carnet"><b>${pctTxt(moy, 1)}</b><small>${L("de séances faites", "of workouts done")}</small></div><div class="carnet"><b>${dec.length}</b><small>${L("à relancer", "to nudge")}</small></div></div>
    ${dec.length ? `<h2 class="sec">${L("À relancer", "To nudge")}</h2><div class="carnet"><p class="sh-aide">${L("Aucune séance du club cochée depuis 2 semaines.", "No club workout ticked for 2 weeks.")}</p><p>${dec.map(x => `<span class="cl-qui">${echap(x.m.pseudo)}</span>`).join(" ")}</p><button class="toggle" id="suRelance">💬 ${L("Écrire un message de relance", "Write a nudge message")}</button></div>` : ""}
    ${p && fs === "*" ? `<h2 class="sec">🛡️ ${L("Prévention", "Prevention")} · ${L(`objectif ${p.obj}×/semaine`, `goal ${p.obj}×/week`)}</h2><div class="carnet cl-sem">${sems.map(s => { const a = agg[s] || { n: 0, j: 0 }; return `<div><small>${L("Sem. du", "Week of")} ${court(s)}</small>${barre(a.j, mb.length)}<small>${a.j}/${mb.length} ${L("joueurs", "players")} · ${a.n} ${L("séances", "sessions")}</small></div>`; }).join("")}
      ${noms ? "" : `<p class="sh-aide">${L("Vue « total de l’équipe » : le détail par joueur n’est pas visible (réglage dans l’onglet Club).", "“Team total” view: per-player detail is hidden (setting in the Club tab).")}</p>`}</div>` : ""}
    ${blocRetours(mb, rts)}
    <h2 class="sec">${L("Assiduité · 4 semaines", "Attendance · 4 weeks")}</h2><ul class="list cl-assid">${l.map(x => `<li><div><b style="color:${couleurPseudo(x.m.pseudo)}">${echap(x.m.pseudo)}</b>${barre(x.ok, x.dues)}<small>${x.dues ? `${x.ok}/${x.dues} ${L("séances", "workouts")} · ${pctTxt(x.ok, x.dues)}` : L("Aucune séance depuis son arrivée", "No workout since joining")}${noms ? ` · 🛡️ ${x.pvSem}/${p.obj} ${L("cette semaine", "this week")}, ${x.pv4} ${L("en 4 sem.", "in 4 wks")}` : ""}</small></div></li>`).join("")}</ul>
    ${top.length ? `<h2 class="sec">${L("Séances les plus suivies", "Most followed workouts")}</h2><ul class="list">${top.map(([s, n, t]) => `<li><div><b>${echap(s.titre)}</b><small>${s.sec ? echap(nomSec(cb, s.sec)) + " · " : ""}${dateLisible(s.date)}</small></div><span class="duree">${n}/${t}</span></li>`).join("")}</ul>` : `<p class="vide">${L("Publie des séances pour voir l’assiduité de ton équipe.", "Post workouts to see your team’s attendance.")}</p>`}`;
  if ($("suSec")) $("suSec").onclick = e => { const b = e.target.closest("[data-f]"); if (b) { CL.suiviSec = b.dataset.f; rendu(); } };
  if ($("suRelance")) $("suRelance").onclick = () => { const pro = ses.filter(s => s.date >= auj).pop();
    CL.brouillon = L(`${dec.map(x => "@" + x.m.pseudo).join(" ")} on ne vous a pas vus sur les dernières séances 💪 ${pro ? `Prochaine : « ${pro.titre} » (${dateLisible(pro.date).toLowerCase()}).` : "Une petite séance cette semaine ?"} Dites-nous si quelque chose bloque !`,
      `${dec.map(x => "@" + x.m.pseudo).join(" ")} we haven’t seen you on the last workouts 💪 ${pro ? `Next one: “${pro.titre}” (${dateLisible(pro.date).toLowerCase()}).` : "A short workout this week?"} Let us know if anything is in the way!`);
    CL.sal = fs === "*" ? "" : fs; CL.onglet = "chat"; rendu(); };
}

/* --- Modèles de séances (fenêtre « Publier ») : [titre fr, titre en, routine, consigne fr, consigne en] --- */
function modeles(cb) {
  const sp = sportClub(cb), nom = sp ? T(ROUTINES[sp].titre) : "", R = sp && ROUTINES[SEANCE(sp)] ? SEANCE(sp) : "renfoComplet";
  return [sp && [`Échauffement d’avant-match · ${nom}`, `Pre-match warm-up · ${nom}`, sp, "À faire juste avant le match ou l’entraînement, en entier.", "Do it right before the match or practice, in full."],
    [`Renfo spécifique${nom ? " · " + nom : ""}`, `Sport strength${nom ? " · " + nom : ""}`, R, "Hors jours de match, 1 à 2 fois par semaine. Qualité avant quantité.", "Away from match days, 1 to 2 times a week. Quality over quantity."],
    ["Récup du lendemain de match", "Day-after-match recovery", "etComplet", "Le lendemain du match : étirements doux, sans forcer.", "The day after the match: gentle stretches, no forcing."],
    ["Cardio en autonomie", "Cardio on your own", "tabata", "Pendant la trêve ou en plus des entraînements : à fond sur les efforts, récupère bien entre eux.", "During the break or on top of practice: all out on the efforts, recover well in between."],
    ["Gainage et renfo général", "Core and general strength", "renfoComplet", "Sans matériel, à faire à la maison cette semaine.", "No equipment, to do at home this week."],
    ["Concentration avant match", "Pre-match focus", "coherFocus", "Dans le vestiaire ou la veille au soir : quelques minutes pour calmer le stress.", "In the changing room or the night before: a few minutes to calm the nerves."]].filter(m => m && ROUTINES[m[2]]);
}

/* --- Fin d'une séance lancée depuis un club : bouton pour revenir à ses séances et enchaîner (appelé par celebrer, js/progres.js) --- */
function finClub(r) {
  const x = r && (r.club || r.prevClub), cb = x && CL.clubs.find(c => c.id === x.c); if ($("fClub")) $("fClub").remove(); if (!x) return;
  $("restart").insertAdjacentHTML("beforebegin", `<button class="toggle fin-club" id="fClub">👥 ${L("Retour au club", "Back to the club")}${cb ? " · " + echap(cb.nom) : ""}<small>${L("pour enchaîner avec une autre séance", "to go on with another workout")}</small></button>`);
  $("fClub").onclick = () => retourClub(x.c)();
}
