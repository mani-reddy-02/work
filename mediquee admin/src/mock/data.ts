import { 
  User, Hospital, Doctor, Appointment, VerificationRequest, AdminActivity, DashboardKPIs 
} from '../types';

export const mockKPIs: DashboardKPIs = {
  totalUsers: 24580,
  usersTrend: 12.8,
  totalPatients: 21420,
  totalDoctors: 1248,
  doctorsTrend: 5.2,
  totalHospitals: 186,
  hospitalsTrend: 2.4,
  totalAppointments: 48920,
  appointmentsTrend: 15.3,
  activeUsers: 18640,
  pendingVerifications: 24,
  todaysAppointments: 342,
};

export const mockUsers: User[] = [
  { id: 'U1', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 9876543210', role: 'PATIENT', status: 'ACTIVE', createdAt: '2023-01-15T10:00:00Z', updatedAt: '2023-10-01T10:00:00Z', lastActive: '2023-10-25T14:30:00Z' },
  { id: 'U2', name: 'Dr. Anita Desai', email: 'anita.d@apollo.com', phone: '+91 9876543211', role: 'DOCTOR', status: 'ACTIVE', createdAt: '2023-02-20T10:00:00Z', updatedAt: '2023-09-15T10:00:00Z', lastActive: '2023-10-26T09:15:00Z' },
  { id: 'U3', name: 'Hospital Admin', email: 'admin@manipal.com', phone: '+91 9876543212', role: 'HOSPITAL_ADMIN', status: 'ACTIVE', createdAt: '2023-03-10T10:00:00Z', updatedAt: '2023-08-20T10:00:00Z', lastActive: '2023-10-26T11:00:00Z' },
  { id: 'U4', name: 'System Admin', email: 'sysadmin@mediquee.com', phone: '+91 9876543213', role: 'SYSTEM_ADMIN', status: 'ACTIVE', createdAt: '2022-12-01T10:00:00Z', updatedAt: '2023-10-26T10:00:00Z', lastActive: '2023-10-26T15:45:00Z' },
  { id: 'U5', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 9876543214', role: 'PATIENT', status: 'INACTIVE', createdAt: '2023-05-12T10:00:00Z', updatedAt: '2023-07-30T10:00:00Z', lastActive: '2023-07-30T10:00:00Z' },
];

export const mockHospitals: Hospital[] = [
  { id: 'H1', name: 'Apollo Healthcare Center', registrationNumber: 'REG-APL-2023', email: 'contact@apollo.com', phone: '+91 8001234567', address: '123 Health Ave', city: 'Bangalore', state: 'Karnataka', verificationStatus: 'VERIFIED', status: 'ACTIVE', departmentCount: 15, doctorCount: 120, createdAt: '2023-01-10T10:00:00Z', updatedAt: '2023-01-15T10:00:00Z' },
  { id: 'H2', name: 'Manipal Hospital', registrationNumber: 'REG-MNP-2023', email: 'info@manipal.com', phone: '+91 8007654321', address: '456 Wellness Blvd', city: 'Mumbai', state: 'Maharashtra', verificationStatus: 'VERIFIED', status: 'ACTIVE', departmentCount: 12, doctorCount: 85, createdAt: '2023-02-05T10:00:00Z', updatedAt: '2023-02-10T10:00:00Z' },
  { id: 'H3', name: 'City Care Clinic', registrationNumber: 'REG-CCC-2023', email: 'admin@citycare.com', phone: '+91 8001122334', address: '789 Care St', city: 'Delhi', state: 'Delhi', verificationStatus: 'PENDING', status: 'PENDING', departmentCount: 5, doctorCount: 15, createdAt: '2023-10-20T10:00:00Z', updatedAt: '2023-10-20T10:00:00Z' },
];

export const mockDoctors: Doctor[] = [
  { id: 'D1', userId: 'U2', hospitalId: 'H1', name: 'Dr. Anita Desai', hospitalName: 'Apollo Healthcare Center', specialization: 'Cardiology', qualification: 'MBBS, MD', experienceYears: 12, consultationFee: 1500, licenseNumber: 'MED-12345', verificationStatus: 'VERIFIED', status: 'ACTIVE', createdAt: '2023-02-20T10:00:00Z', updatedAt: '2023-03-01T10:00:00Z' },
  { id: 'D2', userId: 'U6', hospitalId: 'H1', name: 'Dr. Suresh Kumar', hospitalName: 'Apollo Healthcare Center', specialization: 'Neurology', qualification: 'MBBS, DM', experienceYears: 15, consultationFee: 2000, licenseNumber: 'MED-67890', verificationStatus: 'VERIFIED', status: 'ACTIVE', createdAt: '2023-04-15T10:00:00Z', updatedAt: '2023-05-01T10:00:00Z' },
  { id: 'D3', userId: 'U7', hospitalId: 'H2', name: 'Dr. Priya Ranjan', hospitalName: 'Manipal Hospital', specialization: 'Pediatrics', qualification: 'MBBS, MD', experienceYears: 8, consultationFee: 1000, licenseNumber: 'MED-54321', verificationStatus: 'PENDING', status: 'PENDING', createdAt: '2023-10-22T10:00:00Z', updatedAt: '2023-10-22T10:00:00Z' },
];

export const mockAppointments: Appointment[] = [
  { id: 'APT-10234', patientId: 'U1', patientName: 'Rahul Sharma', doctorId: 'D1', doctorName: 'Dr. Anita Desai', hospitalId: 'H1', hospitalName: 'Apollo Healthcare Center', departmentName: 'Cardiology', date: '2023-10-26', time: '10:30 AM', status: 'COMPLETED', reason: 'Routine Checkup', createdAt: '2023-10-20T10:00:00Z', updatedAt: '2023-10-26T11:00:00Z' },
  { id: 'APT-10235', patientId: 'U5', patientName: 'Vikram Singh', doctorId: 'D2', doctorName: 'Dr. Suresh Kumar', hospitalId: 'H1', hospitalName: 'Apollo Healthcare Center', departmentName: 'Neurology', date: '2023-10-27', time: '02:00 PM', status: 'CONFIRMED', reason: 'Migraine followup', createdAt: '2023-10-21T10:00:00Z', updatedAt: '2023-10-21T10:00:00Z' },
  { id: 'APT-10236', patientId: 'U8', patientName: 'Sneha Patil', doctorId: 'D1', doctorName: 'Dr. Anita Desai', hospitalId: 'H1', hospitalName: 'Apollo Healthcare Center', departmentName: 'Cardiology', date: '2023-10-28', time: '11:00 AM', status: 'PENDING', reason: 'Chest pain consultation', createdAt: '2023-10-26T08:00:00Z', updatedAt: '2023-10-26T08:00:00Z' },
];

export const mockVerifications: VerificationRequest[] = [
  { id: 'VR-001', entityId: 'H3', entityType: 'HOSPITAL', entityName: 'City Care Clinic', submittedBy: 'U9', status: 'PENDING', documents: ['registration_cert.pdf', 'tax_doc.pdf'], createdAt: '2023-10-20T10:00:00Z', updatedAt: '2023-10-20T10:00:00Z' },
  { id: 'VR-002', entityId: 'D3', entityType: 'DOCTOR', entityName: 'Dr. Priya Ranjan', submittedBy: 'U7', status: 'PENDING', documents: ['medical_license.pdf', 'degree.pdf'], createdAt: '2023-10-22T10:00:00Z', updatedAt: '2023-10-22T10:00:00Z' },
];

export const mockActivities: AdminActivity[] = [
  { id: 'ACT-1', adminId: 'U4', adminName: 'System Admin', action: 'Approved Hospital Verification', entityType: 'HOSPITAL', entityName: 'Manipal Hospital', status: 'SUCCESS', createdAt: '2023-02-10T10:00:00Z', updatedAt: '2023-02-10T10:00:00Z' },
  { id: 'ACT-2', adminId: 'U4', adminName: 'System Admin', action: 'Deactivated User', entityType: 'USER', entityName: 'Vikram Singh', status: 'WARNING', createdAt: '2023-07-30T10:00:00Z', updatedAt: '2023-07-30T10:00:00Z' },
  { id: 'ACT-3', adminId: 'U4', adminName: 'System Admin', action: 'Changed Platform Setting: Default Appointment Duration', entityType: 'SETTING', entityName: 'System Settings', status: 'SUCCESS', createdAt: '2023-10-25T16:00:00Z', updatedAt: '2023-10-25T16:00:00Z' },
];

export const mockChartData = {
  userGrowth: [
    { name: 'Jan', patients: 12000, doctors: 800, admins: 50 },
    { name: 'Feb', patients: 13500, doctors: 850, admins: 60 },
    { name: 'Mar', patients: 15200, doctors: 920, admins: 75 },
    { name: 'Apr', patients: 16800, doctors: 980, admins: 90 },
    { name: 'May', patients: 18100, doctors: 1050, admins: 110 },
    { name: 'Jun', patients: 19500, doctors: 1120, admins: 130 },
    { name: 'Jul', patients: 21420, doctors: 1248, admins: 150 },
  ],
  appointmentTrends: [
    { name: 'Mon', total: 450, completed: 380, cancelled: 40, pending: 30 },
    { name: 'Tue', total: 520, completed: 420, cancelled: 50, pending: 50 },
    { name: 'Wed', total: 480, completed: 390, cancelled: 60, pending: 30 },
    { name: 'Thu', total: 550, completed: 460, cancelled: 45, pending: 45 },
    { name: 'Fri', total: 600, completed: 510, cancelled: 55, pending: 35 },
    { name: 'Sat', total: 420, completed: 350, cancelled: 30, pending: 40 },
    { name: 'Sun', total: 250, completed: 210, cancelled: 20, pending: 20 },
  ],
  appointmentStatus: [
    { name: 'Completed', value: 32540, color: '#10b981' },
    { name: 'Pending', value: 8420, color: '#f59e0b' },
    { name: 'Confirmed', value: 5210, color: '#3b82f6' },
    { name: 'Cancelled', value: 2150, color: '#ef4444' },
    { name: 'No Show', value: 600, color: '#64748b' },
  ],
  userRoles: [
    { name: 'Patients', value: 21420, color: '#3b82f6' },
    { name: 'Doctors', value: 1248, color: '#10b981' },
    { name: 'Hospital Admins', value: 380, color: '#8b5cf6' },
    { name: 'System Admins', value: 12, color: '#ef4444' },
  ]
};

import { Lab, Nurse, Transaction, Settlement } from '../types';

export const mockLabs: Lab[] = [
  { id: 'L1', name: 'Dr. Lal PathLabs', registrationNumber: 'REG-LPL-001', email: 'contact@lalpath.com', phone: '+91 9988776655', address: '45 Lab Street', city: 'Delhi', state: 'Delhi', verificationStatus: 'VERIFIED', status: 'ACTIVE', testCount: 450, createdAt: '2023-01-10T10:00:00Z', updatedAt: '2023-01-15T10:00:00Z' },
  { id: 'L2', name: 'Thyrocare', registrationNumber: 'REG-THY-002', email: 'info@thyrocare.com', phone: '+91 9988776644', address: '12 Medical Rd', city: 'Mumbai', state: 'Maharashtra', verificationStatus: 'VERIFIED', status: 'ACTIVE', testCount: 320, createdAt: '2023-02-05T10:00:00Z', updatedAt: '2023-02-10T10:00:00Z' }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    transactionId: 'TXN-20231026-001',
    date: '2023-10-26T10:30:00Z',
    customerId: 'U1',
    customerName: 'Rahul Sharma',
    serviceType: 'OP_BOOKING',
    providerId: 'D1',
    providerName: 'Dr. Anita Desai',
    hospitalOrLabId: 'H1',
    hospitalOrLabName: 'Apollo Healthcare Center',
    grossAmount: 1500,
    adminCommission: 300,
    providerShare: 1200,
    paymentStatus: 'SUCCESS',
    settlementStatus: 'PAID',
    relatedOrderId: 'APT-10234',
    createdAt: '2023-10-26T10:30:00Z',
    updatedAt: '2023-10-26T10:30:00Z'
  },
  {
    id: 'TXN-002',
    transactionId: 'TXN-20231026-002',
    date: '2023-10-26T11:45:00Z',
    customerId: 'U5',
    customerName: 'Vikram Singh',
    serviceType: 'LAB_TEST',
    providerId: 'L1',
    providerName: 'Dr. Lal PathLabs',
    hospitalOrLabId: 'L1',
    hospitalOrLabName: 'Dr. Lal PathLabs',
    grossAmount: 2500,
    adminCommission: 500,
    providerShare: 2000,
    paymentStatus: 'SUCCESS',
    settlementStatus: 'PENDING',
    relatedOrderId: 'LAB-ORD-1045',
    createdAt: '2023-10-26T11:45:00Z',
    updatedAt: '2023-10-26T11:45:00Z'
  },
  {
    id: 'TXN-003',
    transactionId: 'TXN-20231027-003',
    date: '2023-10-27T14:20:00Z',
    customerId: 'U8',
    customerName: 'Sneha Patil',
    serviceType: 'VIDEO_CONSULTATION',
    providerId: 'D2',
    providerName: 'Dr. Suresh Kumar',
    hospitalOrLabId: 'H1',
    hospitalOrLabName: 'Apollo Healthcare Center',
    grossAmount: 1000,
    adminCommission: 200,
    providerShare: 800,
    paymentStatus: 'SUCCESS',
    settlementStatus: 'PROCESSING',
    relatedOrderId: 'APT-10237',
    createdAt: '2023-10-27T14:20:00Z',
    updatedAt: '2023-10-27T14:20:00Z'
  }
];

export const mockSettlements: Settlement[] = [
  {
    id: 'SET-001',
    providerId: 'H1',
    providerName: 'Apollo Healthcare Center',
    providerType: 'HOSPITAL',
    periodStart: '2023-10-01T00:00:00Z',
    periodEnd: '2023-10-15T23:59:59Z',
    totalTransactions: 145,
    grossRevenue: 240000,
    adminCommission: 48000,
    providerShare: 192000,
    status: 'PAID',
    processedDate: '2023-10-17T10:00:00Z',
    createdAt: '2023-10-16T02:00:00Z',
    updatedAt: '2023-10-17T10:00:00Z'
  },
  {
    id: 'SET-002',
    providerId: 'L1',
    providerName: 'Dr. Lal PathLabs',
    providerType: 'LAB',
    periodStart: '2023-10-16T00:00:00Z',
    periodEnd: '2023-10-31T23:59:59Z',
    totalTransactions: 89,
    grossRevenue: 120000,
    adminCommission: 24000,
    providerShare: 96000,
    status: 'PENDING',
    createdAt: '2023-11-01T02:00:00Z',
    updatedAt: '2023-11-01T02:00:00Z'
  }
];

// Update mockKPIs with new financial KPIs
export const mockKPIsAdvanced = {
  ...mockKPIs,
  totalLabs: 45,
  totalNurses: 210,
  grossRevenue: 4860000,
  adminCommission: 972000,
  providerShare: 3888000,
  transactions: 18642,
  pendingSettlements: 426000,
};
