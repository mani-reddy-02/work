import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, PanelLeftClose, PanelLeftOpen, Sun, Moon, CheckCircle2, User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';
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
  const { token, adminUser, logout } = useAdminAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
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
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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

  useEffect(() => {
    const handleProfileOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleProfileOutsideClick);
    return () => document.removeEventListener('mousedown', handleProfileOutsideClick);
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
    else if (notif.type.includes('insurance')) navigate(notif.metadata?.link || '/admin/insurance');
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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
        >
          <Menu size={20} />
        </button>

        {/* Desktop sidebar toggle */}
        <button 
          onClick={toggleSidebar}
          className="hidden lg:block p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{getPageTitle()}</h1>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 transition-colors">
            <span>Admin</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-300">{getPageTitle()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search */}
        <div className="hidden md:flex relative group" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 lg:w-80"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 bg-white dark:bg-slate-800 shadow-sm transition-colors">
              ⌘K
            </span>
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-2 max-h-[300px] overflow-y-auto z-[60]">
              {searchResults.length > 0 ? (
                <ul className="flex flex-col">
                  {searchResults.map((result, index) => {
                    const Icon = result.icon;
                    return (
                      <li key={result.path}>
                        <button
                          className={`w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${searchSelectedIndex === index ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                          onClick={() => {
                            navigate(result.path);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          {Icon && <Icon size={16} className="text-slate-500 dark:text-slate-400" />}
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{result.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No menu options found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} className="hover:text-slate-800 transition-colors" /> : <Sun size={20} className="text-amber-400 hover:text-amber-300 transition-colors" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 transition-colors"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[60]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {isNotificationsLoading ? (
                  <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    Loading notifications...
                  </div>
                ) : notificationsError ? (
                  <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    Unable to load notifications
                    <button onClick={fetchNotifications} className="block mt-2 text-blue-500 hover:underline mx-auto">Retry</button>
                  </div>
                ) : notifications.length > 0 ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map(notif => (
                      <li key={notif.id}>
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''}`}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400 text-center flex flex-col items-center">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    No notifications
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <button 
                  onClick={() => { setIsNotificationsOpen(false); navigate('/admin/notifications'); }}
                  className="w-full py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              <img
                src={adminUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"}
                alt="Admin Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin";
                }}
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>

            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {adminUser?.name || 'Super Admin'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {adminUser?.designation || 'Administrator'}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[70] animate-fadeIn">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                    <img
                      src={adminUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"}
                      alt="Admin"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{adminUser?.name || 'Super Admin'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{adminUser?.email || 'admin@mediquee.com'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
                      SUPER ADMIN
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/settings?tab=profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <User size={15} className="text-slate-400 dark:text-slate-500" />
                  Admin Profile Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/settings?tab=security');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Shield size={15} className="text-slate-400 dark:text-slate-500" />
                  Security & Password
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/settings?tab=system');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Settings size={15} className="text-slate-400 dark:text-slate-500" />
                  Platform System Settings
                </button>
              </div>

              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut size={15} />
                  Sign Out
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
