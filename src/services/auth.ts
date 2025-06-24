'use server';

import { getAdminAuth } from '@/lib/firebase-admin';

export async function getAuthenticatedUid(idToken: string): Promise<string> {
  if (!idToken) {
    throw new Error('Authentication token is required.');
  }
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw new Error('User is not authenticated.');
  }
}
