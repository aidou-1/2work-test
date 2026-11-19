// Récolte de toutes les phrases que la voix peut dire (consignes de posture comprises), exécutée dans la page de l'appli.
(() => {
  const out = { fr: new Map(), en: new Map() }, vus = new Set();
  const ajout = (lang, t, long) => { if (typeof t !== "string" || !t.trim() || t.length > 220 && !long) return;
    morceauxVoix(t).forEach(m => { const k = cleVoix(m); if (k && !out[lang].has(k)) out[lang].set(k, m.replace(/[,;:]+$/, ".")); }); };
  const paire = (fr, en) => { ajout("fr", fr); ajout("en", en); };
  // paires [fr, en] dans des objets de données
  const fouille = (o, prof = 0) => { if (!o || prof > 7 || typeof o !== "object" || vus.has(o)) return; vus.add(o);
    if (Array.isArray(o) && o.length >= 2 && typeof o[0] === "string" && typeof o[1] === "string" && o[0].length < 160 && o[1].length < 160 && !/[<{]/.test(o[0] + o[1])) paire(o[0], o[1]);
    (Array.isArray(o) ? o : Object.values(o)).forEach(v => fouille(v, prof + 1)); };
  const essai = f => { try { return f(); } catch (e) { return null; } };
  // 2. phrases fixes
  ["fr", "en"].forEach(l => { Object.values(PHRASES[l]).forEach(t => ajout(l, t)); Object.values(COACH[l]).flat().forEach(t => ajout(l, t)); });
  paire("Tiens la position", "Hold the position");
  Object.entries(SOUFFLE_VOIX).forEach(([fr, en]) => paire(fr.charAt(0) + fr.slice(1).toLowerCase(), en));
  Object.values(ROUTINES).forEach(r => (r.blocs || []).forEach(b => b && (b.titreFr || b.titre) && paire(b.titreFr || b.titre, b.voix || b.titre)));
  for (let n = 1; n <= 40; n++) { paire(PH && "série " + n, "set " + n); paire("Tour " + n, "Round " + n); paire("Round " + n, "Round " + n); paire("Palier " + n, "Stage " + n); paire(String(n), String(n)); }
  [["Combat terminé. Bravo !", "Fight over. Well done!"], ["Repos", "Rest"], ["Dix secondes", "Ten seconds"], ["Dix secondes, en garde", "Ten seconds, guard up"],
   ["Rafale ! Dix secondes à fond", "Flurry! Ten seconds all out"], ["Stop. Bouge autour du sac", "Stop. Move around the bag"], ["Séance terminée. Bravo !", "Session over. Well done!"]].forEach(p => paire(...p));
  // 3. chronos et minuteurs des sports (thèmes, enchaînements, appels, phases)
  ["THEMES", "THEMES_BX", "THEMES_BF", "THEMES_KX", "THEMES_BK", "THEMES_FT", "THEMES_HB", "THEMES_PD", "THEMES_TN", "THEMES_VB", "COMBOS", "COMBOS_PIEDS"].forEach(n => essai(() => fouille(eval(n))));
  Object.values(THEMES).forEach(t => paire(t[0].split(" :")[0], t[1].split(" :")[0]));
  Object.entries(MINUTEURS).forEach(([k, M]) => { const R = Object.fromEntries(M.regl.map(r => [r[0], r[4]]));
    M.regl.forEach(r => (r[3] || []).forEach(o => { const R2 = { ...R, [r[0]]: Array.isArray(o) ? o[0] : o }; Object.keys(SP).concat([undefined]).forEach(g => essai(() => M.phases(R2, g).flat().forEach(p => { if (p.voix) paire(...p.voix); if (p.c) paire(...p.c); }))); }));
    Object.keys(SP).concat([undefined]).forEach(g => essai(() => fouille(M.appels && M.appels(g)))); });
  // 4. noms de blocs des séances toutes prêtes (annoncés quand le bloc change)
  const blocs = r => r && r.plan && r.plan.forEach(q => q.bn && ajout(LANGUE, q.bn.replace(/\s*\d+\/\d+$/, "")));
  Object.keys(SP).forEach(sp => Object.keys(SP[sp].S || {}).forEach(code => essai(() => blocs(spSeance(sp, code, {})))));
  Object.keys(SP).forEach(sp => Object.keys(SP[sp].S || {}).forEach(code => ["debutant", "inter", "avance", "club", "compet"].forEach(niv => [0, 1].forEach(m => essai(() => blocs(spSeance(sp, code, { niv, mat: m ? (SP[sp].mat || []) : [] })))))));
  Object.keys(typeof RENFOS !== "undefined" ? RENFOS : {}).forEach(g => ["debutant", "inter", "avance"].forEach(niv => [0, 1].forEach(m => essai(() => blocs(seanceRenfo(g, m, niv))))));
  Object.values(ROUTINES).forEach(blocs);
  // 5. changements de côté annoncés pendant l'exercice
  Object.keys(EXERCICES).forEach(id => essai(() => (changements(id).t || []).forEach(([, fr, en]) => paire(fr, en))));
  // 6. consignes de posture (consignes.js), dites plusieurs fois par exercice : sans elles, la voix du téléphone prend le relais
  Object.values(typeof CONSIGNES !== "undefined" ? CONSIGNES : {}).forEach(c => c.forEach((s, i) => s.split("|").forEach(t => ajout(i ? "en" : "fr", t, 1))));
  // 7. noms d'exercices (fr : nomFr ; en : VOIX ou nom), autre côté — en dernier : les séances de cardio créent leurs exercices à la volée
  Object.getOwnPropertyNames(EXERCICES).map(id => [id, EXERCICES[id]]).forEach(([id, e]) => { ajout("fr", e.nomFr || e.nom); ajout("en", VOIX[id] || e.nom); if (PASSAGES[id]) paire(PASSAGES[id][0], PASSAGES[id][1]); });
  return { fr: [...out.fr.entries()], en: [...out.en.entries()] };
})()
