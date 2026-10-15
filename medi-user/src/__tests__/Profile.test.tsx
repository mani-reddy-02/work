import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe } from 'vitest';
import Profile from '../pages/Profile';
import React from 'react';

describe('Profile Component', () => {
  test('renders profile sections', () => {
    render(<Profile />);
    
    // Check main profile links
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('My Addresses')).toBeInTheDocument();
    expect(screen.getByText('Language & Appearance')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
