"""Corrections du coach : chaque sport, chaque durée, avec et sans matériel ; replis sans matériel, montée progressive, affûtage en jours,
sauts comptés, échauffements sans sauts là où c'est risqué, Tabata et Quick start. Usage : python3 outils/test-coach.py"""
import functools, http.server, threading, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
class M(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(M, directory=str(ROOT))); threading.Thread(target=srv.serve_forever, daemon=True).start()
VERIF = r'''() => { const ok = (x, m) => { if (!x) throw Error(m); }; let n = 0;
  const ids = (sp, code, o) => spSeance(sp, code, o).plan.map(q => q.id);
  // 1. toutes les séances de tous les sports : plan valide, jamais de marche « pour remplir »
  for (const sp of Object.keys(SP)) for (const dur of [20, 35, 50]) for (const mat of [[], SP[sp].mat || []]) for (const code of Object.keys(SP[sp].S)) {
    const s = spSeance(sp, code, { dur, mat }); n++;
    ok(s.plan.length && s.plan.every(q => EXERCICES[q.id] && q.d > 0 && Number.isFinite(q.r)), `${sp} ${code} ${dur} plan`);
    ok(sp === "foot" || !s.plan.some(q => q.bn === L("Technique facile", "Easy technique")), `${sp} ${code} marche de remplissage`); }
  // 2. replis sans matériel
  ok(!ids('volley', 'tech_passe', { dur: 50, mat: [] }).includes('squat'), 'volley sans ballon : squats');
  ok(!ids('surf', 'rameInter', { dur: 50, mat: [] }).includes('superman') && spSeance('surf', 'rame', { dur: 50, mat: [] }).plan.filter(q => q.id === 'superman').every(q => q.d <= 25), 'surf supermans');
  spGarder('handball', { ...spPref('handball'), poste: 'ailier' }); ok(!ids('handball', 'activation', { mat: [] }).includes('hbGbPosition'), 'handball : posture de gardien');
  ok(spChoix(['bandRotExt', 'rqCoiffe'], []) === 'rqCoiffe' && spChoix(['bandRotExt', 'rqCoiffe'], ['elastique']) === 'bandRotExt', 'MAT_EX bandRotExt');
  ok(ids('natation', 'force', { dur: 35, mat: [] }).includes('rqCoiffe'), 'natation coiffe');
  // 3. montée progressive avant les sprints (sports collectifs et raquettes), récupération du 15/15 jamais à 8/10
  for (const sp of ['basket', 'handball', 'volley', 'tennis', 'padel']) { const p = spSeance(sp, 'rsa', { dur: 35, mat: [] }).plan; ok(p.some(q => /Montée progressive|Progressive build-up/.test(q.bn)), sp + ' montée progressive'); }
  const it = spSeance('tennis', 'intermittent', { dur: 35, mat: [] }).plan.filter(q => q.id.endsWith('0') && /Intervall|Interval|Bloc|Block/.test(q.bn)); ok(it.every(q => !/8\/10/.test(q.presc || '')), 'tennis récup 8/10');
  // 4. ski : sauts plafonnés selon le niveau
  for (const [niv, max] of [['inter', 2], ['expert', 3]]) { spGarder('ski', { ...spPref('ski'), niv }); const t = spSeance('ski', 'pliometrie', { dur: 50, mat: [] }).plan.filter(q => q.id === 'squatsaute').length; ok(t <= max, `ski ${niv} : ${t} tours`); }
  // 5. affûtage en jours : objectif lundi prochain = rien de dur ni de séance longue samedi et dimanche
  const L0 = lundi(), lun = plusJ(L0, 7), cle = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  spGarder('cyclisme', { ...spPref('cyclisme'), obj: 'course', date: cle(lun), n: 5, jours: [] }); const S = semaineObjectif(SP.cyclisme.objectif, spPref('cyclisme'), 1);
  ok(S.f < 1 && !S.jours[6].l.some(c => SP.cyclisme.objectif.dur.includes(c)) && !S.jours[5].l.some(c => SP.cyclisme.objectif.dur.includes(c)), 'cyclisme affûtage ' + JSON.stringify(S.jours.map(j => j.l)));
  // 6. escalade : veille de sortie sans séance à la limite ; doigts et tirage selon le matériel
  spGarder('escalade', { ...spPref('escalade'), prat: 'bloc', jours: [1, 3, 4], sortie: 5, mat: [] }); const E = semaineEs(spPref('escalade'));
  ok(!E.jours[4].l.some(c => DUR_ES.includes(c)), 'escalade veille ' + JSON.stringify(E.jours.map(j => j.l))); ok(!horsMurEs(spPref('escalade')).includes('tirage'), 'tirage sans barre');
  // 7. échauffements : pas de sauts au bord du bassin, sur le vélo, au Pilates, à l'escalade
  for (const c of ['natation', 'cyclisme', 'pilates', 'escalade']) for (const f of ['express', 'standard', 'complet']) ok(!seanceEch(c, f).plan.some(q => /squatsaute|skater|askip/.test(q.id)), `échauffement ${c} ${f}`);
  // 8. reprise : sauts comptés en phase 3 ; Tabata : échauffement de 7 min ou plus, retour au calme debout d'abord
  for (const R of REPRISES) { const p = repJour(R, 10).plan; ok(!p.some(q => q.id === 'squatsaute' || q.id === 'skihop'), 'reprise ' + R[0]); }
  for (const [id] of TABATAS) { const p = seanceTabata(id).plan, e = p.filter(q => /Échauffement|Warm-up/.test(q.bn)).reduce((a, q) => a + q.d + q.r, 0), r = p.filter(q => /calme|Cool/.test(q.bn)); ok(e >= 420 && r[0].id === 'rn_marche', 'tabata ' + id); }
  // 9. Quick start : jamais de barre
  for (let i = 0; i < 30; i++) { composerExpress({ min: 10, m: 'mien' }); }
  // 10. chantiers : poste du volley, sprints en compétition et chaîne de tir au handball, cycle et compétition en escalade, athlé sur 50 min
  spGarder('volley', { ...spPref('volley'), poste: 'libero' }); ok(!ids('volley', 'detente', { dur: 35, mat: [] }).includes('vbAttaque'), 'libéro sans attaque');
  ok(ids('handball', 'puissance', { dur: 35, mat: [] }).includes('rqRotation'), 'chaîne de tir');
  for (const c of ['technique', 'vitesse', 'fractions', 'endurance']) ok(spSeance('athle', c, { dur: 50, mat: [] }).total >= 45, 'athlé 50 min ' + c);
  const dc = plusJ(lundi(), 5), dcs = dc.getFullYear() + '-' + String(dc.getMonth() + 1).padStart(2, '0') + '-' + String(dc.getDate()).padStart(2, '0');
  spGarder('escalade', { ...spPref('escalade'), prat: 'bloc', jours: [1, 2, 3], sortie: -1, compet: dcs, n: 2, mat: ['poutre', 'traction'] }); const C = semaineEs(spPref('escalade'));
  ok(C.f < 1 && C.jours[5].l[0] === 'sortie' && ![3, 4].some(d => C.jours[d].l.some(x => DUR_ES.includes(x))), 'escalade compétition ' + JSON.stringify(C.jours.map(j => j.l)));
  // la semaine allégée ignore un « Plus » au nouveau format, garde un « Moins »
  const g0 = { n: 3, c: 'x', l: [{ id: 'bird', presc: '' }] }; routine = { allege: 1 }; ok(toursAj(g0, { x: { d: 2 } }) === 3 && toursAj(g0, { x: { d: -1 } }) === 2 && toursAj(g0, { x: 0 }) === 3, 'semaine allégée'); routine = null;
  return n; }'''
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    for lang in ['fr', 'en']:
        for theme in ['light', 'dark']:
            c = b.new_context(**p.devices['Pixel 7'], color_scheme=theme, service_workers='block'); pg = c.new_page(); err = []
            pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type == 'error' else None)
            pg.route('**/*', lambda r: r.fulfill(status=200, content_type='text/javascript', body='') if any(x in r.request.url for x in ['googleapis.com', 'gstatic.com']) else r.continue_())
            pg.goto(f'http://127.0.0.1:{srv.server_port}/'); pg.evaluate('''([l,t]) => { localStorage.clear(); stocker('langue',l); stocker('theme',t==='dark'?'sombre':'clair'); sessionStorage.setItem('guideInstall','1'); }''', [lang, theme]); pg.reload(); pg.wait_for_timeout(600)
            n = pg.evaluate(VERIF); assert not err, err; print(f'✓ {lang} {theme} : {n} séances'); c.close()
