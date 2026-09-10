export interface ReportRecord {
  id: string;
  title: string;
  hospital: string;
  doctor?: string;
  date: string;
  pages: string;
  status: string;
  statusColor: string;
  iconName?: string;
  iconColor: string;
  bg: string;
  summary?: string;
  fileUrl: string;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const reportsApi = {
  /**
   * Fetch current authenticated user's reports.
   */
  async getReports(): Promise<{ success: boolean; data?: ReportRecord[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reports`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.message || 'Failed to fetch reports' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching reports' };
    }
  },

  /**
   * Upload a new report using base64 encoding.
   */
  async uploadReport(payload: {
    title: string;
    hospital: string;
    doctor?: string;
    date: string;
    pages?: string;
    status?: string;
    summary?: string;
    fileData: string;
    fileName: string;
  }): Promise<{ success: boolean; data?: ReportRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.message || 'Failed to upload report' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error uploading report' };
    }
  },

  /**
   * Delete a report.
   */
  async deleteReport(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.message || 'Failed to delete report' };
      }

      return { success: true, message: json.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting report' };
    }
  },

  /**
   * Download a report. This opens the physical file download.
   */
  async downloadReport(id: string, fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${id}/download`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.message || 'Failed to download report' };
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error downloading report' };
    }
  }
};
