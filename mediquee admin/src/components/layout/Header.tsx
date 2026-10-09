import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, PanelLeftClose, PanelLeftOpen, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { navGroups } from './Sidebar';
import { useAdminAuth } from '../../contexts/AuthContext';
import { notificationsApi, Notification } from '../../services/notificationsApi';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { token } = useAdminAuth();
  
  // Basic breadcrumb logic based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('users')) return 'User Management';
    if (path.includes('hospitals')) return 'Hospital Management';
    if (path.includes('doctors')) return 'Doctor Management';
    if (path.includes('appointments')) return 'Appointments';
    if (path.includes('verification')) return 'Verification Center';
    if (path.includes('reports')) return 'Reports & Analytics';
    if (path.includes('settings')) return 'System Settings';
    if (path.includes('notifications')) return 'Notifications';
    return 'Admin Portal';
  };

  // --- Search Logic ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{name: string, path: string, icon: any}[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase().trim();
    const results: any[] = [];
    navGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.name.toLowerCase().includes(lowerQuery) || group.title.toLowerCase().includes(lowerQuery)) {
          results.push(item);
        }
      });
    });
    setSearchResults(results);
    setSearchSelectedIndex(0);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        navigate(searchResults[searchSelectedIndex].path);
        setIsSearchOpen(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // --- Notifications Logic ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    if (!token) return;
    const count = await notificationsApi.getUnreadCount(token);
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    if (!token) return;
    setIsNotificationsLoading(true);
    setNotificationsError(false);
    try {
      const data = await notificationsApi.getNotifications(token, false);
      setNotifications(data);
    } catch (err) {
      setNotificationsError(true);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen, token]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read && token) {
      await notificationsApi.markAsRead(token, notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsNotificationsOpen(false);
    if (notif.type.includes('hospital')) navigate('/admin/hospitals');
    else if (notif.type.includes('lab')) navigate('/admin/labs');
    else if (notif.type.includes('booking')) navigate('/admin/op-bookings');
    else if (notif.type.includes('verification')) navigate('/admin/verification');
    else navigate('/admin/notifications');
  };

  const handleMarkAllRead = async () => {
    if (token) {
      const success = await notificationsApi.markAllAsRead(token);
      if (success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
        >
          <Menu size={20} />
        </button>

        {/* Desktop sidebar toggle */}
        <button 
          onClick={toggleSidebar}
          className="hidden lg:block p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <h1 className="text-lg font-semibold text-slate-900 transition-colors">{getPageTitle()}</h1>
          <div className="text-xs text-slate-500 flex items-center gap-1 transition-colors">
            <span>Admin</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">{getPageTitle()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search */}
        <div className="hidden md:flex relative group" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 lg:w-80"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm transition-colors">
              ⌘K
            </span>
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 py-2 max-h-[300px] overflow-y-auto z-[60]">
              {searchResults.length > 0 ? (
                <ul className="flex flex-col">
                  {searchResults.map((result, index) => {
                    const Icon = result.icon;
                    return (
                      <li key={result.path}>
                        <button
                          className={`w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors ${searchSelectedIndex === index ? 'bg-slate-100' : ''}`}
                          onClick={() => {
                            navigate(result.path);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          {Icon && <Icon size={16} className="text-slate-500" />}
                          <span className="text-sm font-medium text-slate-700">{result.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  No menu options found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white transition-colors"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-[60]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {isNotificationsLoading ? (
                  <div className="px-4 py-6 text-sm text-slate-500 text-center">
                    Loading notifications...
                  </div>
                ) : notificationsError ? (
                  <div className="px-4 py-6 text-sm text-slate-500 text-center">
                    Unable to load notifications
                    <button onClick={fetchNotifications} className="block mt-2 text-blue-500 hover:underline mx-auto">Retry</button>
                  </div>
                ) : notifications.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {notifications.map(notif => (
                      <li key={notif.id}>
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-sm text-slate-500 text-center flex flex-col items-center">
                    <Bell className="w-8 h-8 text-slate-300 mb-2" />
                    No notifications
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={() => { setIsNotificationsOpen(false); navigate('/admin/notifications'); }}
                  className="w-full py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 text-center rounded-md hover:bg-slate-100 transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
