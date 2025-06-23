'use server';
/**
 * @fileOverview A flow for generating a cute cartoon avatar image.
 *
 * - generateAvatar - A function that generates a random avatar image.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateAvatarOutputSchema = z.object({
  avatarDataUri: z.string().describe('The generated avatar image as a data URI.'),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow();
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: z.void(),
    outputSchema: GenerateAvatarOutputSchema,
  },
  async () => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: 'A cute, friendly, cartoon animal avatar, suitable for a user profile picture. The background should be a simple, solid color.',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
      throw new Error('Image generation failed.');
    }

    return { avatarDataUri: media.url };
  }
);
