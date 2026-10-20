import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import LabTestList from '../pages/LabTestList';
import React from 'react';
import { labTestApi, labBookingApi } from '../lib/labTestApi';

const mockTest = {
  id: 'test-101',
  name: 'Complete Blood Count (CBC)',
  category: 'Hematology',
  sampleType: 'Blood',
  sample: 'Blood',
  price: '₹350',
  numericPrice: 350,
  time: '24 hours',
  tat: '24 hours',
  parameters: 24,
  parametersCount: 24,
  desc: 'Evaluates overall health and detects a wide range of disorders.',
  description: 'Evaluates overall health and detects a wide range of disorders.',
  prep: 'No special preparation needed.',
  preparation: 'No special preparation needed.',
  concern: 'Fever',
  healthConcern: 'Fever',
  availableLabCount: 1,
  homeCollectionAvailable: true,
  homeCollectionFee: 50
};

const mockLab = {
  id: 'lab-201',
  name: 'Apollo Diagnostics Centre',
  location: 'Jubilee Hills, Hyderabad',
  address: 'Plot 45, Jubilee Hills, Hyderabad',
  rating: 4.8,
  time: 'Same Day',
  price: '₹350',
  numericPrice: 350
};

const mockAvailability = {
  laboratoryId: 'lab-201',
  laboratoryName: 'Apollo Diagnostics Centre',
  availableDates: [
    { label: 'Today', date: '2026-10-25' },
    { label: 'Tomorrow', date: '2026-10-26' }
  ],
  selectedDate: '2026-10-25',
  slots: [
    { slot: '09:00 AM', available: true },
    { slot: '10:00 AM', available: true }
  ]
};

const mockCreatedBooking = {
  id: 'lab-book-999',
  bookingId: 'LB-999',
  bookingNumber: 'LB-999',
  type: 'WALK_IN',
  testId: 'test-101',
  testName: 'Complete Blood Count (CBC)',
  category: 'Hematology',
  sampleType: 'Blood',
  laboratoryId: 'lab-201',
  laboratoryName: 'Apollo Diagnostics Centre',
  laboratoryAddress: 'Plot 45, Jubilee Hills, Hyderabad',
  patientName: 'Jane Doe',
  patientPhone: '9876543210',
  date: '2026-10-25',
  bookingDate: '2026-10-25',
  timeSlot: '09:00 AM',
  time: '09:00 AM',
  collectionType: 'LAB_VISIT',
  status: 'REQUESTED',
  paymentStatus: 'PAID',
  testPrice: 350,
  collectionFee: 0,
  totalAmount: 350,
  amount: '₹350',
  createdAt: '2026-10-20T10:00:00.000Z'
};

describe('LabTestList Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('mediquee_token', 'mock-jwt-patient-token');
    vi.spyOn(labTestApi, 'getLabTests').mockResolvedValue({ success: true, data: [mockTest as any] });
    vi.spyOn(labTestApi, 'getLaboratoriesForTest').mockResolvedValue({ success: true, data: [mockLab as any] });
    vi.spyOn(labTestApi, 'getLaboratoryAvailability').mockResolvedValue({ success: true, data: mockAvailability as any });
    vi.spyOn(labBookingApi, 'createLabBooking').mockResolvedValue({ success: true, data: mockCreatedBooking as any });
  });

  test('renders health concerns categories and no top search bar initially', () => {
    render(<LabTestList />);
    
    // Initial top search should not be there
    expect(screen.queryByPlaceholderText(/Search Lab Tests/i)).not.toBeInTheDocument();

    expect(screen.getByText('Find Tests by Health Concern')).toBeInTheDocument();
    expect(screen.getAllByText('Fever').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Diabetes').length).toBeGreaterThan(0);
  });

  test('clicking health concern shows concern results and search bar', () => {
    render(<LabTestList />);
    
    // Select concern
    fireEvent.click(screen.getAllByText('Fever')[0]);

    // Search bar should now appear contextually
    const searchInput = screen.getByPlaceholderText(/Search Fever tests/i);
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'glucose' } });
    expect(searchInput).toHaveValue('glucose');
    
    // Back navigation
    const backBtn = screen.getAllByRole('button')[0];
    fireEvent.click(backBtn);
    
    // Search bar should be gone again
    expect(screen.queryByPlaceholderText(/Search Diabetes tests/i)).not.toBeInTheDocument();
  });

  test('executes 5-step booking workflow matching OP and Video consultation structure', async () => {
    render(<LabTestList />);

    // Wait for the mock test to appear and click it
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete Blood Count (CBC)'));

    // Step 2: LAB_SELECT -> Select the lab and proceed directly to Date & Slot
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
      expect(screen.getByText('Apollo Diagnostics Centre')).toBeInTheDocument();
    });
    const toDateSlotBtn = screen.getByRole('button', { name: /Continue to Date & Slot/i });
    fireEvent.click(toDateSlotBtn);

    // Step 3: DATE_TIME -> Choose available slot and proceed directly to Review
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
      expect(screen.getByText('09:00 AM')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('09:00 AM'));

    const toReviewBtn = screen.getByRole('button', { name: /Continue to Review/i });
    expect(toReviewBtn).toBeInTheDocument();
    fireEvent.click(toReviewBtn);

    // Step 4: REVIEW & PAY -> Enter/verify patient details, summary, and pay online
    await waitFor(() => {
      expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
      expect(screen.getByText('Review Your Booking')).toBeInTheDocument();
    });

    // Verify patient input fields are inside Review step
    const nameInput = screen.getByPlaceholderText(/Enter full name/i);
    const phoneInput = screen.getByPlaceholderText(/10-digit mobile number/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Verify summary & payment options
    expect(screen.getByText('Apollo Diagnostics Centre')).toBeInTheDocument();
    expect(screen.getByText('Total Payable')).toBeInTheDocument();
    expect(screen.getByText(/Pay Online/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pay on Collection/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pay on Lab/i)).not.toBeInTheDocument();

    // Confirm & Pay
    const confirmPayBtn = screen.getByRole('button', { name: /Confirm & Pay/i });
    fireEvent.click(confirmPayBtn);

    // Step 5: CONFIRMED -> Booking Confirmed
    await waitFor(() => {
      expect(screen.getByText('Step 5 of 5: Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Booking Confirmed')).toBeInTheDocument();
      expect(screen.getByText('LB-999')).toBeInTheDocument();
    });
  }, 15000);
});

