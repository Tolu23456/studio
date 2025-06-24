
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  try {
    // Construct the service account object from individual environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Replace escaped newlines
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      throw new Error('Firebase Admin SDK credentials are not fully set in environment variables. Please check FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in your .env file.');
    }
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    return adminApp;

  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error);
    throw new Error(`Failed to initialize Firebase Admin SDK. Please check your service account credentials. Error: ${error.message}`);
  }
};

export function getAdminAuth() {
    return getAdminApp().auth();
}

export function getAdminDb() {
    return getAdminApp().firestore();
}
