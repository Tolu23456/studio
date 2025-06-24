"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Game } from "@/lib/types";
import { Gamepad2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const { toast } = useToast();

  const handlePlay = () => {
    toast({
      title: "Game coming soon!",
      description: `The game "${game.title}" is not yet available.`,
    });
  };

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-0">
        <Image
          src={game.imageUrl}
          alt={game.title}
          width={600}
          height={400}
          className="object-cover aspect-video"
          data-ai-hint={game.dataAiHint}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg">{game.title}</CardTitle>
        <CardDescription className="mt-1">{game.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
        <div className="flex items-center gap-1 font-bold text-primary">
            <Zap className="w-5 h-5" />
            <span>{game.reward}</span>
        </div>
        <Button onClick={handlePlay}>
          <Gamepad2 className="mr-2 h-4 w-4" />
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
}
