
'use client';

import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { sendNotificationToAllUsers, fetchRecipientDisplayName } from '@/services/user-data';
import { Loader2, Send } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  target: z.enum(['all', 'specific']),
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
}).refine(data => {
    if (data.target === 'specific') {
        return !!data.userId && /^AC-[0-9]{6}[A-Z]$/.test(data.userId);
    }
    return true;
}, {
    message: "A valid User ID is required for specific targeting.",
    path: ['userId'],
});


export default function AdminNotificationsPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            target: 'all',
            userId: '',
            title: '',
            description: '',
        },
    });

    const targetValue = form.watch('target');
    const userIdValue = form.watch('userId');

    React.useEffect(() => {
        const handler = setTimeout(async () => {
          if (targetValue === 'specific' && userIdValue && /^AC-[0-9]{6}[A-Z]$/.test(userIdValue)) {
            setIsVerifying(true);
            setRecipientName(null);
            try {
              const name = await fetchRecipientDisplayName(userIdValue);
              setRecipientName(name);
              if (name === 'User not found' || name === "You cannot send cubes to yourself.") {
                form.setError('userId', { type: 'manual', message: name });
              } else {
                form.clearErrors('userId');
              }
            } catch (error) {
              setRecipientName("Error finding user.");
              form.setError('userId', { type: 'manual', message: 'Error finding user.' });
            } finally {
              setIsVerifying(false);
            }
          } else {
            setRecipientName(null);
          }
        }, 500);

        return () => clearTimeout(handler);
      }, [userIdValue, targetValue, form]);


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            if (values.target === 'all') {
                const result = await sendNotificationToAllUsers(values.title, values.description);
                toast({
                    title: "Broadcast Sent",
                    description: `Notifications sent to ${result.successCount} users. ${result.errorCount > 0 ? `${result.errorCount} failed.` : ''}`
                });
            } else if (values.target === 'specific' && values.userId) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where("adsenerId", "==", values.userId));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
                    setIsSubmitting(false);
                    return;
                }
                const userDoc = querySnapshot.docs[0];
                const notificationRef = doc(collection(db, 'users', userDoc.id, 'notifications'));
                await setDoc(notificationRef, {
                    title: values.title,
                    description: values.description,
                    date: new Date(),
                    read: false,
                });

                toast({
                    title: "Notification Sent",
                    description: `Message sent to ${userDoc.data().displayName}.`
                });
            }
            form.reset();
            setRecipientName(null);
        } catch (error) {
            console.error("Failed to send notification:", error);
            toast({
                variant: 'destructive',
                title: "Sending Failed",
                description: "An error occurred while sending the notification.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Send Notifications</h1>
            <Card>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>
                            Send a notification to a specific user or broadcast to everyone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Target Audience</Label>
                            <Controller
                                name="target"
                                control={form.control}
                                render={({ field }) => (
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="all" id="r1" />
                                            <Label htmlFor="r1">All Users</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="specific" id="r2" />
                                            <Label htmlFor="r2">Specific User</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>
                        {targetValue === 'specific' && (
                            <div className="space-y-2">
                                <Label htmlFor="userId">User ID</Label>
                                <Input
                                    id="userId"
                                    placeholder="AC-123456A"
                                    {...form.register('userId')}
                                    className="uppercase"
                                />
                                <div className="h-5 pt-1 text-sm text-muted-foreground">
                                    {isVerifying ? (
                                    <span className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying ID...
                                    </span>
                                    ) : recipientName ? (
                                    <span>
                                        Recipient:{" "}
                                        <span className="font-semibold text-foreground">
                                        {recipientName}
                                        </span>
                                    </span>
                                    ) : null }
                                </div>
                                {form.formState.errors.userId && (
                                    <p className="text-sm font-medium text-destructive">{form.formState.errors.userId.message}</p>
                                )}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" placeholder="e.g. Special Bonus!" {...form.register('title')} />
                             {form.formState.errors.title && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.title.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" placeholder="Describe the notification..." {...form.register('description')} />
                            {form.formState.errors.description && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.description.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Notification
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
