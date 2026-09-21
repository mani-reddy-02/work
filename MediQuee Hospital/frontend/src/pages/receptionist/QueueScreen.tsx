import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, Mic, CheckCircle2, Search, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueueStateMachine } from '../../services/useQueueStateMachine';
import { receptionistApi } from '../../services/receptionistApi';
import { cn } from "@/lib/utils"

export function QueueScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'>('WAITING');

  const deptQuery = searchParams.get('dept');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(deptQuery || 'all');
  
  // Fetch real departments from the hospital's backend
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    receptionistApi.getDepartments()
      .then(setDepartments)
      .catch(err => console.error('Failed to load departments:', err));
  }, []);

  const { queue, updateStatus, refreshQueue } = useQueueStateMachine(selectedDeptId === 'all' ? undefined : selectedDeptId);

  // Re-fetch queue when department filter changes
  useEffect(() => {
    refreshQueue();
  }, [selectedDeptId]);

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[100px]">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-border shadow-[0_4px_24px_rgba(0,0,0,0.02)] pt-6 pb-2 px-4 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/receptionist')} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">{selectedDeptId === 'all' ? 'All Depts' : departments.find(d => d.id === selectedDeptId)?.name || 'All Depts'} Queue</h1>
            <span className="text-[12px] font-bold text-muted">OP Department</span>
          </div>
        </div>
        {/* Department Tiles */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setSelectedDeptId('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors border",
              selectedDeptId === 'all'
                ? "bg-[#0A1A3D] text-white border-[#0A1A3D]" 
                : "bg-surface text-muted border-border hover:bg-gray-50"
            )}
          >
            All Depts
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors border",
                selectedDeptId === dept.id 
                  ? "bg-[#0A1A3D] text-white border-[#0A1A3D]" 
                  : "bg-surface text-muted border-border hover:bg-gray-50"
              )}
            >
              {dept.name}
            </button>
          ))}
        </div>
        {/* Tabs */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('WAITING')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeTab === 'WAITING' ? "bg-surface text-orange-600 shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Waiting
          </button>
          <button 
            onClick={() => setActiveTab('IN_CONSULTATION')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeTab === 'IN_CONSULTATION' ? "bg-surface text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            In Consult
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeTab === 'COMPLETED' ? "bg-surface text-emerald-600 shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[14px] font-bold text-[#0A1A3D]">
            {queue.filter(q => {
              if (activeTab === 'WAITING') return q.status === 'WAITING' || q.status === 'ARRIVED';
              if (activeTab === 'IN_CONSULTATION') return q.status === 'IN_CONSULTATION' || q.status === 'CALLED';
              if (activeTab === 'COMPLETED') return q.status === 'COMPLETED';
              return false;
            }).length} Patients
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-muted">
              <Search className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-muted">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {(() => {
            const filteredQueue = queue.filter(q => {
              if (activeTab === 'WAITING') return q.status === 'WAITING' || q.status === 'ARRIVED';
              if (activeTab === 'IN_CONSULTATION') return q.status === 'IN_CONSULTATION' || q.status === 'CALLED';
              if (activeTab === 'COMPLETED') return q.status === 'COMPLETED';
              return false;
            });
            return filteredQueue.length > 0 ? filteredQueue.map((item, i) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface rounded-[20px] border border-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden"
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
                  <p className="text-[13px] font-medium text-muted mt-0.5">{item.doctorName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted/70" />
                      <span className="text-[12px] text-muted font-bold">
                        {item.slotTime || item.timeSlot ? `Slot: ${item.slotTime || item.timeSlot}` : `Arr: ${item.arrivalTime}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {activeTab === 'WAITING' && (
                <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2 border-t border-border">
                  <button 
                    onClick={() => updateStatus(item.id, 'IN_CONSULTATION')}
                    className="flex-1 bg-surface border border-border text-foreground/80 px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
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
                <CheckCircle2 className="w-8 h-8 text-muted/70" />
              </div>
              <h3 className="text-[16px] font-bold text-[#0A1A3D]">Queue is empty</h3>
              <p className="text-muted text-[13px] font-medium mt-1">No patients in this queue status.</p>
            </motion.div>
          );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
