import { z } from 'zod';

export const createMarketingRequestSchema = z.object({
  body: z.object({
    campaignType: z.string().min(1).optional(),
    services: z.array(z.string()).optional(),
    budget: z.number().positive().optional().nullable(),
    targetAudience: z.string().max(255).optional().nullable(),
    preferredTime: z.string().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }).refine(data => !!(data.campaignType || (data.services && data.services.length > 0)), {
    message: 'Either campaignType or at least one service must be specified',
  }),
});

export type CreateMarketingRequestInput = z.infer<typeof createMarketingRequestSchema>['body'];

export const createCampRequestSchema = z.object({
  body: z.object({
    campTitle: z.string().min(1).optional(),
    location: z.string().min(2, 'Location is required').max(255),
    expectedDate: z.string().min(1, 'Expected date is required'),
    specialties: z.array(z.string()).optional(),
    speciality: z.string().optional().nullable(),
    expectedPatients: z.number().int().positive().optional().nullable(),
    expectedFootfall: z.string().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }),
});

export type CreateCampRequestInput = z.infer<typeof createCampRequestSchema>['body'];
