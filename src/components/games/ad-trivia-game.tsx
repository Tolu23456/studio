
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { generateAdTriviaQuestion } from '@/ai/flows/ad-trivia-flow';
import type { AdTriviaQuestionOutput } from '@/ai/flows/ad-trivia-flow';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AdTriviaGameProps = {
  onGameComplete: () => void;
  onGameWon: () => void;
};

type GameStatus = 'loading' | 'playing' | 'feedback';

export function AdTriviaGame({ onGameComplete, onGameWon }: AdTriviaGameProps) {
  const [status, setStatus] = useState<GameStatus>('loading');
  const [questionData, setQuestionData] = useState<AdTriviaQuestionOutput | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const { toast } = useToast();

  const fetchQuestion = useCallback(async () => {
    setStatus('loading');
    setSelectedAnswer(null);
    try {
      const data = await generateAdTriviaQuestion();
      setQuestionData(data);
      setStatus('playing');
    } catch (error) {
      console.error('Failed to generate trivia question:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no!',
        description: 'Could not load a new question. Please try again.',
      });
      onGameComplete(); 
    }
  }, [toast, onGameComplete]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleAnswerSelect = (answer: string) => {
    if (status !== 'playing') return;
    setSelectedAnswer(answer);
    const correct = answer === questionData?.correctAnswer;
    setIsCorrect(correct);
    setStatus('feedback');
  };

  const handleFinish = () => {
    // A "win" in trivia is completing a session, so we call onGameWon here.
    onGameWon();
    onGameComplete();
  };

  const getButtonVariant = (answer: string) => {
    if (status !== 'feedback') {
      return 'outline';
    }
    if (answer === questionData?.correctAnswer) {
      return 'success';
    }
    if (answer === selectedAnswer && answer !== questionData?.correctAnswer) {
      return 'destructive';
    }
    return 'outline';
  };

  if (status === 'loading' || !questionData) {
    return (
      <div className="p-6 space-y-6">
        <h3 className="text-xl font-bold font-headline text-center">Ad Trivia</h3>
        <Skeleton className="h-8 w-3/4 mx-auto mt-4" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center space-y-6">
      <h3 className="text-xl font-bold font-headline">{questionData.question}</h3>
      <div className="grid grid-cols-1 gap-3">
        {questionData.options.map((option) => (
          <Button
            key={option}
            onClick={() => handleAnswerSelect(option)}
            disabled={status === 'feedback'}
            variant={getButtonVariant(option) as any}
            className="h-auto py-3 whitespace-normal justify-start text-left"
          >
            {option}
          </Button>
        ))}
      </div>
      
      {status === 'feedback' && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-lg font-bold">
            {isCorrect ? (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="w-6 h-6" />
                <span>Correct!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="w-6 h-6" />
                <span>Incorrect!</span>
              </div>
            )}
          </div>
          {!isCorrect && (
            <p className="text-sm text-muted-foreground">
              The correct answer was: <strong>{questionData.correctAnswer}</strong>
            </p>
          )}
          <div className="flex gap-4 w-full pt-2">
            <Button onClick={fetchQuestion} variant="secondary" className="flex-1">
              <RotateCw className="mr-2 h-4 w-4" />
              Next Question
            </Button>
            <Button onClick={handleFinish} className="flex-1">
              Finish Game
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
