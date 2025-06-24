
import * as admin from 'firebase-admin';

function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please check your configuration.");
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        // This is the fix: The private key has \\n characters that need to be replaced with \n.
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error: any) {
        throw new Error(`Failed to initialize Firebase Admin SDK from service account JSON: ${error.message}`);
    }
}

const getAdminAuth = () => admin.auth(getAdminApp());
const getAdminDb = () => admin.firestore(getAdminApp());

export { getAdminAuth, getAdminDb };
