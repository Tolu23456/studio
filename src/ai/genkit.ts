import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// The API key is read from the `GENKIT_GOOGLEAI_API_KEY` environment variable.
// Make sure to set this in your .env file.
export const ai = configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GENKIT_GOOGLEAI_API_KEY,
    }),
  ],
});
