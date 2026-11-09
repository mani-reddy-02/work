import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, beforeEach } from 'vitest';
import FamilyMembers from '../pages/FamilyMembers';
import React from 'react';

describe('FamilyMembers Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders clean empty state and confirms dummy John Doe / Jane Doe are removed', () => {
    render(<FamilyMembers />);

    expect(screen.getByText('Family Members')).toBeInTheDocument();
    expect(screen.getByText('No Family Members Added')).toBeInTheDocument();
    expect(screen.getByText(/Add your parents, spouse, children/i)).toBeInTheDocument();

    // Verify dummy John Doe / Jane Doe do not exist
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  test('adds a real family member and renders their card with booking options', async () => {
    render(<FamilyMembers />);

    // Click Add Member
    const addBtn = screen.getByRole('button', { name: /add member/i });
    fireEvent.click(addBtn);

    // Modal opens
    expect(screen.getByText('Add Family Member')).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByPlaceholderText(/e\.g\. Ramesh Reddy/i);
    const ageInput = screen.getByPlaceholderText(/e\.g\. 52/i);
    const phoneInput = screen.getByPlaceholderText(/e\.g\. 9876543210/i);

    fireEvent.change(nameInput, { target: { value: 'Suresh Kumar' } });
    fireEvent.change(ageInput, { target: { value: '55' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /^Save Member$/i });
    fireEvent.click(saveBtn);

    // Verify member is displayed
    await waitFor(() => {
      expect(screen.getByText('Suresh Kumar')).toBeInTheDocument();
    });

    expect(screen.getByText('Father')).toBeInTheDocument();
    expect(screen.getByText(/Age: 55 • Male/i)).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();

    // Verify direct booking actions exist on the member card
    expect(screen.getByRole('button', { name: /OP Visit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Video Consult/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lab Tests/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nursing/i })).toBeInTheDocument();
  });

  test('validates form fields preventing empty or invalid submissions', async () => {
    render(<FamilyMembers />);

    const addBtn = screen.getByRole('button', { name: /add member/i });
    fireEvent.click(addBtn);

    const saveBtn = screen.getByRole('button', { name: /^Save Member$/i });
    fireEvent.click(saveBtn);

    // Should stay open with validation error
    expect(screen.getByText('Add Family Member')).toBeInTheDocument();
  });
});
