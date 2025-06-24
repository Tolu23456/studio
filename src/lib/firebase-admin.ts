
import * as admin from 'firebase-admin';

function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey || serviceAccount.privateKey === '\n') {
        throw new Error("Firebase admin credentials are not set in your .env file. Please check your configuration.");
    }
    
    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error: any) {
        throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
}

const getAdminAuth = () => admin.auth(getAdminApp());
const getAdminDb = () => admin.firestore(getAdminApp());

export { getAdminAuth, getAdminDb };
