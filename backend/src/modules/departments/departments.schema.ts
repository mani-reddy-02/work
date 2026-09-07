import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    specialtyId: z.string().uuid('Invalid specialty ID'),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    specialtyId: z.string().uuid('Invalid specialty ID').optional(),
  }),
});
