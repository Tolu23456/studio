'use server';
/**
 * @fileOverview An image enhancement AI agent.
 *
 * - enhanceImage - A function that handles the image enhancement process.
 * - EnhanceImageInput - The input type for the enhanceImage function.
 * - EnhanceImageOutput - The return type for the enhanceImage function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const EnhanceImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The image to enhance, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('A prompt describing the desired enhancement or style. e.g., "photorealistic, cinematic lighting"'),
});
export type EnhanceImageInput = z.infer<typeof EnhanceImageInputSchema>;

export const EnhanceImageOutputSchema = z.object({
  enhancedImageDataUri: z.string().describe('The enhanced image as a data URI.'),
});
export type EnhanceImageOutput = z.infer<typeof EnhanceImageOutputSchema>;

export async function enhanceImage(input: EnhanceImageInput): Promise<EnhanceImageOutput> {
  return enhanceImageFlow(input);
}

const enhanceImageFlow = ai.defineFlow(
  {
    name: 'enhanceImageFlow',
    inputSchema: EnhanceImageInputSchema,
    outputSchema: EnhanceImageOutputSchema,
  },
  async ({ imageDataUri, prompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: imageDataUri } },
        { text: `Enhance this image. Style guidance: ${prompt}` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return an image.');
    }

    return {
      enhancedImageDataUri: media.url,
    };
  }
);
