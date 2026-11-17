#!/usr/bin/env python3
"""Ticket #3 : séances et calendriers, Pixel 7 FR/EN, clair/sombre."""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Muet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for lang in ['fr', 'en']:
        for theme in ['light', 'dark']:
            c = browser.new_context(**p.devices['Pixel 7'], color_scheme=theme, reduced_motion='reduce', service_workers='block')
            page = c.new_page(); errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            # Isoler les fonctions sportives du compte Firebase facultatif.
            page.route('**/*', lambda r: r.fulfill(status=200, content_type='text/javascript', body='') if any(x in r.request.url for x in ['googleapis.com', 'gstatic.com']) else r.continue_())
            page.goto(f'http://127.0.0.1:{srv.server_port}/')
            page.evaluate('''([lang,theme]) => { localStorage.clear(); stocker('langue',lang); stocker('theme',theme==='dark'?'sombre':'clair'); sessionStorage.setItem('guideInstall','1'); }''', [lang,theme])
            page.reload()
            results = page.evaluate('''() => {
              const ok=(x,m)=>{if(!x)throw Error(m);}; let count=0,calendars=0;
              const original=[{k:'ft_force',j:jourCle(),s:1200,t:'Ancienne force',n:4}]; stocker('historique',JSON.stringify(original));
              const base=spPref('foot');
              for(const poste of ['champ','gardien'])for(const w of [0,1,2,3,4,5])for(const niv of ['debutant','club','compet'])for(const dur of [20,35,50])for(const mat of [[],Object.keys(MAT_X)])for(const match of [-1,6]) {
                const P={...base,poste,niv,dur,mat,match,jours:[],debut:jourCle(plusJ(lundi(),-7*w))}; spGarder('foot',P);
                for(const code of Object.keys(FTS)) {
                  const s=spSeance('foot',code); count++;
                  ok(s.plan.length && s.plan.every(q=>EXERCICES[q.id] && q.d>0 && Number.isFinite(q.r)),code+' plan');
                  ok(s.total<=dur+2,`${code} ${niv} w${w} ${dur}: ${s.total}`);
                  ok(/Mobilit|Mobility/.test(s.plan[0].bn)||code==='recup',code+' mobilité');
                  if(code!=='recup')ok(s.plan.some(q=>/Gainage|Core|core/.test(q.bn)),code+' gainage');
                  if(!mat.length)ok(!s.exercices.some(id=>['nordique','copenhague','copenhagueLong','ftBulgareChaise'].includes(id)),code+' matériel');
                  if(code.startsWith('tech_') && code!=='tech_gardien' && !mat.length)ok(!s.exercices.includes('gdPosition'),code+' gardien');
                  if(code==='vitesse' && (niv==='debutant' ? w<3 : match===-1 && w<2))ok(!s.exercices.includes('ftSprintLance'),'sprint trop tôt');
                }
              }
              for(const sp of ['foot','basket','handball','volley','tennis','padel']) for(const match of [-1,0,1,2,3,4,5,6])for(let mask=0;mask<128;mask++)for(const n of [1,3,5]) {
                const P={...spPref(sp),match,n,jours:Array.from({length:7},(_,d)=>d).filter(d=>mask&(1<<d))};
                const S=semaineEquipe(SP[sp].equipe,P); calendars++;
                const fixed=new Set([...P.jours,...(match>=0?[match]:[])]).size;
                ok(S.jours.filter(j=>j.club||j.l.length).length<=Math.max(5,fixed),sp+' repos');
                if(match>=0)ok(S.jours[match].l.includes('match'),sp+' match');
              }
              let P={...base,match:6,n:5,niv:'club',mat:[],dur:50,jours:[1,3]};spGarder('foot',P);
              const S=spSemaine('foot');
              ok(S.jours[1].l.includes('force'),'force après club mardi');
              ok(S.jours.some(j=>j.l.includes('vitesse')),'vitesse conservée');
              ok(S.jours[5].l.includes('activation'),'activation');
              ok(!S.jours[0].l.includes('recup'),'récup facultative');
              ok(spSeance('foot','force').total<=22,'force courte');
              ok(!spSeance('foot','force').exercices.includes('nordique'),'pas Nordic J-5');
              ok(spSeance('foot','tech_sansBallon').total<=22,'technique J-2 courte');
              ok(S.avert,'avertissement');
              spGarder('foot',{...P,jours:[],mat:['partenaire','box']});
              ok(spSeance('foot','force').exercices.includes('nordique'),'Nordic J-4');
              ok(SAISON_FT(spPref('foot')).some(([c])=>c==='intermittent'),'loisir cardio');
              ok(spSemaine('foot').jours.some(j=>j.l.includes('intermittent')),'loisir cardio placé');
              ok(!SAISON_FT(P).some(([c])=>c==='intermittent'),'club pas cardio ajouté');
              for(const tab of SP.foot.onglets){ouvrirSport('foot',tab[0]);ok($('bxC').children.length,'onglet '+tab[0]);ok(!document.querySelector('.sp-refonte'),'bandeau');}
              stocker('tests',JSON.stringify([{id:'ftSautUniLong',j:jourCle(),v:100},{id:'ftSautUniLongD',j:jourCle(),v:80}]));ouvrirSport('foot','tests');
              ok($('bxC').textContent.includes('10 %')||$('bxC').textContent.includes('10%'),'asymétrie');
              ok(lire('historique')===JSON.stringify(original),'historique conservé');
              ouvrirSport('foot');
              return {count,calendars,theme:document.documentElement.dataset.theme};
            }''')
            assert results['theme']==theme,results
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'débordement'
            (ROOT/'work').mkdir(exist_ok=True)
            page.screenshot(path=str(ROOT/'work'/f'football-{lang}-{theme}.png'),full_page=True)
            page.evaluate('ouvrirTests()')
            page.locator('[data-test="ftCod"]').fill('2.8');page.locator('[data-ok="ftCod"]').click()
            assert page.evaluate('lireTests().some(x=>x.id==="ftCod"&&x.v===2.8)')
            assert not errors,errors
            print(f'Pixel 7 {lang} {theme}: {results["count"]} séances, {results["calendars"]} calendriers, console OK')
            c.close()
    browser.close()
srv.shutdown()
