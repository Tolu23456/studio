
'use client';

import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';
import { markAllNotificationsAsRead } from '@/services/user-data';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { notifications, loading, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only mark as read if there are unread notifications to avoid unnecessary writes
    if (notifications.some(n => !n.read)) {
      markAllNotificationsAsRead();
    }
  }, [notifications]);
  
  const handleMarkAllRead = async () => {
    try {
        await markAllNotificationsAsRead();
        toast({
            title: "Success",
            description: "All notifications have been marked as read.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not mark notifications as read.",
        });
    }
  }
  
  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Notifications</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Messages</CardTitle>
          <CardDescription>
            A log of all messages and alerts sent to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !userProfile ? (
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full mt-1" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold">No Notifications Yet</h3>
              <p className="text-muted-foreground">You have no new alerts. Check back later.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                    <div className={cn("flex items-start gap-4 p-4 rounded-lg", !notification.read && "bg-secondary/50")}>
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1", !notification.read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                            <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 grid gap-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{notification.title}</p>
                                {!notification.read && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                )}
                            </div>
                            {notification.isHtml ? (
                               <div
                                 className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                                 dangerouslySetInnerHTML={{ __html: notification.description }}
                               />
                            ) : (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {notification.description}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground/80 mt-1">
                                {formatDistanceToNow(notification.date, { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
         {notifications.length > 0 && (
            <CardFooter className="justify-end">
                <Button onClick={handleMarkAllRead} variant="ghost" size="sm" disabled={!hasUnread}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
