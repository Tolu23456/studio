
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
import { sendBroadcastNotification, fetchRecipientDisplayName, logSentNotification, sendPersonalizedNotification } from '@/services/user-data';
import { useAuth } from '@/context/auth-context';
import { Loader2, Send, AlertTriangle, Key } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfile } from '@/lib/types';
import { format } from 'date-fns';


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


export default function AdminSendMessagePage() {
    const { toast } = useToast();
    const { userProfile: adminProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recipient, setRecipient] = useState<{ displayName: string | null; photoURL: string | null; error?: string } | null>(null);
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
    const descriptionValue = form.watch('description');

    React.useEffect(() => {
        const handler = setTimeout(async () => {
          if (targetValue === 'specific' && userIdValue && /^[0-9]{6}[A-Z]$/.test(userIdValue)) {
            setIsVerifying(true);
            setRecipient(null);
            try {
              const fullUserId = `AC-${userIdValue}`;
              const { displayName, error } = await fetchRecipientDisplayName(fullUserId);
              if (error) {
                setRecipient({ displayName: null, photoURL: null, error });
                form.setError('userId', { type: 'manual', message: error });
              } else if (displayName) {
                setRecipient({ displayName, photoURL: null }); // photoURL not needed here
                form.clearErrors('userId');
              } else {
                 setRecipient({displayName: null, photoURL: null, error: "Error finding user."});
                 form.setError('userId', { type: 'manual', message: 'Error finding user.' });
              }
            } catch (error) {
              setRecipient({displayName: null, photoURL: null, error: "Error finding user."});
              form.setError('userId', { type: 'manual', message: 'Error finding user.' });
            } finally {
              setIsVerifying(false);
            }
          } else {
            setRecipient(null);
          }
        }, 500);

        return () => clearTimeout(handler);
      }, [userIdValue, targetValue, form]);
      
    const replacePlaceholdersForPreview = (template: string): string => {
        const now = new Date();
        const sampleData = {
          username: 'ExampleUser',
          email: 'user@example.com',
          adsenerId: 'AC-123456X',
          cubeBalance: '5,000',
          date: format(now, 'PPP'),
          time: format(now, 'p'),
        };
        return template
          .replace(/{{username}}/g, `<strong>${sampleData.username}</strong>`)
          .replace(/{{email}}/g, `<strong>${sampleData.email}</strong>`)
          .replace(/{{adsenerId}}/g, `<strong>${sampleData.adsenerId}</strong>`)
          .replace(/{{cubeBalance}}/g, `<strong>${sampleData.cubeBalance}</strong>`)
          .replace(/{{date}}/g, `<strong>${sampleData.date}</strong>`)
          .replace(/{{time}}/g, `<strong>${sampleData.time}</strong>`);
    };


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            let messageTargetDescription = "All Users";
            if (values.target === 'all') {
                const result = await sendBroadcastNotification(values.title, values.description, values.isHtml);
                toast({
                    title: "Broadcast Queued",
                    description: `Notifications will be sent to ${result.successCount} users. ${result.errorCount > 0 ? `${result.errorCount} failed.` : ''}`
                });
            } else if (values.target === 'specific' && values.userId) {
                const fullUserId = `AC-${values.userId}`;
                const result = await sendPersonalizedNotification(fullUserId, values.title, values.description, values.isHtml);
                if (result.success) {
                    toast({
                        title: "Notification Sent",
                        description: `Message sent to ${result.recipientName}.`
                    });
                     messageTargetDescription = `${result.recipientName} (${fullUserId})`;
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.message });
                    setIsSubmitting(false);
                    return;
                }
            }
            
            if (adminProfile) {
                await logSentNotification(values.title, values.description, messageTargetDescription, values.isHtml || false, adminProfile.displayName);
            }

            form.reset({ target: 'all', userId: '', title: '', description: '', isHtml: isHtmlValue });
            setRecipient(null);
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
            <h1 className="text-3xl font-bold tracking-tight font-headline">Send Message</h1>
            <Card>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>
                            Send a message to a specific user or broadcast to everyone.
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
                                            <Label htmlFor="r1">All Users (Broadcast)</Label>
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
                                    ) : recipient?.displayName && !recipient.error ? (
                                    <span>
                                        Recipient:{" "}
                                        <span className="font-semibold text-foreground">
                                        {recipient.displayName}
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

                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="isHtml">Enable HTML Editor</Label>
                                <p className="text-xs text-muted-foreground">
                                    Compose message with custom HTML and a live preview.
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
                        
                         <Alert>
                            <Key className="h-4 w-4" />
                            <AlertTitle>Dynamic Placeholders</AlertTitle>
                            <AlertDescription>
                                You can use these placeholders in your message. They will be replaced with the user's data.
                                <br />
                                <code className="font-mono text-xs bg-muted p-1 rounded-sm">{{username}}</code>, <code className="font-mono text-xs bg-muted p-1 rounded-sm">{{email}}</code>, <code className="font-mono text-xs bg-muted p-1 rounded-sm">{{adsenerId}}</code>, <code className="font-mono text-xs bg-muted p-1 rounded-sm">{{cubeBalance}}</code>, <code className="font-mono text-xs bg-muted p-1 rounded-sm">{{date}}</code>, <code className="font-mono text-xs bg-muted p-1 rounded-sm">{{time}}</code>
                            </AlertDescription>
                        </Alert>

                        {isHtmlValue ? (
                           <Tabs defaultValue="compose" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="compose">Compose</TabsTrigger>
                                    <TabsTrigger value="preview">Preview</TabsTrigger>
                                </TabsList>
                                <TabsContent value="compose" className="mt-2">
                                     <Textarea id="description" placeholder="<h1>Hello {{username}}!</h1><p>You can use <b>HTML</b> here. Use <style> tags for CSS.</p>" rows={15} {...form.register('description')} />
                                      {form.formState.errors.description && (
                                        <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.description.message}</p>
                                    )}
                                </TabsContent>
                                <TabsContent value="preview" className="mt-2">
                                    <div className="w-full min-h-[358px] rounded-md border bg-background p-4">
                                        <iframe
                                            srcDoc={replacePlaceholdersForPreview(descriptionValue)}
                                            title="HTML Preview"
                                            className="w-full h-full border-0 min-h-[338px]"
                                            style={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                                        />
                                    </div>
                                </TabsContent>
                           </Tabs>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" placeholder="Describe the message..." rows={5} {...form.register('description')} />
                                {form.formState.errors.description && (
                                    <p className="text-sm font-medium text-destructive">{form.formState.errors.description.message}</p>
                                )}
                            </div>
                        )}

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
                            Send Message
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

    