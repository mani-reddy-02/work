import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import HomeSampleList from '../pages/HomeSampleList';
import React from 'react';
import { homeSampleCollectionApi } from '../lib/homeSampleCollectionApi';

const mockHomeTest = {
  id: 'test-hsc-1',
  name: 'Thyroid Profile Total (T3, T4, TSH)',
  category: 'Endocrinology',
  sampleType: 'Blood',
  sample: 'Blood',
  price: '₹499',
  numericPrice: 499,
  time: '12-24 Hours',
  tat: '12-24 Hours',
  parameters: 3,
  parametersCount: 3,
  desc: 'Screening for hyperthyroidism and hypothyroidism.',
  description: 'Screening for hyperthyroidism and hypothyroidism.',
  prep: 'Overnight fasting may be recommended.',
  preparation: 'Overnight fasting may be recommended.',
  concern: 'Thyroid',
  healthConcern: 'Thyroid',
  availableLabCount: 1,
  homeCollectionAvailable: true,
  homeCollectionFee: 0,
};

const mockHomeLab = {
  id: 'lab-hsc-1',
  name: 'Thyrocare Certified Laboratory',
  location: 'Madhapur, Hyderabad',
  address: 'Plot 12, Madhapur, Hyderabad',
  rating: 4.9,
  time: 'Same Day',
  price: '₹499',
  numericPrice: 499,
  homeCollectionFee: 50,
};

const mockHomeAvailability = {
  laboratoryId: 'lab-hsc-1',
  laboratoryName: 'Thyrocare Certified Laboratory',
  availableDates: [
    { label: 'Today', date: '2026-10-25' },
    { label: 'Tomorrow', date: '2026-10-26' },
  ],
  selectedDate: '2026-10-25',
  slots: [
    { slot: '07:30 AM', available: true },
    { slot: '08:30 AM', available: true },
  ],
};

const mockHomeCreatedBooking = {
  id: 'hsc-book-100',
  bookingId: 'MQ-HSC-100',
  bookingNumber: 'MQ-HSC-100',
  type: 'HOME_COLLECTION',
  testId: 'test-hsc-1',
  testName: 'Thyroid Profile Total (T3, T4, TSH)',
  category: 'Endocrinology',
  sampleType: 'Blood',
  laboratoryId: 'lab-hsc-1',
  laboratoryName: 'Thyrocare Certified Laboratory',
  laboratoryAddress: 'Plot 12, Madhapur, Hyderabad',
  patientName: 'John Patient',
  patientPhone: '9876543210',
  collectionAddress: 'Flat 402, Sunshine Heights, Madhapur, Hyderabad 500081',
  date: '2026-10-25',
  bookingDate: '2026-10-25',
  timeSlot: '07:30 AM',
  time: '07:30 AM',
  collectionType: 'HOME_COLLECTION',
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  testPrice: 499,
  collectionFee: 50,
  totalAmount: 549,
  amount: '₹549',
  createdAt: '2026-10-20T10:00:00.000Z',
};

describe('HomeSampleList Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('mediquee_token', 'mock-jwt-patient-token');
    vi.spyOn(homeSampleCollectionApi, 'getTests').mockResolvedValue({ success: true, data: [mockHomeTest as any] });
    vi.spyOn(homeSampleCollectionApi, 'getEligibleLaboratories').mockResolvedValue({ success: true, data: [mockHomeLab as any] });
    vi.spyOn(homeSampleCollectionApi, 'getAvailability').mockResolvedValue({ success: true, data: mockHomeAvailability as any });
    vi.spyOn(homeSampleCollectionApi, 'createBooking').mockResolvedValue({ success: true, data: mockHomeCreatedBooking as any });
  });

  test('renders health concerns categories and no top search bar initially', () => {
    render(<HomeSampleList />);

    // Initial top search should not be there
    expect(screen.queryByPlaceholderText(/Search Home Sample/i)).not.toBeInTheDocument();

    expect(screen.getByText('Find Tests by Health Concern')).toBeInTheDocument();
    expect(screen.getAllByText('Thyroid').length).toBeGreaterThan(0);
  });

  test('clicking health concern shows concern results and search bar', () => {
    render(<HomeSampleList />);

    // Select concern
    fireEvent.click(screen.getAllByText('Fever')[0]);

    // Search bar should now appear contextually
    const searchInput = screen.getByPlaceholderText(/Search Fever tests/i);
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'TSH' } });
    expect(searchInput).toHaveValue('TSH');
  });

  test('executes 5-step booking workflow matching OP and Video consultation structure', async () => {
    render(<HomeSampleList />);

    // Wait for the mock test to appear and click Book
    await waitFor(() => {
      expect(screen.getByText('Thyroid Profile Total (T3, T4, TSH)')).toBeInTheDocument();
    });

    // Click test item directly -> navigates directly to Step 2 Lab Selection
    fireEvent.click(screen.getByText('Thyroid Profile Total (T3, T4, TSH)'));

    // Step 2: HOME_COLLECTION -> Select the laboratory and proceed to Date & Slot
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
      expect(screen.getByText('Thyrocare Certified Laboratory')).toBeInTheDocument();
    });
    const toDateSlotBtn = screen.getByRole('button', { name: /Continue to Date & Slot/i });
    fireEvent.click(toDateSlotBtn);

    // Step 3: DATE_TIME -> Choose available slot and proceed to Review
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
      expect(screen.getByText('07:30 AM')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('07:30 AM'));

    const toReviewBtn = screen.getByRole('button', { name: /Continue to Review/i });
    expect(toReviewBtn).toBeInTheDocument();
    fireEvent.click(toReviewBtn);

    // Step 4: REVIEW -> Fill patient details, address, payment method, and confirm
    await waitFor(() => {
      expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
      expect(screen.getByText('Review Your Booking')).toBeInTheDocument();
    });

    // Enter patient information
    const nameInput = screen.getByPlaceholderText(/Enter full name/i);
    const phoneInput = screen.getByPlaceholderText(/10-digit mobile number/i);
    fireEvent.change(nameInput, { target: { value: 'John Patient' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Enter manual collection address
    const otherAddressBtn = screen.getByText(/Enter Address|Use Other Address/i);
    fireEvent.click(otherAddressBtn);
    const addressInput = screen.getByPlaceholderText(/House\/Flat No\./i);
    fireEvent.change(addressInput, {
      target: { value: 'Flat 402, Sunshine Heights, Madhapur, Hyderabad 500081' },
    });

    // Select Pay on Collection (COD) or Online
    expect(screen.getByText(/Pay on Collection/i)).toBeInTheDocument();
    expect(screen.getByText(/Pay Online/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Pay on Collection/i));

    // Confirm & Book
    const confirmBookBtn = screen.getByRole('button', { name: /Confirm & Book/i });
    fireEvent.click(confirmBookBtn);

    // Step 5: CONFIRMED -> Verified
    await waitFor(() => {
      expect(screen.getByText('Step 5 of 5: Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Booking Confirmed')).toBeInTheDocument();
      expect(screen.getByText('MQ-HSC-100')).toBeInTheDocument();
    });
  }, 15000);
});
