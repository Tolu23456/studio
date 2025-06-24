
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { isToday, isYesterday, startOfDay } from 'date-fns';
import { claimDailyReward } from "@/services/user-data";
import { useToast } from "@/hooks/use-toast";

export function DailyRewards() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      const lastClaimedDate = userProfile.lastClaimedDate ? startOfDay(userProfile.lastClaimedDate) : null;
      
      if (!lastClaimedDate) {
        setCanClaim(true);
        setStreak(0);
      } else {
        if (isToday(lastClaimedDate)) {
          setCanClaim(false);
          setStreak(userProfile.loginStreak);
        } else if (isYesterday(lastClaimedDate)) {
          setCanClaim(true);
          setStreak(userProfile.loginStreak);
        } else {
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
        const result = await claimDailyReward();
        if (result.success) {
            toast({
                title: "Reward Claimed!",
                description: result.message,
            });
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
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-full" />
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
        <TooltipProvider>
            <div className="flex items-center justify-center space-x-2">
                {rewards.map((reward) => (
                    <Tooltip key={reward.day}>
                        <TooltipTrigger asChild>
                            <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                                reward.claimed
                                ? "bg-primary/20 border-primary text-primary"
                                : canClaim && reward.day === nextStreakDay
                                ? "bg-accent/20 border-accent text-accent animate-pulse"
                                : "bg-muted text-muted-foreground"
                            }`}
                            >
                            {reward.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Day {reward.day} {reward.claimed ? '(Claimed)' : ''}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
        <Button onClick={handleClaim} className="w-full" disabled={!canClaim || isClaiming}>
          {isClaiming ? "Claiming..." : canClaim ? `Claim Day ${nextStreakDay} Reward` : "Claimed Today"}
        </Button>
      </CardContent>
    </Card>
  );
}
