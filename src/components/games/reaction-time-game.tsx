
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ReactionTimeGameProps = {
  onGameComplete: () => void;
  onGameWon: (reward: number) => void;
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
        const reward = Math.max(1, 30 - Math.floor(newReactionTime / 100));
        onGameWon(reward);
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

  const renderContent = () => {
    switch (gameState) {
      case 'idle':
        return {
          bg: 'bg-secondary',
          text: <span className="text-secondary-foreground">Click the button below to start.</span>,
          action: <Button onClick={startGame}>Start Game</Button>
        };
      case 'waiting':
        return {
          bg: 'bg-destructive/80',
          text: <span className="text-destructive-foreground">Wait for Green...</span>,
          action: null
        };
      case 'active':
        return {
          bg: 'bg-success',
          text: <span className="text-success-foreground">Click!</span>,
          action: null
        };
      case 'result':
        return {
          bg: 'bg-primary',
          text: (
            <div className="text-primary-foreground">
              <p>Your reaction time: {reactionTime}ms</p>
              <p className="text-sm mt-2">Cubes Earned: {Math.max(1, 30 - Math.floor(reactionTime / 100))}</p>
            </div>
          ),
          action: (
            <div className='flex flex-col sm:flex-row gap-2 justify-center'>
              <Button onClick={startGame} variant="secondary">Play Again</Button>
              <Button onClick={onGameComplete}>Finish Game</Button>
            </div>
          )
        };
      case 'too_soon':
        return {
          bg: 'bg-accent',
          text: <span className="text-accent-foreground">Too Soon! Click to try again.</span>,
          action: <Button onClick={startGame} variant="secondary">Try Again</Button>
        };
    }
  };

  const { bg, text, action } = renderContent();

  return (
    <div className="text-center p-4 space-y-4">
        <h3 className="text-xl font-bold mb-4 font-headline">Reaction Time Test</h3>
        <div
            onClick={handleClick}
            className={cn(
            "w-full h-64 rounded-lg flex items-center justify-center text-center font-bold text-2xl transition-colors cursor-pointer",
            bg
            )}
        >
           {text}
        </div>
        <div className="h-10">
            {action}
        </div>
    </div>
  );
}
