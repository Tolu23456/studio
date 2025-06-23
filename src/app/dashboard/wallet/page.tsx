"use client";

import { WalletHistory } from "@/components/dashboard/wallet-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { Zap } from "lucide-react";

export default function WalletPage() {
  const { userProfile, loading } = useAuth();
  const currentBalance = userProfile?.cubeBalance ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Cube Wallet</h1>
      <Card>
        <CardHeader>
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="flex items-center text-4xl">
            {loading ? (
              <Skeleton className="w-48 h-10" />
            ) : (
              <>
                <Zap className="w-8 h-8 mr-2 text-primary" />
                {currentBalance.toLocaleString()} Cubes
              </>
            )}
          </CardTitle>
        </CardHeader>
      </Card>
      
      <Separator />

      <WalletHistory />
    </div>
  );
}
