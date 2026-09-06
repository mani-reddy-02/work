import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import CheckMyBMI from '../pages/CheckMyBMI';
import React from 'react';

describe('CheckMyBMI Component', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  test('validates and calculates BMI correctly', () => {
    render(<CheckMyBMI />);
    
    // Select Gender
    fireEvent.click(screen.getByText('Male'));
    
    // Input Height, Weight, Age
    const heightInput = screen.getByPlaceholderText('e.g. 170');
    const weightInput = screen.getByPlaceholderText('e.g. 65');
    const ageInput = screen.getByPlaceholderText('e.g. 25');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.change(ageInput, { target: { value: '25' } });

    // Click Calculate
    const calcBtn = screen.getByText('Calculate BMI');
    fireEvent.click(calcBtn);

    // Verify BMI Calculation (65 / (1.7*1.7) = 22.49)
    // The component shows it in the main result card AND in the history record below
    expect(screen.getAllByText('22.5').length).toBeGreaterThanOrEqual(1);
    
    // Should show Normal category for 22.5
    expect(screen.getAllByText('Normal weight').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('BMI History')).toBeInTheDocument();
  });

  test('does not calculate if fields are empty', () => {
    render(<CheckMyBMI />);
    
    // Click calculate without filling
    fireEvent.click(screen.getByText('Calculate BMI'));

    // Should show error message
    expect(screen.getByText('All fields are required.')).toBeInTheDocument();
  });

  test('shows empty history message when no records exist', () => {
    localStorage.clear();
    render(<CheckMyBMI />);
    expect(screen.getByText('No BMI history yet')).toBeInTheDocument();
    expect(screen.getByText('Calculate your BMI to see your history here.')).toBeInTheDocument();
  });
});
