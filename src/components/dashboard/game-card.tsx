
"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle as RadixDialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@/lib/types";
import { Gamepad2, Zap, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { claimGameReward } from "@/services/user-data";
import { cn } from "@/lib/utils";
import { ReactionTimeGame } from "@/components/games/reaction-time-game";
import { CubeRunnerGame } from "@/components/games/cube-runner-game";
import { AdTriviaGame } from "@/components/games/ad-trivia-game";

// A placeholder for games that are not yet implemented.
const ComingSoonGame = () => (
    <div className="p-6 text-center space-y-4">
        <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground/50" />
        <h3 className="text-xl font-bold font-headline">Coming Soon!</h3>
        <p className="text-muted-foreground">This exciting game is still under development. Please check back later to play.</p>
    </div>
);

// Map game IDs to their respective components.
const GameComponentMap: { [key: string]: React.ElementType } = {
  'g1': CubeRunnerGame,
  'g2': AdTriviaGame,
  'g6': ReactionTimeGame, // Reaction Time game is implemented
};


type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const [gameState, setGameState] = useState<'idle' | 'completed'>('idle');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const { toast } = useToast();
  const { user, refreshUserProfile } = useAuth();

  const handleGameComplete = () => {
    setIsGameOpen(false);
    setGameState('completed');
  }

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
        // Reset state to allow playing again
        setGameState('idle');
    } catch (error) {
        console.error("Failed to claim game reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: "Could not claim your reward. Please try again." });
    } finally {
        setIsClaiming(false);
    }
  };

  // Determine which game component to render. Fallback to ComingSoonGame.
  const GameComponent = GameComponentMap[game.id] || ComingSoonGame;

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
          <div className="flex items-center gap-1 font-bold text-primary">
              <Zap className="w-5 h-5" />
              <span>{game.reward}</span>
          </div>
          
          {gameState === 'idle' && (
              <Button onClick={() => setIsGameOpen(true)}>
                <Gamepad2 className="mr-2 h-4 w-4" />
                Play Now
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
        </CardFooter>
      </Card>

      <Dialog open={isGameOpen} onOpenChange={setIsGameOpen}>
        <DialogContent className="max-w-md">
           <DialogHeader className="sr-only">
             <RadixDialogTitle>{game.title}</RadixDialogTitle>
             <DialogDescription>{game.description}</DialogDescription>
           </DialogHeader>
           <GameComponent onGameComplete={handleGameComplete} />
        </DialogContent>
      </Dialog>
    </>
  );
}
