
import * as admin from 'firebase-admin';

export function getFirebaseAdmin() {
    if (admin.apps.length === 0) {
        try {
            const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (!serviceAccountJson) {
                throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please check your configuration.");
            }
            const serviceAccount = JSON.parse(serviceAccountJson);
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (error: any) {
            console.error("Firebase Admin SDK initialization error:", error);
            throw new Error(`Failed to initialize Firebase Admin SDK. Please check your service account credentials. Error: ${error.message}`);
        }
    }
    
    return {
        adminAuth: admin.auth(),
        adminDb: admin.firestore(),
    };
}
