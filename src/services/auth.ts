
'use server';

import { getAdminAuth } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function verifyToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken) {
    throw new Error('Authentication token is required.');
  }
  try {
    const adminAuth = getAdminAuth();
    return await adminAuth.verifyIdToken(idToken);
  } catch (error: any) {
    // If the error is from initialization, it's already well-formatted. Let's just throw it.
    if (error.message.startsWith('Failed to initialize Firebase Admin SDK')) {
      console.error("Firebase Admin SDK Initialization Error:", error.message);
      throw error;
    }
    
    // If it's a token verification error from Firebase, it will have a 'code'.
    if (error.code) { 
      console.error('Firebase token verification error:', error.code, error.message);
      throw new Error(`User is not authenticated. Reason: ${error.code}`);
    }

    // For any other unexpected errors.
    console.error('An unexpected error occurred during token verification:', error);
    throw new Error('An unexpected error occurred during authentication.');
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
