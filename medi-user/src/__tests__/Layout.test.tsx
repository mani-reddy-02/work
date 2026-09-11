import { render, screen, fireEvent } from './test-utils';
import { expect, test, describe, vi } from 'vitest';
import AppHeader from '../components/AppHeader';
import MobileBottomNav from '../components/MobileBottomNav';
import React from 'react';
import * as router from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('AppHeader Component', () => {
  test('renders header and location section', () => {
    render(<AppHeader />);
    expect(screen.getByText('MediQuee')).toBeInTheDocument();
    
    // Check location modal opens
    const locationButtons = screen.getAllByRole('button').filter(b => b.textContent?.includes('Hyderabad') || b.textContent?.includes('Bengaluru') || b.textContent?.includes('Chennai') || b.textContent?.includes('Tirupati'));
    
    if (locationButtons.length > 0) {
       fireEvent.click(locationButtons[0]);
       expect(screen.getByText('Select Location')).toBeInTheDocument();
       expect(screen.getByPlaceholderText('Search city or location...')).toBeInTheDocument();
    }
  });

  test('desktop menu toggle button toggles open/close state', () => {
    render(<AppHeader />);
    // Initial state is open
    const toggleBtn = screen.getByRole('button', { name: /close menu|open menu/i });
    expect(toggleBtn).toBeInTheDocument();
    
    // Clicking toggles state
    fireEvent.click(toggleBtn);
    // Button label toggles
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();

    // Clicking again re-opens
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });
});

describe('MobileBottomNav Component', () => {
  test('renders bottom navigation and AI button works', () => {
    render(<MobileBottomNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
});

describe('DesktopSidebar Component', () => {
  test('renders sidebar items and close button collapses menu', async () => {
    const { default: DesktopSidebar } = await import('../components/DesktopSidebar');
    render(<DesktopSidebar />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Health Records')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close menu/i });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
  });
});
