
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
import { Send, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  recipientId: z.string().regex(/^AC-[0-9]{6}[A-Z]$/, {
    message: "Invalid User ID format. Should be e.g. AC-123456A"
  }),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
});

export function TransferCubesForm() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientId: '',
      amount: 0,
    },
  });
  
  const recipientIdValue = form.watch('recipientId');

  useEffect(() => {
    const handler = setTimeout(async () => {
      const validFormat = /^AC-[0-9]{6}[A-Z]$/.test(recipientIdValue);
      if (validFormat) {
        setIsVerifying(true);
        setRecipientName(null);
        try {
          const name = await fetchRecipientDisplayName(recipientIdValue);
          setRecipientName(name);
        } catch (error) {
          console.error("Error fetching recipient name:", error);
          setRecipientName("Error finding user.");
        } finally {
          setIsVerifying(false);
        }
      } else {
        setRecipientName(null);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [recipientIdValue]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find your profile.' });
        return;
    }
    
    if (values.amount > userProfile.cubeBalance) {
      form.setError('amount', {
        type: 'manual',
        message: "You don't have enough cubes for this transfer.",
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
          Send cubes to another user instantly.
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
                        let value = e.target.value.toUpperCase();
                
                        if (value && !value.startsWith('AC-')) {
                          value = 'AC-' + value;
                        }
                
                        if (value === 'AC-') {
                          value = '';
                        }
                
                        field.onChange(value);
                      }}
                      className="uppercase"
                    />
                  </FormControl>
                  <div className="h-5 pt-1 text-sm text-muted-foreground">
                    {isVerifying ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying ID...
                      </span>
                    ) : recipientName ? (
                      <span>
                        Recipient:{" "}
                        <span className="font-semibold text-foreground">
                          {recipientName}
                        </span>
                      </span>
                    ) : (
                      <span>
                        Ask your friend for their User ID.
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
              {form.formState.isSubmitting ? 'Sending...' : (
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
