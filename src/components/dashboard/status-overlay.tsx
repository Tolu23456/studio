
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitSupportTicket } from '@/services/user-data';
import { ShieldAlert, LogOut, MessageSquare, Wrench, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const supportSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters.').max(1000, 'Message cannot exceed 1000 characters.'),
});

type SupportFormData = z.infer<typeof supportSchema>;

export function StatusOverlay({ isMaintenance }: { isMaintenance: boolean }) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: { message: '' },
  });

  const handleSignOut = () => {
    signOut(auth);
  };
  
  const handleSupportSubmit = async (values: SupportFormData) => {
      if (!user || !userProfile) return;
      setIsSubmitting(true);
      try {
        await submitSupportTicket(values.message);
        toast({
            title: 'Support Ticket Submitted',
            description: 'Our team will review your message shortly. We appreciate your patience.',
        });
        form.reset();
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Failed to submit support ticket:', error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your ticket. Please try again later.' });
      } finally {
        setIsSubmitting(false);
      }
  }
  
  const title = isMaintenance ? 'Under Maintenance' : 'Account Disabled';
  const description = isMaintenance
    ? "Adsener is currently undergoing scheduled maintenance. We'll be back online shortly. Thank you for your patience."
    : "Your account has been disabled due to a violation of our terms of service. If you believe this is a mistake, please contact support.";
  const Icon = isMaintenance ? Wrench : ShieldAlert;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader className="items-center">
          <div className="p-4 bg-destructive/10 rounded-full mb-4">
             <Icon className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!isMaintenance && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact Support
                    </Button>
                </DialogTrigger>
                <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Contact Support</DialogTitle>
                        <DialogDescription>
                            Please describe your issue below. Include as much detail as possible.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSupportSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Message</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Please explain why you believe your account was disabled in error..."
                                                rows={6}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Ticket
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
