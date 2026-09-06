import { Home, Calendar, Grid, User, Bot } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const MobileBottomNav = ({ className }: { className?: string }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Navigation Bar */}
      <nav className={cn("fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 z-50", className)}>
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          <NavLink to="/" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>
          
          <NavLink to="/bookings" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}>
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-medium">Bookings</span>
          </NavLink>

          <div className="relative -top-6 flex flex-col items-center">
            <button 
              onClick={() => navigate('/ai')}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                "bg-primary text-white shadow-primary/30 hover:bg-blue-700"
              )}
            >
               <span className="text-[9px] font-bold tracking-tight">MediQuee</span>
            </button>
          </div>

          <NavLink to="/services" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}>
            <Grid className="w-6 h-6" />
            <span className="text-[10px] font-medium">Services</span>
          </NavLink>
          
          <NavLink to="/profile" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}>
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">Profile</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
