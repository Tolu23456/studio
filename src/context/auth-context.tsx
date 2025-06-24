
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { generateAdsenerId } from '@/services/user-data';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Clean up previous profile listener if user changes (e.g., logout/login)
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Set up a real-time listener for the user's profile
        profileUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            const updates: { [key: string]: any } = {};

            // Lazily generate Adsener ID for existing users who don't have one.
            if (!data.adsenerId) {
                updates.adsenerId = generateAdsenerId();
            }

            // Lazily generate displayName for existing users who don't have one.
            if (!data.displayName) {
                updates.displayName = currentUser.email?.split('@')[0] || `user_${currentUser.uid.substring(0, 5)}`;
            }

            if (Object.keys(updates).length > 0) {
                // This is a fire-and-forget update. onSnapshot will be triggered again
                // by this update, but the `if` conditions will prevent an infinite loop.
                updateDoc(userRef, updates);
                // Exit early, the listener will re-run with the updated data.
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
            };
            setUserProfile(profile);
          } else {
            // User exists in Auth, but not in Firestore.
            // This can happen briefly during sign-up or if profile creation fails.
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore snapshot error:", error);
          setUserProfile(null);
          setLoading(false);
        });
      } else {
        // User is logged out
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Cleanup function for when the AuthProvider unmounts
    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const value = { user, userProfile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
