
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Zap, Award, Users, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateCurrentUserProfile } from '@/services/user-data';
import { format } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const profileSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters.").max(30, "Display name cannot exceed 30 characters."),
  photoURL: z.string().url("Please enter a valid URL.").or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      photoURL: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({ 
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL || '',
      });
    }
  }, [userProfile, form]);

  const handleProfileSave = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateCurrentUserProfile(data);
      if (refreshUserProfile) await refreshUserProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
             <Skeleton className="h-96 w-full" />
        </div>
    )
  }
  
  if (!user || !userProfile) {
    return <div>User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
      <form onSubmit={form.handleSubmit(handleProfileSave)}>
        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={form.watch('photoURL') || userProfile.photoURL || undefined} alt="Admin Avatar" />
                        <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 text-center">
                        <h2 className="text-2xl font-semibold">{userProfile.displayName}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">Joined on {format(userProfile.createdAt, 'PP')}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" {...form.register('displayName')} />
                        {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="photoURL">Photo URL</Label>
                        <Input id="photoURL" placeholder="https://example.com/avatar.png" {...form.register('photoURL')} />
                        {form.formState.errors.photoURL && <p className="text-sm text-destructive">{form.formState.errors.photoURL.message}</p>}
                    </div>
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Account Statistics</CardTitle>
                    <CardDescription>Your current progress and earnings.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
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
      </form>
    </div>
  );
}
