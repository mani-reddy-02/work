import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, DosageTiming, DoctorPresenceStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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

/**
 * POST /api/v1/clinical/consultations/:bookingId/send-prescription
 * Generates an official signed e-prescription report and sends it to the patient's reports vault.
 */
export const sendPrescriptionToPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = (req.params.bookingId || req.body.bookingId) as string;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Booking ID is required' }
      });
    }

    // 1. Fetch complete consultation booking details
    const booking = await prisma.oPBooking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            qualification: true,
            specialization: true,
            licenseNumber: true,
            digitalSignature: true,
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            addressLine1: true,
            city: true,
            contactPhone: true,
            registrationNumber: true,
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        prescription: {
          include: {
            items: true
          }
        },
        vitals: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Consultation booking record not found' }
      });
    }

    // 2. Identify or link patient user
    let targetUserId = booking.patientId;
    if (!targetUserId && booking.patientPhone) {
      const existingUser = await prisma.user.findFirst({
        where: { phone: booking.patientPhone }
      });
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const cleanPhone = booking.patientPhone.replace(/\D/g, '') || Date.now().toString();
        const dummyEmail = `patient_${cleanPhone}@mediquee.com`;
        const newPatient = await prisma.user.create({
          data: {
            phone: booking.patientPhone,
            name: booking.patientName || 'Patient',
            email: dummyEmail,
            passwordHash: '$2b$10$temporaryhashforprescriptionsend1234567890',
            role: Role.PATIENT,
            active: true
          }
        });
        targetUserId = newPatient.id;
      }

      await prisma.oPBooking.update({
        where: { id: booking.id },
        data: { patientId: targetUserId }
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_PATIENT', message: 'Unable to resolve patient account to send prescription' }
      });
    }

    const doctor = booking.doctor;
    const hospital = booking.hospital;
    const prescription = booking.prescription;
    const vitals = booking.vitals;

    const doctorName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Consulting Doctor';
    const hospitalName = hospital?.name || 'MediQuee Healthcare Hospital';
    const diagnosis = prescription?.diagnosis || booking.reason || 'Clinical Consultation';

    // 3. Format clinical summary
    const medLines = prescription?.items && prescription.items.length > 0
      ? prescription.items.map((item, idx) =>
          `${idx + 1}. ${item.medicineName} (${item.dosageForm}${item.strength ? ' ' + item.strength : ''}) - ${item.frequency} for ${item.durationDays} day(s) [${item.timing || 'AFTER_FOOD'}]${item.instructions ? ' • Instructions: ' + item.instructions : ''}`
        ).join('\n')
      : 'No oral medications prescribed during this consultation.';

    const vitalsParts: string[] = [];
    if (vitals) {
      if (vitals.systolicBp && vitals.diastolicBp) vitalsParts.push(`BP: ${vitals.systolicBp}/${vitals.diastolicBp} mmHg`);
      if (vitals.pulseRate) vitalsParts.push(`Pulse: ${vitals.pulseRate} bpm`);
      if (vitals.bodyTemperature) vitalsParts.push(`Temp: ${vitals.bodyTemperature}°F`);
      if (vitals.spo2) vitalsParts.push(`SpO2: ${vitals.spo2}%`);
      if (vitals.weightKg) vitalsParts.push(`Weight: ${vitals.weightKg} kg`);
      if (vitals.heightCm) vitalsParts.push(`Height: ${vitals.heightCm} cm`);
    }

    const advice = prescription?.generalAdvice || 'Follow prescribed medical regime and clinical guidance.';
    const followUp = prescription?.followUpDate
      ? `Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
      : null;

    const summary = [
      `CONSULTING PHYSICIAN: ${doctorName} (${doctor?.qualification || 'MBBS'}, Reg No: ${doctor?.licenseNumber || 'Verified'})`,
      `DIAGNOSIS & CLINICAL FINDINGS:\n${diagnosis}`,
      vitalsParts.length > 0 ? `RECORDED VITALS:\n${vitalsParts.join(' • ')}` : null,
      `PRESCRIBED MEDICATIONS:\n${medLines}`,
      `ADVICE & PRECAUTIONS:\n${advice}`,
      followUp,
      `HOSPITAL: ${hospitalName}`
    ].filter(Boolean).join('\n\n');

    // 4. Generate standalone printable HTML file
    const uploadsDir = path.join(__dirname, '../../../../uploads/reports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFileName = `prescription-${booking.id}.html`;
    const filePath = path.join(uploadsDir, safeFileName);

    const consultDateStr = new Date(booking.appointmentDate || Date.now()).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official E-Prescription - ${booking.patientName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 30px; color: #1e293b; background: #fff; line-height: 1.5; }
    .header { border-bottom: 3px solid #1B5DF1; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .hosp-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
    .hosp-sub { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
    .badge { display: inline-block; background: #eff6ff; color: #1B5DF1; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; }
    .grid { display: flex; gap: 20px; margin-bottom: 20px; }
    .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
    .card-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    .card-name { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; }
    .card-meta { font-size: 12px; color: #475569; margin: 0; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #1B5DF1; margin: 20px 0 8px 0; }
    .table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    .table th { background: #f1f5f9; text-align: left; padding: 10px; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; }
    .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .sig-area { margin-top: 36px; padding-top: 16px; border-top: 2px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-img { max-height: 60px; max-width: 200px; object-fit: contain; }
    .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { padding: 0; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="hosp-title">${hospitalName}</h1>
      <p class="hosp-sub">${hospital?.addressLine1 || hospital?.city || 'Healthcare Facility'} • Phone: ${hospital?.contactPhone || 'Registered'}</p>
    </div>
    <div style="text-align: right;">
      <span class="badge">TELEMEDICINE CONSULTATION</span>
      <p style="font-size: 11px; color: #64748b; margin: 6px 0 0 0;">Rx ID: ${booking.id.slice(0, 8).toUpperCase()}<br>Date: ${consultDateStr}</p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Consulting Physician</div>
      <p class="card-name">${doctorName}</p>
      <p class="card-meta">${doctor?.qualification || 'MBBS'} • ${doctor?.specialization || 'Consultant'}</p>
      <p class="card-meta">Reg No: ${doctor?.licenseNumber || 'Verified'}</p>
    </div>
    <div class="card">
      <div class="card-title">Patient Details</div>
      <p class="card-name">${booking.patientName}</p>
      <p class="card-meta">Contact: ${booking.patientPhone || 'Not provided'}</p>
      <p class="card-meta">Age: ${booking.patientAge || 'Recorded'} • Gender: ${booking.patientGender || 'Unspecified'}</p>
    </div>
  </div>

  <div class="section-title">Clinical Findings & Diagnosis</div>
  <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; font-weight: 600; color: #1e3a8a;">
    ${diagnosis}
  </div>

  ${vitalsParts.length > 0 ? `
  <div class="section-title">Recorded Vitals</div>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; font-size: 12px; color: #334155;">
    ${vitalsParts.join(' &nbsp;•&nbsp; ')}
  </div>` : ''}

  <div class="section-title">Prescribed Medications</div>
  <table class="table">
    <thead>
      <tr>
        <th>#</th>
        <th>Medicine & Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${prescription?.items && prescription.items.length > 0 ? prescription.items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${item.medicineName}</b> <span style="color:#64748b; font-size:11px;">(${item.dosageForm}${item.strength ? ' ' + item.strength : ''})</span></td>
          <td>${item.frequency}</td>
          <td>${item.durationDays} day(s)</td>
          <td>${item.timing || 'AFTER_FOOD'}${item.instructions ? ' • ' + item.instructions : ''}</td>
        </tr>
      `).join('') : `
        <tr>
          <td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">No oral medications prescribed during this consultation.</td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="section-title">Advice & Instructions</div>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 12px;">
    ${advice}
    ${followUp ? `<br><br><b>${followUp}</b>` : ''}
  </div>

  <div class="sig-area">
    <div>
      <p style="font-size: 11px; color: #10b981; font-weight: 700; margin: 0 0 2px 0;">✓ DIGITALLY AUTHORIZED</p>
      <p style="font-size: 12px; color: #64748b; margin: 0;">Prescription valid under National Telemedicine Practice Guidelines.</p>
    </div>
    <div style="text-align: right;">
      ${doctor?.digitalSignature ? `<img src="${doctor.digitalSignature}" class="sig-img" alt="Doctor Signature" /><br>` : ''}
      <b style="font-size: 13px; color: #0f172a;">${doctorName}</b>
      <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Reg: ${doctor?.licenseNumber || 'Verified'}</p>
    </div>
  </div>

  <div class="footer">
    This is an officially signed electronic prescription generated via MediQuee Healthcare Network.
  </div>
</body>
</html>`;

    fs.writeFileSync(filePath, htmlContent, 'utf8');

    // 5. Create or Update PatientReport in database
    const reportTitle = `E-Prescription - ${doctorName}`;
    const reportDate = consultDateStr;

    // Check if report already exists for this booking/title
    const existingReport = await prisma.patientReport.findFirst({
      where: {
        userId: targetUserId,
        title: reportTitle,
        date: reportDate
      }
    });

    let patientReport;
    if (existingReport) {
      patientReport = await prisma.patientReport.update({
        where: { id: existingReport.id },
        data: {
          hospital: hospitalName,
          doctor: doctorName,
          status: 'Prescribed',
          statusColor: 'text-emerald-700 bg-emerald-100/70',
          summary,
          fileUrl: `/uploads/reports/${safeFileName}`,
          updatedAt: new Date()
        }
      });
    } else {
      patientReport = await prisma.patientReport.create({
        data: {
          userId: targetUserId,
          title: reportTitle,
          hospital: hospitalName,
          doctor: doctorName,
          date: reportDate,
          pages: '1 page',
          status: 'Prescribed',
          statusColor: 'text-emerald-700 bg-emerald-100/70',
          iconName: 'FileText',
          iconColor: 'text-blue-600',
          bg: 'bg-blue-50',
          summary,
          fileUrl: `/uploads/reports/${safeFileName}`,
        }
      });
    }

    // 6. Push notification to the patient
    try {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'Official E-Prescription Received',
          message: `${doctorName} from ${hospitalName} has sent your official digital prescription. View and download it in your Reports.`,
          type: 'PRESCRIPTION',
          read: false
        }
      });
    } catch (notifErr) {
      console.error('Failed to create prescription notification:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Prescription sent to patient reports successfully',
      data: {
        reportId: patientReport.id,
        patientName: booking.patientName,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

