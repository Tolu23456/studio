
'use client';

import type { Activity, AdminUserView, Notification, PlatformSettings, Transaction, UserProfile, Game, Ad, SupportTicket, SentNotificationLog } from '@/lib/types';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, increment, updateDoc, runTransaction, query, where, getDocs, orderBy, deleteDoc, addDoc, collectionGroup, serverTimestamp, limit } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { isYesterday, startOfDay, isToday, format } from 'date-fns';
import { db, auth } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';


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

const _replacePlaceholders = (template: string, userProfile: UserProfile): string => {
    const now = new Date();
    return template
        .replace(/{{username}}/g, userProfile.displayName)
        .replace(/{{email}}/g, userProfile.email || '')
        .replace(/{{adsenerId}}/g, userProfile.adsenerId)
        .replace(/{{cubeBalance}}/g, userProfile.cubeBalance.toLocaleString())
        .replace(/{{date}}/g, format(now, 'PPP'))
        .replace(/{{time}}/g, format(now, 'p'));
};

function _createNotificationInBatch(batch: any, uid: string, title: string, description: string, isHtml: boolean = false) {
    const notificationRef = doc(collection(db, 'users', uid, 'notifications'));
    const newNotification: Omit<Notification, 'id'> = {
        title,
        description,
        date: new Date(),
        read: false,
        isHtml,
    };
    batch.set(notificationRef, newNotification);
}

const uploadImageIfPresent = async (dataUri: string, path: string): Promise<string> => {
    if (typeof dataUri === 'string' && dataUri.startsWith('data:image')) {
        const storage = getStorage();
        // Create a unique file name
        const fileName = `${new Date().getTime()}-${Math.random().toString(36).substring(2, 8)}`;
        const storageRef = ref(storage, `${path}/${fileName}`);
        const uploadResult = await uploadString(storageRef, dataUri, 'data_url');
        return await getDownloadURL(uploadResult.ref);
    }
    return dataUri; // Return original if it's not a data URI (already a URL)
};

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
                        totalReferralEarnings: increment(referrerReward),
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
                    _createNotificationInBatch(batch, referrerDoc.id, "Referral Success!", `You earned ${referrerReward} Cubes for referring ${displayName}!`);

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
    const newUserProfile: Omit<UserProfile, 'uid' | 'status' | 'isAdmin' | 'showReenableWarning'> = {
        adsenerId: generateAdsenerId(),
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL || '',
        cubeBalance: startingBalance,
        totalEarned: startingBalance,
        referrals: 0,
        totalReferralEarnings: 0,
        loginStreak: 0,
        lastClaimedDate: null,
        createdAt: new Date(user.metadata.creationTime || Date.now()),
        notificationPreferences: {
            rewardNotifications: true,
            promotionalUpdates: true,
        },
        disableCount: 0,
        claimedAdIds: [],
        adResetTimestamp: null,
    };
    batch.set(userRef, { 
        uid: user.uid, 
        ...newUserProfile,
        status: 'Active',
        isAdmin: false,
    });

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
        _createNotificationInBatch(batch, user.uid, "Welcome Bonus!", `You received ${startingBalance} Cubes for using a referral code!`);
    }

    await batch.commit();
}


export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
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
            totalReferralEarnings: data.totalReferralEarnings || 0,
            loginStreak: data.loginStreak || 0,
            lastClaimedDate: data.lastClaimedDate ? (data.lastClaimedDate as Timestamp).toDate() : null,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(docSnap.createTime!.seconds * 1000),
            status: data.status || 'Active',
            notificationPreferences: data.notificationPreferences || { rewardNotifications: true, promotionalUpdates: true },
            isAdmin: data.isAdmin || false,
            disableCount: data.disableCount || 0,
            showReenableWarning: data.showReenableWarning || false,
            adResetTimestamp: data.adResetTimestamp ? (data.adResetTimestamp as Timestamp).toDate() : null,
            claimedAdIds: data.claimedAdIds || [],
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
            disableCount: data.disableCount || 0,
        };
    });
    return users;
}

export async function updateCurrentUserProfile(data: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'notificationPreferences'>>): Promise<void> {
    const user = getCurrentUser();
    const userRef = doc(db, 'users', user.uid);
    let finalData = { ...data };

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User profile not found.");
            }
            const userProfile = userDoc.data() as UserProfile;

            // Handle display name change fee
            if (finalData.displayName && finalData.displayName !== userProfile.displayName && !userProfile.isAdmin) {
                const fee = 1000;
                if (userProfile.cubeBalance < fee) {
                    throw new Error(`Insufficient funds. Changing your name costs ${fee.toLocaleString()} Cubes.`);
                }
                
                // Deduct fee and log transaction
                transaction.update(userRef, { cubeBalance: increment(-fee) });
                
                const feeTransactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
                transaction.set(feeTransactionRef, {
                    type: 'purchase',
                    description: 'Display name change fee',
                    amount: -fee,
                    date: new Date(),
                    status: 'completed',
                });
                
                // Add fee to platform collection
                const settingsRef = doc(db, 'platform_settings', 'config');
                transaction.update(settingsRef, { totalFeesCollected: increment(fee) });
            }

            // Handle photoURL upload
            if (finalData.photoURL && finalData.photoURL.startsWith('data:image')) {
                finalData.photoURL = await uploadImageIfPresent(finalData.photoURL, `profile-pictures/${user.uid}`);
            }

            const { cubeBalance, ...restOfFinalData } = finalData as any;
            transaction.update(userRef, restOfFinalData);
        });
    } catch (error) {
        console.error("Failed to update profile in transaction:", error);
        throw error;
    }
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

export async function claimAdReward(adId: string): Promise<void> {
  const user = getCurrentUser();
  const userRef = doc(db, 'users', user.uid);
  const adRef = doc(db, 'ads', adId);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const adDoc = await transaction.get(adRef);
      const settingsDoc = await getPlatformSettings(); // This is not transactional but ok for settings

      if (!userDoc.exists()) throw new Error("User profile not found.");
      if (!adDoc.exists()) throw new Error("Ad not found.");
      
      const userProfile = userDoc.data() as UserProfile;
      const adData = adDoc.data() as Ad;
      
      const today = startOfDay(new Date());
      const adResetDate = userProfile.adResetTimestamp ? startOfDay((userProfile.adResetTimestamp as any).toDate()) : null;

      let claimedIds = userProfile.claimedAdIds || [];

      if (!adResetDate || !isToday(adResetDate)) {
        // It's a new day, reset the claims
        claimedIds = [];
      }

      if (claimedIds.includes(adId)) {
        throw new Error("Ad already claimed today. Please try again tomorrow.");
      }

      // If we're here, the claim is valid.
      const reward = Math.round(adData.reward * settingsDoc.globalAdRewardMultiplier);
      const { title } = adData;
      const now = new Date();
      
      const newClaimedIds = [...claimedIds, adId];

      transaction.update(userRef, {
        cubeBalance: increment(reward),
        totalEarned: increment(reward),
        claimedAdIds: newClaimedIds,
        adResetTimestamp: now,
      });

      const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
      transaction.set(activityRef, {
        type: 'Ad Watch',
        description: `Watched '${title}' ad`,
        cubes_earned: reward,
        date: now,
      });

      const transactionLogRef = doc(collection(db, 'users', user.uid, 'transactions'));
      transaction.set(transactionLogRef, {
          type: 'reward',
          description: `Watched '${title}' ad`,
          amount: reward,
          date: now,
          status: 'completed',
      });
      
      const notificationRef = doc(collection(db, 'users', user.uid, 'notifications'));
      transaction.set(notificationRef, {
          title: "Reward Claimed!",
          description: `You earned ${reward} Cubes for watching '${title}'.`,
          date: now,
          read: false,
      });
    });
  } catch (error) {
    console.error("Failed to claim ad reward in transaction:", error);
    // Re-throw the error so the calling component can handle it (e.g., show a toast)
    throw error;
  }
}

const calculateGameScore = (gameId: string, scorePayload: number): number => {
    // This function converts different performance metrics (like moves, time) into a unified "score".
    // A higher return value is always better.
    switch (gameId) {
        // Cube Runner games: score is direct. Higher is better.
        case 'g1': case 'g5': case 'g8':
            // Cap score to prevent ridiculously high submissions.
            return Math.min(scorePayload, 100);

        // Memory Match: fewer moves is better.
        case 'g2':
            if (scorePayload < 6) return 0; // Impossible score for a 12-card game (6 pairs)
            return Math.max(0, 50 - scorePayload); // Base score decreases with more moves.

        // Puzzle Box: fewer moves is better.
        case 'g3':
            if (scorePayload < 1) return 0; // Impossible score
            return Math.max(0, 40 - scorePayload); // Reward diminishes with more moves

        // Reaction Time: lower time (ms) is better.
        case 'g4': case 'g7':
            if (scorePayload < 100) return 0; // Impossible reaction time
            if (scorePayload > 1000) return 5; // Participation score
            return Math.max(0, 50 - Math.floor(scorePayload / 20));

        // Dot Connect: fewer moves is better (4 pairs are generated).
        case 'g6':
            if (scorePayload < 4) return 0; // Impossible score
            return Math.max(0, 40 - (scorePayload - 4) * 2);
        
        // Puzzle Block: higher score is better
        case 'g9':
            // Convert raw game score into a more balanced base score for rewards.
            // A raw score of 100 translates to a base score of 20.
            return Math.round(Math.max(0, Math.min(scorePayload, 2000)) / 5);

        default:
             // A generic score for any other game, prevents giving huge rewards for unknown game IDs.
             return Math.max(0, Math.min(scorePayload, 50));
    }
};

export async function claimGameReward(gameId: string, scorePayload: number): Promise<number> {
  const user = getCurrentUser();
  const settings = await getPlatformSettings();
  
  // New scoring logic
  const baseScore = calculateGameScore(gameId, scorePayload);
  const finalReward = Math.round(baseScore * 2 * settings.globalGameRewardMultiplier);
  
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  if (!gameSnap.exists()) throw new Error("Game not found.");
  const gameTitle = gameSnap.data().title || 'a game';

  if (finalReward <= 0) {
      await createSimpleNotification(
        `'${gameTitle}' Complete`, 
        `You didn't earn any Cubes this time. Better luck next time!`
      );
      return 0;
  }
  
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) throw new Error("User profile not found.");

  const batch = writeBatch(db);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(finalReward),
    totalEarned: increment(finalReward),
  });

  const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
  batch.set(activityRef, {
    type: 'Game Play',
    description: `Played '${gameTitle}' and scored ${scorePayload}`,
    cubes_earned: finalReward,
    date: now,
  });

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  batch.set(transactionRef, {
    type: 'reward',
    description: `Reward from '${gameTitle}' (Score: ${scorePayload})`,
    amount: finalReward,
    date: now,
    status: 'completed',
  });

  _createNotificationInBatch(batch, user.uid, "Game Reward!", `You earned ${finalReward} Cubes for playing '${gameTitle}'.`);
  await batch.commit();
  return finalReward;
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
  const isStreakBonusDay = newStreak % 7 === 0;
  const baseReward = 5 + (newStreak * 5);
  const finalReward = isStreakBonusDay ? baseReward + 50 : baseReward; // 50 cube bonus on 7th day
  const now = new Date();
  
  const batch = writeBatch(db);
  batch.update(userRef, {
    cubeBalance: increment(finalReward),
    totalEarned: increment(finalReward),
    loginStreak: newStreak,
    lastClaimedDate: now,
  });

  const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
  batch.set(activityRef, {
    type: 'Daily Login',
    description: `Claimed Day ${newStreak} login bonus` + (isStreakBonusDay ? ' (STREAK BONUS!)' : ''),
    cubes_earned: finalReward,
    date: now,
  });

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  batch.set(transactionRef, {
    type: 'reward',
    description: `Daily Login Bonus - Day ${newStreak}` + (isStreakBonusDay ? ' (STREAK BONUS!)' : ''),
    amount: finalReward,
    date: now,
    status: 'completed',
  });
  
  const notificationTitle = isStreakBonusDay ? "STREAK BONUS!" : "Daily Reward Claimed!";
  const notificationDesc = `You earned ${finalReward} Cubes for your Day ${newStreak} login!`;
  _createNotificationInBatch(batch, user.uid, notificationTitle, notificationDesc);

  await batch.commit();
  return { success: true, message: `You earned ${finalReward} Cubes!` };
}

export async function fetchRecipientDisplayName(adsenerId: string): Promise<{ displayName: string | null; photoURL: string | null; error?: string }> {
    const formattedId = adsenerId.trim().toUpperCase();
    if (!formattedId || !/^AC-[0-9]{6}[A-Z]$/.test(formattedId)) {
        return { displayName: null, photoURL: null };
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("adsenerId", "==", formattedId));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return { displayName: null, photoURL: null, error: "User not found" };
        }

        const userDoc = querySnapshot.docs[0];
        if (auth.currentUser && auth.currentUser.uid === userDoc.id) {
            return { displayName: null, photoURL: null, error: "You cannot send cubes to yourself." };
        }
        
        const data = userDoc.data();
        return { 
            displayName: data.displayName || 'Unnamed User',
            photoURL: data.photoURL || null
        };
    } catch (e) {
        console.error("Error fetching recipient display name:", e);
        return { displayName: null, photoURL: null, error: "An error occurred while fetching user data." };
    }
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

        const settings = await getPlatformSettings();
        const feePercentage = settings.transferFeePercentage || 0;
        const feeAmount = Math.ceil(amount * (feePercentage / 100));
        const totalDeduction = amount + feeAmount;

        await runTransaction(db, async (transaction) => {
            const senderRef = doc(db, 'users', sender.uid);
            const senderDoc = await transaction.get(senderRef);
            if (!senderDoc.exists()) throw new Error("Your user profile could not be found.");
            
            const senderData = senderDoc.data() as UserProfile;
            if (senderData.cubeBalance < totalDeduction) throw new Error(`Insufficient balance. You need ${totalDeduction.toLocaleString()} Cubes (including a ${feeAmount.toLocaleString()} Cube fee).`);

            const now = new Date();
            
            // 1. Update sender and recipient balances
            transaction.update(senderRef, { cubeBalance: increment(-totalDeduction) });
            transaction.update(recipientDoc.ref, { cubeBalance: increment(amount) });
            
            // 2. Update platform fee collection
            if (feeAmount > 0) {
                const settingsRef = doc(db, 'platform_settings', 'config');
                transaction.update(settingsRef, { totalFeesCollected: increment(feeAmount) });
            }

            // 3. Create transaction logs for both users
            const senderTransactionRef = doc(collection(db, 'users', sender.uid, 'transactions'));
            transaction.set(senderTransactionRef, { type: 'withdrawal', description: `Sent to ${recipientDoc.data().displayName}`, amount: -amount, date: now, status: 'completed' });
            if(feeAmount > 0) {
                 const senderFeeTransactionRef = doc(collection(db, 'users', sender.uid, 'transactions'));
                 transaction.set(senderFeeTransactionRef, { type: 'withdrawal', description: `Fee for sending to ${recipientDoc.data().displayName}`, amount: -feeAmount, date: now, status: 'completed' });
            }
            
            const recipientTransactionRef = doc(collection(db, 'users', recipientDoc.id, 'transactions'));
            transaction.set(recipientTransactionRef, { type: 'deposit', description: `Received from ${senderData.displayName}`, amount: amount, date: now, status: 'completed' });
            
            // 4. Create notification for recipient
            const recipientNotificationRef = doc(collection(db, 'users', recipientDoc.id, 'notifications'));
            transaction.set(recipientNotificationRef, {
                title: 'Cubes Received!',
                description: `You have received ${amount.toLocaleString()} Cubes from ${senderData.displayName}.`,
                date: now,
                read: false,
            });
        });
        
        // After successful transaction, save beneficiary
        const recipientData = recipientDoc.data();
        await setDoc(doc(db, 'users', sender.uid, 'beneficiaries', recipientDoc.id), {
            adsenerId: recipientData.adsenerId,
            displayName: recipientData.displayName,
            photoURL: recipientData.photoURL || null,
            lastTransferredAt: new Date(),
        }, { merge: true });

        return { success: true, message: `Successfully sent ${amount.toLocaleString()} cubes.` };

    } catch (error: any) {
        console.error("Cube transfer failed:", error);
        return { success: false, message: error.message || "An unexpected error occurred." };
    }
}

// Admin Functions
export async function updateUserStatus(uid: string, status: 'Active' | 'Disabled'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    if (status === 'Disabled') {
        await updateDoc(userRef, { status, disableCount: increment(1) });
    } else {
        await updateDoc(userRef, { status, showReenableWarning: true });
    }
}

export async function clearReenableWarning(): Promise<void> {
    const user = getCurrentUser();
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { showReenableWarning: false });
}

export async function updateUserProfileAdmin(uid: string, data: { displayName: string; isAdmin: boolean; }): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
}

export async function adjustUserBalanceAdmin(targetUid: string, amount: number, reason: string, adminProfile: UserProfile): Promise<void> {
    const targetUserRef = doc(db, 'users', targetUid);
    const now = new Date();

    const batch = writeBatch(db);

    // Update user's balance and, if adding, total earned
    const balanceUpdate: { [key: string]: any } = { cubeBalance: increment(amount) };
    if (amount > 0) {
      balanceUpdate.totalEarned = increment(amount);
    }
    batch.update(targetUserRef, balanceUpdate);

    // Create a transaction log for the user
    const transactionRef = doc(collection(db, 'users', targetUid, 'transactions'));
    batch.set(transactionRef, {
      type: 'admin',
      description: `Admin adjustment: ${reason}`,
      amount: amount,
      date: now,
      status: 'completed',
    });

    // Create an activity log for the user
    const activityRef = doc(collection(db, 'users', targetUid, 'activities'));
    batch.set(activityRef, {
      type: 'Admin Adjustment',
      description: `Balance adjusted by admin: ${reason}`,
      cubes_earned: amount,
      date: now,
    });
    
    // Create a notification for the user
    const notificationRef = doc(collection(db, 'users', targetUid, 'notifications'));
    batch.set(notificationRef, {
        title: "Account Balance Adjusted",
        description: `An admin has adjusted your balance by ${amount.toLocaleString()} Cubes. Reason: ${reason}`,
        date: now,
        read: false,
    });
    
    // Create an audit log for the admin action
    const adminLogRef = doc(collection(db, 'admin_logs'));
    const targetUserSnap = await getDoc(targetUserRef);
    const targetUserData = targetUserSnap.data();

    batch.set(adminLogRef, {
        adminUid: adminProfile.uid,
        adminDisplayName: adminProfile.displayName,
        action: "Adjusted User Balance",
        targetUid: targetUid,
        targetDisplayName: targetUserData?.displayName || 'Unknown',
        details: { amount, reason },
        timestamp: now,
    });

    await batch.commit();
}


export async function getPlatformSettings(): Promise<PlatformSettings> {
    const settingsRef = doc(db, 'platform_settings', 'config');
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Provide a default for totalFeesCollected if it doesn't exist
        return {
            ...data,
            totalFeesCollected: data.totalFeesCollected || 0,
        } as PlatformSettings;
    }

    const defaultSettings: PlatformSettings = {
        id: 'config',
        allowNewRegistrations: true,
        welcomeBonus: 50,
        globalAdRewardMultiplier: 1.0,
        globalGameRewardMultiplier: 1.0,
        maintenanceMode: false,
        transferFeePercentage: 1,
        totalFeesCollected: 0,
        globalPopup: {
          enabled: false,
          title: "Welcome!",
          message: "Welcome to Adsener. We are happy to have you here."
        }
    };
    await setDoc(settingsRef, defaultSettings);
    return defaultSettings;
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
    const settingsRef = doc(db, 'platform_settings', 'config');
    await updateDoc(settingsRef, settings);
}

export async function sendBroadcastNotification(titleTemplate: string, descriptionTemplate: string, isHtml: boolean = false): Promise<{ successCount: number; errorCount: number }> {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    if (querySnapshot.empty) return { successCount: 0, errorCount: 0 };

    let successCount = 0;
    let errorCount = 0;
    const chunks = [];
    const allDocs = querySnapshot.docs;

    for (let i = 0; i < allDocs.length; i += 499) {
        chunks.push(allDocs.slice(i, i + 499));
    }

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(userDoc => {
            const userProfile = userDoc.data() as UserProfile;
            const title = _replacePlaceholders(titleTemplate, userProfile);
            const description = _replacePlaceholders(descriptionTemplate, userProfile);
            _createNotificationInBatch(batch, userDoc.id, title, description, isHtml);
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

export async function sendPersonalizedNotification(recipientAdsenerId: string, titleTemplate: string, descriptionTemplate: string, isHtml: boolean = false): Promise<{ success: boolean; message: string; recipientName?: string; }> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("adsenerId", "==", recipientAdsenerId));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return { success: false, message: 'User not found.' };
        }
        
        const userDoc = querySnapshot.docs[0];
        const userProfile = await getUserProfile(userDoc.id);

        if (!userProfile) {
            return { success: false, message: 'Could not retrieve user profile.' };
        }
        
        const title = _replacePlaceholders(titleTemplate, userProfile);
        const description = _replacePlaceholders(descriptionTemplate, userProfile);

        const notificationRef = doc(collection(db, 'users', userDoc.id, 'notifications'));
        await setDoc(notificationRef, {
            title,
            description,
            isHtml: isHtml || false,
            date: new Date(),
            read: false,
        });

        return { success: true, message: `Message sent to ${userProfile.displayName}.`, recipientName: userProfile.displayName };
    } catch (error) {
        console.error("Failed to send personalized notification:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}


export async function logSentNotification(title: string, description: string, target: string, isHtml: boolean, adminDisplayName: string): Promise<void> {
    const logRef = doc(collection(db, 'sent_notifications_log'));
    const newLog = {
        adminDisplayName,
        title,
        description,
        target,
        isHtml,
        timestamp: new Date(),
    };
    await setDoc(logRef, newLog);
}

export async function getSentNotificationsLog(): Promise<SentNotificationLog[]> {
    const logsRef = collection(db, 'sent_notifications_log');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate(),
        } as SentNotificationLog;
    });
}


export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const user = getCurrentUser();
    const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsAsRead(): Promise<void> {
    const user = getCurrentUser();
    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return; // No unread notifications
        }

        const batch = writeBatch(db);
        querySnapshot.forEach(docSnapshot => {
            batch.update(docSnapshot.ref, { read: true });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
}


// Game Management
const seedGames = async () => {
    const games: (Omit<Game, 'isEnabled' | 'id'> & { id: string })[] = [
      { id: "g1", title: "Cube Runner", description: "Dodge obstacles and collect valuable cubes in this fast-paced runner.", imageUrl: "https://i.postimg.cc/pT3sJXX9/D-1.png", dataAiHint: "runner game", rewardDescription: "Score is based on cubes collected." },
      { id: "g2", title: "Memory Match", description: "Test your memory by flipping cards and finding matching pairs.", imageUrl: "https://i.postimg.cc/zX8k8gC2/D-2.png", dataAiHint: "memory cards", rewardDescription: "Score is based on fewer moves." },
      { id: "g3", title: "Puzzle Box", description: "Solve the light puzzle by turning all lights on or off. A true brain teaser!", imageUrl: "https://i.postimg.cc/L8pQ0g2z/D-3.png", dataAiHint: "glowing puzzle", rewardDescription: "Score is based on fewer moves." },
      { id: "g4", title: "Reaction Time", description: "Click as fast as you can when the screen turns green. Don't jump the gun!", imageUrl: "https://i.postimg.cc/k4GzZxyw/D-4.png", dataAiHint: "stopwatch speed", rewardDescription: "Score is based on faster reaction." },
      { id: "g5", title: "Endless Runner", description: "A different, more challenging version of Cube Runner. How long can you last?", imageUrl: "https://i.postimg.cc/PqD3GqR9/D-5.png", dataAiHint: "abstract space", rewardDescription: "Score is based on cubes collected." },
      { id: "g6", title: "Dot Connect", description: "Connect the matching dots by finding their pairs. A test of memory and speed.", imageUrl: "https://i.postimg.cc/mD3tZ6yM/D-6.png", dataAiHint: "connecting dots", rewardDescription: "Score is based on fewer moves." },
      { id: "g7", title: "Bubble Pop", description: "Pop the bubbles as they appear! Test your reaction speed in this fun challenge.", imageUrl: "https://i.postimg.cc/4N5dLBXf/D-7.png", dataAiHint: "soap bubbles", rewardDescription: "Score is based on faster reaction." },
      { id: "g8", title: "Zuma Dash", description: "Dash through a winding tunnel, collecting cubes in this high-speed challenge.", imageUrl: "https://i.postimg.cc/d1hKzZ2B/D-8.png", dataAiHint: "abstract tunnel", rewardDescription: "Score is based on cubes collected." },
      { id: "g9", title: "Puzzle Block", description: "Fit the blocks into the grid. Clear lines to score big points!", imageUrl: "https://i.postimg.cc/kG7Y9YqH/D-9.png", dataAiHint: "block puzzle", rewardDescription: "Score is based on lines cleared." },
    ];
    const batch = writeBatch(db);
    games.forEach(game => {
        const docRef = doc(db, 'games', game.id);
        batch.set(docRef, { ...game, isEnabled: true });
    });
    await batch.commit();
};

export async function getGames(): Promise<Game[]> {
    const gamesRef = collection(db, 'games');
    let querySnapshot = await getDocs(gamesRef);

    if (querySnapshot.empty) {
        await seedGames();
        querySnapshot = await getDocs(gamesRef);
    }
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
}
export async function addGame(game: Omit<Game, 'id'>): Promise<void> {
    const gameData = { ...game };
    gameData.imageUrl = await uploadImageIfPresent(game.imageUrl, 'game-images');
    await addDoc(collection(db, 'games'), gameData);
}
export async function updateGame(id: string, game: Partial<Game>): Promise<void> {
    const gameData = { ...game };
    if (gameData.imageUrl) {
        gameData.imageUrl = await uploadImageIfPresent(game.imageUrl, `game-images/${id}`);
    }
    await updateDoc(doc(db, 'games', id), gameData);
}
export async function deleteGame(id: string): Promise<void> { await deleteDoc(doc(db, 'games', id)); }

// Ad Management
const seedAds = async () => {
    const ads: Omit<Ad, 'id'>[] = [
        { title: "Explore the New TechGadget Pro", description: "Watch a short video about the latest innovation in personal tech.", duration: 30, reward: 15, imageUrl: "https://i.postimg.cc/zBtwMM3X/A-4.png", dataAiHint: "tech gadget", isEnabled: true },
        { title: "Quick & Healthy Snack Ideas", description: "Discover delicious and easy-to-make snacks for your busy lifestyle.", duration: 25, reward: 12, imageUrl: "https://i.postimg.cc/zBtwMM3X/A-4.png", dataAiHint: "healthy food", isEnabled: true },
        { title: "Adventure Awaits: Travel Deals", description: "Get inspired for your next vacation with these amazing travel packages.", duration: 45, reward: 20, imageUrl: "https://i.postimg.cc/zBtwMM3X/A-4.png", dataAiHint: "travel vacation", isEnabled: true },
        { title: "Mobile Gaming Madness", description: "Check out the hottest new mobile game that's taking the world by storm.", duration: 15, reward: 8, imageUrl: "https://i.postimg.cc/zBtwMM3X/A-4.png", dataAiHint: "mobile game", isEnabled: true },
    ];
    const batch = writeBatch(db);
    ads.forEach(ad => {
        const docRef = doc(collection(db, 'ads'));
        batch.set(docRef, ad);
    });
    await batch.commit();
};

export async function getAds(): Promise<Ad[]> {
    const adsRef = collection(db, 'ads');
    let querySnapshot = await getDocs(adsRef);

    if (querySnapshot.empty) {
        await seedAds();
        querySnapshot = await getDocs(adsRef);
    }
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
}
export async function addAd(ad: Omit<Ad, 'id'>): Promise<void> {
    const adData = { ...ad };
    adData.imageUrl = await uploadImageIfPresent(ad.imageUrl, 'ad-images');
    await addDoc(collection(db, 'ads'), adData);
}
export async function updateAd(id: string, ad: Partial<Ad>): Promise<void> {
    const adData = { ...ad };
    if (adData.imageUrl) {
        adData.imageUrl = await uploadImageIfPresent(ad.imageUrl, `ad-images/${id}`);
    }
    await updateDoc(doc(db, 'ads', id), adData);
}
export async function deleteAd(id: string): Promise<void> { await deleteDoc(doc(db, 'ads', id)); }


// Support Ticket Management
export async function submitSupportTicket(message: string): Promise<void> {
    const user = getCurrentUser();
    const userProfileDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userProfileDoc.exists()) throw new Error('User profile not found.');
    
    const userProfile = userProfileDoc.data() as UserProfile;
    
    const ticketRef = doc(collection(db, 'support_tickets'));
    const newTicket = {
        userId: user.uid,
        userDisplayName: userProfile.displayName,
        userEmail: userProfile.email,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
    };
    await setDoc(ticketRef, newTicket);
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
    const ticketsRef = collection(db, 'support_tickets');
    const q = query(ticketsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
            resolvedAt: data.resolvedAt ? (data.resolvedAt as Timestamp).toDate() : null,
        } as SupportTicket;
    });
}

export async function updateSupportTicketStatus(ticketId: string, status: 'resolved', adminName: string): Promise<void> {
    const ticketRef = doc(db, 'support_tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) throw new Error('Ticket not found.');

    const batch = writeBatch(db);

    batch.update(ticketRef, {
        status,
        resolvedAt: serverTimestamp(),
        resolvedBy: adminName,
    });
    
    const ticketData = ticketSnap.data();
    _createNotificationInBatch(batch, ticketData.userId, 'Support Ticket Resolved', 'Your recent support ticket has been reviewed and marked as resolved by our team.');

    await batch.commit();
}

export async function getTransactionsForUserAdmin(uid: string, count: number = 50): Promise<Transaction[]> {
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
