import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { sendNotification } from '../notifications/notifications.service';

export const createWalkInBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const {
      departmentId,
      doctorId,
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      place,
      reason,
      symptoms,
      opType,
      fee,
      consultationFee
    } = req.body;

    // Verify department belongs to hospital
    const department = await prisma.department.findFirst({
      where: { id: departmentId, hospitalId }
    });
    if (!department) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid department' } });
    }

    // Resolve doctor: either explicit doctorId or any active doctor in the department
    let targetDoctorId = doctorId;
    let doctor = null;

    if (targetDoctorId && targetDoctorId !== 'any' && targetDoctorId !== '') {
      doctor = await prisma.user.findFirst({
        where: { id: targetDoctorId, hospitalId, role: 'DOCTOR' }
      });
    }

    if (!doctor) {
      // Find first active doctor in this department
      doctor = await prisma.user.findFirst({
        where: { departmentId, hospitalId, role: 'DOCTOR', active: true }
      });
    }

    if (!doctor) {
      // Fallback: any doctor in this hospital
      doctor = await prisma.user.findFirst({
        where: { hospitalId, role: 'DOCTOR', active: true }
      });
    }

    if (!doctor) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No active doctor found for this department' } });
    }

    targetDoctorId = doctor.id;

    const assignedSlot = req.body.timeSlot || req.body.slotTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const apptDate = req.body.appointmentDate ? new Date(req.body.appointmentDate) : new Date();

    const startOfAppt = new Date(apptDate);
    startOfAppt.setHours(0, 0, 0, 0);
    const endOfAppt = new Date(apptDate);
    endOfAppt.setHours(23, 59, 59, 999);

    // Calculate next sequential queue Token Number for today for this doctor
    const doctorTodayCount = await prisma.oPBooking.count({
      where: {
        doctorId: targetDoctorId,
        appointmentDate: { gte: startOfAppt, lte: endOfAppt }
      }
    });
    const nextTokenNum = doctorTodayCount + 1;

    // Safe Find-or-Create Patient User record by phone without unique constraint errors (P2002)
    let patientUser = null;
    const cleanPhone = patientPhone ? String(patientPhone).trim() : null;

    if (cleanPhone) {
      patientUser = await prisma.user.findFirst({
        where: { phone: cleanPhone }
      });

      if (!patientUser) {
        try {
          patientUser = await prisma.user.create({
            data: {
              phone: cleanPhone,
              name: (patientName || 'Walk-In Patient').trim(),
              role: 'PATIENT',
              passwordHash: '',
              gender: patientGender || null,
              address: place ? String(place).trim() : null,
              active: true
            }
          });
        } catch (createErr) {
          // Concurrency safety: if another request created the user concurrently, fetch it
          patientUser = await prisma.user.findFirst({
            where: { phone: cleanPhone }
          });
        }
      } else {
        // If existing patient has no address, update it with place
        if (place && !patientUser.address) {
          await prisma.user.update({
            where: { id: patientUser.id },
            data: { address: String(place).trim() }
          }).catch(() => {});
        }
      }
    }

    // ZERO platform commission and ZERO platform payouts for Walk-In bookings:
    // Walk-Ins pay directly at hospital counter (cash/UPI)
    const feeAmount = Number(consultationFee ?? fee ?? doctor.consultationFee ?? 0);

    const booking = await prisma.oPBooking.create({
      data: {
        hospitalId,
        departmentId,
        doctorId: targetDoctorId,
        patientId: patientUser?.id || null,
        patientName: (patientName || 'Walk-In Patient').trim(),
        patientPhone: cleanPhone,
        patientAge: patientAge !== undefined && patientAge !== null && !isNaN(Number(patientAge)) ? Number(patientAge) : null,
        patientGender: patientGender || null,
        place: place ? String(place).trim() : null,
        reason: (reason || symptoms || '').trim() || null,
        opType: opType || 'Normal',
        fee: feeAmount,
        timeSlot: assignedSlot,
        slotTime: assignedSlot,
        status: 'WAITING',
        appointmentDate: apptDate,
        isWalkIn: true,
        payoutEligible: false,
        tokenNumber: nextTokenNum,
        hospitalSharePercentage: 100.0,
        mediqueeCommissionPercentage: 0.0,
        hospitalAmount: 0.0,
        mediqueeAmount: 0.0
      },
      include: {
        doctor: { select: { id: true, name: true, avatar: true, consultationFee: true } },
        department: { select: { id: true, name: true } }
      }
    });

    sendNotification({
      hospitalId,
      userId: booking.doctorId,
      title: `Walk-In Token #${String(nextTokenNum).padStart(2, '0')}`,
      message: `Patient ${booking.patientName} (${place || 'Walk-In'}) checked in for Dr. ${booking.doctor?.name || 'Doctor'} - Token #${String(nextTokenNum).padStart(2, '0')}`,
      type: 'appointment',
      metadata: { 
        bookingId: booking.id, 
        patientName: booking.patientName,
        tokenNumber: nextTokenNum,
        token: `Token #${String(nextTokenNum).padStart(2, '0')}`,
        targetRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR']
      },
      targetRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR']
    }).catch(console.error);

    // Trigger Meta WhatsApp appointment confirmation if phone is valid
    if (cleanPhone) {
      import('../whatsapp/whatsapp-notifications.service').then(({ WhatsAppNotificationService }) => {
        WhatsAppNotificationService.sendAppointmentConfirmation(booking.id).catch(console.error);
      }).catch(console.error);
    }

    const tokenFormatted = `Token #${String(nextTokenNum).padStart(2, '0')}`;
    const opTokenCode = `OP-${String(nextTokenNum).padStart(2, '0')}`;

    res.status(201).json({
      success: true,
      data: {
        ...booking,
        token: tokenFormatted,
        tokenNumber: nextTokenNum,
        opToken: opTokenCode
      }
    });
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
        patient: { select: { id: true, name: true, phone: true, address: true } },
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
