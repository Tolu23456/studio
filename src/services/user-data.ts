'use server';

import { db } from '@/lib/firebase';
import type { Activity, Transaction, UserProfile } from '@/lib/types';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, addDoc, query, orderBy, getDocs, limit, increment } from 'firebase/firestore';

export async function createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        cubeBalance: 0,
        totalEarned: 0,
        referrals: 0,
    };
    await setDoc(userRef, newUserProfile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
}

export async function getActivities(uid: string, count: number = 6): Promise<Activity[]> {
  const activitiesRef = collection(db, 'users', uid, 'activities');
  const q = query(activitiesRef, orderBy('date', 'desc'), limit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
    } as Activity;
  });
}

export async function getTransactions(uid: string, count: number = 8): Promise<Transaction[]> {
  const transactionsRef = collection(db, 'users', uid, 'transactions');
  const q = query(transactionsRef, orderBy('date', 'desc'), limit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
    } as Transaction;
  });
}

export async function claimAdReward(uid: string, reward: number, title: string): Promise<void> {
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const now = new Date();

  // 1. Update user profile with increments
  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  // 2. Create activity record
  const activityRef = doc(collection(db, 'users', uid, 'activities'));
  const newActivity = {
    type: 'Ad Watch',
    description: `Watched '${title}' ad`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  // 3. Create transaction record
  const transactionRef = doc(collection(db, 'users', uid, 'transactions'));
  const newTransaction = {
      type: 'reward',
      description: `Watched '${title}' ad`,
      amount: reward,
      date: now,
      status: 'completed',
  };
  batch.set(transactionRef, newTransaction);
  
  await batch.commit();
}
