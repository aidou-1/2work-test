/* ============ SERVEUR DES CLUBS (Firebase) ============
   Seul fichier qui parle au serveur : comptes, clubs, séances partagées, chat. Chargé à la demande (import dynamique),
   uniquement quand on ouvre les clubs. Pour passer plus tard sur un NAS (PocketBase…), on réécrit ce fichier
   avec les mêmes fonctions exportées ; js/clubs.js ne change pas. Règles de sécurité : firestore.rules. */
const V = "13.1.0", URL_SDK = n => `https://www.gstatic.com/firebasejs/${V}/firebase-${n}.js`;
const [A, F, X] = await Promise.all([import(URL_SDK("app")), import(URL_SDK("auth")), import(URL_SDK("firestore"))]);
const app = A.initializeApp({ apiKey: "AIzaSyC9nhsZoxp84rfkaFIFdMK0CwoUPejHLoo", authDomain: "app-2work.firebaseapp.com", projectId: "app-2work", storageBucket: "app-2work.firebasestorage.app", messagingSenderId: "37692726703", appId: "1:37692726703:web:82b3f0880531584601635a" });
const auth = F.getAuth(app), db = X.getFirestore(app);
const d = (...p) => X.doc(db, ...p), col = (...p) => X.collection(db, ...p), moi = () => auth.currentUser && auth.currentUser.uid;
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
  for (const id of c ? c.clubs : []) { const m = await lireDoc("clubs", id, "membres", u.uid); if (m && m.role === "coach") await supprimerClub(id); else if (m) await X.deleteDoc(d("clubs", id, "membres", u.uid)); }
  for (const id of c ? c.attente : []) await X.deleteDoc(d("clubs", id, "demandes", u.uid)).catch(() => {});
  if (p) await X.deleteDoc(d("pseudos", p.pseudo.toLowerCase())).catch(() => {});
  await Promise.all([X.deleteDoc(d("profils", u.uid)), X.deleteDoc(d("comptes", u.uid))]);
  await F.deleteUser(u);
}

/* --- Mes clubs : liste tenue dans mon compte (clubs, et demandes en attente vérifiées à chaque ouverture) --- */
export async function mesClubs() {
  const uid = moi(), c = await lireDoc("comptes", uid); if (!c) return { clubs: [], attente: [] };
  let { clubs = [], attente = [] } = c; const nc = [], na = [];
  for (const id of attente) {   // acceptée ? refusée ? toujours en attente ?
    if (await lireDoc("clubs", id, "membres", uid)) { clubs.includes(id) || clubs.push(id); continue; }
    const dm = await lireDoc("clubs", id, "demandes", uid); if (dm) na.push({ id, nom: dm.nom || "" });
  }
  for (const id of clubs) { const cl = await lireDoc("clubs", id), m = cl && await lireDoc("clubs", id, "membres", uid); if (cl && m) nc.push({ ...cl, role: m.role, muet: !!m.muet }); }   // exclu ou club supprimé : retiré
  if (nc.length !== c.clubs.length || na.length !== c.attente.length) await X.updateDoc(d("comptes", uid), { clubs: nc.map(x => x.id), attente: na.map(x => x.id) });
  return { clubs: nc, attente: na };
}
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
export async function supprimerClub(c) {   // le coach efface tout le contenu, puis le club, puis sa propre fiche de membre
  for (const s of ["messages", "signalements", "invits", "demandes"]) for (const x of (await X.getDocs(col("clubs", c, s))).docs) await X.deleteDoc(x.ref);
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
export const exclure = (c, uid) => X.deleteDoc(d("clubs", c, "membres", uid));
export async function quitter(c) { await X.deleteDoc(d("clubs", c, "membres", moi())); await X.updateDoc(d("comptes", moi()), { clubs: X.arrayRemove(c) }); }

/* --- Lecture en direct : membres, demandes, séances, messages --- */
const vers = s => s.docs.map(x => ({ id: x.id, ...x.data({ serverTimestamps: "estimate" }) }));
export const ecouterMembres = (c, cb) => X.onSnapshot(col("clubs", c, "membres"), s => cb(vers(s)), () => cb([]));
export const ecouterDemandes = (c, cb) => X.onSnapshot(col("clubs", c, "demandes"), s => cb(vers(s)), () => cb([]));
export const ecouterSeances = (c, cb) => X.onSnapshot(X.query(col("clubs", c, "seances"), X.orderBy("date", "desc"), X.limit(60)), s => cb(vers(s)), () => cb([]));
export const ecouterFaits = (c, s, cb) => X.onSnapshot(col("clubs", c, "seances", s, "faits"), q => cb(vers(q)), () => cb([]));
export const ecouterMessages = (c, cb) => X.onSnapshot(X.query(col("clubs", c, "messages"), X.orderBy("t", "desc"), X.limit(150)), s => cb(vers(s).reverse()), () => cb([]));
export const ecouterSignalements = (c, cb) => X.onSnapshot(col("clubs", c, "signalements"), s => cb(vers(s)), () => cb([]));
export async function dernierMessage(c) { const s = await X.getDocs(X.query(col("clubs", c, "messages"), X.orderBy("t", "desc"), X.limit(1))).catch(() => null); return s && s.docs[0] ? { id: s.docs[0].id, ...s.docs[0].data() } : null; }
export async function prochaines(c, depuis) { const s = await X.getDocs(X.query(col("clubs", c, "seances"), X.where("date", ">=", depuis), X.orderBy("date"), X.limit(3))).catch(() => null); return s ? vers(s) : []; }
export async function mesFaits(c, ids) { const r = {}; await Promise.all(ids.map(async s => { r[s] = !!(await lireDoc("clubs", c, "seances", s, "faits", moi())); })); return r; }

/* --- Séances du club --- */
export const publier = (c, v) => X.addDoc(col("clubs", c, "seances"), { ...v, auteur: moi(), cree: X.serverTimestamp() });
export const modifierSeance = (c, s, v) => X.updateDoc(d("clubs", c, "seances", s), v);
export async function supprimerSeance(c, s) { for (const f of (await X.getDocs(col("clubs", c, "seances", s, "faits"))).docs) await X.deleteDoc(f.ref); await X.deleteDoc(d("clubs", c, "seances", s)); }
export const marquerFait = (c, s, pseudo, fait) => fait ? X.setDoc(d("clubs", c, "seances", s, "faits", moi()), { pseudo, t: X.serverTimestamp() }) : X.deleteDoc(d("clubs", c, "seances", s, "faits", moi()));

/* --- Chat --- */
export const envoyer = (c, texte, pseudo, rep) => X.addDoc(col("clubs", c, "messages"), { uid: moi(), pseudo, texte, t: X.serverTimestamp(), ...(rep ? { rep } : {}), reac: {} });
export const reagir = (c, m, e, oui) => X.updateDoc(d("clubs", c, "messages", m), new X.FieldPath("reac", e), oui ? X.arrayUnion(moi()) : X.arrayRemove(moi()));
export const effacerMessage = (c, m) => X.updateDoc(d("clubs", c, "messages", m), { suppr: true, texte: "" });
export const signaler = (c, m, extrait, auteur) => X.addDoc(col("clubs", c, "signalements"), { m, extrait, auteur, par: moi(), t: X.serverTimestamp() });
export const classerSignalement = (c, r) => X.deleteDoc(d("clubs", c, "signalements", r));
export const uid = moi;
