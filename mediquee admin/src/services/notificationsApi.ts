const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: async (token: string, unreadOnly: boolean = false): Promise<Notification[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?unread=${unreadOnly}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  },

  getUnreadCount: async (token: string): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.success ? data.count : 0;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  },

  markAsRead: async (token: string, id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error marking as read:', err);
      return false;
    }
  },

  markAllAsRead: async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error marking all as read:', err);
      return false;
    }
  }
};
