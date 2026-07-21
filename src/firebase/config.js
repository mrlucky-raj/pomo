import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Reads both standard .env keys and Vite environment variables with hardcoded fallbacks
const getEnvVar = (key, viteKey, fallback) => {
  return import.meta.env[viteKey] || import.meta.env[key] || fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('apiKey', 'VITE_FIREBASE_API_KEY', 'AIzaSyDixPUTPnyFZRWwfNwG4nWeKo4hagIl_ls'),
  authDomain: getEnvVar('authDomain', 'VITE_FIREBASE_AUTH_DOMAIN', 'pomo-mrlucky.firebaseapp.com'),
  projectId: getEnvVar('projectId', 'VITE_FIREBASE_PROJECT_ID', 'pomo-mrlucky'),
  storageBucket: getEnvVar('storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET', 'pomo-mrlucky.firebasestorage.app'),
  messagingSenderId: getEnvVar('messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID', '771967974959'),
  appId: getEnvVar('appId', 'VITE_FIREBASE_APP_ID', '1:771967974959:web:2237abcbdfec20950550da'),
  databaseURL: getEnvVar('databaseUrl', 'VITE_FIREBASE_DATABASE_URL', 'https://pomo-mrlucky-default-rtdb.asia-southeast1.firebasedatabase.app'),
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
    console.warn('Firebase initialization error:', err);
  }
}

export { app, auth, rtdb, rtdb as db, googleProvider, isFirebaseConfigured };
