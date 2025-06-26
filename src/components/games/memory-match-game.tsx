
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Apple, Banana, Carrot, Grape, Pizza, Sandwich, CheckCircle, BrainCircuit, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type MemoryMatchGameProps = {
  onGameComplete: () => void;
  onGameWon: (moves: number) => void;
};

const ICONS = [Apple, Banana, Carrot, Grape, Pizza, Sandwich];

type CardType = {
  id: number;
  Icon: React.ElementType;
  isFlipped: boolean;
  isMatched: boolean;
};

const createShuffledBoard = (): CardType[] => {
  const duplicatedIcons = [...ICONS, ...ICONS];
  return duplicatedIcons
    .map(Icon => ({ Icon, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ Icon }, index) => ({
      id: index,
      Icon,
      isFlipped: false,
      isMatched: false,
    }));
};

export function MemoryMatchGame({ onGameComplete, onGameWon }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<CardType[]>(createShuffledBoard);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  useEffect(() => {
    if (flippedIndices.length !== 2) return;

    setIsChecking(true);
    const [firstIndex, secondIndex] = flippedIndices;
    
    setMoves(m => m + 1);

    if (cards[firstIndex].Icon === cards[secondIndex].Icon) {
      setCards(prevCards =>
        prevCards.map((card, index) =>
          index === firstIndex || index === secondIndex
            ? { ...card, isMatched: true }
            : card
        )
      );
      setFlippedIndices([]);
      setIsChecking(false);
    } else {
      const timeoutId = setTimeout(() => {
        setCards(prevCards =>
          prevCards.map((card, index) =>
            index === firstIndex || index === secondIndex
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedIndices([]);
        setIsChecking(false);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [flippedIndices, cards]);

  useEffect(() => {
    const gameWon = cards.length > 0 && cards.every(card => card.isMatched);
    if (gameWon) {
      setIsWon(true);
      if (!hasClaimed) {
        onGameWon(moves);
        setHasClaimed(true);
      }
    }
  }, [cards, onGameWon, hasClaimed, moves]);

  const handleCardClick = (index: number) => {
    if (isWon || isChecking || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    const newFlippedIndices = [...flippedIndices, index];
    
    setCards(prevCards =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );

    setFlippedIndices(newFlippedIndices);
  };
  
  const resetGame = () => {
    setCards(createShuffledBoard());
    setFlippedIndices([]);
    setMoves(0);
    setIsWon(false);
    setIsChecking(false);
    setHasClaimed(false);
  };

  return (
    <div className="text-center p-4 space-y-4 bg-background rounded-lg">
      <h3 className="text-xl font-bold font-headline">Memory Match</h3>
      <p className="text-sm text-muted-foreground">Find all the matching pairs!</p>

      <div className="grid grid-cols-4 gap-3 mx-auto w-fit [perspective:1000px]">
        {cards.map((card, index) => (
          <div key={card.id} className="w-16 h-16 group" onClick={() => handleCardClick(index)}>
            <div
                className={cn(
                    "relative w-full h-full rounded-lg transition-transform duration-500 [transform-style:preserve-3d]",
                    card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : '',
                    !isWon && 'cursor-pointer'
                )}
            >
                {/* Back of Card */}
                <div className="absolute w-full h-full rounded-lg flex items-center justify-center bg-primary/20 hover:bg-primary/30 [backface-visibility:hidden]">
                    <BrainCircuit className="w-8 h-8 text-primary/50" />
                </div>
                {/* Front of Card */}
                <div className={cn(
                    "absolute w-full h-full rounded-lg flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]",
                    card.isMatched ? 'bg-success/20' : 'bg-secondary'
                )}>
                    <card.Icon className={cn('w-8 h-8', card.isMatched ? 'text-success' : 'text-secondary-foreground')} />
                </div>
            </div>
          </div>
        ))}
      </div>

      <p className="font-semibold text-lg">Moves: {moves}</p>

      {isWon && (
         <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 p-4">
             <Card className="w-full max-w-sm text-center animate-in fade-in zoom-in-95">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-2">
                        <PartyPopper className="h-8 w-8 text-success" />
                    </div>
                    <CardTitle className="text-2xl font-headline">You Won!</CardTitle>
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
