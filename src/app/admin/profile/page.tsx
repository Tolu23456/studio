
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Zap, Award, Users, Loader2, Save, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateCurrentUserProfile } from '@/services/user-data';
import { format } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from 'next/image';
import { enhanceImage } from '@/ai/flows/enhance-image-flow';

const profileSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters.").max(30, "Display name cannot exceed 30 characters."),
  photoURL: z.string().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isEnhancerOpen, setIsEnhancerOpen] = useState(false);
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

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
  
  const handleEnhanceImage = async () => {
    const imageUrl = form.getValues('photoURL');
    if (!imageUrl || !enhancementPrompt) return;
    
    setIsEnhancing(true);
    try {
        const result = await enhanceImage({
            imageDataUri: imageUrl,
            prompt: enhancementPrompt,
        });
        form.setValue('photoURL', result.enhancedImageDataUri, { shouldDirty: true });
        toast({ title: 'Image Enhanced', description: 'The AI has enhanced your image.' });
        setIsEnhancerOpen(false);
        setEnhancementPrompt('');
    } catch (error) {
        console.error('Failed to enhance image:', error);
        toast({ variant: 'destructive', title: 'Enhancement Failed', description: 'Could not enhance the image.' });
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleProfileSave = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateCurrentUserProfile(data);
      if (refreshUserProfile) await refreshUserProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });
      form.reset(data); // Reset dirty state
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
    <>
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
                    <div className="relative group">
                        <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                            <AvatarImage src={form.watch('photoURL') || userProfile.photoURL || undefined} alt="Admin Avatar" />
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
                    <Button type="button" size="sm" variant="secondary" onClick={() => setIsEnhancerOpen(true)} disabled={!form.watch('photoURL')}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Enhance with AI
                    </Button>

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

    <Dialog open={isEnhancerOpen} onOpenChange={setIsEnhancerOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enhance Profile Picture</DialogTitle>
                <DialogDescription>
                    Describe how you want to enhance the image. E.g., "cinematic lighting, fantasy style".
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <Textarea 
                    placeholder="Enter enhancement prompt..."
                    value={enhancementPrompt}
                    onChange={(e) => setEnhancementPrompt(e.target.value)}
                />
                  <div className="mx-auto w-48 h-48 relative rounded-full border bg-muted flex items-center justify-center">
                   {form.watch('photoURL') && <Image src={form.watch('photoURL')} alt="Current profile picture" layout="fill" className="object-cover rounded-full" />}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEnhancerOpen(false)}>Cancel</Button>
                <Button onClick={handleEnhanceImage} disabled={isEnhancing || !enhancementPrompt}>
                    {isEnhancing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enhance
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
