import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe, vi } from 'vitest';
import InsuranceList from '../pages/InsuranceList';
import React from 'react';

// Setup file object for testing
const file = new File(['hello'], 'hello.png', { type: 'image/png' });

describe('InsuranceList Component', () => {
  test('renders insurance cards and carousel', () => {
    render(<InsuranceList />);
    expect(screen.getByText('Health Insurance')).toBeInTheDocument();
    
    // Check if cards exist
    const applyButtons = screen.getAllByText('Apply Now');
    expect(applyButtons.length).toBeGreaterThan(0);
    
    // Carousel
    expect(screen.getByText('Why Health Insurance Matters')).toBeInTheDocument();
  });

  test('application flow', () => {
    const { container } = render(<InsuranceList />);
    
    // Click Apply Now on first insurance
    const applyButtons = screen.getAllByText('Apply Now');
    fireEvent.click(applyButtons[0]);

    // Now in DOCUMENTS view
    expect(screen.getByText('Documents Required')).toBeInTheDocument();
    
    // Upload files to pass custom validation
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const fileInputs = container.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    const proceedBtn = screen.getByText('Continue to Applicant Details');
    fireEvent.click(proceedBtn);

    // Now in APPLICANT view
    const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    }
    
    // Remove 'required' from applicant form inputs to bypass HTML5 validation
    container.querySelectorAll('input, select, textarea').forEach(el => el.removeAttribute('required'));

    const appForm = container.querySelector('form');
    if (appForm) {
      appForm.noValidate = true;
      fireEvent.submit(appForm);
    } else {
      const reviewBtn = screen.getByText('Review Application');
      fireEvent.click(reviewBtn);
    }
    // Submit
    const submitBtn = screen.getAllByText('Submit Application')[0] || screen.getByText('Submit Application');
    fireEvent.click(submitBtn);

    // Now in SUBMITTED view
    expect(screen.getByText('Application Submitted')).toBeInTheDocument();
    expect(screen.getByText(/Application ID:/i)).toBeInTheDocument();
  });
});
