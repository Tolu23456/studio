
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { transferCubes, fetchRecipientDisplayName } from '@/services/user-data';
import { Send, Loader2, User, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  recipientId: z.string().regex(/^AC-[0-9]{6}[A-Z]$/, {
    message: "Invalid User ID format. Should be e.g. AC-123456A"
  }),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
});

export function TransferCubesForm() {
  const { userProfile, platformSettings } = useAuth();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState<{ displayName: string | null; photoURL: string | null; error?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientId: '',
      amount: '' as any,
    },
  });
  
  const recipientIdValue = form.watch('recipientId');
  const amountValue = form.watch('amount');

  const feePercentage = platformSettings?.transferFeePercentage ?? 0;
  const feeAmount = isNaN(amountValue) || amountValue <= 0 ? 0 : Math.ceil(amountValue * (feePercentage / 100));
  const totalDeduction = isNaN(amountValue) || amountValue <= 0 ? 0 : amountValue + feeAmount;

  useEffect(() => {
    const handler = setTimeout(async () => {
      const validFormat = /^AC-[0-9]{6}[A-Z]$/.test(recipientIdValue);
      if (validFormat) {
        setIsVerifying(true);
        setRecipient(null);
        form.clearErrors('recipientId');
        try {
          const recipientInfo = await fetchRecipientDisplayName(recipientIdValue);
          setRecipient(recipientInfo);
          if (recipientInfo.error) {
              form.setError('recipientId', { type: 'manual', message: recipientInfo.error });
          }
        } catch (error) {
          console.error("Error fetching recipient info:", error);
          setRecipient({ displayName: null, photoURL: null, error: "Error finding user." });
          form.setError('recipientId', { type: 'manual', message: "Error finding user." });
        } finally {
          setIsVerifying(false);
        }
      } else {
        setRecipient(null);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [recipientIdValue, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find your profile.' });
        return;
    }
    
    if (totalDeduction > userProfile.cubeBalance) {
      form.setError('amount', {
        type: 'manual',
        message: `Insufficient balance. You need ${totalDeduction.toLocaleString()} Cubes for this transfer.`,
      });
      return;
    }

    try {
      const result = await transferCubes(values.recipientId, values.amount);
      if (result.success) {
        toast({
          title: 'Transfer Successful',
          description: result.message,
        });
        form.reset();
        setRecipient(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Transfer Failed',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Transfer failed:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Cubes</CardTitle>
        <CardDescription>
          Send cubes to another user instantly. A small fee applies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient User ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. AC-123456A"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      className="uppercase"
                    />
                  </FormControl>
                  <div className="h-10 pt-1 text-sm text-muted-foreground flex items-center gap-2">
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying ID...</span>
                      </>
                    ) : recipient?.displayName && !recipient.error ? (
                      <>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={recipient.photoURL ?? undefined} alt={recipient.displayName ?? 'Recipient Avatar'} />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <span>
                          Recipient:{" "}
                          <span className="font-semibold text-foreground">
                            {recipient.displayName}
                          </span>
                        </span>
                      </>
                    ) : (
                      <span>
                        Ask your friend for their User ID from their settings page.
                      </span>
                    )}
                  </div>
                  <FormMessage className="pt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Send</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} min="1" />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            
            {amountValue > 0 && (
                <div className="p-4 border rounded-lg space-y-2 bg-secondary/50">
                    <div className="text-sm text-muted-foreground flex justify-between items-center">
                        <span>Amount to Send:</span>
                        <span className="font-medium text-foreground">{amountValue.toLocaleString()} Cubes</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between items-center">
                        <span>Transfer Fee ({feePercentage}%):</span>
                        <span className="font-medium text-foreground">{feeAmount.toLocaleString()} Cubes</span>
                    </div>
                    <Separator />
                    <div className="font-semibold flex justify-between items-center">
                        <span>Total to be Deducted:</span>
                        <span className='flex items-center gap-1'>{totalDeduction.toLocaleString()} <Zap className="h-4 w-4 text-primary" /></span>
                    </div>
                </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid || totalDeduction <= 0} className="w-full sm:w-auto">
              {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Cubes
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
