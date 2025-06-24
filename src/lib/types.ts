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
  id: string;
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
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  date: Date;
  read: boolean;
};
