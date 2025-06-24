
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
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      throw new Error(
        'The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please check your .env file.'
      );
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);

    // This line is crucial for environments that don't handle multiline secrets well.
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    if (process.env.NODE_ENV === 'development' && serviceAccount.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        console.warn("\n\n[Firebase Admin Warning] Server-side and client-side Firebase project IDs do not match. This can cause authentication errors. Check your .env file.\n\n");
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return adminApp;

  } catch (error: any) {
    let errorMessage = 'Failed to initialize Firebase Admin SDK. Please check your service account credentials.';
    if (error instanceof SyntaxError) {
        errorMessage += ' The service account JSON appears to be malformed or is missing.';
    } else {
        errorMessage += ` Original error: ${error.message}`;
    }
    console.error("Firebase Admin SDK initialization error:", error);
    throw new Error(errorMessage);
  }
};

export function getAdminAuth() {
    return getAdminApp().auth();
}

export function getAdminDb() {
    return getAdminApp().firestore();
}
