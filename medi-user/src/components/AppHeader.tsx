import { Bell, MapPin, Menu, Search, X, LocateFixed, Loader2, CheckCircle2, AlertCircle, Compass, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { useNotifications } from '../lib/notifications';
import { useUIStore } from '../lib/uiStore';
import { useProfile } from '../lib/profile';
import { useState } from 'react';
import { usePreferences } from '../lib/PreferencesContext';
import { searchLocalities, KNOWN_LOCALITIES, type LocalityItem } from '../lib/locationService';

const RADIUS_OPTIONS = [
  { value: 25, label: '25 km (Default)' },
  { value: 50, label: '50 km (Expanded)' },
  { value: 100, label: '100 km (Wide)' },
];

const AppHeader = ({ className }: { className?: string }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  const { profile } = useProfile();
  const { language, setLanguage } = usePreferences();
  const { unreadCount } = useNotifications();
  const {
    userLocation,
    detectLocation,
    setManualLocation,
    setNearbyRadiusKm,
    isDesktopSidebarOpen,
    toggleDesktopSidebar
  } = useUIStore();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const searchResults: LocalityItem[] = searchLocalities(locationSearch);

  const handleSelectLocality = (item: LocalityItem) => {
    setManualLocation(item.name, item.latitude ?? item.lat, item.longitude ?? item.lng, item.city);
    setShowLocationModal(false);
    setLocationSearch('');
  };

  const handleGpsDetect = async () => {
    await detectLocation(true);
  };

  return (
    <>
    <header className={cn("bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-10 w-full", className)}>
      <div className="flex items-center justify-between max-w-7xl mx-auto relative">
        {/* Left: Desktop Menu Toggle & Logo */}
        <div className="flex items-center gap-2">
          {!isDesktopSidebarOpen && (
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="hidden md:flex items-center justify-center w-9 h-9 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Open menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className={cn(
            "absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center gap-2",
            isDesktopSidebarOpen && "md:hidden"
          )}>
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="MediQuee" className="h-7 md:h-8 w-auto object-contain" />
            </Link>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Location Selector (Desktop) */}
          <button 
            id="desktop-location-selector"
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="hidden sm:flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs"
            title="Change Location & Radius"
          >
            <MapPin className={cn("w-4 h-4 shrink-0", userLocation.status === 'detected' ? "text-emerald-600" : "text-primary")} />
            <span className="truncate max-w-[170px] font-medium">{userLocation.label}</span>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">
              {userLocation.radiusKm} km
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

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
          
          <Link to="/profile" className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
             <img src={profile?.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"} alt="Profile" className="w-full h-full object-cover" />
          </Link>
        </div>
      </div>
      
      {/* Mobile Location Bar */}
      <button 
        id="mobile-location-selector"
        type="button"
        onClick={() => setShowLocationModal(true)} 
        className="w-full sm:hidden mt-3 flex items-center justify-between text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 active:bg-slate-100 shadow-2xs"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className={cn("w-4 h-4 shrink-0", userLocation.status === 'detected' ? "text-emerald-600" : "text-primary")} />
          <span className="truncate font-medium">{userLocation.label}</span>
          <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded-full border border-slate-200 shrink-0">
            {userLocation.radiusKm} km
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
    </header>

    {/* Location Modal */}
    {showLocationModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
          {/* Modal Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Select Location</h3>
              <p className="text-xs text-slate-500 mt-0.5">Discover genuine nearby hospitals and laboratories</p>
            </div>
            <button 
              id="close-location-modal"
              type="button"
              onClick={() => {
                setShowLocationModal(false);
                setLocationSearch('');
              }}
              className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-3.5 border-b border-slate-100 bg-white">
            {/* GPS Detection Action */}
            <div className="space-y-2">
              <button
                id="btn-detect-gps"
                type="button"
                onClick={handleGpsDetect}
                disabled={userLocation.status === 'detecting'}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-xs",
                  userLocation.status === 'detecting'
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : userLocation.status === 'detected'
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                    : "bg-primary text-white hover:bg-primary/95 shadow-sm active:scale-[0.99]"
                )}
              >
                {userLocation.status === 'detecting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Detecting current location...</span>
                  </>
                ) : userLocation.status === 'detected' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>GPS Active: {userLocation.label} (Tap to Re-detect)</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-4 h-4" />
                    <span>Use Current Location (GPS)</span>
                  </>
                )}
              </button>

              {/* Status Alert Messages */}
              {userLocation.status === 'denied' && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Location permission was denied.</p>
                    <p className="text-amber-800 mt-0.5">Please select your city or locality manually below, or retry if you enabled permissions.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGpsDetect}
                    className="shrink-0 text-xs font-bold text-amber-900 underline hover:text-amber-950"
                  >
                    Retry GPS
                  </button>
                </div>
              )}

              {userLocation.status === 'unavailable' && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Device location is unavailable.</p>
                    <p className="text-slate-600 mt-0.5">Please select your city or locality from the list below.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGpsDetect}
                    className="shrink-0 text-xs font-bold text-primary underline"
                  >
                    Retry GPS
                  </button>
                </div>
              )}
            </div>

            {/* Search Radius Selector */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-primary" />
                  Nearby Search Radius:
                </span>
                <span className="text-xs font-bold text-primary">{userLocation.radiusKm} km</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNearbyRadiusKm(opt.value)}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center",
                      userLocation.radiusKm === opt.value
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {opt.value} km
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative pt-1">
              <div className="absolute inset-y-0 left-0 pl-3 pt-1 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                id="input-locality-search"
                type="text" 
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all" 
                placeholder="Search city or location..." 
              />
            </div>
          </div>
          
          {/* Locality Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[320px]">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-slate-600 text-sm font-medium">No localities found matching "{locationSearch}"</p>
                <p className="text-xs text-slate-400">Try searching for Uppal, Banjara Hills, Gachibowli, Secunderabad, or Adoni.</p>
                {locationSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualLocation(locationSearch.trim());
                      setShowLocationModal(false);
                      setLocationSearch('');
                    }}
                    className="mt-2 text-xs font-bold text-primary underline"
                  >
                    Use "{locationSearch.trim()}" as custom location
                  </button>
                )}
              </div>
            ) : (
              searchResults.map((loc) => {
                const isSelected = userLocation.label.includes(loc.name) || 
                  (userLocation.locality === loc.name);

                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSelectLocality(loc)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors text-sm",
                      isSelected ? "bg-primary/5 font-semibold text-primary" : "text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <MapPin className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-slate-400")} />
                      <div className="truncate">
                        <span className="block font-medium text-slate-800 truncate">{loc.name}</span>
                        <span className="block text-xs text-slate-400">{loc.city}, {loc.state}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AppHeader;
