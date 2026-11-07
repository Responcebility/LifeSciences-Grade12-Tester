// In-memory stand-ins for the Firebase CDN modules (app, auth, firestore), served in place of the gstatic URLs.
// Data lives in the page's localStorage so it survives page loads during a test.
export const APP = `export function initializeApp() { return {}; }`;

export const AUTH = `
const listeners = [];
const auth = { currentUser: null };
function loadUser() { try { const u = JSON.parse(localStorage.getItem('__fakeUser')); return u && { ...u, getIdToken: async () => 'fake-id-token' }; } catch (e) { return null; } }
export function getAuth() { auth.currentUser = loadUser(); return auth; }
export function onAuthStateChanged(a, cb) { listeners.push(cb); setTimeout(() => cb(loadUser()), 0); return () => {}; }
function setUser(u) { localStorage.setItem('__fakeUser', JSON.stringify(u)); auth.currentUser = u; listeners.forEach(cb => cb(u)); }
export async function signOut() { localStorage.removeItem('__fakeUser'); auth.currentUser = null; listeners.forEach(cb => cb(null)); }
export async function signInWithEmailAndPassword(a, email, pw) {
  if (pw !== 'secret1') { const e = new Error('bad'); e.code = 'auth/invalid-credential'; throw e; }
  setUser({ uid: 'u1', email, displayName: 'Thandi Mokoena' }); return { user: auth.currentUser };
}
export async function createUserWithEmailAndPassword(a, email) { setUser({ uid: 'u2', email, displayName: null }); return { user: auth.currentUser }; }
export async function updateProfile(u, p) { const cur = loadUser(); setUser({ ...cur, ...p }); }
export class GoogleAuthProvider {}
export async function signInWithPopup() { setUser({ uid: 'u1', email: 'g@x.com', displayName: 'Google User' }); }
export async function sendPasswordResetEmail() {}
export async function setPersistence() {}
export const browserLocalPersistence = {}; export const browserSessionPersistence = {};
`;

export const FIRESTORE = `
function load() { try { return JSON.parse(localStorage.getItem('__fakedb')) || {}; } catch (e) { return {}; } }
function save(db) { localStorage.setItem('__fakedb', JSON.stringify(db)); }
// Answer a little later, like a real network call, so code that loses state across an await is caught
const network = () => new Promise(r => setTimeout(r, 15));
const newId = () => 'x' + Math.random().toString(36).slice(2, 10);
export function getFirestore() { return {}; }
export function collection(db, ...parts) {
  const base = db && db.__col ? db.__col + '/' + db.id : null;
  return { __col: (base ? [base, ...parts] : parts).join('/') };
}
export function doc(dbOrCol, ...parts) {
  if (dbOrCol && dbOrCol.__col && parts.length === 0) return { col: dbOrCol.__col, id: newId() };
  const all = dbOrCol && dbOrCol.__col ? [dbOrCol.__col, ...parts] : parts;
  const path = all.join('/').split('/');
  return { col: path.slice(0, -1).join('/'), id: path[path.length - 1] };
}
export const Timestamp = { fromDate: (d) => ({ __date: d.getTime() }) };
export function increment(n) { return { __inc: n }; }
export function arrayUnion(...v) { return { __union: v }; }
export function arrayRemove(...v) { return { __remove: v }; }
export function serverTimestamp() { return { __ts: true }; }
function resolve(oldVal, val) {
  if (val && val.__inc !== undefined) return (oldVal || 0) + val.__inc;
  if (val && val.__union) return [...new Set([...(oldVal || []), ...val.__union])];
  if (val && val.__remove) return (oldVal || []).filter(x => !val.__remove.includes(x));
  if (val && val.__ts) return { __date: Date.now() };
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const out = { ...(oldVal && typeof oldVal === 'object' ? oldVal : {}) };
    for (const [k, v] of Object.entries(val)) out[k] = resolve(out[k], v);
    return out;
  }
  return val;
}
function hydrate(v) {
  if (v && v.__date) return { toDate: () => new Date(v.__date) };
  if (Array.isArray(v)) return v.map(hydrate);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = hydrate(v[k]); return o; }
  return v;
}
export async function getDoc(ref) { await network();
  const d = (load()[ref.col] || {})[ref.id];
  return { id: ref.id, exists: () => !!d, data: () => hydrate(d) };
}
export async function setDoc(ref, data, opts) { await network();
  const db = load(); db[ref.col] = db[ref.col] || {};
  db[ref.col][ref.id] = opts && opts.merge ? resolve(db[ref.col][ref.id], data) : resolve(undefined, data);
  save(db);
}
export async function updateDoc(ref, data) {
  if (!(load()[ref.col] || {})[ref.id]) throw new Error('no document to update: ' + ref.col + '/' + ref.id);
  return setDoc(ref, data, { merge: true });
}
export async function deleteDoc(ref) { await network(); const db = load(); if (db[ref.col]) delete db[ref.col][ref.id]; save(db); }
export async function addDoc(colRef, data) { const id = newId(); await setDoc({ col: colRef.__col, id }, data); return { id }; }
export function where(f, op, v) { return { type: 'where', f, op, v }; }
export function orderBy(f, dir) { return { type: 'order', f, dir }; }
export function limit(n) { return { type: 'limit', n }; }
export function query(colRef, ...c) { return { __col: colRef.__col, c }; }
const sortVal = (x) => (x && x.__date) || x || 0;
export async function getDocs(q) { await network();
  let rows = Object.entries(load()[q.__col] || {}).map(([id, d]) => ({ id, d }));
  for (const c of (q.c || [])) {
    if (c.type === 'where') rows = rows.filter(r => r.d[c.f] === c.v);
    if (c.type === 'order') rows.sort((a, b) => {
      const x = sortVal(a.d[c.f]), y = sortVal(b.d[c.f]);
      const r = x < y ? -1 : x > y ? 1 : 0;
      return c.dir === 'desc' ? -r : r;
    });
    if (c.type === 'limit') rows = rows.slice(0, c.n);
  }
  const docs = rows.map(r => ({ id: r.id, data: () => hydrate(r.d) }));
  return { docs, empty: docs.length === 0, forEach: (fn) => docs.forEach(fn) };
}
export async function getCountFromServer(colRef) {
  const n = Object.keys(load()[colRef.__col] || {}).length;
  return { data: () => ({ count: n }) };
}
export function writeBatch() {
  const ops = [];
  return { set: (ref, data) => ops.push([ref, data]), commit: async () => { for (const [r, d] of ops) await setDoc(r, d); } };
}
`;
