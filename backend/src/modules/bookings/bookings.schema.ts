import { z } from 'zod';

export const createWalkInBookingSchema = z.object({
  body: z.object({
    departmentId: z.string().min(1, 'Department ID is required'),
    doctorId: z.string().min(1, 'Doctor ID is required'),
    patientName: z.string().min(2, 'Patient name must be at least 2 characters'),
    patientPhone: z.string().optional().nullable(),
    patientAge: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().nullable(),
    patientGender: z.string().optional().nullable(),
    place: z.string().optional().nullable(),
    reason: z.string().optional().nullable(),
    symptoms: z.string().optional().nullable(),
    opType: z.string().default('Normal'),
    fee: z.number().min(0).default(0).optional(),
    consultationFee: z.number().min(0).optional(),
    timeSlot: z.string().optional(),
    slotTime: z.string().optional(),
    appointmentDate: z.string().optional()
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'WAITING',
      'ARRIVED',
      'CALLED',
      'IN_CONSULTATION',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    ]),
    reason: z.string().max(2000).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }),
});
