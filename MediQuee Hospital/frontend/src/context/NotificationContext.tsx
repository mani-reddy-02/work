import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  notificationApi, 
  type AppNotification, 
  isPushNotificationEnabled, 
  setPushNotificationPreference, 
  requestPushPermission,
  playNotificationChime,
  showDesktopNotification
} from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  pushEnabled: boolean;
  togglePushNotifications: () => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  playChime: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => isPushNotificationEnabled());

  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationApi.getNotifications({ limit: 50 }),
        notificationApi.getUnreadCount()
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Connect real-time Server-Sent Events stream when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const disconnect = notificationApi.createStreamConnection(
      (newNotif) => {
        // Prepend new incoming notification
        setNotifications((prev) => {
          // Avoid duplicate entry if reconnect happened
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });

        // Increment unread count
        setUnreadCount((count) => count + 1);

        // Show prominent in-app toast
        toast(`${newNotif.title}: ${newNotif.message}`, 'info');
      },
      (handshake) => {
        if (typeof handshake.unreadCount === 'number') {
          setUnreadCount(handshake.unreadCount);
        }
      }
    );

    return () => {
      disconnect();
    };
  }, [isAuthenticated, toast]);

  const togglePushNotifications = async (): Promise<boolean> => {
    if (!pushEnabled) {
      const granted = await requestPushPermission();
      if (granted) {
        setPushEnabled(true);
        setPushNotificationPreference(true);
        playNotificationChime();
        showDesktopNotification(
          'Push Notifications Active',
          'You will now receive real-time alerts on this device even if the window is in the background.'
        );
        toast('Push notifications activated successfully', 'success');
        return true;
      } else {
        toast('Please allow notification permission in your browser settings to enable push notifications.', 'warning');
        return false;
      }
    } else {
      setPushEnabled(false);
      setPushNotificationPreference(false);
      toast('Push notifications turned off', 'info');
      return false;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast('All notifications marked as read', 'success');
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        pushEnabled,
        togglePushNotifications,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchInitialData,
        playChime: playNotificationChime
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
