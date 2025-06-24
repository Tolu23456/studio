'use server';
/**
 * @fileOverview A flow for generating ad-related trivia questions.
 *
 * - generateAdTriviaQuestion - A function that generates a single trivia question.
 * - AdTriviaQuestionOutput - The return type for the generateAdTriviaQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdTriviaQuestionOutputSchema = z.object({
  question: z.string().describe('The trivia question about a famous advertisement or brand.'),
  options: z.array(z.string()).length(4).describe('An array of 4 multiple-choice options.'),
  correctAnswer: z.string().describe('The correct answer from the provided options.'),
});
export type AdTriviaQuestionOutput = z.infer<typeof AdTriviaQuestionOutputSchema>;

export async function generateAdTriviaQuestion(): Promise<AdTriviaQuestionOutput> {
  return adTriviaFlow();
}

const prompt = ai.definePrompt({
  name: 'adTriviaPrompt',
  input: {schema: z.void()},
  output: {schema: AdTriviaQuestionOutputSchema},
  prompt: `You are a fun trivia master who specializes in advertising and brand history. 
  Generate a single, engaging multiple-choice trivia question about a well-known brand, slogan, or famous advertisement.
  
  The question should be interesting and not too obscure. 
  Provide exactly four plausible options, with only one being correct.
  Ensure the correct answer is one of the options.
  
  Example topics:
  - Guess the brand from the slogan.
  - Identify the year a famous ad campaign was launched.
  - Which company uses a specific mascot?
  
  Generate a new, random question each time.
  `,
});

const adTriviaFlow = ai.defineFlow(
  {
    name: 'adTriviaFlow',
    inputSchema: z.void(),
    outputSchema: AdTriviaQuestionOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
