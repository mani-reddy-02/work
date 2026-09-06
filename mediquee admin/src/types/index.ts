// User Role Types
export type UserRole = 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'UNVERIFIED';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

// Base Entity
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User Entity
export interface User extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  lastActive?: string;
}

// Hospital Entity
export interface Hospital extends BaseEntity {
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  verificationStatus: VerificationStatus;
  status: UserStatus;
  logo?: string;
  departmentCount: number;
  doctorCount: number;
}

// Doctor Entity
export interface Doctor extends BaseEntity {
  userId: string;
  hospitalId: string;
  name: string; // denormalized for easy access
  hospitalName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  licenseNumber: string;
  verificationStatus: VerificationStatus;
  status: UserStatus;
}

// Appointment Entity
export interface Appointment extends BaseEntity {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
}

// Verification Request Entity
export interface VerificationRequest extends BaseEntity {
  entityId: string; // Hospital or Doctor ID
  entityType: 'HOSPITAL' | 'DOCTOR';
  entityName: string;
  submittedBy: string; // User ID
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents: string[];
  reviewNotes?: string;
}

// Admin Activity
export interface AdminActivity extends BaseEntity {
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityName: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

// Advanced Finance & Services Entities
export type ServiceType = 'OP_BOOKING' | 'VIDEO_CONSULTATION' | 'LAB_TEST' | 'HOME_SAMPLE_COLLECTION' | 'HOME_NURSING';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type SettlementStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface Lab extends BaseEntity {
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  verificationStatus: VerificationStatus;
  status: UserStatus;
  testCount: number;
}

export interface Nurse extends BaseEntity {
  userId: string;
  name: string;
  qualification: string;
  experienceYears: number;
  verificationStatus: VerificationStatus;
  status: UserStatus;
  specialties: string[];
}

export interface Transaction extends BaseEntity {
  transactionId: string;
  date: string;
  customerId: string;
  customerName: string;
  serviceType: ServiceType;
  providerId: string;
  providerName: string;
  hospitalOrLabId?: string;
  hospitalOrLabName?: string;
  grossAmount: number;
  adminCommission: number;
  providerShare: number;
  paymentStatus: PaymentStatus;
  settlementStatus: SettlementStatus;
  relatedOrderId: string; // Appointment ID, Lab Order ID, etc.
}

export interface Settlement extends BaseEntity {
  providerId: string;
  providerName: string;
  providerType: 'HOSPITAL' | 'LAB' | 'NURSE' | 'DOCTOR';
  periodStart: string;
  periodEnd: string;
  totalTransactions: number;
  grossRevenue: number;
  adminCommission: number;
  providerShare: number; // The amount to pay
  status: SettlementStatus;
  processedDate?: string;
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalUsers: number;
  usersTrend: number;
  totalPatients: number;
  totalDoctors: number;
  doctorsTrend: number;
  totalHospitals: number;
  hospitalsTrend: number;
  totalLabs?: number;
  totalNurses?: number;
  totalAppointments: number;
  appointmentsTrend: number;
  activeUsers: number;
  pendingVerifications: number;
  todaysAppointments: number;
  
  // Financial KPIs
  grossRevenue?: number;
  adminCommission?: number;
  providerShare?: number;
  transactions?: number;
  pendingSettlements?: number;
}
