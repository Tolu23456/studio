
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { UserProfile, Notification, PlatformSettings } from '@/lib/types';
import { doc, onSnapshot, Timestamp, updateDoc, collection, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { generateAdsenerId } from '@/services/user-data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  notifications: Notification[];
  platformSettings: PlatformSettings | null;
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
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: (() => void) | undefined;
    let settingsUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (profileUnsubscribe) profileUnsubscribe();
      if (settingsUnsubscribe) settingsUnsubscribe();

      setUser(currentUser);
      
      if (currentUser) {
        // Subscribe to user profile
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

        // Fetch platform settings once
        const settingsRef = doc(db, 'platform_settings', 'config');
        settingsUnsubscribe = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
            setPlatformSettings(docSnap.data() as PlatformSettings);
          }
        }, (error) => {
           console.error("Firestore snapshot error (settings):", error);
        });

      } else {
        setUserProfile(null);
        setPlatformSettings(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
      if (settingsUnsubscribe) settingsUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setNotifications([]);
      return;
    }
  
    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, orderBy('date', 'desc'), limit(10));
    
    let isInitialQuery = true;
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
  
    return () => unsubscribe();
  }, [user, toast]);

  const value = { user, userProfile, loading, notifications, platformSettings };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
