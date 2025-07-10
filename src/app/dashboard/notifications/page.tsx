
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
import { Bell, CheckCheck, Gift, Wrench, CircleDollarSign, Trash2, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { markAllNotificationsAsRead, deleteAllNotifications } from '@/services/user-data';
import { useToast } from '@/hooks/use-toast';
import type { Notification } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


const getNotificationIcon = (title: string): React.ReactNode => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('bonus') || lowerTitle.includes('daily')) return <Gift className="h-5 w-5" />;
    if (lowerTitle.includes('reward')) return <Award className="h-5 w-5" />;
    if (lowerTitle.includes('received') || lowerTitle.includes('sent')) return <CircleDollarSign className="h-5 w-5" />;
    if (lowerTitle.includes('update') || lowerTitle.includes('maintenance')) return <Wrench className="h-5 w-5" />;
    return <Bell className="h-5 w-5" />;
};


function NotificationItem({ notification }: { notification: Notification }) {
    return (
        <>
            <div className={cn("flex items-start gap-4 p-4 rounded-lg", !notification.read && "bg-secondary/50")}>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full mt-1", !notification.read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                    {getNotificationIcon(notification.title)}
                </div>
                <div className="flex-1 grid gap-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{notification.title}</p>
                        {!notification.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
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
            <Separator className="last:hidden" />
        </>
    );
}


export default function NotificationsPage() {
  const { notifications, loading, userProfile } = useAuth();
  const { toast } = useToast();

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
  };
  
  const handleDeleteAll = async () => {
    try {
        await deleteAllNotifications();
        toast({
            title: "Notifications Cleared",
            description: "All your messages have been deleted.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete notifications.",
        });
    }
  };

  const hasUnread = notifications.some(n => !n.read);
  
  if (loading && !userProfile) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Notifications</h1>
        <div className="flex gap-2">
            <Button onClick={handleMarkAllRead} variant="outline" size="sm" disabled={!hasUnread}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={notifications.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all of your notifications.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      
       <Card>
            <CardHeader>
                <CardTitle>Your Messages</CardTitle>
                <CardDescription>A log of all your system alerts and messages.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {notifications.length > 0 ? (
                    notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                ) : (
                     <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                        <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-semibold">No Notifications Yet</h3>
                        <p className="text-muted-foreground">You have no new alerts. Check back later.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
