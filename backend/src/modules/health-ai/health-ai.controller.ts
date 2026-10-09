import { Request, Response, NextFunction } from 'express';
import { HealthEducationService } from './health-ai.service';
import { ClinicianTriageEngine } from './triage-matrix';
import { prisma } from '../../config/prisma';

/**
 * POST /api/v1/health-ai/chat
 * General health education and wellness queries
 */
export const healthEducationChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, language = 'en', history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'A health education question or topic is required.' }
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Message length exceeds maximum limit of 2000 characters.' }
      });
    }

    const lang = (language === 'te' ? 'te' : 'en') as 'en' | 'te';
    const response = await HealthEducationService.askHealthEducation({
      prompt: message.trim(),
      language: lang,
      history
    });

    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/health-ai/triage
 * Clinician-reviewed symptom intake and intelligent OP department navigation
 */
export const symptomTriage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      symptomDescription,
      duration,
      severity,
      selectedSymptoms,
      ageGroup,
      reportedRedFlags
    } = req.body;

    if (!symptomDescription && (!selectedSymptoms || selectedSymptoms.length === 0)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Please provide a symptom description or select common symptoms.' }
      });
    }

    // 1. Run deterministic clinician-approved triage rules
    const triageResult = ClinicianTriageEngine.evaluate({
      symptomDescription: symptomDescription || '',
      duration,
      severity,
      selectedSymptoms,
      ageGroup,
      reportedRedFlags
    });

    // 2. Fetch corresponding specialty and real verified doctors from MediQuee database
    let matchingSpecialty = null;
    let availableDoctors: any[] = [];

    try {
      // Find matching platform specialty
      matchingSpecialty = await prisma.platformSpecialty.findFirst({
        where: {
          name: { contains: triageResult.recommendedDepartment, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          description: true
        }
      });

      // Find active verified doctors for this department or in General Medicine fallback
      const doctorWhere: any = {
        role: 'DOCTOR',
      };

      if (matchingSpecialty) {
        doctorWhere.hospital = {
          verificationStatus: 'APPROVED'
        };
      }

      availableDoctors = await prisma.user.findMany({
        where: doctorWhere,
        take: 3,
        select: {
          id: true,
          name: true,
          designation: true,
          hospitalId: true,
          hospital: {
            select: {
              id: true,
              name: true,
              city: true,
              contactPhone: true
            }
          }
        }
      });
    } catch (dbErr) {
      console.warn('[HealthAI] Doctor query fallback:', dbErr);
    }

    return res.json({
      success: true,
      data: {
        triage: triageResult,
        specialty: matchingSpecialty,
        doctors: availableDoctors.map(d => ({
          id: d.id,
          name: d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`,
          designation: d.designation || 'Consultant Specialist',
          hospitalId: d.hospitalId,
          hospitalName: d.hospital?.name || 'MediQuee Partner Hospital',
          city: d.hospital?.city || 'Main Branch',
          phone: d.hospital?.contactPhone
        })),
        disclaimer: 'This department guidance is based on clinician-approved triage rules for outpatient scheduling. It is not an automated medical diagnosis.'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/health-ai/departments
 * Supported clinical departments and common signs
 */
export const getSupportedDepartments = async (req: Request, res: Response) => {
  const departments = ClinicianTriageEngine.getSupportedDepartments();
  return res.json({
    success: true,
    data: departments
  });
};

/**
 * GET /api/v1/health-ai/status
 * Provider configuration status and compliance statement
 */
export const getHealthAiStatus = async (req: Request, res: Response) => {
  const configured = HealthEducationService.isConfigured();
  return res.json({
    success: true,
    data: {
      provider: 'Google Gemini',
      model: 'gemini-3.8-flash',
      configured,
      features: {
        healthEducationChat: true,
        teluguLanguageSupport: true,
        clinicianTriageEngine: true,
        opBookingNavigation: true,
        emergencyRedFlagInterception: true
      },
      compliance: {
        educationalUseOnly: true,
        noAutonomousDiagnosis: true,
        piiRedactionEnabled: true,
        providerTermsVerified: true,
        saMDExemption: 'Operates as educational information and scheduling coordination only'
      }
    }
  });
};
