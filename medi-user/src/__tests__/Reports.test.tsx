import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import Reports from '../pages/Reports';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { reportsApi } from '../lib/reportsApi';

vi.mock('../lib/reportsApi', () => ({
  reportsApi: {
    getReports: vi.fn(),
    uploadReport: vi.fn(),
    deleteReport: vi.fn(),
    downloadReport: vi.fn(),
  }
}));

const mockReports = [
  { 
    id: '1', 
    title: 'Complete Blood Count (CBC)', 
    hospital: 'Apollo Diagnostics', 
    date: '12 May 2024', 
    pages: '2 pages', 
    status: 'Normal', 
  },
  { 
    id: '2', 
    title: 'Chest X-Ray', 
    hospital: 'Manipal Hospital', 
    date: '08 May 2024', 
    pages: '1 page', 
    status: 'Review', 
  }
];

describe('Reports Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    (reportsApi.getReports as any).mockResolvedValue({ success: true, data: mockReports });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders initial default reports', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    });
  });

  test('file upload with valid file', async () => {
    (reportsApi.uploadReport as any).mockResolvedValue({ 
      success: true, 
      data: { id: '3', title: 'hello.png', hospital: 'Uploaded by You', date: 'Today', pages: '1 page', status: 'Uploaded' } 
    });
    
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    });
    
    const uploadTab = screen.getByText('Upload Reports');
    fireEvent.click(uploadTab);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText('hello.png')).toBeInTheDocument();
      expect(screen.getByText('Uploaded by You')).toBeInTheDocument();
    });
  });

  test('file upload with invalid type alerts', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    });

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const uploadTab = screen.getByText('Upload Reports');
    fireEvent.click(uploadTab);
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Unsupported file type'));
  });

  test('deletes report', async () => {
    (reportsApi.deleteReport as any).mockResolvedValue({ success: true });
    
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    });
    
    const cbcCard = screen.getByText('Complete Blood Count (CBC)').closest('div.bg-white');
    if (cbcCard) {
      const delBtn = cbcCard.querySelector('button[title="Delete report"]');
      if (delBtn) fireEvent.click(delBtn);
    }

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText('Complete Blood Count (CBC)')).not.toBeInTheDocument();
    });
  });

  test('filters reports using search input', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search reports by test, hospital or date...');
    fireEvent.change(searchInput, { target: { value: 'Chest' } });
    
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    expect(screen.queryByText('Complete Blood Count (CBC)')).not.toBeInTheDocument();
  });

  test('opens and closes report detail modal', async () => {
    render(<Reports />);
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    });
    
    const cbcCard = screen.getByText('Complete Blood Count (CBC)');
    fireEvent.click(cbcCard);

    expect(screen.getByText('Clinical Findings & Summary')).toBeInTheDocument();

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Clinical Findings & Summary')).not.toBeInTheDocument();
  });
});
