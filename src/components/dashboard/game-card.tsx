
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as RadixDialogTitle,
  DialogDescription as RadixDialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@/lib/types";
import { Gamepad2, Zap, Clock } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { claimGameReward } from "@/services/user-data";
import { ReactionTimeGame } from "@/components/games/reaction-time-game";
import { CubeRunnerGame } from "@/components/games/cube-runner-game";
import { AdTriviaGame } from "@/components/games/ad-trivia-game";
import { PuzzleBoxGame } from "@/components/games/puzzle-box-game";
import { MemoryMatchGame } from "@/components/games/memory-match-game";

const getGamePlays = () => {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem('game_plays');
    return data ? JSON.parse(data) : {};
};

const setGamePlays = (plays: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('game_plays', JSON.stringify(plays));
};

const ComingSoonGame = ({ onGameComplete }: { onGameComplete: () => void }) => (
    <div className="p-6 text-center space-y-4">
        <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground/50" />
        <h3 className="text-xl font-bold font-headline">Coming Soon!</h3>
        <p className="text-muted-foreground">This exciting game is still under development. Please check back later to play.</p>
        <Button onClick={onGameComplete}>Close</Button>
    </div>
);

const GameComponentMap: { [key: string]: React.ElementType } = {
  'g1': CubeRunnerGame,
  'g2': AdTriviaGame,
  'g3': PuzzleBoxGame,
  'g4': MemoryMatchGame,
  'g5': ComingSoonGame,
  'g6': ReactionTimeGame,
};


type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  const { toast } = useToast();
  const { user, refreshUserProfile } = useAuth();
  
  const MAX_PLAYS = 5;
  const COOLDOWN_HOURS = 1;

  useEffect(() => {
    const allPlays = getGamePlays();
    const gameData = allPlays[game.id];
    
    if (gameData) {
        setPlayCount(gameData.count || 0);
        const now = new Date().getTime();
        if (gameData.cooldownUntil && now < gameData.cooldownUntil) {
            setCooldownTime(gameData.cooldownUntil);
        } else if (gameData.cooldownUntil && now >= gameData.cooldownUntil) {
            const newPlays = { ...allPlays };
            delete newPlays[game.id];
            setGamePlays(newPlays);
            setPlayCount(0);
            setCooldownTime(0);
        }
    } else {
        setPlayCount(0);
    }
  }, [game.id]);
  
   useEffect(() => {
    if (cooldownTime > 0) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        if (now >= cooldownTime) {
          setCooldownTime(0);
          setPlayCount(0);
          const allPlays = getGamePlays();
          const newPlays = { ...allPlays };
          delete newPlays[game.id];
          setGamePlays(newPlays);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownTime, game.id]);


  const handleGameWon = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to claim rewards." });
        return;
    }

    try {
        const idToken = await user.getIdToken();
        await claimGameReward(idToken, game.reward, game.title);
        await refreshUserProfile();
        toast({
            title: "Reward Claimed!",
            description: `You've earned ${game.reward} Cubes for playing ${game.title}.`,
        });

        const allPlays = getGamePlays();
        const currentCount = (allPlays[game.id]?.count || 0) + 1;
        
        let newCooldownUntil = allPlays[game.id]?.cooldownUntil || null;
        if (currentCount >= MAX_PLAYS) {
            newCooldownUntil = new Date().getTime() + COOLDOWN_HOURS * 60 * 60 * 1000;
            setCooldownTime(newCooldownUntil);
            toast({
                title: "Play limit reached",
                description: `You can play this game again in ${COOLDOWN_HOURS} hour.`,
            });
        }
        
        setPlayCount(currentCount);
        setGamePlays({
            ...allPlays,
            [game.id]: {
                count: currentCount,
                cooldownUntil: newCooldownUntil,
            },
        });

    } catch (error) {
        console.error("Failed to claim game reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: "Could not claim your reward. Please try again." });
    }
  };

  const handleFinishGame = () => {
    setIsGameOpen(false);
  }

  const GameComponent = GameComponentMap[game.id] || ComingSoonGame;
  
  const formatTimeLeft = () => {
    if (cooldownTime <= 0) return '';
    const now = new Date().getTime();
    const diff = cooldownTime - now;

    if (diff <= 0) return '';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  const onCooldown = cooldownTime > 0 && new Date().getTime() < cooldownTime;
  const playsLeft = MAX_PLAYS - playCount;

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <CardHeader className="p-0 relative">
          <Image
            src={game.imageUrl}
            alt={game.title}
            width={600}
            height={400}
            className="object-cover aspect-video"
            data-ai-hint={game.dataAiHint}
          />
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="font-headline text-lg">{game.title}</CardTitle>
          <CardDescription className="mt-1">{game.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1 font-bold text-primary">
              <Zap className="w-5 h-5" />
              <span>{game.reward}</span>
            </div>
            {!onCooldown && (
              <div className="text-xs mt-1">
                {playsLeft} {playsLeft === 1 ? 'play' : 'plays'} left
              </div>
            )}
          </div>
          
          <Button onClick={() => setIsGameOpen(true)} disabled={onCooldown || playsLeft <= 0}>
            {onCooldown ? (
                <>
                    <Clock className="mr-2 h-4 w-4" />
                    {formatTimeLeft()}
                </>
            ) : (
                <>
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Play Now
                </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isGameOpen} onOpenChange={setIsGameOpen}>
        <DialogContent className="max-w-md">
           <DialogHeader className="sr-only">
             <RadixDialogTitle>{game.title}</RadixDialogTitle>
             <RadixDialogDescription>{game.description}</RadixDialogDescription>
           </DialogHeader>
           <GameComponent onGameWon={handleGameWon} onGameComplete={handleFinishGame} />
        </DialogContent>
      </Dialog>
    </>
  );
}
