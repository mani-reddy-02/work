import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle,
  Building2, FlaskConical, 
  Stethoscope, 
  CalendarCheck, 
  Shield,
  ShieldCheck, 
  BarChart3, 
  Bell, 
  Settings,
  LogOut,
  ChevronLeft,
  Activity,
  Video,
  TestTube,
  Home,
  HeartHandshake,
  CreditCard,
  TrendingUp,
  Landmark,
  ListTodo,
  Inbox,
  Network,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

import { useAdminAuth } from '../../contexts/AuthContext';

export const navGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'People',
    items: [
      { name: 'Patients', path: '/admin/patients', icon: UserCircle },
      { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { name: 'Nurses', path: '/admin/nurses', icon: HeartHandshake },
      { name: 'Receptionists', path: '/admin/receptionists', icon: Users }
    ]
  },
  {
    title: 'Healthcare Network',
    items: [
      { name: 'Hospitals', path: '/admin/hospitals', icon: Building2 },
      { name: 'Departments', path: '/admin/departments', icon: Network },
      { name: 'Labs', path: '/admin/labs', icon: FlaskConical },
      { name: 'Lab Departments', path: '/admin/lab-departments', icon: TestTube },
      { name: 'Nursing Services', path: '/admin/nursing-services', icon: HeartHandshake }
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'OP Bookings', path: '/admin/op-bookings', icon: Activity },
      { name: 'Video Consults', path: '/admin/services/video-consultation', icon: Video },
      { name: 'Lab Tests', path: '/admin/services/lab-tests', icon: TestTube },
      { name: 'Home Sample', path: '/admin/services/home-sample-collection', icon: Home },
      { name: 'Home Nursing', path: '/admin/services/home-nursing', icon: HeartHandshake },
      { name: 'Insurance', path: '/admin/insurance', icon: Shield }
    ]
  },
  {
    title: 'Finance',
    items: [
      { name: 'Transactions', path: '/admin/transactions', icon: CreditCard },
      { name: 'Revenue', path: '/admin/revenue', icon: TrendingUp },
      { name: 'Settlements', path: '/admin/settlements', icon: Landmark }
    ]
  },
  {
    title: 'Verification',
    items: [
      { name: 'Verification Center', path: '/admin/verification', icon: ShieldCheck }
    ]
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
      { name: 'Requests History', path: '/admin/reports/requests-history', icon: ListTodo }
    ]
  },
  {
    title: 'Communication',
    items: [
      { name: 'Requests', path: '/admin/requests', icon: Inbox },
      { name: 'Notifications', path: '/admin/notifications', icon: Bell }
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', path: '/admin/settings', icon: Settings },
      { name: 'Home Posters', path: '/admin/home-posters', icon: LayoutDashboard },
      { name: 'FAQs', path: '/admin/faqs', icon: HelpCircle }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { adminUser, logout } = useAdminAuth();
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50  z-20 lg:hidden transition-colors"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:w-20 lg:translate-x-0'
        }`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className={`flex items-center gap-2 ${!isOpen && 'lg:hidden'}`}>
            <img src="/logo.png" alt="MediQuee" className="h-8 w-auto object-contain dark:brightness-110" />
          </div>
          
          {/* Logo when collapsed (desktop only) */}
          <div className={`hidden lg:flex w-full items-center justify-center ${isOpen && 'lg:hidden'}`}>
            <img src="/logo-icon.png" alt="MediQuee" className="w-9 h-9 object-contain rounded-xl" />
          </div>
          
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6 px-3">
              <h3 className={`px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors ${!isOpen && 'lg:hidden'}`}>
                {group.title}
              </h3>
              
              {/* Divider when collapsed */}
              {!isOpen && groupIndex > 0 && (
                <div className="hidden lg:block h-px bg-slate-200 dark:bg-slate-800 mx-4 mb-4 transition-colors" />
              )}

              <ul className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <li key={itemIndex}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-semibold shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                          } ${!isOpen && 'lg:justify-center'}`
                        }
                        title={!isOpen ? item.name : undefined}
                      >
                        <Icon size={20} className="shrink-0" />
                        <span className={`font-medium ${!isOpen && 'lg:hidden'}`}>
                          {item.name}
                        </span>
                        
                        {/* Tooltip for collapsed state */}
                        {!isOpen && (
                          <div className="hidden lg:group-hover:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-50">
                            {item.name}
                          </div>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Profile Area */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 transition-colors">
          <div className={`flex items-center gap-2.5 ${!isOpen && 'lg:justify-center'}`}>
            <NavLink
              to="/admin/settings?tab=profile"
              title="View Profile Settings"
              className={`flex-1 flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group min-w-0 ${!isOpen && 'lg:p-0 lg:hover:bg-transparent'}`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500/30 transition-all">
                <img 
                  src={adminUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} 
                  alt="Admin Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className={`flex-1 min-w-0 ${!isOpen && 'lg:hidden'}`}>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {adminUser?.name || 'Super Admin'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {adminUser?.designation || 'Administrator'}
                </p>
              </div>
            </NavLink>
            
            <button 
              onClick={logout}
              title="Sign Out"
              className={`p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer ${!isOpen && 'lg:hidden'}`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
