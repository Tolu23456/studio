'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Rabbit, Turtle, Timer, PartyPopper } from 'lucide-react';

type ReactionTimeGameProps = {
  onGameComplete: () => void;
  onGameWon: (reactionTime: number) => void;
};

type GameState = 'idle' | 'waiting' | 'active' | 'result' | 'too_soon';

export function ReactionTimeGame({ onGameComplete, onGameWon }: ReactionTimeGameProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [hasClaimed, setHasClaimed] = useState(false);

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setGameState('waiting');
    setReactionTime(0);
    setHasClaimed(false);
    const delay = Math.random() * 3000 + 2000;

    timeoutRef.current = setTimeout(() => {
      setGameState('active');
      setStartTime(Date.now());
    }, delay);
  }, []);
  
  const handleClick = () => {
    if (gameState === 'waiting') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setGameState('too_soon');
    } else if (gameState === 'active') {
      const endTime = Date.now();
      const newReactionTime = endTime - startTime;
      setReactionTime(newReactionTime);
      setGameState('result');
      if (!hasClaimed) {
        onGameWon(newReactionTime);
        setHasClaimed(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getResultContent = () => {
    if (reactionTime <= 250) return { icon: <Rabbit className="h-8 w-8 text-success" />, text: "Lightning Fast!" };
    if (reactionTime <= 400) return { icon: <Timer className="h-8 w-8 text-primary" />, text: "Good Reflexes!" };
    return { icon: <Turtle className="h-8 w-8 text-destructive" />, text: "A Bit Slow!" };
  }

  const renderContent = () => {
    switch (gameState) {
      case 'idle':
        return {
          bg: 'bg-secondary',
          content: <p className="text-2xl font-semibold text-secondary-foreground">Click anywhere to start</p>,
        };
      case 'waiting':
        return {
          bg: 'bg-destructive/80',
          content: <p className="text-3xl font-bold text-destructive-foreground animate-pulse">Wait for Green...</p>,
        };
      case 'active':
        return {
          bg: 'bg-success',
          content: <p className="text-5xl font-extrabold text-success-foreground">CLICK!</p>,
        };
      case 'result':
        const { icon, text } = getResultContent();
        return {
            bg: 'bg-background',
            content: (
                 <Card className="w-full max-w-sm text-center border-0 shadow-none">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                           {icon}
                        </div>
                        <CardTitle className="text-2xl font-headline">{text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-bold">{reactionTime}<span className="text-2xl text-muted-foreground">ms</span></p>
                        <CardDescription>Your Reaction Time</CardDescription>
                    </CardContent>
                 </Card>
            )
        }
      case 'too_soon':
        return {
          bg: 'bg-accent',
          content: <p className="text-2xl font-semibold text-accent-foreground">Too Soon!</p>,
        };
    }
  };

  const { bg, content } = renderContent();

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 space-y-4 bg-background rounded-lg h-full">
        <h3 className="text-xl font-bold mb-4 font-headline flex-shrink-0">Reaction Time Test</h3>
        <div className="w-full flex-grow flex items-center justify-center">
            <div
                onClick={handleClick}
                className={cn(
                "w-full h-64 max-w-md rounded-lg flex items-center justify-center text-center font-bold transition-colors duration-200 cursor-pointer",
                bg
                )}
            >
            {content}
            </div>
        </div>
        <div className="h-24 flex items-center justify-center flex-shrink-0">
            {gameState === 'idle' && <Button onClick={startGame}>Start Game</Button>}
            {(gameState === 'result' || gameState === 'too_soon') && (
                <div className='flex flex-col sm:flex-row gap-2 justify-center pt-2'>
                    <Button onClick={startGame} variant="secondary">Play Again</Button>
                    <Button onClick={onGameComplete}>Finish Game</Button>
                </div>
            )}
        </div>
    </div>
  );
}
