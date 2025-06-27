
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Bomb, Star, AlertTriangle } from 'lucide-react';
import styles from './zuma-dash-game.module.css';
import { cn } from '@/lib/utils';

type ZumaDashGameProps = {
  onGameComplete: () => void;
  onGameWon: (reward: number) => void;
};

// Relative sizes
const PLAYER_SIZE_PC = 10;
const OBSTACLE_SIZE_PC = 10;
const CUBE_SIZE_PC = 8;
const PLAYER_SPEED_PC = 3;
const ENTITY_SPEED_PC = 0.8;

type Entity = {
  id: number;
  x: number; // as percentage
  y: number; // as percentage
  rotation: number;
};

export function ZumaDashGame({ onGameComplete, onGameWon }: ZumaDashGameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(50 - PLAYER_SIZE_PC / 2);
  const [obstacles, setObstacles] = useState<Entity[]>([]);
  const [cubes, setCubes] = useState<Entity[]>([]);
  const [hasClaimed, setHasClaimed] = useState(false);
  
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchStartX = useRef(0);
  const playerStartX = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);


  const resetGame = useCallback(() => {
    setPlayerX(50 - PLAYER_SIZE_PC / 2);
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
            return Math.max(0, currentX - PLAYER_SPEED_PC);
        }
        if (keysPressed.current['ArrowRight'] && currentX < 100 - PLAYER_SIZE_PC) {
            return Math.min(100 - PLAYER_SIZE_PC, currentX + PLAYER_SPEED_PC);
        }
        return currentX;
    });
    
    setObstacles((prev) => prev.map(o => ({...o, y: o.y + ENTITY_SPEED_PC})).filter(o => o.y < 100));
    setCubes((prev) => prev.map(c => ({...c, y: c.y + ENTITY_SPEED_PC})).filter(c => c.y < 100));

    if (Math.random() < 0.03) {
      setObstacles((prev) => [...prev, { id: Date.now() + Math.random(), x: Math.random() * (100 - OBSTACLE_SIZE_PC), y: -OBSTACLE_SIZE_PC, rotation: Math.random() * 360 }]);
    }
     if (Math.random() < 0.02) {
      setCubes((prev) => [...prev, { id: Date.now() + Math.random(), x: Math.random() * (100 - CUBE_SIZE_PC), y: -CUBE_SIZE_PC, rotation: 0 }]);
    }
    
    gameLoopRef.current = requestAnimationFrame(gameTick);
  }, [gameState]);
  
  useEffect(() => {
      if (gameState !== 'playing') return;

      const playerRect = { x: playerX, y: 100 - PLAYER_SIZE_PC - 15, width: PLAYER_SIZE_PC, height: PLAYER_SIZE_PC };
      
      for (const obstacle of obstacles) {
        const obstacleRect = { x: obstacle.x, y: obstacle.y, width: OBSTACLE_SIZE_PC, height: OBSTACLE_SIZE_PC };
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
         const cubeRect = { x: cube.x, y: cube.y, width: CUBE_SIZE_PC, height: CUBE_SIZE_PC };
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
    if (!gameAreaRef.current) return;
    e.preventDefault();
    
    const gameWidth = gameAreaRef.current.offsetWidth;
    const currentTouchX = e.touches[0].clientX;
    const deltaX = currentTouchX - touchStartX.current;
    
    const deltaX_pc = (deltaX / gameWidth) * 100;

    const newPlayerX = playerStartX.current + deltaX_pc;
    
    const clampedX = Math.max(0, Math.min(100 - PLAYER_SIZE_PC, newPlayerX));
    setPlayerX(clampedX);
  };


  return (
    <div className={styles.gameContainer}>
      <h3 className="text-xl font-bold font-headline">Zuma Dash</h3>
      <div 
        ref={gameAreaRef}
        className={styles.gameArea}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className={styles.scrollingBg}></div>

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50 p-4 text-center">
            <p className="text-white text-lg font-bold mb-4">Dodge the bombs and collect stars!</p>
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
                    <CardDescription>Stars Collected</CardDescription>
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
                    className={styles.player}
                    style={{ 
                        width: `${PLAYER_SIZE_PC}%`, 
                        height: `${PLAYER_SIZE_PC}%`, 
                        left: `${playerX}%`, 
                        bottom: '15%'
                    }}
                >
                    <Gem className="w-full h-full text-primary" />
                </div>
                {obstacles.map(o => (
                    <div 
                        key={o.id}
                        className={styles.entity}
                        style={{
                            width: `${OBSTACLE_SIZE_PC}%`,
                            height: `${OBSTACLE_SIZE_PC}%`,
                            left: `${o.x}%`,
                            top: `${o.y}%`,
                            transform: `rotate(${o.rotation}deg)`
                        }}
                    >
                        <Bomb className="w-full h-full text-destructive" />
                    </div>
                ))}
                {cubes.map(c => (
                    <div 
                        key={c.id}
                        className={styles.entity}
                        style={{
                            width: `${CUBE_SIZE_PC}%`,
                            height: `${CUBE_SIZE_PC}%`,
                            left: `${c.x}%`,
                            top: `${c.y}%`,
                        }}
                    >
                        <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
                    </div>
                ))}
            </>
        )}
         <div className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-lg font-bold shadow-lg z-10">
            {score}
        </div>
      </div>
    </div>
  );
}
