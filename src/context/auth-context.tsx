
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { UserProfile, Notification, PlatformSettings } from '@/lib/types';
import { doc, onSnapshot, Timestamp, updateDoc, collection, query, orderBy, limit, setDoc, getDoc } from 'firebase/firestore';
import { generateAdsenerId } from '@/services/user-data';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  notifications: Notification[];
  platformSettings: PlatformSettings | null;
  refreshUserProfile?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  notifications: [],
  platformSettings: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (uid: string) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
       const profile: UserProfile = {
          uid: data.uid,
          adsenerId: data.adsenerId,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL || '',
          cubeBalance: data.cubeBalance,
          totalEarned: data.totalEarned,
          referrals: data.referrals,
          loginStreak: data.loginStreak || 0,
          lastClaimedDate: data.lastClaimedDate ? (data.lastClaimedDate as Timestamp).toDate() : null,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          isAdmin: data.isAdmin || false,
          status: data.status || 'Active',
          disableCount: data.disableCount || 0,
          showReenableWarning: data.showReenableWarning || false,
        };
        setUserProfile(profile);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  }, [user, fetchUserProfile]);


  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: (() => void) | undefined;
    let settingsUnsubscribe: (() => void) | undefined;
    let notificationsUnsubscribe: (() => void) | undefined;
    
    const settingsRef = doc(db, 'platform_settings', 'config');
    settingsUnsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setPlatformSettings({
                totalFeesCollected: 0,
                ...data
            } as PlatformSettings);
        } else {
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
                  message: "Welcome to Adsener. We are happy to have you here.",
                  imageUrl: "",
                }
            };
            setDoc(settingsRef, defaultSettings);
            setPlatformSettings(defaultSettings);
        }
    }, (error) => {
        console.error("Firestore snapshot error (settings):", error);
    });

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Clean up old listeners whenever auth state changes
      if (profileUnsubscribe) profileUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
      
      setUser(currentUser);
      
      if (currentUser) {
        // Set up profile listener
        const userRef = doc(db, 'users', currentUser.uid);
        profileUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const updates: { [key: string]: any } = {};

            if (!data.adsenerId) {
                updates.adsenerId = generateAdsenerId();
            }
            if (!data.displayName) {
                updates.displayName = currentUser.email?.split('@')[0] || `user_${currentUser.uid.substring(0, 5)}`;
            }

            if (Object.keys(updates).length > 0) {
                updateDoc(userRef, updates);
                return;
            }

            const profile: UserProfile = {
              uid: data.uid,
              adsenerId: data.adsenerId,
              email: data.email,
              displayName: data.displayName,
              photoURL: data.photoURL || '',
              cubeBalance: data.cubeBalance,
              totalEarned: data.totalEarned,
              referrals: data.referrals,
              loginStreak: data.loginStreak || 0,
              lastClaimedDate: data.lastClaimedDate ? (data.lastClaimedDate as Timestamp).toDate() : null,
              createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              isAdmin: data.isAdmin || false,
              status: data.status || 'Active',
              disableCount: data.disableCount || 0,
              showReenableWarning: data.showReenableWarning || false,
            };
            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore snapshot error (profile):", error);
          setUserProfile(null);
          setLoading(false);
        });

        // Set up notifications listener
        const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
        const q = query(notificationsRef, orderBy('date', 'desc'), limit(50));
        let isInitialQuery = true;

        notificationsUnsubscribe = onSnapshot(q, (querySnapshot) => {
            if (!isInitialQuery) {
                querySnapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const newNotificationData = change.doc.data();
                        toast({
                            title: `🔔 ${newNotificationData.title}`,
                            description: newNotificationData.description,
                        });
                    }
                });
            }
            isInitialQuery = false;
        
            const allNotifications = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: (data.date as Timestamp).toDate(),
                } as Notification;
            });
            setNotifications(allNotifications);
        }, (error) => {
            console.error("Error fetching real-time notifications: ", error);
        });

      } else {
        // User is logged out
        setUserProfile(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
      if (settingsUnsubscribe) settingsUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, userProfile, loading, notifications, platformSettings, refreshUserProfile }), [user, userProfile, loading, notifications, platformSettings, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
