import { Search, Filter, Calendar, ArrowLeft, Video, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { VideoDetailModal } from "./VideoDetailModal"

export function VideoConsultations() {
  const [selectedConsult, setSelectedConsult] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('upcoming');
  const [selectedDate, setSelectedDate] = useState('14 May');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const filterTypes = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  const dates = [
    { date: '12 May', day: 'Mon' },
    { date: '13 May', day: 'Tue' },
    { date: '14 May', day: 'Wed' },
    { date: '15 May', day: 'Thu' },
    { date: '16 May', day: 'Fri' },
  ];

  const initialVideoList = [
    { id: 1, mqId: "2001", patientName: "Vikram Patel", time: "11:30", period: "AM", type: "Follow Up", status: "WAITING", avatar: "V" },
    { id: 2, mqId: "2002", patientName: "Neha Kapoor", time: "02:00", period: "PM", type: "New Patient", status: "UPCOMING", avatar: "N" },
    { id: 3, mqId: "2003", patientName: "Sanjay Gupta", time: "04:15", period: "PM", type: "Report Review", status: "UPCOMING", avatar: "S" },
    { id: 4, mqId: "2004", patientName: "Pooja Reddy", time: "09:00", period: "AM", type: "Follow Up", status: "COMPLETED", avatar: "P" },
  ];

  const [videoList] = useState(initialVideoList);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [selectedFilter, selectedDate]);

  const filteredVideos = videoList.filter(apt => 
    (apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || apt.mqId.includes(searchQuery)) &&
    (selectedFilter === 'upcoming' ? ['WAITING', 'UPCOMING', 'IN PROGRESS'].includes(apt.status) : apt.status === 'COMPLETED')
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-gray-100 text-gray-600';
      case 'WAITING': return 'bg-indigo-50 text-indigo-600';
      case 'IN PROGRESS': return 'bg-[#1B5DF1] text-white animate-pulse';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600';
      case 'CANCELLED': return 'bg-red-50 text-red-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const renderAction = (apt: any) => {
    if (apt.status === 'WAITING') {
      return (
        <button 
          onClick={() => setSelectedConsult(apt)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white font-bold text-[13px] px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition-colors active:scale-95"
        >
          <Video className="w-4 h-4" />
          Join Call
        </button>
      );
    } else if (apt.status === 'IN PROGRESS') {
      return (
        <button 
          onClick={() => setSelectedConsult(apt)}
          className="flex items-center gap-1.5 bg-[#1B5DF1] text-white font-bold text-[13px] px-4 py-2 rounded-xl shadow-md hover:bg-[#1B5DF1]/90 transition-colors active:scale-95"
        >
          <Video className="w-4 h-4" />
          Rejoin
        </button>
      );
    } else if (apt.status === 'COMPLETED') {
      return (
        <button 
          className="flex items-center gap-1.5 bg-gray-50 text-gray-600 font-bold text-[13px] px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors active:scale-95"
        >
          <FileText className="w-4 h-4" />
          Summary
        </button>
      );
    } else {
      return (
        <button 
          onClick={() => setSelectedConsult(apt)}
          className="flex items-center gap-1.5 bg-gray-50 text-gray-600 font-bold text-[13px] px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors active:scale-95"
        >
          View Details
        </button>
      );
    }
  };

  return (
    <div className="flex flex-col bg-[#F7F8FA] min-h-full pb-8">
      
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl pt-6 pb-4 px-4 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-gray-100">
        
        {/* Top App Bar */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#0A1A3D] hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-[#1B5DF1]" />
            Video Consultations
          </h1>
        </div>

        {/* Title & Search Bar */}
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1B5DF1] transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-[16px] outline-none focus:border-[#1B5DF1] focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[15px] font-medium text-[#0A1A3D] placeholder:text-gray-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            />
            <button className="absolute inset-y-0 right-4 flex items-center text-[#1B5DF1]">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="bg-gray-100 p-1 rounded-[16px] flex w-full">
          {filterTypes.map((type) => {
            const isActive = selectedFilter === type.id;
            return (
              <button 
                key={type.id}
                onClick={() => setSelectedFilter(type.id)}
                className={cn(
                  "flex-1 py-2.5 rounded-[12px] font-bold text-[13px] transition-all",
                  isActive ? "bg-white text-[#0A1A3D] shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Date Strip */}
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-[52px] h-[52px] bg-white border border-gray-200 text-[#0A1A3D] rounded-[16px] flex-shrink-0 active:scale-95 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <Calendar className="w-6 h-6" />
          </button>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 flex-1">
            {dates.map((d) => {
              const isActive = selectedDate === d.date;
              return (
                <button 
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95",
                    isActive ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30" : "bg-white border border-gray-200 text-gray-500"
                  )}
                >
                  <span className={cn("text-[13px] font-bold leading-tight", isActive ? "text-white" : "text-[#0A1A3D]")}>{d.date.split(' ')[0]}</span>
                  <span className={cn("text-[11px] font-semibold leading-tight", isActive ? "text-[#EBF5FF]" : "text-gray-400")}>{d.day}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col px-4 pt-5 gap-6">
        
        {/* Summary Block */}
        <div className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col items-center flex-1">
            <span className="text-[20px] font-black text-[#0A1A3D]">5</span>
            <span className="text-[11px] font-bold text-gray-500">Today</span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-[20px] font-black text-[#1B5DF1]">3</span>
            <span className="text-[11px] font-bold text-[#1B5DF1]">Upcoming</span>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-[20px] font-black text-emerald-500">12</span>
            <span className="text-[11px] font-bold text-emerald-500">Completed</span>
          </div>
        </div>

        {/* Video List */}
        <div className="flex flex-col relative gap-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl bg-white border border-gray-100" />
                ))}
              </motion.div>
            ) : filteredVideos.length > 0 ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                {filteredVideos.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex flex-col bg-white border border-gray-100 rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden"
                  >
                    {/* Top status indicator line for Waiting/In Progress */}
                    {(apt.status === 'WAITING' || apt.status === 'IN PROGRESS') && (
                      <div className={cn("absolute top-0 left-0 right-0 h-1", apt.status === 'WAITING' ? "bg-indigo-500" : "bg-[#1B5DF1]")} />
                    )}
                    
                    <div className="flex gap-4">
                      {/* Time */}
                      <div className="flex flex-col items-center min-w-[50px] pt-1">
                        <span className="text-[16px] font-black text-[#0A1A3D] leading-none">{apt.time}</span>
                        <span className="text-[11px] font-bold text-gray-400 mt-1">{apt.period}</span>
                      </div>
                      
                      <div className="flex flex-col flex-1 gap-2 border-l border-gray-100 pl-4">
                        {/* Info & Status */}
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-[16px] font-bold text-[#0A1A3D]">{apt.patientName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[12px] font-medium text-gray-500">ID: {apt.mqId}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-[12px] font-medium text-gray-500">{apt.type}</span>
                            </div>
                          </div>
                          
                          <div className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0",
                            getStatusColor(apt.status)
                          )}>
                            {apt.status}
                          </div>
                        </div>

                        {/* Action Area */}
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-1.5 text-gray-500 text-[12px] font-semibold">
                            <Video className="w-3.5 h-3.5" />
                            Remote Consult
                          </div>
                          
                          {renderAction(apt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
                <EmptyState 
                  icon={Video}
                  title="No Consultations"
                  description="No video consultations found for this filter."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <VideoDetailModal 
        isOpen={!!selectedConsult}
        onClose={() => setSelectedConsult(null)}
        appointment={selectedConsult}
      />
    </div>
  )
}
