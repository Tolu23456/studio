
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/services/user-data';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    try {
      const idToken = await currentUser.getIdToken(true);
      const profile = await getUserProfile(idToken);
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUserProfile(null);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        const idTokenResult = await currentUser.getIdTokenResult(true);
        setIsAdmin(!!idTokenResult.claims.admin);
        await fetchUserProfile(currentUser);
        setLoading(false);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      const idTokenResult = await user.getIdTokenResult(true);
      setIsAdmin(!!idTokenResult.claims.admin);
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  const value = { user, userProfile, loading, isAdmin, refreshUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
