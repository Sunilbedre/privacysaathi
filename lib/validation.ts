import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
  organisation: z.string().trim().max(160).optional().default(''),
  interest: z.string().trim().max(120).optional().default(''),
  meeting: z.string().trim().max(40).optional().default(''),
  timing: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().min(10, 'Please tell us a little more (10 characters or more)').max(4000),
  consent: z.literal('on', { message: 'Please tick the consent box' }),
  website: z.string().max(0).optional(), // honeypot: real users leave it empty
});
export type LeadInput = z.infer<typeof leadSchema>;
