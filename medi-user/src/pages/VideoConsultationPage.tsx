import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Clock,
  ShieldCheck,
  Stethoscope,
  AlertCircle,
  RefreshCw,
  Camera,
  ArrowLeft,
  User,
  Activity,
  CheckCircle2,
  Lock,
  Settings,
  Smartphone,
  X,
  Volume2,
} from 'lucide-react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalTrackPublication,
  ConnectionState,
} from 'livekit-client';
import { videoConsultationApi, type VideoTokenResponse } from '../lib/videoConsultationApi';

const VideoConsultationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  // State
  const [tokenData, setTokenData] = useState<VideoTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Call & Media controls
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting to room...');
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState<boolean>(false);
  const [remoteParticipantName, setRemoteParticipantName] = useState<string>('');
  const [remoteLeftMessage, setRemoteLeftMessage] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isEndingCall, setIsEndingCall] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [permissionBlocked, setPermissionBlocked] = useState<boolean>(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState<boolean>(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>('');

  // Refs
  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // 1. Fetch Room Token and Connect
  useEffect(() => {
    if (!bookingId) {
      setError('Appointment ID is missing');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let roomInstance: Room | null = null;

    const initCall = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setConfigError(null);
        setPermissionError(null);

        // Fetch LiveKit room token
        const tokenRes = await videoConsultationApi.getRoomToken(bookingId);
        if (!isMounted) return;

        if (!tokenRes.success || !tokenRes.data) {
          if (tokenRes.code === 'LIVEKIT_NOT_CONFIGURED') {
            setConfigError(
              tokenRes.error ||
                'LiveKit Cloud is not yet configured. Please provide backend credentials in environment variables.'
            );
          } else {
            setError(tokenRes.error || 'Failed to authorize video consultation');
          }
          setIsLoading(false);
          return;
        }

        const data = tokenRes.data;
        setTokenData(data);
        setRemoteParticipantName(`Dr. ${data.booking.doctorName.replace(/^Dr\.\s*/i, '')}`);

        // Initialize LiveKit Room
        roomInstance = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = roomInstance;

        // Set up event listeners
        roomInstance.on(RoomEvent.Connected, () => {
          if (!isMounted) return;
          setConnectionStatus('Connected');
          setIsLoading(false);
        });

        roomInstance.on(RoomEvent.Reconnecting, () => {
          if (!isMounted) return;
          setConnectionStatus('Reconnecting to room...');
        });

        roomInstance.on(RoomEvent.Reconnected, () => {
          if (!isMounted) return;
          setConnectionStatus('Connected');
        });

        roomInstance.on(RoomEvent.Disconnected, () => {
          if (!isMounted) return;
          setConnectionStatus('Disconnected');
        });

        // Remote participant joined
        roomInstance.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          if (!isMounted) return;
          setHasRemoteParticipant(true);
          setRemoteLeftMessage(null);
          if (participant.name) {
            setRemoteParticipantName(participant.name);
          }
        });

        // Remote participant left
        roomInstance.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          if (!isMounted) return;
          setHasRemoteParticipant(false);
          setRemoteLeftMessage(
            `${participant.name || 'The doctor'} has left the room. You may wait for them to rejoin or leave the call.`
          );
        });

        // Track subscribed (audio or video from doctor)
        roomInstance.on(
          RoomEvent.TrackSubscribed,
          (track: Track, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
            if (!isMounted) return;
            setHasRemoteParticipant(true);
            setRemoteLeftMessage(null);

            if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
              track.attach(remoteVideoRef.current);
              setHasRemoteVideo(true);
            } else if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
              track.attach(remoteAudioRef.current);
            }
          }
        );

        // Track unsubscribed
        roomInstance.on(
          RoomEvent.TrackUnsubscribed,
          (track: Track, _publication: RemoteTrackPublication) => {
            if (track.kind === Track.Kind.Video) {
              setHasRemoteVideo(false);
            }
            track.detach();
          }
        );

        roomInstance.on(RoomEvent.TrackMuted, (pub) => {
          if (pub.kind === Track.Kind.Video) setHasRemoteVideo(false);
        });

        roomInstance.on(RoomEvent.TrackUnmuted, (pub) => {
          if (pub.kind === Track.Kind.Video) setHasRemoteVideo(true);
        });

        // Automatically attach local camera video track when published
        roomInstance.on(RoomEvent.LocalTrackPublished, (pub) => {
          if (pub.kind === Track.Kind.Video && pub.track && localVideoRef.current) {
            pub.track.attach(localVideoRef.current);
            setIsCameraEnabled(true);
          }
        });

        // Connect to LiveKit Cloud Room
        await roomInstance.connect(data.serverUrl, data.token);
        if (!isMounted) return;

        // Check if remote doctor is already in the room
        if (roomInstance.remoteParticipants.size > 0) {
          setHasRemoteParticipant(true);
          const firstRemote = Array.from(roomInstance.remoteParticipants.values())[0];
          if (firstRemote.name) {
            setRemoteParticipantName(firstRemote.name);
          }
          firstRemote.trackPublications.forEach((pub) => {
            if (pub.track) {
              if (pub.track.kind === Track.Kind.Video && remoteVideoRef.current) {
                pub.track.attach(remoteVideoRef.current);
                setHasRemoteVideo(true);
              } else if (pub.track.kind === Track.Kind.Audio && remoteAudioRef.current) {
                pub.track.attach(remoteAudioRef.current);
              }
            }
          });
        }

        // List available cameras for switching on mobile
        navigator.mediaDevices?.enumerateDevices()
          .then((devices) => {
            const videoDevices = devices.filter((d) => d.kind === 'videoinput');
            setAvailableCameras(videoDevices);
            if (videoDevices.length > 0) {
              setCurrentCameraId(videoDevices[0].deviceId);
            }
          })
          .catch(() => {});

        // Enable Camera & Microphone
        try {
          await roomInstance.localParticipant.enableCameraAndMicrophone();

          // Attach local camera video track
          const videoPublication = Array.from(
            roomInstance.localParticipant.videoTrackPublications.values()
          )[0] as LocalTrackPublication | undefined;

          if (videoPublication && videoPublication.track && localVideoRef.current) {
            videoPublication.track.attach(localVideoRef.current);
          }
          setIsCameraEnabled(true);
          setIsMicEnabled(true);
          setPermissionError(null);
          setPermissionBlocked(false);
          setShowPermissionModal(false);
        } catch (mediaErr: any) {
          console.warn('[VideoCall] Media permissions error on auto-join:', mediaErr);
          // Show the friendly permission dialogue modal for user gesture
          setShowPermissionModal(true);
          if (mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError') {
            setPermissionBlocked(true);
          }
          setPermissionError(
            'Camera or microphone access denied. Tap "Allow Camera & Mic" to connect video.'
          );

          // Graceful audio fallback so voice is preserved
          try {
            await roomInstance.localParticipant.setMicrophoneEnabled(true);
            setIsMicEnabled(true);
            setIsCameraEnabled(false);
          } catch {
            setIsMicEnabled(false);
            setIsCameraEnabled(false);
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('[VideoCall] Connection error:', err);
        if (isMounted) {
          setError(err.message || 'Could not connect to video consultation server.');
          setIsLoading(false);
        }
      }
    };

    initCall();

    return () => {
      isMounted = false;
      if (roomInstance) {
        roomInstance.disconnect();
      }
    };
  }, [bookingId]);

  // Direct user gesture to request permissions and unblock media
  const handleRequestPermissions = async (audioOnly = false) => {
    setIsRequestingPermission(true);
    setPermissionError(null);

    try {
      if (!audioOnly) {
        // Direct click/tap gesture triggers browser's native popup!
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }
        stream.getTracks().forEach((track) => track.stop());

        if (roomRef.current) {
          await roomRef.current.localParticipant.enableCameraAndMicrophone();
          setIsCameraEnabled(true);
          setIsMicEnabled(true);

          const videoPublication = Array.from(
            roomRef.current.localParticipant.videoTrackPublications.values()
          )[0] as LocalTrackPublication | undefined;

          if (videoPublication && videoPublication.track && localVideoRef.current) {
            videoPublication.track.attach(localVideoRef.current);
          }
        }
        setShowPermissionModal(false);
        setPermissionBlocked(false);
        setPermissionError(null);
      } else {
        // Audio only
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());

        if (roomRef.current) {
          await roomRef.current.localParticipant.setMicrophoneEnabled(true);
          await roomRef.current.localParticipant.setCameraEnabled(false);
          setIsMicEnabled(true);
          setIsCameraEnabled(false);
        }
        setShowPermissionModal(false);
        setPermissionBlocked(false);
        setPermissionError(null);
      }
    } catch (err: any) {
      console.warn('[VideoCall] Permission prompt result:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setPermissionBlocked(true);
        setShowPermissionModal(true);
        setPermissionError('Camera access was blocked by your browser settings.');
      } else if (!audioOnly) {
        // Try audio only fallback
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          if (roomRef.current) {
            await roomRef.current.localParticipant.setMicrophoneEnabled(true);
            await roomRef.current.localParticipant.setCameraEnabled(false);
            setIsMicEnabled(true);
            setIsCameraEnabled(false);
          }
          setShowPermissionModal(false);
          setPermissionBlocked(false);
          setPermissionError(null);
        } catch {
          setPermissionBlocked(true);
          setShowPermissionModal(true);
        }
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // 2. Call Duration Timer (runs when both participants are connected)
  useEffect(() => {
    if (hasRemoteParticipant && !isLoading) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasRemoteParticipant, isLoading]);

  // Format Duration seconds to MM:SS
  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (!roomRef.current) return;
    try {
      const nextState = !isMicEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      setIsMicEnabled(nextState);
    } catch (err: any) {
      console.error('Failed to toggle microphone', err);
      if (err?.name === 'NotAllowedError') {
        setShowPermissionModal(true);
        setPermissionBlocked(true);
      }
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (!roomRef.current) {
      setShowPermissionModal(true);
      return;
    }
    try {
      const nextState = !isCameraEnabled;
      if (nextState) {
        await roomRef.current.localParticipant.setCameraEnabled(true);
        setIsCameraEnabled(true);
        setPermissionError(null);
        setPermissionBlocked(false);

        const videoPublication = Array.from(
          roomRef.current.localParticipant.videoTrackPublications.values()
        )[0] as LocalTrackPublication | undefined;
        if (videoPublication && videoPublication.track && localVideoRef.current) {
          videoPublication.track.attach(localVideoRef.current);
        }
      } else {
        await roomRef.current.localParticipant.setCameraEnabled(false);
        setIsCameraEnabled(false);
      }
    } catch (err: any) {
      console.warn('Failed to toggle camera, opening permission modal:', err);
      setShowPermissionModal(true);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setPermissionBlocked(true);
      }
    }
  };

  // Switch Camera (if multiple devices like mobile front/back)
  const handleSwitchCamera = async () => {
    if (!roomRef.current || availableCameras.length < 2) return;
    try {
      const currentIndex = availableCameras.findIndex((c) => c.deviceId === currentCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextDevice = availableCameras[nextIndex];

      await roomRef.current.switchActiveDevice('videoinput', nextDevice.deviceId);
      setCurrentCameraId(nextDevice.deviceId);
    } catch (err) {
      console.error('Failed to switch camera', err);
    }
  };

  // Leave / End Call
  const handleEndCall = async () => {
    if (isEndingCall) return;
    if (!window.confirm('Are you sure you want to leave this video consultation?')) return;

    setIsEndingCall(true);
    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (bookingId) {
        await videoConsultationApi.endCall(bookingId);
      }
    } catch (err) {
      console.error('Error ending consultation', err);
    } finally {
      setIsEndingCall(false);
      navigate(`/booking/${bookingId}`);
    }
  };

  // Missing Configuration Screen
  if (configError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">LiveKit Cloud Setup Required</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{configError}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Required Backend Environment Variables:</p>
            <code className="block font-mono text-[11px] text-blue-600">LIVEKIT_URL=wss://...</code>
            <code className="block font-mono text-[11px] text-blue-600">LIVEKIT_API_KEY=...</code>
            <code className="block font-mono text-[11px] text-blue-600">LIVEKIT_API_SECRET=...</code>
          </div>
          <button
            onClick={() => navigate(`/booking/${bookingId}`)}
            className="w-full bg-primary text-white py-3 rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/25"
          >
            Back to Appointment Details
          </button>
        </div>
      </div>
    );
  }

  // Critical Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Consultation Unavailable</h2>
            <p className="text-xs text-slate-500 mt-2">{error}</p>
          </div>
          <button
            onClick={() => navigate(`/booking/${bookingId}`)}
            className="w-full bg-primary text-white py-3 rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/25"
          >
            Back to Appointment Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col select-none overflow-hidden font-sans">
      {/* Hidden Audio Element for Doctor's audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 sm:p-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/booking/${bookingId}`)}
            className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md rounded-full text-white transition-all"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {remoteParticipantName || (tokenData ? `Dr. ${tokenData.booking.doctorName}` : 'Doctor')}
              </h1>
            </div>
            <p className="text-[11px] text-slate-300">
              {tokenData?.booking.hospitalName || 'MediQuee Telehealth'} • OP Video Consultation
            </p>
          </div>
        </div>

        {/* Timer & Security Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono tracking-wider">{formatTimer(callDuration)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-900">
        {/* Remote Doctor Video (Full Screen) */}
        {hasRemoteParticipant ? (
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover sm:object-contain ${!hasRemoteVideo ? 'hidden' : ''}`}
            />
            {/* If doctor is connected but doctor's camera is off */}
            {!hasRemoteVideo && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Stethoscope className="w-10 h-10 sm:w-12 sm:12 text-blue-400" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </span>
                </div>
                <div className="max-w-xs space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {remoteParticipantName || 'Doctor'} Connected
                  </h3>
                  <p className="text-xs text-slate-400">
                    Voice audio is active. Doctor's camera is currently off or connecting.
                  </p>
                </div>
              </div>
            )}
            {/* Doctor Name overlay */}
            <div className="absolute bottom-28 sm:bottom-24 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-medium text-white flex items-center gap-2 border border-white/10">
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
              <span>{remoteParticipantName}</span>
              {!hasRemoteVideo && (
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                  Audio Only
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Waiting Screen when doctor has not joined yet */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:28 rounded-full bg-blue-500/10 border-2 border-primary/30 flex items-center justify-center text-primary shadow-2xl">
                <Stethoscope className="w-12 h-12 animate-pulse text-blue-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </span>
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Waiting for {remoteParticipantName || 'the Doctor'}...
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                You are in the secure consultation room. Your doctor has been notified and will connect
                shortly. Please keep this screen open.
              </p>
            </div>

            {remoteLeftMessage && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 max-w-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{remoteLeftMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{connectionStatus}</span>
            </div>
          </div>
        )}

        {/* Local Camera Preview Picture-in-Picture */}
        <div className="absolute top-20 right-4 sm:top-24 sm:right-6 z-20 w-28 sm:w-44 aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800 backdrop-blur-md">
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
              onClick={() => setShowPermissionModal(true)}
              className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-800 hover:bg-slate-750 p-2 cursor-pointer transition-colors"
              title="Click to allow camera"
            >
              <VideoOff className="w-6 h-6 mb-1 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300">Camera Off</span>
              <span className="text-[9px] text-slate-400 mt-0.5 underline">Tap to allow</span>
            </button>
          )}
          <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-white">
            You (Patient)
          </div>
        </div>

        {/* Camera Permission Alert Pill */}
        {(!isCameraEnabled || permissionError) && (
          <div className="absolute top-20 left-4 right-34 sm:left-6 sm:right-auto sm:max-w-md z-30 p-2.5 sm:p-3 rounded-2xl bg-amber-500/95 text-white text-xs shadow-xl flex items-center justify-between gap-2.5 backdrop-blur-md border border-amber-400/30">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-100" />
              <span className="truncate text-[11px] font-semibold">
                {permissionBlocked ? 'Camera access blocked in browser' : 'Camera is off • Doctor cannot see you'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPermissionModal(true)}
              className="px-2.5 py-1 bg-white text-slate-900 rounded-xl font-bold text-[11px] shrink-0 hover:bg-slate-100 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Allow / On
            </button>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-6 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4 sm:gap-6">
          {/* Mute / Unmute Mic */}
          <button
            onClick={handleToggleMic}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isMicEnabled
                ? 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/10'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
            }`}
            title={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Camera On / Off */}
          <button
            onClick={handleToggleCamera}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isCameraEnabled
                ? 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/10'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
            }`}
            title={isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCameraEnabled ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* Switch Camera (if multiple devices) */}
          {availableCameras.length > 1 && (
            <button
              onClick={handleSwitchCamera}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-lg active:scale-95"
              title="Switch Camera"
            >
              <Camera className="w-6 h-6" />
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            disabled={isEndingCall}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-xl shadow-rose-600/40"
            title="Leave / End Consultation"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>

        {/* Healthcare Consent & Privacy Note */}
        <p className="text-center text-[10px] text-slate-500 mt-4 tracking-wide">
          End-to-End Encrypted Telehealth • MediQuee Healthcare Cloud • Video is never recorded
        </p>
      </div>

      {/* Interactive Permission Request & Troubleshooting Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-center space-y-4 relative max-h-[90vh] overflow-y-auto">
            {/* Close button if user wants to dismiss and stay in call */}
            <button
              type="button"
              onClick={() => setShowPermissionModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
              <div
                className={`w-full h-full rounded-2xl flex items-center justify-center border ${
                  permissionBlocked
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}
              >
                {permissionBlocked ? (
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-pulse" />
                ) : (
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-md">
                <Mic className="w-4 h-4 text-white" />
              </span>
            </div>

            {/* Header Text */}
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {permissionBlocked ? 'Camera & Mic Access Blocked' : 'Allow Camera & Microphone'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                {permissionBlocked
                  ? 'Your mobile browser is currently blocking camera access. Follow the quick guide below to allow it.'
                  : `Dr. ${
                      tokenData?.booking?.doctorName?.replace(/^Dr\.\s*/i, '') || 'Doctor'
                    } is in the room. Please tap Allow so you can see and speak with each other.`}
              </p>
            </div>

            {/* Primary Action Button (Direct User Gesture) */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleRequestPermissions(false)}
                disabled={isRequestingPermission}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isRequestingPermission ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Requesting Permission...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>{permissionBlocked ? '🔄 Try Again / Allow Camera' : 'Allow Camera & Microphone'}</span>
                  </>
                )}
              </button>

              {/* Secondary Option: Voice / Audio Only */}
              <button
                type="button"
                onClick={() => handleRequestPermissions(true)}
                disabled={isRequestingPermission}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-slate-200 rounded-2xl font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Continue with Audio Only (Voice Call)</span>
              </button>
            </div>

            {/* Camera missing in Chrome Permissions troubleshooting card */}
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Camera not showing in permissions list?</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                If only <strong>Microphone</strong> is listed, your phone's Android system has not given the <strong>Chrome app</strong> permission to access the camera hardware.
              </p>
              <div className="bg-black/30 rounded-xl p-2.5 text-[11px] text-slate-200 space-y-1 font-medium border border-white/5">
                <div className="font-bold text-amber-300 text-[10px] uppercase tracking-wide">Quick Fix:</div>
                <div>1. Open your phone's <strong>Settings</strong> app.</div>
                <div>2. Tap <strong>Apps</strong> (or Application Manager) &rarr; <strong>Chrome</strong>.</div>
                <div>3. Tap <strong>Permissions</strong> &rarr; <strong>Camera</strong>.</div>
                <div>4. Select <strong>Allow while using the app</strong>.</div>
                <div>5. Come back here and tap <strong>Try Again</strong> above.</div>
              </div>
              <div className="text-[10px] text-slate-300 flex items-center justify-between pt-0.5">
                <span>💡 Or tap <strong>Reset permissions</strong> in the Chrome popup.</span>
              </div>
            </div>

            {/* Step-by-Step Mobile Instructions */}
            <div className="bg-slate-800/90 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
                <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>How to allow in mobile browser (Chrome/Safari):</span>
              </div>
              <ol className="text-[11px] text-slate-300 space-y-2 list-none pl-0">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong>🔒 Lock icon</strong> or <strong>Tune settings</strong> on the top left of the address bar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Tap <strong>Permissions</strong> (or <strong>Site settings</strong>).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Turn ON <strong>Camera</strong> and <strong>Microphone</strong> (select <strong>Allow</strong>).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <span>
                    Tap <strong>Try Again</strong> above or reload this page.
                  </span>
                </li>
              </ol>

              <div className="pt-1.5 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reload Consultation Page</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              🔒 End-to-End Encrypted Telehealth • MediQuee Healthcare Cloud
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultationPage;
