import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── Guard: fail fast with a useful message instead of cryptic Firebase errors ──
const REQUIRED_KEYS = ["apiKey", "authDomain", "databaseURL", "projectId"] as const;
for (const key of REQUIRED_KEYS) {
  const val = firebaseConfig[key];
  if (!val || val.startsWith("YOUR_") || val.startsWith("demo")) {
    const envVar = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
    console.error(
      `[Firebase] Missing or placeholder value for ${envVar}. ` +
      `Open .env.local and replace the YOUR_... placeholder with your real Firebase credential.`
    );
    // Don't throw in production build — allow static pages to render;
    // the app will show "Offline" state until real credentials are provided.
  }
}

// Prevent re-initialization in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const rtdb = getDatabase(app);   // Realtime Database — live sensor data
export const db   = getFirestore(app);  // Firestore — historical readings & sessions
export default app;
