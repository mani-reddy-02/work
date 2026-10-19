import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  serviceType: z.enum([
    'OP_CONSULTATION',
    'VIDEO_CONSULTATION',
    'LAB_TEST',
    'HOME_SAMPLE_COLLECTION',
    'HOME_NURSING'
  ]),
  targetType: z.enum(['HOSPITAL', 'DOCTOR']),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional().nullable()
});

export const moderateReviewSchema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN']),
  moderationNotes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable()
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
