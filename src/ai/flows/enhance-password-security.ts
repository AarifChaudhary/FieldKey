'use server';
/**
 * @fileOverview Enhances password security by intelligently selecting secure and memorable parts from field values using AI.
 *
 * - enhancePasswordSecurity - A function that enhances password security.
 * - EnhancePasswordSecurityInput - The input type for the enhancePasswordSecurity function.
 * - EnhancePasswordSecurityOutput - The return type for the enhancePasswordSecurity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePasswordSecurityInputSchema = z.object({
  fieldValues: z
    .array(z.string())
    .describe('An array of field values provided by the user.'),
  maxLength: z
    .number()
    .min(8)
    .max(16)
    .default(12) // sensible default
    .describe('The maximum length of the generated password.'),
});
export type EnhancePasswordSecurityInput = z.infer<
  typeof EnhancePasswordSecurityInputSchema
>;

const EnhancePasswordSecurityOutputSchema = z.object({
  enhancedPassword: z
    .string()
    .describe('The AI-enhanced password that meets security requirements.'),
});
export type EnhancePasswordSecurityOutput = z.infer<
  typeof EnhancePasswordSecurityOutputSchema
>;

export async function enhancePasswordSecurity(
  input: EnhancePasswordSecurityInput
): Promise<EnhancePasswordSecurityOutput> {
  return enhancePasswordSecurityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancePasswordSecurityPrompt',
  input: {schema: EnhancePasswordSecurityInputSchema},
  output: {schema: EnhancePasswordSecurityOutputSchema},
  prompt: `You are a security expert tasked with generating strong, memorable passwords based on user-provided field values. Your goal is to select the most secure and memorable parts from these values to create a password that adheres to the specified length and character requirements.

Specifically:
- The password MUST be between 8 and 16 characters long.
- The password MUST include at least one uppercase character, one lowercase character, one number, and one special character.
- The password MUST incorporate recognizable parts from the provided field values to enhance memorability.

Field Values: {{{fieldValues}}}
Maximum Length: {{{maxLength}}}

Create a password that meets these requirements. Ensure the generated password is both secure and relatively easy for the user to remember.

Output the generated password in the 'enhancedPassword' field.
`,
});

const enhancePasswordSecurityFlow = ai.defineFlow(
  {
    name: 'enhancePasswordSecurityFlow',
    inputSchema: EnhancePasswordSecurityInputSchema,
    outputSchema: EnhancePasswordSecurityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
