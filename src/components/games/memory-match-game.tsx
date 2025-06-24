
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Apple, Banana, Carrot, Grape, Pizza, Sandwich, CheckCircle, BrainCircuit } from 'lucide-react';

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
    <div className="text-center p-4 space-y-4">
      <h3 className="text-xl font-bold font-headline">Memory Match</h3>
      <p className="text-sm text-muted-foreground">Find all the matching pairs!</p>

      <div className="grid grid-cols-4 gap-3 mx-auto w-fit">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            disabled={isWon || isChecking || card.isFlipped}
            className={cn(
              'w-16 h-16 rounded-lg flex items-center justify-center transition-colors duration-300',
              card.isFlipped || card.isMatched
                ? 'bg-secondary'
                : 'bg-primary/20 hover:bg-primary/30',
              card.isMatched && 'bg-success/20 !cursor-default'
            )}
          >
            {(card.isFlipped || card.isMatched) ? (
              <card.Icon className={cn('w-8 h-8', card.isMatched ? 'text-success' : 'text-secondary-foreground')} />
            ) : (
               <BrainCircuit className="w-8 h-8 text-primary/50" />
            )}
          </button>
        ))}
      </div>

      <p className="font-semibold">Moves: {moves}</p>

      {isWon && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in pt-4">
          <div className="flex items-center gap-2 text-lg font-bold text-success">
            <CheckCircle className="w-6 h-6" />
            <span>You Won!</span>
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
