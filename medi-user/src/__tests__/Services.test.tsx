import { render, screen } from './test-utils';
import { expect, test, describe } from 'vitest';
import Services from '../pages/Services';
import React from 'react';

describe('Services Component', () => {
  test('renders all service categories and cards', () => {
    render(<Services />);
    
    // Check if some services are rendered
    expect(screen.getByText('OP Booking')).toBeInTheDocument();
    expect(screen.getByText('Video Consultation')).toBeInTheDocument();
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Check My BMI')).toBeInTheDocument();

    // Specific links/buttons
    expect(screen.getByText('Check My BMI')).toBeInTheDocument();
    expect(screen.getByText('My Reports')).toBeInTheDocument();

    // Verify some service cards exist
    expect(screen.getByText('OP Booking')).toBeInTheDocument();
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Insurances')).toBeInTheDocument();
  });
});
