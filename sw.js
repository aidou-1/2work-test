/* 2 WORK · service worker : l'appli fonctionne hors ligne.
   - Coquille (page, polices, icônes) : mise en cache à l'installation ; la page est servie « réseau d'abord » pour recevoir les mises à jour.
   - Vidéos : cache séparé « 2work-videos », rempli à la demande depuis Réglages → « Vidéos hors ligne », conservé entre les versions.
   - Vignettes des listes (vignettes/*.webp) : cache « 2work-vignettes », rempli au fil de l'affichage, conservé entre les versions.
   Changer V à chaque mise en ligne d'une nouvelle version. */
const V = "2work-v2026-11-14j", VIDEOS = "2work-videos", VIGNETTES = "2work-vignettes", ETAT = "2work-etat";
const COQUILLE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-64.png", "./icons/logo.png", "./icons/qr.png", "./consignes.js?v=2026-11-14j", "./js/donnees.js?v=2026-11-14j", "./js/seance.js?v=2026-11-14j", "./js/progres.js?v=2026-11-14j", "./js/catalogue.js?v=2026-11-14j", "./js/profil.js?v=2026-11-14j", "./js/anatomie.js?v=2026-11-14j", "./js/evenements.js?v=2026-11-14j", "./js/outils.js?v=2026-11-14j", "./js/cardio.js?v=2026-11-14j", "./js/chronos.js?v=2026-11-14j", "./js/sports.js?v=2026-11-14j", "./js/sport.js?v=2026-11-14j", "./js/boxe.js?v=2026-11-14j", "./js/foot.js?v=2026-11-14j", "./js/course.js?v=2026-11-14j", "./js/basket.js?v=2026-11-14j", "./js/tennis.js?v=2026-11-14j", "./js/padel.js?v=2026-11-14j", "./js/handball.js?v=2026-11-14j", "./js/volley.js?v=2026-11-14j", "./js/cyclisme.js?v=2026-11-14j", "./js/natation.js?v=2026-11-14j", "./js/escalade.js?v=2026-11-14j", "./js/ski.js?v=2026-11-14j", "./js/surf.js?v=2026-11-14j", "./js/pilates.js?v=2026-11-14j", "./js/jeu.js?v=2026-11-14j", "./js/moi.js?v=2026-11-14j", "./js/guide.js?v=2026-11-14j", "./js/clubs.js?v=2026-11-14j", "./js/coach.js?v=2026-11-14j", "./js/semaine1.js?v=2026-11-14j", "./js/serveur.js?v=2026-11-14j", "./fonds/chaud.webp", "./fonds/vert.webp", "./fonds/bleu.webp",
  ...["barlow-latin-400", "barlow-latin-500", "barlow-latin-600", "barlow-latin-700", "barlow-condensed-latin-600", "barlow-condensed-latin-700", "barlow-condensed-latin-800"].map(f => `./fonts/${f}-normal.woff2`)];
self.addEventListener("install", e => e.waitUntil(caches.open(V).then(c => c.addAll(COQUILLE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())));   // « reload » : jamais la copie du cache HTTP, toujours le serveur
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(l => Promise.all(l.filter(n => ![V, VIDEOS, VIGNETTES, ETAT].includes(n)).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.endsWith(".mp4")) return e.respondWith(video(r));
  const cache = u.pathname.includes("/vignettes/") ? VIGNETTES : V;
  if (r.mode === "navigate" || u.pathname.endsWith("/index.html"))
    return e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put("./index.html", c)); } return res; }).catch(() => caches.match("./index.html")));
  e.respondWith(caches.match(r).then(m => m || fetch(r, { cache: "no-cache" }).then(res => { if (res.ok && res.type === "basic") { const c = res.clone(); caches.open(cache).then(x => x.put(r, c)); } return res; })));
});
async function video(r) {   // vidéo en cache : réponse partielle (206) pour Safari, qui lit les vidéos par morceaux
  const m = await (await caches.open(VIDEOS)).match(r.url);
  if (!m) return fetch(r);
  const plage = r.headers.get("range");
  if (!plage) return m;
  const buf = await m.arrayBuffer(), p = /bytes=(\d*)-(\d*)/.exec(plage) || [], deb = +p[1] || 0, fin = p[2] ? Math.min(+p[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(deb, fin + 1), { status: 206, headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${deb}-${fin}/${buf.byteLength}`, "Content-Length": String(fin - deb + 1), "Accept-Ranges": "bytes" } });
}
/* Rappels : la page dépose « rappel.json » dans le cache ETAT (planning, heure, séance faite ou non). Sur Android, appli installée,
   le navigateur réveille ce service worker quelques fois par jour (Periodic Background Sync) : il notifie si une séance prévue est due. */
self.addEventListener("periodicsync", e => { if (e.tag === "rappel") e.waitUntil(rappel()); });
async function rappel() {
  const c = await caches.open(ETAT), url = new URL("rappel.json", self.registration.scope).href, m = await c.match(url); if (!m) return;
  const R = await m.json(), d = new Date(), p2 = n => String(n).padStart(2, "0"), j = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`, hm = `${p2(d.getHours())}:${p2(d.getMinutes())}`, t = R.jours[(d.getDay() + 6) % 7];
  if (!R.actif || R.fait === j) return;
  const opt = (body, cle, data) => ({ body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "2work-" + cle + "-" + j, data });
  if (t && R.envoye !== j && hm >= R.heure) { await self.registration.showNotification(R.titre, opt(t, "rappelEnvoye", "./?go=semaine")); R.envoye = j; }
  else if (R.envoyeSoir !== j && hm >= "19:00") {   // le soir, sans séance : vitalité de l'avatar (même calcul que dans l'appli), 5 minutes pour la recharger
    const auj = new Date(j), v = Math.min(100, Math.round((R.hist || []).reduce((t, [jj, sec]) => { const n = Math.round((auj - new Date(jj)) / 864e5); return n >= 0 && n < 14 ? t + 26 * Math.min(1, sec / 300) * Math.pow(.78, n) : t; }, 0)));
    if (v >= 70) return;
    await self.registration.showNotification(R.soir[0].replace("{v}", v), opt(R.soir[1], "rappelSoir", "./?go=express5")); R.envoyeSoir = j; }
  else return;
  await c.put(url, new Response(JSON.stringify(R)));
}
self.addEventListener("notificationclick", e => { e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(l => l.length ? l[0].navigate(e.notification.data || "./").then(c => c && c.focus()) : self.clients.openWindow(e.notification.data || "./"))); });
