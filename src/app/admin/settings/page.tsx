'use client';

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

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const handleSave = (feature: string) => {
    toast({
      title: 'Settings Saved',
      description: `${feature} settings have been updated (demo only).`,
    });
  };

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Platform Settings</h1>
      <div className="grid gap-6">
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
                <Label htmlFor="allow-registration">Allow New Registrations</Label>
                <p className="text-xs text-muted-foreground">
                  Turn this off to prevent new users from creating accounts.
                </p>
              </div>
              <Switch id="allow-registration" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="require-verification">Require Email Verification</Label>
                <p className="text-xs text-muted-foreground">
                  Force users to verify their email before accessing the dashboard.
                </p>
              </div>
              <Switch id="require-verification" defaultChecked disabled />
            </div>
             <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="welcome-cubes">Welcome Bonus</Label>
                 <p className="text-xs text-muted-foreground">
                  Number of Cubes a new user receives upon signing up without a referral.
                </p>
                <Input id="welcome-cubes" type="number" defaultValue="50" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={() => handleSave('User & Registration')}>Save</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Content & Rewards</CardTitle>
            <CardDescription>
              Control global reward multipliers and content availability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="ad-multiplier">Global Ad Reward Multiplier</Label>
                 <p className="text-xs text-muted-foreground">
                  Applies a multiplier to all ad-watching rewards. E.g., 1.2 for a 20% bonus.
                </p>
                <Input id="ad-multiplier" type="number" step="0.1" defaultValue="1.0" />
            </div>
             <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="game-multiplier">Global Game Reward Multiplier</Label>
                 <p className="text-xs text-muted-foreground">
                  Applies a multiplier to all game rewards. E.g., 0.9 for a 10% reduction.
                </p>
                <Input id="game-multiplier" type="number" step="0.1" defaultValue="1.0" />
            </div>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
            <Button onClick={() => handleSave('Content & Rewards')}>Save</Button>
          </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className='text-destructive'>Danger Zone</CardTitle>
                <CardDescription>Critical platform-wide actions. Be careful here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                  <div>
                    <Label htmlFor="maintenance-mode" className='text-destructive'>Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Temporarily disable all user-facing functionality for maintenance.
                    </p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button variant="destructive" onClick={() => handleSave('Maintenance Mode')}>Activate</Button>
            </CardFooter>
        </Card>

      </div>
    </div>
  );
}
