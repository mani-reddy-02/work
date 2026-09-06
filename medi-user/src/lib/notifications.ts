import { useState, useEffect } from 'react';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  route: string;
}

const initialNotifications: AppNotification[] = [
  {
    id: 1,
    type: "appointment",
    title: "Appointment Confirmed",
    message: "Your OP appointment with Dr. Ramesh Kumar has been confirmed.",
    time: "Today · 10:30 AM",
    read: false,
    route: "/bookings"
  },
  {
    id: 2,
    type: "lab",
    title: "Lab Test Booking Confirmed",
    message: "Your CBC test booking has been confirmed.",
    time: "Today · 09:15 AM",
    read: false,
    route: "/bookings"
  },
  {
    id: 3,
    type: "nursing",
    title: "Home Nursing Update",
    message: "Your home nursing request has been accepted by the hospital.",
    time: "Yesterday",
    read: true,
    route: "/services/home-nursing"
  },
  {
    id: 4,
    type: "report",
    title: "New Health Report",
    message: "A new health report has been added to your health records.",
    time: "Yesterday",
    read: true,
    route: "/services/reports"
  }
];

// Simple global state for frontend-only persistence across routes
let globalNotifications = [...initialNotifications];
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const useNotifications = () => {
  const [notifications, setNotificationsState] = useState(globalNotifications);

  useEffect(() => {
    const listener = () => setNotificationsState([...globalNotifications]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const markAsRead = (id: number) => {
    globalNotifications = globalNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    notifyListeners();
  };

  const markAllAsRead = () => {
    globalNotifications = globalNotifications.map(n => ({ ...n, read: true }));
    notifyListeners();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
