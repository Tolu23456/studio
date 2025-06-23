'use server';

import { db } from '@/lib/firebase';
import type { Activity, Transaction, UserProfile } from '@/lib/types';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, addDoc, query, orderBy, getDocs, limit, increment } from 'firebase/firestore';
import { isYesterday, startOfDay } from 'date-fns';

// Helper to check for permission error
const isPermissionError = (error: any) => error?.code === 'permission-denied';

export async function createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        cubeBalance: 0,
        totalEarned: 0,
        referrals: 0,
        loginStreak: 0,
        lastClaimedDate: null,
    };
    await setDoc(userRef, newUserProfile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                uid: data.uid,
                email: data.email,
                cubeBalance: data.cubeBalance,
                totalEarned: data.totalEarned,
                referrals: data.referrals,
                loginStreak: data.loginStreak || 0,
                lastClaimedDate: data.lastClaimedDate ? (data.lastClaimedDate as Timestamp).toDate() : null
            };
        }
        return null;
    } catch (error) {
        if (isPermissionError(error)) {
            console.warn(`Firestore permission denied for getUserProfile. Returning null. Please fix security rules.`);
            return null; // Suppress error and return empty state.
        }
        // Re-throw other errors
        throw error;
    }
}

export async function getActivities(uid: string, count: number = 6): Promise<Activity[]> {
  try {
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
  } catch(error) {
    if (isPermissionError(error)) {
        console.warn(`Firestore permission denied for getActivities. Returning []. Please fix security rules.`);
        return []; // Suppress error and return empty state.
    }
    throw error;
  }
}

export async function getTransactions(uid: string, count: number = 8): Promise<Transaction[]> {
  try {
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
  } catch (error) {
    if (isPermissionError(error)) {
        console.warn(`Firestore permission denied for getTransactions. Returning []. Please fix security rules.`);
        return []; // Suppress error and return empty state.
    }
    throw error;
  }
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

export async function claimDailyReward(uid: string): Promise<{ success: boolean; message: string }> {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    return { success: false, message: 'User not found.' };
  }

  // Manually construct profile to handle date conversion safely
  const profileData = docSnap.data();
  const userProfile: UserProfile = {
      uid: profileData.uid,
      email: profileData.email,
      cubeBalance: profileData.cubeBalance,
      totalEarned: profileData.totalEarned,
      referrals: profileData.referrals,
      loginStreak: profileData.loginStreak || 0,
      lastClaimedDate: profileData.lastClaimedDate ? (profileData.lastClaimedDate as Timestamp).toDate() : null,
  }

  const today = startOfDay(new Date());
  const lastClaimedDay = userProfile.lastClaimedDate ? startOfDay(userProfile.lastClaimedDate) : null;

  if (lastClaimedDay && lastClaimedDay.getTime() === today.getTime()) {
      return { success: false, message: 'You have already claimed your reward for today.' };
  }
  
  let newStreak = 1;
  // If last claim was yesterday, increment streak. Otherwise, it's a new streak.
  if (lastClaimedDay && isYesterday(lastClaimedDay)) {
    newStreak = (userProfile.loginStreak % 7) + 1; // Cycle streak from 1 to 7
  }

  const reward = 5 + (newStreak * 5); // e.g. Day 1: 10, Day 2: 15, ..., Day 7: 40
  const now = new Date();
  
  const batch = writeBatch(db);
  
  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
    loginStreak: newStreak,
    lastClaimedDate: now,
  });

  const activityRef = doc(collection(db, 'users', uid, 'activities'));
  batch.set(activityRef, {
    type: 'Daily Login',
    description: `Claimed Day ${newStreak} login bonus`,
    cubes_earned: reward,
    date: now,
  });

  const transactionRef = doc(collection(db, 'users', uid, 'transactions'));
  batch.set(transactionRef, {
    type: 'reward',
    description: `Daily Login Bonus - Day ${newStreak}`,
    amount: reward,
    date: now,
    status: 'completed',
  });
  
  await batch.commit();

  return { success: true, message: `You earned ${reward} Cubes!` };
}
