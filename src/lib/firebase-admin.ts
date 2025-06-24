
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

let app: App | undefined;

function getAdminApp(): App {
    if (app) {
        return app;
    }
    
    if (admin.apps.length > 0) {
        app = admin.apps[0]!;
        return app;
    }

    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountJson) {
            throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please check your configuration.");
        }
        const serviceAccount = JSON.parse(serviceAccountJson);
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        
        if (process.env.NODE_ENV === 'development') {
             if (serviceAccount.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                console.warn("\n\n⚠️  WARNING: Server-side and client-side Firebase project IDs do not match. This is a common cause of authentication errors. Please check your .env file.\n\n");
            }
        }
        
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        return app;
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization error:", error);
        throw new Error(`Failed to initialize Firebase Admin SDK. Please check your service account credentials. Error: ${error.message}`);
    }
}

export function getAdminAuth() {
    return getAdminApp().auth();
}

export function getAdminDb() {
    return getAdminApp().firestore();
}
