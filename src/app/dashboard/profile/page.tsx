
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Zap, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user, userProfile, loading, avatarUrl, loadingAvatar } = useAuth();

  if (loading) {
    return (
        <div className="space-y-6">
             <Skeleton className="h-9 w-48" />
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-48" />
                           <Skeleton className="h-5 w-64" />
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    )
  }
  
  if (!user || !userProfile) {
    return <div>User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>View and manage your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {loadingAvatar ? (
                <Skeleton className="h-24 w-24 rounded-full" />
            ) : (
                <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || "https://placehold.co/128x128.png"} alt="User Avatar" />
                <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
                </Avatar>
            )}

            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-semibold">{user.email}</h2>
              <p className="text-sm text-muted-foreground">Joined on {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>Your current progress and earnings on Adsener.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
             <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Zap className="w-8 h-8 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Cube Balance</p>
                    <p className="text-2xl font-bold">{userProfile.cubeBalance.toLocaleString()}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Award className="w-8 h-8 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold">{userProfile.totalEarned.toLocaleString()}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Users className="w-8 h-8 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                    <p className="text-2xl font-bold">{userProfile.referrals.toLocaleString()}</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
