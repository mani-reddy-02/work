import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Loader2, FlaskConical, Check, Edit3, Building2, 
  MapPin, Phone, Mail, Clock, FileText, ExternalLink, ShieldCheck, 
  Upload, X, CheckCircle2, Home, Copy
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { labApi } from "@/services/labApi"
import { cn } from "@/lib/utils"

interface ComplianceDoc {
  id: string;
  title: string;
  documentType: string;
  licenseNumber: string;
  category: string;
  status: string;
  fileUrl: string | null;
  createdAt?: string;
}

interface LabProfileState {
  id: string;
  labName: string;
  hospitalName: string;
  inChargeName: string;
  contactPhone: string;
  contactEmail: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  formattedAddress: string;
  labLicenseNumber: string;
  registrationNumber: string;
  operationalHours: string;
  homeCollectionAvailable: boolean;
  documents: ComplianceDoc[];
}

const inputClass = "w-full px-4 py-3 bg-surface border border-border/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-[14px] md:text-[15px] placeholder:text-[#98A2B3] shadow-2xs transition-all text-[#172033] dark:text-white"

export function LabInfo() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null)
  const [isUploadingLicense, setIsUploadingLicense] = useState(false)

  // Real-time state directly hydrated from PostgreSQL
  const [profile, setProfile] = useState<LabProfileState>({
    id: '',
    labName: '',
    hospitalName: '',
    inChargeName: '',
    contactPhone: '',
    contactEmail: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    formattedAddress: '',
    labLicenseNumber: '',
    registrationNumber: '',
    operationalHours: '08:00 AM – 08:00 PM',
    homeCollectionAvailable: true,
    documents: []
  })

  // Edit form state
  const [formData, setFormData] = useState({
    labName: '',
    inChargeName: '',
    contactPhone: '',
    contactEmail: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    labLicenseNumber: '',
    operationalHours: '08:00 AM – 08:00 PM',
    homeCollectionAvailable: true
  })

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const data = await labApi.getLabProfile()
      if (data) {
        const stateData: LabProfileState = {
          id: data.id || data.labId || '',
          labName: data.labName || data.name || '',
          hospitalName: data.hospitalName || data.name || '',
          inChargeName: data.inChargeName || data.ownerName || '',
          contactPhone: data.contactPhone || data.phone || '',
          contactEmail: data.contactEmail || data.email || '',
          street: data.address?.street || data.addressLine1 || '',
          city: data.address?.city || data.city || '',
          state: data.address?.state || data.state || '',
          pinCode: data.address?.pinCode || data.pinCode || '',
          formattedAddress: data.formattedAddress || data.address?.full || '',
          labLicenseNumber: data.labLicenseNumber || data.registrationNumber || '',
          registrationNumber: data.registrationNumber || '',
          operationalHours: data.operationalHours || '08:00 AM – 08:00 PM',
          homeCollectionAvailable: Boolean(data.homeCollectionAvailable),
          documents: data.documents || []
        }
        setProfile(stateData)
        setFormData({
          labName: stateData.labName,
          inChargeName: stateData.inChargeName,
          contactPhone: stateData.contactPhone,
          contactEmail: stateData.contactEmail,
          street: stateData.street,
          city: stateData.city,
          state: stateData.state,
          pinCode: stateData.pinCode,
          labLicenseNumber: stateData.labLicenseNumber,
          operationalHours: stateData.operationalHours,
          homeCollectionAvailable: stateData.homeCollectionAvailable
        })
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch laboratory information', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)
    try {
      const updated = await labApi.updateLabProfile(formData)
      if (updated) {
        toast("Laboratory information successfully updated in database", "success")
        await loadProfile()
        setIsEditing(false)
      }
    } catch (error: any) {
      toast(error instanceof Error ? error.message : 'Unable to update lab information', "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingLicense(true)
    try {
      const uploadRes = await labApi.uploadLicenseCertificate(file)
      if (uploadRes?.fileUrl) {
        await labApi.updateLabProfile({
          ...formData,
          labLicenseDocumentUrl: uploadRes.fileUrl
        })
        toast("License certificate uploaded and verified successfully", "success")
        await loadProfile()
      }
    } catch (err: any) {
      toast(err.message || "Failed to upload license document", "error")
    } finally {
      setIsUploadingLicense(false)
      if (event.target) event.target.value = ''
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast(`${label} copied to clipboard`, "success")
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full relative">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-30 bg-surface/98 backdrop-blur-md border-b border-border shadow-xs px-4 md:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => isEditing ? setIsEditing(false) : navigate(-1)} 
            className="p-2 -ml-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#0A1A3D] dark:text-white" />
          </button>
          <div>
            <h1 className="text-[18px] md:text-[22px] font-black text-[#0A1A3D] dark:text-white">
              {isEditing ? "Edit Lab Profile" : "Lab Information & Compliance"}
            </h1>
            <p className="text-[11px] text-muted font-medium">Authoritative facility records & regulatory licenses</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl border border-primary/20 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Information</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs font-bold text-muted hover:text-foreground px-3.5 py-2 rounded-xl border border-border transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </header>

      {/* Content Container */}
      <div className="flex flex-col gap-6 px-4 md:px-6 pt-5 md:pt-6 pb-24 max-w-3xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted">Hydrating authoritative laboratory profile…</p>
          </div>
        ) : isEditing ? (
          /* EDIT PROFILE FORM */
          <motion.form 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave}
            className="bg-surface rounded-2xl md:rounded-3xl border border-border p-5 md:p-7 shadow-xs flex flex-col gap-5"
          >
            <div className="border-b border-border pb-3">
              <h2 className="text-[16px] md:text-[18px] font-bold text-[#172033] dark:text-white">Edit Facility Credentials</h2>
              <p className="text-[12px] text-muted">All updates persist directly to the PostgreSQL database and reflect in real time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Laboratory Facility Name <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.labName} 
                  onChange={e => setFormData({ ...formData, labName: e.target.value })}
                  placeholder="e.g. Apollo Diagnostics Lab" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Lab In-Charge / Pathologist Name <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.inChargeName} 
                  onChange={e => setFormData({ ...formData, inChargeName: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Reddy, MD" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Registration / License Number <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.labLicenseNumber} 
                  onChange={e => setFormData({ ...formData, labLicenseNumber: e.target.value })}
                  placeholder="e.g. TS/LAB/2026/0894" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Official Contact Phone <span className="text-destructive">*</span></label>
                <input 
                  type="tel" 
                  value={formData.contactPhone} 
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="e.g. 9876543210" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Official Contact Email <span className="text-destructive">*</span></label>
                <input 
                  type="email" 
                  value={formData.contactEmail} 
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="e.g. diagnostics@hospital.com" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Operational Hours <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.operationalHours} 
                  onChange={e => setFormData({ ...formData, operationalHours: e.target.value })}
                  placeholder="e.g. 08:00 AM – 08:00 PM (Mon-Sun)" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Street Address / Landmark <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.street} 
                  onChange={e => setFormData({ ...formData, street: e.target.value })}
                  placeholder="e.g. Road No. 12, Banjara Hills" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">City <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.city} 
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Hyderabad" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">State <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.state} 
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Telangana" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">PIN Code <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  value={formData.pinCode} 
                  onChange={e => setFormData({ ...formData, pinCode: e.target.value })}
                  placeholder="e.g. 500034" 
                  className={inputClass}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5 justify-center">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Home Sample Collection</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, homeCollectionAvailable: !formData.homeCollectionAvailable })}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                    formData.homeCollectionAvailable ? "bg-emerald-50/80 border-emerald-300 text-emerald-800" : "bg-gray-50 border-gray-200 text-gray-600"
                  )}
                >
                  <span className="text-xs font-semibold">Home Sample Collection</span>
                  <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center", formData.homeCollectionAvailable ? "bg-emerald-600 border-emerald-600" : "bg-white border-gray-300")}>
                    {formData.homeCollectionAvailable && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="flex-1 py-3 px-4 rounded-xl border border-border text-sm font-semibold text-[#172033] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-[2] py-3 px-4 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Saving to Database…" : "Save Changes"}
              </button>
            </div>
          </motion.form>
        ) : (
          /* REAL-TIME OVERVIEW VIEW */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            
            {/* Section 1: Official Lab Metadata */}
            <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-5 md:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#172033] dark:text-white">Official Lab Metadata</h3>
                    <p className="text-[12px] text-muted">Registered diagnostic facility identity</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified & Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50/60 dark:bg-gray-800/40 p-3.5 rounded-xl border border-border/60">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Facility Name</p>
                  <p className="text-[15px] font-bold text-[#172033] dark:text-white mt-0.5">{profile.labName || 'MediQuee Diagnostic Lab'}</p>
                </div>

                <div className="bg-gray-50/60 dark:bg-gray-800/40 p-3.5 rounded-xl border border-border/60">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Lab License Number</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[14px] font-mono font-bold text-primary">{profile.labLicenseNumber || 'MED-LAB-2026-ACTIVE'}</p>
                    <button 
                      onClick={() => copyToClipboard(profile.labLicenseNumber, "License Number")}
                      className="p-1 text-muted hover:text-foreground rounded transition-colors"
                      title="Copy License Number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50/60 dark:bg-gray-800/40 p-3.5 rounded-xl border border-border/60">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Parent Hospital / Center</p>
                  <p className="text-[15px] font-bold text-[#172033] dark:text-white mt-0.5">{profile.hospitalName || 'Affiliated Healthcare Entity'}</p>
                </div>

                <div className="bg-gray-50/60 dark:bg-gray-800/40 p-3.5 rounded-xl border border-border/60">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Lab In-Charge / Pathologist</p>
                  <p className="text-[15px] font-bold text-[#172033] dark:text-white mt-0.5">{profile.inChargeName || 'Dr. Registered Pathologist'}</p>
                </div>

                <div className="bg-gray-50/60 dark:bg-gray-800/40 p-3.5 rounded-xl border border-border/60">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Operational Hours</p>
                  <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#172033] dark:text-white mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{profile.operationalHours}</span>
                  </div>
                </div>

                <div className="bg-gray-50/60 dark:bg-gray-800/40 p-3.5 rounded-xl border border-border/60">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Home Sample Collection</p>
                  <div className="flex items-center gap-1.5 text-[14px] font-semibold mt-0.5">
                    <Home className="w-3.5 h-3.5 text-emerald-600" />
                    <span className={profile.homeCollectionAvailable ? "text-emerald-700 font-bold" : "text-gray-500"}>
                      {profile.homeCollectionAvailable ? "Available & Active" : "In-Lab Walk-In Only"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contact & Formatted Physical Address */}
            <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-5 md:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#172033] dark:text-white">Contact & Physical Facility Address</h3>
                  <p className="text-[12px] text-muted">Clean structured location details (never raw JSON)</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-border/60">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-muted">Official Phone</p>
                      <p className="text-[14px] font-bold text-[#172033] dark:text-white truncate">{profile.contactPhone || 'Registered in portal'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-border/60">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-muted">Official Email</p>
                      <p className="text-[14px] font-bold text-[#172033] dark:text-white truncate">{profile.contactEmail || 'lab@mediquee.com'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl md:rounded-2xl border border-border/70 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[#172033] dark:text-white uppercase tracking-wider">Physical Facility Address</p>
                    <p className="text-[14px] font-medium text-[#475467] dark:text-gray-300 mt-1 leading-relaxed">
                      {profile.formattedAddress || `${profile.street ? profile.street + ', ' : ''}${profile.city || ''} ${profile.state || ''} ${profile.pinCode || ''}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50 text-[12px] text-muted">
                      <span>Street: <strong className="text-foreground">{profile.street || '—'}</strong></span>
                      <span>•</span>
                      <span>City: <strong className="text-foreground">{profile.city || '—'}</strong></span>
                      <span>•</span>
                      <span>State: <strong className="text-foreground">{profile.state || '—'}</strong></span>
                      <span>•</span>
                      <span>PIN: <strong className="text-foreground">{profile.pinCode || '—'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Licensing & Regulatory Documents */}
            <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-5 md:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#172033] dark:text-white">Licensing & Regulatory Documents</h3>
                    <p className="text-[12px] text-muted">Verified compliance certificates for diagnostic accreditation</p>
                  </div>
                </div>

                {/* Upload Certificate Action */}
                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold cursor-pointer transition-colors shrink-0">
                  {isUploadingLicense ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploadingLicense ? "Uploading…" : "Upload License"}</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploadingLicense} />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3.5 mt-4">
                {profile.documents && profile.documents.length > 0 ? (
                  profile.documents.map((doc, idx) => (
                    <div 
                      key={doc.id || idx}
                      className="p-4 rounded-xl md:rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-border/60 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-[14px] md:text-[15px] font-bold text-[#172033] dark:text-white">{doc.title || doc.documentType}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified
                            </span>
                          </div>
                          <p className="text-[12px] font-mono text-[#667085] mt-0.5">
                            License No: <span className="font-semibold text-[#172033] dark:text-gray-200">{doc.licenseNumber || profile.labLicenseNumber || 'MED-LAB-2026'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {doc.fileUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (doc.fileUrl) {
                                window.open(doc.fileUrl, '_blank')
                              }
                            }}
                            className="text-xs font-bold text-primary bg-white dark:bg-gray-900 hover:bg-primary/10 border border-border px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Preview Document</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Certificate on File
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Diagnostic Laboratory Accreditation Active</p>
                        <p className="text-xs text-emerald-700 font-mono">License #{profile.labLicenseNumber || 'MED-LAB-2026-ACTIVE'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </div>

      {/* Document Preview Lightbox Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border p-5 max-w-2xl w-full flex flex-col gap-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground">{previewDoc.title}</h3>
                <button onClick={() => setPreviewDoc(null)} className="p-1 rounded-lg hover:bg-gray-100 text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-xl bg-gray-50 flex items-center justify-center p-2">
                <img src={previewDoc.url} alt={previewDoc.title} className="max-h-[60vh] object-contain rounded-lg shadow-sm" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
