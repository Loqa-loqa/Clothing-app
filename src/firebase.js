// Firebase init — auth + Firestore. Config comes from env vars (see .env.example).
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Some networks/security software (antivirus "web protection", strict
// firewalls) kill Firestore's normal long-lived WebChannel streaming
// connection with net::ERR_CONNECTION_CLOSED — auto-detecting long polling
// makes the SDK fall back to plain short-lived HTTP requests instead, which
// gets through those environments much more reliably.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const googleProvider = new GoogleAuthProvider();

// ---- Auth helpers ----
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

// ---- Firestore helpers: users/{uid} ----
export async function ensureUserDoc(user, extra = {}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || extra.displayName || "",
      photoURL: user.photoURL || "",
      bodyType: extra.bodyType || "neutral",
      height: extra.height || null,
      location: null,
      weatherUnit: "celsius",
      joinedAt: serverTimestamp(),
    });
  }
  return ref;
}

export async function getUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserDoc(uid, data) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data);
}

// ---- Firestore helpers: users/{uid}/items ----
export function watchItems(uid, callback) {
  const ref = collection(db, "users", uid, "items");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function addItem(uid, item) {
  const ref = collection(db, "users", uid, "items");
  const docRef = await addDoc(ref, {
    ...item,
    userId: uid,
    wearCount: 0,
    lastWorn: null,
    favorite: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateItem(uid, itemId, data) {
  const ref = doc(db, "users", uid, "items", itemId);
  await updateDoc(ref, data);
}

export async function deleteItem(uid, itemId) {
  const ref = doc(db, "users", uid, "items", itemId);
  await deleteDoc(ref);
}

// ---- Firestore helpers: users/{uid}/outfits ----
export function watchOutfits(uid, callback) {
  const ref = collection(db, "users", uid, "outfits");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const outfits = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(outfits);
  });
}

export async function addOutfit(uid, outfit) {
  const ref = collection(db, "users", uid, "outfits");
  const docRef = await addDoc(ref, {
    ...outfit,
    userId: uid,
    worn: false,
    wornDate: null,
    favorite: false,
    shared: false,
    shareCode: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateOutfit(uid, outfitId, data) {
  const ref = doc(db, "users", uid, "outfits", outfitId);
  await updateDoc(ref, data);
}

export async function deleteOutfit(uid, outfitId) {
  const ref = doc(db, "users", uid, "outfits", outfitId);
  await deleteDoc(ref);
}

export { where, query, collection, doc };
