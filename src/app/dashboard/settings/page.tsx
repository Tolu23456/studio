
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { updateCurrentUserProfile } from '@/services/user-data';

export default function SettingsPage() {
    const { user, userProfile, loading, refreshUserProfile } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handlePreferenceChange = async (type: 'rewardNotifications' | 'promotionalUpdates', value: boolean) => {
        if (!userProfile) return;
        setIsSaving(true);
        
        const currentPrefs = userProfile.notificationPreferences || { rewardNotifications: true, promotionalUpdates: true };
        
        const newPreferences = {
            ...currentPrefs,
            [type]: value,
        };

        try {
            await updateCurrentUserProfile({ notificationPreferences: newPreferences });
            if (refreshUserProfile) await refreshUserProfile();

            toast({
                title: 'Settings Updated',
                description: 'Your notification preferences have been saved.',
            });
        } catch (error) {
            console.error('Failed to update notification settings:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not save your notification settings.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-6 w-48" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!user || !userProfile) {
        return <div>Please log in to view settings.</div>;
    }

    const rewardNotificationsEnabled = userProfile.notificationPreferences?.rewardNotifications ?? true;
    const promotionalUpdatesEnabled = userProfile.notificationPreferences?.promotionalUpdates ?? true;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Email Address</Label>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                     <div>
                        <Label>User ID</Label>
                        <p className="text-sm text-muted-foreground font-mono text-xs">{userProfile.adsenerId}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Change your password and manage security settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/forgot-password">
                        <Button>Reset Password</Button>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-2">You will be sent an email with a link to reset your password.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications from Adsener.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="reward-notifications">Reward Notifications</Label>
                            <p className="text-xs text-muted-foreground">Receive a notification when you earn Cubes.</p>
                        </div>
                        <Switch
                            id="reward-notifications"
                            checked={rewardNotificationsEnabled}
                            onCheckedChange={(checked) => handlePreferenceChange('rewardNotifications', checked)}
                            disabled={isSaving}
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="promo-notifications">Promotional Updates</Label>
                            <p className="text-xs text-muted-foreground">Get updates about new offers and features.</p>
                        </div>
                        <Switch
                            id="promo-notifications"
                            checked={promotionalUpdatesEnabled}
                            onCheckedChange={(checked) => handlePreferenceChange('promotionalUpdates', checked)}
                            disabled={isSaving}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
