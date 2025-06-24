
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, Lightbulb } from 'lucide-react';

type PuzzleBoxGameProps = {
  onGameComplete: () => void;
};

const GRID_SIZE = 3;

const createInitialBoard = () => {
    // Start with a solved board and click random cells to create a puzzle
    // This ensures the puzzle is always solvable.
    let board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    const clicks = Math.floor(Math.random() * 5) + 3; // 3 to 7 random clicks

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
    
    // Ensure it's not already solved
    const allOff = board.every(row => row.every(cell => !cell));
    const allOn = board.every(row => row.every(cell => cell));
    if (allOff || allOn) {
        return createInitialBoard(); // Recurse if we accidentally solved it
    }

    return board;
}

export function PuzzleBoxGame({ onGameComplete }: PuzzleBoxGameProps) {
    const [board, setBoard] = useState(createInitialBoard);
    const [moves, setMoves] = useState(0);
    const [isWon, setIsWon] = useState(false);

    const checkWinCondition = useCallback((currentBoard: boolean[][]) => {
        const allOff = currentBoard.every(row => row.every(cell => !cell));
        const allOn = currentBoard.every(row => row.every(cell => cell));
        if (allOff || allOn) {
            setIsWon(true);
        }
    }, []);

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
        
        setBoard(newBoard);
        setMoves(m => m + 1);
        checkWinCondition(newBoard);
    };
    
    const resetGame = () => {
        setBoard(createInitialBoard());
        setMoves(0);
        setIsWon(false);
    }

    return (
        <div className="text-center p-4 space-y-4">
            <h3 className="text-xl font-bold font-headline">Puzzle Box</h3>
            <p className="text-sm text-muted-foreground">Turn all lights ON or OFF to unlock the box!</p>

            <div 
                className="grid gap-2 mx-auto"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: '15rem' }}
            >
                {board.map((row, rIdx) => 
                    row.map((isLit, cIdx) => (
                        <button
                            key={`${rIdx}-${cIdx}`}
                            onClick={() => handleTileClick(rIdx, cIdx)}
                            disabled={isWon}
                            className={cn(
                                "w-20 h-20 rounded-lg border-2 transition-all",
                                isLit ? 'bg-primary/80 border-primary shadow-lg shadow-primary/30' : 'bg-muted border-border',
                                "disabled:opacity-70 disabled:cursor-not-allowed"
                            )}
                            aria-label={`Tile at row ${rIdx + 1}, column ${cIdx + 1}. Status: ${isLit ? 'On' : 'Off'}`}
                        >
                            <Lightbulb className={cn("w-8 h-8 mx-auto", isLit ? 'text-primary-foreground' : 'text-muted-foreground/50')} />
                        </button>
                    ))
                )}
            </div>

            <p className="font-semibold">Moves: {moves}</p>

            {isWon && (
                <div className="flex flex-col items-center gap-4 animate-in fade-in pt-4">
                    <div className="flex items-center gap-2 text-lg font-bold text-success">
                        <CheckCircle className="w-6 h-6" />
                        <span>Puzzle Solved!</span>
                    </div>
                    <div className='flex flex-col sm:flex-row gap-2 justify-center w-full'>
                        <Button onClick={resetGame} variant="secondary">Play Again</Button>
                        <Button onClick={onGameComplete}>Finish Game</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
