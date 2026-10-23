import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import DepartmentBooking from '../pages/DepartmentBooking';
import { departmentApi } from '../lib/hospitalApi';
import { opAppointmentApi } from '../lib/opAppointmentApi';
import React from 'react';

vi.mock('../lib/hospitalApi', () => ({
  departmentApi: {
    getDepartments: vi.fn(),
    getDepartmentDoctors: vi.fn(),
    getDepartment: vi.fn()
  }
}));

vi.mock('../lib/opAppointmentApi', () => ({
  opAppointmentApi: {
    fetchDoctorAvailability: vi.fn(),
    createOpAppointment: vi.fn()
  }
}));

const mockDepartments = [
  {
    id: 'dept-1',
    name: 'General Medicine',
    description: 'General health and wellness',
    doctorCount: 4,
    hospitalName: 'SM HOSPITAL',
    hospitalCity: 'Hyderabad',
    isActive: true
  },
  {
    id: 'dept-2',
    name: 'Cardiology',
    description: 'Heart care',
    doctorCount: 2,
    hospitalName: 'SM HOSPITAL',
    hospitalCity: 'Hyderabad',
    isActive: true
  }
];

const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Jane Smith',
    specialization: 'General Medicine',
    qualification: 'MBBS, MD',
    experience: '10+ Years',
    designation: 'Senior Consultant Physician',
    hospitalId: 'hosp-1',
    hospitalName: 'SM HOSPITAL',
    hospitalAddress: 'Road No 1, Banjara Hills',
    hospitalCity: 'Hyderabad',
    hospitalPhone: '9876543210',
    departmentId: 'dept-1',
    department: 'General Medicine',
    consultationFee: 500,
    fees: '₹500'
  }
];

describe('DepartmentBooking Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (departmentApi.getDepartments as any).mockResolvedValue({
      success: true,
      data: mockDepartments
    });
    (departmentApi.getDepartmentDoctors as any).mockResolvedValue({
      success: true,
      data: mockDoctors
    });
    (opAppointmentApi.fetchDoctorAvailability as any).mockResolvedValue({
      success: true,
      data: {
        doctorId: 'doc-1',
        doctorName: 'Dr. Jane Smith',
        date: '2026-10-24',
        availableSlots: ['09:30 AM', '10:00 AM', '02:30 PM'],
        bookedSlots: []
      }
    });
    (opAppointmentApi.createOpAppointment as any).mockResolvedValue({
      success: true,
      data: {
        id: 'OP-12345',
        tokenNumber: 5,
        status: 'WAITING'
      }
    });
  });

  test('renders Browse Departments step with backend configured departments', async () => {
    render(<DepartmentBooking />);

    expect(screen.getByText('Browse Departments')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('General Medicine')).toBeInTheDocument();
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText('4 Doctors')).toBeInTheDocument();
      expect(screen.getByText('2 Doctors')).toBeInTheDocument();
    });
  });

  test('navigates Department -> Doctor directly without disease selection', async () => {
    render(<DepartmentBooking />);

    await waitFor(() => {
      expect(screen.getByText('General Medicine')).toBeInTheDocument();
    });

    // Click General Medicine department
    fireEvent.click(screen.getByText('General Medicine').closest('button')!);

    // Should load doctors directly
    await waitFor(() => {
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
      expect(screen.getByText(/Senior Consultant Physician/i)).toBeInTheDocument();
      expect(screen.getByText(/Road No 1, Banjara Hills/i)).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument();
    });

    // Check Call Clinic link
    const callBtn = screen.getByText('Call Clinic').closest('a');
    expect(callBtn).toHaveAttribute('href', 'tel:9876543210');
  });

  test('completes full booking flow: Doctor -> Slot -> Patient Details -> Review & Pay -> Confirmation', async () => {
    render(<DepartmentBooking />);

    // 1. Select Department
    await waitFor(() => {
      expect(screen.getByText('General Medicine')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('General Medicine').closest('button')!);

    // 2. Select Doctor (Choose Slot)
    await waitFor(() => {
      expect(screen.getByText('Choose Slot')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Choose Slot'));

    // 3. Choose Slot
    await waitFor(() => {
      expect(screen.getByText('09:30 AM')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('09:30 AM'));

    const continueBtn = screen.getByText('Continue to Patient Details');
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);

    // 4. Patient Details Form
    await waitFor(() => {
      expect(screen.getByText('Patient & Contact Information')).toBeInTheDocument();
    });

    // Fill in name, phone, age
    fireEvent.change(screen.getByPlaceholderText('e.g. Ramesh Kumar'), { target: { value: 'Ramesh Kumar' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 9876543210'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 35'), { target: { value: '28' } });

    // Submit details
    fireEvent.click(screen.getByText('Continue to Review & Pay'));

    // 5. Review & Pay
    await waitFor(() => {
      expect(screen.getByText('Appointment Review & Summary')).toBeInTheDocument();
      expect(screen.getByText('09:30 AM')).toBeInTheDocument();
      expect(screen.getByText('Confirm & Schedule Appointment')).toBeInTheDocument();
    });

    // Click Confirm & Schedule
    fireEvent.click(screen.getByText('Confirm & Schedule Appointment'));

    // 6. Confirmation Screen
    await waitFor(() => {
      expect(screen.getByText('Booking Scheduled Successfully!')).toBeInTheDocument();
      expect(screen.getByText('OP-12345')).toBeInTheDocument();
      expect(screen.getByText('Token #5')).toBeInTheDocument();
      expect(screen.getByText('View in My Bookings')).toBeInTheDocument();
    });
  });
});
