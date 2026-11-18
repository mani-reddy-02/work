import { z } from 'zod';

export const initiateCallSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid({ message: 'Valid booking UUID is required' }),
    bookingType: z.enum(['OP', 'VIDEO', 'NURSING', 'LAB_WALK_IN', 'HOME_SAMPLE']).default('OP'),
    direction: z.enum(['PATIENT_TO_HOSPITAL', 'HOSPITAL_TO_PATIENT']).optional(),
  }),
});

export const callStatusParamSchema = z.object({
  params: z.object({
    callSid: z.string().min(5, { message: 'Valid Call SID is required' }),
  }),
});

export const bookingCallHistoryParamSchema = z.object({
  params: z.object({
    bookingId: z.string().uuid({ message: 'Valid booking UUID is required' }),
  }),
});

export const verifyHostQuerySchema = z.object({
  query: z.object({
    subdomain: z.string().optional(),
  }),
});
