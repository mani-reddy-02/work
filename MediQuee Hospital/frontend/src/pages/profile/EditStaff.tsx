import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Camera, Loader2, Save, FileText, CheckCircle2, UploadCloud, Eye, ExternalLink, X, RefreshCw, Trash2, ShieldCheck } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { adminApi } from "@/services/adminApi"
import { cn } from "@/lib/utils"

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  licenseNumber: z.string().optional(),
  experienceYears: z.string().optional(),
  consultationFee: z.string().optional(),
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
  const [staffRole, setStaffRole] = useState<string>('');

  // Doctor License Document State
  const [uploadedCertUrl, setUploadedCertUrl] = useState<string | null>(null);
  const [uploadedCertName, setUploadedCertName] = useState<string | null>(null);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certUploadError, setCertUploadError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setStaffRole(staff.role || '');
          reset({
            name: staff.name,
            phone: staff.phone || '',
            designation: staff.designation || '',
            departmentId: staff.department?.id || '',
            licenseNumber: staff.licenseNumber || '',
            experienceYears: staff.experienceYears ? String(staff.experienceYears) : '',
            consultationFee: staff.consultationFee ? String(staff.consultationFee) : '',
          });

          if (staff.avatar) {
            setPhotoPreview(staff.avatar);
          }

          if (staff.licenseDocumentUrl) {
            setUploadedCertUrl(staff.licenseDocumentUrl);
            const guessedName = staff.licenseDocumentUrl.split('/').pop() || 'doctor_license_certificate.pdf';
            setUploadedCertName(guessedName);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCertUploadError("Certificate file size must be less than 10 MB");
      toast("File size too large (max 10 MB)", "error");
      return;
    }

    // Validate extension
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g)$/i)) {
      setCertUploadError("Please upload a PDF, PNG, or JPG certificate");
      toast("Unsupported format (PDF, PNG, JPG only)", "error");
      return;
    }

    setCertUploadError(null);
    setIsUploadingCert(true);
    try {
      const res = await adminApi.uploadDoctorLicense(file);
      setUploadedCertUrl(res.fileUrl);
      setUploadedCertName(res.fileName || file.name);
      toast("License certificate uploaded and stored in Supabase!", "success");
    } catch (err: any) {
      setCertUploadError(err.message || "Failed to upload certificate document");
      toast(err.message || "Upload failed", "error");
    } finally {
      setIsUploadingCert(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveCert = () => {
    setUploadedCertUrl(null);
    setUploadedCertName(null);
    setCertUploadError(null);
  };

  const onSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        phone: data.phone || null,
        designation: data.designation || null,
      };
      
      if (data.departmentId !== undefined) {
        payload.departmentId = data.departmentId || null;
      }
      if (photoPreview) {
        payload.avatar = photoPreview;
      }

      // If doctor or license fields present, persist license info
      if (staffRole === 'DOCTOR' || data.licenseNumber || uploadedCertUrl) {
        payload.licenseNumber = data.licenseNumber?.trim() || null;
        payload.licenseDocumentUrl = uploadedCertUrl || null;
      }

      if (data.experienceYears !== undefined && data.experienceYears !== '') {
        payload.experienceYears = Number(data.experienceYears);
      }
      if (data.consultationFee !== undefined && data.consultationFee !== '') {
        payload.consultationFee = Number(data.consultationFee);
      }

      await adminApi.updateStaff(id!, payload);
      toast('Profile updated successfully', 'success');
      navigate(-1);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update profile', "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDoctor = staffRole === 'DOCTOR';

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#172033]">Edit Staff Profile</h1>
          <p className="text-xs text-muted">
            {isDoctor ? 'Doctor Profile & License' : 'Staff Profile Information'}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Photo Avatar Upload */}
        <div className="flex flex-col items-center gap-3 mt-2 mb-2 relative">
          <input 
            type="file" 
            accept="image/*" 
            id="photo-upload" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setPhotoPreview(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} 
          />
          <label 
            htmlFor="photo-upload" 
            className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-md overflow-hidden relative group cursor-pointer hover:bg-blue-100 transition-colors"
          >
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Section: Basic Profile Information */}
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-5 flex flex-col gap-4">
            <h3 className="font-bold text-[#0A1A3D] border-b border-border pb-2 text-sm">Profile Information</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80">Full Name</label>
              <input 
                {...register("name")}
                type="text" 
                placeholder="Full name" 
                className={cn("bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all", errors.name && "border-red-500")}
              />
              {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80">Phone Number</label>
              <input 
                {...register("phone")}
                type="tel" 
                placeholder="Phone number" 
                className={cn("bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all", errors.phone && "border-red-500")}
              />
              {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80">Designation / Qualification</label>
              <input 
                {...register("designation")}
                type="text" 
                placeholder="e.g. Senior Consultant, MBBS, MD" 
                className={cn("bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80">Department</label>
              <select 
                {...register("departmentId")}
                className={cn("bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all")}
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {isDoctor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Experience (Years)</label>
                  <input 
                    {...register("experienceYears")}
                    type="number" 
                    placeholder="e.g. 8" 
                    className={cn("bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Consultation Fee (₹)</label>
                  <input 
                    {...register("consultationFee")}
                    type="number" 
                    placeholder="e.g. 500" 
                    className={cn("bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Medical License & Verification (For Doctors or Medical Staff) */}
          {(isDoctor || uploadedCertUrl) && (
            <div className="bg-surface rounded-2xl border border-border shadow-xs p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-[#0A1A3D] text-sm">Medical License & Verification</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {uploadedCertUrl ? 'Certificate Attached' : 'Not Uploaded Yet'}
                </span>
              </div>

              {/* License Number Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  License / Registration Number
                </label>
                <input 
                  {...register("licenseNumber")}
                  type="text" 
                  placeholder="e.g. MD12345 or TSMC/2026/9821" 
                  className={cn("bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all")}
                />
              </div>

              {/* License Document Certificate Uploader / Viewer */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/80">
                    License Certificate Document
                  </label>
                  {uploadedCertUrl && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Stored in Supabase
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadedCertUrl ? (
                  /* Attached Certificate Preview Card */
                  <div className="border border-border/80 bg-background rounded-xl p-3.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">
                            {uploadedCertName || 'Medical License Certificate'}
                          </span>
                          <span className="text-[10px] text-muted">
                            Verified official certificate on file
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(uploadedCertUrl)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <a
                          href={uploadedCertUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="p-1.5 text-muted hover:text-foreground bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Download document"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <button
                        type="button"
                        disabled={isUploadingCert}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Change / Upload New Document</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCert}
                        className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty Uploader Dropzone */
                  <div
                    onClick={() => !isUploadingCert && fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-background/50 hover:bg-blue-50/30 group",
                      certUploadError ? "border-red-300 bg-red-50/20" : "border-border hover:border-primary/60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-primary mb-2 transition-colors">
                      {isUploadingCert ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {isUploadingCert ? 'Uploading & Storing to Supabase...' : 'Click to Upload Medical License Document'}
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">
                      PDF, PNG, JPG up to 10 MB. Visible to Hospitals & Super Admin.
                    </span>
                  </div>
                )}

                {certUploadError && (
                  <span className="text-xs text-red-500 mt-1">{certUploadError}</span>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isSubmitting || isUploadingCert}
            className="text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-md bg-primary hover:bg-blue-700 active:scale-98 disabled:opacity-70 mt-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Certificate In-App Preview Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Medical License Certificate</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 text-muted hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-h-[320px]">
              {previewModalUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewModalUrl}
                  className="w-full h-[500px] rounded-lg border border-border"
                  title="Medical License Certificate PDF"
                />
              ) : (
                <img
                  src={previewModalUrl}
                  alt="Medical License Certificate"
                  className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
            <div className="p-3 border-t border-border flex justify-end gap-2 bg-surface">
              <a
                href={previewModalUrl}
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
                onClick={() => setPreviewModalUrl(null)}
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
