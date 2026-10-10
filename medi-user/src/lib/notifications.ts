import { useState, useEffect } from 'react';

import { API_BASE_URL } from './apiConfig';

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
let backendUnreadCount = 0;
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

  const url = new URL(`${API_BASE_URL}/notifications/stream`, window.location.origin);
  url.searchParams.set('token', token);

  sseConnection = new EventSource(url.toString());

  sseConnection.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'HANDSHAKE') {
        backendUnreadCount = data.unreadCount || 0;
        notifyListeners();
        return;
      }
      if (data.type === 'ping') return;
      
      if (data.notification) {
        // Add new notification to the top
        globalNotifications = [data.notification, ...globalNotifications];
        backendUnreadCount += 1;
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

export const clearNotifications = () => {
  globalNotifications = [];
  backendUnreadCount = 0;
  isInitialized = false;
  if (sseConnection) {
    sseConnection.close();
    sseConnection = null;
  }
  notifyListeners();
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
    const wasUnread = !globalNotifications.find(n => n.id === id)?.read;
    globalNotifications = globalNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    if (wasUnread) {
      backendUnreadCount = Math.max(0, backendUnreadCount - 1);
    }
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
    backendUnreadCount = 0;
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

  // Use backend unread count, fallback to local calculation if not yet loaded via SSE
  const unreadCount = backendUnreadCount > 0 
    ? backendUnreadCount 
    : globalNotifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
