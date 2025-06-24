'use server';

import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/google-ai';

export const ai = genkit({
  plugins: [googleAI()],
});
