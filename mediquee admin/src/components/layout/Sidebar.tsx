import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle,
  Building2, 
  Stethoscope, 
  CalendarCheck, 
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
  ListTodo
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

import { useAdminAuth } from '../../contexts/AuthContext';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'People',
    items: [
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Patients', path: '/admin/users?role=patient', icon: UserCircle },
      { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { name: 'Nurses', path: '/admin/providers?type=nurse', icon: HeartHandshake }
    ]
  },
  {
    title: 'Healthcare Network',
    items: [
      { name: 'Hospitals', path: '/admin/hospitals', icon: Building2 },
      { name: 'Labs', path: '/admin/providers?type=lab', icon: TestTube },
      { name: 'All Providers', path: '/admin/providers', icon: Landmark }
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Appointments', path: '/admin/appointments', icon: CalendarCheck },
      { name: 'OP Bookings', path: '/admin/services/op', icon: Activity },
      { name: 'Video Consults', path: '/admin/services/video-consultation', icon: Video },
      { name: 'Lab Tests', path: '/admin/services/lab-tests', icon: TestTube },
      { name: 'Home Sample', path: '/admin/services/home-sample-collection', icon: Home },
      { name: 'Home Nursing', path: '/admin/services/home-nursing', icon: HeartHandshake }
    ]
  },
  {
    title: 'Finance',
    items: [
      { name: 'Transactions', path: '/admin/transactions', icon: CreditCard },
      { name: 'Revenue', path: '/admin/transactions?type=revenue', icon: TrendingUp },
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
      { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 }
    ]
  },
  {
    title: 'Communication',
    items: [
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Activity Log', path: '/admin/activity', icon: ListTodo }
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', path: '/admin/settings', icon: Settings }
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
          className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 z-20 lg:hidden transition-colors"
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
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight transition-colors">MediQuee</span>
          </div>
          
          {/* Logo when collapsed (desktop only) */}
          <div className={`hidden lg:flex w-full items-center justify-center ${isOpen && 'lg:hidden'}`}>
             <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
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
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
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
                          <div className="hidden lg:group-hover:block absolute left-full ml-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded whitespace-nowrap z-50">
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
           <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center'}`}>
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
               <img 
                 src={adminUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} 
                 alt="Admin Avatar" 
                 className="w-full h-full object-cover"
               />
             </div>
             
             <div className={`flex-1 min-w-0 ${!isOpen && 'lg:hidden'}`}>
               <p className="text-sm font-medium text-slate-900 dark:text-white truncate transition-colors">{adminUser?.name || 'Super Admin'}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate transition-colors">{adminUser?.email || 'admin@mediquee.com'}</p>
             </div>
             
             <button 
               onClick={logout}
               title="Sign Out"
               className={`p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:text-red-400 dark:hover:bg-slate-800 rounded-md transition-colors ${!isOpen && 'lg:hidden'}`}
             >
                <LogOut size={18} />
             </button>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
