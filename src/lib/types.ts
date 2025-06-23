export type UserProfile = {
  uid: string;
  email: string | null;
  cubeBalance: number;
  totalEarned: number;
  referrals: number;
  loginStreak: number;
  lastClaimedDate: Date | null;
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
};
