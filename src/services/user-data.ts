
'use client';

import type { Activity, AdminUserView, Notification, PlatformSettings, Transaction, UserProfile, Game, Ad, SupportTicket } from '@/lib/types';
import { collection, doc, getDoc, setDoc, writeBatch, Timestamp, increment, updateDoc, runTransaction, query, where, getDocs, orderBy, deleteDoc, addDoc, collectionGroup, serverTimestamp } from 'firebase/firestore';
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
    const newUserProfile: Omit<UserProfile, 'uid' | 'status' | 'isAdmin' | 'showReenableWarning'> = {
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
        disableCount: 0,
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
            disableCount: data.disableCount || 0,
            showReenableWarning: data.showReenableWarning || false,
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


export async function uploadProfilePicture(file: File): Promise<string> {
    if (!storage) {
        throw new Error("Firebase Storage is not configured. Please ensure NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set in your environment variables.");
    }
    const user = getCurrentUser();
    const filePath = `profile-pictures/${user.uid}/profile.jpg`;
    const storageRef = ref(storage, filePath);

    try {
        await uploadBytes(storageRef, file);
        
        const downloadURL = await getDownloadURL(storageRef);
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { photoURL: downloadURL });
        
        return downloadURL;
    } catch (error: any) {
        if (error.code === 'storage/unauthorized') {
            throw new Error("Permission denied. Please check your Firebase Storage security rules to allow writes.");
        }
        throw error;
    }
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
  const adRef = doc(db, 'ads', adId);
  const adSnap = await getDoc(adRef);
  if (!adSnap.exists()) throw new Error("Invalid ad ID or ad not found.");
  const adData = adSnap.data() as Ad;
  
  const settings = await getPlatformSettings();
  const reward = Math.round(adData.reward * settings.globalAdRewardMultiplier);
  const { title } = adData;
  
  const userRef = doc(db, 'users', user.uid);

  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) throw new Error("User profile not found, cannot claim reward.");

  const batch = writeBatch(db);
  const now = new Date();

  batch.update(userRef, {
    cubeBalance: increment(reward),
    totalEarned: increment(reward),
  });

  const activityRef = doc(collection(db, 'users', user.uid, 'activities'));
  batch.set(activityRef, {
    type: 'Ad Watch',
    description: `Watched '${title}' ad`,
    cubes_earned: reward,
    date: now,
  });

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  batch.set(transactionRef, {
      type: 'reward',
      description: `Watched '${title}' ad`,
      amount: reward,
      date: now,
      status: 'completed',
  });
  
  _createNotification(batch, user.uid, "Reward Claimed!", `You earned ${reward} Cubes for watching '${title}'.`);

  await batch.commit();
}

const calculateGameReward = (gameId: string, scorePayload: number): number => {
    // This logic can be customized per game
    switch (gameId) {
        // Higher score is better
        case 'g1': case 'g2': case 'g7': return scorePayload; 
        // Lower score (moves/time) is better
        case 'g3': case 'g8': case 'g9': case 'g10': return Math.max(5, 50 - scorePayload);
        case 'g4': return Math.max(5, 40 - scorePayload); 
        case 'g5': case 'g6': return Math.max(1, 30 - Math.floor(scorePayload / 100));
        default: return 0;
    }
};

const getGameTitle = (gameId: string, games: Game[]): string => {
    return games.find(g => g.id === gameId)?.title || 'a game';
};

export async function claimGameReward(gameId: string, scorePayload: number): Promise<number> {
  const user = getCurrentUser();
  const settings = await getPlatformSettings();
  const baseReward = calculateGameReward(gameId, scorePayload);
  const finalReward = Math.round(baseReward * settings.globalGameRewardMultiplier);
  
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  if (!gameSnap.exists()) throw new Error("Game not found.");
  const gameTitle = gameSnap.data().title || 'a game';

  if (finalReward <= 0) return 0;
  
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
    description: `Played '${gameTitle}'`,
    cubes_earned: finalReward,
    date: now,
  });

  const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
  batch.set(transactionRef, {
    type: 'reward',
    description: `Reward from '${gameTitle}'`,
    amount: finalReward,
    date: now,
    status: 'completed',
  });

  _createNotification(batch, user.uid, "Game Reward!", `You earned ${finalReward} Cubes for playing '${gameTitle}'.`);
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
            transaction.update(senderRef, { cubeBalance: increment(-totalDeduction) });
            transaction.update(recipientDoc.ref, { cubeBalance: increment(amount) });

            const senderTransactionRef = doc(collection(db, 'users', sender.uid, 'transactions'));
            transaction.set(senderTransactionRef, { type: 'withdrawal', description: `Sent to ${recipientDoc.data().displayName}`, amount: -totalDeduction, date: now, status: 'completed' });
            
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

export async function getPlatformSettings(): Promise<PlatformSettings> {
    const settingsRef = doc(db, 'platform_settings', 'config');
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
        return docSnap.data() as PlatformSettings;
    }

    const defaultSettings: PlatformSettings = {
        id: 'config',
        allowNewRegistrations: true,
        welcomeBonus: 50,
        globalAdRewardMultiplier: 1.0,
        globalGameRewardMultiplier: 1.0,
        maintenanceMode: false,
        transferFeePercentage: 1,
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

// Game Management
const seedGames = async () => {
    const games: Omit<Game, 'id'>[] = [
      { title: "One Tap Dash", description: "Tap once to make a cube dash through rotating obstacles. Timing is everything.", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "abstract obstacle", rewardDescription: "Higher score = more Cubes!", isEnabled: true },
      { title: "Shadow Jump", description: "Jump between moving platforms. One misstep = fall.", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "platformer game", rewardDescription: "Longer survival = more Cubes!", isEnabled: true },
      { title: "Don’t Touch the Red", description: "Navigate through a maze where only one path is safe. Red tiles = restart.", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "maze puzzle", rewardDescription: "Faster completion = more Cubes!", isEnabled: true },
      { title: "Quick Flip", description: "A memory match game that gets faster every round. Flip, match, or fail.", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "memory game", rewardDescription: "Fewer moves = more Cubes!", isEnabled: true },
      { title: "Laser Reflex", description: "Tap only when the green laser appears. Red laser = auto fail.", imageUrl: "https://placehold.co/600x400.png", dataAiHint: "reaction test", rewardDescription: "Faster reflex = more Cubes!", isEnabled: true },
    ];
    const batch = writeBatch(db);
    games.forEach(game => {
        const docRef = doc(collection(db, 'games'));
        batch.set(docRef, game);
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
export async function addGame(game: Omit<Game, 'id'>): Promise<void> { await addDoc(collection(db, 'games'), game); }
export async function updateGame(id: string, game: Partial<Game>): Promise<void> { await updateDoc(doc(db, 'games', id), game); }
export async function deleteGame(id: string): Promise<void> { await deleteDoc(doc(db, 'games', id)); }

// Ad Management
const seedAds = async () => {
    const ads: Omit<Ad, 'id'>[] = [
        { title: "Explore the New TechGadget Pro", description: "Watch a short video about the latest innovation in personal tech.", duration: 30, reward: 15, imageUrl: "https://placehold.co/600x400.png", dataAiHint: "tech gadget", isEnabled: true },
        { title: "Quick & Healthy Snack Ideas", description: "Discover delicious and easy-to-make snacks for your busy lifestyle.", duration: 25, reward: 12, imageUrl: "https://placehold.co/600x400.png", dataAiHint: "healthy food", isEnabled: true },
        { title: "Adventure Awaits: Travel Deals", description: "Get inspired for your next vacation with these amazing travel packages.", duration: 45, reward: 20, imageUrl: "https://placehold.co/600x400.png", dataAiHint: "travel vacation", isEnabled: true },
        { title: "Mobile Gaming Madness", description: "Check out the hottest new mobile game that's taking the world by storm.", duration: 15, reward: 8, imageUrl: "https://placehold.co/600x400.png", dataAiHint: "mobile game", isEnabled: true },
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
export async function addAd(ad: Omit<Ad, 'id'>): Promise<void> { await addDoc(collection(db, 'ads'), ad); }
export async function updateAd(id: string, ad: Partial<Ad>): Promise<void> { await updateDoc(doc(db, 'ads', id), ad); }
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
    _createNotification(batch, ticketData.userId, 'Support Ticket Resolved', 'Your recent support ticket has been reviewed and marked as resolved by our team.');

    await batch.commit();
}
