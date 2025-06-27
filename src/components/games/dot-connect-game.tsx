
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper } from 'lucide-react';
import styles from './dot-connect-game.module.css';
import { cn } from '@/lib/utils';

type DotConnectGameProps = {
  onGameComplete: () => void;
  onGameWon: (moves: number) => void;
};

const GRID_SIZE = 6;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];

type Dot = { r: number; c: number };
type Level = { pairs: { color: string; start: Dot; end: Dot }[] };

const generateLevel = (): Level => {
  const levelColors = [...COLORS].sort(() => 0.5 - Math.random()).slice(0, 4);
  const usedPositions: { [key: string]: boolean } = {};
  const pairs = levelColors.map(color => {
    let start, end;
    do {
      start = { r: Math.floor(Math.random() * GRID_SIZE), c: Math.floor(Math.random() * GRID_SIZE) };
    } while (usedPositions[`${start.r}-${start.c}`]);
    usedPositions[`${start.r}-${start.c}`] = true;
    do {
      end = { r: Math.floor(Math.random() * GRID_SIZE), c: Math.floor(Math.random() * GRID_SIZE) };
    } while (usedPositions[`${end.r}-${end.c}`]);
    usedPositions[`${end.r}-${end.c}`] = true;
    return { color, start, end };
  });
  return { pairs };
};

export function DotConnectGame({ onGameComplete, onGameWon }: DotConnectGameProps) {
  const [level, setLevel] = useState<Level>(generateLevel);
  const [paths, setPaths] = useState<{ [color: string]: Dot[] }>({});
  const [activeDrag, setActiveDrag] = useState<{ color: string; path: Dot[] } | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hasClaimed, setHasClaimed] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  
  const dotsMap = useMemo(() => {
    const map: { [key: string]: { color: string; type: 'start' | 'end' } } = {};
    level.pairs.forEach(({ color, start, end }) => {
      map[`${start.r}-${start.c}`] = { color, type: 'start' };
      map[`${end.r}-${end.c}`] = { color, type: 'end' };
    });
    return map;
  }, [level]);

  const completedColors = useMemo(() => Object.keys(paths), [paths]);

  useEffect(() => {
    if (completedColors.length === level.pairs.length) {
      setIsWon(true);
      if (!hasClaimed) {
        onGameWon(moves);
        setHasClaimed(true);
      }
    }
  }, [completedColors, level.pairs.length, onGameWon, moves, hasClaimed]);

  const getCoordsFromEvent = (e: React.MouseEvent | React.TouchEvent): { r: number; c: number } | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const c = Math.floor((x / rect.width) * GRID_SIZE);
    const r = Math.floor((y / rect.height) * GRID_SIZE);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      return { r, c };
    }
    return null;
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, r: number, c: number) => {
    e.preventDefault();
    const dotInfo = dotsMap[`${r}-${c}`];
    if (!dotInfo || completedColors.includes(dotInfo.color)) return;
    
    setMoves(prev => prev + 1);
    setActiveDrag({ color: dotInfo.color, path: [{ r, c }] });
  };
  
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeDrag) return;
    e.preventDefault();

    const coords = getCoordsFromEvent(e);
    if (!coords) return;

    const lastPoint = activeDrag.path[activeDrag.path.length - 1];
    if (coords.r === lastPoint.r && coords.c === lastPoint.c) return;

    setActiveDrag(prev => prev ? { ...prev, path: [...prev.path, coords] } : null);
  };
  
  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeDrag) return;
    e.preventDefault();

    const lastPoint = activeDrag.path[activeDrag.path.length - 1];
    const targetDot = level.pairs.find(p => p.color === activeDrag.color)?.end;
    
    if (targetDot && lastPoint.r === targetDot.r && lastPoint.c === targetDot.c) {
      setPaths(prev => ({ ...prev, [activeDrag.color]: activeDrag.path }));
    }
    
    setActiveDrag(null);
  };
  
  const resetGame = () => {
    setLevel(generateLevel());
    setPaths({});
    setActiveDrag(null);
    setIsWon(false);
    setMoves(0);
    setHasClaimed(false);
  };

  const getPathData = (path: Dot[]): string => {
    if (!boardRef.current || path.length === 0) return '';
    const rect = boardRef.current.getBoundingClientRect();
    const cellWidth = rect.width / GRID_SIZE;
    const cellHeight = rect.height / GRID_SIZE;
    
    return path.map((p, i) => {
      const x = p.c * cellWidth + cellWidth / 2;
      const y = p.r * cellHeight + cellHeight / 2;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  return (
    <div className={styles.gameContainer}>
        {isWon && (
             <div className={styles.winOverlay}>
                <Card className="w-full max-w-sm text-center animate-in fade-in zoom-in-95">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-2">
                           <PartyPopper className="h-8 w-8 text-success" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Level Complete!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{moves}</p>
                        <CardDescription>Moves Taken</CardDescription>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button onClick={resetGame} className="w-full" variant="secondary">Next Level</Button>
                        <Button onClick={onGameComplete} className="w-full">Finish Game</Button>
                    </CardFooter>
                 </Card>
            </div>
        )}
      <div className={styles.header}>
        <h3 className={styles.title}>Dot Connect</h3>
        <p className={styles.description}>Connect the matching colored dots without crossing paths.</p>
      </div>
      
      <div 
        ref={boardRef}
        className={styles.boardContainer}
        onMouseMove={handleDragMove}
        onTouchMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
        onMouseLeave={handleDragEnd} // End drag if mouse leaves the board
      >
        <div className={styles.boardGrid} style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`}}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const r = Math.floor(i / GRID_SIZE);
            const c = i % GRID_SIZE;
            const dotInfo = dotsMap[`${r}-${c}`];
            return (
              <div
                key={i}
                className={styles.cell}
                onMouseDown={(e) => handleDragStart(e, r, c)}
                onTouchStart={(e) => handleDragStart(e, r, c)}
              >
                {dotInfo && (
                  <div className={styles.dot} style={{ backgroundColor: dotInfo.color }} />
                )}
              </div>
            );
          })}
        </div>
        <svg className={styles.svgOverlay}>
          {Object.entries(paths).map(([color, path]) => (
            <path key={color} d={getPathData(path)} className={styles.path} style={{ stroke: color }} />
          ))}
          {activeDrag && (
            <path d={getPathData(activeDrag.path)} className={cn(styles.path, styles.pathActive)} style={{ stroke: activeDrag.color }} />
          )}
        </svg>
      </div>
      
      <div className={styles.footer}>
        <p className={styles.moves}>Moves: {moves}</p>
      </div>
    </div>
  );
}
