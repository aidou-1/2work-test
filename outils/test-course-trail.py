#!/usr/bin/env python3
"""Régressions route/trail : Pixel 7, FR/EN, thèmes, migration et volumes."""
import functools, http.server, pathlib, threading, shutil
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Muet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    exe = shutil.which('chromium') or shutil.which('google-chrome')
    browser = p.chromium.launch(**({'executable_path': exe} if exe else {}), args=['--no-sandbox'])
    for lang in ['fr', 'en']:
        for theme in ['light', 'dark']:
            c = browser.new_context(**p.devices['Pixel 7'], reduced_motion='reduce', service_workers='block')
            errors = []
            page = c.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            # Les erreurs réseau Firebase hors ligne ne font pas partie de ce test sportif.
            page.route('**/*', lambda r: r.fulfill(status=200, content_type='text/javascript', body='') if any(x in r.request.url for x in ['googleapis.com', 'gstatic.com']) else r.continue_())
            url = f'http://127.0.0.1:{srv.server_port}/'
            page.goto(url)
            page.evaluate('''([lang, theme]) => { localStorage.clear(); localStorage.setItem('langue', lang); localStorage.setItem('theme', theme === 'dark' ? 'sombre' : 'clair'); sessionStorage.setItem('guideInstall', '1'); }''', [lang, theme])
            page.reload()
            page.wait_for_timeout(500)
            results = page.evaluate('''() => {
              const ok = (x, msg) => { if (!x) throw Error(msg); }, hist = [{k:'rn_cotesLongues', j:jourCle(), s:1200, t:'Ancien trail', n:4}];
              const ancien = {obj:'trail', date:'2027-05-10', jours:[1,4], n:4, dur:50, niv:'inter', debut:'2026-10-01'};
              stocker('sp_course', JSON.stringify(ancien)); stocker('historique', JSON.stringify(hist));
              ouvrirSport('trail'); const copie = spPref('trail');
              ok(copie.obj==='court' && copie.date===ancien.date && copie.n===4 && copie.jours.join() === '1,4', 'migration profil');
              ok(lire('sp_course') === JSON.stringify(ancien) && lire('historique')===JSON.stringify(hist), 'migration non destructive');
              ok($('bxC').textContent.includes('1 '), 'ancien historique compté');
              spGarder('trail', {...copie, obj:'ultra', n:2}); ouvrirSport('trail'); ok(spPref('trail').obj==='ultra' && spPref('trail').n===2, 'migration idempotente');
              ouvrirSport('course', 'parcours'); document.querySelector('[data-rno="trail"]').click(); ok($('oTitre').textContent.includes('Trail'), 'puce trail');
              const saved = lire('sp_trail'); stocker('sp_course', JSON.stringify({...ancien, date:'2028-01-01'})); migrerTrail(); ok(lire('sp_trail')===saved, 'profil trail existant conservé');
              stocker('tests', JSON.stringify([{id:'rn5chrono',j:'2026-10-01',v:25}])); ok(Math.abs(vmaRn()-300/25/.95)<1e-8, 'chrono 5 km');
              stocker('tests', JSON.stringify([{id:'rn10chrono',j:'2026-10-02',v:50}, {id:'rn6',j:'2026-10-01',v:1800}, {id:'rn5chrono',j:'2026-10-03',v:-1}]));
              ok(Math.abs(vmaRn()-600/50/.91)<1e-8, 'chrono récent valide');
              stocker('tests', '[]'); ok(vmaRn()===0, 'sans VMA');
              let count=0;
              for (const sp of ['course','trail']) for (const obj of sp==='course' ? ['debut','cinq','dix','semi','marathon','trail'] : ['court','long','ultra'])
              for (const niv of ['debutant','inter','confirme']) for (const dur of [20,35,50]) for (const mat of [[],['box','kb','barre','elastique']])
              for (const terrain of sp==='trail' ? ['cote','escaliers','tapis','rien'] : ['rien']) for (const f of [1,.6,.5]) {
                spGarder(sp, {...spPref(sp), obj,niv,dur,mat,terrain,dp:2000,descente:2,date:'',jours:[]});
                for (const code of Object.keys(SP[sp].S)) {
                  const s=spSeance(sp,code,{f}); count++;
                  ok(s.plan.length && s.plan.every(q=>EXERCICES[q.id] && q.d>0 && Number.isFinite(q.d)), sp+'/'+code+' exercices');
                  const secs=s.plan.reduce((n,q)=>n+q.d+q.r,0); ok(secs <= dur*60+120, sp+'/'+code+' dépasse format '+dur+': '+secs);
                  if (sp==='trail' && code==='force' && !mat.length) ok(!s.exercices.some(id=>['stepDown','skDescenteBox'].includes(id)), 'force sans matériel');
                  if (sp==='trail' && code==='descente' && terrain!=='cote') ok(!s.exercices.includes('trDescenteLongue'), 'descente terrain indisponible');
                  if (!['recup'].includes(code)) { ok(/Mobilit|Mobility/.test(s.plan[0].bn), 'mobilité initiale'); ok(s.plan.some(q=>q.bn==='Gainage'||q.bn==='Core'), 'gainage'); }
                }
              }
              // Début de semaine et frontière du dimanche.
              for (const obj of ['court','long','ultra']) for (const n of [2,6]) for (const offset of [0,1,2,6,7,13,14,20,21,60]) {
                const date=jourCle(plusJ(lundi(),offset)), P={...spPref('trail'), obj,n,date,jours:[1,3],niv:'confirme',enchaine:false};
                const s=trSemaine(P);
                spGarder('trail',P); ok(JSON.stringify(spSemaine('trail'))===JSON.stringify(s), 'calendrier partagé');
                for (const [d,j] of s.jours.entries()) {
                  if (offset-d===0) ok(j.l.join()==='jourJ', 'course même un jour de club');
                  if (offset-d===1) ok(j.l.join()==='repos', 'repos J-1');
                  if (offset-d===2) ok(j.club ? !j.l.length : j.l.join()==='affutage', 'J-2');
                  if (j.l.some(c=>OBJECTIF_TR.dur.includes(c))) ok(!j.club && ![d-1,d+1].some(v=>P.jours.includes((v+7)%7)), 'charge près du club');
                }
                const W=Math.floor(offset/7); if(W<OBJECTIF_TR.taper(P)) ok(s.f>=.5 && s.f<=.6,'volume affûtage');
              }
              for (const sp of Object.keys(SP).filter(k=>k!=='trail' && SP[k].objectif)) ok(JSON.stringify(semaineObjectif(SP[sp].objectif, spPref(sp)))===JSON.stringify(semaineObjectif(SP[sp].objectif, spPref(sp), 1)), 'calendrier autre sport '+sp);
              for (const sp of ['course','trail']) {
                spGarder(sp,{...spPref(sp),obj:sp==='course'?'cinq':'long',jours:[],date:'',niv:'confirme'});
                for(const tab of SP[sp].onglets) { ouvrirSport(sp,tab[0]); ok($('bxC').children.length,'onglet vide '+sp+'/'+tab[0]); }
              }
              vueSCats(); ok($('choicesCS').textContent.includes('Trail'),'trail dans liste Sports');
              ouvrirSport('trail','parcours'); return {count, width:innerWidth, theme:document.documentElement.dataset.theme};
            }''')
            assert results['theme'] == theme, f"Thème réellement appliqué : {results['theme']} au lieu de {theme}"
            # Réglages réels et saisies de tests, avec leurs gestionnaires DOM.
            page.locator('#trDp').fill('1500'); page.locator('#trDp').dispatch_event('change')
            assert page.evaluate('spPref("trail").dp') == 1500
            page.evaluate('ouvrirTests()'); page.wait_for_timeout(100)
            page.locator('[data-test="trStepG"]').fill('11'); page.locator('[data-ok="trStepG"]').click()
            assert page.evaluate('lireTests().some(x=>x.id==="trStepG")') is False
            page.locator('[data-test="trStepG"]').fill('8'); page.locator('[data-ok="trStepG"]').click()
            assert page.evaluate('lireTests().find(x=>x.id==="trStepG").v') == 8
            page.evaluate('ouvrirSport("trail", "force")'); page.wait_for_timeout(200)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'débordement horizontal'
            (ROOT/'work').mkdir(exist_ok=True)
            page.screenshot(path=str(ROOT/'work'/f'trail-{lang}-{theme}.png'), full_page=True)
            assert not errors, errors
            print(f'Pixel 7 {lang} {theme}: {results["count"]} séances, migration, profils, calendrier et console OK')
            c.close()
    browser.close()
srv.shutdown()
