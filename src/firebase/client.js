import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const firebaseReady = Object.values(config).every(Boolean);
let app, auth, db;
if (firebaseReady) {
  app = getApps().length ? getApps()[0] : initializeApp(config);
  auth = getAuth(app);
  db = getDatabase(app);
}
export { auth, db };
export async function ensureAnonymousUser() {
  if (!firebaseReady) throw new Error('Firebase ainda não foi configurado.');
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}
