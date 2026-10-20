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

    // Check that tiles are displayed WITHOUT Apply button initially
    expect(screen.queryByRole('button', { name: /^Apply/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/View Plan Details & Benefits/i).length).toBe(2);
  });

  test('opening a tile displays details and apply button which opens application URL safely', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<InsuranceList />);

    await waitFor(() => {
      expect(screen.getByText('Star Comprehensive Health Policy')).toBeInTheDocument();
    });

    // Opening/touching the tile opens the modal
    const starTile = screen.getByRole('button', { name: /View details for Star Comprehensive Health Policy/i });
    fireEvent.click(starTile);

    await waitFor(() => {
      expect(screen.getByText('Insurance Plan Details')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apply for Star Comprehensive Health Policy/i })).toBeInTheDocument();
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

  test('notifies admin with auth token when authenticated user opens/touches an insurance plan, and prevents duplicate calls', async () => {
    localStorage.setItem('mediquee_token', 'test-patient-jwt');
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const fetchSpy = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/select')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { deduplicated: false } })
        });
      }
      if (url.includes('/insurance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockInsurancePlans })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(<InsuranceList />);

    await waitFor(() => {
      expect(screen.getByText('Star Comprehensive Health Policy')).toBeInTheDocument();
    });

    // Page render did NOT trigger /select
    const selectCallsBefore = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/select'));
    expect(selectCallsBefore.length).toBe(0);

    // Opening/touching the insurance plan tile notifies admin
    const starTile = screen.getByRole('button', { name: /View details for Star Comprehensive Health Policy/i });
    fireEvent.click(starTile);

    await waitFor(() => {
      const selectCallsAfter = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/insurance/plan-1/select'));
      expect(selectCallsAfter.length).toBe(1);
      expect(selectCallsAfter[0][1].headers['Authorization']).toBe('Bearer test-patient-jwt');
      expect(selectCallsAfter[0][1].method).toBe('POST');
    });

    // Immediate second rapid open/touch should be client-deduplicated
    fireEvent.click(starTile);
    const selectCallsAfterSecond = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/insurance/plan-1/select'));
    expect(selectCallsAfterSecond.length).toBe(1);

    localStorage.removeItem('mediquee_token');
  });
});
