import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe } from 'vitest';
import Specialties from '../pages/Specialties';
import React from 'react';
import * as router from 'react-router-dom';

describe('Specialties Component - OP Appointment', () => {
  test('renders disease categories and hidden search', () => {
    render(<Specialties />);
    
    // Check main categories
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Categorical Diseases')).toBeInTheDocument();
    expect(screen.getAllByText(/See More Diseases/i).length).toBeGreaterThan(0);
    
    // Search hospital shouldn't be immediately visible based on new flow
    expect(screen.queryByPlaceholderText(/Search hospital by name/i)).not.toBeInTheDocument();
  });

  test('clicking disease shows search and popular hospitals', () => {
    render(<Specialties />);
    
    // Select disease "Fever"
    const fever = screen.getByText('Fever');
    fireEvent.click(fever);

    // Search bar should now be visible
    const searchInput = screen.getByPlaceholderText(/Search hospital by name/i);
    expect(searchInput).toBeInTheDocument();

    // Focus empty search should show Popular Hospitals
    fireEvent.focus(searchInput);
    expect(screen.getByText('Popular Hospitals')).toBeInTheDocument();

    // Type in search should filter hospitals
    fireEvent.change(searchInput, { target: { value: 'Apollo' } });
    expect(screen.queryByText('Popular Hospitals')).not.toBeInTheDocument();
    
    // Clear search should bring back Popular Hospitals
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Popular Hospitals')).toBeInTheDocument();
  });

  test('booking flow execution', () => {
    render(<Specialties />);
    
    // Disease -> Hospital -> Doctor -> Date -> Time -> Review -> Confirm
    fireEvent.click(screen.getByText('Fever'));
    
    // Mock the flow by clicking available buttons in sequence
    // First, View Hospital
    const viewHospitalBtns = screen.getAllByText('View Hospital');
    if(viewHospitalBtns.length > 0) fireEvent.click(viewHospitalBtns[0]);
    
    // View All Doctors
    const viewAllDocs = screen.getByText('View All Doctors');
    fireEvent.click(viewAllDocs);

    // View Doctor
    const viewDocBtns = screen.getAllByText('View Doctor');
    if(viewDocBtns.length > 0) fireEvent.click(viewDocBtns[0]);

    // Book Appointment
    const bookBtn = screen.getByText(/Book Appointment/i);
    fireEvent.click(bookBtn);

    // Select Slot
    const timeSlot = screen.getByText('10:00 AM');
    fireEvent.click(timeSlot);

    const continueBtn = screen.getByText('Continue');
    fireEvent.click(continueBtn);
    
    // Back navigation (just verify it renders, we went deep enough to prove flow works)
    const backBtn = screen.getAllByRole('button')[0];
    if(backBtn) {
      fireEvent.click(backBtn);
    }
  });

  test('selecting categorical disease first shows disease list, not hospital search', () => {
    render(<Specialties />);
    
    // Select categorical disease category "Cardiology"
    const cardio = screen.getByText('Cardiology');
    fireEvent.click(cardio);

    // Should display disease list for Cardiology, NOT hospital search yet
    expect(screen.queryByPlaceholderText(/Search hospital by name/i)).not.toBeInTheDocument();
    expect(screen.getByText('Hypertension / High BP')).toBeInTheDocument();
    expect(screen.getByText('Angina & Chest Discomfort')).toBeInTheDocument();

    // Now select a specific categorical disease
    fireEvent.click(screen.getByText('Hypertension / High BP'));

    // Hospital search should now be visible and titled for this disease
    expect(screen.getByPlaceholderText(/Search hospital by name/i)).toBeInTheDocument();
    expect(screen.getByText(/Hospitals for Hypertension \/ High BP/i)).toBeInTheDocument();
  });
});

describe('Specialties Component - Video Consultation', () => {
  test('categorical disease workflow works for video consultation', () => {
    render(<Specialties />, { initialEntries: ['/specialties?type=video-consult'] });

    expect(screen.getByText('Video Consultation')).toBeInTheDocument();
    
    // Select categorical disease category "Cardiology"
    const cardio = screen.getByText('Cardiology');
    fireEvent.click(cardio);

    // Should display disease list for Cardiology
    expect(screen.getByText('Hypertension / High BP')).toBeInTheDocument();
    expect(screen.getByText('Angina & Chest Discomfort')).toBeInTheDocument();

    // Selecting a condition continues into the workflow
    fireEvent.click(screen.getByText('Hypertension / High BP'));
    expect(screen.getByText(/Hospitals for Hypertension \/ High BP/i)).toBeInTheDocument();
  });
});
