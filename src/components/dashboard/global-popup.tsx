
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function GlobalPopup() {
  const { platformSettings } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const popupConfig = platformSettings?.globalPopup;

  useEffect(() => {
    if (popupConfig?.enabled) {
      const popupKey = `globalPopup_${popupConfig.title}_${popupConfig.message}`;
      const hasSeenPopup = sessionStorage.getItem(popupKey);

      if (!hasSeenPopup) {
        setIsOpen(true);
      }
    }
  }, [popupConfig]);

  const handleClose = () => {
    setIsOpen(false);
    if (popupConfig) {
      const popupKey = `globalPopup_${popupConfig.title}_${popupConfig.message}`;
      sessionStorage.setItem(popupKey, 'true');
    }
  };

  if (!isOpen || !popupConfig) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{popupConfig.title}</DialogTitle>
          <DialogDescription>{popupConfig.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
