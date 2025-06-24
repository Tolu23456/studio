
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
    console.error('Error verifying auth token:', error);
    throw new Error(`User is not authenticated. Original error: ${error.message}`);
  }
}
