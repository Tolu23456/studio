
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { sendNotificationToAllUsers, fetchRecipientDisplayName } from '@/services/user-data';
import { Loader2, Send, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  target: z.enum(['all', 'specific']),
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  isHtml: z.boolean().optional(),
}).refine(data => {
    if (data.target === 'specific') {
        return !!data.userId && /^[0-9]{6}[A-Z]$/.test(data.userId);
    }
    return true;
}, {
    message: "Invalid User ID format. Use 6 numbers and 1 capital letter.",
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
            isHtml: false,
        },
    });

    const targetValue = form.watch('target');
    const userIdValue = form.watch('userId');
    const isHtmlValue = form.watch('isHtml');

    React.useEffect(() => {
        const handler = setTimeout(async () => {
          if (targetValue === 'specific' && userIdValue && /^[0-9]{6}[A-Z]$/.test(userIdValue)) {
            setIsVerifying(true);
            setRecipientName(null);
            try {
              const fullUserId = `AC-${userIdValue}`;
              const { displayName, error } = await fetchRecipientDisplayName(fullUserId);
              if (error) {
                setRecipientName(error); // This will just display the error string. Fine for this page.
                form.setError('userId', { type: 'manual', message: error });
              } else if (displayName) {
                setRecipientName(displayName);
                form.clearErrors('userId');
              } else {
                 setRecipientName("Error finding user.");
                 form.setError('userId', { type: 'manual', message: 'Error finding user.' });
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
                const result = await sendNotificationToAllUsers(values.title, values.description, values.isHtml);
                toast({
                    title: "Broadcast Sent",
                    description: `Notifications sent to ${result.successCount} users. ${result.errorCount > 0 ? `${result.errorCount} failed.` : ''}`
                });
            } else if (values.target === 'specific' && values.userId) {
                const fullUserId = `AC-${values.userId}`;
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where("adsenerId", "==", fullUserId));
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
                    isHtml: values.isHtml || false,
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
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground font-mono">
                                        AC-
                                    </span>
                                    <Input
                                        id="userId"
                                        placeholder="123456A"
                                        {...form.register('userId')}
                                        onChange={(e) => {
                                            const { value } = e.target;
                                            form.setValue('userId', value.toUpperCase().replace(/[^0-9A-Z]/g, ''));
                                        }}
                                        className="uppercase pl-10 font-mono"
                                    />
                                </div>
                                <div className="h-5 pt-1 text-sm text-muted-foreground">
                                    {isVerifying ? (
                                    <span className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying ID...
                                    </span>
                                    ) : recipientName && !form.formState.errors.userId ? (
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
                            <Textarea id="description" placeholder="Describe the notification..." rows={5} {...form.register('description')} />
                            {form.formState.errors.description && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.description.message}</p>
                            )}
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="isHtml">Send as HTML</Label>
                                <p className="text-xs text-muted-foreground">
                                    Allows custom HTML and inline CSS in the description.
                                </p>
                            </div>
                            <Controller
                                control={form.control}
                                name="isHtml"
                                render={({ field }) => (
                                    <Switch
                                        id="isHtml"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                        {isHtmlValue && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Security Warning</AlertTitle>
                                <AlertDescription>
                                    Using raw HTML can be a security risk. Ensure your code is sanitized and does not contain malicious scripts.
                                </AlertDescription>
                            </Alert>
                        )}
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
