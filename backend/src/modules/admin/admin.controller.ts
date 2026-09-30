import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalHospitals,
      totalUsers,
      totalPatients,
      totalDoctors,
      totalDepartments,
      activeUsers,
      totalLabs,
      totalNurses,
      pendingVerifications,
      opBookings,
      labBookings,
      nursingBookings
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.PATIENT } }),
      prisma.user.count({ where: { role: Role.DOCTOR } }),
      prisma.department.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.user.count({ where: { role: Role.LAB_ADMIN } }),
      prisma.user.count({ where: { role: Role.NURSE } }),
      prisma.hospitalVerification.count(),
      prisma.oPBooking.findMany({ select: { fee: true, status: true } }),
      prisma.labBooking.findMany({ select: { totalAmount: true, status: true } }),
      prisma.homeNursingBooking.findMany({ select: { totalAmount: true, status: true } }),
    ]);

    // Calculate gross revenue (approximate 20% platform share)
    const opRevenue = opBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
    const labRevenue = labBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const nursingRevenue = nursingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const grossRevenue = opRevenue + labRevenue + nursingRevenue;
    const adminCommission = grossRevenue * 0.20;
    const providerShare = grossRevenue * 0.80;
    const transactions = opBookings.length + labBookings.length + nursingBookings.length;
    const pendingSettlements = providerShare * 0.1; // Placeholder estimate for pending settlements since we don't have a settlements table yet

    res.json({
      success: true,
      data: {
        totalHospitals,
        totalUsers,
        totalPatients,
        totalDoctors,
        totalDepartments,
        activeUsers,
        totalLabs,
        totalNurses,
        totalAppointments: opBookings.length,
        todaysAppointments: opBookings.length, // Can refine with date filtering if needed
        pendingVerifications,
        grossRevenue,
        adminCommission,
        providerShare,
        transactions,
        pendingSettlements,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
          },
        },
        departments: {
          select: { id: true, name: true },
        },
        verifications: true,
      },
    });

    const formatted = hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      businessType: h.businessType,
      facilityType: h.facilityType,
      registrationNumber: h.registrationNumber || 'N/A',
      email: h.contactEmail || 'N/A',
      phone: h.contactPhone || 'N/A',
      address: [h.addressLine1, h.area, h.city].filter(Boolean).join(', '),
      city: h.city || 'N/A',
      state: h.state || 'N/A',
      verificationStatus: h.verifications.length > 0 ? 'VERIFIED' : 'PENDING',
      status: 'ACTIVE',
      departmentCount: h._count.departments,
      doctorCount: h._count.users,
      services: h.services,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        qualification: true,
        specialization: true,
        experienceYears: true,
        hospital: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || 'N/A',
      role: u.role,
      status: u.active ? 'ACTIVE' : 'INACTIVE',
      hospitalName: u.hospital?.name || 'N/A',
      departmentName: u.department?.name || 'N/A',
      qualification: u.qualification || 'N/A',
      specialization: u.department?.name || u.specialization || u.designation || 'Not specified',
      experienceYears: u.experienceYears || 0,
      verificationStatus: u.active ? 'VERIFIED' : 'PENDING',
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};


export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.oPBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { name: true } },
        hospital: { select: { name: true } },
        patient: { select: { name: true } }
      }
    });

    const formatted = bookings.map((b) => ({
      id: b.id.substring(0, 8).toUpperCase(),
      patientName: b.patientName || b.patient?.name || 'Unknown',
      doctorName: b.doctor?.name || 'Unknown',
      hospitalName: b.hospital?.name || 'Unknown',
      date: new Date(b.appointmentDate).toLocaleDateString(),
      time: b.timeSlot || b.slotTime || 'N/A',
      status: b.status,
      fee: b.fee,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};
