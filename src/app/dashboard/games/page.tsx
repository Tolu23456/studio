
import { GameCard } from "@/components/dashboard/game-card";
import type { Game } from "@/lib/types";

const games: Game[] = [
  {
    id: "g1",
    title: "One Tap Dash",
    description: "Tap once to make a cube dash through rotating obstacles. Timing is everything.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "abstract obstacle",
  },
  {
    id: "g2",
    title: "Shadow Jump",
    description: "Jump between moving platforms. One misstep = fall.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "platformer game",
  },
  {
    id: "g3",
    title: "Don’t Touch the Red",
    description: "Navigate through a maze where only one path is safe. Red tiles = restart.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "maze puzzle",
  },
   {
    id: "g4",
    title: "Quick Flip",
    description: "A memory match game that gets faster every round. Flip, match, or fail.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "memory game",
  },
   {
    id: "g5",
    title: "Laser Reflex",
    description: "Tap only when the green laser appears. Red laser = auto fail.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "reaction test",
  },
  {
    id: "g6",
    title: "Tiny Tapper",
    description: "Tap a shrinking dot before it vanishes. Dot gets faster with each round.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "fast tap",
  },
  {
    id: "g7",
    title: "Stack Tower",
    description: "Stack falling blocks as perfectly as you can. One tiny misalignment shrinks your base.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "stacking game",
  },
  {
    id: "g8",
    title: "Speed Type",
    description: "Type short, random words before the time bar ends. Increases in difficulty.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "typing game",
  },
  {
    id: "g9",
    title: "Reverse Swipe",
    description: "Swipe in the opposite direction of the arrow. Your brain will betray you.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "brain teaser",
  },
  {
    id: "g10",
    title: "Tilt Maze",
    description: "Tilt or swipe to move a ball through tight mazes with one wrong exit.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "maze ball",
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
