import { z } from 'zod';

export const recordConsultationSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, 'Booking ID is required')
  }),
  body: z.object({
    diagnosis: z.string().min(3, 'Diagnosis must be at least 3 characters'),
    clinicalNotes: z.string().optional().nullable(),
    generalAdvice: z.string().optional().nullable(),
    followUpDate: z.string().optional().nullable(),
    vitals: z.object({
      systolicBp: z.number().int().min(40).max(300).optional().nullable(),
      diastolicBp: z.number().int().min(30).max(200).optional().nullable(),
      pulseRate: z.number().int().min(30).max(250).optional().nullable(),
      bodyTemperature: z.number().min(80).max(115).optional().nullable(),
      respiratoryRate: z.number().int().min(5).max(80).optional().nullable(),
      spo2: z.number().int().min(50).max(100).optional().nullable(),
      weightKg: z.number().min(1).max(500).optional().nullable(),
      heightCm: z.number().min(30).max(300).optional().nullable(),
    }).optional().nullable(),
    prescriptions: z.array(z.object({
      medicineName: z.string().min(1, 'Medicine name is required'),
      dosageForm: z.string().min(1, 'Dosage form is required'),
      strength: z.string().optional().nullable(),
      frequency: z.string().min(1, 'Frequency is required'),
      durationDays: z.number().int().min(1, 'Duration must be at least 1 day'),
      timing: z.enum(['BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'EMPTY_STOMACH']).default('AFTER_FOOD'),
      instructions: z.string().optional().nullable(),
    })).default([]),
    labTestIds: z.array(z.string().uuid('Invalid Lab Test ID')).default([]),
  })
});

export const updatePresenceSchema = z.object({
  body: z.object({
    presenceStatus: z.enum(['AVAILABLE_IN_OPD', 'ON_BREAK', 'IN_SURGERY', 'OFF_DUTY'])
  })
});
