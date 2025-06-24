'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function getAuthenticatedUid(idToken: string): Promise<string> {
  if (!idToken) {
    throw new Error('Authentication token is required.');
  }
  try {
    const { adminAuth } = getFirebaseAdmin();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error: any) {
    // Log the full error object to the server console for better debugging.
    console.error('Full error object during token verification:', JSON.stringify(error, null, 2));

    let errorMessage = 'User is not authenticated. An unknown error occurred during token verification.';
    if (error.code) {
        // Firebase errors often have a 'code' property.
        errorMessage = `User is not authenticated. Firebase error code: ${error.code}.`;
        if (error.code === 'auth/id-token-expired') {
            errorMessage += ' The user token has expired.';
        } else if (error.code === 'auth/argument-error') {
             errorMessage += ' The token is malformed or invalid.';
        }
    } else if (error.message) {
        errorMessage = `User is not authenticated. Original error: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}
