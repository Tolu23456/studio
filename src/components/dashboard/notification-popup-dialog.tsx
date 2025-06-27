
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/lib/types';

interface NotificationPopupDialogProps {
  notification: Notification;
  onClose: () => void;
}

export function NotificationPopupDialog({ notification, onClose }: NotificationPopupDialogProps) {

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
          <DialogDescription>
             {notification.isHtml ? (
                <div
                    className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground pt-2"
                    dangerouslySetInnerHTML={{ __html: notification.description }}
                />
            ) : (
                <div className="pt-2">{notification.description}</div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
