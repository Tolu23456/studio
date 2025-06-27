
'use client';

import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function NotificationsPage() {
  const { notifications, loading } = useAuth();

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
          {loading ? (
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
                               <p
                                 className="text-sm text-muted-foreground"
                                 dangerouslySetInnerHTML={{ __html: notification.description }}
                               />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {notification.description}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground/80">
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
      </Card>
    </div>
  );
}
