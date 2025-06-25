
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
import Image from 'next/image';

export function GlobalPopup() {
  const { platformSettings } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const popupConfig = platformSettings?.globalPopup;

  useEffect(() => {
    if (popupConfig?.enabled) {
      // The key is based on content to ensure new popups are shown.
      const popupKey = `globalPopup_seen_${popupConfig.title}_${popupConfig.message}`;
      try {
        const hasSeenPopup = sessionStorage.getItem(popupKey);
        if (!hasSeenPopup) {
          setIsOpen(true);
        }
      } catch (error) {
        // sessionStorage might not be available in some environments (e.g. SSR)
        console.error("Could not access sessionStorage:", error);
      }
    }
  }, [popupConfig]);

  const handleClose = () => {
    setIsOpen(false);
    if (popupConfig) {
      const popupKey = `globalPopup_seen_${popupConfig.title}_${popupConfig.message}`;
       try {
        sessionStorage.setItem(popupKey, 'true');
      } catch (error) {
        console.error("Could not access sessionStorage:", error);
      }
    }
  };

  if (!isOpen || !popupConfig) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        {popupConfig.imageUrl && (
          <div className="relative -mx-6 -mt-6 aspect-video overflow-hidden rounded-t-lg">
            <Image 
              src={popupConfig.imageUrl} 
              alt={popupConfig.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <DialogHeader className={popupConfig.imageUrl ? 'pt-4' : ''}>
          <DialogTitle>{popupConfig.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">{popupConfig.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
