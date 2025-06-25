
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BarChart, Settings, AlertCircle } from 'lucide-react';
import { getAllUsersForAdmin } from '@/services/user-data';
import { subWeeks, isAfter } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUsers, setNewUsers] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const users = await getAllUsersForAdmin();
        setTotalUsers(users.length);

        const oneWeekAgo = subWeeks(new Date(), 1);
        const recentUsers = users.filter(user => isAfter(user.createdAt, oneWeekAgo));
        setNewUsers(recentUsers.length);

      } catch (err: any) {
        console.error("Failed to fetch admin dashboard data:", err);
        setError("Could not fetch user data. This might be due to a network issue or incorrect Firestore permissions. Please ensure your Firestore database is set up correctly and your security rules allow admin access.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);
  
  if (error) {
     return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     )
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{newUsers.toLocaleString()} since last week
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">Monitoring system operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Configured</div>
            <p className="text-xs text-muted-foreground">No issues reported</p>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Recent Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Admin activity log will be displayed here.</p>
        </CardContent>
       </Card>
    </div>
  );
}
