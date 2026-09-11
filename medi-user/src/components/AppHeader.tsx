import { Bell, MapPin, Menu, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { useNotifications } from '../lib/notifications';
import { useUIStore } from '../lib/uiStore';
import { useState } from 'react';
import { usePreferences } from '../lib/PreferencesContext';

const LOCATIONS = [
  'Hyderabad, Telangana',
  'Tirupati, Andhra Pradesh',
  'Bengaluru, Karnataka',
  'Chennai, Tamil Nadu'
];

const AppHeader = ({ className }: { className?: string }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  const { language, setLanguage } = usePreferences();
  const { unreadCount } = useNotifications();
  const { location: currentLocation, setLocation, isDesktopSidebarOpen, toggleDesktopSidebar } = useUIStore();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [locationSearch, setLocationSearch] = useState('');

  const filteredLocations = LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(locationSearch.toLowerCase().trim())
  );

  return (
    <>
    <header className={cn("bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-10 w-full", className)}>
      <div className="flex items-center justify-between max-w-7xl mx-auto relative">
        {/* Left: Desktop Menu Toggle */}
        <div className="flex items-center w-8">
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="hidden md:flex items-center justify-center w-9 h-9 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title={isDesktopSidebarOpen ? "Close menu" : "Open menu"}
            aria-label={isDesktopSidebarOpen ? "Close menu" : "Open menu"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Logo (Mobile) / Left: Logo (Desktop) */}
        <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-2">
          <Link to="/" className="font-bold text-xl text-primary tracking-tight">MediQuee</Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {isHome && (
            <button 
              onClick={() => setShowLocationModal(true)}
              className="hidden lg:flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate max-w-[150px]">{currentLocation}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          )}

          <div className="hidden md:flex relative w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
             </div>
             <input type="text" className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all" placeholder="Search services..." />
          </div>

          {/* Language Toggle: EN | తెలుగు */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/80 shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={cn(
                "px-2.5 py-1 rounded-full transition-all text-[11px] font-bold",
                language === 'en'
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('te')}
              className={cn(
                "px-2.5 py-1 rounded-full transition-all text-[11px] font-bold",
                language === 'te'
                  ? "bg-white text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
              title="తెలుగుకి మారండి"
            >
              తెలుగు
            </button>
          </div>

          <Link 
            to="/notifications"
            className="relative p-2 text-slate-600 hover:text-primary transition-colors bg-slate-50 rounded-full md:bg-transparent -mr-2 md:mr-0"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full text-[8px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          
          <Link to="/profile" className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="Profile" className="w-full h-full object-cover" />
          </Link>
        </div>
      </div>
      
      {isHome && (
        <button onClick={() => setShowLocationModal(true)} className="w-full md:hidden mt-4 flex items-center justify-between text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 active:bg-slate-100">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate font-medium">{currentLocation}</span>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
      )}
    </header>

    {/* Location Modal Overlay */}
    {showLocationModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800">Select Location</h3>
            <button 
              onClick={() => {
                setShowLocationModal(false);
                setLocationSearch('');
              }}
              className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all" 
                placeholder="Search city or location..." 
              />
            </div>
          </div>
          
          <div className="overflow-y-auto">
            {filteredLocations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No locations found.
              </div>
            ) : (
              filteredLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setLocation(loc);
                    setShowLocationModal(false);
                    setLocationSearch('');
                  }}
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-left border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors text-sm",
                    currentLocation === loc ? "font-bold text-primary bg-blue-50/50" : "font-medium text-slate-700"
                  )}
                >
                  <MapPin className={cn("w-4 h-4 mr-3", currentLocation === loc ? "text-primary" : "text-slate-400")} />
                  {loc}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AppHeader;
