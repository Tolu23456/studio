import { GameCard } from "@/components/dashboard/game-card";
import type { Game } from "@/lib/types";

const games: Game[] = [
  {
    id: "g1",
    title: "Cube Runner",
    description: "Navigate the endless tunnel and collect cubes. The more you collect, the more you earn!",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "abstract runner",
  },
  {
    id: "g3",
    title: "Puzzle Box",
    description: "Solve intricate puzzles to unlock the box. Fewer moves mean a bigger reward.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "puzzle box",
  },
  {
    id: "g4",
    title: "Memory Match",
    description: "Match pairs of brand logos against the clock. A classic test of memory with rewards for efficiency.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "memory game",
  },
   {
    id: "g5",
    title: "Word Finder",
    description: "Find hidden words related to marketing and advertising in a grid of letters.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "word search",
  },
   {
    id: "g6",
    title: "Reaction Time",
    description: "Click the target as soon as it appears. Test your reflexes for bigger cube rewards!",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "reaction test",
  },
];


export default function GamesPage() {
  return (
    <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Play Games & Earn</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
                <GameCard key={game.id} game={game} />
            ))}
        </div>
    </div>
  );
}
