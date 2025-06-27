'use server';
/**
 * @fileOverview An AI image generator flow for admins.
 *
 * - generateImageFromPrompt - A function that handles the image generation process.
 * - GenerateImageFromPromptInput - The input type for the function.
 * - GenerateImageFromPromptOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const GenerateImageFromPromptInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the desired image. e.g., "photorealistic, cinematic lighting, a robot cat"'),
});
export type GenerateImageFromPromptInput = z.infer<typeof GenerateImageFromPromptInputSchema>;

export const GenerateImageFromPromptOutputSchema = z.object({
  generatedImageDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageFromPromptOutput = z.infer<typeof GenerateImageFromPromptOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageFromPromptInput): Promise<GenerateImageFromPromptOutput> {
  return generateImageFromPromptFlow(input);
}

const generateImageFromPromptFlow = ai.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageFromPromptInputSchema,
    outputSchema: GenerateImageFromPromptOutputSchema,
  },
  async ({ prompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate an image for a web application based on this concept: ${prompt}`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return an image.');
    }

    return {
      generatedImageDataUri: media.url,
    };
  }
);
