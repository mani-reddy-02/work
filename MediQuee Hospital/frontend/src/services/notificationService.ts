// ----------------------------------------------------------------------------
// NOTIFICATION & REAL-TIME EVENT SERVICE LAYER
// ----------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  hospitalId?: string | null;
  userId?: string | null;
  title: string;
  message: string;
  type: string; // appointment, department, staff, lab, activity, alert, success
  read: boolean;
  metadata?: any;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Web Audio API chime synthesizer.
 * Creates a crystal-clear, elegant two-tone notification bell without external audio files.
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First bell tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Second harmonic bell tone (A5 - 880 Hz) - starts shortly after for a melodious ding
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.warn('Unable to play audio notification chime:', err);
  }
}

/**
 * Request system / browser push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    localStorage.setItem('mediquee_push_enabled', 'true');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('mediquee_push_enabled', 'true');
      return true;
    }
  }

  localStorage.setItem('mediquee_push_enabled', 'false');
  return false;
}

/**
 * Check if push notifications are enabled and granted
 */
export function isPushNotificationEnabled(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted' && localStorage.getItem('mediquee_push_enabled') === 'true';
}

/**
 * Set push notifications preference
 */
export function setPushNotificationPreference(enabled: boolean) {
  localStorage.setItem('mediquee_push_enabled', enabled ? 'true' : 'false');
}

/**
 * Trigger a native desktop / system notification (visible even when tab/window is in background)
 */
export function showDesktopNotification(title: string, body: string, data?: any) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (localStorage.getItem('mediquee_push_enabled') === 'false') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'mediquee-alert-' + Date.now(),
      data,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (data?.url) {
        window.location.href = data.url;
      }
    };
  } catch (err) {
    console.warn('Failed to display system notification:', err);
  }
}

export const notificationApi = {
  /**
   * GET /api/v1/notifications
   */
  async getNotifications(params?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<AppNotification[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.unreadOnly) query.set('unread', 'true');

    const res = await fetch(`${API_URL}/api/v1/notifications?${query.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch notifications');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(): Promise<number> {
    const res = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return 0;
    }

    const json = await res.json();
    return json.data?.unreadCount ?? 0;
  },

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(id: string): Promise<void> {
    await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  /**
   * POST /api/v1/notifications/read-all
   */
  async markAllAsRead(): Promise<void> {
    await fetch(`${API_URL}/api/v1/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  /**
   * Opens a real-time Server-Sent Events connection to the backend.
   */
  createStreamConnection(
    onMessage: (notification: AppNotification) => void,
    onHandshake?: (data: { unreadCount: number }) => void
  ): () => void {
    const token = localStorage.getItem('mediquee_token');
    if (!token) return () => {};

    const eventSource = new EventSource(`${API_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'HANDSHAKE') {
          if (onHandshake) onHandshake(data);
          return;
        }

        // Play chime sound on every incoming notification!
        playNotificationChime();

        // Trigger desktop / push alert if enabled
        showDesktopNotification(data.title, data.message, {
          id: data.id,
          type: data.type,
          url: data.type === 'appointment' ? '#/appointments' : '#/notifications'
        });

        onMessage(data);
      } catch (err) {
        console.warn('Error parsing incoming notification event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('Notification stream connection error, will automatically reconnect:', err);
    };

    // Return disconnect function
    return () => {
      eventSource.close();
    };
  }
};
