import crypto from 'crypto';
import { AccessToken, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { Role } from '@prisma/client';
import { VideoConsultationResponse, VideoConsultationStatusResponse } from './video.types';

export class VideoService {
  /**
   * Validate whether LiveKit Cloud credentials are fully supplied in backend environment
   */
  public static validateConfig(): { isConfigured: boolean; error?: string } {
    if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      return {
        isConfigured: false,
        error: 'LiveKit Cloud credentials are not fully configured. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in backend environment variables.',
      };
    }
    return { isConfigured: true };
  }

  /**
   * Helper to format duration seconds into MM:SS or HH:MM:SS
   */
  public static formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  /**
   * Generate LiveKit room token for an authorized user (Doctor or Patient)
   */
  public static async generateToken(
    bookingId: string,
    userId: string,
    userRole: Role
  ): Promise<VideoConsultationResponse> {
    const configCheck = this.validateConfig();
    if (!configCheck.isConfigured) {
      const err: any = new Error(configCheck.error);
      err.code = 'LIVEKIT_NOT_CONFIGURED';
      err.statusCode = 503;
      throw err;
    }

    // 1. Fetch booking with doctor, patient, hospital, and existing video consultation
    const booking = await prisma.oPBooking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: { select: { id: true, name: true, designation: true } },
        patient: { select: { id: true, name: true, phone: true } },
        hospital: { select: { id: true, name: true } },
        videoConsultation: true,
      },
    });

    if (!booking) {
      const err: any = new Error('Appointment booking not found');
      err.code = 'BOOKING_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 2. Reject cancelled appointments
    if (booking.status === 'CANCELLED') {
      const err: any = new Error('Cannot join video consultation for a cancelled appointment');
      err.code = 'APPOINTMENT_CANCELLED';
      err.statusCode = 400;
      throw err;
    }

    // 3. Verify user authorization
    const isPatient = userRole === Role.PATIENT && (booking.patientId === userId || booking.patient?.id === userId);
    const isAssignedDoctor = userRole === Role.DOCTOR && booking.doctorId === userId;
    const isHospitalStaff = userRole === Role.HOSPITAL_ADMIN || userRole === Role.SUPER_ADMIN;

    if (!isPatient && !isAssignedDoctor && !isHospitalStaff) {
      const err: any = new Error('Access denied: You are not authorized to join this consultation');
      err.code = 'FORBIDDEN';
      err.statusCode = 403;
      throw err;
    }

    // 4. Retrieve or create consultation record (handling concurrent creation safely)
    let consultation = booking.videoConsultation;

    if (!consultation) {
      // Create unique, unpredictable room identifier
      const roomIdentifier = `mq_room_${booking.id}_${crypto.randomBytes(6).toString('hex')}`;

      try {
        consultation = await prisma.videoConsultation.create({
          data: {
            bookingId: booking.id,
            roomName: roomIdentifier,
            status: 'WAITING',
            scheduledDate: booking.appointmentDate,
            metadata: {
              initiatedBy: userId,
              role: userRole,
            },
          },
        });
      } catch (createErr: any) {
        // Fallback for race condition: retrieve existing consultation
        const existing = await prisma.videoConsultation.findUnique({
          where: { bookingId: booking.id },
        });
        if (existing) {
          consultation = existing;
        } else {
          throw createErr;
        }
      }
    }

    // 5. Build participant identity and token
    const participantIdentity = isPatient
      ? `patient_${userId}`
      : `doctor_${userId}`;

    const participantName = isPatient
      ? booking.patientName || booking.patient?.name || 'Patient'
      : `Dr. ${booking.doctor.name.replace(/^Dr\.\s*/i, '')}`;

    const at = new AccessToken(env.LIVEKIT_API_KEY!, env.LIVEKIT_API_SECRET!, {
      identity: participantIdentity,
      name: participantName,
      ttl: '2h', // 2 hour duration token
      metadata: JSON.stringify({
        role: userRole,
        name: participantName,
        bookingId: booking.id,
        hospitalId: booking.hospitalId,
      }),
    });

    at.addGrant({
      room: consultation.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return {
      token,
      serverUrl: env.LIVEKIT_URL!,
      roomName: consultation.roomName,
      consultation: {
        id: consultation.id,
        bookingId: consultation.bookingId,
        roomName: consultation.roomName,
        status: consultation.status,
        durationSeconds: consultation.durationSeconds,
        startedAt: consultation.startedAt,
        endedAt: consultation.endedAt,
      },
      participant: {
        identity: participantIdentity,
        name: participantName,
        role: userRole,
      },
      booking: {
        id: booking.id,
        patientName: booking.patientName,
        doctorName: booking.doctor.name,
        doctorDesignation: booking.doctor.designation,
        hospitalName: booking.hospital.name,
        appointmentDate: booking.appointmentDate,
        timeSlot: booking.timeSlot,
        status: booking.status,
      },
    };
  }

  /**
   * Retrieve consultation status, timing, and participants
   */
  public static async getStatus(
    bookingId: string,
    userId: string,
    userRole: Role
  ): Promise<VideoConsultationStatusResponse> {
    const booking = await prisma.oPBooking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true, phone: true } },
        hospital: { select: { id: true, name: true } },
        videoConsultation: true,
      },
    });

    if (!booking) {
      const err: any = new Error('Appointment booking not found');
      err.code = 'BOOKING_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // Verify access
    const isPatient = userRole === Role.PATIENT && (booking.patientId === userId || booking.patient?.id === userId);
    const isAssignedDoctor = userRole === Role.DOCTOR && booking.doctorId === userId;
    const isHospitalStaff = userRole === Role.HOSPITAL_ADMIN || userRole === Role.SUPER_ADMIN;

    if (!isPatient && !isAssignedDoctor && !isHospitalStaff) {
      const err: any = new Error('Access denied: You are not authorized to view this consultation status');
      err.code = 'FORBIDDEN';
      err.statusCode = 403;
      throw err;
    }

    const consultation = booking.videoConsultation;
    const durationSec = consultation?.durationSeconds || 0;

    return {
      id: consultation?.id || 'pending',
      bookingId: booking.id,
      roomName: consultation?.roomName || '',
      status: consultation?.status || (booking.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED'),
      scheduledDate: consultation?.scheduledDate || booking.appointmentDate,
      startedAt: consultation?.startedAt || null,
      endedAt: consultation?.endedAt || null,
      durationSeconds: durationSec,
      formattedDuration: this.formatDuration(durationSec),
      patientJoinedAt: consultation?.patientJoinedAt || null,
      doctorJoinedAt: consultation?.doctorJoinedAt || null,
      booking: {
        id: booking.id,
        patientName: booking.patientName,
        patientPhone: isAssignedDoctor || isHospitalStaff ? booking.patientPhone : undefined,
        doctorName: booking.doctor.name,
        hospitalName: booking.hospital.name,
        status: booking.status,
        appointmentDate: booking.appointmentDate,
        timeSlot: booking.timeSlot,
      },
    };
  }

  /**
   * End or finalize a video consultation room explicitly
   */
  public static async endConsultation(
    bookingId: string,
    userId: string,
    userRole: Role
  ): Promise<VideoConsultationStatusResponse> {
    const booking = await prisma.oPBooking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: true,
        patient: true,
        hospital: true,
        videoConsultation: true,
      },
    });

    if (!booking || !booking.videoConsultation) {
      const err: any = new Error('Active video consultation not found');
      err.code = 'CONSULTATION_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // Authorization
    const isPatient = userRole === Role.PATIENT && booking.patientId === userId;
    const isAssignedDoctor = userRole === Role.DOCTOR && booking.doctorId === userId;
    const isHospitalStaff = userRole === Role.HOSPITAL_ADMIN || userRole === Role.SUPER_ADMIN;

    if (!isPatient && !isAssignedDoctor && !isHospitalStaff) {
      const err: any = new Error('Access denied: You cannot end this consultation');
      err.code = 'FORBIDDEN';
      err.statusCode = 403;
      throw err;
    }

    const consultation = booking.videoConsultation;
    const now = new Date();

    // Calculate duration accurately if both had connected and startedAt was set
    let finalDuration = consultation.durationSeconds;
    if (consultation.startedAt && consultation.status === 'IN_PROGRESS') {
      const elapsed = Math.floor((now.getTime() - consultation.startedAt.getTime()) / 1000);
      if (elapsed > 0) {
        finalDuration += elapsed;
      }
    }

    const updatedConsultation = await prisma.videoConsultation.update({
      where: { id: consultation.id },
      data: {
        status: 'COMPLETED',
        endedAt: now,
        durationSeconds: finalDuration,
      },
    });

    // Update appointment booking status to COMPLETED if doctor ended it
    if (isAssignedDoctor || isHospitalStaff) {
      await prisma.oPBooking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' },
      });
    }

    // Optionally delete LiveKit Cloud room via RoomServiceClient if configured
    if (env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET) {
      try {
        const roomClient = new RoomServiceClient(
          env.LIVEKIT_URL.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://'),
          env.LIVEKIT_API_KEY,
          env.LIVEKIT_API_SECRET
        );
        await roomClient.deleteRoom(consultation.roomName);
      } catch (liveKitErr) {
        // Non-blocking if room was already empty or deleted
      }
    }

    return {
      id: updatedConsultation.id,
      bookingId: booking.id,
      roomName: updatedConsultation.roomName,
      status: updatedConsultation.status,
      scheduledDate: updatedConsultation.scheduledDate,
      startedAt: updatedConsultation.startedAt,
      endedAt: updatedConsultation.endedAt,
      durationSeconds: updatedConsultation.durationSeconds,
      formattedDuration: this.formatDuration(updatedConsultation.durationSeconds),
      patientJoinedAt: updatedConsultation.patientJoinedAt,
      doctorJoinedAt: updatedConsultation.doctorJoinedAt,
      booking: {
        id: booking.id,
        patientName: booking.patientName,
        doctorName: booking.doctor.name,
        hospitalName: booking.hospital.name,
        status: isAssignedDoctor || isHospitalStaff ? 'COMPLETED' : booking.status,
        appointmentDate: booking.appointmentDate,
        timeSlot: booking.timeSlot,
      },
    };
  }

  /**
   * Process LiveKit Webhook event idempotently and accurately
   */
  public static async processWebhook(rawBody: string, authHeader: string): Promise<any> {
    if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      const err: any = new Error('LiveKit credentials not configured for webhook processing');
      err.code = 'LIVEKIT_NOT_CONFIGURED';
      err.statusCode = 500;
      throw err;
    }

    const receiver = new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
    let event: any;
    try {
      event = await receiver.receive(rawBody, authHeader);
    } catch (err: any) {
      const authErr: any = new Error('Invalid LiveKit webhook signature');
      authErr.code = 'WEBHOOK_SIGNATURE_INVALID';
      authErr.statusCode = 401;
      throw authErr;
    }

    const roomName = event.room?.name;
    if (!roomName) {
      return { received: true, ignored: 'Missing room name' };
    }

    const consultation = await prisma.videoConsultation.findUnique({
      where: { roomName },
      include: { booking: true },
    });

    if (!consultation) {
      return { received: true, ignored: 'Consultation room not found' };
    }

    const now = new Date();

    switch (event.event) {
      case 'participant_joined': {
        const identity = event.participant?.identity || '';
        const isDoctor = identity.startsWith('doctor_');
        const isPatient = identity.startsWith('patient_');

        const updateData: any = {};
        if (isDoctor && !consultation.doctorJoinedAt) {
          updateData.doctorJoinedAt = now;
        }
        if (isPatient && !consultation.patientJoinedAt) {
          updateData.patientJoinedAt = now;
        }

        // Determine if BOTH are now present
        const hasDoctor = isDoctor || consultation.doctorJoinedAt != null;
        const hasPatient = isPatient || consultation.patientJoinedAt != null;

        if (hasDoctor && hasPatient && !consultation.startedAt) {
          // Consultation officially begins when BOTH participants are connected
          updateData.startedAt = now;
          updateData.status = 'IN_PROGRESS';

          // Update booking status
          await prisma.oPBooking.update({
            where: { id: consultation.bookingId },
            data: { status: 'IN_CONSULTATION' },
          });
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.videoConsultation.update({
            where: { id: consultation.id },
            data: updateData,
          });
        }
        break;
      }

      case 'participant_left': {
        // If in progress and someone leaves, track the elapsed duration
        if (consultation.status === 'IN_PROGRESS' && consultation.startedAt) {
          const elapsed = Math.floor((now.getTime() - consultation.startedAt.getTime()) / 1000);
          if (elapsed > 0) {
            await prisma.videoConsultation.update({
              where: { id: consultation.id },
              data: {
                durationSeconds: { increment: elapsed },
                startedAt: null, // Reset interval until reconnection
                status: 'WAITING',
              },
            });
          }
        }
        break;
      }

      case 'room_finished': {
        // Finalize consultation
        let additionalSeconds = 0;
        if (consultation.startedAt && consultation.status === 'IN_PROGRESS') {
          additionalSeconds = Math.max(0, Math.floor((now.getTime() - consultation.startedAt.getTime()) / 1000));
        }

        await prisma.videoConsultation.update({
          where: { id: consultation.id },
          data: {
            status: 'COMPLETED',
            endedAt: now,
            durationSeconds: { increment: additionalSeconds },
          },
        });

        // Ensure appointment booking is completed
        await prisma.oPBooking.update({
          where: { id: consultation.bookingId },
          data: { status: 'COMPLETED' },
        });
        break;
      }

      default:
        break;
    }

    return { received: true, processed: event.event };
  }

  /**
   * Retrieve video consultation history for the authenticated user
   */
  public static async getHistory(userId: string, userRole: Role): Promise<any[]> {
    let whereClause: any = {};

    if (userRole === Role.PATIENT) {
      whereClause = { booking: { patientId: userId } };
    } else if (userRole === Role.DOCTOR) {
      whereClause = { booking: { doctorId: userId } };
    } else if (userRole === Role.HOSPITAL_ADMIN) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { hospitalId: true },
      });
      whereClause = { booking: { hospitalId: user?.hospitalId } };
    }

    const records = await prisma.videoConsultation.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            doctor: { select: { id: true, name: true, designation: true } },
            patient: { select: { id: true, name: true, phone: true } },
            hospital: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      roomName: r.roomName,
      status: r.status,
      scheduledDate: r.scheduledDate,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      durationSeconds: r.durationSeconds,
      formattedDuration: this.formatDuration(r.durationSeconds),
      patientJoinedAt: r.patientJoinedAt,
      doctorJoinedAt: r.doctorJoinedAt,
      booking: {
        id: r.booking.id,
        patientName: r.booking.patientName,
        doctorName: r.booking.doctor.name,
        doctorDesignation: r.booking.doctor.designation,
        hospitalName: r.booking.hospital.name,
        appointmentDate: r.booking.appointmentDate,
        timeSlot: r.booking.timeSlot,
        status: r.booking.status,
      },
    }));
  }
}
