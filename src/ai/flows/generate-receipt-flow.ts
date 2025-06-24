'use server';
/**
 * @fileOverview A flow to generate a transaction receipt.
 *
 * - generateReceipt - A function that generates a formatted receipt for a transaction.
 * - GenerateReceiptInput - The input type for the generateReceipt function.
 * - GenerateReceiptOutput - The return type for the generateReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type {Transaction} from '@/lib/types';
import { format } from 'date-fns';

const GenerateReceiptInputSchema = z.object({
    id: z.string(),
    type: z.enum(['deposit', 'withdrawal', 'reward', 'purchase']),
    description: z.string(),
    amount: z.number(),
    date: z.date(),
    status: z.enum(['completed', 'pending', 'failed']),
});
export type GenerateReceiptInput = z.infer<typeof GenerateReceiptInputSchema>;

const GenerateReceiptOutputSchema = z.object({
  receiptText: z.string().describe('The fully formatted receipt text as a single string, including all line breaks for presentation.'),
});
export type GenerateReceiptOutput = z.infer<typeof GenerateReceiptOutputSchema>;

export async function generateReceipt(input: GenerateReceiptInput): Promise<GenerateReceiptOutput> {
  return generateReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReceiptPrompt',
  input: {schema: z.object({
      transaction: GenerateReceiptInputSchema,
      formattedDate: z.string(),
      formattedAmount: z.string()
  })},
  output: {schema: GenerateReceiptOutputSchema},
  prompt: `You are an AI assistant that generates official transaction receipts for a digital currency platform called Adsener. The currency is called "Cubes".
The user will provide transaction details. Format them into a clean, professional receipt.

**Do not add any commentary, greetings, or any text before or after the receipt text itself.**

Here is the information for the transaction:
- Transaction ID: {{transaction.id}}
- Date: {{formattedDate}}
- Description: {{transaction.description}}
- Type: {{transaction.type}}
- Amount: {{formattedAmount}}
- Status: {{transaction.status}}

Generate the receipt text based on this information. It should be suitable for displaying in a pre-formatted text box. Use line breaks to format it clearly.
Your output MUST exactly follow this format:

----------------------------------------
       Adsener Transaction Receipt
----------------------------------------

Transaction ID: {{transaction.id}}
Date & Time:    {{formattedDate}}

Details:
  Description: {{transaction.description}}
  Type:        {{transaction.type}}
  Status:      {{transaction.status}}

Amount:      {{formattedAmount}}

----------------------------------------
     Thank you for using Adsener!
----------------------------------------
`,
});

const generateReceiptFlow = ai.defineFlow(
  {
    name: 'generateReceiptFlow',
    inputSchema: GenerateReceiptInputSchema,
    outputSchema: GenerateReceiptOutputSchema,
  },
  async (transaction) => {
    const {output} = await prompt({
        transaction,
        formattedDate: format(transaction.date, 'Pp'),
        formattedAmount: `${transaction.amount > 0 ? '+' : ''}${transaction.amount.toLocaleString()} Cubes`
    });
    return output!;
  }
);
