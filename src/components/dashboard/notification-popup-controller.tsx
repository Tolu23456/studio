
'use client';

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { NotificationPopupDialog } from "./notification-popup-dialog";
import { markNotificationAsRead } from "@/services/user-data";
import type { Notification } from "@/lib/types";

export function NotificationPopupController() {
    const { notifications } = useAuth();
    const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

    useEffect(() => {
        // Find the oldest unread "popup" notification.
        // Also treat notifications without a deliveryMethod as popups for backward compatibility.
        const oldestUnreadPopup = notifications
            .filter(n => !n.read && (n.deliveryMethod === 'popup' || !n.deliveryMethod))
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        
        if (oldestUnreadPopup) {
            setCurrentNotification(oldestUnreadPopup);
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
