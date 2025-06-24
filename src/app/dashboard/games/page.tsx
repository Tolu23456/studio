import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Play Games & Earn</h1>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-primary" />
                Games Coming Soon!
            </CardTitle>
            <CardDescription>
                Get ready for a new way to boost your Cube balance.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">We're working hard to bring you a collection of fun and rewarding games. Check back soon to play and earn more Cubes!</p>
        </CardContent>
      </Card>
    </div>
  );
}
