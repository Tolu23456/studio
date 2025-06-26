
'use client';

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
import { claimGameReward, createSimpleNotification } from "@/services/user-data";
import { ReactionTimeGame } from "@/components/games/reaction-time-game";
import { MemoryMatchGame } from "@/components/games/memory-match-game";
import { CubeRunnerGame } from "@/components/games/cube-runner-game";
import { PuzzleBoxGame } from "@/components/games/puzzle-box-game";
import { cn } from "@/lib/utils";

const getGamePlays = () => {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem('game_plays');
    return data ? JSON.parse(data) : {};
};

const setGamePlays = (plays: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('game_plays', JSON.stringify(plays));
};

const GameComponentMap: { [key: string]: React.ElementType } = {
  'g1': CubeRunnerGame,
  'g2': MemoryMatchGame,
  'g3': PuzzleBoxGame,
  'g4': ReactionTimeGame,
  'g5': CubeRunnerGame, // "Endless Runner" uses the same component
};


type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  const { toast } = useToast();
  const { user } = useAuth();
  
  const isEmbedded = !!game.gameUrl;
  
  const MAX_PLAYS = 5;
  const COOLDOWN_HOURS = 1;

  useEffect(() => {
    if (isEmbedded) return;
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
  }, [game.id, isEmbedded]);
  
   useEffect(() => {
    if (isEmbedded || cooldownTime <= 0) return;
    
    const interval = setInterval(async () => {
      const now = new Date().getTime();
      if (now >= cooldownTime) {
        clearInterval(interval);
        setCooldownTime(0);
        setPlayCount(0);
        const allPlays = getGamePlays();
        const newPlays = { ...allPlays };
        delete newPlays[game.id];
        setGamePlays(newPlays);
        
        if (user) {
          try {
            await createSimpleNotification(
              `Plays Refreshed!`, 
              `You can now play '${game.title}' again.`
            );
          } catch (error) {
              console.error("Failed to send refresh notification", error);
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTime, game.id, user, game.title, isEmbedded]);

  const handleStartGame = () => {
    // Consume one play for the entire session
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

    setIsGameOpen(true);
  };

  const handleGameWon = async (scorePayload: number) => {
    // "Play" has already been consumed. This function now only claims rewards.
    if (isEmbedded || !user) {
        if (!user) toast({ variant: "destructive", title: "You must be logged in to claim rewards." });
        return;
    }

    try {
        const actualReward = await claimGameReward(game.id, scorePayload);
        
        if (actualReward > 0) {
            toast({
                title: "Reward Claimed!",
                description: `You've earned ${actualReward} Cubes for playing ${game.title}.`,
            });
        }
    } catch (error) {
        console.error("Failed to claim game reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: "Could not claim your reward. Please try again." });
    }
  };

  const handleFinishGame = () => {
    setIsGameOpen(false);
  }

  const GameComponent = GameComponentMap[game.id];
  
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
  
  const onCooldown = !isEmbedded && cooldownTime > 0 && new Date().getTime() < cooldownTime;
  const playsLeft = MAX_PLAYS - playCount;

  return (
    <>
      <Card className="overflow-hidden flex flex-col transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1.5">
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
        <CardFooter className="p-4 bg-muted/50 flex justify-between items-center gap-2">
          {isEmbedded ? (
             <div className="text-sm text-muted-foreground flex-shrink min-w-0">
                <div className="flex items-center gap-1 font-bold text-primary">
                  <Zap className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">External Game</span>
                </div>
                 <div className="text-xs mt-1">
                    Rewards not tracked
                  </div>
              </div>
          ) : (
            <div className="text-sm text-muted-foreground flex-shrink min-w-0">
                <div className="flex items-center gap-1 font-bold text-primary">
                <Zap className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{game.rewardDescription || "Performance-based"}</span>
                </div>
                {!onCooldown && (
                <div className="text-xs mt-1">
                    {playsLeft} {playsLeft === 1 ? 'play' : 'plays'} left
                </div>
                )}
            </div>
          )}
          
          <Button 
             onClick={isEmbedded ? () => setIsGameOpen(true) : handleStartGame}
             disabled={onCooldown || (!isEmbedded && playsLeft <= 0)} 
             className="flex-shrink-0"
           >
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
        <DialogContent
          className={cn(
            "flex items-center justify-center",
            isEmbedded
              ? "h-full w-full border-0 bg-transparent p-0 shadow-none sm:h-[90vh] sm:w-auto sm:max-w-4xl"
              : "sm:max-w-md"
          )}
        >
          <DialogHeader className="sr-only">
            <RadixDialogTitle>{game.title}</RadixDialogTitle>
            <RadixDialogDescription>{game.description}</RadixDialogDescription>
          </DialogHeader>
          {isEmbedded ? (
            <div className="h-full w-full overflow-hidden sm:rounded-lg bg-black">
              <iframe
                src={game.gameUrl}
                title={game.title}
                className="h-full w-full border-0"
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : GameComponent ? (
            <GameComponent onGameWon={handleGameWon} onGameComplete={handleFinishGame} />
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold">Game Not Available</h3>
              <p className="text-muted-foreground">
                This game component could not be loaded. It may not be configured correctly.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
