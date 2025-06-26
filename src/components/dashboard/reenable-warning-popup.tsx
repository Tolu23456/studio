'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { clearReenableWarning } from '@/services/user-data';
import { Loader2, ShieldAlert } from 'lucide-react';

export function ReenableWarningPopup() {
  const { userProfile, refreshUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      await clearReenableWarning();
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to acknowledge warning:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update your profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile) return null;

  const disableCount = userProfile.disableCount || 0;
  let warningMessage;
  if (disableCount <= 1) {
    warningMessage = "This is your first warning. Please ensure you follow our terms of service to avoid further action.";
  } else if (disableCount === 2) {
    warningMessage = `This is your second warning. One more violation may result in a permanent ban.`;
  } else {
    warningMessage = `Your account is under final review due to repeated violations. Any further issues will result in a permanent ban.`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleAcknowledge()}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className='items-center text-center'>
          <ShieldAlert className="h-12 w-12 text-destructive mb-2" />
          <DialogTitle>Account Re-enabled: Official Warning</DialogTitle>
          <DialogDescription>
            Your account access has been restored. Please review the following information carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="font-semibold text-lg">You have been disabled {disableCount} time{disableCount > 1 ? 's' : ''}.</p>
          <p className="text-muted-foreground mt-2">{warningMessage}</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleAcknowledge} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I Understand and Agree to Comply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
