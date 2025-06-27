
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
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
          if (localStorage.getItem('adsener_ad_lock')) {
              const lock = JSON.parse(localStorage.getItem('adsener_ad_lock')!);
              if (lock.id === ad.id) {
                  localStorage.removeItem('adsener_ad_lock');
              }
          }
          if (ad.videoUrl) {
            // Give a small delay before closing for the user to see the completed state.
            setTimeout(() => setIsDialogOpen(false), 500);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWatching, ad.id, ad.videoUrl]);

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
    const lockData = localStorage.getItem('adsener_ad_lock');
    if (lockData) {
        const lock = JSON.parse(lockData);
        const isStale = Date.now() > lock.startTime + (lock.duration * 1000) + 5000;

        if (lock.id !== ad.id && !isStale) {
            toast({
                variant: 'destructive',
                title: 'Cannot Start Ad',
                description: 'Another ad is currently being watched. Please complete or wait for it to finish.',
            });
            return;
        }
    }
    
    const newLock = { id: ad.id, startTime: Date.now(), duration: ad.duration };
    localStorage.setItem('adsener_ad_lock', JSON.stringify(newLock));
    
    setTimeRemaining(ad.duration);
    setIsWatching(true);
    if (ad.videoUrl) {
      setIsDialogOpen(true);
    }
  };

  const handleClaim = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to claim rewards." });
        return;
    }
    setIsClaiming(true);
    try {
        await claimAdReward(ad.id);
        toast({
            title: "Reward Claimed!",
            description: `You've earned ${ad.reward} Cubes.`,
        });
        localStorage.removeItem(`ad_watched_${ad.id}`);
        onAdClaimed(ad.id);
    } catch (error: any) {
        console.error("Failed to claim reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: error.message || "Could not claim your reward. Please try again." });
    } finally {
        setIsClaiming(false);
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) { // If dialog is closing
        setIsDialogOpen(false);
        if (isWatching) {
            // If the timer was running, cancel it
            setIsWatching(false); // This will cause the useEffect to clean up the interval
            setTimeRemaining(ad.duration); // Reset timer
            // Remove the lock
            if (localStorage.getItem('adsener_ad_lock')) {
                const lock = JSON.parse(localStorage.getItem('adsener_ad_lock')!);
                if (lock.id === ad.id) {
                    localStorage.removeItem('adsener_ad_lock');
                }
            }
        }
    }
  }

  const progress = ((ad.duration - timeRemaining) / ad.duration) * 100;

  return (
    <>
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
          {isWatching && !ad.videoUrl && (
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
              {ad.videoUrl ? 'Watch Video' : 'Watch Ad'} ({ad.duration}s)
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

      {ad.videoUrl && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogContent className="max-w-4xl w-full p-0 aspect-video flex flex-col data-[state=closed]:sm:zoom-out-95">
                {isCompleted ? (
                    <div className="flex flex-col items-center justify-center h-full bg-black text-white p-4">
                        <CheckCircle className="w-16 h-16 text-success mb-4" />
                        <h2 className="text-2xl font-bold">Ad Finished!</h2>
                        <p className="text-lg text-muted-foreground">You can now claim your reward.</p>
                    </div>
                ) : (
                    <>
                        <div className="w-full h-full bg-black">
                            <iframe
                            src={`${ad.videoUrl}?autoplay=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1`}
                            title={ad.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                            ></iframe>
                        </div>
                        {isWatching && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                            <p className="text-sm text-white font-semibold mb-2">
                                You can claim your reward in {timeRemaining}s
                            </p>
                            <Progress value={progress} className="w-full h-2" />
                            </div>
                        )}
                    </>
                )}
              </DialogContent>
          </Dialog>
      )}
    </>
  );
}
