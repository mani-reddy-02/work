import { z } from "zod";

// Shared Base Schemas
export const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const businessTypeSchema = z.object({
  businessType: z.enum(["hospital", "laboratory"])
});

export const locationSchema = z.object({
  address1: z.string().min(5, "Address Line 1 is required"),
  address2: z.string().optional(),
  area: z.string().min(2, "Area/Locality is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  pincode: z.string().min(5, "Valid pincode is required"),
  contactNumber: z.string().min(10, "Contact Number is required"),
  email: z.string().email("Valid email is required"),
  emergencyContact: z.string().optional()
});

export const adminSchema = z.object({
  adminName: z.string().min(2, "Name is required"),
  adminRole: z.string().min(2, "Role is required"),
  adminPhone: z.string().min(10, "Phone is required"),
  adminEmail: z.string().email("Email is required"),
  adminPhoto: z.any().optional()
});

// Hospital Specific Schemas
export const hospitalInfoSchema = z.object({
  hospitalName: z.string().min(2, "Hospital Name is required"),
  hospitalLogo: z.any().optional(),
  hospitalType: z.string().min(2, "Hospital Type is required"),
  registrationNumber: z.string().min(2, "Registration Number is required"),
  hospitalPhone: z.string().min(10, "Phone is required"),
  hospitalEmail: z.string().email("Email is required"),
  website: z.string().optional(),
  establishedYear: z.string().optional()
});

export const hospitalServicesSchema = z.object({
  services: z.array(z.string()).min(1, "Select at least one service")
});

export const hospitalDepartmentsSchema = z.object({
  departments: z.array(z.string()).min(1, "Select at least one department"),
  customDepartments: z.array(z.object({
    name: z.string(),
    code: z.string().optional(),
    description: z.string().optional()
  })).optional()
});

export const hospitalVerificationSchema = z.object({
  registrationCertificate: z.any().refine((file) => file, "Registration Certificate is required"),
  clinicalEstablishment: z.any().refine((file) => file, "Clinical Establishment Registration is required"),
  nabh: z.any().optional(),
  fireSafety: z.any().optional(),
  bioWaste: z.any().optional(),
  gst: z.any().optional(),
  pan: z.any().optional(),
  pharmacyLicense: z.any().optional(),
  otherCertifications: z.any().optional()
});

// Laboratory Specific Schemas
export const labInfoSchema = z.object({
  labName: z.string().min(2, "Laboratory Name is required"),
  labLogo: z.any().optional(),
  labType: z.string().min(2, "Laboratory Type is required"),
  registrationNumber: z.string().min(2, "Registration Number is required"),
  labPhone: z.string().min(10, "Phone is required"),
  labEmail: z.string().email("Email is required"),
  website: z.string().optional(),
  establishedYear: z.string().optional()
});

export const labServicesSchema = z.object({
  services: z.array(z.string()).min(1, "Select at least one service")
});

export const labVerificationSchema = z.object({
  registrationCertificate: z.any().refine((file) => file, "Laboratory Registration Certificate is required"),
  clinicalEstablishment: z.any().refine((file) => file, "Healthcare Registration is required"),
  nabl: z.any().optional(),
  nabh: z.any().optional(),
  bioWaste: z.any().optional(),
  stateLicense: z.any().optional(),
  pharmacyLicense: z.any().optional(),
  gst: z.any().optional(),
  pan: z.any().optional(),
  otherCertifications: z.any().optional()
});

// Main Combined Schema
export const onboardingSchema = z.object({
  account: accountSchema,
  businessType: businessTypeSchema,
  
  // Hospital specific
  hospitalInfo: hospitalInfoSchema.optional(),
  hospitalLocation: locationSchema.optional(),
  hospitalServices: hospitalServicesSchema.optional(),
  hospitalDepartments: hospitalDepartmentsSchema.optional(),
  hospitalVerification: hospitalVerificationSchema.optional(),
  hospitalAdmin: adminSchema.optional(),

  // Laboratory specific
  labInfo: labInfoSchema.optional(),
  labLocation: locationSchema.optional(),
  labServices: labServicesSchema.optional(),
  labVerification: labVerificationSchema.optional(),
  labAdmin: adminSchema.optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
