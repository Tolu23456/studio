import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Gift } from "lucide-react";

export function DailyRewards() {
  // Mock data for daily rewards
  const loginStreak = 4; // Day 5 is the next to claim
  const rewards = [
    { day: 1, claimed: true },
    { day: 2, claimed: true },
    { day: 3, claimed: true },
    { day: 4, claimed: true },
    { day: 5, claimed: false },
    { day: 6, claimed: false },
    { day: 7, claimed: false },
  ];

  const canClaimToday = !rewards[loginStreak].claimed;

  return (
    <Card className="sm:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle>Daily Login Rewards</CardTitle>
        <CardDescription>
          You are on a {loginStreak}-day streak! Claim your reward.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between space-x-2">
          {rewards.map((reward, index) => (
            <div key={reward.day} className="flex flex-col items-center gap-1 text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  reward.claimed
                    ? "bg-primary/20 border-primary text-primary"
                    : index === loginStreak
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {reward.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium">Day {reward.day}</span>
            </div>
          ))}
        </div>
        <Button className="w-full" disabled={!canClaimToday}>
          {canClaimToday ? "Claim Today's Reward" : "Claimed Today"}
        </Button>
      </CardContent>
    </Card>
  );
}
