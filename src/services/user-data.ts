
'use client';

import type { Activity, AdminUserView, Notification, PlatformSettings, Transaction, UserProfile } from '@/lib/types';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, increment, updateDoc, runTransaction, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { isYesterday, startOfDay } from 'date-fns';
import { db, auth, storage } from '@/lib/firebase';

const getCurrentUser = (): User => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not authenticated.');
    }
    return user;
};

// In a production app, you would want to ensure this ID is unique by checking the database.
// For this prototype, we'll assume collisions are unlikely.
export function generateAdsenerId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = 'AC-';
    for (let i = 0; i < 6; i++) {
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

export async function createUserProfile(user: User, displayName: string, referralCode?: string): Promise<void> {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', user.uid);
    const now = new Date();
    
    let startingBalance = 0;

    // Handle referral if code is provided
    if (referralCode) {
        const usersRef = collection(db, 'users');
        // Referral codes are now the adsenerId, which are uppercase
        const q = query(usersRef, where("adsenerId", "==", referralCode.trim().toUpperCase()));
        
        try {
            const querySnapshot = await getDocs(q);

            // Check if referrer exists and is not the new user themselves
            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                if (referrerDoc.id !== user.uid) {
                    const referrerRef = referrerDoc.ref;
                    const referralBonus = 100;
                    const referrerReward = 200;
                    startingBalance = referralBonus;
    
                    // Update referrer's profile
                    batch.update(referrerRef, {
                        referrals: increment(1),
                        cubeBalance: increment(referrerReward),
                        totalEarned: increment(referrerReward),
                    });
    
                    // Add activity for referrer
                    const referrerActivityRef = doc(collection(db, 'users', referrerDoc.id, 'activities'));
                    batch.set(referrerActivityRef, {
                        type: 'Referral Bonus',
                        description: `You referred a new user: ${displayName}`,
                        cubes_earned: referrerReward,
                        date: now,
                    });
    
                    // Add transaction for referrer
                    const referrerTransactionRef = doc(collection(db, 'users', referrerDoc.id, 'transactions'));
                    batch.set(referrerTransactionRef, {
                        type: 'reward',
                        description: `Bonus for referring ${displayName}`,
                        amount: referrerReward,
                        date: now,
                        status: 'completed',
                    });
                    
                    // Add notification for referrer
                    _createNotification(batch, referrerDoc.id, "Referral Success!", `You earned ${referrerReward} Cubes for referring ${displayName}!`);

                    // Add the new user to the referrer's 'referredUsers' subcollection
                    const referredUserDocRef = doc(db, 'users', referrerDoc.id, 'referredUsers', user.uid);
                    batch.set(referredUserDocRef, {
                        displayName: displayName,
                        createdAt: now,
                    });
                }
            }
        } catch (error) {
            console.error("Error processing referral code:", error);
            // Fail silently to not block user creation
        }
    }

    // Create new user's profile
    const newUserProfile: Omit<UserProfile, 'uid'> = {
        adsenerId: generateAdsenerId(),
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL || '',
        cubeBalance: startingBalance,
        totalEarned: startingBalance,
        referrals: 0,
        loginStreak: 0,
        lastClaimedDate: null,
        createdAt: new Date(user.metadata.creationTime || Date.now()),
        status: 'Active',
        isAdmin: false,
    };
    batch.set(userRef, { uid: user.uid, ...newUserProfile});

    // If there was a bonus, log it for the new user
    if (startingBalance > 0) {
        // Add activity for new user
        const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
        batch.set(activityRef, {
            type: 'Referral Bonus',
            description: `Welcome bonus for using a referral code.`,
            cubes_earned: startingBalance,
            date: now,
        });

        // Add transaction for new user
        const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
        batch.set(transactionRef, {
            type: 'reward',
            description: 'Welcome bonus from referral',
            amount: startingBalance,
            date: now,
            status: 'completed',
        });
        
        // Add notification for new user
        _createNotification(batch, user.uid, "Welcome Bonus!", `You received ${startingBalance} Cubes for using a referral code!`);
    }

    await batch.commit();
}


export async function getUserProfile(user: User): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            uid: data.uid,
            adsenerId: data.adsenerId,
            email: data.email,
            displayName: data.displayName || data.email,
            photoURL: data.photoURL,
            cubeBalance: data.cubeBalance,
            totalEarned: data.totalEarned,
            referrals: data.referrals,
            loginStreak: data.loginStreak || 0,
            lastClaimedDate: data.lastClaimedDate ? (data.lastClaimedDate as Timestamp).toDate() : null,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(docSnap.createTime!.seconds * 1000),
            status: data.status || 'Active',
            isAdmin: data.isAdmin || false,
        };
    }
    return null;
}

export async function getAllUsersForAdmin(): Promise<AdminUserView[]> {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const users: AdminUserView[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            photoURL: data.photoURL,
            displayName: data.displayName,
            email: data.email,
            status: data.status || 'Active',
            createdAt: (data.createdAt as Timestamp).toDate(),
            isAdmin: data.isAdmin || false,
            cubeBalance: data.cubeBalance || 0,
            totalEarned: data.totalEarned || 0,
        };
    });
    return users;
}


export async function uploadProfilePicture(file: File): Promise<string> {
    const user = getCurrentUser();
    const filePath = `profile-pictures/${user.uid}/profile.jpg`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    
    const downloadURL = await getDownloadURL(storageRef);
    const photoURL = `${downloadURL}&_v=${new Date().getTime()}`;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { photoURL });
    
    return photoURL;
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

export async function createSimpleNotification(title: string, description: string): Promise<void> {
    const user = getCurrentUser();
    const notificationRef = doc(collection(db, 'users', user.uid, 'notifications'));
    const newNotification: Omit<Notification, 'id'> = {
        title,
        description,
        date: new Date(),
        read: false,
    };
    await setDoc(notificationRef, newNotification);
}

const TRUSTED_AD_CONFIG: { [key: string]: { reward: number; title: string } } = {
  "1": { reward: 15, title: "Explore the New TechGadget Pro" },
  "2": { reward: 12, title: "Quick & Healthy Snack Ideas" },
  "3": { reward: 20, title: "Adventure Awaits: Travel Deals" },
  "4": { reward: 8, title: "Mobile Gaming Madness" },
};

export async function claimAdReward(adId: string): Promise<void> {
  const user = getCurrentUser();
  const adConfig = TRUSTED_AD_CONFIG[adId];

  if (!adConfig) {
    throw new Error("Invalid ad ID or ad not found.");
  }
  
  const { reward, title } = adConfig;
  
  const userRef = doc(db, 'users', user.uid);

  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    throw new Error("User profile not found, cannot claim reward.");
  }

  const batch = writeBatch(db);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
  const newActivity: Omit<Activity, 'id'> = {
    type: 'Ad Watch',
    description: `Watched '${title}' ad`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  const newTransaction: Omit<Transaction, 'id'> = {
      type: 'reward',
      description: `Watched '${title}' ad`,
      amount: reward,
      date: now,
      status: 'completed',
  };
  batch.set(transactionRef, newTransaction);
  
  _createNotification(batch, user.uid, "Reward Claimed!", `You earned ${reward} Cubes for watching '${title}'.`);

  await batch.commit();
}

const calculateGameReward = (gameId: string, scorePayload: number): number => {
    switch (gameId) {
        case 'g1': case 'g2': case 'g7':
            return scorePayload;
        case 'g3': case 'g8': case 'g9': case 'g10':
            return Math.max(5, 50 - scorePayload);
        case 'g4':
            return Math.max(5, 40 - scorePayload);
        case 'g5': case 'g6':
            return Math.max(1, 30 - Math.floor(scorePayload / 100));
        default:
            return 0;
    }
};

const getGameTitle = (gameId: string): string => {
    const titles: { [key: string]: string } = {
        'g1': 'One Tap Dash', 'g2': 'Shadow Jump', 'g3': 'Don’t Touch the Red', 'g4': 'Quick Flip',
        'g5': 'Laser Reflex', 'g6': 'Tiny Tapper', 'g7': 'Stack Tower', 'g8': 'Speed Type',
        'g9': 'Reverse Swipe', 'g10': 'Tilt Maze',
    };
    return titles[gameId] || 'a game';
};

export async function claimGameReward(gameId: string, scorePayload: number): Promise<number> {
  const user = getCurrentUser();
  const reward = calculateGameReward(gameId, scorePayload);
  const gameTitle = getGameTitle(gameId);

  if (reward <= 0) return 0;
  
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) throw new Error("User profile not found.");

  const batch = writeBatch(db);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
  batch.set(activityRef, {
    type: 'Game Play',
    description: `Played '${gameTitle}'`,
    cubes_earned: reward,
    date: now,
  });

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  batch.set(transactionRef, {
    type: 'reward',
    description: `Reward from '${gameTitle}'`,
    amount: reward,
    date: now,
    status: 'completed',
  });

  _createNotification(batch, user.uid, "Game Reward!", `You earned ${reward} Cubes for playing '${gameTitle}'.`);
  await batch.commit();
  return reward;
}


export async function claimDailyReward(): Promise<{ success: boolean; message: string }> {
  const user = getCurrentUser();
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) throw new Error("User profile not found.");

  const userProfile = docSnap.data() as UserProfile;
  const today = startOfDay(new Date());
  const lastClaimedDay = userProfile.lastClaimedDate ? startOfDay((userProfile.lastClaimedDate as Timestamp).toDate()) : null;

  if (lastClaimedDay && lastClaimedDay.getTime() === today.getTime()) {
      return { success: false, message: 'You have already claimed your reward for today.' };
  }
  
  const newStreak = (lastClaimedDay && isYesterday(lastClaimedDay)) ? userProfile.loginStreak + 1 : 1;
  const reward = 5 + (newStreak * 5);
  const now = new Date();
  
  const batch = writeBatch(db);
  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
    loginStreak: newStreak,
    lastClaimedDate: now,
  });

  const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
  batch.set(activityRef, {
    type: 'Daily Login',
    description: `Claimed Day ${newStreak} login bonus`,
    cubes_earned: reward,
    date: now,
  });

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  batch.set(transactionRef, {
    type: 'reward',
    description: `Daily Login Bonus - Day ${newStreak}`,
    amount: reward,
    date: now,
    status: 'completed',
  });
  
  _createNotification(batch, user.uid, "Daily Reward Claimed!", `You earned ${reward} Cubes for your Day ${newStreak} login!`);
  await batch.commit();
  return { success: true, message: `You earned ${reward} Cubes!` };
}

export async function fetchRecipientDisplayName(adsenerId: string): Promise<string | null> {
    const formattedId = adsenerId.trim().toUpperCase();
    if (!formattedId || !/^AC-[0-9]{6}[A-Z]$/.test(formattedId)) return null;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("adsenerId", "==", formattedId));
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return "User not found";

    const userDoc = querySnapshot.docs[0];
    if (auth.currentUser && auth.currentUser.uid === userDoc.id) return "You cannot send cubes to yourself.";

    return userDoc.data().displayName || 'Unnamed User';
}

export async function transferCubes(recipientAdsenerId: string, amount: number): Promise<{ success: boolean; message: string }> {
    const sender = getCurrentUser();
    if (amount <= 0) return { success: false, message: "Transfer amount must be positive." };

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("adsenerId", "==", recipientAdsenerId.trim().toUpperCase()));
    
    try {
        const recipientQuerySnapshot = await getDocs(q);
        if (recipientQuerySnapshot.empty) throw new Error("Recipient user could not be found.");
        
        const recipientDoc = recipientQuerySnapshot.docs[0];
        if (sender.uid === recipientDoc.id) return { success: false, message: "You cannot send cubes to yourself." };

        await runTransaction(db, async (transaction) => {
            const senderRef = doc(db, 'users', sender.uid);
            const senderDoc = await transaction.get(senderRef);
            if (!senderDoc.exists()) throw new Error("Your user profile could not be found.");
            
            const senderData = senderDoc.data() as UserProfile;
            if (senderData.cubeBalance < amount) throw new Error("Insufficient cube balance.");

            const now = new Date();
            transaction.update(senderRef, { cubeBalance: increment(-amount) });
            transaction.update(recipientDoc.ref, { cubeBalance: increment(amount) });

            const senderTransactionRef = doc(collection(db, 'users', sender.uid, 'transactions'));
            transaction.set(senderTransactionRef, { type: 'withdrawal', description: `Sent to ${recipientDoc.data().displayName}`, amount: -amount, date: now, status: 'completed' });
            
            const recipientTransactionRef = doc(collection(db, 'users', recipientDoc.id, 'transactions'));
            transaction.set(recipientTransactionRef, { type: 'deposit', description: `Received from ${senderData.displayName}`, amount: amount, date: now, status: 'completed' });
        });
        
        return { success: true, message: `Successfully sent ${amount.toLocaleString()} cubes.` };

    } catch (error: any) {
        console.error("Cube transfer failed:", error);
        return { success: false, message: error.message || "An unexpected error occurred." };
    }
}

// Admin Functions
export async function updateUserStatus(uid: string, status: 'Active' | 'Disabled'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { status });
}

export async function updateUserProfileAdmin(uid: string, data: { displayName: string; isAdmin: boolean; }): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
    const settingsRef = doc(db, 'platform_settings', 'config');
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
        return docSnap.data() as PlatformSettings;
    }

    const defaultSettings: PlatformSettings = {
        id: 'config',
        allowNewRegistrations: true,
        requireEmailVerification: true,
        welcomeBonus: 50,
        globalAdRewardMultiplier: 1.0,
        globalGameRewardMultiplier: 1.0,
        maintenanceMode: false,
    };
    await setDoc(settingsRef, defaultSettings);
    return defaultSettings;
}

export async function updatePlatformSettings(settings: Partial<Omit<PlatformSettings, 'id'>>): Promise<void> {
    const settingsRef = doc(db, 'platform_settings', 'config');
    await updateDoc(settingsRef, settings);
}

export async function sendNotificationToAllUsers(title: string, description: string): Promise<{ successCount: number; errorCount: number }> {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    if (querySnapshot.empty) return { successCount: 0, errorCount: 0 };

    let successCount = 0;
    let errorCount = 0;
    const chunks = [];
    for (let i = 0; i < querySnapshot.docs.length; i += 499) {
        chunks.push(querySnapshot.docs.slice(i, i + 499));
    }

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(userDoc => {
            const notificationRef = doc(collection(db, 'users', userDoc.id, 'notifications'));
            batch.set(notificationRef, { title, description, date: new Date(), read: false });
        });
        
        try {
            await batch.commit();
            successCount += chunk.length;
        } catch (e) {
            console.error("Failed to commit a batch of notifications:", e);
            errorCount += chunk.length;
        }
    }
    return { successCount, errorCount };
}
