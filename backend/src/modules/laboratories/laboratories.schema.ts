import { z } from 'zod';

export const createHospitalLabSchema = z.object({
  body: z.object({
    platformDepartmentId: z.string().min(1, 'Please select a laboratory department'),
    labLicenseNumber: z.string().min(3, 'Lab License Number is required'),
    labLicenseDocumentUrl: z.string().min(1, 'Lab License Document is required'),
    licenseValidUntil: z.string().optional().nullable(),
    email: z.string().email('Valid email address required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(10, 'Contact Number must be at least 10 digits'),
  }),
});

export type CreateHospitalLabInput = z.infer<typeof createHospitalLabSchema>['body'];
