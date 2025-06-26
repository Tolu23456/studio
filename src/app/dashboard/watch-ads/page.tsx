
'use client';

import { WatchAdCard } from "@/components/dashboard/watch-ad-card";
import type { Ad } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAds } from "@/services/user-data";

export default function WatchAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndFilterAds() {
      setLoading(true);
      try {
        const allAds = await getAds();
        // This is safe because it only runs on the client after hydration
        const unclaimedAds = allAds.filter(ad => ad.isEnabled && !localStorage.getItem(`ad_claimed_${ad.id}`));
        setAds(unclaimedAds);
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAndFilterAds();
  }, []);

  const handleAdClaimed = (adId: string) => {
    setAds(prevAds => prevAds.filter(ad => ad.id !== adId));
  };
  
  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Watch Ads & Earn</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Watch Ads & Earn</h1>
        {ads.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ads.map((ad) => (
                  <WatchAdCard key={ad.id} ad={ad} onAdClaimed={handleAdClaimed} />
              ))}
          </div>
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Film className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground">You've watched all available ads for now. Check back later for more.</p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
