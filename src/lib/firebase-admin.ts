
import 'dotenv/config';
import * as admin from 'firebase-admin';

// This function ensures that Firebase Admin is initialized only once.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key must be correctly formatted.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  // Validate that all required environment variables are present
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      `Firebase admin credentials are not set. Please make sure you have the correct environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).`
    );
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    throw new Error(`Firebase admin initialization error: ${error.message}`);
  }
}

// Initialize the app and export the services.
// This code runs once when the module is first imported.
const app = initializeAdminApp();
export const adminAuth = app.auth();
export const adminDb = app.firestore();
