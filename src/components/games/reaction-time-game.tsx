
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ReactionTimeGameProps = {
  onGameComplete: () => void;
};

// 'idle': Initial state, ready to start.
// 'waiting': The game has started, user must wait for the color change.
// 'active': The color has changed, user must click.
// 'result': User clicked, showing the reaction time.
// 'too_soon': User clicked before the color change.
type GameState = 'idle' | 'waiting' | 'active' | 'result' | 'too_soon';

export function ReactionTimeGame({ onGameComplete }: ReactionTimeGameProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);

  // Use a ref for the timeout to easily clear it.
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setGameState('waiting');
    setReactionTime(0);
    const delay = Math.random() * 3000 + 2000; // 2-5 second delay

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
      setReactionTime(endTime - startTime);
      setGameState('result');
    }
  };

  // Cleanup timeout on unmount
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
          text: <span className="text-primary-foreground">Your reaction time: {reactionTime}ms</span>,
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
          text: <span className="text-accent-foreground">Too Soon!</span>,
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
            "w-full h-64 rounded-lg flex items-center justify-center font-bold text-2xl transition-colors cursor-pointer",
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
