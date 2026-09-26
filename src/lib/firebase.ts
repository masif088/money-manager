import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

// Web config is public by design; access is enforced by firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyCuHTv0kMHC-OlsALt_aDuW5Sd6TU53nmE",
  authDomain: "money-manager-2d962.firebaseapp.com",
  projectId: "money-manager-2d962",
  storageBucket: "money-manager-2d962.firebasestorage.app",
  messagingSenderId: "128130255880",
  appId: "1:128130255880:web:6f2e5f6785fc99d12355bd",
};

let auth: Auth | undefined;
let db: Firestore | undefined;

// Lazy so nothing runs during static prerendering.
function app() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function firebaseAuth() {
  auth ??= getAuth(app());
  return auth;
}

export function firestore() {
  db ??= initializeFirestore(app(), {
    // Offline-first: reads come from IndexedDB, writes queue until online.
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
  });
  return db;
}
