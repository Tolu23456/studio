
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

function getAdminApp(): App {
    if (admin.apps.length > 0) {
        // Return the existing app instance
        return admin.app();
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please check your configuration.");
    }
    
    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization error:", error);
        throw new Error(`Failed to initialize Firebase Admin SDK. Please check your service account credentials. Error: ${error.message}`);
    }
}

export const adminAuth = () => getAdminApp().auth();
export const adminDb = () => getAdminApp().firestore();
