import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe } from 'vitest';
import HomeSampleList from '../pages/HomeSampleList';
import React from 'react';

describe('HomeSampleList Component', () => {
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
});
