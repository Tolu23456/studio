'use server';

/**
 * @fileOverview Personalized daily task suggestions for users to maximize Cube earnings.
 *
 * - getPersonalizedTaskSuggestions - A function that suggests personalized tasks.
 * - PersonalizedTaskSuggestionsInput - The input type for the getPersonalizedTaskSuggestions function.
 * - PersonalizedTaskSuggestionsOutput - The return type for the getPersonalizedTaskSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedTaskSuggestionsInputSchema = z.object({
  userActivityHistory: z.string().describe('The user activity history, including completed tasks, ad views, and games played.'),
  userPreferences: z.string().describe('The user preferences, including preferred task types, ad categories, and game genres.'),
});
export type PersonalizedTaskSuggestionsInput = z.infer<typeof PersonalizedTaskSuggestionsInputSchema>;

const PersonalizedTaskSuggestionsOutputSchema = z.object({
  suggestedTasks: z.array(z.string()).describe('A list of personalized task suggestions for the user.'),
});
export type PersonalizedTaskSuggestionsOutput = z.infer<typeof PersonalizedTaskSuggestionsOutputSchema>;

export async function getPersonalizedTaskSuggestions(input: PersonalizedTaskSuggestionsInput): Promise<PersonalizedTaskSuggestionsOutput> {
  return personalizedTaskSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedTaskSuggestionsPrompt',
  input: {schema: PersonalizedTaskSuggestionsInputSchema},
  output: {schema: PersonalizedTaskSuggestionsOutputSchema},
  prompt: `You are an AI assistant that suggests personalized daily tasks to users based on their past activity and preferences to maximize their Cube earnings.

  User Activity History: {{{userActivityHistory}}}
  User Preferences: {{{userPreferences}}}

  Based on the user's activity history and preferences, suggest a list of personalized tasks that the user can complete to maximize their Cube earnings.
  Return the suggestions as a list of strings.
  `,
});

const personalizedTaskSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedTaskSuggestionsFlow',
    inputSchema: PersonalizedTaskSuggestionsInputSchema,
    outputSchema: PersonalizedTaskSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
