
'use client';

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { markNotificationAsRead } from "@/services/user-data";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import React from "react";

export function NotificationToastController() {
    const { notifications } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const processedToasts = useRef<Set<string>>(new Set());

    useEffect(() => {
        const unreadToasts = notifications.filter(n => 
            !n.read && 
            n.deliveryMethod === 'toast' && 
            !processedToasts.current.has(n.id)
        );

        if (unreadToasts.length > 0) {
            unreadToasts.forEach(n => {
                toast({
                    title: n.title,
                    description: n.isHtml ? (
                        <div
                             className="prose prose-sm dark:prose-invert max-w-none text-sm opacity-90"
                             dangerouslySetInnerHTML={{ __html: n.description }}
                        />
                    ) : (
                        n.description
                    ),
                    action: (
                        <Button variant="secondary" size="sm" onClick={() => {
                            markNotificationAsRead(n.id);
                            router.push('/dashboard/notifications');
                        }}>
                            View
                        </Button>
                    ),
                    onOpenChange: (open) => {
                        if (!open) {
                            markNotificationAsRead(n.id);
                        }
                    },
                    duration: 10000 
                });
                processedToasts.current.add(n.id);
            });
        }

    }, [notifications, toast, router]);

    return null;
}
