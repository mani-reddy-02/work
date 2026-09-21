import { ArrowLeft, Plus, Users, Mail, Phone, Briefcase, Calendar, CheckCircle2 } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { EmptyState } from "@/components/ui/EmptyState"
import { BottomSheet } from "@/components/ui/BottomSheet"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { useToast } from "@/context/ToastContext"

import { useState, useEffect } from "react"
import { adminApi } from "@/services/adminApi"
import { usePermissions } from "@/hooks/usePermissions"

export function StaffList() {
  const navigate = useNavigate();
  const { type } = useParams(); // 'doctors', 'nurses', 'receptionists', 'labs'
  const { hasPermission } = usePermissions();

  const title = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Staff List";
  
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);
  const { toast } = useToast();

  const fetchStaff = async () => {
    try {
      const allStaff = await adminApi.getStaff();
      const filtered = allStaff.filter((member: any) => {
        if (!member.active) return false;
        if (type === 'doctors') return member.role === 'DOCTOR';
        if (type === 'nurses') return member.role === 'NURSE';
        if (type === 'receptionists') return member.role === 'RECEPTIONIST';
        if (type === 'labs') return member.role === 'LAB_ADMIN';
        return true;
      });
      setStaff(filtered);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [type]);

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      await adminApi.deactivateStaff(staffToDelete.id);
      toast('Staff deleted successfully', 'success');
      setStaffToDelete(null);
      setIsProfileOpen(false);
      fetchStaff();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to delete staff', 'error');
    }
  };

  const handleAddClick = () => {
    if (type === 'doctors') navigate("/add-doctor");
    else if (type === 'nurses') navigate("/add-nurse");
    else if (type === 'receptionists') navigate("/add-receptionist");
    else if (type === 'labs') navigate("/profile/staff/add-lab"); // defined explicitly in App.tsx
  };

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-surface pt-4 pb-3 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>
        {hasPermission('staff.create') && (
          <button onClick={handleAddClick} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-10"><span className="text-muted/70">Loading staff...</span></div>
          ) : staff.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Staff"
              description="Staff members will appear here once available."
            />
          ) : staff.map((member) => (
            <div 
              key={member.id} 
              onClick={() => { setSelectedStaff(member); setIsProfileOpen(true); }}
              className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center gap-4 cursor-pointer interactive-element"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                {member.avatar
                  ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  : <Users className="w-5 h-5 text-muted/70" />
                }
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-foreground">{member.name}</span>
                <span className="text-xs text-muted">{member.department?.name || member.designation}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <BottomSheet isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}>
        {selectedStaff && (
          <div className="flex flex-col gap-6 pt-2">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                {selectedStaff.avatar
                  ? <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
                  : <Users className="w-10 h-10 text-primary" />
                }
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-bold text-foreground">{selectedStaff.name}</h2>
                <span className="text-sm text-primary font-medium">{selectedStaff.department?.name || selectedStaff.designation || selectedStaff.role}</span>
                {selectedStaff.active && (
                  <div className="flex items-center gap-1 mt-2 text-success text-[12px] font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-background rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-sm">
                    <Mail className="w-4 h-4 text-muted" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted font-medium">Email</span>
                    <span className="font-semibold text-foreground truncate">{selectedStaff.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-muted" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted font-medium">Mobile</span>
                    <span className="font-semibold text-foreground">{selectedStaff.phone}</span>
                  </div>
                </div>

                {selectedStaff.department && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-sm">
                      <Briefcase className="w-4 h-4 text-muted" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted font-medium">Department</span>
                      <span className="font-semibold text-foreground">{selectedStaff.department.name}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-sm">
                    <Calendar className="w-4 h-4 text-muted" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted font-medium">Joined On</span>
                    <span className="font-semibold text-foreground">
                      {new Date(selectedStaff.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {hasPermission('staff.update') && (
                <button 
                  onClick={() => navigate(`/edit-staff/${selectedStaff.id}`)}
                  className="flex-1 bg-surface border border-border text-foreground font-semibold py-3 rounded-xl hover:bg-background transition-colors shadow-sm"
                >
                  Edit Profile
                </button>
              )}
              {hasPermission('staff.delete') && (
                <button 
                  onClick={() => setStaffToDelete(selectedStaff)}
                  className="flex-1 bg-red-50 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                >
                  Delete Profile
                </button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
      <ConfirmationSheet
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        title="Delete Staff Member"
        description={`Are you sure you want to delete ${staffToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Accept to Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
      />
    </div>
  )
}
