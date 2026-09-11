import { Bell, BellOff, ArrowRight, ArrowLeft, Calendar, AlertCircle, Video, Home, Activity, CheckCircle, FileText } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export function Notifications() {
  const [enabled, setEnabled] = useState(true);
  const { role } = useAuth();
  const navigate = useNavigate();

  let notifications: any[] = [];

  if (role === 'admin') {
    notifications = [
      { title: "New Appointment", desc: "Rahul Sharma booked an OP consultation.", time: "2h ago", type: "appointment" },
      { title: "Hospital Alert", desc: "System updated successfully.", time: "1d ago", type: "alert" },
    ];
  } else if (role === 'doctor') {
    notifications = [
      { title: "Patient Arrived", desc: "Priya Sharma is waiting for OP.", time: "10m ago", type: "appointment" },
      { title: "Video Consultation", desc: "Reminder: Call with Amit starts in 15 mins.", time: "15m ago", type: "video" },
    ];
  } else if (role === 'nurse') {
    notifications = [
      { title: "New Booking", desc: "Home nursing request at MG Road.", time: "1h ago", type: "home" },
      { title: "Visit Reminder", desc: "Next visit for Post-op Care in 30 mins.", time: "30m ago", type: "activity" },
    ];
  } else if (role === 'receptionist') {
    notifications = [
      { title: "High Rush Alert", desc: "Cardiology department queue is above normal.", time: "5m ago", type: "alert" },
      { title: "New OP Registration", desc: "Token OP-104 generated.", time: "20m ago", type: "success" },
    ];
  } else if (role === 'lab') {
    notifications = [
      { title: "New Test Order", desc: "Complete Blood Count for Ramesh.", time: "30m ago", type: "document" },
      { title: "Sample Pending", desc: "Home collection scheduled at 10:00 AM.", time: "2h ago", type: "activity" },
    ];
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'video': return <Video className="w-5 h-5 text-purple-600" />;
      case 'home': return <Home className="w-5 h-5 text-emerald-600" />;
      case 'activity': return <Activity className="w-5 h-5 text-orange-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'document': return <FileText className="w-5 h-5 text-indigo-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'appointment': return "bg-blue-50 border-blue-100";
      case 'alert': return "bg-red-50 border-red-100";
      case 'video': return "bg-purple-50 border-purple-100";
      case 'home': return "bg-emerald-50 border-emerald-100";
      case 'activity': return "bg-orange-50 border-orange-100";
      case 'success': return "bg-green-50 border-green-100";
      case 'document': return "bg-indigo-50 border-indigo-100";
      default: return "bg-gray-50 border-gray-100";
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-80px)] pb-24">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        
        {/* Push Notifications Toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
              {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">Push Notifications</span>
              <span className="text-xs font-medium text-gray-500">Receive alerts on your device</span>
            </div>
          </div>
          
          <button 
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </motion.div>

        {/* Notification History */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Recent</h2>
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
            {notifications.map((notif, i) => (
              <motion.div 
                key={i} 
                variants={item}
                className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:border-blue-100 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getBgForType(notif.type)}`}>
                  {getIconForType(notif.type)}
                </div>
                <div className="flex flex-col flex-1 justify-center">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-[15px]">{notif.title}</span>
                    <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">{notif.time}</span>
                  </div>
                  <span className="text-sm text-gray-600 leading-snug">{notif.desc}</span>
                </div>
                {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />}
              </motion.div>
            ))}
          </motion.div>
          
          <button className="mt-2 w-full flex items-center justify-center p-4 rounded-xl border border-dashed border-gray-300 text-gray-500 font-bold text-sm hover:bg-gray-50 hover:text-gray-700 transition-colors group">
            View All History
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  )
}
