
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Zap, Award, Users, Loader2, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateCurrentUserProfile } from '@/services/user-data';
import { format } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters.").max(30, "Display name cannot exceed 30 characters."),
  photoURL: z.string().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;


export default function ProfilePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [dataToSave, setDataToSave] = useState<ProfileFormData | null>(null);

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
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 4MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      form.setValue('photoURL', dataUri, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (data: ProfileFormData) => {
    // If name hasn't changed, just save
    if (!form.formState.dirtyFields.displayName) {
      executeSave(data);
      return;
    }
    // If name has changed, open confirmation dialog
    setDataToSave(data);
    setConfirmOpen(true);
  };

  const executeSave = async (data: ProfileFormData | null) => {
    if (!data) return;
    setIsSaving(true);
    setConfirmOpen(false); // Close dialog if open

    // Create payload based on what changed
    const payload: Partial<ProfileFormData> = {};
    if (form.formState.dirtyFields.displayName) {
      payload.displayName = data.displayName;
    }
    if (form.formState.dirtyFields.photoURL) {
      payload.photoURL = data.photoURL;
    }

    try {
      await updateCurrentUserProfile(payload);
      if (refreshUserProfile) await refreshUserProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved.',
      });
      form.reset(data); // Reset dirty state
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update your profile.',
      });
    } finally {
      setIsSaving(false);
      setDataToSave(null);
    }
  };


  if (loading) {
    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
             <Skeleton className="h-64 w-full" />
             <Skeleton className="h-48 w-full" />
        </div>
    )
  }
  
  if (!user || !userProfile) {
    return <div>User not found.</div>;
  }

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Profile</h1>
      
      <form onSubmit={form.handleSubmit(handleProfileSubmit)}>
        <Card>
            <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update your display name and profile picture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                 <div className="relative group">
                    <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                        <AvatarImage src={form.watch('photoURL') || userProfile.photoURL || undefined} alt="User Avatar" />
                        <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
                    </Avatar>
                     <div 
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    >
                       <Upload className="w-6 h-6 mb-1" />
                       Change
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                    />
                </div>
                
                <div className="space-y-1 text-center sm:text-left">
                    <h2 className="text-2xl font-semibold">{userProfile.displayName}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">Joined on {format(userProfile.createdAt, 'PP')}</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" {...form.register('displayName')} />
                    {form.formState.errors.displayName ? (
                        <p className="text-sm text-destructive h-5">{form.formState.errors.displayName.message}</p>
                      ) : form.formState.dirtyFields.displayName ? (
                        <p className="text-xs text-muted-foreground h-5">Changing your name costs 1,000 Cubes.</p>
                      ) : (
                        <div className="h-5" /> 
                      )}
                </div>
            </div>
            
            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
            </CardContent>
        </Card>
      </form>

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

    <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Name Change</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change your display name? A fee of 1,000 Cubes will be deducted from your balance. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDataToSave(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => executeSave(dataToSave)}>
            Confirm & Pay 1,000 Cubes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
