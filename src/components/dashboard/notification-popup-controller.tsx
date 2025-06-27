
'use client';

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { NotificationPopupDialog } from "./notification-popup-dialog";
import { markNotificationAsRead } from "@/services/user-data";

export function NotificationPopupController() {
    const { notifications } = useAuth();
    const [currentNotification, setCurrentNotification] = useState<typeof notifications[0] | null>(null);

    useEffect(() => {
        // Find the oldest unread notification that hasn't been shown in this session yet.
        const oldestUnread = notifications
            .filter(n => !n.read)
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        
        if (oldestUnread) {
            setCurrentNotification(oldestUnread);
        } else {
            setCurrentNotification(null);
        }

    }, [notifications]);

    const handleClose = async () => {
        if (!currentNotification) return;

        try {
            await markNotificationAsRead(currentNotification.id);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            // The UI will still update due to local state change
        } finally {
            setCurrentNotification(null);
        }
    };
    
    if (!currentNotification) {
        return null;
    }

    return (
       <NotificationPopupDialog 
            notification={currentNotification}
            onClose={handleClose}
       />
    );
}
