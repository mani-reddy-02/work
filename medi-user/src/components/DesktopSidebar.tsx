import { cn } from '../lib/utils';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Grid, FileText, Users, User, HelpCircle, LogOut, ChevronLeft } from 'lucide-react';
import { useUIStore } from '../lib/uiStore';

const DesktopSidebar = ({ className }: { className?: string }) => {
  const { setDesktopSidebarOpen } = useUIStore();
  const navItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Bookings', icon: Calendar, path: '/bookings' },
    { name: 'Services', icon: Grid, path: '/services' },
    { name: 'Health Records', icon: FileText, path: '/health-records' },
    { name: 'Family', icon: Users, path: '/family' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <aside className={cn("w-64 bg-white border-r border-slate-100 flex-col h-full shrink-0", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                <path d="M12 9v4"/>
                <path d="M10 11h4"/>
              </svg>
            </div>
            <span className="font-bold text-2xl text-primary tracking-tight">MediQuee</span>
          </div>

          <button
            type="button"
            onClick={() => setDesktopSidebarOpen(false)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close menu"
            aria-label="Close menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100 space-y-1">
        <NavLink
          to="/help"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary"
        >
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </NavLink>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-red-600 hover:bg-red-50">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
