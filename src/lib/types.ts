
export type UserProfile = {
  uid: string;
  adsenerId: string;
  email: string | null;
  displayName: string;
  photoURL?: string;
  cubeBalance: number;
  totalEarned: number;
  referrals: number;
  loginStreak: number;
  lastClaimedDate: Date | null;
  createdAt: Date;
  status: 'Active' | 'Disabled';
  isAdmin?: boolean;
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'purchase';
  description: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
};

export type Activity = {
  id:string;
  type: 'Ad Watch' | 'Task Completion' | 'Game Play' | 'Referral Bonus' | 'Daily Login';
  description:string;
  cubes_earned: number;
  date: Date;
};

export type Ad = {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  reward: number;
  imageUrl: string;
  dataAiHint?: string;
};

export type Game = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  dataAiHint?: string;
  rewardDescription?: string;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  date: Date;
  read: boolean;
};

export type ReferredUser = {
  id: string; // The UID of the referred user
  displayName: string;
  createdAt: Date;
};

export type AdminUserView = {
  id: string;
  photoURL?: string;
  displayName: string;
  email: string;
  status: 'Active' | 'Disabled';
  createdAt: Date;
  isAdmin: boolean;
  cubeBalance: number;
  totalEarned: number;
};

export type PlatformSettings = {
  id: 'config';
  allowNewRegistrations: boolean;
  welcomeBonus: number;
  maintenanceMode: boolean;
  // Economy
  globalAdRewardMultiplier: number;
  globalGameRewardMultiplier: number;
  transferFeePercentage: number;
  // Popup
  globalPopup?: {
    enabled: boolean;
    title: string;
    message: string;
  };
};
