import { render, screen, fireEvent } from './test-utils';
import { render as rtlRender } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Footer from '../components/Footer';
import RefundPolicy from '../pages/RefundPolicy';
import ContactUs from '../pages/ContactUs';
import Pricing from '../pages/Pricing';
import TermsAndConditions from '../pages/TermsAndConditions';
import PrivacyPolicy from '../pages/PrivacyPolicy';

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

describe('Payment Gateway Compliance Pages & Footer', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('Footer renders all 5 mandatory compliance links with exact paths', () => {
    render(<Footer />);

    const expectedLinks = [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund & Cancellation Policy', href: '/refund-policy' },
    ];

    for (const item of expectedLinks) {
      const link = screen.getByRole('link', { name: item.label });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', item.href);
    }

    expect(screen.getByText('support@mediquee.in')).toBeInTheDocument();
    expect(screen.getByText('+91-9014535199')).toBeInTheDocument();
  });

  test('RefundPolicy renders cancellation windows and 5-7 business days timeline', () => {
    render(<RefundPolicy />);
    expect(screen.getByRole('heading', { name: /Refund & Cancellation Policy/i })).toBeInTheDocument();
    expect(screen.getByText(/within 5–7 business days/i)).toBeInTheDocument();
    expect(screen.getByText(/Hospital Outpatient \(OP\) Slot Bookings/i)).toBeInTheDocument();
    expect(screen.getByText(/Online Video Telemedicine Consultations/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostic Lab Tests & Home Sample Collection/i)).toBeInTheDocument();
    expect(screen.getByText(/Home Nursing Care Packages/i)).toBeInTheDocument();
    expect(screen.getAllByText(/support@mediquee\.in/i).length).toBeGreaterThan(0);
  });

  test('ContactUs renders official details and validates/submits inquiry form', () => {
    render(<ContactUs />);
    expect(screen.getByRole('heading', { name: /Contact MediQuee/i })).toBeInTheDocument();
    expect(screen.getByText('support@mediquee.in')).toBeInTheDocument();
    expect(screen.getByText('+91-9014535199')).toBeInTheDocument();
    expect(screen.getByText(/Andhra Pradesh/i)).toBeInTheDocument();

    // Validation error on empty submit
    fireEvent.click(screen.getByRole('button', { name: /Submit Inquiry/i }));
    expect(screen.getByText(/Please fill in your name/i)).toBeInTheDocument();

    // Valid submit
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Srinu' } });
    fireEvent.change(screen.getByLabelText(/Email or Mobile Number/i), { target: { value: '+91 9014535199' } });
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'Need refund status check' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Inquiry/i }));

    expect(screen.getByText(/Inquiry Prepared for MediQuee Support/i)).toBeInTheDocument();
  });

  test('Pricing renders hospital-defined INR pricing model', () => {
    render(<Pricing />);
    expect(screen.getByRole('heading', { name: /Transparent Healthcare Service Pricing/i })).toBeInTheDocument();
    expect(screen.getByText(/Set by Hospital & Doctor/i)).toBeInTheDocument();
    expect(screen.getByText(/Set by Consulting Doctor/i)).toBeInTheDocument();
    expect(screen.getByText(/Set by Diagnostic Laboratory/i)).toBeInTheDocument();
    expect(screen.getByText(/Set by Care Provider \/ Hospital/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Indian Rupees \(INR/i).length).toBeGreaterThan(0);
  });

  test('TermsAndConditions and PrivacyPolicy reference mediquee.in, support@mediquee.in, and Indian payment gateways', () => {
    const { unmount } = render(<TermsAndConditions />);
    expect(screen.getByRole('heading', { name: /Terms and Conditions/i })).toBeInTheDocument();
    expect(screen.getAllByText(/https:\/\/mediquee\.in/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/support@mediquee\.in/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/RBI-regulated, PCI-DSS Level 1/i)).toBeInTheDocument();
    unmount();

    render(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { name: /MediQuee Privacy Policy & Data Charter/i })).toBeInTheDocument();
    expect(screen.getAllByText(/https:\/\/mediquee\.in/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/support@mediquee\.in/i).length).toBeGreaterThan(0);
  });

  test('All 5 compliance routes load publicly via App and clicking footer links navigates without redirecting to /login', async () => {
    const { default: App } = await import('../App');
    const routeExpectations = [
      { path: '/pricing', heading: /Transparent Healthcare Service Pricing/i },
      { path: '/contact', heading: /Contact MediQuee/i },
      { path: '/terms', heading: /Terms and Conditions/i },
      { path: '/privacy', heading: /MediQuee Privacy Policy & Data Charter/i },
      { path: '/refund-policy', heading: /Refund & Cancellation Policy/i },
    ];

    for (const item of routeExpectations) {
      window.history.pushState({}, '', item.path);
      const { unmount } = rtlRender(<App />);
      await vi.waitFor(() => {
        expect(window.location.pathname).toBe(item.path);
        expect(screen.getByRole('heading', { name: item.heading })).toBeInTheDocument();
        expect(screen.queryByText(/Sign in to your account/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
      unmount();
    }

    // Verify clicking footer links from /pricing navigates cleanly to every compliance page
    window.history.pushState({}, '', '/pricing');
    const { unmount } = rtlRender(<App />);
    await vi.waitFor(() => {
      expect(screen.getByRole('heading', { name: /Transparent Healthcare Service Pricing/i })).toBeInTheDocument();
    });

    for (const item of [
      { label: 'Contact Us', path: '/contact', heading: /Contact MediQuee/i },
      { label: 'Terms & Conditions', path: '/terms', heading: /Terms and Conditions/i },
      { label: 'Privacy Policy', path: '/privacy', heading: /MediQuee Privacy Policy & Data Charter/i },
      { label: 'Refund & Cancellation Policy', path: '/refund-policy', heading: /Refund & Cancellation Policy/i },
      { label: 'Pricing', path: '/pricing', heading: /Transparent Healthcare Service Pricing/i },
    ]) {
      const footerLinks = screen.getAllByRole('link', { name: item.label });
      fireEvent.click(footerLinks[footerLinks.length - 1]);
      await vi.waitFor(() => {
        expect(window.location.pathname).toBe(item.path);
        expect(screen.getByRole('heading', { name: item.heading })).toBeInTheDocument();
      }, { timeout: 5000 });
    }
    unmount();
  });
});
