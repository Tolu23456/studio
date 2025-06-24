
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function verifyToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken) {
    throw new Error('Authentication token is required.');
  }
  try {
    const { adminAuth } = getFirebaseAdmin();
    return await adminAuth.verifyIdToken(idToken);
  } catch (error: any) {
    console.error('Full error object during token verification:', JSON.stringify(error, null, 2));

    let errorMessage = 'User is not authenticated. An unknown error occurred during token verification.';
    if (error.code) {
        errorMessage = `User is not authenticated. Firebase error code: ${error.code}.`;
        if (error.code === 'auth/id-token-expired') {
            errorMessage += ' The user token has expired.';
        } else if (error.code === 'auth/argument-error') {
            errorMessage += ' The token is malformed or invalid. This can happen if the client and server Firebase projects are different.';
        } else if (error.code === 'auth/project-not-found') {
            errorMessage += ' The Firebase project associated with the service account could not be found.';
        }
    } else if (error.message) {
        errorMessage = `User is not authenticated. Original error: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}


export async function getAuthenticatedUid(idToken: string): Promise<string> {
    const decodedToken = await verifyToken(idToken);
    return decodedToken.uid;
}

export async function verifyAdminAndGetUid(idToken: string): Promise<string> {
    const decodedToken = await verifyToken(idToken);
    if (decodedToken.admin !== true) {
        throw new Error('User does not have admin privileges.');
    }
    return decodedToken.uid;
}

export async function verifyTokenAndGetEmail(idToken: string): Promise<{ uid: string, email: string | undefined }> {
     const decodedToken = await verifyToken(idToken);
     return { uid: decodedToken.uid, email: decodedToken.email };
}
