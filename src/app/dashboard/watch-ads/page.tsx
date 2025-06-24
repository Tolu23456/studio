
'use client';

import { WatchAdCard } from "@/components/dashboard/watch-ad-card";
import type { Ad } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const allAds: Ad[] = [
  {
    id: "1",
    title: "Explore the New TechGadget Pro",
    description: "Watch a short video about the latest innovation in personal tech.",
    duration: 30,
    reward: 15,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "tech gadget"
  },
  {
    id: "2",
    title: "Quick & Healthy Snack Ideas",
    description: "Discover delicious and easy-to-make snacks for your busy lifestyle.",
    duration: 25,
    reward: 12,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "healthy food"
  },
  {
    id: "3",
    title: "Adventure Awaits: Travel Deals",
    description: "Get inspired for your next vacation with these amazing travel packages.",
    duration: 45,
    reward: 20,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "travel vacation"
  },
   {
    id: "4",
    title: "Mobile Gaming Madness",
    description: "Check out the hottest new mobile game that's taking the world by storm.",
    duration: 15,
    reward: 8,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "mobile game"
  },
];


export default function WatchAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is safe because it only runs on the client after hydration
    const unclaimedAds = allAds.filter(ad => !localStorage.getItem(`ad_claimed_${ad.id}`));
    setAds(unclaimedAds);
    setLoading(false);
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
