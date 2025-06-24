"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, Award } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function OverviewCards() {
  const { userProfile, loading } = useAuth();

  const stats = [
    {
      title: "Cube Balance",
      getValue: (profile: any) => profile?.cubeBalance?.toLocaleString() ?? '0',
      icon: <Zap className="h-4 w-4 text-muted-foreground" />,
      description: "Your current spendable Cubes",
    },
    {
      title: "Total Earned",
      getValue: (profile: any) => profile?.totalEarned?.toLocaleString() ?? '0',
      icon: <Award className="h-4 w-4 text-muted-foreground" />,
      description: "Lifetime Cube earnings"
    },
    {
      title: "Referrals",
      getValue: (profile: any) => profile?.referrals?.toLocaleString() ?? '0',
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: "Users you have referred"
    },
  ];

  if (loading) {
    return (
      <>
        <Card><CardHeader className="pb-2"><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
        <Card><CardHeader className="pb-2"><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
        <Card><CardHeader className="pb-2"><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
      </>
    )
  }

  return (
    <>
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={cn(stat.title === 'Referrals' && 'animate-referral-glow')}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.getValue(userProfile)}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
