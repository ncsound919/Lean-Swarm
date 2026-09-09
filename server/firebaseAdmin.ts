import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json';

let adminApp: any = null;
let firestoreInstance: any = null;
let authInstance: any = null;

try {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    adminApp = getApps()[0];
  }
} catch (e: any) {
  // Graceful fallback for non-cloud runtime
}

try {
  firestoreInstance = getFirestore(firebaseConfig.firestoreDatabaseId);
} catch (e: any) {
  // Graceful fallback
}

try {
  authInstance = getAuth();
} catch (e: any) {
  // Graceful fallback
}

export const db = firestoreInstance;
export const auth = authInstance;
