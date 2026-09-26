import { useState, useEffect, useRef } from "react"
import { 
  ArrowLeft, FileSignature, CheckCircle2, RefreshCw, 
  Trash2, Upload, PenTool, Image, AlertCircle, Save
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { userApi, type UserProfile } from "@/services/userApi"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

export function EPrescriptionSettings() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Signature state (data URL)
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCanvasActive, setIsCanvasActive] = useState(false);

  // Preferences
  const [saveFavorites, setSaveFavorites] = useState(true);
  const [autoGeneric, setAutoGeneric] = useState(true);
  const [autoStampVideo, setAutoStampVideo] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await userApi.getMe();
        if (data.digitalSignature) {
          setSignature(data.digitalSignature);
        }
        if (data.prescriptionSettings) {
          if (data.prescriptionSettings.saveFavorites !== undefined) {
            setSaveFavorites(!!data.prescriptionSettings.saveFavorites);
          }
          if (data.prescriptionSettings.autoGeneric !== undefined) {
            setAutoGeneric(!!data.prescriptionSettings.autoGeneric);
          }
          if (data.prescriptionSettings.autoStampVideo !== undefined) {
            setAutoStampVideo(!!data.prescriptionSettings.autoStampVideo);
          }
        }
      } catch (err: any) {
        console.error("Failed to load e-prescription settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0A1A3D";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applyDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignature(dataUrl);
    setIsCanvasActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast("Please upload a valid image file (PNG/JPG)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSignature(event.target.result);
        setIsCanvasActive(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        digitalSignature: signature,
        prescriptionSettings: {
          saveFavorites,
          autoGeneric,
          autoStampVideo,
        }
      };

      const updated = await userApi.updateMe(payload);
      if (updateUser) {
        updateUser(updated);
      }
      toast("E-Prescription settings updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to update prescription settings:", err);
      toast(err?.message || "Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center justify-between bg-surface/90 backdrop-blur-xl border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-[20px] font-black text-foreground tracking-tight">E-Prescription Settings</h1>
            <p className="text-xs text-muted">Digital signature & prescription options for Video Consultations</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="w-full h-44 rounded-2xl" />
            <Skeleton className="w-full h-40 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Digital Signature Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 border-b border-border pb-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <FileSignature className="w-6 h-6 text-[#1B5DF1]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Digital Signature</h2>
                  <p className="text-xs text-muted font-medium">Stamped on completed video consultation prescriptions</p>
                </div>
              </div>

              {/* Signature Display or Interactive Drawing */}
              {!isCanvasActive ? (
                <div className="flex flex-col gap-4">
                  {signature ? (
                    <div className="h-40 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl border-2 border-border flex flex-col items-center justify-center p-3 relative overflow-hidden">
                      <img 
                        src={signature} 
                        alt="Doctor Digital Signature" 
                        className="max-h-28 max-w-full object-contain filter drop-shadow-sm" 
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-2">
                        Active Signature
                      </span>
                    </div>
                  ) : (
                    <div className="h-36 bg-muted/5 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted/70 gap-1.5">
                      <FileSignature className="w-8 h-8 opacity-40" />
                      <span className="text-xs font-bold uppercase">No Signature Configured</span>
                      <span className="text-[11px] text-muted">Add your signature to stamp video prescriptions</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsCanvasActive(true)}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#1B5DF1] text-[#1B5DF1] hover:bg-[#1B5DF1]/10 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <PenTool className="w-4 h-4" />
                      <span>{signature ? "Draw New" : "Draw Signature"}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Image</span>
                    </button>

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/png, image/jpeg, image/webp" 
                      className="hidden" 
                    />
                  </div>

                  {signature && (
                    <button
                      type="button"
                      onClick={() => setSignature(null)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center justify-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Saved Signature</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Interactive Canvas Box */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Sign using touch or cursor</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-muted hover:text-foreground font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="border-2 border-[#1B5DF1] rounded-xl bg-white overflow-hidden shadow-inner touch-none">
                    <canvas 
                      ref={canvasRef}
                      width={500}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-44 cursor-crosshair"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsCanvasActive(false)}
                      className="py-2.5 px-4 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyDrawnSignature}
                      className="py-2.5 px-4 rounded-xl bg-[#1B5DF1] text-white font-bold text-xs hover:bg-[#1B5DF1]/90 transition-colors shadow-sm cursor-pointer"
                    >
                      Apply Signature
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Video Consultation Prescription Preferences Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.05 }} 
              className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-4"
            >
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider border-b border-border pb-2.5">
                Video Consultation Rules
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">Stamp on Video Prescriptions</p>
                  <p className="text-xs text-muted font-medium mt-0.5">Automatically attach signature when video call finishes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoStampVideo(!autoStampVideo)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-colors shadow-inner cursor-pointer shrink-0",
                    autoStampVideo ? "bg-[#1B5DF1]" : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    autoStampVideo ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="font-semibold text-foreground text-sm">Save Favorite Medicines</p>
                  <p className="text-xs text-muted font-medium mt-0.5">Quickly reuse frequently prescribed formulations</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveFavorites(!saveFavorites)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-colors shadow-inner cursor-pointer shrink-0",
                    saveFavorites ? "bg-[#1B5DF1]" : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    saveFavorites ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="font-semibold text-foreground text-sm">Auto-add Generic Drug Names</p>
                  <p className="text-xs text-muted font-medium mt-0.5">Include pharmacological salt equivalents in print</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoGeneric(!autoGeneric)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-colors shadow-inner cursor-pointer shrink-0",
                    autoGeneric ? "bg-[#1B5DF1]" : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    autoGeneric ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </motion.div>
            
            {/* Save Button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <button 
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#1B5DF1] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1B5DF1]/90 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
