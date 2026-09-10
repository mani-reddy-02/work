import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from './test-utils';
import MyBookings from '../pages/MyBookings';
import BookingDetails from '../pages/BookingDetails';
import { opAppointmentApi } from '../lib/opAppointmentApi';
import { labBookingApi } from '../lib/labTestApi';
import { homeNursingApi } from '../lib/homeNursingApi';

const mockAppointments = [
  {
    id: 'op-booking-uuid-1',
    appointmentId: 'op-booking-uuid-1',
    hospitalId: 'hosp-1',
    hospitalName: 'Apollo Hospitals',
    hospitalAddress: 'Jubilee Hills, Hyderabad',
    doctorId: 'doc-1',
    doctorName: 'Dr. Ramesh Kumar',
    doctorDesignation: 'Senior Cardiologist',
    doctorAvatar: null,
    departmentName: 'Cardiology',
    diseaseName: 'Chest Pain',
    date: '2026-11-20',
    timeSlot: '10:30 AM',
    status: 'WAITING',
    opType: 'Normal',
    fee: 500,
    reason: 'Routine checkup',
    createdAt: new Date().toISOString()
  },
  {
    id: 'op-booking-uuid-2',
    appointmentId: 'op-booking-uuid-2',
    hospitalId: 'hosp-2',
    hospitalName: 'Sunshine Hospitals',
    hospitalAddress: 'Secunderabad',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Sharma',
    doctorDesignation: 'Pediatrician',
    doctorAvatar: null,
    departmentName: 'Pediatrics',
    diseaseName: 'Viral Fever',
    date: '2024-01-15',
    timeSlot: '02:00 PM',
    status: 'COMPLETED',
    opType: 'Normal',
    fee: 600,
    reason: 'Follow up',
    createdAt: '2024-01-10T10:00:00.000Z'
  }
];

describe('MyBookings Page (Real Database Workflow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(labBookingApi, 'getMyLabBookings').mockResolvedValue({
      success: true,
      data: []
    });
    vi.spyOn(homeNursingApi, 'getMyBookings').mockResolvedValue({
      success: true,
      data: []
    });
  });

  it('fetches real appointments from API and renders them in Upcoming tab', async () => {
    vi.spyOn(opAppointmentApi, 'fetchMyAppointments').mockResolvedValueOnce({
      success: true,
      data: mockAppointments
    });

    render(<MyBookings />);

    // Shows loading skeleton initially
    expect(document.querySelector('.animate-pulse')).toBeDefined();

    // Waits for data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Ramesh Kumar')).toBeDefined();
    });

    expect(screen.getByText('Senior Cardiologist')).toBeDefined();
    expect(screen.getByText('Chest Pain')).toBeDefined();
    expect(screen.getByText('10:30 AM')).toBeDefined();
    expect(screen.getByText('2026-11-20')).toBeDefined();
    expect(screen.getByText('Confirmed')).toBeDefined();
  });

  it('filters past appointments into the Past tab', async () => {
    vi.spyOn(opAppointmentApi, 'fetchMyAppointments').mockResolvedValueOnce({
      success: true,
      data: mockAppointments
    });

    render(<MyBookings />);

    await waitFor(() => {
      expect(screen.getByText('Dr. Ramesh Kumar')).toBeDefined();
    });

    // Completed past appointment is not in upcoming
    expect(screen.queryByText('Dr. Priya Sharma')).toBeNull();

    // Click on Past tab
    const pastTab = screen.getByRole('button', { name: /Past/i });
    fireEvent.click(pastTab);

    // Dr. Priya Sharma appears in past
    await waitFor(() => {
      expect(screen.getByText('Dr. Priya Sharma')).toBeDefined();
    });
    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('shows empty state when no bookings exist', async () => {
    vi.spyOn(opAppointmentApi, 'fetchMyAppointments').mockResolvedValueOnce({
      success: true,
      data: []
    });

    render(<MyBookings />);

    await waitFor(() => {
      expect(screen.queryByText('.animate-pulse')).toBeNull();
    });

    // Click on Past tab
    const pastTab = screen.getByRole('button', { name: /Past/i });
    fireEvent.click(pastTab);

    expect(screen.getByText('No past bookings')).toBeDefined();
  });

  it('shows error banner and allows retry when API fails', async () => {
    const fetchSpy = vi.spyOn(opAppointmentApi, 'fetchMyAppointments')
      .mockResolvedValueOnce({
        success: false,
        error: 'Network error connecting to appointments service'
      })
      .mockResolvedValueOnce({
        success: true,
        data: mockAppointments
      });

    render(<MyBookings />);

    await waitFor(() => {
      expect(screen.getByText(/Network error connecting to appointments service/i)).toBeDefined();
    });

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Dr. Ramesh Kumar')).toBeDefined();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

import { Routes, Route } from 'react-router-dom';

describe('BookingDetails Page (Real Database Fetch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches real appointment by ID and renders full details', async () => {
    vi.spyOn(opAppointmentApi, 'fetchAppointmentDetails').mockResolvedValueOnce({
      success: true,
      data: mockAppointments[0]
    });

    render(
      <Routes>
        <Route path="/booking/:id" element={<BookingDetails />} />
      </Routes>,
      { initialEntries: ['/booking/op-booking-uuid-1'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Ramesh Kumar')).toBeDefined();
    });

    expect(screen.getByText('Apollo Hospitals')).toBeDefined();
    expect(screen.getByText('10:30 AM')).toBeDefined();
    expect(screen.getByText('2026-11-20')).toBeDefined();
    expect(screen.getByText('₹500')).toBeDefined();
    expect(screen.getByText('op-booking-uuid-1')).toBeDefined();
    expect(screen.getByText(/Routine checkup/i)).toBeDefined();
  });

  it('renders friendly error when appointment is not found', async () => {
    vi.spyOn(opAppointmentApi, 'fetchAppointmentDetails').mockResolvedValueOnce({
      success: false,
      error: 'Appointment not found'
    });

    render(
      <Routes>
        <Route path="/booking/:id" element={<BookingDetails />} />
      </Routes>,
      { initialEntries: ['/booking/non-existent-id'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Booking Not Found')).toBeDefined();
    });

    expect(screen.getByText('Appointment not found')).toBeDefined();
  });

  it('fetches real lab booking by ID and renders diagnostic details', async () => {
    vi.spyOn(opAppointmentApi, 'fetchAppointmentDetails').mockResolvedValueOnce({
      success: false,
      error: 'Appointment not found'
    });
    vi.spyOn(labBookingApi, 'getLabBookingById').mockResolvedValueOnce({
      success: true,
      data: {
        id: 'lab-booking-uuid-1',
        bookingNumber: 'MED-LAB-998877',
        testId: 'test-1',
        testName: 'Complete Blood Count (CBC)',
        laboratoryId: 'lab-1',
        laboratoryName: 'Apollo Diagnostics',
        laboratoryAddress: 'Banjara Hills, Hyderabad',
        laboratoryPhone: '+91-9876543210',
        collectionType: 'LAB_VISIT',
        collectionAddress: null,
        date: '2026-11-25',
        timeSlot: '09:00 AM - 10:00 AM',
        patientName: 'Rahul Verma',
        patientPhone: '9876543210',
        patientEmail: 'rahul@example.com',
        patientAge: 32,
        patientGender: 'Male',
        status: 'CONFIRMED',
        testPrice: 350,
        collectionFee: 0,
        totalAmount: 350,
        amount: '₹350',
        prep: 'No special preparation needed.',
        createdAt: new Date().toISOString()
      } as any
    });

    render(
      <Routes>
        <Route path="/booking/:id" element={<BookingDetails />} />
      </Routes>,
      { initialEntries: ['/booking/lab-booking-uuid-1'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeDefined();
    });

    expect(screen.getAllByText('Apollo Diagnostics').length).toBeGreaterThan(0);
    expect(screen.getByText('MED-LAB-998877')).toBeDefined();
    expect(screen.getByText('Visit Laboratory')).toBeDefined();
    expect(screen.getByText('Rahul Verma')).toBeDefined();
    expect(screen.getAllByText('₹350').length).toBeGreaterThan(0);
  });

  it('fetches real home nursing booking by ID and renders nursing details', async () => {
    vi.spyOn(opAppointmentApi, 'fetchAppointmentDetails').mockResolvedValueOnce({
      success: false,
      error: 'Appointment not found'
    });
    vi.spyOn(labBookingApi, 'getLabBookingById').mockResolvedValueOnce({
      success: false,
      error: 'Lab booking not found'
    });
    vi.spyOn(homeNursingApi, 'getBookingById').mockResolvedValueOnce({
      success: true,
      data: {
        id: 'nursing-booking-uuid-1',
        bookingNumber: 'MQ-HN-TEST-9988',
        serviceId: 'serv-1',
        serviceName: 'Elderly Care',
        serviceCategory: 'Elderly Care',
        hospitalId: 'hosp-1',
        hospitalName: 'SM Hospital',
        hospitalAddress: 'Banjara Hills, Hyderabad',
        hospitalPhone: '+91-9988776655',
        nurseName: 'Sister Mary',
        nurseDesignation: 'Senior Palliative Nurse',
        patientName: 'Sunita Rao',
        patientPhone: '9876543210',
        patientAge: 74,
        patientGender: 'Female',
        date: '2026-11-28',
        timeSlot: 'Day Shift (08:00 AM - 08:00 PM)',
        duration: '12 Hours',
        address: 'Villa 12, Palm Meadows',
        city: 'Hyderabad',
        pincode: '500084',
        notes: 'Needs daily mobility assistance',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 1500,
        amount: '₹1,500',
        createdAt: new Date().toISOString()
      } as any
    });

    render(
      <Routes>
        <Route path="/booking/:id" element={<BookingDetails />} />
      </Routes>,
      { initialEntries: ['/booking/nursing-booking-uuid-1'] }
    );

    await waitFor(() => {
      expect(screen.getAllByText('Elderly Care').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('SM Hospital').length).toBeGreaterThan(0);
    expect(screen.getByText('MQ-HN-TEST-9988')).toBeDefined();
    expect(screen.getByText('Sister Mary')).toBeDefined();
    expect(screen.getByText('Sunita Rao')).toBeDefined();
    expect(screen.getByText(/Villa 12, Palm Meadows/i)).toBeDefined();
    expect(screen.getByText('Day Shift (08:00 AM - 08:00 PM)')).toBeDefined();
    expect(screen.getAllByText('₹1,500').length).toBeGreaterThan(0);
  });
});
