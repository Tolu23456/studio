
'use server';

import type { Activity, Notification, Transaction, UserProfile } from '@/lib/types';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, increment, WriteBatch, getDocs, query, where } from 'firebase/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { isYesterday, startOfDay, startOfToday, subDays, format } from 'date-fns';
import { getAuthenticatedUid, verifyAdminAndGetUid, verifyTokenAndGetEmail } from './auth';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';


export async function createUserProfile(idToken: string): Promise<void> {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const { uid, email } = await verifyTokenAndGetEmail(idToken);
    const userRecord = await adminAuth.getUser(uid);
    const userRef = doc(adminDb, 'users', uid);
    const newUserProfile: UserProfile = {
        uid: uid,
        email: email || null,
        cubeBalance: 0,
        totalEarned: 0,
        referrals: 0,
        loginStreak: 0,
        lastClaimedDate: null,
        createdAt: new Date(userRecord.metadata.creationTime),
    };
    await setDoc(userRef, newUserProfile);
}

export async function getUserProfile(idToken: string): Promise<UserProfile | null> {
    const uid = await getAuthenticatedUid(idToken);
    const adminDb = getAdminDb();
    const userRef = doc(adminDb, 'users', uid);
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

function _createNotification(batch: WriteBatch, uid: string, title: string, description: string, adminDb: Firestore) {
    const notificationRef = doc(collection(adminDb, 'users', uid, 'notifications'));
    const newNotification: Omit<Notification, 'id'> = {
        title,
        description,
        date: new Date(),
        read: false,
    };
    batch.set(notificationRef, newNotification);
}

export async function claimAdReward(idToken: string, reward: number, title: string): Promise<void> {
  const uid = await getAuthenticatedUid(idToken);
  const adminDb = getAdminDb();
  const batch = writeBatch(adminDb);
  const userRef = doc(adminDb, 'users', uid);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(adminDb, 'users', uid, 'activities'));
  const newActivity: Omit<Activity, 'id'> = {
    type: 'Ad Watch',
    description: `Watched '${title}' ad`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  const transactionRef = doc(collection(adminDb, 'users', uid, 'transactions'));
  const newTransaction: Omit<Transaction, 'id'> = {
      type: 'reward',
      description: `Watched '${title}' ad`,
      amount: reward,
      date: now,
      status: 'completed',
  };
  batch.set(transactionRef, newTransaction);
  
  _createNotification(batch, uid, "Reward Claimed!", `You earned ${reward} Cubes for watching '${title}'.`, adminDb);

  await batch.commit();
}

export async function claimGameReward(idToken: string, reward: number, gameTitle: string): Promise<void> {
  const uid = await getAuthenticatedUid(idToken);
  const adminDb = getAdminDb();
  const batch = writeBatch(adminDb);
  const userRef = doc(adminDb, 'users', uid);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(adminDb, 'users', uid, 'activities'));
  const newActivity: Omit<Activity, 'id'> = {
    type: 'Game Play',
    description: `Played '${gameTitle}'`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  const transactionRef = doc(collection(adminDb, 'users', uid, 'transactions'));
  const newTransaction: Omit<Transaction, 'id'> = {
    type: 'reward',
    description: `Reward from '${gameTitle}'`,
    amount: reward,
    date: now,
    status: 'completed',
  };
  batch.set(transactionRef, newTransaction);

  _createNotification(batch, uid, "Game Reward!", `You earned ${reward} Cubes for playing '${gameTitle}'.`, adminDb);

  await batch.commit();
}


export async function claimDailyReward(idToken: string): Promise<{ success: boolean; message: string }> {
  const uid = await getAuthenticatedUid(idToken);
  const adminDb = getAdminDb();
  const userRef = doc(adminDb, 'users', uid);
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
  
  const batch = writeBatch(adminDb);
  
  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
    loginStreak: newStreak,
    lastClaimedDate: now,
  });

  const activityRef = doc(collection(adminDb, 'users', uid, 'activities'));
  batch.set(activityRef, {
    type: 'Daily Login',
    description: `Claimed Day ${newStreak} login bonus`,
    cubes_earned: reward,
    date: now,
  });

  const transactionRef = doc(collection(adminDb, 'users', uid, 'transactions'));
  batch.set(transactionRef, {
    type: 'reward',
    description: `Daily Login Bonus - Day ${newStreak}`,
    amount: reward,
    date: now,
    status: 'completed',
  });
  
  _createNotification(batch, uid, "Daily Reward Claimed!", `You earned ${reward} Cubes for your Day ${newStreak} login!`, adminDb);
  
  await batch.commit();

  return { success: true, message: `You earned ${reward} Cubes!` };
}

// Admin functions
export async function getAllUsers(idToken: string): Promise<UserProfile[]> {
  await verifyAdminAndGetUid(idToken);
  const adminDb = getAdminDb();
  const usersSnapshot = await getDocs(collection(adminDb, 'users'));
  const users: UserProfile[] = [];
  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      uid: data.uid,
      email: data.email,
      cubeBalance: data.cubeBalance,
      totalEarned: data.totalEarned,
      referrals: data.referrals,
      loginStreak: data.loginStreak || 0,
      lastClaimedDate: data.lastClaimedDate ? (data.lastClaimedDate as Timestamp).toDate() : null,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(doc.createTime!.seconds * 1000),
    });
  });
  return users;
}

export async function getAdminDashboardStats(idToken: string): Promise<{ totalUsers: number; totalCubesAwarded: number }> {
    await verifyAdminAndGetUid(idToken);
    const adminDb = getAdminDb();
    const usersSnapshot = await getDocs(collection(adminDb, 'users'));
    
    let totalCubesAwarded = 0;
    usersSnapshot.forEach((doc) => {
        const data = doc.data();
        totalCubesAwarded += data.totalEarned || 0;
    });

    return {
        totalUsers: usersSnapshot.size,
        totalCubesAwarded: totalCubesAwarded,
    };
}

export async function getUserGrowthStats(idToken: string): Promise<{ date: string; "New Users": number }[]> {
    await verifyAdminAndGetUid(idToken);
    const adminDb = getAdminDb();
    
    const today = startOfToday();
    const startDate = subDays(today, 6); // 7 days ago including today

    const usersRef = collection(adminDb, 'users');
    const q = query(usersRef, where('createdAt', '>=', startDate));
    const usersSnapshot = await getDocs(q);

    const stats: { [key: string]: number } = {};

    // Initialize last 7 days to ensure all days are present
    for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);
        stats[format(date, 'MMM d')] = 0;
    }

    usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = (data.createdAt as Timestamp).toDate();
        const dateKey = format(createdAt, 'MMM d');
        if (stats[dateKey] !== undefined) {
            stats[dateKey]++;
        }
    });

    return Object.entries(stats)
        .map(([date, count]) => ({ date, "New Users": count }))
        .reverse(); // To show oldest to newest for the chart
}

export async function sendNotificationToAllUsers(idToken: string, title: string, description: string): Promise<{ success: boolean; message: string }> {
    await verifyAdminAndGetUid(idToken);
    const adminDb = getAdminDb();
    const usersSnapshot = await getDocs(collection(adminDb, 'users'));

    if (usersSnapshot.empty) {
        return { success: false, message: "No users found." };
    }

    const userDocs = usersSnapshot.docs;
    let commitCount = 0;
    const now = new Date();

    // Firestore batches are limited to 500 operations.
    for (let i = 0; i < userDocs.length; i += 499) {
        const batch = writeBatch(adminDb);
        const chunk = userDocs.slice(i, i + 499);
        
        chunk.forEach(userDoc => {
            const uid = userDoc.id;
            const notificationRef = doc(collection(adminDb, 'users', uid, 'notifications'));
            const newNotification: Omit<Notification, 'id'> = {
                title,
                description,
                date: now,
                read: false,
            };
            batch.set(notificationRef, newNotification);
        });
        
        await batch.commit();
        commitCount++;
    }

    return { success: true, message: `Notification sent to ${usersSnapshot.size} users.` };
}
