"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { isToday, isYesterday, startOfDay } from 'date-fns';
import { claimDailyReward } from "@/services/user-data";
import { useToast } from "@/hooks/use-toast";

export function DailyRewards() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      const lastClaimedDate = userProfile.lastClaimedDate ? startOfDay(userProfile.lastClaimedDate) : null;
      
      if (!lastClaimedDate) {
        // Never claimed before
        setCanClaim(true);
        setStreak(0);
      } else {
        if (isToday(lastClaimedDate)) {
          // Claimed today
          setCanClaim(false);
          setStreak(userProfile.loginStreak);
        } else if (isYesterday(lastClaimedDate)) {
          // Didn't claim today, but did yesterday, streak continues
          setCanClaim(true);
          setStreak(userProfile.loginStreak);
        } else {
          // Missed a day, streak resets
          setCanClaim(true);
          setStreak(0);
        }
      }
    }
  }, [userProfile]);

  const rewards = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    claimed: i + 1 <= streak,
  }));
  
  const nextStreakDay = (streak % 7) + 1;

  const handleClaim = async () => {
    if (!user) return;
    setIsClaiming(true);
    try {
        const result = await claimDailyReward(user.uid);
        if (result.success) {
            toast({
                title: "Reward Claimed!",
                description: result.message,
            });
            await refreshUserProfile();
        } else {
            toast({
                variant: "destructive",
                title: "Claim Failed",
                description: result.message,
            });
        }
    } catch (error) {
        console.error("Failed to claim daily reward:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "An unexpected error occurred while claiming your reward.",
        });
    } finally {
        setIsClaiming(false);
    }
  };
  
  if (authLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between space-x-2">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 text-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-3 w-10" />
                </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Daily Login Rewards</CardTitle>
        <CardDescription>
          {streak > 0 ? `You are on a ${streak}-day streak!` : "Log in daily to build your streak."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between space-x-2">
          {rewards.map((reward) => (
            <div key={reward.day} className="flex flex-col items-center gap-1 text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  reward.claimed
                    ? "bg-primary/20 border-primary text-primary"
                    : canClaim && reward.day === nextStreakDay
                    ? "bg-accent/20 border-accent text-accent animate-pulse"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {reward.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium">Day {reward.day}</span>
            </div>
          ))}
        </div>
        <Button onClick={handleClaim} className="w-full" disabled={!canClaim || isClaiming}>
          {isClaiming ? "Claiming..." : canClaim ? `Claim Day ${nextStreakDay} Reward` : "Claimed Today"}
        </Button>
      </CardContent>
    </Card>
  );
}
