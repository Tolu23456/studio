
'use client';

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { markNotificationAsRead } from "@/services/user-data";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export function NotificationToastController() {
    const { notifications } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [processedToasts, setProcessedToasts] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unreadToasts = notifications.filter(n => 
            !n.read && 
            n.deliveryMethod === 'toast' && 
            !processedToasts.has(n.id)
        );

        if (unreadToasts.length > 0) {
            const newProcessed = new Set(processedToasts);
            unreadToasts.forEach(n => {
                toast({
                    title: n.title,
                    description: n.isHtml ? (
                        <div
                             className="prose prose-sm dark:prose-invert max-w-none text-sm opacity-90"
                             dangerouslySetInnerHTML={{ __html: n.description }}
                           />
                    ) : (
                        <p className="text-sm opacity-90">{n.description}</p>
                    ),
                    action: (
                        <Button variant="secondary" size="sm" onClick={() => {
                            // Immediately mark as read and navigate
                            markNotificationAsRead(n.id);
                            router.push('/dashboard/notifications');
                        }}>
                            View
                        </Button>
                    ),
                    onOpenChange: (open) => {
                        if (!open) {
                            // This is called when the toast is dismissed (either by timeout or close button)
                            markNotificationAsRead(n.id);
                        }
                    },
                    duration: 10000 // Give users time to read
                });
                newProcessed.add(n.id);
            });
            setProcessedToasts(newProcessed);
        }

    }, [notifications, toast, router, processedToasts]);

    return null; // This component doesn't render anything
}
