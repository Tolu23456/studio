
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Rabbit, Turtle, Timer } from 'lucide-react';
import styles from './bubble-pop-game.module.css';

type BubblePopGameProps = {
  onGameComplete: () => void;
  onGameWon: (reactionTime: number) => void;
};

type GameState = 'idle' | 'waiting' | 'active' | 'result' | 'too_soon';

export function BubblePopGame({ onGameComplete, onGameWon }: BubblePopGameProps) {
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
    } else if (gameState === 'idle' || gameState === 'result' || gameState === 'too_soon') {
        startGame();
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

  const renderBubble = () => {
    switch (gameState) {
      case 'idle':
        return <div className="text-center"><p className="text-2xl font-semibold">Click to Start</p><p className="text-muted-foreground">Pop the bubble when it turns green!</p></div>
      case 'waiting':
        return <div className={cn(styles.bubble, styles.waiting)}><p className="text-3xl font-bold text-destructive-foreground">Wait...</p></div>;
      case 'active':
        return <div className={cn(styles.bubble, styles.active)}><p className="text-5xl font-extrabold text-success-foreground">POP!</p></div>;
      case 'too_soon':
          return <div className={cn(styles.bubble, styles.tooSoon)}><p className="text-xl font-semibold text-accent-foreground">Too Soon!</p></div>;
      case 'result':
        const { icon, text } = getResultContent();
        return (
            <Card className="w-full max-w-sm text-center border-0 shadow-none bg-transparent">
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
  };

  return (
    <div className={styles.gameContainer}>
        <div className={styles.bg}></div>
        <div className={styles.content}>
            <div className={styles.header}>
                <h3 className={styles.title}>Bubble Pop</h3>
            </div>
            <div
                onClick={handleClick}
                className={styles.clickArea}
            >
                {renderBubble()}
            </div>
            <div className={styles.footer}>
                {(gameState === 'result' || gameState === 'too_soon') && (
                    <div className='flex flex-col sm:flex-row gap-2 justify-center pt-2'>
                        <Button onClick={startGame} variant="secondary">Play Again</Button>
                        <Button onClick={onGameComplete}>Finish Game</Button>
                    </div>
                )}
                 {gameState === 'idle' && (
                    <div className='flex flex-col sm:flex-row gap-2 justify-center pt-2'>
                        <Button onClick={onGameComplete}>Close</Button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
