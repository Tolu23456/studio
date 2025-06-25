
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
        {popupConfig.imageUrl && (
          <div className="relative w-full aspect-video rounded-t-lg overflow-hidden -mt-6 -mx-6">
            <Image 
              src={popupConfig.imageUrl} 
              alt={popupConfig.title}
              layout="fill"
              objectFit="cover"
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
