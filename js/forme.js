/* ============ FORME DU JOUR : questionnaire du matin, batterie, conseil d'effort, statistiques expliquées ============
   Le questionnaire (facultatif) note la nuit et l'état du corps ; on en tire une « batterie » de 0 à 100 % et un conseil d'effort.
   Données de santé : elles restent sur le téléphone (clé « forme »), sont gardées un an, vont dans le fichier de sauvegarde
   mais jamais dans la sauvegarde en ligne (js/clubs.js). Format : { "AAAA-MM-JJ": { h: heures, q, e, c, st, dl, z, rv, si } }, notes de 1 à 5 ; dl : 0 rien, 1 gêne, 2 douleur ; z : zones concernées ;
   rv : heure du réveil approchée (minutes, heure de la 1re réponse du jour, bornée 5 h-11 h) ; si : siestes [{ t: minutes, d: durée en min }] ; p : points de la journée [{ t: minutes, e, st, f }] (f : corps lourd, 1 léger à 5 lourd).
   Les séances de club, tous sports (js/sport.js, clé « clubJournal ») comptent dans la charge et la fatigue de la veille. */
const lireForme = () => lireJSON("forme", {});
function stockerForme(F) {
  const lim = decaler(jourCle(), -365);   // conservation limitée à un an
  stocker("forme", JSON.stringify(Object.fromEntries(Object.entries(F).filter(([j]) => j >= lim))));
}
// questions : [clé, titre FR, EN, [emoji et libellé de 1 à 5]] ; « inv » : une note haute est mauvaise (courbatures, stress)
const QF = [["q", "Qualité du sommeil", "Sleep quality", ["😫", "😕", "😐", "🙂", "😴"], ["Très mauvaise", "Very poor"], ["Excellente", "Excellent"]],
  ["e", "Énergie", "Energy", ["🪫", "😩", "😐", "🙂", "⚡"], ["À plat", "Drained"], ["Au top", "Full of it"]],
  ["c", "Courbatures", "Soreness", ["✨", "🙂", "😐", "😣", "🥵"], ["Aucune", "None"], ["Fortes", "Strong"], 1],
  ["st", "Stress", "Stress", ["😌", "🙂", "😐", "😟", "🤯"], ["Zen", "Calm"], ["Très stressé", "Very stressed"], 1]];
const borne01 = v => Math.max(0, Math.min(1, v));
const chargeX = x => Math.round(x.s / 60 * ({ tabata: 3, seance: 2, salle: 2 }[x.m] || 1));   // minutes × intensité, comme la charge de Mes progrès
// séances de club entre deux jours, tous sports (notées, sinon prévues) ; charge = minutes × effort sur 10 / 4, comme une séance de l'appli
const clubsEntre = (de, a) => { const C = lireClubs(), l = []; if (!sportsClub(C, 1).length) return l; for (let j = de; j <= a; j = decaler(j, 1)) clubsDu(j, C).forEach(x => l.push({ j, ...x })); return l; };
/* Seuils selon l'habitude d'entraînement en club : 1 séance loisir ou 5 séances d'athlète, une semaine « chargée » n'a pas le même sens.
   seuilDurs : efforts durs dans la semaine au-delà desquels on propose un jour de récupération (au moins 5, sinon clubs durs + 2, + 3 en compétition) ;
   seuilAffilee : jours d'entraînement d'affilée avant de signaler l'absence de repos (3, jusqu'à 6 si le club s'entraîne presque tous les jours). */
function habitudeClub() {
  const l = sportsClub(), jours = l.reduce((t, sp) => t + spPref(sp).jours.length, 0), compet = l.some(sp => spPref(sp).niv === "compet");
  const durs = l.reduce((t, sp) => { const Q = spPref(sp), Ty = typesClub(sp); return t + Q.jours.filter(d => (Ty[(Q.types || {})[d]] || Object.values(Ty)[0])[3]).length; }, 0);
  return { jours, durs, seuilDurs: Math.max(5, durs + (compet ? 3 : 2)), seuilAffilee: Math.max(3, Math.min(6, jours)) };
}
const chargeEntre = (h, de, a) => h.filter(x => x.j >= de && x.j <= a).reduce((t, x) => t + chargeX(x), 0) + clubsEntre(de, a).reduce((t, x) => t + Math.round(x.min * x.ef / 4), 0);
// charge des 7 derniers jours rapportée à la moyenne hebdomadaire des 28 derniers jours (null sans 4 semaines d'historique : sinon la moyenne serait sous-estimée)
function ratioCharge(j = jourCle(), h = lireHist()) {
  const aigue = chargeEntre(h, decaler(j, -6), j), chro = chargeEntre(h, decaler(j, -27), j) / 4;
  return h.some(x => x.j <= decaler(j, -27)) && chro >= 20 ? aigue / chro : null;
}
/* Base personnelle : chacun a sa « normale » (un 3/5 d'énergie n'a pas le même sens pour tout le monde) et le corps change avec le temps.
   On garde la moyenne et l'écart habituel de chaque réponse sur les 28 jours précédents (au moins 7 réponses), puis on compare le jour à cette base,
   comme le suivi d'un athlète par rapport à sa propre moyenne glissante. Le poids de la comparaison monte avec les réponses (jusqu'à moitié-moitié). */
function basePerso(j, F) {
  const l = Object.keys(F).filter(d => d < j && d >= decaler(j, -28)).map(d => F[d]);
  if (l.length < 7) return null;
  const st = k => { const v = l.map(r => r[k]).filter(x => x != null), m = moyenne(v); return [m, Math.sqrt(moyenne(v.map(x => (x - m) ** 2)))]; };
  return { n: l.length, ...Object.fromEntries(["h", "q", "e", "c", "st"].map(k => [k, st(k)])) };
}
// besoin de sommeil propre à chacun : la durée moyenne des nuits suivies d'une bonne énergie (4 ou 5) sur 60 jours, entre 6 h 30 et 9 h 30 ; 8 h par défaut
function besoinSommeil(j, F) {
  const v = Object.keys(F).filter(d => d < j && d >= decaler(j, -60) && F[d].e >= 4).map(d => F[d].h);
  return v.length >= 5 ? Math.max(6.5, Math.min(9.5, Math.round(moyenne(v) * 4) / 4)) : 8;
}
/* Batterie au réveil (0-100) : sommeil 30 % (par rapport à ton besoin), qualité 15 %, énergie 25 %, courbatures 15 %, stress 15 %, chaque note mêlant
   une échelle commune et l'écart à ta base personnelle ; moins la dette de sommeil des 3 nuits d'avant (le manque s'additionne), la fatigue des séances
   (semaine bien au-dessus de l'habitude, séance ou club très dur la veille, sparring encore plus) et une douleur. Renvoie { v, parts, r, besoin, n } ou null. */
function batterie(j = jourCle(), F = lireForme(), h = lireHist()) {
  const r = F[j]; if (!r) return null;
  const B0 = basePerso(j, F), besoin = besoinSommeil(j, F), a = B0 ? Math.min(.5, B0.n / 56) : 0;
  const item = (k, abs, max, inv) => { if (!a) return abs * max; const [m, sd] = B0[k], z = (r[k] - m) / Math.max(sd, .5) * (inv ? -1 : 1); return ((1 - a) * abs + a * borne01(.5 + z / 4)) * max; };
  const note = (k, inv) => item(k, (inv ? 5 - r[k] : r[k] - 1) / 4, k === "e" ? 25 : 15, inv);
  const parts = [[L("Sommeil", "Sleep"), item("h", borne01((r.h - besoin + 4) / 4), 30), 30], [L("Qualité", "Quality"), note("q"), 15], [L("Énergie", "Energy"), note("e"), 25], [L("Courbatures", "Soreness"), note("c", 1), 15], [L("Stress", "Stress"), note("st", 1), 15]];
  const dette = [1, 2, 3].reduce((t, k) => { const x = F[decaler(j, -k)]; return t + (x ? Math.max(0, besoin - x.h) : 0); }, 0);
  if (dette >= 1.5) parts.push([L("Dette de sommeil (3 nuits)", "Sleep debt (3 nights)"), -Math.min(10, dette * 2.5), 0]);
  const ra = ratioCharge(decaler(j, -1), h), veille = h.filter(x => x.j === decaler(j, -1)), cl = clubsDu(decaler(j, -1)), dure = veille.some(x => x.ef >= 8 || x.rs === 3 || chargeX(x) >= 80) || cl.some(x => x.dur);
  const malus = (ra && ra > 1.3 ? Math.min(15, (ra - 1.3) * 30) : 0) + (cl.some(x => x.t === "spar") ? 8 : dure ? 5 : 0);
  if (malus) parts.push([L("Fatigue des séances", "Training fatigue"), -malus, 0]);
  if (r.dl) parts.push([L("Douleur ou gêne", "Pain or discomfort"), r.dl === 2 ? -15 : -6, 0]);
  return { v: Math.round(Math.max(0, Math.min(100, parts.reduce((t, p) => t + p[1], 0)))), parts, r, besoin, n: B0 ? B0.n : 0 };
}
/* Points dans la journée (facultatifs, 20 secondes) : énergie, stress, corps léger ou lourd. Ils donnent un niveau ressenti (0-100) qui recale la courbe
   et apprend ton rythme de baisse : le ressenti suit la fatigue de façon plus fine et plus régulière que bien des mesures, à condition de le noter souvent. */
const QP = [QF[1], QF[3], ["f", "Corps", "Body", ["🪶", "🙂", "😐", "😓", "🧱"], ["Léger", "Light"], ["Lourd", "Heavy"], 1]];
const ressentiPoint = p => Math.round(((p.e - 1) / 4 * .5 + (5 - p.st) / 4 * .25 + (5 - p.f) / 4 * .25) * 100);
// créneaux où l'on propose un point : [début en minutes, FR, EN]
const CRENEAUX_PT = [[690, "Midi", "Midday"], [930, "Après-midi", "Afternoon"], [1170, "Soir", "Evening"]];
const creneauPt = t => CRENEAUX_PT.filter(c => t >= c[0]).pop();
const RECHARGE_SIESTE = d => d <= 20 ? 8 : d <= 30 ? 10 : d <= 60 ? 12 : 15;
// ce qui a joué depuis le réveil jusqu'à t (minutes) : heures d'éveil, séances faites (charge / 6), clubs passés (notés, ou après 21 h), siestes
function fluxJour(j, t, r, h) {
  return { eveil: Math.max(0, t - (r.rv || 420)) / 60, mult: (r.st >= 4 ? 1.25 : 1) * (r.e <= 2 ? 1.15 : 1), s: h.filter(x => x.j === j && (x.hr === undefined || x.hr * 60 <= t)).reduce((s, x) => s + chargeX(x) / 6, 0),
    c: clubsDu(j).filter(c => c.note || t >= 21 * 60).reduce((s, c) => s + c.min * c.ef / 25, 0), n: (r.si || []).filter(n => n.t <= t).reduce((s, n) => s + RECHARGE_SIESTE(n.d), 0) };
}
/* Rythme de baisse personnel (points par heure d'éveil) appris des points des 28 derniers jours : pour chaque point pris après au moins 3 h d'éveil,
   on déduit le rythme qui expliquerait le ressenti noté. Médiane (une journée bizarre ne fausse rien), bornée entre 1 et 5, et rapprochée de 2,5
   tant qu'il y a moins de 10 points. */
function rythmePerso(j, F = lireForme(), h = lireHist()) {
  const l = [];
  Object.keys(F).filter(d => d < j && d >= decaler(j, -28) && (F[d].p || []).length).forEach(d => { const B = batterie(d, F, h); F[d].p.forEach(p => { const x = fluxJour(d, p.t, F[d], h); if (x.eveil >= 3) l.push(Math.max(1, Math.min(5, (B.v - x.s - x.c + x.n - ressentiPoint(p)) / x.eveil / x.mult))); }); });
  if (l.length < 3) return { v: 2.5, n: l.length };
  const m = l.sort((a, b) => a - b)[l.length >> 1];
  return { v: 2.5 + (m - 2.5) * Math.min(1, l.length / 10), n: l.length };
}
/* Batterie au fil de la journée : pleine au réveil, elle se vide avec les heures d'éveil (à ton rythme, plus avec un stress ou une énergie basse),
   les séances et les clubs ; une sieste la recharge ; le dernier point de la journée la recale (60 % de l'écart entre ce que tu ressens et le calcul).
   conseil : valeur qui guide l'effort = réveil + séances, clubs, siestes et recalage, sans la baisse normale due à l'éveil. t : minutes depuis minuit. */
function batterieA(j, t, F = lireForme(), h = lireHist(), ry) {
  const B = batterie(j, F, h); if (!B) return null;
  const r = B.r, R = ry || rythmePerso(j, F, h), modele = u => { const x = fluxJour(j, u, r, h); return B.v - x.eveil * R.v * x.mult - x.s - x.c + x.n; };
  const x = fluxJour(j, t, r, h), pt = (r.p || []).filter(p => p.t <= t).sort((a, b) => a.t - b.t).pop(), corr = pt ? (ressentiPoint(pt) - modele(pt.t)) * .6 : 0, parts = [];
  if (x.eveil) parts.push([L("Heures d’éveil", "Hours awake"), -x.eveil * R.v * x.mult]); if (x.s) parts.push([L("Séances du jour", "Today’s workouts"), -x.s]);
  if (x.c) parts.push([L("Club du jour", "Today’s club"), -x.c]); if (x.n) parts.push([L("Sieste", "Nap"), x.n]);
  if (Math.round(corr)) parts.push([L(`Ton point de ${heureTxt(pt.t)}`, `Your ${heureTxt(pt.t)} check-in`), corr]);
  const borne = v => Math.round(Math.max(5, Math.min(100, v)));
  return { v: borne(modele(t) + corr), conseil: borne(B.v - x.s - x.c + x.n + corr), matin: B.v, parts, r, B, R, pt };
}
const heureTxt = t => Math.floor(t / 60) + " h " + String(t % 60).padStart(2, "0");
// courbe du jour : du réveil à 23 h, trait plein jusqu'à maintenant, pointillé ensuite (sans les séances à venir) ; les points notés en ronds
function courbeJour(j, maintenant) {
  const F = lireForme(), h = lireHist(), r = F[j]; if (!r) return "";
  const R = rythmePerso(j, F, h), de = r.rv || 420, a = Math.max(de + 60, 23 * 60), X = t => 10 + (t - de) / (a - de) * 280, Y = v => 100 - v * .9;
  const pas = []; for (let t = de; t < a; t += 30) pas.push(t); pas.push(a);
  const pt = t => X(t).toFixed(1) + "," + Y(batterieA(j, t, F, h, R).v).toFixed(1), avant = pas.filter(t => t <= maintenant).concat(maintenant <= a ? [maintenant] : []), apres = [maintenant, ...pas.filter(t => t > maintenant)];
  return `<svg class="courbe fm-courbe fm-jour" viewBox="0 0 300 116" role="img" aria-label="${L("Ta batterie aujourd’hui", "Your battery today")}">
    ${[25, 50, 75].map(v => `<line x1="10" x2="290" y1="${Y(v)}" y2="${Y(v)}"/><text x="0" y="${Y(v) + 3}">${v}</text>`).join("")}
    ${[de, 12 * 60, 18 * 60, a].filter((t, i, l) => t >= de && t <= a && l.indexOf(t) === i).map(t => `<text x="${X(t) - 8}" y="114">${Math.floor(t / 60)} h</text>`).join("")}
    <polyline points="${avant.map(pt).join(" ")}"/>${maintenant < a ? `<polyline class="fm-proj" points="${apres.map(pt).join(" ")}"/>` : ""}
    ${(r.p || []).map(p => `<circle class="fm-pt" cx="${X(p.t)}" cy="${Y(ressentiPoint(p))}" r="4"><title>${heureTxt(p.t)} · ${L("ressenti", "felt")} ${ressentiPoint(p)} %</title></circle>`).join("")}</svg>`;
}
const minutesMaintenant = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const batterieMaintenant = () => batterieA(jourCle(), minutesMaintenant());
// conseil d'effort : [seuil, emoji, titre FR, EN, détail FR, EN, couleur]
const PALIERS = [[75, "🟢", "Feu vert", "Green light", "Séance intense possible : effort 7 à 9 sur 10.", "Hard session on: effort 7 to 9 out of 10.", "#16A34A"],
  [55, "🟡", "Séance normale", "Normal session", "Effort modéré à soutenu : 5 à 7 sur 10.", "Moderate to steady effort: 5 to 7 out of 10.", "#CA8A04"],
  [35, "🟠", "Séance légère", "Light session", "Technique ou mobilité, effort 3 à 5 sur 10. Écourte si ça ne passe pas.", "Technique or mobility, effort 3 to 5 out of 10. Cut it short if it feels wrong.", "#EA580C"],
  [0, "🔴", "Récupération", "Recovery", "Étirements, cohérence cardiaque ou marche : ton corps reconstruit.", "Stretching, breathing or a walk: your body is rebuilding.", "#DC2626"]];
const palier = v => PALIERS.find(p => v >= p[0]);
function conseilsForme(B) {
  const r = B.r, l = [];
  if (r.h < 6) l.push(L("Nuit courte : pas de record ni de sprint maximal aujourd’hui, le risque de blessure monte.", "Short night: no records or all-out sprints today, injury risk goes up."));
  if (r.c >= 4) l.push(L("Fortes courbatures : travaille d’autres muscles ou bouge en douceur.", "Strong soreness: train other muscles or move gently."));
  if (r.st >= 4) l.push(L("Stress élevé : une séance modérée aide, une séance épuisante en rajoute.", "High stress: a moderate session helps, an exhausting one adds to it."));
  if (r.dl) { const z = (r.z || []).filter(k => ZONES_FM[k]).map(k => L(...ZONES_FM[k]).toLowerCase()).join(", ");
    l.push(r.dl === 2 ? L(`Douleur${z ? " (" + z + ")" : ""} : aucun effort qui la réveille. Si elle est vive, gonfle ou dure plus de quelques jours, montre-la à un médecin.`, `Pain${z ? " (" + z + ")" : ""}: no effort that triggers it. If it is sharp, swollen or lasts more than a few days, see a doctor.`)
      : L(`Gêne${z ? " (" + z + ")" : ""} : les séances qui la sollicitent sont mises de côté ; arrête si elle devient une douleur.`, `Discomfort${z ? " (" + z + ")" : ""}: sessions that load it are set aside; stop if it turns into pain.`)); }
  if (B.parts.some(p => p[0] === L("Fatigue des séances", "Training fatigue"))) l.push(L("Tes dernières séances pèsent encore : la batterie en tient compte.", "Your recent sessions still weigh on you: the battery accounts for it."));
  return l;
}
const icoBatterie = v => `<span class="batt" style="--v:${v}%;--bc:${palier(v)[6]}" aria-hidden="true"><i></i></span>`;

const ZONES_FM = { epaule: ["Épaule", "Shoulder", "haut"], poignet: ["Coude, poignet, main", "Elbow, wrist, hand", "haut"], dos: ["Cou ou dos", "Neck or back", "tronc"], hanche: ["Hanche ou aine", "Hip or groin", "bas"], genou: ["Genou", "Knee", "bas"], cheville: ["Cheville ou pied", "Ankle or foot", "bas"] };
// choix unique dans une feuille (les chips d'outils.js ne visent que l'écran d'outil)
const choixFm = (id, l, v) => `<div class="chips" id="${id}">${l.map(([k, f, e]) => `<button class="toggle" data-v="${k}" aria-pressed="${String(k) === String(v)}">${L(f, e)}</button>`).join("")}</div>`;
const brancherFm = (id, fn) => $(id).querySelectorAll("[data-v]").forEach(b => b.onclick = () => { $(id).querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); fn(b.dataset.v); });

/* --- Séance de club notée : type réel et effort (ou « pas eu lieu ») --- */
const EF_CLUB = [[4, "Facile", "Easy"], [6, "Moyenne", "Moderate"], [8, "Dure", "Hard"], [9, "Très dure", "Very hard"]];
const blocClub = c => `${choixFm("fmClT", [...Object.entries(typesClub(c.sp)).map(([k, [f, e]]) => [k, f, e]), ["non", "Pas eu lieu", "Didn’t happen"]], c.t)}
  <div id="fmClE" ${c.t === "non" ? "hidden" : ""}><small>${L("Intensité", "Intensity")}</small>${choixFm("fmClEf", EF_CLUB, EF_CLUB.reduce((m, x) => Math.abs(x[0] - c.ef) < Math.abs(m - c.ef) ? x[0] : m, 6))}</div>`;
function brancherClub(c) {
  brancherFm("fmClT", v => { c.t = v; $("fmClE").hidden = v === "non"; if (v !== "non") { c.ef = typesClub(c.sp)[v][2]; $("fmClEf").querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", +x.dataset.v === c.ef)); } });
  brancherFm("fmClEf", v => c.ef = +v);
}
function noterClub(j, c) {
  const C = lireClubs(), lim = decaler(jourCle(), -365), n = C[j] && C[j].sp ? { [C[j].sp]: { t: C[j].t, ef: C[j].ef } } : C[j] || {};   // conservation limitée à un an ; l'ancien format d'un seul sport est converti
  C[j] = { ...n, [c.sp]: { t: c.t, ef: c.t === "non" ? 0 : c.ef } };
  stocker("clubJournal", JSON.stringify(Object.fromEntries(Object.entries(C).filter(([k]) => k >= lim))));
}
function feuilleClub(j, sp = "boxe", apres = majForme) {
  const x = clubJour(sp, j), t0 = Object.keys(typesClub(sp))[0], c = x ? { sp, t: x.t, ef: x.ef } : { sp, t: t0, ef: typesClub(sp)[t0][2] }, auj = jourCle();
  ouvrirFeuilleInfo(L(...SP[sp].nom) + " · " + (j === auj ? L("ma séance de club d’aujourd’hui", "today’s club session") : j === decaler(auj, -1) ? L("ma séance de club d’hier", "yesterday’s club session") : L("séance de club du ", "club session on ") + new Date(j + "T12:00").toLocaleDateString(L("fr-FR", "en-GB"), { weekday: "long", day: "numeric" })), `<p class="sh-aide">${L("Ce que tu as vraiment fait : ta semaine, ta charge et ta batterie de demain en tiennent compte.", "What you actually did: your week, your load and tomorrow’s battery take it into account.")}</p>
    <div class="fm-q">${blocClub(c)}</div><button class="primary" id="fmClOk">${L("Enregistrer", "Save")}</button>`);
  brancherClub(c);
  $("fmClOk").onclick = () => { noterClub(j, c); fermerFeuille(); majForme(); if (apres !== majForme) apres(); };
}

/* --- Carte « Aujourd'hui · <sport> » : 2 ou 3 séances au choix selon la batterie, la douleur, les clubs du jour, de la veille et du lendemain,
   et les efforts durs de la semaine. Pour le sport de club du jour (sinon celui de la veille, du lendemain, ou le premier réglé). --- */
// séances mises de côté selon la zone qui fait mal (motifs des codes de séance des sports)
const EVITER_SP = { haut: /^tech|^t(bf|kx)_|puiss|specif|rsa|force|affut|frappe|lancer|service|tir/, bas: /^t(bf|kx)_|puiss|sprint|rsa|specif|affut|vitesse|plio|saut|explo|deten/, tronc: /puiss|gainage|force/ };
const ICO_SP = { boxe: "🥊", foot: "⚽", basket: "🏀", handball: "🤾", volley: "🏐", tennis: "🎾", padel: "🎾", course: "🏃", cyclisme: "🚴", natation: "🏊", escalade: "🧗", ski: "⛷️", surf: "🏄", pilates: "🧘", athle: "🏅", trail: "⛰️" };
function propositionsSp(sp) {
  const G = SP[sp], auj = jourCle(), d = (new Date().getDay() + 6) % 7, B = batterie(), BN = batterieMaintenant(), v = BN ? BN.conseil : 60, r = B ? B.r : {}, S = spSemaine(sp), a = jourCle(lundi()), h = lireHist();
  const plusDur = l => l.find(x => x.dur) || l[0] || null, club = plusDur(clubsDu(auj)), hier = plusDur(clubsDu(decaler(auj, -1))), dem = plusDur(clubsDu(decaler(auj, 1)));
  const zones = r.dl ? r.z || [] : [], evite = c => zones.some(z => (EVITER_SP[(ZONES_FM[z] || [])[2]] || /$^/).test(c)), dur = c => durSp(sp, c), code = re => Object.keys(G.S).filter(c => re.test(c));
  const dursApp = h.filter(x => x.j >= a && x.j < auj && (x.k || "").startsWith(G.pre) && G.S[x.k.slice(G.pre.length)] && dur(x.k.slice(G.pre.length))).length, dursClub = clubsEntre(a, decaler(auj, -1)).filter(x => x.dur).length;
  // avec Ma semaine, la séance perso du jour peut venir d'un programme, de tes types ou de l'objectif : elle remplace alors la prépa du sport
  const W = modeComplet() ? semaineComplete().jours[d] : null, autre = W && W.perso && W.perso.src !== "sport:" + sp && !W.perso.s.passe ? W.perso.s : null;
  const fait = h.some(x => x.j === auj && (x.k || "").startsWith(G.pre)), prevues = autre || !S ? [] : S.jours[d].l.filter(c => G.S[c]), techs = code(/^tech/), tech = techs[d % (techs.length || 1)];
  const recup = v < 35 || r.dl === 2 || (hier && hier.dur && v < 55) || dursApp + dursClub >= habitudeClub().seuilDurs, l = [];
  // c : code de séance du sport, ou repli (type de Ma semaine) quand le sport n'en a pas
  const ajout = (c, f, fr, en, repli) => { if (c && G.S[c] && !evite(c) && !l.some(o => o.c === c)) l.push({ c, t: L(...G.S[c].t), col: G.S[c].c, rpe: G.S[c].rpe + "/10", f, p: L(fr, en), go: () => lancerSp(sp, c, f < 1 ? f : undefined) });
    else if (!c && repli && !l.some(o => o.t === repli.t)) l.push({ t: repli.t, col: repli.c, rpe: "", f: 1, p: L(fr, en), go: repli.go }); };
  const mob = (fr, en) => ajout(code(/^mobil/)[0], 1, fr, en, objType("mobilite", [sp], lireNiv())), rec = (fr, en) => ajout(code(/^recup/)[0], 1, fr, en, tpl("C:complet"));
  let etat;
  if (club) {
    etat = L(`Jour de club · ${L(...SP[club.sp].nom)} ${club.nom[0].toLowerCase()}`, `Club day · ${L(...SP[club.sp].nom)} ${club.nom[1].toLowerCase()}`);
    mob("10 min avant le club, pour arriver délié.", "10 min before the club, to arrive loose.");
    if (recup) rec("Batterie basse : vas-y doucement au club, ou remplace-le par ceci.", "Low battery: go easy at the club, or swap it for this.");
    else if (!club.dur && v >= 55) prevues.filter(c => !dur(c)).forEach(c => ajout(c, .7, "Club tranquille : un complément léger reste possible.", "Easy club day: a light extra is fine."));
  } else if (recup) {
    etat = L("Jour de récupération", "Recovery day");
    rec(v < 35 ? "Batterie basse : on fait circuler le sang, sans fatigue." : "Ta semaine a déjà été dure : le corps reconstruit.", v < 35 ? "Low battery: get the blood flowing, no fatigue." : "Your week has already been hard: your body is rebuilding.");
    mob("Hanches, dos et épaules, sans douleur.", "Hips, back and shoulders, pain-free.");
  } else {
    etat = prevues.length ? L("Séance prévue dans ton parcours", "Session planned in your plan") : L("Jour libre", "Free day");
    // séance dure prévue : entière au feu vert loin d'un club dur, allégée à côté d'un seul, remplacée entre deux clubs durs ou batterie sous 55 %
    const serre = !!(hier && hier.dur) + !!(dem && dem.dur), proche = dem && dem.dur ? dem : hier && hier.dur ? hier : null;
    prevues.forEach(c => {
      if (dur(c) && (v < 55 || serre === 2 || (serre && v < 75))) return;
      const f = !dur(c) || (v >= 75 && !serre) ? 1 : serre ? .6 : .8;
      ajout(c, f, f === 1 ? "Feu vert : la séance telle que prévue." : proche ? `Club ${proche.nom[0].toLowerCase()} ${proche === dem ? "demain" : "hier"} : volume réduit pour garder de la fraîcheur.` : "Batterie moyenne : volume réduit.", f === 1 ? "Green light: the session as planned." : proche ? `${proche.nom[1]} club ${proche === dem ? "tomorrow" : "yesterday"}: reduced volume to stay fresh.` : "Average battery: reduced volume.");
    });
    if (autre && !(autre.dur && (v < 55 || serre === 2 || (serre && v < 75)))) l.unshift({ t: autre.t, col: autre.c, rpe: "", f: 1, p: L("Ta séance perso prévue dans Ma semaine.", "Your own session planned in My week.") + " " + autre.s, go: autre.go });
    else if (autre) etat += " · " + L("séance perso remplacée : trop dure pour aujourd’hui", "own session swapped: too hard for today");
    if (prevues.some(dur) && !l.some(o => o.c && dur(o.c))) etat += " · " + (serre === 2 ? L("séance dure remplacée : entre deux clubs durs", "hard session swapped: between two hard club days") : serre && v >= 55 ? L(`séance dure remplacée : club dur ${hier && hier.dur ? "hier" : "demain"}`, `hard session swapped: hard club day ${hier && hier.dur ? "yesterday" : "tomorrow"}`) : L("séance dure remplacée : batterie trop basse", "hard session swapped: battery too low"));
    if (v >= 55 && !serre) ajout(tech, 1, "Technique de ton sport, effort modéré.", "Your sport’s technique, moderate effort.");
    else ajout(tech, .6, "Technique tranquille : la qualité sans la fatigue.", "Easy technique: quality without fatigue.");
    if (v >= 55) ajout(code(/^gainage/)[0], 1, "Gainage : le lien entre le bas et le haut du corps.", "Core: the link between lower and upper body.", objType("gainage", [sp], lireNiv()));
    mob("Si tu manques de temps ou d’envie : 10 min.", "Short on time or motivation: 10 min.");
  }
  if (!l.length) mob("Sans douleur, en respirant.", "Pain-free, breathing.");
  return { etat, l: l.slice(0, 3), B, club, hier, fait, durs: dursApp + dursClub };
}
const propositionsBx = () => propositionsSp("boxe");
// sport de la carte : celui du club du jour, sinon de la veille, du lendemain, ou le premier réglé
const sportDuJour = () => { const auj = jourCle(), l = sportsClub(); return ([auj, decaler(auj, -1), decaler(auj, 1)].map(j => (clubsDu(j)[0] || {}).sp).find(sp => l.includes(sp))) || l[0]; };
function majJour() {
  const Z = $("jourCarte"); if (!Z) return;
  const sp = sportDuJour(); if (!sp) { Z.innerHTML = ""; return; }
  const O = propositionsSp(sp), auj = jourCle(), hierNote = clubsDu(decaler(auj, -1)).find(x => !x.note), cAuj = clubsDu(auj)[0], notable = cAuj ? [auj, cAuj.sp] : hierNote ? [decaler(auj, -1), hierNote.sp] : null;
  Z.innerHTML = `<strong>${ICO_SP[sp] || "🏟️"} ${L("Aujourd’hui", "Today")} · ${L(...SP[sp].nom)}</strong><small>${O.etat}${O.fait ? " · " + L("séance faite ✓", "workout done ✓") : ""} · ${L(`${O.durs} effort${O.durs > 1 ? "s" : ""} dur${O.durs > 1 ? "s" : ""} cette semaine`, `${O.durs} hard effort${O.durs > 1 ? "s" : ""} this week`)}${O.B ? "" : " · " + L("remplis ta batterie pour un conseil précis", "fill in your battery for precise advice")}</small>
    ${O.l.map((o, k) => `<button class="jr-opt" style="--c:${o.col}" data-jk="${k}"><span><b>${o.t}</b><small>${o.p}${o.rpe ? " · " + L("effort", "effort") + " " + o.rpe : ""}${o.f < 1 ? " · " + L("volume allégé", "reduced volume") : ""}</small></span><i aria-hidden="true">▶</i></button>`).join("")}
    ${notable ? `<button class="toggle" id="jrClub">📝 ${notable[0] === auj ? L("Noter ma séance de club", "Log my club session") : L("Noter mon club d’hier", "Log yesterday’s club")}</button>` : ""}`;
  Z.querySelectorAll("[data-jk]").forEach(b => b.onclick = () => O.l[+b.dataset.jk].go());
  if ($("jrClub")) $("jrClub").onclick = () => feuilleClub(notable[0], notable[1]);
}
$("formeCarte").insertAdjacentHTML("afterend", `<div class="semaine-carte jour-carte" id="jourCarte"></div>`);

/* --- Carte du corps : zones de gêne et exercices qui les sollicitent ---
   Repérage par mots-clés dans le nom, les muscles et la description de chaque exercice : une aide pour éviter ce qui risque de réveiller la douleur, pas un avis médical. */
const SOLLICITE = { epaule: /épaule|deltoïde|coiffe|pompe|push|développ|dips|traction|tirage|\bpress\b|planche|burpee|ours|bear|crawl|shoulder/i,
  poignet: /poignet|avant-bras|pompe|planche|burpee|climber|ours|bear|crawl|mains? au sol|appui sur les mains|wrist/i,
  dos: /\bdos\b|lombaire|soulevé|deadlift|good morning|rowing|superman|tirage|\bback/i, hanche: /hanche|fessier|adducteur|psoas|fléchisseur|fente|squat|pont|hip|glute/i,
  genou: /genou|squat|fente|saut|sauté|jump|step|chaise|pistol|burpee|skater|lunge|bond|pliom|knee/i, cheville: /cheville|mollet|saut|jump|corde|sprint|skipping|talon|pointes? de pieds?|burpee|skater|ankle|calf/i };
// nom et muscles travaillés seulement (la description cite souvent d'autres parties du corps) ; les étirements doux ne sont pas signalés
const zonesEx = id => { const e = EXERCICES[id]; if (!e || e.etir) return []; const t = [e.nom, e.nomFr, e.muscles].join(" "); return Object.keys(SOLLICITE).filter(z => SOLLICITE[z].test(t)); };
const zonesDouleur = () => { const r = lireForme()[jourCle()]; return r && r.dl ? r.z || [] : []; };
const nomZone = z => L(ZONES_FM[z][0], ZONES_FM[z][1]);
// silhouette de face ; chaque zone est un bouton (cible de 44 px au moins à l'écran)
function carteCorps(sel) {
  const P = { epaule: [[54, 74], [106, 74]], poignet: [[30, 152], [130, 152]], dos: [[80, 108]], hanche: [[80, 156]], genou: [[66, 216], [94, 216]], cheville: [[64, 276], [96, 276]] };
  return `<svg class="corps" viewBox="0 0 160 300" role="group" aria-label="${L("Carte du corps : touche les zones qui te gênent", "Body map: tap the areas that bother you")}"><g class="corps-sil" aria-hidden="true"><circle cx="80" cy="28" r="18"/><rect x="56" y="52" width="48" height="104" rx="20"/><path d="M58 66 L32 150 M102 66 L128 150 M70 150 L65 282 M90 150 L95 282"/></g>
    ${Object.entries(P).map(([k, pts]) => `<g class="corps-z" data-zone="${k}" role="button" tabindex="0" aria-pressed="${sel.includes(k)}" aria-label="${nomZone(k)}">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18"/>`).join("")}</g>`).join("")}</svg>`;
}
function brancherCorps(Z, sel, maj) {
  Z.querySelectorAll("[data-zone]").forEach(g => { const f = () => { const k = g.dataset.zone, i = sel.indexOf(k); i < 0 ? sel.push(k) : sel.splice(i, 1); g.setAttribute("aria-pressed", sel.includes(k)); if (maj) maj(); };
    g.onclick = f; g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }; });
}
// feuille « Douleur et gêne » : niveau, carte du corps, exercices qui sollicitent chaque zone, séance sans douleur ; enregistré dans la réponse du matin
function feuilleDouleur() {
  const auj = jourCle(), r = lireForme()[auj]; if (!r) return questionnaire();
  let niv = r.dl || 0; const sel = [...(niv ? r.z || [] : [])], tous = Object.keys(EXERCICES);
  ouvrirFeuilleInfo(L("Douleur et gêne", "Pain and discomfort"), `<p class="sh-aide">${L("Touche les zones qui te gênent aujourd’hui : l’appli te signale les exercices qui les sollicitent et te propose une séance qui les évite.", "Tap the areas that bother you today: the app flags the exercises that load them and suggests a session that avoids them.")}</p>
    <div class="fm-q">${choixFm("dlNiv", [[0, "Aucune", "None"], [1, "Gêne", "Discomfort"], [2, "Douleur", "Pain"]], niv)}</div><div class="corps-boite" id="dlCorps">${carteCorps(sel)}</div><ul class="carnet dl-liste" id="dlListe"></ul>
    <button class="primary" id="dlGo">🧘 ${L("Séance sans douleur · 15 min", "Pain-free session · 15 min")}</button>
    <p class="sh-aide">${L("Une douleur qui dure plus de quelques jours, qui augmente ou qui t’empêche de bouger normalement : consulte un professionnel de santé. L’appli ne fait pas de diagnostic.", "Pain that lasts more than a few days, gets worse or stops you moving normally: see a health professional. The app does not diagnose.")}</p>`);
  const rendu = () => { $("dlListe").innerHTML = sel.length ? sel.map(z => { const ex = tous.filter(id => zonesEx(id).includes(z)); return `<li><span><b>${nomZone(z)}</b><small>${ex.length} ${L("exercices la sollicitent, mis de côté dans la séance sans douleur et signalés avant tes séances", "exercises load it, left out of the pain-free session and flagged before your workouts")}${ex.length ? " : " + ex.slice(0, 4).map(id => EXERCICES[id].nom).join(", ") + (ex.length > 4 ? "…" : "") : ""}</small></span></li>`; }).join("")
      : `<li><small>${L("Aucune zone choisie.", "No area selected.")}</small></li>`; $("dlGo").hidden = !sel.length; };
  const garder = () => { const G = lireForme(); G[auj] = { ...G[auj], dl: niv, z: niv ? [...sel] : [] }; stockerForme(G); majForme(); rendu(); };
  const majNiv = v => { niv = v; $("dlNiv").querySelectorAll("[data-v]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.v === v)); };
  brancherFm("dlNiv", v => { majNiv(+v); if (!niv) { sel.length = 0; $("dlCorps").innerHTML = carteCorps(sel); brancherCorps($("dlCorps"), sel, toucher); } garder(); });
  const toucher = () => { if (sel.length && !niv) majNiv(1); garder(); };
  brancherCorps($("dlCorps"), sel, toucher); rendu();
  $("dlGo").onclick = () => { fermerFeuille(); if (!composerExpress({ ...quickPrefs(), min: 15, int: "calme", sans: sel })) alert(L("Pas assez d’exercices sans ces zones : fais plutôt une marche ou de la mobilité douce.", "Not enough exercises without these areas: take a walk or do gentle mobility instead.")); };
}
/* Option recommandée (à la place du Plan B sur l'accueil) quand la fatigue ou le risque de blessure est fort :
   douleur ou gêne localisée → séance sans douleur ; batterie très basse ou charge de la semaine en forte hausse → récupération active. */
function optionRecommandee() {
  const N = batterieMaintenant(), r = lireForme()[jourCle()] || {}, zs = r.dl ? r.z || [] : [], ra = ratioCharge();
  if (r.dl === 2 || zs.length) return { t: L("Séance sans douleur", "Pain-free session"), raison: r.dl === 2 ? L("douleur", "pain") + (zs.length ? " : " + zs.map(nomZone).join(", ").toLowerCase() : "") : L("gêne : ", "discomfort: ") + zs.map(nomZone).join(", ").toLowerCase(), ico: "🩹",
    go: () => composerExpress({ ...quickPrefs(), min: 15, int: "calme", sans: zs }) || tpl("C:repos").go() };
  if ((N && N.conseil < 35) || (ra && ra >= 1.5)) return { t: L("Récupération active", "Active recovery"), raison: N && N.conseil < 35 ? L("batterie très basse", "very low battery") : L("charge de la semaine en forte hausse", "weekly load rising sharply"), ico: "🧘", go: () => tpl("C:repos").go() };
  return null;
}
/* --- Carte de l'accueil « Ma forme » : batterie, douleur et semaine côte à côte, chacune ouvre son détail --- */
function majForme() {
  majJour();
  const Z = $("formeCarte"); if (!Z) return;
  const B = batterieMaintenant();   // le chiffre affiché descend dans la journée ; le conseil d'effort suit la récupération et les séances du jour (B.conseil)
  // regroupement : la batterie (ci-dessus) devient la première tuile, puis la douleur et la semaine
  const r = lireForme()[jourCle()] || {}, zs = r.dl ? r.z || [] : [], P0 = B && palier(B.conseil), cr = B && pointAttendu(B.r);
  Z.classList.add("forme-bloc");
  Z.innerHTML = `<div class="fb-tete"><strong>${L("Ma forme", "My fitness")}</strong>${cr ? `<button class="toggle" id="fmPt">📍 ${L("Faire le point", "Check in")}</button>` : ""}</div><div class="fb-tuiles">
    <button class="fb-t" id="fmOuvrir" style="--c:${B ? P0[6] : "var(--brand)"}">${B ? icoBatterie(B.v) : `<span class="fb-i">🔋</span>`}<b>${B ? B.v + " %" : L("À remplir", "To fill in")}</b><small>${B ? L(P0[2], P0[3]) : L("30 s le matin", "30 s each morning")}</small></button>
    <button class="fb-t" id="fbDl" style="--c:${r.dl === 2 ? "var(--rouge)" : r.dl ? "var(--ambre)" : "var(--feu-vert)"}"><span class="fb-i">${r.dl ? "🩹" : "💚"}</span><b>${!B ? L("Douleur", "Pain") : r.dl === 2 ? L("Douleur", "Pain") : r.dl ? L("Gêne", "Discomfort") : L("Aucune", "None")}</b><small>${zs.length ? zs.map(nomZone).join(", ") : B ? L("carte du corps", "body map") : L("au questionnaire", "in the check-in")}</small></button>
    <button class="fb-t" id="fbSem"><span class="fb-i">📅</span><b id="fbSemV">${L("Ma semaine", "My week")}</b><small id="fbSemS"></small></button></div>`;
  $("fmOuvrir").onclick = () => B ? detailForme() : questionnaire();
  $("fbDl").onclick = () => B ? feuilleDouleur() : questionnaire();
  if ($("fmPt")) $("fmPt").onclick = () => pointJour();
  if (typeof tuileSemaine === "function") tuileSemaine();
}
function detailForme() {
  const N = batterieMaintenant(), B = N.B, P = palier(N.conseil), c = conseilsForme(B), auj = jourCle();
  ouvrirFeuilleInfo(L("Ta batterie du jour", "Today’s battery"), `<div class="batt-grand">${icoBatterie(N.v)}<b>${N.v} %</b></div>${courbeJour(auj, minutesMaintenant())}
    <p class="fm-legende"><i class="fm-l-ligne"></i>${L("calcul", "estimate")} <i class="fm-l-pt"></i>${L("tes points", "your check-ins")}</p>
    <button class="primary" id="fmPoint">📍 ${L("Faire le point maintenant (20 s)", "Check in now (20 s)")}</button><p class="sh-aide">${L(`${B.v} % au réveil, maintenant ${N.v} % : elle se vide au fil de la journée (éveil, stress, séances) et une sieste la recharge.`, `${B.v}% on waking, now ${N.v}%: it drains through the day (being awake, stress, workouts) and a nap recharges it.`)} ${L("Le conseil d’effort, lui, suit ta récupération et tes séances du jour, pas la baisse normale due à l’éveil.", "The effort advice follows your recovery and today’s workouts, not the normal drop from being awake.")}</p>
    <p><b>${P[1]} ${L(P[2], P[3])}</b> · ${L(P[4], P[5])}</p>
    ${c.length ? `<ul class="prog-obj">${c.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
    ${N.parts.length ? `<h3>${L("Depuis ton réveil", "Since you woke up")}</h3><ul class="carnet ef-liste">${N.parts.map(([n, v]) => `<li><span>${n}</span><b>${v > 0 ? "+" : ""}${Math.round(v)}</b></li>`).join("")}</ul>` : ""}
    <div class="fm-q"><b>😴 ${L("J’ai fait une sieste", "I took a nap")}</b>${choixFm("fmSieste", [[20, "10-20 min", "10-20 min"], [30, "30 min", "30 min"], [60, "1 h", "1 h"], [90, "1 h 30", "1 h 30"]], "")}
      <details><summary>${L("Quelle sieste choisir ?", "Which nap to choose?")}</summary><p>${L("Une sieste de 10 à 20 minutes recharge la vigilance sans réveil pâteux : on reste en sommeil léger. Entre 30 et 60 minutes, on entre en sommeil profond et le réveil peut être difficile pendant un moment (inertie du sommeil). 1 h 30 correspond à un cycle complet : on se réveille plus facilement. Évite les siestes après 16 h, elles retardent l’endormissement du soir.", "10 to 20 minutes restores alertness without grogginess: you stay in light sleep. Between 30 and 60 minutes you enter deep sleep and waking can feel heavy for a while (sleep inertia). 1 h 30 is a full cycle: waking is easier. Avoid naps after 4 pm, they delay falling asleep at night.")}</p></details></div>
    <h3>${L("Au réveil : d’où vient ce chiffre", "On waking: where this number comes from")}</h3><ul class="carnet ef-liste">${B.parts.map(([n, v, m]) => `<li><span>${n}</span><b>${m ? Math.round(v) + " / " + m : Math.round(v)}</b></li>`).join("")}</ul>
    <h3>${L("Ce que l’appli a appris sur toi", "What the app has learned about you")}</h3><ul class="carnet ef-liste">
      <li><span>${L("Ton besoin de sommeil", "Your sleep need")}</span><b>${heureTxt(B.besoin * 60).replace(" 00", "")}</b></li>
      <li><span>${L("Ta baisse par heure d’éveil", "Your drop per waking hour")}</span><b>${virgule(N.R.v)} %</b></li>
      <li><span>${L("Jours dans ta base personnelle", "Days in your personal baseline")}</span><b>${B.n} / 28</b></li></ul>
    <p class="sh-aide">${L(`Chaque matin est comparé à tes 28 derniers jours : la batterie suit ta normale, pas une moyenne de population, et change avec toi. Le besoin de sommeil vient de tes nuits suivies d’une bonne énergie ; la baisse par heure, de tes points (${N.R.n} pour l’instant, elle devient personnelle à partir de 3).`, `Each morning is compared with your last 28 days: the battery follows your normal, not a population average, and changes with you. Sleep need comes from nights followed by good energy; the hourly drop, from your check-ins (${N.R.n} so far, it becomes personal from 3).`)}</p>
    <p class="sh-aide">${L("Un repère, pas un diagnostic : si tu te sens mal, écoute ton corps avant le chiffre.", "A guide, not a diagnosis: if you feel unwell, listen to your body before the number.")}</p>
    <button class="toggle" id="fmModif">${L("Modifier mes réponses", "Edit my answers")}</button>`);
  $("fmModif").onclick = () => questionnaire(); $("fmPoint").onclick = () => pointJour();
  brancherFm("fmSieste", d => { const G = lireForme(); G[auj] = { ...G[auj], si: [...(G[auj].si || []), { t: minutesMaintenant(), d: +d }] }; stockerForme(G); majForme(); detailForme(); bulleMs(L(`Sieste notée : +${RECHARGE_SIESTE(+d)} %`, `Nap logged: +${RECHARGE_SIESTE(+d)}%`)); });
}
function questionnaire() {
  const F = lireForme(), auj = jourCle(), r = { h: 7.5, q: 3, e: 3, c: 2, st: 2, dl: 0, z: [], ...(F[auj] || F[decaler(auj, -1)] || {}) };   // on part des réponses de la veille : souvent proches
  const hier = decaler(auj, -1), cl = clubsDu(hier).find(x => !x.note), ch = cl ? { sp: cl.sp, t: cl.t, ef: cl.ef } : null;   // club d'hier pas encore noté : on le demande ici
  const ligne = ([k, fr, en, em, [bf, be], [hf, he]]) => `<div class="fm-q"><b>${L(fr, en)}</b><div class="fm-notes" role="radiogroup" aria-label="${L(fr, en)}">${em.map((e, i) => `<button class="toggle" role="radio" data-k="${k}" data-v="${i + 1}" aria-pressed="${r[k] === i + 1}" aria-checked="${r[k] === i + 1}" aria-label="${i + 1} / 5">${e}</button>`).join("")}</div><small><span>${L(bf, be)}</span><span>${L(hf, he)}</span></small></div>`;
  ouvrirFeuilleInfo(L("Comment tu te sens ?", "How do you feel?"), `<p class="sh-aide">${L("Réponds au réveil, c’est le plus fiable. Tes réponses restent sur ce téléphone.", "Answer when you wake up, it’s the most reliable. Your answers stay on this phone.")}</p>
    <div class="fm-q"><b>${L("Heures de sommeil", "Hours of sleep")}</b><div class="stepper"><button id="fmMoins" aria-label="${L("Une demi-heure de moins", "Half an hour less")}">−</button><output id="fmH"></output><button id="fmPlus" aria-label="${L("Une demi-heure de plus", "Half an hour more")}">+</button></div></div>
    ${QF.map(ligne).join("")}
    <div class="fm-q"><b>${L("Douleur ou gêne", "Pain or discomfort")}</b>${choixFm("fmDl", [[0, "Aucune", "None"], [1, "Gêne", "Discomfort"], [2, "Douleur", "Pain"]], r.dl)}
      <div id="fmZones" ${r.dl ? "" : "hidden"}><small>${L("Où ? Touche le corps ou les noms (plusieurs possibles)", "Where? Tap the body or the names (several allowed)")}</small><div class="corps-boite" id="fmCorps">${carteCorps(r.z)}</div><div class="chips">${Object.entries(ZONES_FM).map(([k, [f, e]]) => `<button class="toggle" data-fmz="${k}" aria-pressed="${r.z.includes(k)}">${L(f, e)}</button>`).join("")}</div></div></div>
    ${ch ? `<div class="fm-q"><b>${L("Ta séance de club d’hier", "Yesterday’s club session")} · ${L(...SP[ch.sp].nom)}</b>${blocClub(ch)}</div>` : ""}<button class="primary" id="fmOk">${L("Voir ma batterie", "See my battery")}</button>`);
  const majH = () => $("fmH").textContent = Math.floor(r.h) + " h" + (r.h % 1 ? " 30" : "");
  majH(); $("fmMoins").onclick = () => { r.h = Math.max(2, r.h - .5); majH(); }; $("fmPlus").onclick = () => { r.h = Math.min(13, r.h + .5); majH(); };
  document.querySelectorAll(".fm-notes [data-k]").forEach(b => b.onclick = () => { r[b.dataset.k] = +b.dataset.v; b.parentNode.querySelectorAll("button").forEach(x => { const on = x === b; x.setAttribute("aria-pressed", on); x.setAttribute("aria-checked", on); }); });
  brancherFm("fmDl", v => { r.dl = +v; $("fmZones").hidden = !r.dl; });
  r.z = [...r.z]; const syncZ = () => { document.querySelectorAll("[data-fmz]").forEach(x => x.setAttribute("aria-pressed", r.z.includes(x.dataset.fmz))); $("fmCorps").querySelectorAll("[data-zone]").forEach(g => g.setAttribute("aria-pressed", r.z.includes(g.dataset.zone))); };
  document.querySelectorAll("[data-fmz]").forEach(b => b.onclick = () => { const k = b.dataset.fmz, i = r.z.indexOf(k); i < 0 ? r.z.push(k) : r.z.splice(i, 1); syncZ(); });
  brancherCorps($("fmCorps"), r.z, syncZ);
  if (ch) brancherClub(ch);
  $("fmOk").onclick = () => { F[auj] = { ...(F[auj] || {}), h: r.h, q: r.q, e: r.e, c: r.c, st: r.st, dl: r.dl, z: r.dl ? r.z : [], rv: (F[auj] || {}).rv || Math.max(300, Math.min(660, minutesMaintenant())) }; stockerForme(F); if (ch) noterClub(hier, ch); majForme(); if (ecranCourant === "progres") ouvrirProgres(); detailForme(); };
}
// créneau ouvert (midi, après-midi, soir) sans point noté depuis son début : on le propose sur la carte
const pointAttendu = r => { const t = minutesMaintenant(), c = creneauPt(t); return c && t - (r.rv || 420) >= 180 && !(r.p || []).some(p => p.t >= c[0]) ? c : null; };
function pointJour() {
  const F = lireForme(), auj = jourCle(); if (!F[auj]) return questionnaire();   // le point complète le matin : sans lui, on commence par le questionnaire
  const d = (F[auj].p || []).slice(-1)[0] || {}, r = { e: d.e || F[auj].e, st: d.st || F[auj].st, f: d.f || 2 }, cr = creneauPt(minutesMaintenant());
  ouvrirFeuilleInfo(L("Faire le point", "Check in") + (cr ? " · " + L(cr[1], cr[2]) : ""), `<p class="sh-aide">${L("Trois réponses sur le moment. Plus tu fais le point, plus la courbe colle à toi : l’appli apprend ton rythme de baisse dans la journée.", "Three answers about right now. The more you check in, the closer the curve fits you: the app learns how fast you drop during the day.")}</p>
    ${QP.map(([k, fr, en, em, [bf, be], [hf, he]]) => `<div class="fm-q"><b>${L(fr, en)}</b><div class="fm-notes" role="radiogroup" aria-label="${L(fr, en)}">${em.map((e, i) => `<button class="toggle" role="radio" data-k="${k}" data-v="${i + 1}" aria-pressed="${r[k] === i + 1}" aria-checked="${r[k] === i + 1}" aria-label="${i + 1} / 5">${e}</button>`).join("")}</div><small><span>${L(bf, be)}</span><span>${L(hf, he)}</span></small></div>`).join("")}
    <button class="primary" id="fmPtOk">${L("Enregistrer mon point", "Save my check-in")}</button>`);
  document.querySelectorAll(".fm-notes [data-k]").forEach(b => b.onclick = () => { r[b.dataset.k] = +b.dataset.v; b.parentNode.querySelectorAll("button").forEach(x => { const on = x === b; x.setAttribute("aria-pressed", on); x.setAttribute("aria-checked", on); }); });
  $("fmPtOk").onclick = () => { const G = lireForme(), t = minutesMaintenant(); G[auj] = { ...G[auj], p: [...(G[auj].p || []).filter(p => Math.abs(p.t - t) >= 30), { t, ...r }] }; stockerForme(G); majForme(); detailForme(); bulleMs(L(`Point noté : ressenti ${ressentiPoint(r)} %`, `Check-in saved: felt ${ressentiPoint(r)}%`)); };
}

/* --- Statistiques de Mes progrès : chaque carte explique le phénomène qu'elle montre --- */
const virgule = v => v.toFixed(1).replace(".", L(",", "."));
const moyenne = l => l.length ? l.reduce((a, b) => a + b, 0) / l.length : null;
const effortX = x => x.ef ?? (x.rs ? x.rs * 3 : null);   // effort ressenti sur 10 (cardio), sinon le ressenti de fin de séance (1-3) ramené sur 10
const carteStat = (titre, corps, pourquoi) => `<div class="carte stat-forme"><h2>${titre}</h2>${corps}<p class="sh-aide"><b>${L("Pourquoi ?", "Why?")}</b> ${pourquoi}</p></div>`;
function blocsForme() {
  const h = lireHist(), F = lireForme(), auj = jourCle(), out = [];
  // 1. batterie et sommeil des 14 derniers jours
  const js = Array.from({ length: 14 }, (_, k) => decaler(auj, k - 13)), pts = js.map((j, k) => [k, batterie(j, F, h), F[j]]).filter(p => p[2]);
  if (pts.length) {
    const X = k => 14 + k * 20.5, svg = `<svg class="courbe fm-courbe" viewBox="0 0 300 110" role="img" aria-label="${L("Sommeil et batterie des 14 derniers jours", "Sleep and battery over the last 14 days")}">
      ${pts.map(([k, , r]) => `<rect x="${X(k) - 6}" y="${100 - Math.min(r.h, 12) * 8}" width="12" height="${Math.min(r.h, 12) * 8}" rx="3"><title>${dateCourte(js[k])} · ${r.h} h</title></rect>`).join("")}
      <polyline points="${pts.map(([k, B]) => X(k) + "," + (100 - B.v * .95)).join(" ")}"/>${pts.map(([k, B]) => `<circle cx="${X(k)}" cy="${100 - B.v * .95}" r="3.5"><title>${dateCourte(js[k])} · ${B.v} %</title></circle>`).join("")}
      ${pts.map(([k, B, r]) => `<text class="fm-v" x="${X(k)}" y="${Math.max(7, 100 - B.v * .95 - 6)}">${B.v}</text><text class="fm-h" x="${X(k)}" y="97">${String(r.h).replace(".5", "½")}</text><text class="fm-j" x="${X(k)}" y="108">${+js[k].slice(8)}</text>`).join("")}</svg>`;
    const hm = moyenne(pts.map(p => p[2].h));
    out.push(carteStat(L("Sommeil et batterie · 14 jours", "Sleep and battery · 14 days"), svg + `<p class="fm-legende"><i class="fm-l-barre"></i>${L("heures de sommeil", "hours of sleep")} (${L("moyenne", "average")} ${virgule(hm)} h) <i class="fm-l-ligne"></i>${L("batterie", "battery")}</p>`,
      L("Le sommeil est le moment où les muscles se réparent et où l’énergie se recharge. Sous 7 h par nuit plusieurs jours de suite, la récupération ralentit et les séances paraissent plus dures.", "Sleep is when muscles repair and energy refills. Under 7 h a night for several days, recovery slows and workouts feel harder.")));
  } else out.push(carteStat(L("Sommeil et batterie", "Sleep and battery"), `<p>${L("Remplis le questionnaire du matin (carte 🔋 de l’accueil) pour voir ta courbe ici.", "Fill in the morning check-in (🔋 card on the home screen) to see your curve here.")}</p><button class="toggle" id="fmStatGo">${L("Remplir maintenant", "Fill it in now")}</button>`, L("Suivre son sommeil et son état chaque matin permet de repérer la fatigue avant qu’elle ne devienne une blessure.", "Tracking sleep and how you feel each morning spots fatigue before it turns into an injury.")));
  // 2. charge aiguë / chronique
  const ra = ratioCharge(auj, h);
  if (ra !== null) {
    const z = ra < .8 ? [L("En baisse", "Dropping"), L("Tu t’entraînes moins que d’habitude : la forme se perd doucement après 2 à 3 semaines.", "You’re training less than usual: fitness slowly fades after 2 to 3 weeks."), "#94A3B8"]
      : ra <= 1.3 ? [L("Zone idéale", "Sweet spot"), L("Ta charge reste dans ce que ton corps encaisse : continue sur ce rythme.", "Your load stays within what your body can handle: keep this pace."), "#16A34A"]
      : ra <= 1.5 ? [L("Attention", "Careful"), L("Semaine plus chargée que d’habitude : garde un jour de récupération.", "Heavier week than usual: keep a recovery day."), "#CA8A04"]
      : [L("Surcharge", "Overload"), L("Beaucoup plus que d’habitude : c’est la situation où les blessures arrivent le plus. Lève le pied quelques jours.", "Far more than usual: this is when injuries happen most. Ease off for a few days."), "#DC2626"];
    out.push(carteStat(L("Charge de la semaine / habitude", "This week’s load / usual"), `<div class="fm-jauge" style="--p:${Math.min(100, ra / 2 * 100)}%;--zc:${z[2]}"><i></i><span style="left:40%">0,8</span><span style="left:65%">1,3</span><span style="left:75%">1,5</span></div><p><b style="color:${z[2]}">${ra.toFixed(2).replace(".", L(",", "."))} · ${z[0]}</b> — ${z[1]}</p>`,
      L("On compare la charge des 7 derniers jours (minutes × intensité) à ta moyenne des 4 dernières semaines. Le corps s’adapte à ce qu’il connaît : ce sont les hausses brutales, plus que la charge elle-même, qui fatiguent et blessent.", "We compare the last 7 days’ load (minutes × intensity) with your 4-week average. Your body adapts to what it knows: sudden jumps, more than the load itself, are what tire and injure.")));
  }
  // 3. sommeil et ressenti en séance
  const paires = h.filter(x => F[x.j] && effortX(x) != null).map(x => [F[x.j].h, effortX(x)]), court = paires.filter(p => p[0] < 7).map(p => p[1]), bon = paires.filter(p => p[0] >= 7).map(p => p[1]);
  out.push(carteStat(L("Sommeil et effort ressenti", "Sleep and perceived effort"), court.length >= 3 && bon.length >= 3
    ? (d => `<div class="fm-duo"><div><b>${virgule(moyenne(court))}</b><small>${L("après une nuit de moins de 7 h", "after a night under 7 h")}</small></div><div><b>${virgule(moyenne(bon))}</b><small>${L("après 7 h ou plus", "after 7 h or more")}</small></div></div><p>${Math.abs(d) < .5 ? L("Ton sommeil change peu ton ressenti pour l’instant.", "Sleep barely changes how hard workouts feel for you so far.") : d > 0 ? L(`Après une nuit courte, tes séances te paraissent ${virgule(d)} point${d >= 2 ? "s" : ""} plus dures sur 10.`, `After a short night, your workouts feel ${d.toFixed(1)} point${d >= 2 ? "s" : ""} harder out of 10.`) : L("Étonnant : tes nuits courtes ne rendent pas tes séances plus dures. Regarde si ces jours-là tu choisis des séances plus faciles.", "Surprising: short nights don’t make your workouts feel harder. Check whether you pick easier sessions on those days.")}</p>`)(moyenne(court) - moyenne(bon))
    : `<p>${L(`Il faut au moins 3 séances notées après une nuit courte et 3 après une bonne nuit (pour l’instant : ${court.length} et ${bon.length}). Remplis le questionnaire le matin et note ton ressenti en fin de séance.`, `You need at least 3 rated workouts after a short night and 3 after a good one (so far: ${court.length} and ${bon.length}). Fill in the morning check-in and rate how it felt at the end of each workout.`)}</p>`,
    L("Le manque de sommeil augmente l’effort perçu pour un même travail : le cœur, les muscles et la motivation tournent moins bien. C’est souvent l’explication d’une « mauvaise séance ».", "Lack of sleep raises perceived effort for the same work: heart, muscles and motivation run less well. It often explains a “bad session”.")));
  // 4. muscles travaillés : 4 dernières semaines contre les 4 d'avant
  const comptes = (de, a) => { const o = {}; h.filter(x => x.j >= de && x.j <= a).forEach(x => (x.e || []).forEach(id => EXERCICES[id] && Object.entries(volMuscles(EXERCICES[id].muscles)).forEach(([g, v]) => o[g] = (o[g] || 0) + v))); return o; };
  const M = comptes(decaler(auj, -27), auj), Mp = comptes(decaler(auj, -55), decaler(auj, -28)), tri = Object.keys(VOL_NOMS).sort((a, b) => (M[b] || 0) - (M[a] || 0)), mx = Math.max(1, ...Object.values(M)), oublies = tri.filter(g => (M[g] || 0) < mx * .15);
  if (Object.keys(M).length) out.push(carteStat(L("Muscles travaillés · 4 semaines", "Muscles trained · 4 weeks"), `<ul class="fm-barres">${tri.filter(g => M[g]).slice(0, 8).map(g => { const d = Mp[g] ? Math.round((M[g] - Mp[g]) / Mp[g] * 100) : null; return `<li><span>${L(...VOL_NOMS[g])}</span><i style="--p:${M[g] / mx * 100}%"></i><b class="${d > 0 ? "plus" : d < 0 ? "moins" : ""}">${d === null ? L("nouveau", "new") : (d > 0 ? "+" : "") + d + " %"}</b></li>`; }).join("")}</ul>${oublies.length ? `<p>${L("Peu ou pas travaillés", "Little or not trained")} : ${oublies.map(g => L(...VOL_NOMS[g])).join(", ")}.</p>` : ""}`,
    L("Un muscle se renforce s’il est sollicité régulièrement, et s’affaiblit sinon. Un déséquilibre (pectoraux sans dos, quadriceps sans ischios) tire sur les articulations : épaules et genoux en paient le prix. Le pourcentage compare aux 4 semaines d’avant.", "A muscle grows stronger when trained regularly and weaker otherwise. An imbalance (chest without back, quads without hamstrings) pulls on joints: shoulders and knees pay the price. The percentage compares with the 4 weeks before.")));
  // 5. sports et activités
  const parSport = (de, a) => { const o = {}; h.filter(x => x.j >= de && x.j <= a).forEach(x => { const k = x.c && CATS[x.c] ? x.c : x.m; o[k] = (o[k] || 0) + x.s / 60; }); return o; };
  const S = parSport(decaler(auj, -27), auj), Sp = parSport(decaler(auj, -55), decaler(auj, -28)), nomS = k => CATS[k] ? T(CATS[k].titre) : L(...(MODES_NOMS[k] || [k, k])), smx = Math.max(1, ...Object.values(S));
  if (Object.keys(S).length) out.push(carteStat(L("Temps par activité · 4 semaines", "Time per activity · 4 weeks"), `<ul class="fm-barres">${Object.keys(S).sort((a, b) => S[b] - S[a]).slice(0, 6).map(k => { const d = Sp[k] ? Math.round((S[k] - Sp[k]) / Sp[k] * 100) : null; return `<li><span>${nomS(k)}</span><i style="--p:${S[k] / smx * 100}%"></i><b class="${d > 0 ? "plus" : d < 0 ? "moins" : ""}">${Math.round(S[k])} min${d === null ? "" : " · " + (d > 0 ? "+" : "") + d + " %"}</b></li>`; }).join("")}</ul>`,
    L("Varier les activités répartit l’effort sur des muscles et des articulations différents ; se spécialiser fait progresser plus vite dans un sport. L’idéal : ton sport principal, plus du renfo et de la récup pour le protéger.", "Mixing activities spreads the load across different muscles and joints; specialising improves one sport faster. The ideal: your main sport, plus strength and recovery to protect it.")));
  // 6. régularité : jour et heure habituels
  const h56 = h.filter(x => x.j >= decaler(auj, -55));
  if (h56.length >= 4) {
    const jr = Array(7).fill(0); h56.forEach(x => jr[(new Date(x.j + "T12:00").getDay() + 6) % 7]++);
    const top = jr.indexOf(Math.max(...jr)), hrs = h56.filter(x => x.hr != null).map(x => x.hr), heure = hrs.length ? hrs.sort((a, b) => hrs.filter(v => v === b).length - hrs.filter(v => v === a).length)[0] : null, sem = new Set(h56.map(x => lundiDe(x.j))).size;
    out.push(carteStat(L("Tes habitudes · 8 semaines", "Your habits · 8 weeks"), `<div class="barres">${jr.map((n, k) => `<div class="${k === top ? "auj" : ""}"><b>${n || ""}</b><i style="--h:${n / Math.max(...jr) * 100}%;--k:${k}"></i>${JOURS()[k]}</div>`).join("")}</div><p>${L(`Ton jour fort : le ${JOURS_LONGS()[top]}${heure === null ? "" : `, vers ${heure} h`}. Active ${sem} semaine${sem > 1 ? "s" : ""} sur 8.`, `Your strongest day: ${JOURS_LONGS()[top]}${heure === null ? "" : `, around ${heure}:00`}. Active ${sem} week${sem > 1 ? "s" : ""} out of 8.`)}</p>`,
      L("Une habitude se construit sur un créneau fixe : même jour, même heure, la décision n’est plus à prendre. La régularité sur plusieurs semaines compte plus que l’intensité d’une seule séance.", "A habit is built on a fixed slot: same day, same time, there’s no decision left to make. Consistency over several weeks matters more than the intensity of any one session.")));
  }
  return `<h2 class="sec">${L("Forme et statistiques", "Fitness and stats")}</h2>` + out.join("") + (Object.keys(F).length ? `<button class="lien-discret" id="fmEffacer">${L("Effacer mes réponses au questionnaire", "Delete my check-in answers")}</button>` : "");
}
// boutons des statistiques, branchés après l'affichage de Mes progrès
function brancherForme() {
  if ($("fmStatGo")) $("fmStatGo").onclick = questionnaire;
  if ($("fmEffacer")) $("fmEffacer").onclick = () => { if (confirm(L("Effacer toutes tes réponses au questionnaire (sommeil, énergie, courbatures, stress, douleur) ?", "Delete all your check-in answers (sleep, energy, soreness, stress, pain)?"))) { try { localStorage.removeItem("forme"); } catch (e) {} ouvrirProgres(); } };
}
