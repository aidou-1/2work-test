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
  FAMILLES_DUR.forEach(f => f.forEach(id => ok(EXERCICES[id], 'variante ' + id)));
  // une variante qui demande du matériel n'est proposée que si on l'a ; familles corrigées
  ok(varianteEx('ftAdducteurs', 1, []) === null && varianteEx('ftAdducteurs', 1, ['box']) === 'copenhague' && varianteEx('planchelat', 1) === null && varianteEx('fentesalt', 1) === 'bxFentePdc', 'matériel et familles');
  ok(varianteEx('deadbug', 1) === 'bxRelevesAlt' && varianteEx('hollow', 1) === null && varianteEx('bxRelevesAlt', -1) === 'deadbug', 'familles');
  // fin de séance
  $('fRessenti').innerHTML = blocRessenti() + blocProchaine(); brancherRessenti(); brancherEffort(); brancherProchaine(); afficherEcran('end');
  document.querySelector('[data-prv="-1"]').click(); document.querySelector('[data-prn="1"]').click();
  const c = ajustDe(); ok(c._niv === 1 && G.every(g => toursAj(g, c) === g.n - 1 && c[g.c].d === -1), 'choix gardé en écart ' + JSON.stringify(c));
  ok(/Prochaine fois|Next time/.test($('prRes').textContent), 'résumé');
  const ecran = $('fRessenti').innerHTML;
  // prochain lancement : moins d'étapes, deadbug remplacé, échauffement et retour au calme intacts
  ouvrirRoutine('bxG'); ok(liste.length < n0, 'moins de tours'); ok(!liste.some(e => e.id === 'bxRelevesAlt') && liste.some(e => e.id === 'hollow') && liste.filter(e => e.id === 'deadbug').every(e => e.duree === 50), 'plus dur sans doublon');
  const calme = l => l.filter(e => /calme|cool/i.test(e.bn || '')).map(e => e.id + e.duree).join();
  ok(calme(liste) === calme(planAjuste(routine.plan, {}).map(q => ({ id: q.id, duree: q.d, bn: q.bn }))), 'retour au calme intact');
  ok(/plus durs|harder/.test($('ajustInfo').textContent), 'Modifier le montre');
  // annuler depuis la fin de séance
  $('fRessenti').innerHTML = ecran; brancherProchaine(); document.querySelector('[data-prn="1"]').click(); $('prAnnul').click();
  ok(JSON.stringify(ajustDe()) === JSON.stringify(c), 'annuler');
  // stepper du panneau Modifier puis Par défaut
  ouvrirRoutine('bxG'); $('ajustBtn').click(); document.querySelector('[data-niv="1"]').click(); ok(ajustDe()._niv === 2, 'stepper');
  $('ajustDef').click(); ok(!Object.keys(ajustDe()).length && liste.map(e => e.id).join() === ids0.join(), 'par défaut');
  // ancien format (clé = titre du bloc) encore lu ; pas de doublon de variante dans un bloc ; « déjà au maximum »
  const g0 = G[0], t0 = lireJSON('ajustSeances', {}); t0[ajustCle()] = { [g0.k]: g0.n - 1, _sans: [], _ex: {} }; stocker('ajustSeances', JSON.stringify(t0));
  ok(ajustDe()[g0.c] === g0.n - 1, 'ancien format lu'); ouvrirRoutine('bxG'); ok(liste.length < n0, 'ancien format appliqué'); stockerAjust({});
  const pl = [{ id: 'deadbug', d: 30, bn: 'Gainage 1/2' }, { id: 'bxRelevesAlt', d: 30, bn: 'Gainage 2/2' }], n2 = planNiveau(pl, 1);
  ok(new Set(n2.map(q => q.id)).size === 2 && n2[0].d === 40, 'pas de doublon ' + JSON.stringify(n2));
  $('fRessenti').innerHTML = blocRessenti() + blocProchaine(); brancherProchaine(); const plus = document.querySelector('[data-prn="1"]'); plus.click(); plus.click(); plus.click();
  ok(/maximum/.test($('prRes').textContent), 'déjà au maximum'); stockerAjust({});
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
    # le choix survit au changement de langue
    c = browser.new_context(**p.devices['Pixel 7'], service_workers='block'); page = c.new_page()
    page.route('**/*', lambda r: r.fulfill(status=200, content_type='text/javascript', body='') if any(x in r.request.url for x in ['googleapis.com', 'gstatic.com']) else r.continue_())
    page.goto(f'http://127.0.0.1:{srv.server_port}/')
    OUVRE = "spGarder('boxe', { ...spPref('boxe'), disc: 'anglaise', dur: 35, mat: [] }); ROUTINES.bxG = { ...spSeance('boxe', 'gainage'), retour: () => 0 }; CONSEILLES.bxG = []; ouvrirRoutine('bxG');"
    page.evaluate("() => { localStorage.clear(); stocker('langue','fr'); sessionStorage.setItem('guideInstall','1'); }"); page.reload(); page.wait_for_timeout(600)
    n0 = page.evaluate("() => { " + OUVRE + " const n = liste.length; $('fRessenti').innerHTML = blocProchaine(); brancherProchaine(); document.querySelector('[data-prv=\"-1\"]').click(); stocker('langue','en'); return n; }")
    page.reload(); page.wait_for_timeout(600)
    n1 = page.evaluate("() => { " + OUVRE + " return liste.length; }")
    assert n1 < n0, (n0, n1); print('✓ choix gardé en changeant de langue'); c.close()
    browser.close()
