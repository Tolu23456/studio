
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
import { PuzzleBlockGame } from "@/components/games/puzzle-block-game";
import { DotConnectGame } from "@/components/games/dot-connect-game";
import { BubblePopGame } from "@/components/games/bubble-pop-game";
import { ZumaDashGame } from "@/components/games/zuma-dash-game";
import { cn } from "@/lib/utils";

const MAX_PLAYS = 5;
const COOLDOWN_HOURS = 1;

const getGameData = (gameId: string) => {
    if (typeof window === 'undefined') return { count: 0, cooldownUntil: 0 };
    const data = localStorage.getItem('game_plays');
    const allPlays = data ? JSON.parse(data) : {};
    return allPlays[gameId] || { count: 0, cooldownUntil: 0 };
};

const setGameData = (gameId: string, data: { count: number, cooldownUntil: number | null }) => {
    if (typeof window === 'undefined') return;
    const allPlaysData = localStorage.getItem('game_plays');
    const allPlays = allPlaysData ? JSON.parse(allPlaysData) : {};
    allPlays[gameId] = data;
    localStorage.setItem('game_plays', JSON.stringify(allPlays));
};

const GameComponentMap: { [key: string]: React.ElementType } = {
  'g1': CubeRunnerGame,
  'g2': MemoryMatchGame,
  'g3': PuzzleBoxGame,
  'g4': ReactionTimeGame,
  'g5': CubeRunnerGame,
  'g6': DotConnectGame,
  'g7': BubblePopGame,
  'g8': ZumaDashGame,
  'g9': PuzzleBlockGame,
};

type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameData, setGameDataState] = useState({ count: 0, cooldownUntil: 0 });
  const [timeLeft, setTimeLeft] = useState('');
  const [hasClaimed, setHasClaimed] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  
  const isEmbedded = !!game.gameUrl;

  useEffect(() => {
    if (isEmbedded) return;

    const initialData = getGameData(game.id);
    setGameDataState(initialData);

    const { cooldownUntil } = initialData;
    const now = new Date().getTime();

    if (cooldownUntil > now) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = cooldownUntil - now;
        if (diff <= 0) {
          setTimeLeft('');
          const allPlays = JSON.parse(localStorage.getItem('game_plays') || '{}');
          delete allPlays[game.id];
          localStorage.setItem('game_plays', JSON.stringify(allPlays));
          setGameDataState({ count: 0, cooldownUntil: 0 });
          createSimpleNotification(`Plays Refreshed!`, `You can now play '${game.title}' again.`).catch(console.error);
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [game.id, isEmbedded, game.title]);

  const handleStartGame = () => {
     if (isEmbedded) {
        window.open(game.gameUrl, '_blank');
        return;
    }

    let currentData = getGameData(game.id);
    const now = new Date().getTime();
    
    if (currentData.cooldownUntil > now) {
        toast({ title: "Game on Cooldown", description: `You can play again in ${timeLeft}.` });
        return;
    }

    currentData.count++;
    
    if (currentData.count >= MAX_PLAYS) {
        currentData.cooldownUntil = now + COOLDOWN_HOURS * 60 * 60 * 1000;
        toast({ title: "Play limit reached", description: `You can play this game again in ${COOLDOWN_HOURS} hour.` });
    }

    setGameData(game.id, currentData);
    setGameDataState(currentData);
    setHasClaimed(false);
    setIsGameOpen(true);
  };

  const handleGameWon = async (scorePayload: number) => {
    if (isEmbedded || !user || hasClaimed) {
        if (!user) toast({ variant: "destructive", title: "You must be logged in to claim rewards." });
        return;
    }

    setHasClaimed(true);

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
  
  const onCooldown = !isEmbedded && gameData.cooldownUntil > new Date().getTime();
  const playsLeft = MAX_PLAYS - gameData.count;

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
             onClick={handleStartGame}
             disabled={onCooldown || (!isEmbedded && playsLeft <= 0)} 
             className="flex-shrink-0"
           >
            {onCooldown ? (
                <>
                    <Clock className="mr-2 h-4 w-4" />
                    {timeLeft}
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
            "p-0 max-w-none w-full h-full flex items-center justify-center bg-transparent border-0 shadow-none",
            "sm:w-[calc(100%-2rem)] sm:h-[calc(100%-2rem)] sm:max-w-7xl sm:max-h-5xl",
          )}
           onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <RadixDialogTitle>{game.title}</RadixDialogTitle>
            <RadixDialogDescription>{game.description}</RadixDialogDescription>
          </DialogHeader>
          <div className="w-full h-full bg-background rounded-lg">
             {isEmbedded ? (
                 <iframe 
                    src={game.gameUrl}
                    title={game.title}
                    className="w-full h-full border-0 rounded-lg"
                    sandbox="allow-scripts allow-same-origin"
                 ></iframe>
             ) : GameComponent ? (
                <GameComponent onGameWon={handleGameWon} onGameComplete={handleFinishGame} />
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <h3 className="text-lg font-semibold">Game Not Available</h3>
                  <p className="text-muted-foreground">
                    This game component could not be loaded. It may not be configured correctly.
                  </p>
                   <Button onClick={handleFinishGame} className="mt-4">Close</Button>
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
