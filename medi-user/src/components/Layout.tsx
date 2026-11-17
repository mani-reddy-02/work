import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import MobileBottomNav from './MobileBottomNav';
import DesktopSidebar from './DesktopSidebar';
import { useUIStore } from '../lib/uiStore';
import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import PostServiceReviewPopup from './PostServiceReviewPopup';

const Layout = () => {
  const { isMobileMenuOpen, setMobileMenuOpen, isDesktopSidebarOpen, detectLocation } = useUIStore();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Close mobile menu and scroll to top on every route change
  useEffect(() => {
    setMobileMenuOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, setMobileMenuOpen]);

  // First take the live location automatically on entry into user module
  useEffect(() => {
    detectLocation(false);
  }, [detectLocation]);
  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-[#172B4D] bg-[#F5F8FD]">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar Drawer */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <DesktopSidebar className="w-[80vw] max-w-[300px] flex" />
        </div>

        {/* Desktop Sidebar (hidden on mobile, smoothly collapsible on desktop) */}
        <div className={cn(
          "hidden md:flex transition-all duration-300 ease-in-out shrink-0 overflow-hidden h-full",
          isDesktopSidebarOpen ? "w-64" : "w-0 border-r-0 opacity-0 pointer-events-none"
        )}>
          <DesktopSidebar className="w-64" />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden relative">
          {/* Top Header */}
          <AppHeader />

          {/* Main Content Area */}
          <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-6 scroll-smooth w-full">
            <div className="w-full min-h-full">
              <Outlet />
            </div>
          </main>

          {/* Mobile Bottom Navigation (hidden on desktop) */}
          <MobileBottomNav className="md:hidden" />
        </div>
      </div>

      {/* Automatic Post-Service Review & Rating Popup */}
      <PostServiceReviewPopup />
    </div>
  );
};

export default Layout;
