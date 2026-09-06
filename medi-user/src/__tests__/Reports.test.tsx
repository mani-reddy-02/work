import { render, screen, fireEvent, waitFor } from './test-utils';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import Reports from '../pages/Reports';
import React from 'react';
import userEvent from '@testing-library/user-event';

describe('Reports Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders initial default reports', () => {
    render(<Reports />);
    expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
  });

  test('file upload with valid file', async () => {
    render(<Reports />);
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    
    const uploadTab = screen.getByText('Upload Reports');
    fireEvent.click(uploadTab);

    // The input is hidden or handled via label click, let's find input type=file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    await userEvent.upload(input, file);
    
    // It should add to reports
    expect(screen.getByText('hello.png')).toBeInTheDocument();
    expect(screen.getByText('Uploaded by You')).toBeInTheDocument();
    
    // Check localStorage
    const saved = JSON.parse(localStorage.getItem('mediquee_reports') || '[]');
    expect(saved[0].title).toBe('hello.png');
  });

  test('file upload with invalid type alerts', async () => {
    render(<Reports />);
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const uploadTab = screen.getByText('Upload Reports');
    fireEvent.click(uploadTab);
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Unsupported file type'));
  });

  test('deletes report', async () => {
    render(<Reports />);
    
    // Check CBC is present
    expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    
    // Find delete buttons (Trash2 icons inside buttons)
    // We can search for the nearest button or test-id. Since no test-id, we can rely on window.confirm
    const deleteButtons = document.querySelectorAll('button');
    // Assuming the delete buttons are the ones beside the report
    // Let's just click the first delete button we can find that triggers confirm
    // Actually, in Reports.tsx we have onClick={() => handleDelete(report.id)}
    // Let's just check if delete works if we mock it, or find it by role.
    const allButtons = screen.getAllByRole('button');
    
    // The first button is Back, the second might be Upload
    // Let's find button inside the report card
    const cbcCard = screen.getByText('Complete Blood Count (CBC)').closest('div.bg-white');
    if (cbcCard) {
      const delBtn = cbcCard.querySelector('button');
      if (delBtn) fireEvent.click(delBtn);
    }

    expect(window.confirm).toHaveBeenCalled();
    // Since mock confirm returns true, it should be deleted
    expect(screen.queryByText('Complete Blood Count (CBC)')).not.toBeInTheDocument();
  });

  test('filters reports using search input', () => {
    render(<Reports />);
    const searchInput = screen.getByPlaceholderText('Search reports by test, hospital or date...');
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Chest' } });
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    expect(screen.queryByText('Complete Blood Count (CBC)')).not.toBeInTheDocument();
  });

  test('opens and closes report detail modal', () => {
    render(<Reports />);
    const cbcCard = screen.getByText('Complete Blood Count (CBC)');
    fireEvent.click(cbcCard);

    expect(screen.getByText('Clinical Findings & Summary')).toBeInTheDocument();
    expect(screen.getByText('Prescribing Doctor')).toBeInTheDocument();

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Clinical Findings & Summary')).not.toBeInTheDocument();
  });

  test('handles corrupted or serialized object icons in localStorage without crashing', () => {
    // Simulate what happens when Lucide forwardRef icon was serialized as {} in localStorage
    localStorage.setItem('mediquee_reports', JSON.stringify([
      { id: '99', title: 'Corrupted Icon Report', hospital: 'City Care', date: '01 Jan 2025', icon: {}, pages: '1 page', status: 'Normal' }
    ]));

    render(<Reports />);
    expect(screen.getByText('Corrupted Icon Report')).toBeInTheDocument();
    expect(screen.getByText('City Care')).toBeInTheDocument();
  });

  test('handles malformed JSON in localStorage gracefully without crashing', () => {
    localStorage.setItem('mediquee_reports', 'invalid-json-string{[');

    render(<Reports />);
    // Should fall back to defaultReports
    expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
  });
});
