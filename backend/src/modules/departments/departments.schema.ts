import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    specialtyId: z.string().optional(),
    status: z.string().optional(),
    isActive: z.boolean().optional(),
    icon: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    isActive: z.boolean().optional(),
    icon: z.string().optional(),
    specialtyId: z.string().optional(),
  }),
});
