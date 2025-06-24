
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';

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

    const handleResendEmail = async () => {
        if (!user || isSending || cooldown > 0) return;
        
        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: 'Verification Email Sent',
                description: 'A new verification link has been sent to your email address.',
            });
            setCooldown(60); // 60 second cooldown
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
        await signOut(auth);
    };

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
                    Clicked the link? You can try to <Link href="/dashboard" className="underline font-semibold">continue to the dashboard</Link> or refresh the page.
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
