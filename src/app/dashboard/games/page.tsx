
'use client';

import { GameCard } from "@/components/dashboard/game-card";
import type { Game } from "@/lib/types";
import { useEffect, useState } from 'react';
import { getGames } from '@/services/user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Gamepad2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      try {
        const fetchedGames = await getGames();
        setGames(fetchedGames.filter(g => g.isEnabled));
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);
  
  if (loading) {
     return (
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Play Games & Earn</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 flex-grow">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="p-4 bg-muted/50 mt-auto">
                      <Skeleton className="h-10 w-full" />
                  </div>
              </div>
            ))}
          </div>
        </div>
      )
  }

  return (
    <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Play Games & Earn</h1>
        {games.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                  <GameCard key={game.id} game={game} />
              ))}
          </div>
        ) : (
           <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Gamepad2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">No Games Available</h3>
                <p className="text-muted-foreground">The admin hasn't enabled any games yet. Check back later!</p>
            </CardContent>
          </Card>
        )}
        <div className="text-center text-muted-foreground mt-8 py-4">
            More games coming soon!
        </div>
    </div>
  );
}
