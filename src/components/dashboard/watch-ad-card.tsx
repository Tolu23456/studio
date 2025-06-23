"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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

type WatchAdCardProps = {
  ad: Ad;
};

export function WatchAdCard({ ad }: WatchAdCardProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ad.duration);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatching && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (isWatching && timeRemaining === 0) {
      setIsCompleted(true);
      setIsWatching(false);
    }
    return () => clearTimeout(timer);
  }, [isWatching, timeRemaining]);

  const handleWatch = () => {
    setIsWatching(true);
  };

  const handleClaim = () => {
    toast({
      title: "Reward Claimed!",
      description: `You've earned ${ad.reward} Cubes.`,
    });
    // Here you would typically call an API to credit the user
    setIsCompleted(false); // Reset for potential re-watch
    setTimeRemaining(ad.duration);
  };

  const progress = ((ad.duration - timeRemaining) / ad.duration) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          width={600}
          height={400}
          className="object-cover aspect-video"
          data-ai-hint="advertisement video"
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
        {isCompleted && (
          <Button onClick={handleClaim} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <CheckCircle className="mr-2 h-4 w-4" />
            Claim {ad.reward} <Zap className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
