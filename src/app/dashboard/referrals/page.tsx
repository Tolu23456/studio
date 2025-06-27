
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Users, Gift, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ReferredUser } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

export default function ReferralsPage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const referralCode = userProfile?.adsenerId;

  useEffect(() => {
    if (!user) {
        setListLoading(false);
        return;
    };
    setListLoading(true);
    const referredUsersRef = collection(db, 'users', user.uid, 'referredUsers');
    const q = query(referredUsersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            displayName: doc.data().displayName,
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
        } as ReferredUser));
        setReferredUsers(users);
        setListLoading(false);
    }, (error) => {
        console.error("Error fetching referred users:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your referral list.",
        });
        setListLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


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
            <Button size="icon" onClick={handleCopy} aria-label="Copy referral code" disabled={!referralCode}>
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
                <div className="text-2xl font-bold">{userProfile.totalReferralEarnings.toLocaleString()} Cubes</div>
                <p className="text-xs text-muted-foreground">Cubes earned from your referrals</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Your Invited Friends</CardTitle>
            <CardDescription>A list of friends who have successfully joined using your code.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Date Joined</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {listLoading ? (
                        <>
                            <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                            <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                        </>
                    ) : referredUsers.length > 0 ? (
                        referredUsers.map((referredUser) => (
                            <TableRow key={referredUser.id}>
                                <TableCell className="font-medium">{referredUser.displayName}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{format(referredUser.createdAt, 'PP')}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                                    <UserPlus className="w-8 h-8" />
                                    <span>You haven't referred anyone yet.</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>


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
