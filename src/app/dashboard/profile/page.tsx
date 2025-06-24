
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Zap, Award, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadProfilePicture } from '@/services/user-data';

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 2MB.',
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfilePicture(file);
      // The onSnapshot listener in AuthContext will handle the refresh automatically.
      toast({
        title: 'Profile Picture Updated',
        description: 'Your new avatar has been saved.',
      });
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not update your profile picture. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
             <Card>
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>View and manage your personal details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-48" />
                           <Skeleton className="h-5 w-64" />
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
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
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
            <div className="relative group">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={userProfile.photoURL || undefined} alt="User Avatar" />
                    <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
                </Avatar>
                <div 
                    onClick={handleAvatarClick}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Change"}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={isUploading}
                />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-semibold">{userProfile.displayName}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
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
