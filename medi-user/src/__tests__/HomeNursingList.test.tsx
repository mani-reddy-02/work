import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import HomeNursingList from '../pages/HomeNursingList';
import { homeNursingApi } from '../lib/homeNursingApi';
import React from 'react';

const mockServiceList = [
  {
    id: 'srv-1',
    name: 'General Nursing Care',
    code: 'GNC',
    category: 'General Care',
    description: 'Professional nursing care at home including vitals and medication.',
    duration: '12 Hours',
    basePrice: 1200,
    price: '₹1,200',
    numericPrice: 1200,
    requirements: 'Prescription',
    iconUrl: null,
    availableProvidersCount: 2,
  },
];

const mockHospitalList = [
  {
    hospitalId: 'hosp-1',
    hospitalName: 'Apollo Care Hospital',
    city: 'Hyderabad',
    area: 'Jubilee Hills',
    address: 'Road No 36, Jubilee Hills',
    phone: '9876543210',
    logoUrl: null,
    offeredPrice: '₹1,200',
    numericPrice: 1200,
    duration: '12 Hours',
    nurses: [{ id: 'nurse-1', name: 'Nurse Priya', designation: 'Senior RN' }],
  },
];

describe('HomeNursingList Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(homeNursingApi, 'getServices').mockResolvedValue({
      success: true,
      data: mockServiceList as any,
    });
    vi.spyOn(homeNursingApi, 'getCategories').mockResolvedValue({
      success: true,
      data: ['All Services', 'General Care'],
    });
    vi.spyOn(homeNursingApi, 'getServiceProviders').mockResolvedValue({
      success: true,
      data: mockHospitalList as any,
    });
    vi.spyOn(homeNursingApi, 'createBooking').mockResolvedValue({
      success: true,
      data: {
        id: 'booking-1',
        bookingNumber: 'MQ-HN-12345',
        status: 'CONFIRMED',
      } as any,
    });
  });

  test('renders page and services', async () => {
    render(<HomeNursingList />);
    expect(screen.getByText('Home Nursing')).toBeInTheDocument();

    const serviceButtons = await screen.findAllByText('Select Service');
    expect(serviceButtons.length).toBeGreaterThan(0);
  });

  test('booking and payment flow ensures payment before confirmation', async () => {
    render(<HomeNursingList />);

    // Select first service
    const serviceButtons = await screen.findAllByText('Select Service');
    fireEvent.click(serviceButtons[0]);

    // Should now be on HOSPITALS view
    await waitFor(() => {
      expect(screen.getByText('Select Hospital / Nurse')).toBeInTheDocument();
    });

    // Select first hospital
    const hospitalSelectButtons = screen.getAllByText('Select');
    fireEvent.click(hospitalSelectButtons[0]);

    // Should now be on FORM view
    expect(screen.getByText('Patient Details & Date')).toBeInTheDocument();

    // Fill form and submit
    const nameInput = screen.getByPlaceholderText('Enter patient name');
    fireEvent.change(nameInput, { target: { value: 'Test Patient' } });

    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });

    // Click Add Address button to enable the custom address field
    const addAddressBtn = screen.getByText('Add Address');
    fireEvent.click(addAddressBtn);

    const addressInput = screen.getByPlaceholderText('Enter full address');
    fireEvent.change(addressInput, { target: { value: '123 Main St' } });

    const submitBtn = screen.getByText('Proceed to Summary');
    const form = submitBtn.closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      fireEvent.click(submitBtn);
    }

    // Should be on SUMMARY view
    expect(screen.getByText('Review Your Booking')).toBeInTheDocument();

    const proceedPaymentBtn = screen.getByText('Proceed to Payment');
    fireEvent.click(proceedPaymentBtn);

    // Should be on PAYMENT view
    expect(screen.getByText('Select Payment Method')).toBeInTheDocument();

    // The CONFIRMED state should not be visible yet
    expect(screen.queryByText('Booking Confirmed')).not.toBeInTheDocument();

    // Click Credit Card to pay
    const creditCardBtn = screen.getByText('Credit / Debit Card');
    fireEvent.click(creditCardBtn);
  });
});
