
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
  onAdClaimed: (adId: string) => void;
};

export function WatchAdCard({ ad, onAdClaimed }: WatchAdCardProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ad.duration);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // This check is for ads that were watched but the user navigated away
    // before claiming. When they come back, the ad should be claimable.
    if (localStorage.getItem(`ad_watched_${ad.id}`)) {
      setIsCompleted(true);
    }
  }, [ad.id]);

  useEffect(() => {
    if (!isWatching) return;

    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsWatching(false);
          setIsCompleted(true);
          localStorage.setItem(`ad_watched_${ad.id}`, "true");
          // Clear the lock when finished watching
          if (localStorage.getItem('adsener_ad_lock')) {
              const lock = JSON.parse(localStorage.getItem('adsener_ad_lock')!);
              if (lock.id === ad.id) {
                  localStorage.removeItem('adsener_ad_lock');
              }
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWatching, ad.id]);

  // Clean up the ad lock if the component unmounts (e.g., page navigation)
  useEffect(() => {
    return () => {
        if (localStorage.getItem('adsener_ad_lock')) {
            const lock = JSON.parse(localStorage.getItem('adsener_ad_lock')!);
            if (lock.id === ad.id) {
                localStorage.removeItem('adsener_ad_lock');
            }
        }
    };
  }, [ad.id]);


  const handleWatch = () => {
    // Check for an existing lock
    const lockData = localStorage.getItem('adsener_ad_lock');
    if (lockData) {
        const lock = JSON.parse(lockData);
        const isStale = Date.now() > lock.startTime + (lock.duration * 1000) + 5000; // 5-sec buffer

        if (lock.id !== ad.id && !isStale) {
            toast({
                variant: 'destructive',
                title: 'Cannot Start Ad',
                description: 'Another ad is currently being watched. Please complete or wait for it to finish.',
            });
            return;
        }
    }
    
    // Set a new lock
    const newLock = { id: ad.id, startTime: Date.now(), duration: ad.duration };
    localStorage.setItem('adsener_ad_lock', JSON.stringify(newLock));
    
    setTimeRemaining(ad.duration);
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
        toast({
            title: "Reward Claimed!",
            description: `You've earned ${ad.reward} Cubes.`,
        });
        localStorage.setItem(`ad_claimed_${ad.id}`, 'true');
        onAdClaimed(ad.id);
    } catch (error) {
        console.error("Failed to claim reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: "Could not claim your reward. Please try again." });
    } finally {
        setIsClaiming(false);
    }
  };

  const progress = ((ad.duration - timeRemaining) / ad.duration) * 100;

  return (
    <Card className="overflow-hidden transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1.5 flex flex-col">
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
      <CardContent className="p-4 flex-grow">
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
      <CardFooter className="p-4 bg-muted/50 mt-auto">
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
        {isCompleted && (
          <Button onClick={handleClaim} disabled={isClaiming} className={cn(buttonVariants({}), "w-full bg-success hover:bg-success/90 text-success-foreground")}>
            {isClaiming ? "Claiming..." : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Claim {ad.reward} <Zap className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
