
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getPlatformSettings, updatePlatformSettings } from '@/services/user-data';
import type { PlatformSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const settingsSchema = z.object({
  allowNewRegistrations: z.boolean(),
  welcomeBonus: z.coerce.number().min(0, 'Welcome bonus must be non-negative.'),
  globalAdRewardMultiplier: z.coerce.number().min(0, 'Multiplier must be non-negative.'),
  globalGameRewardMultiplier: z.coerce.number().min(0, 'Multiplier must be non-negative.'),
  maintenanceMode: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivatingMaintenance, setIsActivatingMaintenance] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const settings = await getPlatformSettings();
        form.reset(settings);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load platform settings.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [form, toast]);
  
  const handleSave = async (data: SettingsFormData, section: string) => {
      if (section === 'maintenance') {
          setIsActivatingMaintenance(true);
      } else {
          setIsSaving(true);
      }

      try {
        await updatePlatformSettings(data);
        toast({
          title: 'Settings Saved',
          description: `${section} settings have been updated successfully.`,
        });
      } catch (error) {
        console.error(`Failed to save ${section} settings:`, error);
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: `Could not save ${section} settings. Please try again.`,
        });
      } finally {
          if (section === 'maintenance') {
              setIsActivatingMaintenance(false);
          } else {
              setIsSaving(false);
          }
      }
  };
  
  if (loading) {
      return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Platform Settings</h1>
             <div className="grid gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
             </div>
        </div>
      )
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Platform Settings</h1>
      <div className="grid gap-6">
        <form onSubmit={form.handleSubmit(data => handleSave(data, 'User & Registration'))}>
          <Card>
            <CardHeader>
              <CardTitle>User & Registration</CardTitle>
              <CardDescription>
                Manage settings related to user accounts and sign-ups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="allowNewRegistrations">Allow New Registrations</Label>
                  <p className="text-xs text-muted-foreground">
                    Turn this off to prevent new users from creating accounts.
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="allowNewRegistrations"
                  render={({ field }) => <Switch id="allowNewRegistrations" checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="require-verification">Require Email Verification</Label>
                  <p className="text-xs text-muted-foreground">
                    Force users to verify their email before accessing the dashboard.
                  </p>
                </div>
                <Switch id="require-verification" checked={true} disabled />
              </div>
              <div className="space-y-2 rounded-lg border p-4">
                  <Label htmlFor="welcomeBonus">Welcome Bonus</Label>
                  <p className="text-xs text-muted-foreground">
                    Number of Cubes a new user receives upon signing up without a referral.
                  </p>
                  <Input id="welcomeBonus" type="number" {...form.register('welcomeBonus')} />
                  {form.formState.errors.welcomeBonus && <p className='text-sm text-destructive'>{form.formState.errors.welcomeBonus.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save General Settings
              </Button>
            </CardFooter>
          </Card>
        </form>
        
        <form onSubmit={form.handleSubmit(data => handleSave(data, 'Content & Rewards'))}>
          <Card>
            <CardHeader>
              <CardTitle>Content & Rewards</CardTitle>
              <CardDescription>
                Control global reward multipliers and content availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg border p-4">
                  <Label htmlFor="globalAdRewardMultiplier">Global Ad Reward Multiplier</Label>
                  <p className="text-xs text-muted-foreground">
                    Applies a multiplier to all ad-watching rewards. E.g., 1.2 for a 20% bonus.
                  </p>
                  <Input id="globalAdRewardMultiplier" type="number" step="0.1" {...form.register('globalAdRewardMultiplier')} />
                  {form.formState.errors.globalAdRewardMultiplier && <p className='text-sm text-destructive'>{form.formState.errors.globalAdRewardMultiplier.message}</p>}
              </div>
              <div className="space-y-2 rounded-lg border p-4">
                  <Label htmlFor="globalGameRewardMultiplier">Global Game Reward Multiplier</Label>
                  <p className="text-xs text-muted-foreground">
                    Applies a multiplier to all game rewards. E.g., 0.9 for a 10% reduction.
                  </p>
                  <Input id="globalGameRewardMultiplier" type="number" step="0.1" {...form.register('globalGameRewardMultiplier')} />
                  {form.formState.errors.globalGameRewardMultiplier && <p className='text-sm text-destructive'>{form.formState.errors.globalGameRewardMultiplier.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving}>
                 {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save Reward Settings
              </Button>
            </CardFooter>
          </Card>
        </form>
        
        <form onSubmit={form.handleSubmit(data => handleSave(data, 'maintenance'))}>
            <Card>
                <CardHeader>
                    <CardTitle className='text-destructive'>Danger Zone</CardTitle>
                    <CardDescription>Critical platform-wide actions. Be careful here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                    <div>
                        <Label htmlFor="maintenanceMode" className='text-destructive'>Maintenance Mode</Label>
                        <p className="text-xs text-muted-foreground">
                        Temporarily disable all user-facing functionality for maintenance.
                        </p>
                    </div>
                    <Controller
                        control={form.control}
                        name="maintenanceMode"
                        render={({ field }) => <Switch id="maintenanceMode" checked={field.value} onCheckedChange={field.onChange} />}
                    />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button variant="destructive" type="submit" disabled={isActivatingMaintenance}>
                        {isActivatingMaintenance && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        Update Maintenance Mode
                    </Button>
                </CardFooter>
            </Card>
        </form>

      </div>
    </div>
  );
}
