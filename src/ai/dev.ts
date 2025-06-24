'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-task-suggestions.ts';
import '@/ai/flows/generate-avatar-flow.ts';
import '@/ai/flows/ad-trivia-flow.ts';
