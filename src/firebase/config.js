import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Reads both standard .env keys (apiKey, authDomain...) and VITE_ prefixed keys
const getEnvVar = (key, viteKey) => {
  return import.meta.env[viteKey] || import.meta.env[key] || '';
};

const firebaseConfig = {
  apiKey: getEnvVar('apiKey', 'VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('projectId', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('appId', 'VITE_FIREBASE_APP_ID'),
  databaseURL: getEnvVar('databaseUrl', 'VITE_FIREBASE_DATABASE_URL'),
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let auth;
let rtdb;
let googleProvider;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    rtdb = getDatabase(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn('Firebase initialization error, fallback to offline-mode:', err);
  }
} else {
  console.info('Firebase keys not fully set. Running in 100% offline local-storage mode.');
}

export { app, auth, rtdb, rtdb as db, googleProvider, isFirebaseConfigured };

