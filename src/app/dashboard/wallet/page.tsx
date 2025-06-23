import { WalletHistory } from "@/components/dashboard/wallet-history";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Zap } from "lucide-react";

export default function WalletPage() {
  const currentBalance = 12530;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Cube Wallet</h1>
      <Card>
        <CardHeader>
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="flex items-center text-4xl">
            <Zap className="w-8 h-8 mr-2 text-primary" />
            {currentBalance.toLocaleString()} Cubes
          </CardTitle>
        </CardHeader>
      </Card>
      <Separator />
      <WalletHistory />
    </div>
  );
}
