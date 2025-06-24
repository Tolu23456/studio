
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { sendNotificationToAllUsers } from "@/services/user-data";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }).max(50, { message: "Title cannot exceed 50 characters."}),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(200, { message: "Description cannot exceed 200 characters."}),
});

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }
    
    try {
        const idToken = await user.getIdToken();
        const result = await sendNotificationToAllUsers(idToken, values.title, values.description);
        if (result.success) {
            toast({
                title: "Success!",
                description: result.message,
            });
            form.reset();
        } else {
             toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: result.message,
            });
        }
    } catch (error: any) {
        console.error("Failed to send notification:", error);
        toast({
            variant: 'destructive',
            title: 'An Error Occurred',
            description: error.message || 'Could not send notifications. Please try again.',
        });
    }
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold tracking-tight font-headline">Broadcast Notifications</h1>
       <Card>
        <CardHeader>
          <CardTitle>Send to All Users</CardTitle>
          <CardDescription>This message will be sent as a push notification to all registered users of the application.</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notification Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. New Feature Alert!" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notification Message</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Describe the update or offer..."
                                className="resize-none"
                                {...field}
                                rows={4}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Sending...' : 'Send Broadcast'}
                    </Button>
                </form>
           </Form>
        </CardContent>
       </Card>
    </div>
  );
}
