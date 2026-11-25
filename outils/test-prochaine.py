#!/usr/bin/env python3
"""Fin de séance « Pour la prochaine fois » : moins de tours, exercices plus durs, gardé pour le prochain lancement, annulable. Pixel 7, FR/EN, clair/sombre."""
import functools, http.server, pathlib, threading, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Muet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
VERIF = r'''() => { const ok = (x, m) => { if (!x) throw Error(m); };
  spGarder('boxe', { ...spPref('boxe'), disc: 'anglaise', dur: 35, mat: [] });
  ROUTINES.bxG = { ...spSeance('boxe', 'gainage'), retour: () => 0 }; CONSEILLES.bxG = []; ouvrirRoutine('bxG');
  const ids0 = liste.map(e => e.id), n0 = liste.length, G = blocsVolume(); ok(G.length, 'bloc réglable');
  // toutes les variantes existent et changent bien de famille dans le bon sens
  FAMILLES_DUR.forEach(f => f.forEach(id => ok(EXERCICES[id] && !EXERCICES[id].mat, 'variante ' + id)));
  ok(varianteEx('deadbug', 1) === 'bxRelevesAlt' && varianteEx('hollow', 1) === null && varianteEx('bxRelevesAlt', -1) === 'deadbug', 'familles');
  // fin de séance
  $('fRessenti').innerHTML = blocRessenti() + blocProchaine(); brancherRessenti(); brancherEffort(); brancherProchaine(); afficherEcran('end');
  document.querySelector('[data-prv="-1"]').click(); document.querySelector('[data-prn="1"]').click();
  const c = ajustDe(); ok(c._niv === 1 && G.every(g => c[g.k] === g.n - 1), 'choix gardé ' + JSON.stringify(c));
  ok(/Prochaine fois|Next time/.test($('prRes').textContent), 'résumé');
  const ecran = $('fRessenti').innerHTML;
  // prochain lancement : moins d'étapes, deadbug remplacé, échauffement et retour au calme intacts
  ouvrirRoutine('bxG'); ok(liste.length < n0, 'moins de tours'); ok(!liste.some(e => e.id === 'deadbug') && liste.some(e => e.id === 'bxRelevesAlt'), 'plus dur');
  const calme = l => l.filter(e => /calme|cool/i.test(e.bn || '')).map(e => e.id + e.duree).join();
  ok(calme(liste) === calme(planAjuste(routine.plan, {}).map(q => ({ id: q.id, duree: q.d, bn: q.bn }))), 'retour au calme intact');
  ok(/plus durs|harder/.test($('ajustInfo').textContent), 'Modifier le montre');
  // annuler depuis la fin de séance
  $('fRessenti').innerHTML = ecran; brancherProchaine(); document.querySelector('[data-prn="1"]').click(); $('prAnnul').click();
  ok(JSON.stringify(ajustDe()) === JSON.stringify(c), 'annuler');
  // stepper du panneau Modifier puis Par défaut
  ouvrirRoutine('bxG'); $('ajustBtn').click(); document.querySelector('[data-niv="1"]').click(); ok(ajustDe()._niv === 2, 'stepper');
  $('ajustDef').click(); ok(!Object.keys(ajustDe()).length && liste.map(e => e.id).join() === ids0.join(), 'par défaut');
  // le bloc s'affiche en fin de séance pour l'écran
  $('fRessenti').innerHTML = blocRessenti() + blocProchaine(); brancherProchaine(); document.querySelector('[data-prv="-1"]').click(); document.querySelector('[data-prn="1"]').click(); afficherEcran('end');
  return 'ok'; }'''
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
            page.evaluate(VERIF)
            if len(sys.argv) > 1: page.locator('#prBloc').scroll_into_view_if_needed(); page.wait_for_timeout(300); page.screenshot(path=f'{sys.argv[1]}/prochaine-{lang}-{theme}.png')
            assert not errors, errors
            print(f'✓ {lang} {theme}')
            c.close()
    browser.close()
