/* ============ SERVEUR DES CLUBS (Firebase) ============
   Seul fichier qui parle au serveur : comptes, clubs, séances partagées, chat. Chargé à la demande (import dynamique),
   uniquement quand on ouvre les clubs. Pour passer plus tard sur un NAS (PocketBase…), on réécrit ce fichier
   avec les mêmes fonctions exportées ; js/clubs.js ne change pas. Règles de sécurité : firestore.rules. */
const V = "13.1.0", URL_SDK = n => `https://www.gstatic.com/firebasejs/${V}/firebase-${n}.js`;
const [A, F, X] = await Promise.all([import(URL_SDK("app")), import(URL_SDK("auth")), import(URL_SDK("firestore"))]);
const app = A.initializeApp({ apiKey: "AIzaSyC9nhsZoxp84rfkaFIFdMK0CwoUPejHLoo", authDomain: "app-2work.firebaseapp.com", projectId: "app-2work", storageBucket: "app-2work.firebasestorage.app", messagingSenderId: "37692726703", appId: "1:37692726703:web:82b3f0880531584601635a" });
const auth = F.getAuth(app), db = X.getFirestore(app);
const d = (...p) => X.doc(db, ...p), col = (...p) => X.collection(db, ...p), moi = () => auth.currentUser && auth.currentUser.uid;
// sections d'un club (ex. MMA, JJB) : leurs séances et leur chat vivent dans clubs/<c>/salons/<section>/… ; sal vide = tout le club
const B = (c, sal) => sal ? ["clubs", c, "salons", sal] : ["clubs", c];
const lireDoc = async (...p) => { try { const s = await X.getDoc(d(...p)); return s.exists() ? { id: s.id, ...s.data() } : null; } catch (e) { if (e.code === "permission-denied") return null; throw e; } };
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
export const PSEUDO_OK = /^[A-Za-z0-9_.-]{3,20}$/;

/* --- Compte --- */
export const langue = l => { auth.languageCode = l; };
export function surCompte(cb) { return F.onAuthStateChanged(auth, async u => cb(u ? { uid: u.uid, email: u.email, ...(await lireDoc("profils", u.uid)) } : null)); }
export async function pseudoLibre(p) { return !(await lireDoc("pseudos", p.toLowerCase())); }
export async function inscription({ email, mdp, pseudo, naissance, parental }) {
  if (!PSEUDO_OK.test(pseudo)) throw { code: "2work/pseudo-format" };
  if (!(await pseudoLibre(pseudo))) throw { code: "2work/pseudo-pris" };
  const { user } = await F.createUserWithEmailAndPassword(auth, email, mdp);
  try {
    const b = X.writeBatch(db);
    b.set(d("pseudos", pseudo.toLowerCase()), { uid: user.uid });
    b.set(d("profils", user.uid), { pseudo });
    b.set(d("comptes", user.uid), { naissance, parental: !!parental, cree: X.serverTimestamp(), clubs: [], attente: [] });
    await b.commit();
  } catch (e) { await user.delete().catch(() => {}); throw e.code === "permission-denied" ? { code: "2work/pseudo-pris" } : e; }   // pseudo réservé entre-temps
  return user.uid;
}
export const connexion = (email, mdp) => F.signInWithEmailAndPassword(auth, email, mdp);
export const deconnexion = () => F.signOut(auth);
export const motDePasseOublie = email => F.sendPasswordResetEmail(auth, email);
export async function supprimerCompte(mdp) {
  const u = auth.currentUser; await F.reauthenticateWithCredential(u, F.EmailAuthProvider.credential(u.email, mdp));
  const c = await lireDoc("comptes", u.uid), p = await lireDoc("profils", u.uid);
  for (const id of c ? c.clubs : []) { const m = await lireDoc("clubs", id, "membres", u.uid); if (m && m.role === "coach") await supprimerClub(id); else if (m) { await mesPrevEffacer(id); await X.deleteDoc(d("clubs", id, "membres", u.uid)); } }
  for (const id of c ? c.attente : []) await X.deleteDoc(d("clubs", id, "demandes", u.uid)).catch(() => {});
  if (p) await X.deleteDoc(d("pseudos", p.pseudo.toLowerCase())).catch(() => {});
  await Promise.all([X.deleteDoc(d("profils", u.uid)), X.deleteDoc(d("comptes", u.uid)), X.deleteDoc(d("sauvegardes", u.uid))]);
  await F.deleteUser(u);
}

/* --- Mes clubs : liste tenue dans mon compte (clubs, et demandes en attente vérifiées à chaque ouverture) --- */
export async function mesClubs() {
  const uid = moi(), c = await lireDoc("comptes", uid); if (!c) return { clubs: [], attente: [], retraits: [] };
  let { clubs = [], attente = [] } = c; const nc = [], na = [], nr = [];
  for (const id of attente) {   // acceptée ? refusée ? toujours en attente ?
    if (await lireDoc("clubs", id, "membres", uid)) { clubs.includes(id) || clubs.push(id); continue; }
    const dm = await lireDoc("clubs", id, "demandes", uid); if (dm) { na.push({ id, nom: dm.nom || "" }); continue; }
    const ex = await lireDoc("clubs", id, "exclus", uid); if (ex) nr.push({ id, nom: ex.nom, motif: ex.motif });   // accepté puis exclu avant d'avoir rouvert l'appli
  }
  for (const id of clubs) { const cl = await lireDoc("clubs", id), m = cl && await lireDoc("clubs", id, "membres", uid);
    if (cl && m) nc.push({ ...cl, role: m.role, muet: !!m.muet, motif: m.motif || "", mesSec: m.sections || [], mesDem: m.secDem || [] });
    else { const ex = await lireDoc("clubs", id, "exclus", uid); if (ex) nr.push({ id, nom: ex.nom, motif: ex.motif }); } }   // exclu (avec son motif) ou club supprimé : retiré de la liste
  if (nc.length !== c.clubs.length || na.length !== c.attente.length) await X.updateDoc(d("comptes", uid), { clubs: nc.map(x => x.id), attente: na.map(x => x.id) });
  return { clubs: nc, attente: na, retraits: nr };
}
export const lireRetrait = c => X.deleteDoc(d("clubs", c, "exclus", moi())).catch(() => {});
export async function creerClub({ nom, sport, desc, pseudo }) {
  const uid = moi(), ref = X.doc(col("clubs")), k = code(), b = X.writeBatch(db);
  b.set(ref, { nom, sport: sport || "", desc: desc || "", coach: uid, cree: X.serverTimestamp() });
  b.set(d("clubs", ref.id, "membres", uid), { uid, pseudo, role: "coach", muet: false, depuis: X.serverTimestamp() });
  await b.commit();
  await X.setDoc(d("clubs", ref.id, "invits", k), { nom, cree: X.serverTimestamp() });
  await X.updateDoc(d("comptes", uid), { clubs: X.arrayUnion(ref.id) });
  return ref.id;
}
export const modifierClub = (c, v) => X.updateDoc(d("clubs", c), v);
export async function supprimerSection(c, sal) {   // séances (et leurs coches) puis messages de la section
  for (const x of (await X.getDocs(col(...B(c, sal), "seances"))).docs) await supprimerSeance(c, x.id, sal);
  for (const x of (await X.getDocs(col(...B(c, sal), "messages"))).docs) await X.deleteDoc(x.ref);
}
export async function supprimerClub(c) {   // le coach efface tout le contenu, puis le club, puis sa propre fiche de membre
  await purgerPrev(c); for (const x of ((await lireDoc("clubs", c)) || {}).sections || []) await supprimerSection(c, x.id);
  for (const s of ["messages", "signalements", "invits", "demandes", "exclus", "prevSem"]) for (const x of (await X.getDocs(col("clubs", c, s))).docs) await X.deleteDoc(x.ref);
  for (const x of (await X.getDocs(col("clubs", c, "seances"))).docs) { for (const f of (await X.getDocs(col("clubs", c, "seances", x.id, "faits"))).docs) await X.deleteDoc(f.ref); await X.deleteDoc(x.ref); }
  for (const x of (await X.getDocs(col("clubs", c, "membres"))).docs) if (x.id !== moi()) await X.deleteDoc(x.ref);
  await X.deleteDoc(d("clubs", c)); await X.deleteDoc(d("clubs", c, "membres", moi()));
  await X.updateDoc(d("comptes", moi()), { clubs: X.arrayRemove(c) });
}

/* --- Invitations et demandes --- */
export async function invitation(c) { const l = (await X.getDocs(col("clubs", c, "invits"))).docs; return l.length ? l[0].id : null; }
export async function nouvelleInvitation(c, nom) {
  for (const x of (await X.getDocs(col("clubs", c, "invits"))).docs) await X.deleteDoc(x.ref);   // l'ancien lien ne marche plus
  const k = code(); await X.setDoc(d("clubs", c, "invits", k), { nom, cree: X.serverTimestamp() }); return k;
}
export const lireInvitation = (c, k) => lireDoc("clubs", c, "invits", k);
export async function demander(c, k, pseudo, nom) {
  await X.setDoc(d("clubs", c, "demandes", moi()), { pseudo, code: k, nom, t: X.serverTimestamp() });
  await X.updateDoc(d("comptes", moi()), { attente: X.arrayUnion(c) });
}
export async function accepter(c, uid, pseudo) {
  const b = X.writeBatch(db);
  b.set(d("clubs", c, "membres", uid), { uid, pseudo, role: "membre", muet: false, depuis: X.serverTimestamp() });
  b.delete(d("clubs", c, "demandes", uid)); await b.commit();
}
export const refuser = (c, uid) => X.deleteDoc(d("clubs", c, "demandes", uid));
export const changerMembre = (c, uid, v) => X.updateDoc(d("clubs", c, "membres", uid), v);
export async function exclure(c, uid, motif, nom) {   // le membre exclu garde une notice avec le motif (exposé des motifs, DSA art. 17)
  await X.setDoc(d("clubs", c, "exclus", uid), { motif, nom, t: X.serverTimestamp() });
  await X.deleteDoc(d("clubs", c, "membres", uid));
  await purgerPrev(c, uid).catch(() => {});
}
export async function quitter(c) { await mesPrevEffacer(c); await X.deleteDoc(d("clubs", c, "membres", moi())); await X.updateDoc(d("comptes", moi()), { clubs: X.arrayRemove(c) }); }

/* --- Lecture en direct : membres, demandes, séances, messages --- */
const vers = s => s.docs.map(x => ({ id: x.id, ...x.data({ serverTimestamps: "estimate" }) }));
export const ecouterMembres = (c, cb) => X.onSnapshot(col("clubs", c, "membres"), s => cb(vers(s)), () => cb([]));
export const ecouterDemandes = (c, cb) => X.onSnapshot(col("clubs", c, "demandes"), s => cb(vers(s)), () => cb([]));
export const ecouterSeances = (c, cb, sal) => X.onSnapshot(X.query(col(...B(c, sal), "seances"), X.orderBy("date", "desc"), X.limit(60)), s => cb(vers(s).map(x => ({ ...x, sec: sal || "" }))), () => cb([]));
export const ecouterFaits = (c, s, cb, sal) => X.onSnapshot(col(...B(c, sal), "seances", s, "faits"), q => cb(vers(q)), () => cb([]));
export const ecouterMessages = (c, cb, sal) => X.onSnapshot(X.query(col(...B(c, sal), "messages"), X.orderBy("t", "desc"), X.limit(150)), s => cb(vers(s).reverse()), () => cb([]));
export const ecouterSignalements = (c, cb) => X.onSnapshot(col("clubs", c, "signalements"), s => cb(vers(s)), () => cb([]));
export async function dernierMessage(c, sal) { const s = await X.getDocs(X.query(col(...B(c, sal), "messages"), X.orderBy("t", "desc"), X.limit(1))).catch(() => null); return s && s.docs[0] ? { id: s.docs[0].id, ...s.docs[0].data() } : null; }
export async function prochaines(c, depuis, secs = []) { const l = await Promise.all(["", ...secs].map(async sal => { const s = await X.getDocs(X.query(col(...B(c, sal), "seances"), X.where("date", ">=", depuis), X.orderBy("date"), X.limit(3))).catch(() => null); return s ? vers(s) : []; })); return l.flat().sort((a, b) => a.date < b.date ? -1 : 1).slice(0, 3); }
export async function mesFaits(c, l) { const r = {}; await Promise.all(l.map(async s => { r[s.id] = !!(await lireDoc(...B(c, s.sec), "seances", s.id, "faits", moi())); })); return r; }   // l : [{ id, sec }]

/* --- Séances du club --- */
export const publier = (c, v, sal) => X.addDoc(col(...B(c, sal), "seances"), { ...v, auteur: moi(), cree: X.serverTimestamp() });
export async function supprimerSeance(c, s, sal) { for (const f of (await X.getDocs(col(...B(c, sal), "seances", s, "faits"))).docs) await X.deleteDoc(f.ref); await X.deleteDoc(d(...B(c, sal), "seances", s)); }
export const marquerFait = (c, s, pseudo, fait, sal) => fait ? X.setDoc(d(...B(c, sal), "seances", s, "faits", moi()), { pseudo, t: X.serverTimestamp() }) : X.deleteDoc(d(...B(c, sal), "seances", s, "faits", moi()));

/* --- Prévention des blessures (activée par le coach) : une fiche par joueur et par semaine (« 2026-11-09_<uid> » : n fois),
   plus un total d'équipe par semaine (« prevSem/2026-11-09 » : n séances, j joueurs). Le détail par joueur n'est lisible par le staff
   que si le coach a choisi « nom par nom » ; sinon seulement le total (règles : firestore.rules). */
const lundis = depuis => { const l = [], j = new Date(); j.setUTCHours(12, 0, 0, 0); j.setUTCDate(j.getUTCDate() - (j.getUTCDay() + 6) % 7);
  for (let k = 0; k < 160 && j.toISOString().slice(0, 10) >= depuis; k++, j.setUTCDate(j.getUTCDate() - 7)) l.push(j.toISOString().slice(0, 10)); return l; };
export async function prevFait(c, s, pseudo) {   // s : lundi de la semaine ; renvoie le nombre de fois cette semaine
  const id = s + "_" + moi(), a = await lireDoc("clubs", c, "prev", id), b = X.writeBatch(db); if (a && a.n >= 14) return a.n;
  if (a) b.update(d("clubs", c, "prev", id), { n: X.increment(1), t: X.serverTimestamp() }); else b.set(d("clubs", c, "prev", id), { uid: moi(), pseudo, s, n: 1, t: X.serverTimestamp() });
  b.set(d("clubs", c, "prevSem", s), { n: X.increment(1), j: X.increment(a ? 0 : 1) }, { merge: true });
  await b.commit(); return (a ? a.n : 0) + 1;
}
export const maPrev = (c, s) => lireDoc("clubs", c, "prev", s + "_" + moi());
export const ecouterPrevSem = (c, s, cb) => X.onSnapshot(d("clubs", c, "prevSem", s), x => cb(x.exists() ? x.data() : null), () => cb(null));
export async function prevSemaines(c, sems) { return Object.fromEntries(await Promise.all(sems.map(async s => [s, await lireDoc("clubs", c, "prevSem", s)]))); }
export async function prevNoms(c, depuis) { const q = await X.getDocs(X.query(col("clubs", c, "prev"), X.where("s", ">=", depuis))).catch(() => null); return q ? vers(q) : null; }   // null : vue « total »
async function mesPrevEffacer(c) { const q = await X.getDocs(X.query(col("clubs", c, "prev"), X.where("uid", "==", moi()))).catch(() => null); for (const x of q ? q.docs : []) await X.deleteDoc(x.ref).catch(() => {}); }
async function purgerPrev(c, seul) {   // le coach efface les fiches (d'un joueur exclu, ou de tous) semaine par semaine depuis l'activation, sans avoir à les lire
  const cl = await lireDoc("clubs", c), p = cl && cl.prev; if (!p || !p.depuis) return;
  const uids = seul ? [seul] : (await X.getDocs(col("clubs", c, "membres"))).docs.map(x => x.id);
  await Promise.all(lundis(p.depuis).flatMap(s => uids.map(u => X.deleteDoc(d("clubs", c, "prev", s + "_" + u)).catch(() => {}))));
}

/* --- Suivi du coach : qui a coché quoi sur une liste de séances --- */
export async function faitsDe(c, l) { const r = {}; await Promise.all(l.map(async s => { r[s.id] = ((await X.getDocs(col(...B(c, s.sec), "seances", s.id, "faits")).catch(() => null)) || { docs: [] }).docs.map(x => x.id); })); return r; }   // l : [{ id, sec }]

/* --- Chat --- */
export async function envoyer(c, texte, pseudo, rep, sal) {   // le message et l'horodatage anti-spam partent ensemble (règle : 1 message / 2 s)
  const b = X.writeBatch(db);
  b.set(X.doc(col(...B(c, sal), "messages")), { uid: moi(), pseudo, texte, t: X.serverTimestamp(), ...(rep ? { rep } : {}), reac: {} });
  b.update(d("clubs", c, "membres", moi()), { dernier: X.serverTimestamp() });
  await b.commit();
}
export const reagir = (c, m, e, oui, sal) => X.updateDoc(d(...B(c, sal), "messages", m), new X.FieldPath("reac", e), oui ? X.arrayUnion(moi()) : X.arrayRemove(moi()));
export const effacerMessage = (c, m, motif, sal) => X.updateDoc(d(...B(c, sal), "messages", m), motif ? { suppr: true, texte: "", motif } : { suppr: true, texte: "" });
export const signaler = (c, m, extrait, auteur, sal) => X.addDoc(col("clubs", c, "signalements"), { m, extrait, auteur, par: moi(), t: X.serverTimestamp(), ...(sal ? { sal } : {}) });
export const classerSignalement = (c, r) => X.deleteDoc(d("clubs", c, "signalements", r));
export const uid = moi;

/* --- Sauvegarde en ligne du suivi : le fichier de sauvegarde habituel, compressé (gzip), privé (règle : propriétaire seul) --- */
const flux = async (txt, sens) => new Uint8Array(await new Response(new Blob([txt]).stream().pipeThrough(sens ? new CompressionStream("gzip") : new DecompressionStream("gzip"))).arrayBuffer());
export async function sauverEnLigne(json) {
  const z = await flux(json, true); if (z.length > 1000000) throw { code: "2work/trop-gros" };
  await X.setDoc(d("sauvegardes", moi()), { z: X.Bytes.fromUint8Array(z), n: json.length, t: X.serverTimestamp() });
  return z.length;
}
export async function infoSauvegarde() { const s = await lireDoc("sauvegardes", moi()); return s ? { t: s.t && s.t.toDate(), taille: s.z.toUint8Array().length, s } : null; }
export async function lireSauvegarde(info) { const s = info ? info.s : await lireDoc("sauvegardes", moi()); return s ? new TextDecoder().decode(await flux(s.z.toUint8Array(), false)) : null; }
export const effacerSauvegarde = () => X.deleteDoc(d("sauvegardes", moi()));
