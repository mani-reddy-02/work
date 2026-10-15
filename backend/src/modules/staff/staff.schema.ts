import { z } from 'zod';

// Allowlist: only these roles can be created by Hospital Admin
const ALLOWED_STAFF_ROLES = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_ADMIN'] as const;

export const createStaffSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(ALLOWED_STAFF_ROLES, {
      message: 'Role must be one of: DOCTOR, NURSE, RECEPTIONIST, LAB_ADMIN',
    }),
    phone: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    experienceYears: z.union([z.number(), z.string().transform(v => v.trim() === '' ? null : Number(v))]).optional().nullable(),
    licenseNumber: z.string().optional().nullable(),
    consultationFee: z.union([z.number(), z.string().transform(v => v.trim() === '' ? null : Number(v))]).optional().nullable(),
    qualification: z.string().optional().nullable(),
    specialization: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    dob: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }).refine((data) => {
    if (data.role === 'DOCTOR' && !data.departmentId) {
      return false;
    }
    return true;
  }, {
    message: "Department is required for doctors",
    path: ["departmentId"]
  }),
});

export const updateStaffSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    active: z.boolean().optional(),
    experienceYears: z.union([z.number(), z.string().transform(v => v.trim() === '' ? null : Number(v))]).optional().nullable(),
    licenseNumber: z.string().optional().nullable(),
    consultationFee: z.union([z.number(), z.string().transform(v => v.trim() === '' ? null : Number(v))]).optional().nullable(),
    qualification: z.string().optional().nullable(),
    specialization: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    dob: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
  }),
});
