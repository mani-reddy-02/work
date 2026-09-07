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
    phone: z.string().optional(),
    designation: z.string().optional(),
    avatar: z.string().optional(),
    departmentId: z.string().uuid().optional(),
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
    phone: z.string().optional(),
    designation: z.string().optional(),
    departmentId: z.string().uuid().optional().nullable(),
    active: z.boolean().optional(),
    // Role is intentionally NOT included — role is immutable in Step 3
    // Password is intentionally NOT included — separate flow
  }),
});
