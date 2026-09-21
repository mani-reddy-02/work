import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { adminApi } from "@/services/adminApi"
import { cn } from "@/lib/utils"

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export function EditStaff() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depts, staffMembers] = await Promise.all([
          adminApi.getDepartments(),
          adminApi.getStaff()
        ]);
        
        setDepartments(depts);
        
        const staff = staffMembers.find((s: any) => s.id === id);
        if (staff) {
          reset({
            name: staff.name,
            phone: staff.phone || '',
            designation: staff.designation || '',
            departmentId: staff.department?.id || '',
          });
          if (staff.avatar) {
            setPhotoPreview(staff.avatar);
          }
        } else {
          toast('Staff member not found', 'error');
          navigate(-1);
        }
      } catch (error) {
        toast('Failed to load data', 'error');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, reset, navigate, toast]);

  const onSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        phone: data.phone,
        designation: data.designation,
      };
      
      if (data.departmentId) {
        payload.departmentId = data.departmentId;
      }
      if (photoPreview) {
        payload.avatar = photoPreview;
      }

      await adminApi.updateStaff(id!, payload);
      toast('Profile updated successfully', 'success');
      navigate(-1);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update profile', "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-8">
      <div className="sticky top-0 z-30 bg-surface pt-4 pb-3 px-4 flex items-center gap-4 border-b border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-[#172033]">Edit Staff Profile</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 mt-2 mb-4 relative">
          <input type="file" accept="image/*" id="photo-upload" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => setPhotoPreview(reader.result as string);
              reader.readAsDataURL(file);
            }
          }} />
          <label htmlFor="photo-upload" className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-md overflow-hidden relative group cursor-pointer hover:bg-blue-100 transition-colors">
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </>
            ) : (
              <Camera className="w-8 h-8 text-primary" strokeWidth={1.5} />
            )}
          </label>
          <label htmlFor="photo-upload" className="text-[13px] font-semibold text-primary cursor-pointer hover:underline">
            {photoPreview ? 'Change Photo' : 'Upload Photo'}
          </label>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-5">
          <h3 className="font-bold text-[#0A1A3D] border-b border-border pb-2">Profile Information</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/80">Full Name</label>
            <input 
              {...register("name")}
              type="text" 
              placeholder="Full name" 
              className={cn("bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/50", errors.name && "border-red-500")}
            />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/80">Phone Number</label>
            <input 
              {...register("phone")}
              type="tel" 
              placeholder="Phone number" 
              className={cn("bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/50", errors.phone && "border-red-500")}
            />
            {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/80">Designation / Qualification</label>
            <input 
              {...register("designation")}
              type="text" 
              placeholder="Designation" 
              className={cn("bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/50", errors.designation && "border-red-500")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/80">Department</label>
            <select 
              {...register("departmentId")}
              className={cn("bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/50", errors.departmentId && "border-red-500")}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors mt-2 shadow-lg bg-primary hover:bg-blue-700 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
