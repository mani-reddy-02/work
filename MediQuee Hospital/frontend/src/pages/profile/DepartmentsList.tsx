import { ArrowLeft, Plus, LayoutGrid, Loader2, Edit, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { EmptyState } from "@/components/ui/EmptyState"
import { useState, useEffect } from "react"
import { adminApi } from "@/services/adminApi"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { usePermissions } from "@/hooks/usePermissions"
import { useTranslation } from "react-i18next"

export function DepartmentsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const data = await adminApi.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast('Failed to load departments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    try {
      await adminApi.deleteDepartment(departmentToDelete);
      toast('Department deleted', 'success');
      setDepartmentToDelete(null);
      fetchDepartments();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to delete department', 'error');
      setDepartmentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-surface pt-4 pb-3 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('departments_list')}</h1>
        </div>
        {hasPermission('departments.create') && (
          <button onClick={() => navigate('/add-department')} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            {departments.length === 0 ? (
              <EmptyState
                icon={LayoutGrid}
                title="No Departments"
                description="Departments will appear here once available."
              />
            ) : departments.map((dept) => (
              <div key={dept.id} className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{dept.name}</span>
                    <span className="text-xs text-muted">Code: {dept.code || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasPermission('departments.update') && (
                    <button onClick={() => navigate(`/edit-department/${dept.id}`)} className="p-2 text-muted/70 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission('departments.delete') && (
                    <button onClick={() => setDepartmentToDelete(dept.id)} className="p-2 text-muted/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <ConfirmationSheet
        isOpen={!!departmentToDelete}
        onClose={() => setDepartmentToDelete(null)}
        title="Delete Department"
        description="Are you sure you want to delete this department? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
      />
    </div>
  )
}
