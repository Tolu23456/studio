
'use server';

import { db } from '@/lib/firebase';
import type { Activity, Notification, Transaction, UserProfile } from '@/lib/types';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, addDoc, query, orderBy, getDocs, limit, increment, WriteBatch } from 'firebase/firestore';
import { isYesterday, startOfDay } from 'date-fns';

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

export async function getNotifications(uid: string, count: number = 5): Promise<Notification[]> {
  const notificationsRef = collection(db, 'users', uid, 'notifications');
  const q = query(notificationsRef, orderBy('date', 'desc'), limit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
    } as Notification;
  });
}

// Add an internal helper to create notifications within a batch
function _createNotification(batch: WriteBatch, uid: string, title: string, description: string) {
    const notificationRef = doc(collection(db, 'users', uid, 'notifications'));
    const newNotification = {
        title,
        description,
        date: new Date(),
        read: false,
    };
    batch.set(notificationRef, newNotification);
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
  
  // 4. Create notification
  _createNotification(batch, uid, "Reward Claimed!", `You earned ${reward} Cubes for watching '${title}'.`);

  await batch.commit();
}

export async function claimGameReward(uid: string, reward: number, gameTitle: string): Promise<void> {
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(db, 'users', uid, 'activities'));
  const newActivity = {
    type: 'Game Play',
    description: `Played '${gameTitle}'`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  const transactionRef = doc(collection(db, 'users', uid, 'transactions'));
  const newTransaction = {
    type: 'reward',
    description: `Reward from '${gameTitle}'`,
    amount: reward,
    date: now,
    status: 'completed',
  };
  batch.set(transactionRef, newTransaction);

  _createNotification(batch, uid, "Game Reward!", `You earned ${reward} Cubes for playing '${gameTitle}'.`);

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
    newStreak = userProfile.loginStreak + 1;
  }

  const reward = 5 + (newStreak * 5); // e.g. Day 1: 10, Day 2: 15,...
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
  
  _createNotification(batch, uid, "Daily Reward Claimed!", `You earned ${reward} Cubes for your Day ${newStreak} login!`);
  
  await batch.commit();

  return { success: true, message: `You earned ${reward} Cubes!` };
}
