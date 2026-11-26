#!/usr/bin/env python3
"""Parrainage (liens d'invitation et de merci, XP), courbe des charges, bandeau Installer. Pixel 7, FR/EN, clair/sombre."""
import functools, http.server, pathlib, threading, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Muet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
U = f'http://127.0.0.1:{srv.server_port}/'
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    for lang in ['fr', 'en']:
        for theme in ['light', 'dark']:
            c = b.new_context(**p.devices['Pixel 7'], color_scheme=theme, reduced_motion='reduce', service_workers='block'); pg = c.new_page(); err = []
            pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type == 'error' else None)
            pg.route('**/*', lambda r: r.fulfill(status=200, content_type='text/javascript', body='') if any(x in r.request.url for x in ['googleapis.com', 'gstatic.com']) else r.continue_())
            pg.goto(U); pg.evaluate(f"() => {{ localStorage.clear(); stocker('langue','{lang}'); stocker('bienvenueVue','1'); sessionStorage.setItem('guideInstall','1'); }}")
            # le filleul ouvre le lien du parrain « abcd1234 »
            pg.goto(U + '?parrain=abcd1234'); pg.wait_for_timeout(1400)
            r = pg.evaluate("""() => { const ok = (x, m) => { if (!x) throw Error(m); };
              ok(lireParrain().de === 'abcd1234' && !location.search, 'lien parrain');
              const x0 = xpTotal(); ok(x0 === 0, 'pas d’XP avant la 1re séance');
              stocker('historique', JSON.stringify([{ j: jourCle(), m: 'seance', s: 600 }])); ok(xpTotal() === xpSeance({ m: 'seance', s: 600 }) + 100 + (xpTotal() - xpSeance({ m: 'seance', s: 600 }) - 100), 'xp');
              ok(xpParrain() === 100, 'bonus filleul');
              stocker('charges', JSON.stringify([{ j: '2026-11-01', id: 'squat', kg: 40, r: 8, s: 3 }, { j: '2026-11-08', id: 'squat', kg: 42.5, r: 8, s: 3 }, { j: '2026-11-15', id: 'squat', kg: 45, r: 6, s: 3 }]));
              ouvrirProgres(); ok($('parInvit') && $('parMerci'), 'boutons parrainage');
              document.querySelector('[data-ch="squat"]').click(); ok(document.querySelector('.courbe-ch') && document.querySelectorAll('.ch-histo li').length === 3, 'courbe');
              fermerFeuille(); return coderLien({ p: 'abcd1234', f: codeParrain() }); }""")
            pg.locator('#parInvit').scroll_into_view_if_needed(); pg.wait_for_timeout(200)
            if len(sys.argv) > 1: pg.screenshot(path=f'{sys.argv[1]}/parrain-{lang}-{theme}.png')
            # le parrain (autre téléphone) ouvre le merci : +100 XP, une seule fois
            pg.evaluate("() => { localStorage.clear(); stocker('parrainage', JSON.stringify({ c: 'abcd1234' })); stocker('bienvenueVue','1'); sessionStorage.setItem('guideInstall','1'); }")
            for _ in range(2): pg.goto(U + '?merci=' + r); pg.wait_for_timeout(1200)
            assert pg.evaluate("() => xpParrain() === 100 && lireParrain().m.length === 1"), 'merci compté une fois'
            pg.evaluate("() => { fermerFeuille(); afficherEcran('menu'); }"); pg.wait_for_timeout(300)
            assert pg.evaluate("() => /Install/.test($('banniere').textContent)"), 'bandeau installer'
            if len(sys.argv) > 1: pg.screenshot(path=f'{sys.argv[1]}/banniere-{lang}-{theme}.png')
            pg.evaluate("() => document.querySelector('#banniere .bn-fermer').click()")
            assert pg.evaluate("() => !/Install/.test($('banniere').textContent)"), 'bandeau masqué pour la journée'
            assert not err, err
            print(f'✓ {lang} {theme}'); c.close()
    b.close()
