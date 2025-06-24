
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { getAdminDashboardStats, getUserGrowthStats } from "@/services/user-data";
import { Users, Zap, BarChart, Bell, Mail, MessageSquare } from "lucide-react";
import { UserGrowthChart } from "@/components/admin/user-growth-chart";

type AdminStats = {
  totalUsers: number;
  totalCubesAwarded: number;
};

type UserGrowthData = {
  date: string;
  "New Users": number;
};


export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const idToken = await user.getIdToken();
        const [fetchedStats, fetchedUserGrowth] = await Promise.all([
            getAdminDashboardStats(idToken),
            getUserGrowthStats(idToken)
        ]);
        setStats(fetchedStats);
        setUserGrowthData(fetchedUserGrowth as UserGrowthData[]);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString() ?? 0}</div>}
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cubes Awarded</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-36" /> : <div className="text-2xl font-bold">{stats?.totalCubesAwarded.toLocaleString() ?? 0}</div>}
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">Feature in development</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          {loading ? (
              <Card>
                  <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                  <CardContent><Skeleton className="w-full h-[350px]" /></CardContent>
              </Card>
          ) : (
             <UserGrowthChart data={userGrowthData} />
          )}
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Controls</CardTitle>
                    <CardDescription>Quick actions for managing your app and users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-primary" />
                            <span className="font-medium">Send Notification</span>
                        </div>
                        <Button asChild size="sm">
                            <Link href="/admin/notifications">Broadcast</Link>
                        </Button>
                    </div>
                     <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Mail className="w-5 h-5" />
                            <span className="font-medium">Send Email Campaign</span>
                        </div>
                        <Button size="sm" disabled>Coming Soon</Button>
                    </div>
                     <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <MessageSquare className="w-5 h-5" />
                            <span className="font-medium">Manage Content</span>
                        </div>
                        <Button size="sm" disabled>Coming Soon</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
