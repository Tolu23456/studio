
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/services/user-data';
import type { UserProfile } from '@/lib/types';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  avatarUrl: string | null;
  loadingAvatar: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  avatarUrl: null,
  loadingAvatar: true,
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(true);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    try {
      const idToken = await currentUser.getIdToken();
      const profile = await getUserProfile(idToken);
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUserProfile(null);
    }
  }, []);
  
  const fetchAvatar = useCallback(async (uid: string) => {
    const storedAvatar = sessionStorage.getItem(`avatar_${uid}`);
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
      setLoadingAvatar(false);
      return;
    }

    setLoadingAvatar(true);
    try {
      const result = await generateAvatar();
      setAvatarUrl(result.avatarDataUri);
      sessionStorage.setItem(`avatar_${uid}`, result.avatarDataUri);
    } catch (error) {
      console.error("Failed to generate avatar:", error);
      setAvatarUrl(null); 
    } finally {
      setLoadingAvatar(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true); 
        await Promise.all([
          fetchUserProfile(currentUser),
          fetchAvatar(currentUser.uid)
        ]);
        setLoading(false);
      } else {
        setUserProfile(null);
        setAvatarUrl(null);
        setLoading(false);
        setLoadingAvatar(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile, fetchAvatar]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  const value = { user, userProfile, loading, avatarUrl, loadingAvatar, refreshUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
