import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Clock,
  ShieldCheck,
  AlertCircle,
  User,
  Activity,
  CheckCircle2,
  Maximize2,
  Minimize2,
  FileText,
  Plus,
  Trash2,
  Save,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalTrackPublication,
} from "livekit-client";
import { videoConsultationApi, type VideoTokenResponse } from "@/services/videoConsultationApi";
import {
  doctorApi,
  type PrescriptionItemPayload,
  type DosageTiming,
  type ConsultationPayload,
} from "@/services/doctorApi";

interface DoctorVideoCallRoomProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onCallEnded?: () => void;
  onOpenWorkspace?: (appointment: any) => void;
}

const FREQUENCY_OPTIONS = ["1-0-1", "1-0-0", "0-0-1", "1-1-1", "SOS"];
const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops"];
const TIMING_OPTIONS: { value: DosageTiming; label: string }[] = [
  { value: "AFTER_FOOD", label: "After Food" },
  { value: "BEFORE_FOOD", label: "Before Food" },
  { value: "WITH_FOOD", label: "With Food" },
  { value: "EMPTY_STOMACH", label: "Empty Stomach" },
];

const QUICK_PRESETS = [
  { name: "Paracetamol 650mg", form: "Tablet", strength: "650mg", freq: "1-0-1", days: 3, timing: "AFTER_FOOD" as DosageTiming, inst: "Take after food for fever/body ache" },
  { name: "Pantoprazole 40mg", form: "Tablet", strength: "40mg", freq: "1-0-0", days: 5, timing: "EMPTY_STOMACH" as DosageTiming, inst: "Take before breakfast" },
  { name: "Cetirizine 10mg", form: "Tablet", strength: "10mg", freq: "0-0-1", days: 5, timing: "AFTER_FOOD" as DosageTiming, inst: "Take at bedtime for cold/allergy" },
  { name: "Amoxicillin 500mg", form: "Capsule", strength: "500mg", freq: "1-0-1", days: 5, timing: "AFTER_FOOD" as DosageTiming, inst: "Complete full 5 days course" },
  { name: "Azithromycin 500mg", form: "Tablet", strength: "500mg", freq: "1-0-0", days: 3, timing: "AFTER_FOOD" as DosageTiming, inst: "Once daily after food" },
  { name: "Cough Syrup 100ml", form: "Syrup", strength: "100ml", freq: "1-1-1", days: 5, timing: "AFTER_FOOD" as DosageTiming, inst: "5ml thrice daily" },
  { name: "ORS Sachet", form: "Powder", strength: "1 Sachet", freq: "SOS", days: 3, timing: "WITH_FOOD" as DosageTiming, inst: "Dissolve in 1 liter clean water" },
];

export function DoctorVideoCallRoom({
  isOpen,
  onClose,
  appointment,
  onCallEnded,
  onOpenWorkspace,
}: DoctorVideoCallRoomProps) {
  // State
  const [tokenData, setTokenData] = useState<VideoTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Call & Media state
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [hasPatient, setHasPatient] = useState<boolean>(false);
  const [hasPatientVideo, setHasPatientVideo] = useState<boolean>(false);
  const [patientName, setPatientName] = useState<string>("");
  const [patientLeftNotice, setPatientLeftNotice] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isEndingCall, setIsEndingCall] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting to LiveKit...");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // In-Call Prescription Drawer & Medications State
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [clinicalNotes, setClinicalNotes] = useState<string>("");
  const [generalAdvice, setGeneralAdvice] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionItemPayload[]>([
    {
      medicineName: "",
      dosageForm: "Tablet",
      strength: "",
      frequency: "1-0-1",
      durationDays: 5,
      timing: "AFTER_FOOD",
      instructions: "",
    },
  ]);
  const [isSavingPrescription, setIsSavingPrescription] = useState<boolean>(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState<boolean>(false);
  const [prescriptionSaveMsg, setPrescriptionSaveMsg] = useState<string | null>(null);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);
  const [showEndCallPrompt, setShowEndCallPrompt] = useState<boolean>(false);

  // Refs
  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Load existing appointment/prescription data on mount
  useEffect(() => {
    if (isOpen && appointment?.id) {
      const initialDiag = appointment.diagnosis || appointment.diseaseName || appointment.reason || "";
      setDiagnosis(initialDiag);
      setClinicalNotes(appointment.clinicalNotes || "");
      setGeneralAdvice(appointment.generalAdvice || "");
      if (appointment.prescription?.items?.length) {
        setPrescriptions(appointment.prescription.items);
        setPrescriptionSaved(true);
      }

      // Fetch fresh appointment details from API
      doctorApi
        .getAppointmentById(appointment.id)
        .then((fullData) => {
          if (!fullData) return;
          if (fullData.prescription) {
            if (fullData.prescription.diagnosis) setDiagnosis(fullData.prescription.diagnosis);
            if (fullData.prescription.clinicalNotes) setClinicalNotes(fullData.prescription.clinicalNotes);
            if (fullData.prescription.generalAdvice) setGeneralAdvice(fullData.prescription.generalAdvice);
            if (fullData.prescription.followUpDate) {
              setFollowUpDate(fullData.prescription.followUpDate.split("T")[0]);
            }
            if (Array.isArray(fullData.prescription.items) && fullData.prescription.items.length > 0) {
              setPrescriptions(
                fullData.prescription.items.map((item: any) => ({
                  medicineName: item.medicineName || "",
                  dosageForm: item.dosageForm || "Tablet",
                  strength: item.strength || "",
                  frequency: item.frequency || "1-0-1",
                  durationDays: item.durationDays || 5,
                  timing: (item.timing as DosageTiming) || "AFTER_FOOD",
                  instructions: item.instructions || "",
                }))
              );
              setPrescriptionSaved(true);
            }
          } else if (fullData.diseaseName || fullData.reason) {
            setDiagnosis((prev) => prev || fullData.diseaseName || fullData.reason || "");
          }
        })
        .catch(() => {});
    }
  }, [isOpen, appointment?.id]);

  useEffect(() => {
    if (!isOpen || !appointment?.id) return;

    let isMounted = true;
    let roomInstance: Room | null = null;

    const startCall = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setConfigError(null);
        setPatientLeftNotice(null);
        setCallDuration(0);

        setPatientName(appointment.patientName || "Patient");

        // 1. Fetch room token from backend
        const res = await videoConsultationApi.getRoomToken(appointment.id);
        if (!isMounted) return;

        if (!res.success || !res.data) {
          if (res.code === "LIVEKIT_NOT_CONFIGURED") {
            setConfigError(
              res.error ||
                "LiveKit Cloud credentials are not configured on the server. Please add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in backend .env."
            );
          } else {
            setError(res.error || "Failed to initialize consultation session");
          }
          setIsLoading(false);
          return;
        }

        const data = res.data;
        setTokenData(data);

        // 2. Initialize LiveKit Client Room
        roomInstance = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = roomInstance;

        // Set up event handlers
        roomInstance.on(RoomEvent.Connected, () => {
          if (!isMounted) return;
          setConnectionStatus("Connected");
          setIsLoading(false);
        });

        roomInstance.on(RoomEvent.Reconnecting, () => {
          if (!isMounted) return;
          setConnectionStatus("Reconnecting...");
        });

        roomInstance.on(RoomEvent.Reconnected, () => {
          if (!isMounted) return;
          setConnectionStatus("Connected");
        });

        roomInstance.on(RoomEvent.Disconnected, () => {
          if (!isMounted) return;
          setConnectionStatus("Disconnected");
        });

        // Remote participant (Patient) joined
        roomInstance.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          if (!isMounted) return;
          setHasPatient(true);
          setPatientLeftNotice(null);
          if (participant.name) {
            setPatientName(participant.name);
          }
        });

        // Remote participant left
        roomInstance.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          if (!isMounted) return;
          setHasPatient(false);
          setPatientLeftNotice(`${participant.name || "Patient"} has left the call.`);
        });

        // Video / Audio Track Subscribed
        roomInstance.on(
          RoomEvent.TrackSubscribed,
          (track: Track, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
            if (!isMounted) return;
            setHasPatient(true);
            setPatientLeftNotice(null);

            if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
              track.attach(remoteVideoRef.current);
              setHasPatientVideo(true);
            } else if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
              track.attach(remoteAudioRef.current);
            }
          }
        );

        roomInstance.on(
          RoomEvent.TrackUnsubscribed,
          (track: Track, _publication: RemoteTrackPublication) => {
            if (track.kind === Track.Kind.Video) {
              setHasPatientVideo(false);
            }
            track.detach();
          }
        );

        roomInstance.on(RoomEvent.TrackMuted, (pub) => {
          if (pub.kind === Track.Kind.Video) setHasPatientVideo(false);
        });

        roomInstance.on(RoomEvent.TrackUnmuted, (pub) => {
          if (pub.kind === Track.Kind.Video) setHasPatientVideo(true);
        });

        // Automatically attach local doctor camera track when published
        roomInstance.on(RoomEvent.LocalTrackPublished, (pub) => {
          if (pub.kind === Track.Kind.Video && pub.track && localVideoRef.current) {
            pub.track.attach(localVideoRef.current);
            setIsCameraEnabled(true);
          }
        });

        // 3. Connect to LiveKit Cloud Room
        await roomInstance.connect(data.serverUrl, data.token);
        if (!isMounted) return;

        // 4. Enable Camera and Microphone
        try {
          await roomInstance.localParticipant.enableCameraAndMicrophone();
          setIsCameraEnabled(true);
          setIsMicEnabled(true);

          const videoPub = Array.from(
            roomInstance.localParticipant.videoTrackPublications.values()
          )[0] as LocalTrackPublication | undefined;

          if (videoPub && videoPub.track && localVideoRef.current) {
            videoPub.track.attach(localVideoRef.current);
          }
        } catch (mediaErr: any) {
          console.warn("[DoctorVideoRoom] Doctor media access warning:", mediaErr);
          try {
            await roomInstance.localParticipant.setMicrophoneEnabled(true);
            setIsMicEnabled(true);
            setIsCameraEnabled(false);
          } catch {
            setIsMicEnabled(false);
            setIsCameraEnabled(false);
          }
        }

        // Attach any existing patient tracks
        if (roomInstance.remoteParticipants.size > 0) {
          setHasPatient(true);
          const patient = Array.from(roomInstance.remoteParticipants.values())[0];
          if (patient.name) setPatientName(patient.name);
          patient.trackPublications.forEach((pub) => {
            if (pub.track) {
              if (pub.track.kind === Track.Kind.Video && remoteVideoRef.current) {
                pub.track.attach(remoteVideoRef.current);
                setHasPatientVideo(true);
              } else if (pub.track.kind === Track.Kind.Audio && remoteAudioRef.current) {
                pub.track.attach(remoteAudioRef.current);
              }
            }
          });
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error("[DoctorVideoRoom] Connection failed:", err);
        if (isMounted) {
          setError(err.message || "Failed to establish video call");
          setIsLoading(false);
        }
      }
    };

    startCall();

    return () => {
      isMounted = false;
      if (roomInstance) {
        roomInstance.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, appointment?.id]);

  // Duration Timer (increments while both participants are connected)
  useEffect(() => {
    if (hasPatient && !isLoading) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasPatient, isLoading]);

  const formatTimer = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle Mic
  const handleToggleMic = async () => {
    if (!roomRef.current) return;
    try {
      const next = !isMicEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(next);
      setIsMicEnabled(next);
    } catch (err) {
      console.error("Failed to toggle mic", err);
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (!roomRef.current) return;
    try {
      const next = !isCameraEnabled;
      await roomRef.current.localParticipant.setCameraEnabled(next);
      setIsCameraEnabled(next);

      if (next && localVideoRef.current) {
        const videoPub = Array.from(
          roomRef.current.localParticipant.videoTrackPublications.values()
        )[0] as LocalTrackPublication | undefined;
        if (videoPub && videoPub.track) {
          videoPub.track.attach(localVideoRef.current);
        }
      }
    } catch (err) {
      console.error("Failed to toggle camera", err);
    }
  };

  // Medication handlers
  const handleAddMedication = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        medicineName: "",
        dosageForm: "Tablet",
        strength: "",
        frequency: "1-0-1",
        durationDays: 5,
        timing: "AFTER_FOOD",
        instructions: "",
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (
    index: number,
    field: keyof PrescriptionItemPayload,
    value: any
  ) => {
    setPrescriptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleApplyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setPrescriptions((prev) => {
      const hasEmpty = prev.length === 1 && !prev[0].medicineName.trim();
      const newMed: PrescriptionItemPayload = {
        medicineName: preset.name,
        dosageForm: preset.form,
        strength: preset.strength,
        frequency: preset.freq,
        durationDays: preset.days,
        timing: preset.timing,
        instructions: preset.inst,
      };
      return hasEmpty ? [newMed] : [...prev, newMed];
    });
  };

  // Save Prescription during call
  const handleSavePrescription = async () => {
    setPrescriptionError(null);
    setPrescriptionSaveMsg(null);

    const activeDiagnosis =
      diagnosis.trim() || appointment.reason || appointment.diseaseName || "Clinical Consultation Completed";

    const validItems = prescriptions
      .filter((p) => p.medicineName.trim().length > 0)
      .map((p) => ({
        ...p,
        medicineName: p.medicineName.trim(),
        durationDays: Number(p.durationDays) || 1,
      }));

    const payload: ConsultationPayload = {
      diagnosis: activeDiagnosis,
      clinicalNotes: clinicalNotes.trim() || null,
      generalAdvice: generalAdvice.trim() || null,
      followUpDate: followUpDate || null,
      prescriptions: validItems,
    };

    setIsSavingPrescription(true);
    try {
      await doctorApi.recordConsultation(appointment.id, payload);
      setPrescriptionSaved(true);
      setPrescriptionSaveMsg(
        validItems.length > 0
          ? `Saved ${validItems.length} medication(s) to patient's official prescription!`
          : "Consultation notes & advice saved!"
      );
      setTimeout(() => setPrescriptionSaveMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to save prescription:", err);
      setPrescriptionError(err.message || "Failed to save prescription");
    } finally {
      setIsSavingPrescription(false);
    }
  };

  // Finalize ending the call
  const finalizeEndCall = async () => {
    setIsEndingCall(true);
    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (appointment?.id) {
        await videoConsultationApi.endCall(appointment.id);
      }
      if (onCallEnded) onCallEnded();
    } catch (err) {
      console.error("Error ending consultation", err);
    } finally {
      setIsEndingCall(false);
      onClose();
    }
  };

  // End Call trigger
  const handleEndCall = async () => {
    if (isEndingCall) return;

    const hasPrescriptionsAdded = prescriptions.some((p) => p.medicineName.trim().length > 0);

    // If prescription has not been saved and no medicines added, prompt doctor
    if (!prescriptionSaved && !hasPrescriptionsAdded) {
      setShowEndCallPrompt(true);
      return;
    }

    if (!window.confirm("Are you sure you want to end this video consultation?")) return;
    await finalizeEndCall();
  };

  if (!isOpen) return null;

  const validMedsCount = prescriptions.filter((p) => p.medicineName.trim().length > 0).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
        {/* Audio Element for patient's voice */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative bg-slate-950 text-white rounded-[28px] overflow-hidden shadow-2xl flex flex-col border border-white/10 transition-all ${
            isFullscreen
              ? "w-full h-full"
              : isPrescriptionOpen
              ? "w-full max-w-6xl h-[90vh]"
              : "w-full max-w-4xl h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
                {patientName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">{patientName}</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-400">
                  {appointment?.gender || "Patient"} • {appointment?.age ? `${appointment.age} yrs` : ""}{" "}
                  • ID: {appointment?.mqId || appointment?.id?.slice(0, 8)}
                </p>
              </div>
            </div>

            {/* Timer, Prescribe Toggle, Fullscreen, and Close */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs font-semibold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono tracking-wider">{formatTimer(callDuration)}</span>
              </div>

              {/* Rx Quick Button in Header */}
              <button
                onClick={() => setIsPrescriptionOpen((prev) => !prev)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isPrescriptionOpen
                    ? "bg-blue-600 text-white shadow-sm"
                    : prescriptionSaved
                    ? "bg-emerald-600/90 text-white"
                    : "bg-white/10 hover:bg-white/20 text-slate-200"
                }`}
                title="Prescribe Medications & Advice"
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-300" />
                <span>{prescriptionSaved ? "Rx Saved ✓" : "Write Rx"}</span>
                {validMedsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-black">
                    {validMedsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 transition-colors"
                title="Minimize / Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area: Video View + In-Call Prescription Drawer */}
          <div className="relative flex-1 bg-slate-900 flex overflow-hidden">
            {/* Left/Main: Video Feed Area */}
            <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
              {/* Config Error */}
              {configError ? (
                <div className="p-8 max-w-md text-center space-y-4">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">LiveKit Cloud Required</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{configError}</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              ) : error ? (
                <div className="p-8 max-w-md text-center space-y-4">
                  <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Failed to Connect</h4>
                  <p className="text-xs text-slate-400">{error}</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              ) : hasPatient ? (
                /* Patient Remote Video Area */
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={cn(
                      "w-full h-full object-contain",
                      !hasPatientVideo && "hidden"
                    )}
                  />

                  {/* Informative placeholder when patient is connected with voice audio but camera is not yet enabled */}
                  {!hasPatientVideo && (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center text-blue-400">
                          <User className="w-10 h-10" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </span>
                      </div>
                      <div className="max-w-xs space-y-1">
                        <h4 className="text-base font-bold text-white">{patientName} Connected</h4>
                        <p className="text-xs text-slate-400">
                          Voice audio is active. Waiting for patient to allow camera on their phone...
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                        <VideoOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Patient's camera is off / permission pending</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-medium text-white flex items-center gap-2 border border-white/10">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{patientName} (Patient)</span>
                    {!hasPatientVideo && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                        Audio Only
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Waiting for Patient */
                <div className="p-8 text-center space-y-5">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto animate-pulse">
                    <User className="w-10 h-10" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h4 className="text-lg font-bold text-white">Waiting for {patientName}...</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You have entered the consultation room. The patient can join now from their MediQuee app.
                    </p>
                  </div>
                  {patientLeftNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 max-w-xs mx-auto">
                      {patientLeftNotice}
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>{connectionStatus}</span>
                  </div>
                </div>
              )}

              {/* Doctor's Local Camera Preview (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 z-20 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800">
                {isCameraEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-800 hover:bg-slate-750 p-2 cursor-pointer transition-colors"
                    title="Click to turn on camera"
                  >
                    <VideoOff className="w-5 h-5 mb-1 text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-300">Camera Off</span>
                    <span className="text-[8px] text-slate-400 underline mt-0.5">Click to turn on</span>
                  </button>
                )}
                <div className="absolute bottom-1 left-2 px-1 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-white">
                  You (Doctor)
                </div>
              </div>
            </div>

            {/* Right: In-Call Prescription Drawer */}
            <AnimatePresence>
              {isPrescriptionOpen && (
                <motion.div
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="w-full sm:w-[420px] md:w-[460px] bg-slate-900/98 backdrop-blur-xl border-l border-white/10 flex flex-col h-full z-30 shrink-0 shadow-2xl"
                >
                  {/* Prescription Drawer Header */}
                  <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                        ℞
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          Prescription & Notes
                          {prescriptionSaved && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Saved ✓
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Prescribe oral medications during the video call
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPrescriptionOpen(false)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      title="Hide Drawer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drawer Scrollable Body */}
                  <div className="overflow-y-auto flex-1 p-4 space-y-4 text-xs">
                    {/* Feedback Messages */}
                    {prescriptionSaveMsg && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{prescriptionSaveMsg}</span>
                      </div>
                    )}
                    {prescriptionError && (
                      <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{prescriptionError}</span>
                      </div>
                    )}

                    {/* Quick Add Presets */}
                    <div className="p-3 bg-slate-800/70 rounded-xl border border-white/10 space-y-2">
                      <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Quick Add Common Medicines:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyPreset(p)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer border border-white/5"
                          >
                            + {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Diagnosis & Findings */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">
                        Diagnosis & Clinical Findings <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Viral Fever, Acute Pharyngitis, Migraine"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    {/* Prescribed Medications Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>Prescribed Medications</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">
                            {validMedsCount}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAddMedication}
                          className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors border border-blue-500/30 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Row
                        </button>
                      </div>

                      {prescriptions.map((med, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-800/80 rounded-xl border border-white/10 space-y-2.5 relative"
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                              Medicine #{index + 1}
                            </span>
                            {prescriptions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMedication(index)}
                                className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                                title="Remove medication"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Medicine Name & Strength */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 space-y-1">
                              <span className="text-[10px] text-slate-400">Medicine Name</span>
                              <input
                                type="text"
                                placeholder="e.g. Paracetamol"
                                value={med.medicineName}
                                onChange={(e) => handleMedicationChange(index, "medicineName", e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400">Strength</span>
                              <input
                                type="text"
                                placeholder="650mg"
                                value={med.strength || ""}
                                onChange={(e) => handleMedicationChange(index, "strength", e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Form, Frequency, Duration */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400">Form</span>
                              <select
                                value={med.dosageForm}
                                onChange={(e) => handleMedicationChange(index, "dosageForm", e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                              >
                                {DOSAGE_FORMS.map((f) => (
                                  <option key={f} value={f} className="bg-slate-900">
                                    {f}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400">Frequency</span>
                              <select
                                value={med.frequency}
                                onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500 font-bold text-blue-400"
                              >
                                {FREQUENCY_OPTIONS.map((fq) => (
                                  <option key={fq} value={fq} className="bg-slate-900">
                                    {fq}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400">Days</span>
                              <input
                                type="number"
                                min={1}
                                value={med.durationDays}
                                onChange={(e) =>
                                  handleMedicationChange(index, "durationDays", Number(e.target.value) || 1)
                                }
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Food Timing & Instructions */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400">Timing</span>
                              <select
                                value={med.timing}
                                onChange={(e) =>
                                  handleMedicationChange(index, "timing", e.target.value as DosageTiming)
                                }
                                className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                              >
                                {TIMING_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value} className="bg-slate-900">
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400">Instructions</span>
                              <input
                                type="text"
                                placeholder="After meal"
                                value={med.instructions || ""}
                                onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* General Advice & Clinical Notes */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">
                        General Advice / Dietary Instructions
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Hydrate with plenty of warm water, adequate rest, avoid cold beverages"
                        value={generalAdvice}
                        onChange={(e) => setGeneralAdvice(e.target.value)}
                        className="w-full p-2.5 bg-slate-800 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Follow-up Date */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">Follow-up Date (Optional)</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-white/15 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="p-4 bg-slate-800/90 border-t border-white/10 flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPrescriptionOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs transition-colors"
                    >
                      Hide
                    </button>

                    <button
                      type="button"
                      disabled={isSavingPrescription}
                      onClick={handleSavePrescription}
                      className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingPrescription ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save & Apply Prescription</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Control Bar */}
          <div className="px-6 py-4 bg-slate-900 border-t border-white/10 flex items-center justify-between shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Two-Way LiveKit Video Consultation</span>
            </div>

            {/* Call Controls */}
            <div className="flex items-center gap-3 sm:gap-4 mx-auto sm:mx-0">
              {/* Mic Toggle */}
              <button
                onClick={handleToggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                  isMicEnabled
                    ? "bg-white/15 hover:bg-white/25 text-white border border-white/10"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
                title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={handleToggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                  isCameraEnabled
                    ? "bg-white/15 hover:bg-white/25 text-white border border-white/10"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
                title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isCameraEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Prescribe / Rx In-Call Drawer Toggle */}
              <button
                onClick={() => setIsPrescriptionOpen((prev) => !prev)}
                className={`px-4 py-2.5 rounded-full flex items-center gap-2 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                  isPrescriptionOpen
                    ? "bg-blue-600 text-white ring-2 ring-blue-400/50 shadow-blue-500/30"
                    : prescriptionSaved
                    ? "bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-500/40"
                    : "bg-white/15 hover:bg-white/25 text-white border border-white/10"
                }`}
                title="Add/Edit Medications & Clinical Notes during call"
              >
                <FileText className="w-4 h-4 text-blue-200" />
                <span>{prescriptionSaved ? "Rx Saved ✓" : "Prescribe / Rx"}</span>
                {validMedsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-black">
                    {validMedsCount}
                  </span>
                )}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                disabled={isEndingCall}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                title="End Consultation"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden sm:block text-right">
              <span className="text-[11px] font-mono text-slate-400">
                Room: {tokenData?.roomName ? tokenData.roomName.slice(0, 16) + "..." : "Connecting"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* End Call Prompt Modal if no medications added */}
        {showEndCallPrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-bold text-white">Consultation Ending</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No oral medications have been prescribed yet for this consultation. Would you like to write the
                  prescription now?
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEndCallPrompt(false);
                    setIsPrescriptionOpen(true);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Write Prescription & Add Medications Now</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setShowEndCallPrompt(false);
                    await finalizeEndCall();
                    if (onOpenWorkspace) {
                      onOpenWorkspace(appointment);
                    }
                  }}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  End Call (I'll Add Later from Dashboard)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
