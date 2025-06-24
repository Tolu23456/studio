
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

const getAdminApp = (): App => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      throw new Error(
        'The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please check your configuration in the .env file.'
      );
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);

    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    if (process.env.NODE_ENV === 'development' && serviceAccount.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        console.warn("\n\n[Firebase Admin Warning] Server-side and client-side Firebase project IDs do not match. This can cause authentication errors. Check your .env file.\n\n");
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    let errorMessage = 'Failed to initialize Firebase Admin SDK. Please check your service account credentials.';
    if (error instanceof SyntaxError) {
        errorMessage += ' The service account JSON appears to be malformed.';
    } else {
        errorMessage += ` Error: ${error.message}`;
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
