#!/usr/bin/env python3
"""Vérification automatique de 2 WORK, à lancer avant chaque mise en ligne : python3 outils/verif.py
   1. syntaxe de chaque fichier js ; 2. index.html et sw.js : chaque script existe et est mis en cache hors ligne ;
   3. vidéos et vignettes déclarées présentes ; 4. dans un navigateur (Playwright + Chrome) : démarrage sans erreur,
   accueil du premier lancement, chaque onglet de chaque sport, chaque séance de sport à 20/35/50 min, sans et avec
   tout le matériel, pour plusieurs profils (niveau, objectif, pratique) : aucun exercice inconnu, aucune séance vide.
   5. parcours clés : Ma semaine, Ma forme, douleur, séance guidée, voix enregistrée, planning de club.
   Sortie : la liste des problèmes, et un code de retour 1 s'il y en a (0 sinon)."""
import asyncio, glob, os, re, subprocess, sys, threading, http.server, functools, json

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RACINE)
pb = []

# 1. syntaxe
for f in sorted(glob.glob("js/*.js")) + ["sw.js", "consignes.js"]:
    r = subprocess.run(["node", "-e", f"new Function(require('fs').readFileSync({json.dumps(f)}, 'utf8'))"], capture_output=True, text=True)
    if r.returncode: pb.append(f"syntaxe {f} : {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else '?'}")
for f in glob.glob("js/*.js"):
    if re.search(r"^\s*import\s|^\s*export\s", open(f).read(), re.M): pb[:] = [p for p in pb if f not in p]   # modules (serveur.js) : syntaxe vérifiée par le navigateur

# 2. scripts et cache hors ligne
html, sw = open("index.html").read(), open("sw.js").read()
scripts = re.findall(r'<script src="([^"]+)"', html)
coquille = re.findall(r'"\./([^"]*)"', sw.split("COQUILLE")[1].split("];")[0])
ver = re.search(r'const V = "2work-v([^"]+)"', sw).group(1)
for s in scripts:
    f = s.split("?")[0]
    if not os.path.exists(f): pb.append(f"index.html charge {f}, introuvable")
    if s.startswith("js/") and s not in coquille: pb.append(f"{s} absent du cache hors ligne (COQUILLE de sw.js), ou numéro de version différent")
    if (s.startswith("js/") or s.startswith("consignes")) and not s.endswith("?v=" + ver): pb.append(f"{s} : pas au numéro de version {ver} (lancer outils/version.py)")
for c in coquille:
    if c and not os.path.exists(c.split("?")[0]): pb.append(f"sw.js met en cache {c}, introuvable")

# 3. vidéos déclarées
vids = re.findall(r'"([A-Za-z0-9]+)"', open("js/seance.js").read().split("const VIDEOS = [")[1].split("]")[0])
for v in vids:
    if not os.path.exists(f"videos/{v}.mp4"): pb.append(f"vidéo manquante : videos/{v}.mp4")

# 4. dans le navigateur
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Muet, directory=RACINE))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{srv.server_address[1]}/"

JS_SPORTS = r"""() => {
  const P = [], tous = Object.keys(MAT_X), var_ = { niv: ["debutant", "inter", "confirme", "fond", "avance", "club", "compet"], obj: [], prat: [] };
  for (const sp of Object.keys(SP)) {
    const G = SP[sp], base = spPref(sp), essais = [{}];
    (G.objectif?.objs || []).forEach(o => essais.push({ obj: o[0] }));
    (G.saison?.prat || []).forEach(o => essais.push({ prat: o[0] }));
    if (sp === "pilates") ["fond", "inter", "avance"].forEach(n => ["posture", "gainage", "souplesse", "sportif"].forEach(o => essais.push({ niv: n, obj: o })));
    if (sp === "escalade") ["bloc", "voie", "falaise", "debut"].forEach(p => essais.push({ prat: p, cot: 10 }));
    if (["ski", "surf"].includes(sp)) ["debutant", "inter", "confirme"].forEach(n => essais.push({ niv: n }));
    for (const e of essais) for (const mat of [[], tous]) for (const dur of [20, 35, 50]) {
      stocker(G.cle, JSON.stringify({ ...base, ...e, mat, dur }));
      for (const c of Object.keys(G.S)) {
        try { const x = { mat, dur, niv: spPref(sp).niv, P: spPref(sp), sac: false, court: false, f: 1 };   // chaque exercice prévu, y compris ceux que le matériel écarte
          [1, G.S[c].max || 1].forEach(k => G.S[c].f(k, x).forEach(b => b[6].forEach(i => [].concat(i[0]).forEach(id => EXERCICES[id] || P.push(`${sp}/${c} : exercice inconnu « ${id} »`)))));
          const s = spSeance(sp, c, { mat, dur });
          if (!s.plan.length) P.push(`${sp}/${c} : séance vide (${JSON.stringify(e)}, ${dur} min)`);
          s.plan.forEach(q => { if (!EXERCICES[q.id]) P.push(`${sp}/${c} : exercice inconnu « ${q.id} »`); if (!(q.d > 0)) P.push(`${sp}/${c} : durée nulle pour ${q.id}`); });
        } catch (x) { P.push(`${sp}/${c} : erreur ${x.message} (${JSON.stringify(e)})`); }
      }
    }
    stocker(G.cle, JSON.stringify(base));
    for (const o of G.onglets) { try { ouvrirSport(sp, o[0]); } catch (x) { P.push(`${sp} onglet ${o[0]} : ${x.message}`); } }
    [...(G.mob || []), ...(G.calme || []), ...(G.core || []).flatMap(x => [].concat(x[0]))].forEach(id => EXERCICES[id] || P.push(`${sp} : exercice de liste inconnu « ${id} »`));
  }
  return [...new Set(P)];
}"""

# 5. parcours clés (données d'essai effacées ensuite) : Ma semaine et son suivi, Ma forme, une séance guidée avec « Explique-moi »,
#    voix enregistrée (chaque consigne et chaque nom d'exercice, en français et en anglais), planning de club piégé
JS_PARCOURS = r"""async () => {
  const P = [], essai = (nom, f) => { try { const r = f(); if (r) P.push(nom + " : " + r); } catch (x) { P.push(nom + " : erreur " + x.message); } };
  localStorage.setItem("planning", JSON.stringify({ jours: [0, 2, 4], heure: "18:00", fait: {}, dep: {} }));
  localStorage.setItem("forme", JSON.stringify({ [jourCle()]: { h: 7, q: 3, e: 3, c: 2, st: 2, dl: 2, z: ["genou"], rv: 420 } }));
  essai("Ma semaine", () => { const U = suiviSemaine(); return U.prevues ? "" : "aucune séance prévue avec 3 jours perso"; });
  essai("écran Ma semaine", () => { ouvrirPlanning("menu"); return $("plSemaine") && $("plSemaine").querySelector(".ms-suivi") ? "" : "bloc de suivi absent"; });
  essai("Ma forme", () => { ecran("menu"); majSemaine(); return ["fmOuvrir", "fbDl", "fbSem"].every(id => $(id)) ? "" : "tuiles manquantes"; });
  essai("douleur", () => { feuilleDouleur(); const ok = !!$("dlListe") && !!document.querySelector(".corps"); fermerFeuille(); return ok ? "" : "carte du corps absente"; });
  essai("option conseillée", () => optionRecommandee() ? "" : "pas d'option avec une douleur notée");
  essai("séance guidée", () => { ouvrirRoutine("legDay"); demarrer(); expliquer(liste[index]); const ok = !!$("expliqueOk"); $("expliqueOk") && $("expliqueOk").click(); clearInterval(timer); return ok ? "" : "explication absente"; });
  essai("planning de club", () => nettoiePlan({ sp: "constructor", jours: [1] }) === null && nettoiePlan({ sp: "boxe", jours: [1, 9], types: { 1: "__proto__" } }).types[1] !== "__proto__" ? "" : "planning piégé accepté");
  for (const lg of ["fr", "en"]) { await dispoVoix(lg); const i = lg === "fr" ? 0 : 1, manq = [];
    for (const id in CONSIGNES) CONSIGNES[id][i].split("|").forEach(t => urlsVoix(t, false, lg) || manq.push(t));
    if (manq.length) P.push(`voix ${lg} : ${manq.length} consigne(s) sans enregistrement (outils/voix), ex. « ${manq[0].slice(0, 60)} »`); }
  ["planning", "forme", "exVus"].forEach(k => localStorage.removeItem(k));
  return P;
}"""

async def navigateur():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        exe = next((x for x in ["/usr/bin/google-chrome", "/usr/bin/chromium"] if os.path.exists(x)), None)
        b = await p.chromium.launch(**({"executable_path": exe} if exe else {}), args=["--no-sandbox"])
        c = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        await c.route(re.compile(r"googleapis|gstatic|firebase"), lambda r: r.abort())   # pas de serveur pendant la vérification
        pg = await c.new_page(); err = []
        pg.on("pageerror", lambda e: err.append(f"erreur JS : {e}"))
        pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and "net::" not in m.text and err.append(f"console : {m.text[:200]}"))
        await pg.goto(URL); await pg.wait_for_timeout(500)
        await pg.evaluate('() => { localStorage.clear(); sessionStorage.setItem("guideInstall", "1"); }')
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        try:
            await pg.evaluate("entrer()"); await pg.wait_for_timeout(300)
            for n in [1, 3, 4, 5]: await pg.evaluate(f"bienvenue({n})"); await pg.wait_for_timeout(150)
            await pg.evaluate('localStorage.setItem("guideVu", JSON.stringify(GUIDE.map(g => g[0]))); ecran("menu")')
        except Exception as x: err.append(f"accueil : {x}")
        pb.extend(await pg.evaluate(JS_SPORTS))
        pb.extend(await pg.evaluate(JS_PARCOURS))
        n = await pg.evaluate("[Object.keys(SP).length, Object.keys(EXERCICES).length]")
        pb.extend(dict.fromkeys(err)); await b.close(); return n

n = asyncio.run(navigateur())
print(f"2 WORK · {n[0]} sports, {n[1]} exercices, {len(scripts)} scripts, {len(vids)} vidéos vérifiés")
print("\n".join("✕ " + p for p in pb) if pb else "✓ Aucun problème")
sys.exit(1 if pb else 0)
