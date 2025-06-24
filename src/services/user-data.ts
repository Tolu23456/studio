
'use client';

import type { Activity, Notification, Transaction, UserProfile } from '@/lib/types';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, increment } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { isYesterday, startOfDay } from 'date-fns';
import { db, auth } from '@/lib/firebase';

const getCurrentUid = (): string => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not authenticated.');
    }
    return user.uid;
};

export async function createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        cubeBalance: 0,
        totalEarned: 0,
        referrals: 0,
        loginStreak: 0,
        lastClaimedDate: null,
        createdAt: new Date(user.metadata.creationTime || Date.now()),
    };
    await setDoc(userRef, newUserProfile);
}

export async function getUserProfile(user: User): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', user.uid);
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
            lastClaimedDate: data.lastClaimedDate ? (data.lastClaimedDate as Timestamp).toDate() : null,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(docSnap.createTime!.seconds * 1000),
        };
    }
    return null;
}

function _createNotification(batch: any, uid: string, title: string, description: string) {
    const notificationRef = doc(collection(db, 'users', uid, 'notifications'));
    const newNotification: Omit<Notification, 'id'> = {
        title,
        description,
        date: new Date(),
        read: false,
    };
    batch.set(notificationRef, newNotification);
}

export async function claimAdReward(reward: number, title: string): Promise<void> {
  const uid = getCurrentUid();
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(db, 'users', uid, 'activities'));
  const newActivity: Omit<Activity, 'id'> = {
    type: 'Ad Watch',
    description: `Watched '${title}' ad`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  const transactionRef = doc(collection(db, 'users', uid, 'transactions'));
  const newTransaction: Omit<Transaction, 'id'> = {
      type: 'reward',
      description: `Watched '${title}' ad`,
      amount: reward,
      date: now,
      status: 'completed',
  };
  batch.set(transactionRef, newTransaction);
  
  _createNotification(batch, uid, "Reward Claimed!", `You earned ${reward} Cubes for watching '${title}'.`);

  await batch.commit();
}

export async function claimGameReward(reward: number, gameTitle: string): Promise<void> {
  const uid = getCurrentUid();
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(db, 'users', uid, 'activities'));
  const newActivity: Omit<Activity, 'id'> = {
    type: 'Game Play',
    description: `Played '${gameTitle}'`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  const transactionRef = doc(collection(db, 'users', uid, 'transactions'));
  const newTransaction: Omit<Transaction, 'id'> = {
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


export async function claimDailyReward(): Promise<{ success: boolean; message: string }> {
  const uid = getCurrentUid();
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    return { success: false, message: 'User not found.' };
  }

  const profileData = docSnap.data();
  const userProfile: UserProfile = {
      uid: profileData.uid,
      email: profileData.email,
      cubeBalance: profileData.cubeBalance,
      totalEarned: profileData.totalEarned,
      referrals: profileData.referrals,
      loginStreak: profileData.loginStreak || 0,
      lastClaimedDate: profileData.lastClaimedDate ? (profileData.lastClaimedDate as Timestamp).toDate() : null,
      createdAt: profileData.createdAt ? (profileData.createdAt as Timestamp).toDate() : new Date(docSnap.createTime!.seconds * 1000),
  }

  const today = startOfDay(new Date());
  const lastClaimedDay = userProfile.lastClaimedDate ? startOfDay(userProfile.lastClaimedDate) : null;

  if (lastClaimedDay && lastClaimedDay.getTime() === today.getTime()) {
      return { success: false, message: 'You have already claimed your reward for today.' };
  }
  
  let newStreak = 1;
  if (lastClaimedDay && isYesterday(lastClaimedDay)) {
    newStreak = userProfile.loginStreak + 1;
  }

  const reward = 5 + (newStreak * 5);
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
