import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { sendNotification } from '../notifications/notifications.service';

export const createWalkInBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { departmentId, doctorId, patientName, patientPhone, patientAge, patientGender, opType, fee } = req.body;

    // Verify department belongs to hospital
    const department = await prisma.department.findFirst({
      where: { id: departmentId, hospitalId }
    });
    if (!department) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid department' } });
    }

    // Verify doctor belongs to hospital and is actually a doctor
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, hospitalId, role: 'DOCTOR' }
    });
    if (!doctor) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid doctor' } });
    }

    const assignedSlot = req.body.timeSlot || req.body.slotTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const apptDate = req.body.appointmentDate ? new Date(req.body.appointmentDate) : new Date();

    // Prevent double-booking for the specified slot if doctorId and slot are provided
    const startOfAppt = new Date(apptDate);
    startOfAppt.setHours(0, 0, 0, 0);
    const endOfAppt = new Date(apptDate);
    endOfAppt.setHours(23, 59, 59, 999);

    const existingBooking = await prisma.oPBooking.findFirst({
      where: {
        doctorId,
        appointmentDate: { gte: startOfAppt, lte: endOfAppt },
        timeSlot: assignedSlot,
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_ALREADY_BOOKED',
          message: `The selected time slot (${assignedSlot}) is already booked for this doctor.`
        }
      });
    }

    const hospitalConfig = await prisma.hospital.findUnique({ where: { id: hospitalId }, select: { hospitalShare: true } });
    const hospitalSharePct = hospitalConfig?.hospitalShare ?? 80.0;
    const mediqueeCommissionPct = 100.0 - hospitalSharePct;
    const feeAmount = fee || 0;
    const hospitalAmt = feeAmount * (hospitalSharePct / 100);
    const mediqueeAmt = feeAmount * (mediqueeCommissionPct / 100);

    const booking = await prisma.oPBooking.create({
      data: {
        hospitalId,
        departmentId,
        doctorId,
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        opType: opType || 'Normal',
        fee: feeAmount,
        timeSlot: assignedSlot,
        status: 'WAITING',
        appointmentDate: apptDate,
        hospitalSharePercentage: hospitalSharePct,
        mediqueeCommissionPercentage: mediqueeCommissionPct,
        hospitalAmount: hospitalAmt,
        mediqueeAmount: mediqueeAmt
      },
      include: {
        doctor: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } }
      }
    });

    sendNotification({
      hospitalId,
      userId: booking.doctorId,
      title: 'Walk-In OP Registered',
      message: `Patient ${booking.patientName} registered for Dr. ${booking.doctor?.name || 'Doctor'} (${booking.department?.name || 'OP'})`,
      type: 'appointment',
      metadata: { 
        bookingId: booking.id, 
        patientName: booking.patientName,
        targetRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR']
      },
      targetRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR']
    }).catch(console.error);

    // Trigger Meta WhatsApp appointment confirmation
    import('../whatsapp/whatsapp-notifications.service').then(({ WhatsAppNotificationService }) => {
      WhatsAppNotificationService.sendAppointmentConfirmation(booking.id).catch(console.error);
    }).catch(console.error);

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const getTodayBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { date, range, doctorId, departmentId, status, type, opType, excludeVideo, opOnly } = req.query;

    const whereClause: any = {
      hospitalId
    };

    if (req.user!.role === 'DOCTOR') {
      whereClause.doctorId = req.user!.id;
    } else if (doctorId && typeof doctorId === 'string') {
      whereClause.doctorId = doctorId;
    }

    if (departmentId && typeof departmentId === 'string') {
      whereClause.departmentId = departmentId;
    }

    if (status && typeof status === 'string') {
      if (status.includes(',')) {
        whereClause.status = { in: status.split(',').map(s => s.trim()) };
      } else {
        whereClause.status = status;
      }
    }

    // Explicit opType filter if provided
    if (opType && typeof opType === 'string') {
      whereClause.opType = opType;
    }

    // Filter OP vs Video Consultations:
    // Receptionist in queue should strictly see only physical in-person OP bookings, NOT video consultations.
    const isOpOnly = 
      req.user!.role === 'RECEPTIONIST' || 
      type === 'OP' || 
      excludeVideo === 'true' || 
      opOnly === 'true';

    if (isOpOnly) {
      whereClause.videoConsultation = null;
      whereClause.NOT = [
        ...(Array.isArray(whereClause.NOT) ? whereClause.NOT : whereClause.NOT ? [whereClause.NOT] : []),
        { opType: { contains: 'video', mode: 'insensitive' } },
        { opType: { contains: 'online', mode: 'insensitive' } }
      ];
    } else if (type === 'VIDEO' || req.query.videoOnly === 'true') {
      whereClause.OR = [
        { opType: { contains: 'video', mode: 'insensitive' } },
        { videoConsultation: { isNot: null } }
      ];
    }

    // Date filtering logic
    if (date && typeof date === 'string') {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        whereClause.appointmentDate = {
          gte: startOfDay,
          lte: endOfDay
        };
      }
    } else if (range === 'upcoming') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      whereClause.appointmentDate = {
        gte: todayStart
      };
      if (!whereClause.status) {
        whereClause.status = { not: 'CANCELLED' };
      }
    } else if (range === 'all') {
      // No date filter applied - all hospital appointments
    } else {
      // Default: today only
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const bookings = await prisma.oPBooking.findMany({
      where: whereClause,
      include: {
        doctor: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
        condition: { select: { id: true, name: true } },
        videoConsultation: { select: { id: true, roomName: true, status: true } }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const rawId = (req.params.id as string || '').trim();
    const cleanId = rawId.replace(/^OP-?/i, '');
    let { status, reason, notes } = req.body;

    // Normalize operational statuses to database BookingStatus enum
    let normalizedStatus: string = status;
    if (status === 'IN_PROGRESS') {
      normalizedStatus = 'IN_CONSULTATION';
    } else if (status === 'CONFIRMED' || status === 'ARRIVED' || status === 'CALLED') {
      normalizedStatus = 'WAITING';
    }

    const whereClause: any = {
      hospitalId,
      OR: [
        { id: cleanId },
        { id: { startsWith: cleanId } },
        { id: rawId }
      ]
    };
    if (req.user!.role === 'DOCTOR') {
      whereClause.doctorId = req.user!.id;
    }

    const existing = await prisma.oPBooking.findFirst({
      where: whereClause
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found or not accessible' } });
    }

    // Business rule: Terminal states cannot be transitioned
    if (existing.status === 'COMPLETED' && normalizedStatus !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TRANSITION', message: 'Cannot modify an already completed appointment' }
      });
    }
    if (existing.status === 'CANCELLED' && normalizedStatus !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TRANSITION', message: 'Cannot modify a cancelled appointment' }
      });
    }

    const updateData: any = { status: normalizedStatus };
    if (reason !== undefined) updateData.reason = reason;
    else if (notes !== undefined) updateData.reason = notes;

    const updated = await prisma.oPBooking.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        doctor: { select: { id: true, name: true, avatar: true, specialization: true } },
        department: { select: { id: true, name: true } },
        hospital: { select: { id: true, name: true, city: true, contactPhone: true } }
      }
    });

    // 1. Send live operational notification to hospital staff (Receptionist, Hospital Admin, Doctor)
    const staffTitle = updated.status === 'IN_CONSULTATION'
      ? 'Consultation Started'
      : updated.status === 'COMPLETED'
      ? 'Consultation Completed'
      : 'Appointment Status Changed';

    sendNotification({
      hospitalId,
      userId: updated.doctorId,
      title: staffTitle,
      message: `${updated.patientName}'s appointment is now ${updated.status.replace(/_/g, ' ')}`,
      type: 'activity',
      metadata: { 
        bookingId: updated.id, 
        status: updated.status, 
        patientName: updated.patientName,
        targetRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR']
      },
      targetRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR']
    }).catch(console.error);

    // 2. Real-time notification for Patient if registered user
    if (updated.patientId) {
      const patientTitle = updated.status === 'IN_CONSULTATION'
        ? 'Consultation Started'
        : updated.status === 'COMPLETED'
        ? 'Consultation Completed'
        : 'Appointment Status Updated';

      const patientMessage = updated.status === 'IN_CONSULTATION'
        ? `Your consultation with Dr. ${updated.doctor?.name || 'Doctor'} has started. Please proceed to ${updated.department?.name || 'the consultation room'}.`
        : updated.status === 'COMPLETED'
        ? `Your consultation with Dr. ${updated.doctor?.name || 'Doctor'} is complete. Thank you for visiting ${updated.hospital?.name || 'MediQuee Hospital'}.`
        : `Your appointment is now ${updated.status.replace(/_/g, ' ')}.`;

      sendNotification({
        hospitalId: null,
        userId: updated.patientId,
        title: patientTitle,
        message: patientMessage,
        type: 'appointment',
        metadata: {
          bookingId: updated.id,
          status: updated.status,
          targetRoles: ['PATIENT']
        },
        targetRoles: ['PATIENT']
      }).catch(console.error);
    }

    // If cancelled, trigger Meta WhatsApp cancellation notification
    if (updated.status === 'CANCELLED') {
      import('../whatsapp/whatsapp-notifications.service').then(({ WhatsAppNotificationService }) => {
        WhatsAppNotificationService.sendAppointmentCancellation(updated.id, reason || notes).catch(console.error);
      }).catch(console.error);
    }

    res.json({ 
      success: true, 
      data: {
        ...updated,
        updatedAt: updated.updatedAt
      },
      message: `Appointment status updated to ${updated.status}`
    });
  } catch (error) {
    next(error);
  }
};
