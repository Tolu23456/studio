

export type UserProfile = {
  uid: string;
  adsenerId: string;
  email: string | null;
  displayName: string;
  photoURL?: string;
  cubeBalance: number;
  totalEarned: number;
  referrals: number;
  totalReferralEarnings: number;
  loginStreak: number;
  lastClaimedDate: Date | null;
  createdAt: Date;
  status: 'Active' | 'Disabled';
  notificationPreferences: {
    rewardNotifications: boolean;
    promotionalUpdates: boolean;
  };
  isAdmin?: boolean;
  disableCount: number;
  showReenableWarning?: boolean;
  adResetTimestamp?: Date | null;
  claimedAdIds?: string[];
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'purchase' | 'admin';
  description: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
};

export type Activity = {
  id:string;
  type: 'Ad Watch' | 'Task Completion' | 'Game Play' | 'Referral Bonus' | 'Daily Login' | 'Admin Adjustment';
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
  isEnabled: boolean;
};

export type Game = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  dataAiHint?: string;
  rewardDescription?: string;
  isEnabled: boolean;
  gameUrl?: string;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  date: Date;
  read: boolean;
  isHtml?: boolean;
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
  disableCount: number;
};

export type PlatformSettings = {
  id: 'config';
  allowNewRegistrations: boolean;
  welcomeBonus: number;
  maintenanceMode: boolean;
  // Economy
  totalFeesCollected: number;
  globalAdRewardMultiplier: number;
  globalGameRewardMultiplier: number;
  transferFeePercentage: number;
  // Popup
  globalPopup?: {
    enabled: boolean;
    title: string;
    message: string;
    imageUrl?: string;
  };
};

export type SupportTicket = {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date | null;
  resolvedBy?: string | null; // Admin display name
};

export type Beneficiary = {
  id: string; // recipient's UID
  adsenerId: string;
  displayName: string;
  photoURL: string | null;
  lastTransferredAt: Date;
};

export type SentNotificationLog = {
  id: string;
  adminDisplayName: string;
  title: string;
  description: string;
  target: string;
  isHtml: boolean;
  timestamp: Date;
};
