import { WatchAdCard } from "@/components/dashboard/watch-ad-card";
import type { Ad } from "@/lib/types";

const ads: Ad[] = [
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
  return (
    <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Watch Ads & Earn</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => (
                <WatchAdCard key={ad.id} ad={ad} />
            ))}
        </div>
    </div>
  );
}
