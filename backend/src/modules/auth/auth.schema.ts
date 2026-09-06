import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    account: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      password: z.string().min(6),
    }),
    businessType: z.object({
      businessType: z.enum(['hospital', 'laboratory']),
    }),
    hospitalInfo: z.object({
      hospitalName: z.string().min(2),
      hospitalType: z.string().min(2),
      registrationNumber: z.string().min(2),
      hospitalPhone: z.string().min(10),
      hospitalEmail: z.string().email(),
      website: z.string().optional(),
      establishedYear: z.string().optional(),
    }).optional(),
    hospitalLocation: z.object({
      address1: z.string().min(5),
      address2: z.string().optional(),
      area: z.string().min(2),
      city: z.string().min(2),
      state: z.string().min(2),
      country: z.string().min(2),
      pincode: z.string().min(5),
      emergencyContact: z.string().optional(),
    }).optional(),
    hospitalServices: z.object({
      services: z.array(z.string()).min(1),
    }).optional(),
    hospitalDepartments: z.object({
      departments: z.array(z.string()).min(1),
      customDepartments: z.array(
        z.object({
          name: z.string(),
          code: z.string().optional(),
          description: z.string().optional(),
        })
      ).optional(),
    }).optional(),
    hospitalAdmin: z.object({
      adminName: z.string().min(2),
      adminRole: z.string().min(2),
      adminPhone: z.string().min(10),
      adminEmail: z.string().email(),
    }).optional(),
  }),
});
