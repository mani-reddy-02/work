import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import InsuranceList from '../pages/InsuranceList';
import React from 'react';

const mockInsurancePlans = [
  {
    id: 'plan-1',
    title: 'Star Comprehensive Health Policy',
    icon: '/icons/shield.png',
    description: 'Comprehensive health coverage with 14,000+ cashless network hospitals and 2-hour pre-authorization.',
    successRate: 98.5,
    applicationUrl: 'https://starhealth.in/apply',
    isActive: true,
  },
  {
    id: 'plan-2',
    title: 'HDFC ERGO Optima Secure',
    icon: null,
    description: '4X coverage with zero deduction on non-medical expenses and restored sum insured.',
    successRate: 97.2,
    applicationUrl: 'https://hdfcergo.com/optima-secure',
    isActive: true,
  },
];

describe('InsuranceList Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default fetch mock returning mockInsurancePlans
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/insurance') || url.includes('/insurance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockInsurancePlans }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    }));
  });

  test('renders header, carousel, and fetched insurance cards', async () => {
    render(<InsuranceList />);

    // Header & Educational section
    expect(screen.getByText('Health Insurance')).toBeInTheDocument();
    expect(screen.getByText('Why Health Insurance Matters')).toBeInTheDocument();

    // Wait for insurance cards to render
    await waitFor(() => {
      expect(screen.getByText('Star Comprehensive Health Policy')).toBeInTheDocument();
    });

    expect(screen.getByText(/Success Rate: 98.5%/i)).toBeInTheDocument();
    expect(screen.getByText(/14,000\+ cashless network hospitals/i)).toBeInTheDocument();

    // Verify second plan
    expect(screen.getByText('HDFC ERGO Optima Secure')).toBeInTheDocument();
    expect(screen.getByText(/Success Rate: 97.2%/i)).toBeInTheDocument();

    // Check Apply buttons
    const applyButtons = screen.getAllByRole('button', { name: /Apply/i });
    expect(applyButtons.length).toBe(2);
  });

  test('apply button opens the specific application URL safely in a new tab', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<InsuranceList />);

    await waitFor(() => {
      expect(screen.getByText('Star Comprehensive Health Policy')).toBeInTheDocument();
    });

    const starApplyBtn = screen.getByRole('button', { name: /Apply for Star Comprehensive Health Policy/i });
    fireEvent.click(starApplyBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://starhealth.in/apply',
      '_blank',
      'noopener,noreferrer'
    );
  });

  test('displays empty state when no insurance records are returned', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    }));

    render(<InsuranceList />);

    await waitFor(() => {
      expect(screen.getByText('No insurance plans available')).toBeInTheDocument();
    });
  });

  test('displays error state with retry button on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('Network error'));
    }));

    render(<InsuranceList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load insurance plans')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
