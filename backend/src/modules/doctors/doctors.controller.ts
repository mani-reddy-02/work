import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import { checkAndExpireDoctorOverrides, computeDoctorLiveStatus } from './doctor-override.service';
import { calculateHaversineDistanceKm, formatDistanceText, parseGeoParams } from '../../utils/geo';

const ALL_TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM'
];

export const getDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId.trim() : '';
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';
    const specialtyId = typeof req.query.specialtyId === 'string' ? req.query.specialtyId.trim() : '';
    let targetSpecialtyId = specialtyId;

    if (conditionId && !targetSpecialtyId) {
      const condition = await prisma.platformCondition.findUnique({
        where: { id: conditionId },
        select: { specialtyId: true }
      });
      if (condition) {
        targetSpecialtyId = condition.specialtyId;
      }
    }

    await checkAndExpireDoctorOverrides();

    const now = new Date();
    const whereClause: any = {
      role: Role.DOCTOR,
      active: true,
      AND: [
        {
          OR: [
            { inactiveUntil: null },
            { inactiveUntil: { lte: now } }
          ]
        }
      ]
    };

    const departmentName = typeof req.query.departmentName === 'string' 
      ? req.query.departmentName.trim() 
      : (typeof req.query.department === 'string' ? req.query.department.trim() : '');

    if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    } else if (departmentName) {
      whereClause.department = {
        name: { equals: departmentName, mode: 'insensitive' }
      };
    } else if (targetSpecialtyId) {
      whereClause.department = {
        specialtyId: targetSpecialtyId
      };
    }

    // Strict disease-driven filter: if conditionId was provided but no targetSpecialtyId was resolved, return empty array immediately or set impossible where clause
    if (conditionId && !targetSpecialtyId) {
      return res.json({ success: true, data: [] });
    }

    const consultationType = typeof req.query.consultationType === 'string'
      ? req.query.consultationType.trim().toLowerCase()
      : (typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : '');
    const isVideo = consultationType === 'video' || consultationType === 'video_consultation' || consultationType === 'video-consult' || consultationType === 'doctor';

    if (isVideo) {
      whereClause.hospital = {
        ...(whereClause.hospital || {}),
        services: { has: 'video_consultation' }
      };
      whereClause.doctorSchedules = {
        some: {
          isAvailable: true,
          videoStartTime: { not: null }
        }
      };
    } else if (consultationType === 'op' || consultationType === 'hospital-op' || consultationType === 'normal') {
      whereClause.hospital = {
        ...(whereClause.hospital || {}),
        services: { has: 'op_consultation' }
      };
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
            { department: { name: { contains: search, mode: 'insensitive' } } },
            { hospital: { name: { contains: search, mode: 'insensitive' } } },
            { hospital: { city: { contains: search, mode: 'insensitive' } } }
          ]
        }
      ];
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        designation: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
        avatar: true,
        dob: true,
        gender: true,
        bio: true,
        licenseNumber: true,
        licenseDocumentUrl: true,
        hospitalId: true,
        departmentId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            addressLine1: true,
            contactPhone: true,
            latitude: true,
            longitude: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            specialtyId: true,
            specialty: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const geo = parseGeoParams(req.query);

    let mappedDoctors = doctors.map(doc => {
      let distance: number | null = null;
      let distanceText: string | null = null;

      if (geo.hasCoords && doc.hospital?.latitude != null && doc.hospital?.longitude != null) {
        distance = calculateHaversineDistanceKm(geo.lat!, geo.lng!, doc.hospital.latitude, doc.hospital.longitude);
        distanceText = formatDistanceText(distance);
      }

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.department?.name || doc.specialization || doc.designation || 'Not specified',
        qualification: doc.qualification || 'Not specified',
        experience: doc.experienceYears ? `${doc.experienceYears}+ Years` : 'Not specified',
        designation: doc.designation || 'Not specified',
        avatar: doc.avatar,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospital?.name || 'Not assigned',
        hospitalAddress: doc.hospital?.addressLine1 || doc.hospital?.city || 'Not specified',
        hospitalPhone: doc.hospital?.contactPhone || undefined,
        hospitalCity: doc.hospital?.city || undefined,
        hospitalLatitude: doc.hospital?.latitude ?? null,
        hospitalLongitude: doc.hospital?.longitude ?? null,
        distance,
        distanceText,
        departmentId: doc.departmentId,
        department: doc.department?.name || 'Not assigned',
        bio: doc.bio || undefined,
        licenseNumber: doc.licenseNumber || undefined,
        licenseDocumentUrl: doc.licenseDocumentUrl || undefined,
        consultationFee: doc.consultationFee ?? undefined,
        consultInfo: doc.bio || `Specialist in ${doc.department?.name || 'their field'} with extensive clinical experience in patient diagnostics and treatment.`,
        fees: doc.consultationFee ? `₹${doc.consultationFee}` : 'Not specified',
        rating: 4.8
      };
    });

    // Apply strict location proximity filtering
    if (geo.hasCoords && geo.nearbyOnly) {
      mappedDoctors = mappedDoctors.filter(d => d.distance !== null && d.distance <= geo.radius);
      mappedDoctors.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    res.json({
      success: true,
      data: mappedDoctors,
      meta: {
        total: mappedDoctors.length,
        nearbyRadiusKm: geo.radius,
        hasLocationFilter: geo.hasCoords && geo.nearbyOnly,
        userLocation: geo.hasCoords ? { lat: geo.lat, lng: geo.lng } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    await checkAndExpireDoctorOverrides(id);

    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: Role.DOCTOR,
        active: true
      },
      select: {
        id: true,
        name: true,
        designation: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
        avatar: true,
        dob: true,
        gender: true,
        bio: true,
        licenseNumber: true,
        licenseDocumentUrl: true,
        hospitalId: true,
        departmentId: true,
        inactiveUntil: true,
        inactiveReason: true,
        overrideUpdatedBy: true,
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            addressLine1: true,
            contactPhone: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            specialtyId: true,
            specialty: {
              select: { id: true, name: true }
            }
          }
        },
        doctorSchedules: {
          select: {
            dayOfWeek: true,
            isAvailable: true,
            startTime: true,
            endTime: true,
            videoStartTime: true,
            videoEndTime: true
          }
        }
      }
    });

    if (!doctor || (doctor.inactiveUntil && new Date(doctor.inactiveUntil) > new Date())) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCTOR_UNAVAILABLE', message: 'Doctor not found or currently unavailable for consultations' }
      });
    }

    res.json({
      success: true,
      data: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.department?.name || doctor.specialization || doctor.designation || 'Not specified',
        qualification: doctor.qualification || 'Not specified',
        experience: doctor.experienceYears ? `${doctor.experienceYears}+ Years` : 'Not specified',
        designation: doctor.designation || 'Not specified',
        avatar: doctor.avatar,
        hospitalId: doctor.hospitalId,
        hospitalName: doctor.hospital?.name || 'Not assigned',
        hospitalAddress: doctor.hospital?.addressLine1 || doctor.hospital?.city || 'Not specified',
        hospitalPhone: doctor.hospital?.contactPhone || undefined,
        hospitalCity: doctor.hospital?.city || undefined,
        departmentId: doctor.departmentId,
        department: doctor.department?.name || 'Not assigned',
        bio: doctor.bio || undefined,
        licenseNumber: doctor.licenseNumber || undefined,
        licenseDocumentUrl: doctor.licenseDocumentUrl || undefined,
        consultationFee: doctor.consultationFee ?? undefined,
        doctorSchedules: doctor.doctorSchedules,
        consultInfo: doctor.bio || `Specialist in ${doctor.department?.name || 'their field'} with extensive clinical experience in patient diagnostics and treatment.`,
        fees: doctor.consultationFee ? `₹${doctor.consultationFee}` : 'Not specified',
        rating: 4.8
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id as string;
    const dateQuery = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const opType = typeof req.query.opType === 'string' ? req.query.opType.trim().toUpperCase() : 'OP';

    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR,
        active: true
      },
      select: { id: true, name: true }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found or inactive' }
      });
    }

    // Parse requested date or default to today
    let targetDate = new Date();
    if (dateQuery) {
      const parsed = new Date(dateQuery);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Fetch Doctor Schedule
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek: { equals: dayName, mode: 'insensitive' }
      }
    });
    
    if (!schedule || !schedule.isAvailable) {
      return res.json({
        success: true,
        data: {
          doctorId,
          doctorName: doctor.name,
          date: targetDate.toISOString().split('T')[0],
          allSlots: [],
          availableSlots: [],
          bookedSlots: [],
          isAvailable: false
        }
      });
    }
    
    const isVideoReq = opType === 'VIDEO' || opType === 'VIDEO CONSULTATION' || opType === 'VIDEO_CONSULTATION';
    const startBound = isVideoReq && schedule.videoStartTime ? schedule.videoStartTime : schedule.startTime;
    const endBound = isVideoReq && schedule.videoEndTime ? schedule.videoEndTime : schedule.endTime;
    
    // Generate slots
    const allSlots: string[] = [];
    const slotDuration = schedule.slotDurationMinutes || 30; // fallback to 30 min if not set
    
    const [startH, startM] = startBound.split(':').map(Number);
    const [endH, endM] = endBound.split(':').map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    while (currentMinutes + slotDuration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m.toString().padStart(2, '0');
      const displayHStr = displayH.toString().padStart(2, '0');
      
      allSlots.push(`${displayHStr}:${displayM} ${period}`);
      currentMinutes += slotDuration;
    }

    // Fetch existing active bookings for this doctor on this day
    const existingBookings = await prisma.oPBooking.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        timeSlot: true,
        appointmentDate: true
      }
    });

    const bookedSlots = new Set<string>();
    for (const b of existingBookings) {
      if (b.timeSlot) {
        bookedSlots.add(b.timeSlot);
      }
    }

    const now = new Date();
    const isToday = targetDate.toDateString() === now.toDateString();
    let currentKolkataTimeInMinutes = 0;
    
    if (isToday) {
      const kolkataTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).format(now);
      const [h, m] = kolkataTime.split(':').map(Number);
      currentKolkataTimeInMinutes = h * 60 + m;
    }

    const availableSlots = allSlots.filter(slot => {
      if (bookedSlots.has(slot)) return false;
      if (isToday) {
        const match = slot.match(/(\d+):(\d+)\s+(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          const slotMinutes = h * 60 + m;
          // Hide slot if its start time has already passed
          if (slotMinutes <= currentKolkataTimeInMinutes) return false;
        }
      }
      return true;
    });

    res.json({
      success: true,
      data: {
        doctorId,
        doctorName: doctor.name,
        date: targetDate.toISOString().split('T')[0],
        allSlots,
        availableSlots,
        bookedSlots: Array.from(bookedSlots),
        isAvailable: availableSlots.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/doctors/:id/active-status
 * Updates doctor override status (turn Inactive for X hours or reactivate immediately).
 * Accessible by RECEPTIONIST, HOSPITAL_ADMIN, DOCTOR, SUPER_ADMIN.
 */
export const updateDoctorActiveStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id as string;
    const { active, durationHours, durationMinutes, restOfToday, inactiveUntil: explicitUntil, reason } = req.body;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR
      },
      include: {
        department: { select: { id: true, name: true } },
        doctorSchedules: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor not found' } });
    }

    // Role-based authorization
    if (currentUser.role === Role.DOCTOR && currentUser.id !== doctorId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Doctors can only modify their own status' } });
    }

    if ((currentUser.role === Role.RECEPTIONIST || currentUser.role === Role.HOSPITAL_ADMIN) && currentUser.hospitalId !== doctor.hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only modify doctors in your hospital' } });
    }

    let calculatedInactiveUntil: Date | null = null;
    let savedReason: string | null = null;
    let updaterRole: string | null = null;

    if (active === false) {
      savedReason = typeof reason === 'string' && reason.trim() ? reason.trim() : 'Temporarily Unavailable';
      updaterRole = currentUser.role;

      if (restOfToday) {
        // Set to end of today in Asia/Kolkata
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        calculatedInactiveUntil = endOfDay;
      } else if (explicitUntil) {
        calculatedInactiveUntil = new Date(explicitUntil);
      } else {
        const totalMinutes = (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
        const minutesToUse = totalMinutes > 0 ? totalMinutes : 60; // default 1 hour
        calculatedInactiveUntil = new Date(Date.now() + minutesToUse * 60 * 1000);
      }
    }

    const updatedDoctor = await prisma.user.update({
      where: { id: doctorId },
      data: {
        inactiveUntil: calculatedInactiveUntil,
        inactiveReason: calculatedInactiveUntil ? savedReason : null,
        overrideUpdatedBy: calculatedInactiveUntil ? updaterRole : null,
        active: true // ensure base active is true so it seamlessly activates
      },
      include: {
        department: { select: { id: true, name: true } },
        doctorSchedules: true
      }
    });

    const statusSummary = computeDoctorLiveStatus(updatedDoctor);

    res.json({
      success: true,
      message: active === false 
        ? `Doctor set to inactive until ${statusSummary.reactivateAtTime || statusSummary.inactiveUntil}`
        : 'Doctor reactivated successfully',
      data: statusSummary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doctors/hospital/:hospitalId/status
 * or GET /api/v1/doctors/status
 * Fetches all hospital doctors with live base schedule, current override status, and remaining countdown.
 */
export const getHospitalDoctorsStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req.params.hospitalId || req.user?.hospitalId) as string;
    if (!hospitalId) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Hospital ID is required' } });
    }

    // Lazy auto-heal any expired doctor overrides
    await checkAndExpireDoctorOverrides();

    const doctors = await prisma.user.findMany({
      where: {
        hospitalId,
        role: Role.DOCTOR,
        active: true
      },
      include: {
        department: { select: { id: true, name: true } },
        doctorSchedules: true
      },
      orderBy: { name: 'asc' }
    });

    const summaries = doctors.map(doc => computeDoctorLiveStatus(doc));

    res.json({
      success: true,
      data: summaries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doctors/status/mine
 * Allows authenticated DOCTOR to fetch their live override status & base schedule.
 */
export const getMyDoctorStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    await checkAndExpireDoctorOverrides(doctorId);

    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR
      },
      include: {
        department: { select: { id: true, name: true } },
        doctorSchedules: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor not found' } });
    }

    const summary = computeDoctorLiveStatus(doctor);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

