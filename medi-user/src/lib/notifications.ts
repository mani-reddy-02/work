import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

let globalNotifications: AppNotification[] = [];
let listeners = new Set<() => void>();
let isInitialized = false;
let sseConnection: EventSource | null = null;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mediquee_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const notifyListeners = () => listeners.forEach(l => l());

const fetchNotifications = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (json.success) {
      globalNotifications = json.data || [];
      notifyListeners();
    }
  } catch (err) {
    console.error('Failed to fetch notifications', err);
  }
};

const initSSE = () => {
  if (sseConnection) return;
  const token = localStorage.getItem('mediquee_token');
  if (!token) return;

  const url = new URL(`${API_BASE_URL}/notifications/stream`);
  url.searchParams.set('token', token);

  sseConnection = new EventSource(url.toString());

  sseConnection.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') return;
      
      if (data.notification) {
        // Add new notification to the top
        globalNotifications = [data.notification, ...globalNotifications];
        notifyListeners();
      }
    } catch (err) {
      console.error('SSE Error', err);
    }
  };

  sseConnection.onerror = () => {
    sseConnection?.close();
    sseConnection = null;
    // Reconnect after a delay
    setTimeout(initSSE, 5000);
  };
};

export const initializeNotifications = () => {
  if (isInitialized) return;
  isInitialized = true;
  fetchNotifications();
  initSSE();
};

export const useNotifications = () => {
  const [notifications, setNotificationsState] = useState(globalNotifications);

  useEffect(() => {
    // Initialize if not already done
    initializeNotifications();

    const listener = () => setNotificationsState([...globalNotifications]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const markAsRead = async (id: string) => {
    globalNotifications = globalNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    notifyListeners();

    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    globalNotifications = globalNotifications.map(n => ({ ...n, read: true }));
    notifyListeners();

    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
