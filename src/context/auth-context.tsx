
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getUserProfile } from '@/services/user-data';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshUserProfile: async () => {},
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
            const profile: UserProfile = {
              uid: data.uid,
              email: data.email,
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
            // The reward claiming logic handles creating a profile if it's missing.
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

  const refreshUserProfile = useCallback(async () => {
    // This function is now less critical due to onSnapshot, but can be kept
    // for components that explicitly want to 'await' a refresh.
    if (user) {
      const profile = await getUserProfile(user);
      setUserProfile(profile);
    }
  }, [user]);

  const value = { user, userProfile, loading, refreshUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
