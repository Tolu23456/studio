
import * as admin from 'firebase-admin';

const getFirebaseAdmin = (): admin.app.App => {
  if (admin.apps.length > 0) {
    const app = admin.app();
    if (app) {
        return app;
    }
  }

  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key must be correctly formatted.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  // Validate that all required environment variables are present
  if (!serviceAccount.projectId || !service.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      `Firebase admin credentials are not set. Please make sure you have the correct environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) in your .env file.`
    );
  }

  try {
    // Initialize the app with the credentials.
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    throw new Error(`Firebase admin initialization error: ${error.message}`);
  }
};

// Export functions that retrieve the services from the initialized app.
// This ensures initialization happens only when a service is first requested.
export const getAdminAuth = (): admin.auth.Auth => getFirebaseAdmin().auth();
export const getAdminDb = (): admin.firestore.Firestore => getFirebaseAdmin().firestore();
