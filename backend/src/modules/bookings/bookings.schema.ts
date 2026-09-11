import { z } from 'zod';

export const createWalkInBookingSchema = z.object({
  body: z.object({
    departmentId: z.string().uuid('Invalid department ID'),
    doctorId: z.string().uuid('Invalid doctor ID'),
    patientName: z.string().min(2, 'Patient name must be at least 2 characters'),
    patientPhone: z.string().optional(),
    patientAge: z.number().int().min(0).max(150).optional(),
    patientGender: z.string().optional(),
    opType: z.string().default('Normal'),
    fee: z.number().min(0).default(0),
    timeSlot: z.string().optional(),
    slotTime: z.string().optional(),
    appointmentDate: z.string().optional()
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']),
  }),
});
