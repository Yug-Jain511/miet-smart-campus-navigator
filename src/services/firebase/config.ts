// Firebase is OPTIONAL for the MVP.
// The app must boot and run fully with no .env and no credentials.
// Local demo data (src/data/demoCampus) is the default data source.
// When env vars ARE present, callers may use getDb()/isFirebaseConfigured()
// to enable Firestore reads/writes. Never crash when unconfigured.

import type { Firestore } from 'firebase/firestore';

let cachedDb: Firestore | null | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID,
  );
}

/** Lazily initializes Firebase; returns null when unconfigured (by design). */
export async function getDb(): Promise<Firestore | null> {
  if (cachedDb !== undefined) return cachedDb;
  if (!isFirebaseConfigured()) {
    cachedDb = null;
    return null;
  }
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
      messagingSenderId: import.meta.env
        .VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    };
    const app =
      getApps().length > 0 ? getApps()[0]! : initializeApp(config);
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (err) {
    console.warn('Firebase unavailable, using local demo data.', err);
    cachedDb = null;
    return null;
  }
}
