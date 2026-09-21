import { Search, Filter, Phone, Calendar, User, Users, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback, useMemo } from "react"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { useAuth } from "@/context/AuthContext"
import { doctorApi } from "@/services/doctorApi"
import { adminApi } from "@/services/adminApi"
import { useTranslation } from "react-i18next"

interface PatientItem {
  id: string;
  displayId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  lastVisit: string;
  lastCondition: string;
}

export function Patients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      let rawAppts: any[] = [];
      if (role === 'doctor') {
        rawAppts = await doctorApi.getMyAppointments();
      } else {
        rawAppts = await adminApi.getBookings({ range: 'all' });
      }

      // Group by patient phone or patient name
      const patientMap = new Map<string, PatientItem>();

      for (const appt of rawAppts) {
        const name = appt.patientName || appt.name || 'Patient';
        const phone = appt.patientPhone || '';
        const key = phone ? `${phone}` : `${name.toLowerCase()}`;

        const apptDateStr = appt.date || appt.appointmentDate || '';
        const formattedDate = apptDateStr
          ? new Date(apptDateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Recent';

        if (!patientMap.has(key)) {
          patientMap.set(key, {
            id: appt.id || appt.appointmentId,
            displayId: (appt.id || appt.appointmentId || '').substring(0, 8).toUpperCase(),
            name,
            age: appt.patientAge ? `${appt.patientAge} yrs` : (appt.age ? `${appt.age} yrs` : '--'),
            gender: appt.patientGender || appt.gender || 'Unknown',
            phone: phone || 'No phone',
            lastVisit: formattedDate,
            lastCondition: appt.diseaseName || appt.opType || 'OP Consultation'
          });
        }
      }

      setPatients(Array.from(patientMap.values()));
    } catch (err) {
      console.error("Failed to load patients list:", err);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      p.displayId.toLowerCase().includes(q) ||
      p.lastCondition.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24 transition-colors">
      {/* Search and Header */}
      <div className="px-4 pt-3 pb-3 bg-surface sticky top-0 z-30 border-b border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-black text-foreground tracking-tight">{t('patients')}</h1>
            <span className="bg-[#EBF5FF] text-[#1B5DF1] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filteredPatients.length}
            </span>
          </div>
          <button 
            onClick={loadPatients}
            disabled={isLoading}
            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-muted hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title={t('refresh', 'Refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1B5DF1]' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder', 'Search by patient name, phone, or ID...')} 
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-xs font-medium text-foreground placeholder:text-muted"
            />
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="px-4 py-4 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 bg-surface rounded-2xl border border-border flex gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="w-32 h-5 rounded-md" />
                  <Skeleton className="w-24 h-4 rounded-md" />
                  <Skeleton className="w-40 h-3 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Patients Found"
            description={searchQuery ? "No patients matching your search criteria." : "Patients with booked appointments will appear here."}
          />
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {filteredPatients.map((patient) => (
              <motion.div 
                key={patient.id}
                variants={item}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="p-4 bg-surface border border-border rounded-[20px] shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF5FF] text-[#1B5DF1] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-black text-base">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="font-bold text-foreground text-[15px] truncate group-hover:text-primary transition-colors">
                        {patient.name}
                      </h3>
                      <span className="text-[10px] font-bold text-muted bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md shrink-0">
                        ID: #{patient.displayId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted mb-2">
                      <span>{patient.age}</span>
                      <span className="w-1 h-1 rounded-full bg-muted/40" />
                      <span>{patient.gender}</span>
                      <span className="w-1 h-1 rounded-full bg-muted/40" />
                      <span className="text-primary font-semibold truncate max-w-[140px]">{patient.lastCondition}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-2.5 border-t border-border text-[11px] text-muted">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        <span>{patient.lastVisit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
