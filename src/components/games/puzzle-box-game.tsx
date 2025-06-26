'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lightbulb, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type PuzzleBoxGameProps = {
  onGameComplete: () => void;
  onGameWon: (moves: number) => void;
};

const GRID_SIZE = 3;

const createInitialBoard = () => {
    let board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    const clicks = Math.floor(Math.random() * 5) + 3;

    const toggleLights = (b: boolean[][], r: number, c: number) => {
        const newBoard = b.map(row => [...row]);
        const directions = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];
        directions.forEach(([dr, dc]) => {
            const newR = r + dr;
            const newC = c + dc;
            if (newR >= 0 && newR < GRID_SIZE && newC >= 0 && newC < GRID_SIZE) {
                newBoard[newR][newC] = !newBoard[newR][newC];
            }
        });
        return newBoard;
    };
    
    for (let i = 0; i < clicks; i++) {
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);
        board = toggleLights(board, r, c);
    }
    
    const allOff = board.every(row => row.every(cell => !cell));
    const allOn = board.every(row => row.every(cell => cell));
    if (allOff || allOn) {
        return createInitialBoard();
    }

    return board;
}

export function PuzzleBoxGame({ onGameComplete, onGameWon }: PuzzleBoxGameProps) {
    const [board, setBoard] = useState(createInitialBoard);
    const [moves, setMoves] = useState(0);
    const [isWon, setIsWon] = useState(false);
    const [hasClaimed, setHasClaimed] = useState(false);

    const checkWinCondition = useCallback((currentBoard: boolean[][]) => {
        const allOff = currentBoard.every(row => row.every(cell => !cell));
        const allOn = currentBoard.every(row => row.every(cell => cell));
        if (allOff || allOn) {
            setIsWon(true);
            if (!hasClaimed) {
              onGameWon(moves + 1); // Pass final move count
              setHasClaimed(true);
            }
        }
    }, [onGameWon, hasClaimed, moves]);

    const handleTileClick = (row: number, col: number) => {
        if (isWon) return;

        let newBoard = board.map(r => [...r]);
        const directions = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];

        directions.forEach(([dr, dc]) => {
            const newR = row + dr;
            const newC = col + dc;
            if (newR >= 0 && newR < GRID_SIZE && newC >= 0 && newC < GRID_SIZE) {
                newBoard[newR][newC] = !newBoard[newR][newC];
            }
        });
        
        const newMoves = moves + 1;
        setBoard(newBoard);
        setMoves(newMoves);
        checkWinCondition(newBoard);
    };
    
    const resetGame = () => {
        setBoard(createInitialBoard());
        setMoves(0);
        setIsWon(false);
        setHasClaimed(false);
    }

    return (
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-4 bg-background rounded-lg h-full">
            <div className="flex-shrink-0">
                <h3 className="text-xl font-bold font-headline">Puzzle Box</h3>
                <p className="text-sm text-muted-foreground">Turn all lights ON or OFF to unlock the box!</p>
            </div>
            
            <div className="flex-grow flex items-center justify-center w-full">
                <div 
                    className="grid gap-2 aspect-square w-full max-w-xs"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                >
                    {board.map((row, rIdx) => 
                        row.map((isLit, cIdx) => (
                            <button
                                key={`${rIdx}-${cIdx}`}
                                onClick={() => handleTileClick(rIdx, cIdx)}
                                disabled={isWon}
                                className={cn(
                                    "w-full h-full rounded-lg border-2 transition-all duration-300 flex items-center justify-center",
                                    isLit 
                                        ? 'bg-primary/80 border-primary shadow-[0_0_15px_hsl(var(--primary))]' 
                                        : 'bg-muted border-border shadow-inner',
                                    "disabled:opacity-70 disabled:cursor-not-allowed"
                                )}
                                aria-label={`Tile at row ${rIdx + 1}, column ${cIdx + 1}. Status: ${isLit ? 'On' : 'Off'}`}
                            >
                                <Lightbulb className={cn("w-1/2 h-1/2 transition-colors", isLit ? 'text-primary-foreground' : 'text-muted-foreground/50')} />
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-shrink-0">
                <p className="font-semibold text-lg">Moves: {moves}</p>
            </div>


            {isWon && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 p-4">
                     <Card className="w-full max-w-sm text-center animate-in fade-in zoom-in-95">
                        <CardHeader>
                             <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-2">
                                <PartyPopper className="h-8 w-8 text-success" />
                            </div>
                            <CardTitle className="text-2xl font-headline">Puzzle Solved!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{moves}</p>
                            <CardDescription>Moves Taken</CardDescription>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                             <Button onClick={resetGame} className="w-full" variant="secondary">Play Again</Button>
                             <Button onClick={onGameComplete} className="w-full">Finish Game</Button>
                        </CardFooter>
                     </Card>
                </div>
            )}
        </div>
    );
}
