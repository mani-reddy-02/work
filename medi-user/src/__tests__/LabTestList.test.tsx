import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe } from 'vitest';
import LabTestList from '../pages/LabTestList';
import React from 'react';

describe('LabTestList Component', () => {
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
    const backBtn = screen.getAllByRole('button')[0]; // first button is usually back
    fireEvent.click(backBtn);
    
    // Search bar should be gone again
    expect(screen.queryByPlaceholderText(/Search Diabetes tests/i)).not.toBeInTheDocument();
  });
});
