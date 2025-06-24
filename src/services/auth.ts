
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
    // Re-throw the original error to provide more specific details
    console.error("Error verifying auth token:", error);
    throw error;
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
