
'use client';

import { WatchAdCard } from "@/components/dashboard/watch-ad-card";
import type { Ad } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAds } from "@/services/user-data";
import { useAuth } from "@/context/auth-context";
import { isToday, startOfDay } from 'date-fns';

export default function WatchAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth(); // Get userProfile from context

  useEffect(() => {
    async function fetchAndFilterAds() {
      setLoading(true);
      try {
        const allAds = await getAds();
        
        let availableAds = allAds.filter(ad => ad.isEnabled);

        // Filter out ads that have been claimed today using server-verified data
        if (userProfile?.claimedAdIds && userProfile.adResetTimestamp) {
          const adResetDate = startOfDay(userProfile.adResetTimestamp);
          if (isToday(adResetDate)) {
            const claimedIds = userProfile.claimedAdIds;
            availableAds = availableAds.filter(ad => !claimedIds.includes(ad.id));
          }
        }
        
        // This client-side check is a UX enhancement to hide ads that are being watched but not yet claimed
        // across browser tabs/sessions. The source of truth is the Firestore check on claim.
        const unclaimedAds = availableAds.filter(ad => !localStorage.getItem(`ad_watched_${ad.id}`));
        
        setAds(unclaimedAds);
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // Only run when userProfile is loaded to ensure we have claim data
    if (userProfile) {
      fetchAndFilterAds();
    } else if (!userProfile && !loading) {
      // Handle case where user is logged out but auth isn't loading
      setLoading(false);
    }
  }, [userProfile, loading]);

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
