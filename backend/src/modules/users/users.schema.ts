import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    avatar: z.string().optional(),
  }),
});
