
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Users, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReferralsPage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.uid;

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Copied to clipboard!",
      description: "Your referral code is ready to be shared.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-10" />
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-12 w-1/2" />
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <div>User not found. Please log in again.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Refer & Earn</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>Share this code with your friends. When they sign up, you both get rewarded!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-md items-center space-x-2">
            <Input
              readOnly
              value={referralCode}
              className="font-mono text-sm"
            />
            <Button size="icon" onClick={handleCopy} aria-label="Copy referral code">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{userProfile.referrals.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">friends have joined using your code</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Referral Earnings</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">Track Cubes earned from referrals</p>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                <div>
                    <h3 className="font-semibold">Share Your Code</h3>
                    <p className="text-muted-foreground">Copy your unique referral code and send it to your friends.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                <div>
                    <h3 className="font-semibold">Friend Signs Up</h3>
                    <p className="text-muted-foreground">Your friend enters your code during registration.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                <div>
                    <h3 className="font-semibold">Earn Rewards</h3>
                    <p className="text-muted-foreground">Once they complete their first task, you both receive a Cube bonus!</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
