import { ArrowUp, Clock, Users, IndianRupee, Calendar, FileText, ChevronDown, Stethoscope, MoreVertical } from "lucide-react"
import { motion } from "framer-motion"
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from "react-router-dom"
import { PromoCarousel } from "../components/PromoCarousel"


export function Dashboard() {
  const navigate = useNavigate();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const quickActions = [
    { icon: Users, label: 'OP Mgt', path: '/appointments' },
    { icon: Calendar, label: 'Appts', path: '/appointments' },
    { icon: IndianRupee, label: 'Payout', path: '/payouts' },
    { icon: Stethoscope, label: 'Doctors', path: '/profile' },
    { icon: FileText, label: 'Reports', path: '/dashboard' },
  ];

  const todayAppointments = [
    { time: '09:00 AM', name: 'Ramesh Kumar', dept: 'Cardiology', doctor: 'Dr. Arjun Singh', status: 'Confirmed', statusColor: 'text-[#16A34A]', avatar: 'https://i.pravatar.cc/150?u=1' },
    { time: '10:00 AM', name: 'Priya Sharma', dept: 'Dermatology', doctor: 'Dr. Neha Verma', status: 'Confirmed', statusColor: 'text-[#16A34A]', avatar: 'https://i.pravatar.cc/150?u=2' },
    { time: '11:00 AM', name: 'Mohammed Ali', dept: 'General', doctor: 'Dr. Amit Patel', status: 'Pending', statusColor: 'text-[#F59E0B]', avatar: 'https://i.pravatar.cc/150?u=3' },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="flex flex-col gap-6 p-4 pt-2"
    >
      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold text-[#172033]">Good morning, City Care Hospital 👋</h1>
        <p className="text-[14px] text-[#667085]">Here's what's happening at your hospital today.</p>
      </div>

      {/* Today's Overview (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1 */}
        <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-primary rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-medium text-[#667085]">Total OPs</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[24px] font-semibold text-[#172033] tracking-tight">128</span>
            <div className="flex items-center text-[11px] font-semibold text-success mt-1">
              <ArrowUp className="w-3 h-3 mr-0.5" />
              12% today
            </div>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-warning rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-medium text-[#667085]">Pending OPs</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[24px] font-semibold text-[#172033] tracking-tight">18</span>
            <div className="flex items-center text-[11px] font-semibold text-warning mt-1">
              <ArrowUp className="w-3 h-3 mr-0.5" />
              8% today
            </div>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-info rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-medium text-[#667085]">Lab Tests</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[24px] font-semibold text-[#172033] tracking-tight">86</span>
            <div className="flex items-center text-[11px] font-semibold text-success mt-1">
              <ArrowUp className="w-3 h-3 mr-0.5" />
              10% today
            </div>
          </div>
        </motion.div>

        {/* Card 4 */}
        <motion.div variants={item} className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-100/50 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 text-teal rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-medium text-[#667085]">Revenue</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[24px] font-semibold text-[#172033] tracking-tight">₹2,45k</span>
            <div className="flex items-center text-[11px] font-semibold text-success mt-1">
              <ArrowUp className="w-3 h-3 mr-0.5" />
              15% today
            </div>
          </div>
        </motion.div>
      </div>

      <PromoCarousel />

      {/* Revenue Trend Chart */}
      <motion.div variants={item} className="bg-white rounded-2xl border border-gray-100/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[15px] font-semibold text-[#172033]">Revenue</h3>
            <span className="text-[12px] font-medium text-[#667085]">This Week</span>
          </div>
          <button className="flex items-center gap-1 text-[12px] font-semibold text-[#172033] bg-[#F7F8FA] px-2.5 py-1.5 rounded-lg interactive-element">
            Week <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[24px] font-semibold text-[#172033] tracking-tight">₹2,45,000</span>
            <div className="flex items-center text-[12px] font-semibold text-success mt-1">
              <ArrowUp className="w-3 h-3 mr-0.5" />
              15% vs previous period
            </div>
          </div>
        </div>

        <div className="h-[120px] w-full mt-2 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1769E0" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1769E0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                itemStyle={{ color: '#1769E0', fontWeight: '600' }}
                cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1769E0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Quick Access */}
      <motion.div variants={item} className="flex flex-col gap-3">
        <h3 className="text-[17px] font-semibold text-[#172033] px-1">Quick Access</h3>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={() => navigate(action.path)} className="flex flex-col items-center gap-2 min-w-[72px] interactive-element active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-100/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-primary">
                <action.icon className="w-6 h-6" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-medium text-[#172033]">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Today's Appointments */}
      <motion.div variants={item} className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[17px] font-semibold text-[#172033]">Today's Appointments</h3>
          <button onClick={() => navigate('/appointments')} className="text-[13px] font-semibold text-primary interactive-element">View All</button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          {todayAppointments.map((appt, idx) => (
            <div key={idx} onClick={() => navigate('/appointments')} className="flex items-start gap-3 p-4 border-b border-gray-50 last:border-0 interactive-element active:bg-gray-50/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center pt-1 min-w-[60px]">
                <span className="text-[13px] font-bold text-[#172033]">{appt.time.split(' ')[0]}</span>
                <span className="text-[10px] font-semibold text-[#98A2B3]">{appt.time.split(' ')[1]}</span>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                <img src={appt.avatar} alt={appt.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-[15px] font-semibold text-[#172033]">{appt.name}</span>
                  <button className="p-1 -mt-1 -mr-1 text-[#98A2B3] active:text-[#172033]">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[13px] font-medium text-[#667085] mt-0.5">{appt.dept} &middot; {appt.doctor}</span>
                <span className={`text-[12px] font-semibold mt-1.5 ${appt.statusColor}`}>{appt.status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      
    </motion.div>
  )
}
