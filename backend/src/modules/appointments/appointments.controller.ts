import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.user!.id;
    const {
      hospitalId,
      doctorId,
      departmentId,
      diseaseId,
      conditionId,
      date,
      timeSlot,
      slotTime,
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      reason,
      opType
    } = req.body;

    const requestedSlot = (timeSlot || slotTime || '').trim();

    if (!hospitalId || !doctorId || !date || !requestedSlot) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'hospitalId, doctorId, date, and timeSlot/slotTime are required.' }
      });
    }

    const actualConditionId = conditionId || diseaseId;

    // Run in a transaction for atomicity and double-booking protection
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify patient exists
      const patient = await tx.user.findUnique({
        where: { id: patientId }
      });
      if (!patient) {
        throw { status: 401, code: 'UNAUTHORIZED', message: 'User account not found' };
      }

      // 2. Verify hospital exists
      const hospital = await tx.hospital.findUnique({
        where: { id: hospitalId }
      });
      if (!hospital) {
        throw { status: 404, code: 'NOT_FOUND', message: 'Hospital not found' };
      }

      // 3. Verify doctor exists and has role DOCTOR
      const doctor = await tx.user.findFirst({
        where: {
          id: doctorId,
          role: Role.DOCTOR,
          active: true
        }
      });
      if (!doctor) {
        throw { status: 404, code: 'NOT_FOUND', message: 'Doctor not found or inactive' };
      }

      // 4. Verify doctor belongs to the specified hospital
      if (doctor.hospitalId !== hospitalId) {
        throw {
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Selected doctor does not belong to the selected hospital'
        };
      }

      // 5. Verify condition/disease if provided
      let validConditionId: string | null = null;
      if (actualConditionId) {
        const condition = await tx.platformCondition.findUnique({
          where: { id: actualConditionId }
        });
        if (!condition) {
          throw { status: 400, code: 'BAD_REQUEST', message: 'Invalid disease / condition selected' };
        }
        validConditionId = condition.id;
        
        // 5b. STRICT DISEASE-DRIVEN VALIDATION
        // Verify doctor belongs to a department that matches the disease's specialty
        if (doctor.departmentId) {
          const doctorDept = await tx.department.findUnique({
            where: { id: doctor.departmentId }
          });
          if (!doctorDept || doctorDept.specialtyId !== condition.specialtyId) {
            throw { status: 400, code: 'BAD_REQUEST', message: 'Doctor is not a specialist for the selected disease' };
          }
        } else {
           throw { status: 400, code: 'BAD_REQUEST', message: 'Doctor is not assigned to any specialty department' };
        }
      }

      // 6. Resolve department
      let resolvedDepartmentId = departmentId;
      if (resolvedDepartmentId) {
        const dept = await tx.department.findFirst({
          where: { id: resolvedDepartmentId, hospitalId }
        });
        if (!dept) {
          throw { status: 400, code: 'BAD_REQUEST', message: 'Invalid department for this hospital' };
        }
      } else if (doctor.departmentId) {
        resolvedDepartmentId = doctor.departmentId;
      } else {
        // Find any department in hospital, or default first
        const firstDept = await tx.department.findFirst({
          where: { hospitalId }
        });
        if (firstDept) {
          resolvedDepartmentId = firstDept.id;
        } else {
          // If hospital has no department, look for General Medicine or create one linked to General specialty
          const genSpec = await tx.platformSpecialty.findFirst({
            where: { name: { contains: 'General Medicine', mode: 'insensitive' } }
          }) || await tx.platformSpecialty.findFirst();

          if (!genSpec) {
            throw { status: 500, code: 'SERVER_ERROR', message: 'No clinical specialty configured' };
          }

          const createdDept = await tx.department.create({
            data: {
              hospitalId,
              name: 'General Medicine',
              code: 'GEN',
              specialtyId: genSpec.id
            }
          });
          resolvedDepartmentId = createdDept.id;
        }
      }

      // 7. Parse and validate date
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        throw { status: 400, code: 'BAD_REQUEST', message: 'Invalid appointment date format' };
      }

      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 7b. Verify doctor schedule and slot boundaries
      const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = await tx.doctorSchedule.findFirst({
        where: {
          doctorId,
          dayOfWeek: { equals: dayName, mode: 'insensitive' }
        }
      });

      if (!schedule || !schedule.isAvailable) {
        throw { status: 400, code: 'BAD_REQUEST', message: 'Doctor is not available on this day' };
      }

      const isVideoReq = opType === 'Video Consultation' || opType === 'VIDEO_CONSULTATION';
      const startBound = isVideoReq && schedule.videoStartTime ? schedule.videoStartTime : schedule.startTime;
      const endBound = isVideoReq && schedule.videoEndTime ? schedule.videoEndTime : schedule.endTime;

      const [reqH, reqM] = requestedSlot.split(':');
      const reqPeriod = requestedSlot.split(' ')[1];
      let reqMinutes = parseInt(reqH) * 60 + parseInt(reqM);
      if (reqPeriod === 'PM' && parseInt(reqH) !== 12) reqMinutes += 12 * 60;
      if (reqPeriod === 'AM' && parseInt(reqH) === 12) reqMinutes -= 12 * 60;

      const [startH, startM] = startBound.split(':');
      const startMinutes = parseInt(startH) * 60 + parseInt(startM);
      
      const [endH, endM] = endBound.split(':');
      const endMinutes = parseInt(endH) * 60 + parseInt(endM);

      if (reqMinutes < startMinutes || reqMinutes >= endMinutes) {
         throw { status: 400, code: 'BAD_REQUEST', message: 'Invalid time slot for the selected consultation type' };
      }

      // 8. Double-booking check: verify slot is not already taken
      const existingConflict = await tx.oPBooking.findFirst({
        where: {
          doctorId,
          OR: [
            { timeSlot: requestedSlot },
            { slotTime: requestedSlot }
          ],
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            not: 'CANCELLED'
          }
        }
      });

      if (existingConflict) {
        throw {
          status: 409,
          code: 'CONFLICT',
          message: 'This appointment slot is no longer available. Please select another time.'
        };
      }

      // 9. Create appointment
      const newBooking = await tx.oPBooking.create({
        data: {
          hospitalId,
          departmentId: resolvedDepartmentId,
          doctorId,
          patientId,
          conditionId: validConditionId,
          patientName: (patientName || req.user!.name || patient.name || 'Patient').trim(),
          patientPhone: patientPhone || req.user!.phone || patient.phone || null,
          patientAge: patientAge ? parseInt(patientAge, 10) : null,
          patientGender: patientGender || patient.gender || null,
          timeSlot: requestedSlot,
          slotTime: requestedSlot,
          reason: reason ? reason.trim() : null,
          opType: opType || 'Normal',
          status: 'WAITING',
          appointmentDate,
          fee: 500
        },
        include: {
          hospital: {
            select: { id: true, name: true, city: true, addressLine1: true, contactPhone: true }
          },
          doctor: {
            select: { id: true, name: true, designation: true, avatar: true }
          },
          department: {
            select: { id: true, name: true }
          },
          condition: {
            select: { id: true, name: true, description: true }
          }
        }
      });

      return newBooking;
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        appointmentId: result.id,
        hospitalId: result.hospitalId,
        hospitalName: result.hospital.name,
        hospitalAddress: result.hospital.addressLine1 || result.hospital.city,
        doctorId: result.doctorId,
        doctorName: result.doctor.name,
        departmentId: result.departmentId,
        departmentName: result.department.name,
        conditionId: result.conditionId,
        diseaseName: result.condition?.name || null,
        patientId: result.patientId,
        patientName: result.patientName,
        patientPhone: result.patientPhone,
        date: result.appointmentDate.toISOString().split('T')[0],
        timeSlot: result.timeSlot,
        status: result.status,
        opType: result.opType,
        fee: result.fee,
        reason: result.reason,
        createdAt: result.createdAt
      }
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { code: error.code || 'BAD_REQUEST', message: error.message }
      });
    }
    next(error);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params.id as string || '').trim();
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const userHospitalId = req.user!.hospitalId;

    if (!rawId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Appointment or patient ID is required' }
      });
    }

    const cleanId = rawId.replace(/^OP-?/i, '');
    const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    let booking = null;
    const includeRelations = {
      hospital: {
        select: { id: true, name: true, city: true, addressLine1: true, contactPhone: true }
      },
      doctor: {
        select: { id: true, name: true, designation: true, avatar: true }
      },
      department: {
        select: { id: true, name: true }
      },
      condition: {
        select: { id: true, name: true, description: true }
      },
      patient: {
        select: { id: true, name: true, phone: true, dob: true, gender: true, avatar: true }
      }
    };

    if (isFullUuid) {
      booking = await prisma.oPBooking.findUnique({
        where: { id: cleanId },
        include: includeRelations
      });
    }

    if (!booking) {
      booking = await prisma.oPBooking.findFirst({
        where: {
          OR: [
            { id: { startsWith: cleanId.toLowerCase() } },
            { id: { startsWith: cleanId.toUpperCase() } },
            { id: { startsWith: cleanId } },
            { patientId: cleanId }
          ]
        },
        orderBy: { appointmentDate: 'desc' },
        include: includeRelations
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment or patient record not found' }
      });
    }

    // Authorization: patient owner, doctor assigned or in hospital, hospital staff, or super admin
    const isPatient = booking.patientId === userId;
    const isHospitalStaff = userHospitalId && booking.hospitalId === userHospitalId;
    const isDoctor = booking.doctorId === userId || userRole === Role.DOCTOR;
    const isSuperAdmin = userRole === Role.SUPER_ADMIN;

    if (!isPatient && !isHospitalStaff && !isDoctor && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this appointment.' }
      });
    }

    // Retrieve past visits / consultations for this patient
    const pastBookings = await prisma.oPBooking.findMany({
      where: {
        hospitalId: booking.hospitalId,
        OR: [
          ...(booking.patientId ? [{ patientId: booking.patientId }] : []),
          ...(booking.patientPhone ? [{ patientPhone: booking.patientPhone }] : []),
          { patientName: booking.patientName }
        ]
      },
      include: {
        doctor: { select: { name: true } },
        condition: { select: { name: true } }
      },
      orderBy: { appointmentDate: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        id: booking.id,
        appointmentId: booking.id,
        hospitalId: booking.hospitalId,
        hospitalName: booking.hospital.name,
        hospitalAddress: booking.hospital.addressLine1 || booking.hospital.city,
        hospitalPhone: booking.hospital.contactPhone,
        doctorId: booking.doctorId,
        doctorName: booking.doctor.name,
        doctorDesignation: booking.doctor.designation,
        doctorAvatar: booking.doctor.avatar,
        departmentId: booking.departmentId,
        departmentName: booking.department.name,
        conditionId: booking.conditionId,
        diseaseName: booking.condition?.name || null,
        patientId: booking.patientId,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        patientAge: booking.patientAge,
        patientGender: booking.patientGender,
        date: booking.appointmentDate.toISOString().split('T')[0],
        timeSlot: booking.timeSlot || booking.slotTime,
        slotTime: booking.slotTime || booking.timeSlot,
        status: booking.status,
        opType: booking.opType,
        fee: booking.fee,
        reason: booking.reason,
        createdAt: booking.createdAt,
        pastVisits: pastBookings.map(v => ({
          id: v.id,
          date: v.appointmentDate.toISOString().split('T')[0],
          time: v.slotTime || v.timeSlot || '10:00 AM',
          doctor: v.doctor?.name || 'Doctor',
          diagnosis: v.condition?.name || v.opType || 'General Consultation',
          status: v.status
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const isDoctor = req.user!.role === 'DOCTOR';

    const bookings = await prisma.oPBooking.findMany({
      where: isDoctor ? { doctorId: userId } : { patientId: userId },
      include: {
        hospital: {
          select: { id: true, name: true, city: true, addressLine1: true }
        },
        doctor: {
          select: { id: true, name: true, designation: true, avatar: true }
        },
        department: {
          select: { id: true, name: true }
        },
        condition: {
          select: { id: true, name: true }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    });

    res.json({
      success: true,
      data: bookings.map(b => ({
        id: b.id,
        appointmentId: b.id,
        hospitalId: b.hospitalId,
        hospitalName: b.hospital.name,
        hospitalAddress: b.hospital.addressLine1 || b.hospital.city,
        doctorId: b.doctorId,
        doctorName: b.doctor.name,
        doctorDesignation: b.doctor.designation,
        doctorAvatar: b.doctor.avatar,
        departmentName: b.department.name,
        diseaseName: b.condition?.name || null,
        patientName: b.patientName,
        patientPhone: b.patientPhone,
        patientAge: b.patientAge,
        patientGender: b.patientGender,
        date: b.appointmentDate.toISOString().split('T')[0],
        timeSlot: b.timeSlot || b.slotTime,
        slotTime: b.slotTime || b.timeSlot,
        status: b.status,
        opType: b.opType,
        fee: b.fee,
        reason: b.reason,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};
