import { 
  Settings, User, MapPin, CreditCard, Users, 
  FileText, HelpCircle, LogOut, ChevronRight,
  ShieldCheck, Mail, Phone, Camera, Calendar, ClipboardList
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProfile } from '../lib/profile';
import { useAuth } from '../lib/auth';

const menuItems = [
  { 
    icon: User, 
    label: 'Personal Information', 
    subLabel: 'Manage your personal details',
    path: '/profile/personal',
    colorClass: 'text-blue-500 bg-blue-50'
  },
  { 
    icon: MapPin, 
    label: 'My Addresses', 
    subLabel: 'Manage your saved addresses',
    path: '/profile/addresses',
    colorClass: 'text-emerald-500 bg-emerald-50'
  },
  { 
    icon: CreditCard, 
    label: 'Payment Methods', 
    subLabel: 'Manage cards, UPI & wallets',
    path: '/profile/payment',
    colorClass: 'text-purple-500 bg-purple-50'
  },
  { 
    icon: Users, 
    label: 'Family Members', 
    subLabel: 'Manage your family profiles',
    path: '/family',
    colorClass: 'text-orange-500 bg-orange-50'
  },
  { 
    icon: Settings, 
    label: 'Language & Appearance', 
    subLabel: 'Manage language and font preferences',
    path: '/profile/preferences',
    colorClass: 'text-indigo-500 bg-indigo-50'
  },
  { 
    icon: FileText, 
    label: 'Health Records', 
    subLabel: 'View & manage your medical reports',
    path: '/services/reports',
    colorClass: 'text-rose-500 bg-rose-50'
  },
  { 
    icon: HelpCircle, 
    label: 'Help & Support', 
    subLabel: 'Get help and contact support',
    path: '/help',
    colorClass: 'text-blue-500 bg-blue-50'
  },
];

const Profile = () => {
  const { profile } = useProfile();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-400 pt-6 pb-24 px-4 text-white relative rounded-b-[32px] overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
          <svg width="200" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            <path d="M3 12h4l3-9 5 18 3-9h3" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <button className="p-2 hover:bg-white/20 bg-white/10 rounded-full transition-colors backdrop-blur-sm">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/90 text-sm mb-6">Manage your personal information</p>
          
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-2 border-white overflow-hidden bg-white/20 shadow-lg">
                 <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-1 right-1 p-1.5 bg-white rounded-full text-blue-600 shadow-md">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {profile.name}
              </h2>
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-white text-xs font-medium w-fit mb-3 mt-1 backdrop-blur-sm border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" /> 
                <span>Verified User</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-20 flex-1">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 flex divide-x divide-slate-100">
          <div className="flex-1 flex flex-col justify-center px-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] text-slate-500 font-medium leading-tight mb-1">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-slate-800 leading-none mb-1">2</p>
                <p className="text-[11px] text-slate-400">This week</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center px-2 pl-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] text-slate-500 font-medium leading-tight mb-1">Health Records</p>
                <p className="text-2xl font-bold text-slate-800 leading-none mb-1">12</p>
                <p className="text-[11px] text-slate-400">Total reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50 mb-6">
          {menuItems.map((item, index) => (
            <Link 
              key={index}
              to={item.path}
              className="flex items-center p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors ${item.colorClass}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 text-[15px]">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.subLabel}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Link>
          ))}

          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center p-4 hover:bg-red-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 mr-4 shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-600 text-[15px]">Logout</p>
              <p className="text-xs text-slate-500 mt-0.5">Sign out from your account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Logout?</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
