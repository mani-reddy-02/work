import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1).optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
    role: z.string().optional(),
  }).refine((data) => !!(data.identifier || data.email || data.phone), {
    message: 'Email, phone, or identifier is required',
    path: ['identifier'],
  }),
});

export const patientRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Mobile number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  otp: z.string().min(4, 'Valid WhatsApp OTP is required for registration'),
  whatsappConsent: z.boolean().optional(),
  age: z.union([z.number(), z.string()]).optional(),
  gender: z.string().optional(),
  place: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Mobile number must be at least 10 digits'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Mobile number must be at least 10 digits'),
    code: z.string().min(4, 'OTP is required'),
  }),
});


export const hospitalRegisterSchema = z.object({
  account: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(6),
    otp: z.string().optional(),
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
});

export const registerSchema = z.object({
  body: z.union([patientRegisterSchema, hospitalRegisterSchema]),
});

export const forgotPasswordSendOtpSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, 'Email or mobile number is required'),
  }),
});

export const forgotPasswordVerifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Valid mobile number is required'),
    code: z.string().min(4, 'OTP is required'),
  }),
});

export const forgotPasswordResetSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Valid mobile number is required'),
    otp: z.string().min(4, 'OTP is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});
