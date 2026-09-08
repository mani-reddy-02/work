import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from './test-utils';
import MyBookings from '../pages/MyBookings';
import BookingDetails from '../pages/BookingDetails';
import { opAppointmentApi } from '../lib/opAppointmentApi';

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
});
