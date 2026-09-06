import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe } from 'vitest';
import Home from '../pages/Home';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Wrapper for isolated components
const renderHome = () => render(<Home />);

describe('Home Component', () => {
  test('renders top booking carousel and emergency tile', () => {
    renderHome();
    // 4 Booking carousel slides in top banner
    expect(screen.getAllByText('Book Now').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Book Video Consultation')).toBeInTheDocument();
    expect(screen.getByText('Book Lab Test')).toBeInTheDocument();
    expect(screen.getByText('Book Home Sample Collection')).toBeInTheDocument();

    // Emergency tile
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText(/Immediate ambulance dispatch/i)).toBeInTheDocument();
  });

  test('renders quick services with correct links', () => {
    renderHome();
    expect(screen.getByText('Quick Services')).toBeInTheDocument();
    
    // Check links
    expect(screen.getByText('OP Booking').closest('a')).toHaveAttribute('href', '/specialties?type=hospital-op');
    expect(screen.getByText('Video Consultation').closest('a')).toHaveAttribute('href', '/specialties?type=doctor');
    expect(screen.getByText('Insurances').closest('a')).toHaveAttribute('href', '/services/insurance');
    expect(screen.getByText('Home Nursing').closest('a')).toHaveAttribute('href', '/services/home-nursing');
    expect(screen.getByText('Lab Tests').closest('a')).toHaveAttribute('href', '/services/lab-tests');
    expect(screen.getByText('Home Sample').closest('a')).toHaveAttribute('href', '/services/home-sample');
  });

  test('renders Consult Top Specialists section', () => {
    renderHome();
    expect(screen.getByText('Consult Top Specialists')).toBeInTheDocument();
    expect(screen.getByText('Cardiologist')).toBeInTheDocument();
    expect(screen.getByText('Dermatologist')).toBeInTheDocument();
    expect(screen.getByText('Pediatrician')).toBeInTheDocument();
  });

  test('toggles FAQ items', () => {
    renderHome();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    
    const firstQ = screen.getByText('How do I book a video consultation?');
    expect(firstQ).toBeInTheDocument();
    
    // initially answer should not be present
    const answerText = 'Choose Video Consultation, select a doctor, choose an available slot and confirm your consultation.';
    expect(screen.queryByText(answerText)).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(firstQ);
    expect(screen.getByText(answerText)).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(firstQ);
    expect(screen.queryByText(answerText)).not.toBeInTheDocument();
  });

  test('renders MediQuee AI section', () => {
    renderHome();
    expect(screen.getByText('Chat with MediAI Assistant')).toBeInTheDocument();
  });
});
