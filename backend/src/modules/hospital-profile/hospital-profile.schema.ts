import { z } from 'zod';

export const updateHospitalProfileSchema = z.object({
  name: z.string().min(2, 'Hospital name must be at least 2 characters').max(150).optional(),
  facilityType: z.string().max(100).nullable().optional(),
  registrationNumber: z.string().max(100).nullable().optional(),
  establishedYear: z.string().max(10).nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  phone: z.string().max(30).nullable().optional(), // alias
  contactEmail: z.string().email('Invalid email address').max(150).nullable().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').max(150).nullable().optional().or(z.literal('')), // alias
  website: z.string().max(255).nullable().optional().or(z.literal('')),
  emergencyContact: z.string().max(50).nullable().optional(),
  addressLine1: z.string().max(255).nullable().optional(),
  address: z.string().max(255).nullable().optional(), // alias
  addressLine2: z.string().max(255).nullable().optional(),
  area: z.string().max(150).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  pincode: z.string().max(20).nullable().optional(),
  services: z.array(z.string()).optional(),
  operatingHours: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export type UpdateHospitalProfileInput = z.infer<typeof updateHospitalProfileSchema>;
