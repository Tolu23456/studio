
"use client";

import Link from "next/link";
import { TransferCubesForm } from "@/components/dashboard/transfer-cubes-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { Zap, ArrowRight } from "lucide-react";

export default function WalletPage() {
  const { userProfile, loading } = useAuth();
  const currentBalance = userProfile?.cubeBalance ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Cube Wallet</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardDescription>Current Balance</CardDescription>
            <Link href="/dashboard/wallet/history" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View History
                <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CardTitle className="flex items-center text-3xl sm:text-4xl">
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

      <TransferCubesForm />
    </div>
  );
}
