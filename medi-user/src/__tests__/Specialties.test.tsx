import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import Specialties from '../pages/Specialties';
import React from 'react';
import { doctorApi, opAppointmentApi, type DoctorRecord } from '../lib/opAppointmentApi';

const mockDoctors: DoctorRecord[] = [
  {
    id: 'doc-101',
    name: 'Dr. Sarah Jenkins',
    specialization: 'General Physician',
    qualification: 'MBBS, MD',
    experience: '12 years',
    designation: 'Senior Consultant',
    hospitalId: 'hosp-1',
    hospitalName: 'Apollo Speciality Hospital',
    hospitalAddress: 'Road No 2, Jubilee Hills, Hyderabad',
    hospitalPhone: '+91 40 2360 7777',
    hospitalCity: 'Hyderabad',
    departmentId: 'dept-1',
    department: 'General Medicine',
    consultationFee: 600,
    fees: '₹600',
    rating: 4.8,
    bio: 'Dr. Sarah Jenkins is an experienced consultant physician with 12 years of practice.',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'doc-102',
    name: 'Dr. Rajesh Rao',
    specialization: 'Cardiologist',
    qualification: 'MD, DM Cardiology',
    experience: '16 years',
    designation: 'Chief Cardiologist',
    hospitalId: 'hosp-2',
    hospitalName: 'Care Hospital',
    hospitalAddress: 'Banjara Hills, Hyderabad',
    hospitalPhone: '',
    hospitalCity: 'Hyderabad',
    departmentId: 'dept-2',
    department: 'Cardiology',
    consultationFee: 800,
    fees: '₹800',
    rating: 4.5,
    avatar: null
  }
];

const mockDiseasesData = {
  general: [
    { id: 'fever', name: 'Fever', description: 'Common viral or bacterial fever' },
    { id: 'cold', name: 'Cold & Cough', description: 'Upper respiratory infection' }
  ],
  advanced: [
    { id: 'adv-1', name: 'Hypertension Management', description: 'Blood pressure control' }
  ],
  categorical: [
    {
      id: 'cat-1',
      name: 'Cardiology',
      description: 'Heart and cardiovascular care',
      conditions: [
        { id: 'c-1', name: 'Hypertension / High BP', specialtyId: 'cat-1' },
        { id: 'c-2', name: 'Angina & Chest Discomfort', specialtyId: 'cat-1' }
      ]
    }
  ],
  conditions: []
};

describe('Specialties Component - 5-Step Booking Flow (OP Consultation)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(opAppointmentApi, 'fetchDiseases').mockResolvedValue({
      success: true,
      data: mockDiseasesData as any
    });
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue({
      success: true,
      data: mockDoctors
    });
    vi.spyOn(doctorApi, 'getDoctor').mockResolvedValue({
      success: true,
      data: mockDoctors[0]
    });
    vi.spyOn(opAppointmentApi, 'fetchDoctorAvailability').mockResolvedValue({
      success: true,
      data: {
        doctorId: 'doc-101',
        doctorName: 'Dr. Sarah Jenkins',
        date: '2026-10-20',
        isAvailable: true,
        allSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'],
        availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'],
        bookedSlots: []
      }
    });
  });

  test('Step 1: Renders disease categories and disease search, without separate hospital search page', async () => {
    render(<Specialties />);

    // 5-step stepper indicator present
    expect(screen.getByText('Disease')).toBeInTheDocument();
    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.getByText('Slot')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();

    // Check Step 1 disease categories
    expect(await screen.findByText('General Health Concerns')).toBeInTheDocument();
    expect(screen.getByText(/Advanced Specialties/i)).toBeInTheDocument();
    expect(screen.getByText(/Categorical Diseases/i)).toBeInTheDocument();

    // Disease search should be present
    expect(screen.getByPlaceholderText(/Search disease/i)).toBeInTheDocument();

    // Old hospital-first search should NOT be present
    expect(screen.queryByPlaceholderText(/Search hospital by name/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Popular Hospitals')).not.toBeInTheDocument();
  });

  test('Step 1 -> Step 2: Selecting a disease opens eligible doctors directly with no hospital-selection screen', async () => {
    render(<Specialties />);

    // Wait for disease to finish loading then select "Fever"
    await waitFor(() => {
      expect(screen.queryByText(/Loading verified disease conditions/i)).not.toBeInTheDocument();
    });
    const fever = screen.getByText('Fever');
    fireEvent.click(fever.parentElement || fever);

    // Moves directly to Step 2 (Select Doctor)
    expect(await screen.findByText(/Eligible Doctors for "Fever"/i)).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();

    // Hospital search page must NOT appear
    expect(screen.queryByPlaceholderText(/Search hospital by name/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Popular Hospitals')).not.toBeInTheDocument();

    // Doctors from eligible hospitals are displayed with hospital affiliations
    expect(await screen.findByText('Dr. Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('Apollo Speciality Hospital')).toBeInTheDocument();
    expect(screen.getByText('Road No 2, Jubilee Hills, Hyderabad')).toBeInTheDocument();
    expect(screen.getByText('MBBS, MD')).toBeInTheDocument();
    expect(screen.getByText('12 years')).toBeInTheDocument();
    expect(screen.getByText('₹600')).toBeInTheDocument();

    // Second doctor from another hospital also rendered
    expect(screen.getByText('Dr. Rajesh Rao')).toBeInTheDocument();
    expect(screen.getByText('Care Hospital')).toBeInTheDocument();
  });

  test('Step 2: Doctor Card has working Call Clinic and View Doctor actions', async () => {
    render(<Specialties />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading verified disease conditions/i)).not.toBeInTheDocument();
    });
    const fever = screen.getByText('Fever');
    fireEvent.click(fever.parentElement || fever);

    expect(await screen.findByText(/Eligible Doctors for "Fever"/i)).toBeInTheDocument();
    expect(await screen.findByText('Dr. Sarah Jenkins')).toBeInTheDocument();

    // Doctor with valid phone number has tel: link
    const callClinicLink = screen.getByTitle(/Call Apollo Speciality Hospital: \+91 40 2360 7777/i);
    expect(callClinicLink).toBeInTheDocument();
    expect(callClinicLink.getAttribute('href')).toBe('tel:+91 40 2360 7777');

    // Doctor without phone number has disabled "No Phone" button
    const noPhoneBtn = screen.getByTitle('Contact number unavailable');
    expect(noPhoneBtn).toBeInTheDocument();
    expect(noPhoneBtn).toBeDisabled();

    // View Doctor button opens doctor profile
    const viewDoctorBtns = screen.getAllByRole('button', { name: /View Doctor/i });
    fireEvent.click(viewDoctorBtns[0]);

    // Dedicated doctor details screen opens
    expect(await screen.findByText(/Select This Doctor • Continue to Slot Booking/i)).toBeInTheDocument();
    expect(screen.getByText(/About the Doctor/i)).toBeInTheDocument();
  });

  test('Step 1 -> 5: Complete end-to-end booking flow execution with persisted booking ID', async () => {
    const appointmentSpy = vi.spyOn(opAppointmentApi, 'createOpAppointment').mockResolvedValueOnce({
      success: true,
      data: {
        id: '041d83a3-e82f-4878-ac48-b343d3c9bb99',
        appointmentId: '041d83a3-e82f-4878-ac48-b343d3c9bb99',
        doctorName: 'Dr. Sarah Jenkins',
        hospitalName: 'Apollo Speciality Hospital',
        diseaseName: 'Fever',
        status: 'CONFIRMED'
      }
    });

    render(<Specialties />);

    // Step 1: Select Disease
    await waitFor(() => {
      expect(screen.queryByText(/Loading verified disease conditions/i)).not.toBeInTheDocument();
    });
    const fever = screen.getByText('Fever');
    fireEvent.click(fever.parentElement || fever);

    // Step 2: Select Doctor & Book Slot
    expect(await screen.findByText(/Eligible Doctors for "Fever"/i)).toBeInTheDocument();
    expect(await screen.findByText('Dr. Sarah Jenkins')).toBeInTheDocument();
    const bookSlotBtns = screen.getAllByRole('button', { name: /Select & Book Slot/i });
    fireEvent.click(bookSlotBtns[0]);

    // Step 3: Slot Booking
    expect(await screen.findByText(/Available Time Slots/i)).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
    const timeSlot = await screen.findByText('10:00 AM');
    fireEvent.click(timeSlot);

    // Optional reason
    const reasonInput = screen.getByPlaceholderText(/Describe the reason for your visit/i);
    fireEvent.change(reasonInput, { target: { value: 'High fever and body ache since morning' } });

    // Advance to Step 4 (Review & Pay)
    const proceedToReviewBtn = screen.getByRole('button', { name: /Proceed to Review & Pay/i });
    fireEvent.click(proceedToReviewBtn);

    // Step 4: Review & Pay
    expect(await screen.findByText(/Review & Confirm/i)).toBeInTheDocument();
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('Apollo Speciality Hospital')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getAllByText('₹600').length).toBeGreaterThanOrEqual(1);

    // Enter patient name
    const patientInput = screen.getByPlaceholderText('Full name');
    fireEvent.change(patientInput, { target: { value: 'John Doe' } });

    // Confirm booking
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Book Appointment/i });
    fireEvent.click(confirmBtn);

    // Step 5: Confirmation screen with real persisted ID
    const confirmedId = await screen.findByText('041d83a3-e82f-4878-ac48-b343d3c9bb99');
    expect(confirmedId).toBeInTheDocument();
    expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
    expect(screen.getByText('View Booking Details')).toBeInTheDocument();
    expect(screen.getByText('My Bookings')).toBeInTheDocument();

    expect(appointmentSpy).toHaveBeenCalledTimes(1);
    expect(appointmentSpy).toHaveBeenCalledWith(expect.objectContaining({
      doctorId: 'doc-101',
      hospitalId: 'hosp-1',
      patientName: 'John Doe'
    }));
  });

  test('Selecting categorical disease first shows disease list, then opens doctor list', async () => {
    render(<Specialties />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading verified disease conditions/i)).not.toBeInTheDocument();
    });

    // Select categorical specialty "Cardiology"
    const cardio = screen.getByText('Cardiology');
    fireEvent.click(cardio.parentElement || cardio);

    // Displays disease list for Cardiology
    expect(await screen.findByText('Hypertension / High BP')).toBeInTheDocument();
    expect(screen.getByText('Angina & Chest Discomfort')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search hospital by name/i)).not.toBeInTheDocument();

    // Select a specific categorical condition
    const hypertension = screen.getByText('Hypertension / High BP');
    fireEvent.click(hypertension.parentElement || hypertension);

    // Opens eligible doctors directly (Step 2)
    expect(await screen.findByText(/Eligible Doctors for "Hypertension \/ High BP"/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search hospital by name/i)).not.toBeInTheDocument();
  });

  test('Handles 409 slot conflict gracefully with error message without false confirmation', async () => {
    vi.spyOn(opAppointmentApi, 'createOpAppointment').mockResolvedValueOnce({
      success: false,
      statusCode: 409,
      error: {
        code: 'CONFLICT',
        message: 'This appointment slot is no longer available. Please select another time.'
      } as any
    });

    render(<Specialties />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading verified disease conditions/i)).not.toBeInTheDocument();
    });
    const fever = screen.getByText('Fever');
    fireEvent.click(fever.parentElement || fever);

    expect(await screen.findByText(/Eligible Doctors for "Fever"/i)).toBeInTheDocument();
    expect(await screen.findByText('Dr. Sarah Jenkins')).toBeInTheDocument();

    const bookSlotBtns = screen.getAllByRole('button', { name: /Select & Book Slot/i });
    fireEvent.click(bookSlotBtns[0]);

    fireEvent.click(await screen.findByText('10:00 AM'));
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Review & Pay/i }));

    const patientInput = await screen.findByPlaceholderText('Full name');
    fireEvent.change(patientInput, { target: { value: 'Jane Doe' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirm & Book Appointment/i }));

    // Error message shown, confirmation screen never rendered
    expect((await screen.findAllByText(/This appointment slot is no longer available/i)).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Appointment Confirmed')).not.toBeInTheDocument();
    expect(screen.queryByText('Booking Reference')).not.toBeInTheDocument();
  });
});

describe('Specialties Component - Video Consultation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(opAppointmentApi, 'fetchDiseases').mockResolvedValue({
      success: true,
      data: mockDiseasesData as any
    });
    vi.spyOn(doctorApi, 'getDoctors').mockResolvedValue({
      success: true,
      data: mockDoctors
    });
    vi.spyOn(doctorApi, 'getDoctor').mockResolvedValue({
      success: true,
      data: mockDoctors[0]
    });
  });

  test('Video consultation mode renders with 5-step stepper and Online Video badge', async () => {
    render(<Specialties />, { initialEntries: ['/specialties?type=video-consult'] });

    expect(screen.getAllByText('Video Consultation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Online Video')).toBeInTheDocument();

    // 5-step stepper present
    expect(screen.getByText('Disease')).toBeInTheDocument();
    expect(screen.getByText('Doctor')).toBeInTheDocument();

    // Wait for disease list
    await waitFor(() => {
      expect(screen.queryByText(/Loading verified disease conditions/i)).not.toBeInTheDocument();
    });

    // Select disease advances to eligible doctors
    const fever = screen.getByText('Fever');
    fireEvent.click(fever.parentElement || fever);

    expect(await screen.findByText(/Eligible Doctors for "Fever"/i)).toBeInTheDocument();
    expect(screen.getAllByText('Available for Online Video').length).toBeGreaterThanOrEqual(1);
  });

  test('Deep link with type=doctor and category opens categorical disease directly', async () => {
    render(<Specialties />, { initialEntries: ['/specialties?type=doctor&category=Cardiology'] });
    expect(screen.getAllByText('Cardiology').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Video Consultation').length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('Hypertension / High BP')).toBeInTheDocument();
  });
});
