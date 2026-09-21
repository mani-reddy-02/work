import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, DosageTiming, DoctorPresenceStatus } from '@prisma/client';

/**
 * POST /api/v1/clinical/consultations/:bookingId/record
 * Atomically records patient vitals, diagnosis, prescriptions, and lab orders.
 * Marks the appointment as COMPLETED while strictly preserving OPBooking.reason.
 */
export const recordConsultation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user?.id;
    const hospitalId = req.user?.hospitalId;
    const userRole = req.user?.role;

    if (!doctorId || !hospitalId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Doctor must be affiliated with a hospital' }
      });
    }

    const bookingId = req.params.bookingId as string;
    const {
      diagnosis,
      clinicalNotes,
      generalAdvice,
      followUpDate,
      vitals,
      prescriptions = [],
      labTestIds = []
    } = req.body;

    // Verify booking exists and belongs to this hospital and doctor
    const whereClause: any = { id: bookingId, hospitalId };
    if (userRole === Role.DOCTOR) {
      whereClause.doctorId = doctorId;
    }

    const booking = await prisma.oPBooking.findFirst({
      where: whereClause
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found or not assigned to this doctor' }
      });
    }

    // Atomic transaction for complete consultation record
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert Patient Vitals if provided
      let vitalsRecord = null;
      if (vitals && Object.keys(vitals).length > 0) {
        vitalsRecord = await tx.patientVitals.upsert({
          where: { bookingId },
          create: {
            bookingId,
            patientId: booking.patientId,
            systolicBp: vitals.systolicBp ?? null,
            diastolicBp: vitals.diastolicBp ?? null,
            pulseRate: vitals.pulseRate ?? null,
            bodyTemperature: vitals.bodyTemperature ?? null,
            respiratoryRate: vitals.respiratoryRate ?? null,
            spo2: vitals.spo2 ?? null,
            weightKg: vitals.weightKg ?? null,
            heightCm: vitals.heightCm ?? null,
          },
          update: {
            systolicBp: vitals.systolicBp ?? undefined,
            diastolicBp: vitals.diastolicBp ?? undefined,
            pulseRate: vitals.pulseRate ?? undefined,
            bodyTemperature: vitals.bodyTemperature ?? undefined,
            respiratoryRate: vitals.respiratoryRate ?? undefined,
            spo2: vitals.spo2 ?? undefined,
            weightKg: vitals.weightKg ?? undefined,
            heightCm: vitals.heightCm ?? undefined,
          }
        });
      }

      // 2. Create or Update Prescription & Prescription Items
      let prescriptionRecord: any = null;
      const existingPrescription = await tx.prescription.findUnique({
        where: { bookingId }
      });

      const parsedFollowUp = followUpDate ? new Date(followUpDate) : null;

      if (existingPrescription) {
        // Delete old items to cleanly replace
        await tx.prescriptionItem.deleteMany({
          where: { prescriptionId: existingPrescription.id }
        });

        prescriptionRecord = await tx.prescription.update({
          where: { id: existingPrescription.id },
          data: {
            diagnosis,
            clinicalNotes: clinicalNotes || null,
            generalAdvice: generalAdvice || null,
            followUpDate: parsedFollowUp && !isNaN(parsedFollowUp.getTime()) ? parsedFollowUp : null,
            items: {
              create: prescriptions.map((p: any) => ({
                medicineName: p.medicineName,
                dosageForm: p.dosageForm,
                strength: p.strength || null,
                frequency: p.frequency,
                durationDays: Number(p.durationDays) || 1,
                timing: (p.timing as DosageTiming) || DosageTiming.AFTER_FOOD,
                instructions: p.instructions || null
              }))
            }
          },
          include: { items: true }
        });
      } else {
        prescriptionRecord = await tx.prescription.create({
          data: {
            bookingId,
            doctorId,
            hospitalId,
            diagnosis,
            clinicalNotes: clinicalNotes || null,
            generalAdvice: generalAdvice || null,
            followUpDate: parsedFollowUp && !isNaN(parsedFollowUp.getTime()) ? parsedFollowUp : null,
            items: {
              create: prescriptions.map((p: any) => ({
                medicineName: p.medicineName,
                dosageForm: p.dosageForm,
                strength: p.strength || null,
                frequency: p.frequency,
                durationDays: Number(p.durationDays) || 1,
                timing: (p.timing as DosageTiming) || DosageTiming.AFTER_FOOD,
                instructions: p.instructions || null
              }))
            }
          },
          include: { items: true }
        });
      }

      // 3. Create Doctor Lab Orders if requested
      if (labTestIds && Array.isArray(labTestIds) && labTestIds.length > 0) {
        await tx.doctorLabOrder.deleteMany({
          where: { bookingId }
        });

        await tx.doctorLabOrder.createMany({
          data: labTestIds.map((testId: string) => ({
            bookingId,
            testId,
            doctorId
          }))
        });
      }

      // 4. Update OPBooking status to COMPLETED — DO NOT OVERWRITE reason!
      const updatedBooking = await tx.oPBooking.update({
        where: { id: bookingId },
        data: {
          status: 'COMPLETED'
        }
      });

      return {
        bookingId: updatedBooking.id,
        prescriptionId: prescriptionRecord.id,
        vitalsRecorded: !!vitalsRecord,
        prescriptionItemsCount: prescriptionRecord.items?.length || 0,
        labOrdersCount: labTestIds.length,
        status: updatedBooking.status
      };
    });

    res.status(201).json({
      success: true,
      message: 'Consultation recorded successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/clinical/patients/:patientId/history
 * GET /api/v1/clinical/patient-history?phone=...&patientId=...
 * Fetches comprehensive clinical history with vitals, prescriptions, medicines, and lab orders.
 */
export const getPatientHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const patientId = (req.params.patientId || req.query.patientId) as string | undefined;
    const phone = req.query.phone as string | undefined;

    if (!patientId && !phone) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'patientId or phone query is required' }
      });
    }

    const whereConditions: Array<{ patientId: string } | { patientPhone: string }> = [];
    if (patientId) {
      whereConditions.push({ patientId });
    }
    if (phone) {
      whereConditions.push({ patientPhone: phone });
    }

    const bookings = await prisma.oPBooking.findMany({
      where: {
        ...(hospitalId ? { hospitalId } : {}),
        OR: whereConditions
      },
      include: {
        doctor: {
          select: { id: true, name: true, designation: true, avatar: true }
        },
        department: {
          select: { id: true, name: true }
        },
        condition: {
          select: { id: true, name: true }
        },
        vitals: true,
        prescription: {
          include: {
            items: true
          }
        },
        labOrders: {
          include: {
            test: {
              include: { platformTest: true }
            }
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      }
    });

    const history = bookings.map(b => ({
      bookingId: b.id,
      date: b.appointmentDate.toISOString().split('T')[0],
      time: b.slotTime || b.timeSlot,
      status: b.status,
      chiefComplaint: b.reason, // Original patient complaint preserved!
      opType: b.opType,
      doctor: b.doctor,
      department: b.department,
      condition: b.condition?.name,
      vitals: b.vitals,
      prescription: b.prescription ? {
        id: b.prescription.id,
        diagnosis: b.prescription.diagnosis,
        clinicalNotes: b.prescription.clinicalNotes,
        generalAdvice: b.prescription.generalAdvice,
        followUpDate: b.prescription.followUpDate,
        createdAt: b.prescription.createdAt,
        items: b.prescription.items
      } : null
    }));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/clinical/presence
 * PATCH /api/v1/doctor/presence
 * Updates the doctor's active operational presence status.
 */
export const updateDoctorPresence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    const { presenceStatus } = req.body;
    if (!presenceStatus || !Object.values(DoctorPresenceStatus).includes(presenceStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: `Invalid presence status. Allowed: ${Object.values(DoctorPresenceStatus).join(', ')}`
        }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: doctorId },
      data: { presenceStatus },
      select: {
        id: true,
        name: true,
        role: true,
        presenceStatus: true
      }
    });

    res.json({
      success: true,
      message: `Doctor presence updated to ${presenceStatus}`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/clinical/presence
 * Returns the doctor's current operational status.
 */
export const getDoctorPresence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        role: true,
        presenceStatus: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
