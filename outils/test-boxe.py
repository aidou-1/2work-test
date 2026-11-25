#!/usr/bin/env python3
"""Boxe (anglaise, française, kick-boxing) et séances modifiables : Pixel 7, FR/EN, clair/sombre, aucune erreur console."""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Muet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
VERIF = r'''() => { const ok = (x, m) => { if (!x) throw Error(m); }; let n = 0;
  // 1. les 3 disciplines : chaque séance a un plan valide et tient dans la durée choisie ; le parcours Bases place la technique de la discipline
  for (const disc of ['anglaise', 'francaise', 'kick']) for (const niv of ['debutant', 'club', 'compet']) for (const dur of [20, 35, 50]) for (const mat of [[], Object.keys(MAT_X)]) {
    spGarder('boxe', { ...spPref('boxe'), disc, niv, dur, mat, cycle: 0, debut: jourCle() });
    for (const code of Object.keys(BXS)) { const s = spSeance('boxe', code); n++;
      ok(s.plan.length && s.plan.every(q => EXERCICES[q.id] && q.d > 0 && Number.isFinite(q.r)), disc + ' ' + code + ' plan');
      if (!BXS[code].fixe) ok(s.total <= dur + 3, `${disc} ${code} ${dur} min : ${s.total}`); }
    const S = bxSemaine(); S.jours.forEach(j => j.l.forEach(c => ok(c === 'repos' || c === 'combat' || BXS[c], 'semaine ' + c)));
    if (niv === 'debutant') ok(S.jours.flatMap(j => j.l).some(c => c.startsWith(DISC_BX[disc][1])), 'Bases ' + disc);
    ok(savoirBx().every(i => SAVOIR_BX[i]), 'savoir ' + disc);
  }
  // 2. séance modifiable : nombre d'unités, repos de fin gardé, numéros recalculés
  const verifier = (plan, nom) => blocsRepetes(plan).filter(g => g.n >= 2).forEach(g => [1, g.n + 3].forEach(N => {
    // la détection se fait toujours sur la séance d'origine : on compte les étapes du bloc obtenu
    const b = { l: planAjuste(plan, { [g.k]: N }).filter(q => cleBloc(q.bn) + (q.series ? ' · ' + EXERCICES[q.id].nom : '') === g.k) };
    ok(b.l.length === N * g.p, `${nom} · ${g.k} × ${N}`);
    ok(b.l[b.l.length - 1].r === g.l[g.l.length - 1].r, `${nom} · ${g.k} repos de fin`);
    ok(!b.l.some(q => /(^|\D)(\d+)\s*\/\s*(\d+)(?!\d)/.test(q.lab || '') && (q.lab.match(/(\d+)\s*\/\s*(\d+)/g) || []).some(x => { const [a, c] = x.split('/').map(Number); return a > c; })), `${nom} · numéros`); n++; }));
  for (const c of CARDIOS) verifier(seanceCardio('boxe', c[0]).plan, 'cardio ' + c[0]);
  spGarder('boxe', { ...spPref('boxe'), disc: 'anglaise', dur: 50, mat: [] }); for (const code of Object.keys(BXS)) verifier(spSeance('boxe', code).plan, 'boxe ' + code);
  for (const m of Object.keys(METHODES)) for (const sp of Object.keys(SPLITS)) { const s = seanceSalle(m, sp); if (s) verifier(s.plan, 'salle ' + m + ' ' + sp); }
  ok(blocsRepetes(seanceCardio('boxe', 'sprints').plan).some(g => g.n >= 2), 'sprints réglables');
  ok(blocsRepetes(spSeance('boxe', 'rsa').plan).some(g => g.k === 'Série' || g.k === 'Set'), 'séries rsa groupées');
  // 3. écran : bouton Modifier, +, choix gardé, Par défaut
  stocker('niveauRenfo', 'inter'); ROUTINES.cardioS = { ...seanceCardio('boxe', 'sprints'), retour: () => 0 }; CONSEILLES.cardioS = []; ouvrirRoutine('cardioS');
  const avant = liste.length; $('ajustBtn').click(); document.querySelector('[data-aj][data-d="1"]').click();
  ok(liste.length === avant + 1, 'une répétition de plus'); ok(Object.keys(lireJSON('ajustSeances', {})).length === 1, 'choix gardé');
  $('ajustDef').click(); ok(liste.length === avant && !Object.keys(lireJSON('ajustSeances', {})).length, 'par défaut');
  return n; }'''
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    for lang in ['fr', 'en']:
        for theme in ['light', 'dark']:
            c = browser.new_context(**p.devices['Pixel 7'], color_scheme=theme, reduced_motion='reduce', service_workers='block')
            page = c.new_page(); errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            page.route('**/*', lambda r: r.fulfill(status=200, content_type='text/javascript', body='') if any(x in r.request.url for x in ['googleapis.com', 'gstatic.com']) else r.continue_())
            page.goto(f'http://127.0.0.1:{srv.server_port}/')
            page.evaluate('''([lang,theme]) => { localStorage.clear(); stocker('langue',lang); stocker('theme',theme==='dark'?'sombre':'clair'); sessionStorage.setItem('guideInstall','1'); }''', [lang, theme])
            page.reload(); page.wait_for_timeout(600)
            n = page.evaluate(VERIF)
            for disc in ['anglaise', 'francaise', 'kick']:
                page.evaluate(f'() => {{ spGarder("boxe", {{ ...spPref("boxe"), disc: "{disc}" }}); for (const o of SP.boxe.onglets) ouvrirSport("boxe", o[0]); }}')
            assert not errors, errors
            print(f'✓ {lang} {theme} : {n} vérifications')
            c.close()
    browser.close()
