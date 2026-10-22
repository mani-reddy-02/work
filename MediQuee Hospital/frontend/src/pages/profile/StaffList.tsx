import { ArrowLeft, Plus, Users, Mail, Phone, Briefcase, Calendar, CheckCircle2, Clock, Power, ShieldCheck, FileText, ExternalLink, Eye, X, Search, PowerOff, UserX } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { EmptyState } from "@/components/ui/EmptyState"
import { BottomSheet } from "@/components/ui/BottomSheet"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { useToast } from "@/context/ToastContext"

import { useState, useEffect, useMemo } from "react"
import { adminApi } from "@/services/adminApi"
import { receptionistApi } from "@/services/receptionistApi"
import { usePermissions } from "@/hooks/usePermissions"

export function StaffList() {
  const navigate = useNavigate();
  const { type } = useParams(); // 'doctors', 'nurses', 'receptionists', 'labs'
  const { hasPermission } = usePermissions();

  const title = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Staff List";
  
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStaff();
      const filtered = res.filter((member: any) => {
        if (type === 'doctors') return member.role === 'DOCTOR';
        if (type === 'nurses') return member.role === 'NURSE';
        if (type === 'receptionists') return member.role === 'RECEPTIONIST';
        if (type === 'labs') return member.role === 'LAB_ADMIN';
        return true;
      });
      setAllStaff(filtered);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      toast('Failed to load staff members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [type]);

  // Counts for tabs
  const counts = useMemo(() => {
    const active = allStaff.filter(m => m.active).length;
    const inactive = allStaff.filter(m => !m.active).length;
    return { all: allStaff.length, active, inactive };
  }, [allStaff]);

  // Filtered staff based on status tab and search query
  const displayedStaff = useMemo(() => {
    return allStaff.filter(member => {
      // Status filter
      if (statusFilter === 'active' && !member.active) return false;
      if (statusFilter === 'inactive' && member.active) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = member.name?.toLowerCase().includes(q);
        const emailMatch = member.email?.toLowerCase().includes(q);
        const phoneMatch = member.phone?.toLowerCase().includes(q);
        const deptMatch = member.department?.name?.toLowerCase().includes(q);
        const desigMatch = member.designation?.toLowerCase().includes(q);
        const specMatch = member.specialization?.toLowerCase().includes(q);
        const licenseMatch = member.licenseNumber?.toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || deptMatch || desigMatch || specMatch || licenseMatch;
      }
      return true;
    });
  }, [allStaff, statusFilter, searchQuery]);

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      await adminApi.deactivateStaff(staffToDelete.id);
      toast('Staff deactivated successfully', 'success');
      setStaffToDelete(null);
      setIsProfileOpen(false);
      fetchStaff();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to deactivate staff', 'error');
    }
  };

  const handleActivate = async (memberId: string) => {
    setIsActivating(true);
    try {
      await adminApi.updateStaff(memberId, { active: true });
      toast('Staff member activated successfully', 'success');
      if (selectedStaff && selectedStaff.id === memberId) {
        setSelectedStaff({ ...selectedStaff, active: true });
      }
      setIsProfileOpen(false);
      fetchStaff();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to activate staff', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleAddClick = () => {
    if (type === 'doctors') navigate("/add-doctor");
    else if (type === 'nurses') navigate("/add-nurse");
    else if (type === 'receptionists') navigate("/add-receptionist");
    else if (type === 'labs') navigate("/profile/staff/add-lab");
  };

  return (
    <div className="flex flex-col bg-background min-h-screen pb-36">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md pt-4 pb-3 px-4 border-b border-border shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">{title}</h1>
              <p className="text-xs text-muted">
                {loading ? 'Loading...' : `${allStaff.length} registered ${type || 'staff'}`}
              </p>
            </div>
          </div>
          {hasPermission('staff.create') && (
            <button 
              onClick={handleAddClick} 
              className="h-9 px-3.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add {type === 'doctors' ? 'Doctor' : type === 'nurses' ? 'Nurse' : 'Staff'}</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${type || 'staff'} by name, department, phone...`}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-foreground rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-background border border-border text-muted hover:text-foreground'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-background border border-border text-muted hover:text-foreground'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'inactive'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-background border border-border text-muted hover:text-foreground'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Inactive ({counts.inactive})
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted">Loading staff members...</span>
          </div>
        ) : displayedStaff.length === 0 ? (
          searchQuery ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <Search className="w-10 h-10 text-muted/40 mb-2" />
              <p className="font-semibold text-foreground text-sm">No matching {type || 'staff'} found</p>
              <p className="text-xs text-muted mt-1">Try refining or clearing your search query.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={`No ${statusFilter === 'all' ? '' : statusFilter} ${type || 'staff'}`}
              description={
                statusFilter === 'inactive'
                  ? 'There are currently no inactive staff members.'
                  : `Registered ${type || 'staff'} will appear here once added.`
              }
            />
          )
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            {displayedStaff.map((member) => {
              const isPaused = member.role === 'DOCTOR' && member.inactiveUntil && new Date(member.inactiveUntil) > new Date();

              return (
                <div 
                  key={member.id} 
                  onClick={() => { setSelectedStaff(member); setIsProfileOpen(true); }}
                  className={`bg-surface p-4 rounded-xl border transition-all shadow-xs flex items-center gap-4 cursor-pointer interactive-element active:scale-[0.99] ${
                    member.active 
                      ? 'border-border hover:border-primary/40 hover:shadow-sm' 
                      : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 opacity-85'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-border">
                    {member.avatar
                      ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      : <Users className="w-5 h-5 text-muted/70" />
                    }
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm truncate">{member.name}</span>
                      
                      {/* Status Badges */}
                      {member.active ? (
                        isPaused ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                            PAUSED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            ACTIVE
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0">
                          INACTIVE
                        </span>
                      )}

                      {/* License Indicator */}
                      {member.licenseDocumentUrl && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                          License Verified
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted truncate">
                      <span>{member.department?.name || member.specialization || member.designation || 'General Staff'}</span>
                      {member.phone && (
                        <>
                          <span>•</span>
                          <span className="truncate">{member.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Staff Profile Bottom Sheet */}
      <BottomSheet isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}>
        {selectedStaff && (
          <div className="flex flex-col gap-6 pt-2 pb-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                {selectedStaff.avatar
                  ? <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
                  : <Users className="w-10 h-10 text-primary" />
                }
              </div>
              <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-bold text-foreground">{selectedStaff.name}</h2>
                <span className="text-sm text-primary font-medium">
                  {selectedStaff.department?.name || selectedStaff.specialization || selectedStaff.designation || selectedStaff.role}
                </span>

                {/* Account Status Badge */}
                {selectedStaff.role === 'DOCTOR' && selectedStaff.inactiveUntil && new Date(selectedStaff.inactiveUntil) > new Date() ? (
                  <div className="flex flex-col items-center gap-1.5 mt-2">
                    <div className="flex items-center gap-1 text-amber-800 text-[12px] font-semibold bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Temporarily Inactive (until {new Date(selectedStaff.inactiveUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </div>
                    {selectedStaff.inactiveReason && (
                      <span className="text-xs text-amber-900 italic font-medium">"{selectedStaff.inactiveReason}"</span>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          await receptionistApi.updateDoctorActiveStatus(selectedStaff.id, { active: true });
                          toast("Doctor reactivated immediately!", "success");
                          fetchStaff();
                          setIsProfileOpen(false);
                        } catch (err: any) {
                          toast(err.message || "Failed to reactivate doctor", "error");
                        }
                      }}
                      className="mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Power className="w-3.5 h-3.5" />
                      Activate Doctor Now
                    </button>
                  </div>
                ) : selectedStaff.active ? (
                  <div className="flex items-center gap-1 mt-2 text-emerald-700 text-[12px] font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Active Staff
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-2 text-slate-700 text-[12px] font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                    <PowerOff className="w-3.5 h-3.5 text-slate-500" />
                    Inactive / Deactivated
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-background rounded-2xl p-4 flex flex-col gap-3 border border-border">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-xs border border-border">
                    <Mail className="w-4 h-4 text-muted" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted font-medium">Email</span>
                    <span className="font-semibold text-foreground truncate">{selectedStaff.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-xs border border-border">
                    <Phone className="w-4 h-4 text-muted" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted font-medium">Mobile</span>
                    <span className="font-semibold text-foreground">{selectedStaff.phone || 'Not provided'}</span>
                  </div>
                </div>

                {selectedStaff.department && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-xs border border-border">
                      <Briefcase className="w-4 h-4 text-muted" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted font-medium">Department</span>
                      <span className="font-semibold text-foreground">{selectedStaff.department.name}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-xs border border-border">
                    <Calendar className="w-4 h-4 text-muted" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted font-medium">Joined On</span>
                    <span className="font-semibold text-foreground">
                      {new Date(selectedStaff.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Doctor Medical License & Verification */}
                {(selectedStaff.licenseNumber || selectedStaff.licenseDocumentUrl || selectedStaff.role === 'DOCTOR') && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        Medical License & Credentials
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {selectedStaff.licenseDocumentUrl ? 'Verified & Stored' : 'On File'}
                      </span>
                    </div>

                    <div className="bg-surface border border-border/80 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">License Reg No:</span>
                        <span className="font-mono font-bold text-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {selectedStaff.licenseNumber || 'Not provided'}
                        </span>
                      </div>

                      {selectedStaff.licenseDocumentUrl ? (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">
                              License Certificate Document
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDocUrl(selectedStaff.licenseDocumentUrl)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <a
                              href={selectedStaff.licenseDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1 text-muted hover:text-foreground bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Download certificate"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          No certificate document uploaded.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              {hasPermission('staff.update') && (
                <button 
                  onClick={() => navigate(`/edit-staff/${selectedStaff.id}`)}
                  className="flex-1 bg-surface border border-border text-foreground font-semibold py-3 rounded-xl hover:bg-background transition-colors shadow-xs"
                >
                  Edit Profile
                </button>
              )}
              
              {/* If staff is Inactive -> show Activate Button */}
              {!selectedStaff.active ? (
                hasPermission('staff.update') && (
                  <button 
                    disabled={isActivating}
                    onClick={() => handleActivate(selectedStaff.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Power className="w-4 h-4" />
                    <span>{isActivating ? 'Activating...' : 'Activate Staff'}</span>
                  </button>
                )
              ) : (
                /* If staff is Active -> show Deactivate Button */
                hasPermission('staff.delete') && (
                  <button 
                    onClick={() => setStaffToDelete(selectedStaff)}
                    className="flex-1 bg-red-50 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-100 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Deactivate</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Confirmation Sheet for Deactivation */}
      <ConfirmationSheet
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        title="Deactivate Staff Member"
        description={`Are you sure you want to deactivate ${staffToDelete?.name}? They can be reactivated at any time.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
      />

      {/* Doctor License Certificate Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Doctor License Certificate</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 text-muted hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-h-[300px]">
              {previewDocUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDocUrl}
                  className="w-full h-[500px] rounded-lg border border-border"
                  title="Doctor License PDF"
                />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="Doctor License Certificate"
                  className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
            <div className="p-3 border-t border-border flex justify-end gap-2 bg-surface">
              <a
                href={previewDocUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Original
              </a>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#172033] rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
