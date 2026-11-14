"""Nouvelle version de 2 WORK, à lancer avant chaque mise en ligne : python3 outils/version.py
Met le même numéro (ex. 2026-11-14e) dans sw.js (nom du cache, V) et en « ?v= » sur chaque script local d'index.html et de la
COQUILLE de sw.js. Une nouvelle adresse par version oblige le CDN de GitHub Pages et les navigateurs à servir des fichiers
neufs et assortis : jamais une page nouvelle avec un script ancien (cause d'un démarrage bloqué juste après une mise en ligne)."""
import datetime, re, string, sys, os
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
sw, html = open("sw.js", encoding="utf8").read(), open("index.html", encoding="utf8").read()
ancienne = re.search(r'const V = "2work-v([^"]+)"', sw).group(1)
auj = datetime.date.today().isoformat()
if len(sys.argv) > 1: v = sys.argv[1]
elif ancienne.startswith(auj):   # même jour : lettre suivante (a … z, puis za, zb…)
    s = ancienne[len(auj):] or "a"; v = auj + (s[:-1] + string.ascii_lowercase[string.ascii_lowercase.index(s[-1]) + 1] if s[-1] != "z" else s + "a")
else: v = auj + "a"
sw = sw.replace(f'const V = "2work-v{ancienne}"', f'const V = "2work-v{v}"')
sw = re.sub(r'"\./((?:js/[^"?]+|consignes)\.js)(?:\?v=[^"]*)?"', lambda m: f'"./{m.group(1)}?v={v}"', sw)
html = re.sub(r'<script src="((?:js/[^"?]+|consignes)\.js)(?:\?v=[^"]*)?"', lambda m: f'<script src="{m.group(1)}?v={v}"', html)
open("sw.js", "w", encoding="utf8").write(sw); open("index.html", "w", encoding="utf8").write(html)
print(f"version {ancienne} → {v}")
