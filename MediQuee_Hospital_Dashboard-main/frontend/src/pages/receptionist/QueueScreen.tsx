import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, Mic, CheckCircle2, Search, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueueStateMachine } from '../../services/useQueueStateMachine';
import { type QueueStatus } from '../../services/receptionistApi';
import { cn } from "@/lib/utils"

export function QueueScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'>('WAITING');
  
  const deptQuery = searchParams.get('dept');
  const [selectedDept, setSelectedDept] = useState(deptQuery || 'All Depts');
  
  const departments = ['All Depts', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'];

  const { queue, updateStatus } = useQueueStateMachine(selectedDept === 'All Depts' ? undefined : selectedDept);

  // Fake data if queue is empty because API is not returning real data yet
  const displayQueue = queue.length > 0 ? queue : [
    { id: 'q1', token: 'OP-101', patientName: 'Rahul Kumar', doctorName: 'Dr. Sharma', arrivalTime: '10:15 AM', status: 'IN_CONSULTATION' as QueueStatus },
    { id: 'q2', token: 'OP-102', patientName: 'Priya Patel', doctorName: 'Dr. Sharma', arrivalTime: '10:30 AM', status: 'COMPLETED' as QueueStatus },
    { id: 'q3', token: 'OP-103', patientName: 'Amit Singh', doctorName: 'Dr. Iyer', arrivalTime: '10:45 AM', status: 'WAITING' as QueueStatus },
    { id: 'q4', token: 'OP-104', patientName: 'Sneha Reddy', doctorName: 'Dr. Iyer', arrivalTime: '11:00 AM', status: 'WAITING' as QueueStatus },
  ];

  const filteredQueue = displayQueue.filter(q => {
    if (activeTab === 'WAITING') return q.status === 'WAITING' || q.status === 'ARRIVED';
    if (activeTab === 'IN_CONSULTATION') return q.status === 'IN_CONSULTATION' || q.status === 'CALLED';
    if (activeTab === 'COMPLETED') return q.status === 'COMPLETED';
    return false;
  });

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[100px]">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] pt-6 pb-2 px-4 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/receptionist')} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">{selectedDept} Queue</h1>
            <span className="text-[12px] font-bold text-gray-500">OP Department</span>
          </div>
        </div>
        {/* Department Tiles */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors border",
                selectedDept === dept 
                  ? "bg-[#0A1A3D] text-white border-[#0A1A3D]" 
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              )}
            >
              {dept}
            </button>
          ))}
        </div>
        {/* Tabs */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('WAITING')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeTab === 'WAITING' ? "bg-white text-orange-600 shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Waiting
          </button>
          <button 
            onClick={() => setActiveTab('IN_CONSULTATION')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeTab === 'IN_CONSULTATION' ? "bg-white text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            In Consult
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeTab === 'COMPLETED' ? "bg-white text-emerald-600 shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[14px] font-bold text-[#0A1A3D]">
            {filteredQueue.length} Patients
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
              <Search className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredQueue.length > 0 ? filteredQueue.map((item, i) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[20px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden"
            >
              <div className="p-4 flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-[16px] flex flex-col items-center justify-center shrink-0 border-2",
                  activeTab === 'WAITING' ? "bg-orange-50 border-orange-100 text-orange-600" :
                  activeTab === 'IN_CONSULTATION' ? "bg-[#EBF5FF] border-[#1B5DF1]/20 text-[#1B5DF1]" :
                  "bg-emerald-50 border-emerald-100 text-emerald-600"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Token</span>
                  <span className="font-black text-[20px] tracking-tight leading-none">{item.token.split('-')[1]}</span>
                </div>
                
                <div className="flex flex-col flex-1">
                  <h3 className="font-bold text-[17px] text-[#0A1A3D]">{item.patientName}</h3>
                  <p className="text-[13px] font-medium text-gray-500 mt-0.5">{item.doctorName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[12px] text-gray-500 font-bold">Arr: {item.arrivalTime}</span>
                  </div>
                </div>
              </div>
              
              {activeTab === 'WAITING' && (
                <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2 border-t border-gray-100">
                  <button 
                    onClick={() => updateStatus(item.id, 'IN_CONSULTATION')}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                  >
                    Send to Doctor
                  </button>
                  <button 
                    onClick={() => updateStatus(item.id, 'CALLED')}
                    className="flex-1 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-600/20 hover:bg-orange-700 transition-colors"
                  >
                    <Mic className="w-4 h-4" /> Call Patient
                  </button>
                </div>
              )}
              
              {activeTab === 'IN_CONSULTATION' && (
                <div className="bg-[#EBF5FF]/50 px-4 py-3 flex justify-end gap-2 border-t border-[#1B5DF1]/10">
                  <button 
                    onClick={() => updateStatus(item.id, 'COMPLETED')}
                    className="w-full bg-[#1B5DF1] text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 shadow-sm shadow-[#1B5DF1]/20 hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Completed
                  </button>
                </div>
              )}
            </motion.div>
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-[16px] font-bold text-[#0A1A3D]">Queue is empty</h3>
              <p className="text-gray-500 text-[13px] font-medium mt-1">No patients in this queue status.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
