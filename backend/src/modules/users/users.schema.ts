import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
    dob: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    designation: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    licenseNumber: z.string().nullable().optional(),
    qualification: z.string().nullable().optional(),
    specialization: z.string().nullable().optional(),
    experienceYears: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).nullable().optional(),
    consultationFee: z.union([z.number(), z.string().transform(Number)]).nullable().optional(),
    bio: z.string().nullable().optional(),
    digitalSignature: z.string().nullable().optional(),
    prescriptionSettings: z.any().nullable().optional(),
  }),
});

