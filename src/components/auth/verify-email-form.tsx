
'use client';

import { useState, useEffect } from 'react';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useAuth } from '@/context/auth-context';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function VerifyEmailForm() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        if (auth && user && !user.emailVerified) {
            const intervalId = setInterval(async () => {
                if (auth.currentUser) {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                        clearInterval(intervalId);
                    }
                }
            }, 3000); 

            return () => clearInterval(intervalId);
        }
    }, [user]);

    const handleResendEmail = async () => {
        if (!user || isSending || cooldown > 0 || !auth) return;
        
        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: 'Verification Email Sent',
                description: 'A new verification link has been sent to your email address.',
            });
            setCooldown(60); 
        } catch (error) {
            console.error('Error resending verification email:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to send verification email. Please try again later.',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleSignOut = async () => {
        if (!auth) return;
        await signOut(auth);
    };
    
    if (!isFirebaseConfigured) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <MailCheck className="w-12 h-12 text-primary mb-4" />
                    <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Feature Disabled</AlertTitle>
                        <AlertDescription>
                            Firebase is not configured correctly. Email verification is currently unavailable.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }


    return (
        <Card className="w-full max-w-md">
            <CardHeader className="items-center text-center">
                <MailCheck className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
                <CardDescription>
                    We've sent a verification link to <span className="font-semibold text-foreground">{user?.email}</span>. Please check your inbox and spam folder.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleResendEmail}
                    disabled={isSending || cooldown > 0}
                    className="w-full"
                >
                    {isSending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    Once you've verified your email, you will be redirected automatically.
                </p>
                <div className="mt-4 text-center text-sm">
                   Wrong account?{" "}
                   <button onClick={handleSignOut} className="underline">
                       Sign out
                   </button>
                </div>
            </CardContent>
        </Card>
    );
}
