
'use client';

import type { Activity, Notification, Transaction, UserProfile } from '@/lib/types';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, increment, updateDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
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
                }
            }
        } catch (error) {
            console.error("Error processing referral code:", error);
            // Fail silently to not block user creation
        }
    }

    // Create new user's profile
    const newUserProfile: UserProfile = {
        uid: user.uid,
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
    };
    batch.set(userRef, newUserProfile);

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
        };
    }
    return null;
}

export async function uploadProfilePicture(file: File): Promise<string> {
    const user = getCurrentUser();
    // A standard path for all profile pictures for simplicity. This will overwrite the previous image.
    const filePath = `profile-pictures/${user.uid}/profile.jpg`;
    const storageRef = ref(storage, filePath);

    // Upload the file to Firebase Storage
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Add a unique query parameter to bust the browser's cache.
    const photoURL = `${downloadURL}&_v=${new Date().getTime()}`;

    // Update the user's profile in Firestore
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

// Simulate a secure, server-side configuration for ad rewards
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
        case 'g1': // Cube Runner
            return Math.floor(scorePayload); // Reward is the score
        case 'g3': // Puzzle Box
            return Math.max(5, 50 - scorePayload * 2); // scorePayload is moves
        case 'g4': // Memory Match
            return Math.max(5, 40 - scorePayload); // scorePayload is moves
        case 'g6': // Reaction Time
            return Math.max(1, 30 - Math.floor(scorePayload / 100)); // scorePayload is reactionTime in ms
        default:
            return 0; // No reward for unknown games
    }
};

const getGameTitle = (gameId: string): string => {
    const titles: { [key: string]: string } = {
        'g1': 'Cube Runner',
        'g3': 'Puzzle Box',
        'g4': 'Memory Match',
        'g5': 'Word Finder',
        'g6': 'Reaction Time',
    };
    return titles[gameId] || 'a game';
};

export async function claimGameReward(gameId: string, scorePayload: number): Promise<number> {
  const user = getCurrentUser();
  const reward = calculateGameReward(gameId, scorePayload);
  const gameTitle = getGameTitle(gameId);

  if (reward <= 0) {
    return 0;
  }
  
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
    type: 'Game Play',
    description: `Played '${gameTitle}'`,
    cubes_earned: reward,
    date: now,
  };
  batch.set(activityRef, newActivity);

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  const newTransaction: Omit<Transaction, 'id'> = {
    type: 'reward',
    description: `Reward from '${gameTitle}'`,
    amount: reward,
    date: now,
    status: 'completed',
  };
  batch.set(transactionRef, newTransaction);

  _createNotification(batch, user.uid, "Game Reward!", `You earned ${reward} Cubes for playing '${gameTitle}'.`);

  await batch.commit();
  
  return reward;
}


export async function claimDailyReward(): Promise<{ success: boolean; message: string }> {
  const user = getCurrentUser();
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    throw new Error("User profile not found, cannot claim reward.");
  }

  const profileData = docSnap.data();
  const userProfile: UserProfile = {
      uid: profileData.uid,
      adsenerId: profileData.adsenerId,
      email: profileData.email,
      displayName: profileData.displayName,
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
    if (!formattedId || !/^AC-[0-9]{6}[A-Z]$/.test(formattedId)) {
        return null;
    }
    const currentUser = auth.currentUser;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("adsenerId", "==", formattedId));
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return "User not found";
    }

    const userDoc = querySnapshot.docs[0];
    if (currentUser && currentUser.uid === userDoc.id) {
        return "You cannot send cubes to yourself.";
    }

    const userData = userDoc.data();
    return userData.displayName || 'Unnamed User';
}

export async function transferCubes(recipientAdsenerId: string, amount: number): Promise<{ success: boolean; message: string }> {
    const sender = getCurrentUser();
    const formattedRecipientId = recipientAdsenerId.trim().toUpperCase();

    if (amount <= 0) {
        return { success: false, message: "Transfer amount must be positive." };
    }

    const senderRef = doc(db, 'users', sender.uid);

    // Find recipient by their adsenerId (read BEFORE transaction)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("adsenerId", "==", formattedRecipientId));
    
    try {
        const recipientQuerySnapshot = await getDocs(q);

        if (recipientQuerySnapshot.empty) {
            throw new Error("Recipient user could not be found. Please check the User ID.");
        }
        
        const recipientDocSnapshot = recipientQuerySnapshot.docs[0];
        const recipientRef = recipientDocSnapshot.ref;

        if (sender.uid === recipientDocSnapshot.id) {
            return { success: false, message: "You cannot send cubes to yourself." };
        }

        await runTransaction(db, async (transaction) => {
            const senderDoc = await transaction.get(senderRef);
            const recipientDoc = await transaction.get(recipientRef); // Read recipient inside transaction

            if (!senderDoc.exists()) {
                throw new Error("Your user profile could not be found.");
            }
             if (!recipientDoc.exists()) {
                // This is a safety check, should not happen if query outside worked
                throw new Error("Recipient user could not be found.");
            }

            const senderData = senderDoc.data() as UserProfile;
            const recipientData = recipientDoc.data() as UserProfile;

            if (senderData.cubeBalance < amount) {
                throw new Error("Insufficient cube balance for this transfer.");
            }

            const now = new Date();

            // All writes happen after all reads
            transaction.update(senderRef, { cubeBalance: increment(-amount) });
            transaction.update(recipientRef, { cubeBalance: increment(amount) });

            // Create transaction log for sender
            const senderTransactionRef = doc(collection(db, 'users', sender.uid, 'transactions'));
            transaction.set(senderTransactionRef, {
                type: 'withdrawal',
                description: `Sent to ${recipientData.displayName || recipientData.adsenerId}`,
                amount: -amount,
                date: now,
                status: 'completed',
            });

            // Create transaction log for recipient
            const recipientTransactionRef = doc(collection(db, 'users', recipientDoc.id, 'transactions'));
            transaction.set(recipientTransactionRef, {
                type: 'deposit',
                description: `Received from ${senderData.displayName || senderData.adsenerId}`,
                amount: amount,
                date: now,
                status: 'completed',
            });

            // Create notification for sender
            const senderNotificationRef = doc(collection(db, 'users', sender.uid, 'notifications'));
            transaction.set(senderNotificationRef, {
                title: "Transfer Sent",
                description: `You successfully sent ${amount} Cubes to ${recipientData.displayName || recipientData.adsenerId}.`,
                date: now,
                read: false,
            });

            // Create notification for recipient
            const recipientNotificationRef = doc(collection(db, 'users', recipientDoc.id, 'notifications'));
            transaction.set(recipientNotificationRef, {
                title: "Cubes Received!",
                description: `You have received ${amount} Cubes from ${senderData.displayName || senderData.adsenerId}.`,
                date: now,
                read: false,
            });
        });
        
        return { success: true, message: `Successfully sent ${amount.toLocaleString()} cubes.` };

    } catch (error: any) {
        console.error("Cube transfer failed:", error);
        return { success: false, message: error.message || "An unexpected error occurred during the transfer." };
    }
}
