
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
        // If a notification is already being shown, don't look for another one.
        if (currentNotification) return;

        // Find the oldest unread "popup" notification.
        // Also treat notifications without a deliveryMethod as popups for backward compatibility.
        const oldestUnreadPopup = notifications
            .filter(n => !n.read && (n.deliveryMethod === 'popup' || !n.deliveryMethod))
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        
        if (oldestUnreadPopup) {
            setCurrentNotification(oldestUnreadPopup);
        }

    }, [notifications, currentNotification]);

    const handleClose = async () => {
        if (!currentNotification) return;
        try {
            await markNotificationAsRead(currentNotification.id);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        } finally {
            // Setting to null allows the useEffect to search for the next available popup.
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
