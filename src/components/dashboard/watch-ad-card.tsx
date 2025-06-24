
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { Ad } from "@/lib/types";
import { PlayCircle, CheckCircle, Zap } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { claimAdReward } from "@/services/user-data";
import { cn } from "@/lib/utils";

type WatchAdCardProps = {
  ad: Ad;
};

export function WatchAdCard({ ad }: WatchAdCardProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ad.duration);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const { toast } = useToast();
  const { user, refreshUserProfile } = useAuth();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatching && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (isWatching && timeRemaining === 0) {
      setIsCompleted(true);
      setIsWatching(false);
      sessionStorage.setItem(`ad_watched_${ad.id}`, 'true');
    }
    return () => clearTimeout(timer);
  }, [isWatching, timeRemaining, ad.id]);
  
  useEffect(() => {
    if (sessionStorage.getItem(`ad_claimed_${ad.id}`)) {
      setIsCompleted(true);
      setIsClaimed(true);
    } else if (sessionStorage.getItem(`ad_watched_${ad.id}`)) {
      setIsCompleted(true);
    }
  }, [ad.id]);


  const handleWatch = () => {
    setIsWatching(true);
  };

  const handleClaim = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to claim rewards." });
        return;
    }
    setIsClaiming(true);
    try {
        await claimAdReward(ad.reward, ad.title);
        await refreshUserProfile();
        toast({
            title: "Reward Claimed!",
            description: `You've earned ${ad.reward} Cubes.`,
        });
        setIsClaimed(true);
        sessionStorage.setItem(`ad_claimed_${ad.id}`, 'true');
    } catch (error) {
        console.error("Failed to claim reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: "Could not claim your reward. Please try again." });
    } finally {
        setIsClaiming(false);
    }
  };

  const progress = ((ad.duration - timeRemaining) / ad.duration) * 100;

  return (
    <Card className="overflow-hidden transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1.5">
      <CardHeader className="p-0">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          width={600}
          height={400}
          className="object-cover aspect-video"
          data-ai-hint={ad.dataAiHint}
        />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="font-headline text-lg">{ad.title}</CardTitle>
        <CardDescription className="mt-1">{ad.description}</CardDescription>
        {isWatching && (
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center mt-2">
              {timeRemaining}s remaining
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-muted/50">
        {!isWatching && !isCompleted && (
          <Button onClick={handleWatch} className="w-full">
            <PlayCircle className="mr-2 h-4 w-4" />
            Watch Ad ({ad.duration}s)
          </Button>
        )}
        {isWatching && (
          <Button disabled className="w-full" variant="secondary">
            Watching...
          </Button>
        )}
        {isCompleted && !isClaimed && (
          <Button onClick={handleClaim} disabled={isClaiming} className={cn(buttonVariants({}), "w-full bg-success hover:bg-success/90 text-success-foreground")}>
            {isClaiming ? "Claiming..." : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Claim {ad.reward} <Zap className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
        {isCompleted && isClaimed && (
            <Button disabled className="w-full" variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                Reward Claimed
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
