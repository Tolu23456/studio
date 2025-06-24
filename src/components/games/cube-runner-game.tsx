
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

type CubeRunnerGameProps = {
  onGameComplete: () => void;
  onGameWon: () => void;
};

const GAME_WIDTH = 300;
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

      const playerRect = { x: playerX, y: GAME_HEIGHT - PLAYER_SIZE - 10, width: PLAYER_SIZE, height: PLAYER_SIZE };
      
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
      onGameWon();
      setHasClaimed(true);
    }
  }, [gameState, onGameWon, hasClaimed]);

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

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <h3 className="text-xl font-bold font-headline">Cube Runner</h3>
      <div 
        className="relative bg-secondary overflow-hidden border-2 border-primary/20 rounded-lg" 
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50">
            <p className="text-white text-lg font-bold mb-4">Use Arrow Keys to Move</p>
            <Button onClick={resetGame}>Start Game</Button>
          </div>
        )}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70 text-white">
            <h4 className="text-3xl font-bold">Game Over</h4>
            <p className="text-lg mt-2">Your Score: {score}</p>
            <div className="flex gap-4 mt-6">
                <Button onClick={resetGame} variant="secondary">Play Again</Button>
                <Button onClick={onGameComplete}>Finish Game</Button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
            <>
                <div 
                    className="absolute bg-primary rounded-md"
                    style={{ 
                        width: PLAYER_SIZE, 
                        height: PLAYER_SIZE, 
                        left: playerX, 
                        bottom: 10
                    }}
                />
                {obstacles.map(o => (
                    <div 
                        key={o.id}
                        className="absolute bg-destructive rounded-md"
                        style={{
                            width: OBSTACLE_SIZE,
                            height: OBSTACLE_SIZE,
                            left: o.x,
                            top: o.y,
                        }}
                    />
                ))}
                {cubes.map(c => (
                    <div 
                        key={c.id}
                        className="absolute bg-accent rounded-sm"
                        style={{
                            width: CUBE_SIZE,
                            height: CUBE_SIZE,
                            left: c.x,
                            top: c.y,
                        }}
                    />
                ))}
            </>
        )}
      </div>
       <p className="text-lg font-bold">Score: {score}</p>
    </div>
  );
}
