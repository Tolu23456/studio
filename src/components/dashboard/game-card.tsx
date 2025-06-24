
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
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@/lib/types";
import { Gamepad2, Zap, CheckCircle, Hourglass } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { claimGameReward } from "@/services/user-data";
import { cn } from "@/lib/utils";


type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'completed' | 'claimed'>('idle');
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();
  const { user, refreshUserProfile } = useAuth();

  useEffect(() => {
    if (sessionStorage.getItem(`game_played_${game.id}`)) {
      setGameState('claimed');
    }
  }, [game.id]);
  
  const handlePlay = () => {
    setGameState('playing');
    setTimeout(() => {
      setGameState('completed');
    }, 3000);
  };
  
  const handleClaim = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to claim rewards." });
        return;
    }
    setIsClaiming(true);
    try {
        await claimGameReward(user.uid, game.reward, game.title);
        await refreshUserProfile();
        toast({
            title: "Reward Claimed!",
            description: `You've earned ${game.reward} Cubes.`,
        });
        setGameState('claimed');
        sessionStorage.setItem(`game_played_${game.id}`, 'true');
    } catch (error) {
        console.error("Failed to claim game reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: "Could not claim your reward. Please try again." });
    } finally {
        setIsClaiming(false);
    }
  };


  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-0 relative">
        <Image
          src={game.imageUrl}
          alt={game.title}
          width={600}
          height={400}
          className={cn("object-cover aspect-video transition-opacity", (gameState === 'playing' || gameState === 'claimed') && 'opacity-50')}
          data-ai-hint={game.dataAiHint}
        />
        {gameState === 'playing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                <Hourglass className="w-12 h-12 animate-spin" />
                <p className="mt-4 text-lg font-semibold">Playing...</p>
            </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg">{game.title}</CardTitle>
        <CardDescription className="mt-1">{game.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
        <div className="flex items-center gap-1 font-bold text-primary">
            <Zap className="w-5 h-5" />
            <span>{game.reward}</span>
        </div>
        
        {gameState === 'idle' && (
            <Button onClick={handlePlay}>
              <Gamepad2 className="mr-2 h-4 w-4" />
              Play Now
            </Button>
        )}
        {gameState === 'playing' && (
            <Button disabled variant="secondary" className="w-36">
                <Hourglass className="mr-2 h-4 w-4 animate-spin" />
                Playing...
            </Button>
        )}
        {gameState === 'completed' && (
            <Button onClick={handleClaim} disabled={isClaiming} className={cn(buttonVariants({}), "bg-success hover:bg-success/90 text-success-foreground w-36")}>
                {isClaiming ? 'Claiming...' : (
                    <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Claim Reward
                    </>
                )}
            </Button>
        )}
        {gameState === 'claimed' && (
             <Button disabled variant="outline" className="w-36">
                <CheckCircle className="mr-2 h-4 w-4" />
                Played
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
