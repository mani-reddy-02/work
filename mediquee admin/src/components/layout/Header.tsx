import React from 'react';
import { Menu, Bell, Search, PanelLeftClose, PanelLeftOpen, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
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

  return (
    <header className="h-16 bg-white  border-b border-slate-200  flex items-center justify-between px-4 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 :bg-slate-800 rounded-md"
        >
          <Menu size={20} />
        </button>

        {/* Desktop sidebar toggle */}
        <button 
          onClick={toggleSidebar}
          className="hidden lg:block p-2 text-slate-500 hover:bg-slate-100 :bg-slate-800 rounded-md transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <h1 className="text-lg font-semibold text-slate-900  transition-colors">{getPageTitle()}</h1>
          <div className="text-xs text-slate-500  flex items-center gap-1 transition-colors">
            <span>Admin</span>
            <span className="text-slate-300 ">/</span>
            <span className="text-slate-600 ">{getPageTitle()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search */}
        <div className="hidden md:flex relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search platform..."
            className="pl-9 pr-4 py-2 bg-slate-50  border border-slate-200  rounded-lg text-sm text-slate-900  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 :border-blue-500 transition-all w-64 lg:w-80"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-slate-400  border border-slate-200  rounded px-1.5 py-0.5 bg-white  shadow-sm transition-colors">
              ⌘K
            </span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:bg-slate-100  :bg-slate-800 rounded-full transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100  :bg-slate-800 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white  transition-colors"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
