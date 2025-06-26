
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ShieldAlert, Box, AlertTriangle, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

type CubeRunnerGameProps = {
  onGameComplete: () => void;
  onGameWon: (reward: number) => void;
};

const GAME_WIDTH = 320;
const GAME_HEIGHT = 500;
const PLAYER_SIZE = 30;
const OBSTACLE_SIZE = 30;
const CUBE_SIZE = 20;
const PLAYER_SPEED = 10;
const ENTITY_SPEED = 5;

type Entity = {
  id: number;
  x: number;
  y: number;
};

export function CubeRunnerGame({ onGameComplete, onGameWon }: CubeRunnerGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
  const [obstacles, setObstacles] = useState<Entity[]>([]);
  const [cubes, setCubes] = useState<Entity[]>([]);
  const [hasClaimed, setHasClaimed] = useState(false);
  
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchStartX = useRef(0);
  const playerStartX = useRef(0);

  const resetGame = useCallback(() => {
    setPlayerX(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
    setObstacles([]);
    setCubes([]);
    setScore(0);
    setHasClaimed(false);
    setGameState('playing');
  }, []);
  
  const gameTick = useCallback(() => {
    if (gameState !== 'playing') return;

    setPlayerX((currentX) => {
        if (keysPressed.current['ArrowLeft'] && currentX > 0) {
            return Math.max(0, currentX - PLAYER_SPEED);
        }
        if (keysPressed.current['ArrowRight'] && currentX < GAME_WIDTH - PLAYER_SIZE) {
            return Math.min(GAME_WIDTH - PLAYER_SIZE, currentX + PLAYER_SPEED);
        }
        return currentX;
    });
    
    setObstacles((prev) => prev.map(o => ({...o, y: o.y + ENTITY_SPEED})).filter(o => o.y < GAME_HEIGHT));
    setCubes((prev) => prev.map(c => ({...c, y: c.y + ENTITY_SPEED})).filter(c => c.y < GAME_HEIGHT));

    if (Math.random() < 0.03) {
      setObstacles((prev) => [...prev, { id: Date.now() + Math.random(), x: Math.random() * (GAME_WIDTH - OBSTACLE_SIZE), y: -OBSTACLE_SIZE }]);
    }
     if (Math.random() < 0.02) {
      setCubes((prev) => [...prev, { id: Date.now() + Math.random(), x: Math.random() * (GAME_WIDTH - CUBE_SIZE), y: -CUBE_SIZE }]);
    }
    
    gameLoopRef.current = requestAnimationFrame(gameTick);
  }, [gameState]);
  
  useEffect(() => {
      if (gameState !== 'playing') return;

      const playerRect = { x: playerX, y: GAME_HEIGHT - PLAYER_SIZE - 20, width: PLAYER_SIZE, height: PLAYER_SIZE };
      
      for (const obstacle of obstacles) {
        const obstacleRect = { x: obstacle.x, y: obstacle.y, width: OBSTACLE_SIZE, height: OBSTACLE_SIZE };
        if (
          playerRect.x < obstacleRect.x + obstacleRect.width &&
          playerRect.x + playerRect.width > obstacleRect.x &&
          playerRect.y < obstacleRect.y + obstacleRect.height &&
          playerRect.y + playerRect.height > obstacleRect.y
        ) {
          setGameState('gameover');
          return;
        }
      }
      
      const newCubes = cubes.filter(cube => {
         const cubeRect = { x: cube.x, y: cube.y, width: CUBE_SIZE, height: CUBE_SIZE };
          if (
              playerRect.x < cubeRect.x + cubeRect.width &&
              playerRect.x + playerRect.width > cubeRect.x &&
              playerRect.y < cubeRect.y + cubeRect.height &&
              playerRect.y + playerRect.height > cubeRect.y
          ) {
              setScore(s => s + 1);
              return false;
          }
          return true;
      });

      if (newCubes.length !== cubes.length) {
          setCubes(newCubes);
      }

  }, [playerX, obstacles, cubes, gameState])

  useEffect(() => {
    if (gameState === 'gameover' && !hasClaimed) {
      onGameWon(score);
      setHasClaimed(true);
    }
  }, [gameState, onGameWon, hasClaimed, score]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameTick);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameTick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    touchStartX.current = e.touches[0].clientX;
    playerStartX.current = playerX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const currentTouchX = e.touches[0].clientX;
    const deltaX = currentTouchX - touchStartX.current;
    
    const newPlayerX = playerStartX.current + deltaX;
    
    const clampedX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newPlayerX));
    setPlayerX(clampedX);
  };


  return (
    <div className="flex flex-col items-center p-4 space-y-4 bg-background rounded-lg w-full">
      <h3 className="text-xl font-bold font-headline">Cube Runner</h3>
      <div 
        className="relative bg-secondary overflow-hidden border-2 border-primary/20 rounded-lg touch-none w-full" 
        style={{ height: GAME_HEIGHT, maxWidth: GAME_WIDTH }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="absolute inset-0 h-full w-full bg-grid-slate-700/[0.1] [background-position:10px_10px]"></div>

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50 p-4 text-center">
            <p className="text-white text-lg font-bold mb-4">Dodge alerts and collect cubes!</p>
            <p className="text-white/80 text-sm mb-6">Use Arrow Keys or Drag to Move</p>
            <Button onClick={resetGame}>Start Game</Button>
          </div>
        )}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 p-4">
             <Card className="w-full max-w-sm text-center animate-in fade-in zoom-in-95">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Game Over</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{score}</p>
                    <CardDescription>Cubes Collected</CardDescription>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button onClick={resetGame} className="w-full" variant="secondary">Play Again</Button>
                    <Button onClick={onGameComplete} className="w-full">Finish Game</Button>
                </CardFooter>
             </Card>
          </div>
        )}

        {gameState === 'playing' && (
            <>
                <div 
                    className="absolute flex items-center justify-center text-primary-foreground"
                    style={{ 
                        width: PLAYER_SIZE, 
                        height: PLAYER_SIZE, 
                        left: playerX, 
                        bottom: 20
                    }}
                >
                    <Zap className="w-full h-full text-primary animate-pulse" />
                </div>
                {obstacles.map(o => (
                    <div 
                        key={o.id}
                        className="absolute flex items-center justify-center"
                        style={{
                            width: OBSTACLE_SIZE,
                            height: OBSTACLE_SIZE,
                            left: o.x,
                            top: o.y,
                        }}
                    >
                        <ShieldAlert className="w-full h-full text-destructive" />
                    </div>
                ))}
                {cubes.map(c => (
                    <div 
                        key={c.id}
                        className="absolute flex items-center justify-center"
                        style={{
                            width: CUBE_SIZE,
                            height: CUBE_SIZE,
                            left: c.x,
                            top: c.y,
                        }}
                    >
                        <Box className="w-full h-full text-accent" />
                    </div>
                ))}
            </>
        )}
         <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground px-3 py-1 rounded-full text-lg font-bold shadow-lg">
            {score}
        </div>
      </div>
    </div>
  );
}
