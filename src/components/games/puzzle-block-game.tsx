
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './puzzle-block-game.module.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trophy } from 'lucide-react';

const GRID_SIZE = 8;

const PIECE_SHAPES = {
  // Colors are Tailwind classes for hsl(var(--primary))
  I: { shape: [[1, 1, 1, 1]], color: 'bg-primary' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-primary' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-primary' },
  L: { shape: [[1, 0], [1, 0], [1, 1]], color: 'bg-primary' },
  J: { shape: [[0, 1], [0, 1], [1, 1]], color: 'bg-primary' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-primary' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-primary' },
  DOT: { shape: [[1]], color: 'bg-primary' },
  SMALL_L: { shape: [[1, 0], [1, 1]], color: 'bg-primary' },
};

type Piece = keyof typeof PIECE_SHAPES;
type Grid = (string | null)[][];

const createEmptyGrid = (): Grid => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

type PuzzleBlockGameProps = {
  onGameComplete: () => void;
  onGameWon: (score: number) => void;
};

export function PuzzleBlockGame({ onGameComplete, onGameWon }: PuzzleBlockGameProps) {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<{ piece: Piece, index: number } | null>(null);
  const [preview, setPreview] = useState<{ cells: { r: number, c: number }[], valid: boolean } | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);

  const generatePieces = useCallback(() => {
    const pieceKeys = Object.keys(PIECE_SHAPES) as Piece[];
    const newPieces = Array(3).fill(null).map(() => pieceKeys[Math.floor(Math.random() * pieceKeys.length)]);
    setPieces(newPieces);
  }, []);

  useEffect(() => {
    generatePieces();
  }, [generatePieces]);

  const canPlace = useCallback((currentGrid: Grid, piece: Piece, r: number, c: number) => {
    const shape = PIECE_SHAPES[piece].shape;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          const newR = r + i;
          const newC = c + j;
          if (newR >= GRID_SIZE || newC >= GRID_SIZE || newR < 0 || newC < 0 || currentGrid[newR][newC]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);
  
  const checkGameOver = useCallback((currentGrid: Grid, currentPieces: Piece[]) => {
    if (currentPieces.every(p => p === null)) return false;
    for (const piece of currentPieces) {
      if(piece === null) continue;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlace(currentGrid, piece, r, c)) {
            return false;
          }
        }
      }
    }
    return true;
  }, [canPlace]);

  useEffect(() => {
    if (!pieces.length || pieces.every(p => p === null)) return;
    
    if (checkGameOver(grid, pieces)) {
      setIsGameOver(true);
      if (!hasClaimed) {
        onGameWon(score);
        setHasClaimed(true);
      }
    }
  }, [grid, pieces, checkGameOver, onGameWon, score, hasClaimed]);

  const handleDrop = (r: number, c: number) => {
    if (!draggedPiece || !preview?.valid) {
      setPreview(null);
      return;
    }

    const { piece, index } = draggedPiece;
    const shape = PIECE_SHAPES[piece].shape;
    let newGrid = grid.map(row => [...row]);
    let blocksPlaced = 0;
    
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          newGrid[r + i][c + j] = PIECE_SHAPES[piece].color;
          blocksPlaced++;
        }
      }
    }

    // Clear lines
    let rowsToClear: number[] = [];
    let colsToClear: number[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (newGrid[i].every(cell => cell !== null)) rowsToClear.push(i);
      if (newGrid.every(row => row[i] !== null)) colsToClear.push(i);
    }
    
    let linesCleared = 0;
    if (rowsToClear.length > 0 || colsToClear.length > 0) {
        linesCleared = rowsToClear.length + colsToClear.length;
        const clearedGrid = newGrid.map((row, rowIndex) => 
            rowsToClear.includes(rowIndex) ? Array(GRID_SIZE).fill(null) : row.map((cell, colIndex) => 
                colsToClear.includes(colIndex) ? null : cell
            )
        );
        newGrid = clearedGrid;
    }
    
    const newScore = score + blocksPlaced + (linesCleared * 20 * linesCleared);
    setScore(newScore);
    setGrid(newGrid);

    const newPieces = [...pieces];
    newPieces[index] = null;
    setPieces(newPieces);

    if (newPieces.every(p => p === null)) {
      generatePieces();
    }

    setDraggedPiece(null);
    setPreview(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, r: number, c: number) => {
    e.preventDefault();
    if (!draggedPiece) return;
    const { piece } = draggedPiece;
    const valid = canPlace(grid, piece, r, c);
    
    const shape = PIECE_SHAPES[piece].shape;
    const cells: { r: number, c: number }[] = [];
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          cells.push({ r: r + i, c: c + j });
        }
      }
    }
    setPreview({ cells, valid });
  };

  const resetGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    generatePieces();
    setIsGameOver(false);
    setHasClaimed(false);
  }

  const renderPiece = (piece: Piece, index: number) => {
    if (!piece) return <div key={index} className={styles.piece} />;
    const { shape, color } = PIECE_SHAPES[piece];
    return (
      <div
        key={index}
        className={cn(styles.piece, draggedPiece?.index === index && styles.dragging)}
        draggable
        onDragStart={() => setDraggedPiece({ piece, index })}
        onDragEnd={() => { setDraggedPiece(null); setPreview(null); }}
      >
        {shape.map((row, r) =>
          row.map((cell, c) =>
            cell ? <div key={`${r}-${c}`} className={cn(styles.block, color)} /> : <div key={`${r}-${c}`} />
          )
        )}
      </div>
    );
  };
  
  return (
    <div className={styles.gameContainer}>
        {isGameOver && (
             <div className={styles.gameOver}>
                <Card className="w-full max-w-sm text-center animate-in fade-in zoom-in-95">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
                           <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Game Over!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{score}</p>
                        <CardDescription>Final Score</CardDescription>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button onClick={resetGame} className="w-full" variant="secondary">Play Again</Button>
                        <Button onClick={onGameComplete} className="w-full">Finish Game</Button>
                    </CardFooter>
                 </Card>
            </div>
        )}
      
        <div className='text-center'>
            <h1 className={styles.title}>Puzzle Block</h1>
            <div id="scoreBoard" className={styles.scoreBoard}>Score: <span id="score">{score}</span></div>
        </div>
      
        <div className={styles.gameBoard} onDragLeave={() => setPreview(null)}>
            {grid.map((row, r) =>
            row.map((cell, c) => {
                const isPreview = preview?.cells.some(p => p.r === r && p.c === c);
                return (
                <div
                    key={`${r}-${c}`}
                    className={cn(styles.cell, cell && styles.filled, isPreview && (preview.valid ? styles.previewValid : styles.previewInvalid))}
                    style={cell ? { backgroundColor: '' } : {}}
                    onDrop={() => handleDrop(r, c)}
                    onDragOver={(e) => handleDragOver(e, r, c)}
                ></div>
                );
            })
            )}
        </div>

        <div className={styles.piecesContainer}>
            {pieces.map((p, i) => renderPiece(p, i))}
        </div>
    </div>
  );
}
