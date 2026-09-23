import { 
  FlaskConical, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { adminApi } from "@/services/adminApi"
import { labApi } from "@/services/labApi"
import { cn } from "@/lib/utils"

const labSchema = z.object({
  platformDepartmentId: z.string().min(1, "Please select a laboratory department"),
  labLicenseNumber: z.string().min(3, "Lab License Number is required (min 3 characters)"),
  labLicenseDocumentUrl: z.string().min(1, "Lab License Document is required"),
  licenseValidUntil: z.string().optional().nullable(),
  email: z.string().email("Valid email address required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Contact Number must be at least 10 digits"),
});

type LabFormValues = z.infer<typeof labSchema>;

interface UploadedFileInfo {
  name: string;
  size: number;
  url: string;
}

export function AddLab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [platformDepartments, setPlatformDepartments] = useState<any[]>([]);
  
  // Certificate upload states
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [uploadedCert, setUploadedCert] = useState<UploadedFileInfo | null>(null);
  const [certUploadError, setCertUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi.getPlatformLabDepartments().then(setPlatformDepartments).catch(console.error);
  }, []);

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      platformDepartmentId: "",
      labLicenseNumber: "",
      labLicenseDocumentUrl: "",
      licenseValidUntil: "",
      email: "",
      password: "",
      phone: "8331045500",
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCertUploadError("File size must be 10 MB or less.");
      toast("File size must be 10 MB or less.", "error");
      return;
    }

    // Validate extension
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
    if (!isValidExt) {
      setCertUploadError("Only PDF, JPG, or PNG files are supported.");
      toast("Only PDF, JPG, or PNG files are supported.", "error");
      return;
    }

    setCertUploadError(null);
    setIsUploadingCert(true);

    try {
      const uploadRes = await labApi.uploadLicenseCertificate(file);
      setUploadedCert({
        name: file.name,
        size: file.size,
        url: uploadRes.fileUrl,
      });
      setValue("labLicenseDocumentUrl", uploadRes.fileUrl, { shouldValidate: true, shouldDirty: true });
      toast("License certificate uploaded successfully", "success");
    } catch (err: any) {
      const msg = err?.message || "Failed to upload license certificate";
      setCertUploadError(msg);
      toast(msg, "error");
    } finally {
      setIsUploadingCert(false);
      // Reset input value so same file can be reselected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveCert = () => {
    setUploadedCert(null);
    setValue("labLicenseDocumentUrl", "", { shouldValidate: true, shouldDirty: true });
    setCertUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onSubmit = async (data: LabFormValues) => {
    setIsSubmitting(true);
    try {
      await labApi.createHospitalLab({
        platformDepartmentId: data.platformDepartmentId,
        labLicenseNumber: data.labLicenseNumber,
        labLicenseDocumentUrl: data.labLicenseDocumentUrl,
        licenseValidUntil: data.licenseValidUntil || null,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });

      toast("Laboratory department registered successfully!", "success");
      navigate(-1);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to add laboratory', "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button 
          type="button"
          onClick={handleBack} 
          className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold text-[#172033]">Add Laboratory</h1>
          <p className="text-[12px] text-[#667085]">Setup in-house diagnostic department & licensing</p>
        </div>
      </div>

      <div className="flex flex-col px-4 pt-6 pb-28 overflow-y-auto w-full max-w-lg mx-auto">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm mx-auto">
          <FlaskConical className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-6">
          
          {/* Section 1: Department Selection */}
          <div className="bg-surface border border-border/70 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
            <h2 className="text-[14px] font-bold text-[#172033] flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Department Specification
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#172033]">
                Laboratory Department <span className="text-destructive">*</span>
              </label>
              <select
                {...register("platformDepartmentId")}
                className={cn(
                  "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] shadow-sm appearance-none",
                  errors.platformDepartmentId 
                    ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                    : 'border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20'
                )}
              >
                <option value="">Select Platform Laboratory</option>
                {platformDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
              {errors.platformDepartmentId && (
                <span className="text-destructive text-[12px] font-medium mt-0.5">
                  {errors.platformDepartmentId.message}
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Diagnostic License & Regulatory Compliance (MANDATORY) */}
          <div className="bg-surface border border-border/70 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-[14px] font-bold text-[#172033]">
                  Diagnostic License & Regulatory Compliance
                </h2>
              </div>
              <span className="bg-blue-50 text-primary text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md">
                Required
              </span>
            </div>
            
            <p className="text-[12px] text-[#667085] leading-relaxed -mt-2">
              Mandatory clinical laboratory registration as mandated by state healthcare authority (e.g., Clinical Establishments Act).
            </p>

            {/* License Number Input */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-[13px] font-semibold text-[#172033]">
                Lab License / Registration No. <span className="text-destructive">*</span>
              </label>
              <input 
                {...register("labLicenseNumber")}
                type="text" 
                placeholder="e.g. CEA/LAB/2026/4821" 
                className={cn(
                  "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                  errors.labLicenseNumber 
                    ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                    : 'border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20'
                )}
              />
              {errors.labLicenseNumber && (
                <span className="text-destructive text-[12px] font-medium mt-0.5">
                  {errors.labLicenseNumber.message}
                </span>
              )}
            </div>

            {/* License Valid Until Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#172033]">
                License Valid Until <span className="text-[#98A2B3] text-[11px] font-normal">(Optional)</span>
              </label>
              <input 
                {...register("licenseValidUntil")}
                type="date" 
                className="px-4 py-3 bg-white border border-border/70 rounded-xl outline-none transition-all text-[15px] shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* License Certificate Document Upload Card */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#172033]">
                  License / Registration Certificate Document <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-[#667085]">PDF, JPG, PNG (Max 10MB)</span>
              </div>

              {/* Hidden File Input */}
              <input 
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="lab-certificate-file-input"
              />

              {/* State 1: Uploading State */}
              {isUploadingCert && (
                <div className="w-full py-8 border-2 border-dashed border-primary/40 bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div className="text-center">
                    <p className="text-[13px] font-bold text-[#172033]">Uploading document...</p>
                    <p className="text-[11px] text-[#667085]">Encrypting & storing compliance certificate</p>
                  </div>
                </div>
              )}

              {/* State 2: Uploaded File Display */}
              {!isUploadingCert && uploadedCert && (
                <div className="w-full border-2 border-emerald-500/40 bg-emerald-500/5 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#172033] truncate max-w-[190px] sm:max-w-xs">
                          {uploadedCert.name}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      </div>
                      <span className="text-[11px] text-[#667085]">
                        {formatFileSize(uploadedCert.size)} • Certificate Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors text-[12px] font-semibold flex items-center gap-1"
                      title="Replace file"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCert}
                      className="p-2 text-destructive hover:bg-red-50 rounded-lg transition-colors text-[12px] font-semibold flex items-center gap-1"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              )}

              {/* State 3: Empty State (Call-to-Action to Upload) */}
              {!isUploadingCert && !uploadedCert && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all hover:bg-gray-50/80 group",
                    errors.labLicenseDocumentUrl || certUploadError
                      ? "border-destructive/60 bg-red-50/20" 
                      : "border-border/80 bg-gray-50/40 hover:border-primary"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[13px] font-bold text-[#172033]">
                      Click to upload lab license certificate
                    </p>
                    <p className="text-[11px] text-[#667085] mt-0.5">
                      Upload PDF or scanned copy of official accreditation certificate
                    </p>
                  </div>
                  <span className="mt-1 px-3 py-1 bg-white border border-border/80 rounded-lg text-[11px] font-bold text-primary shadow-xs group-hover:bg-primary group-hover:text-white transition-colors">
                    Browse File
                  </span>
                </div>
              )}

              {/* Error messages */}
              {certUploadError && (
                <div className="flex items-center gap-1.5 text-destructive text-[12px] font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{certUploadError}</span>
                </div>
              )}
              {errors.labLicenseDocumentUrl && !certUploadError && (
                <div className="flex items-center gap-1.5 text-destructive text-[12px] font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.labLicenseDocumentUrl.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Laboratory Administrator Staff Credentials */}
          <div className="bg-surface border border-border/70 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
            <h2 className="text-[14px] font-bold text-[#172033]">
              Laboratory Administrator Credentials
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#172033]">Email Address <span className="text-destructive">*</span></label>
              <input 
                {...register("email")}
                type="email" 
                placeholder="e.g. lab@hospital.com" 
                className={cn(
                  "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                  errors.email ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20'
                )}
              />
              {errors.email && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#172033]">Password <span className="text-destructive">*</span></label>
              <input 
                {...register("password")}
                type="text" 
                placeholder="Create a secure password" 
                className={cn(
                  "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                  errors.password ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20'
                )}
              />
              {errors.password && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.password.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#172033]">Contact Number <span className="text-destructive">*</span></label>
              <input 
                {...register("phone")}
                type="tel" 
                placeholder="e.g. 8331045500" 
                className={cn(
                  "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                  errors.phone ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20'
                )}
              />
              {errors.phone && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.phone.message}</span>}
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/50 pb-safe z-20 shadow-lg">
            <div className="flex gap-3 max-w-lg mx-auto">
              <button 
                type="button" 
                onClick={handleBack}
                className="flex-1 bg-surface hover:bg-gray-50 border border-border/60 text-[#172033] font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || isUploadingCert}
                className="flex-[2] bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Laboratory'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationSheet 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Discard changes?"
        description="Your entered lab details and license certificate will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        isDestructive={true}
        onConfirm={() => navigate(-1)}
      />
    </div>
  );
}
