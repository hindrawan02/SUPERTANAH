import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId as required by AI Studio environment
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-sistempersuratan-d081b439-50bc-4a72-8e95-ae3411752abc'
);

export const auth = getAuth(app);

// Test connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    console.log('✅ Terhubung ke Firestore Cloud Database SIPERDITAN secara real-time!');
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('⚠️ Firestore berjalan dalam mode offline/cache lokal.');
    }
  }
})();
