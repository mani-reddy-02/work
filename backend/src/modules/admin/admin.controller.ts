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
      prisma.oPBooking.findMany({ select: { fee: true, status: true, hospitalAmount: true, mediqueeAmount: true, createdAt: true } }),
      prisma.labBooking.findMany({ select: { totalAmount: true, status: true, hospitalAmount: true, mediqueeAmount: true, createdAt: true } }),
      prisma.homeNursingBooking.findMany({ select: { totalAmount: true, status: true, hospitalAmount: true, mediqueeAmount: true, createdAt: true } }),
    ]);

    // Calculate gross revenue using actual shares or fallback to 80/20 for old transactions
    let grossRevenue = 0;
    let adminCommission = 0;
    let providerShare = 0;

    let opGross = 0, opAdmin = 0, opProv = 0;
    let labGross = 0, labAdmin = 0, labProv = 0;
    let nurseGross = 0, nurseAdmin = 0, nurseProv = 0;

    const trendsMap: Record<string, { gross: number, admin: number, provider: number }> = {};

    const processBooking = (b: any, fee: number, typeGross: number, typeAdmin: number, typeProv: number) => {
      grossRevenue += fee;
      const prov = b.hospitalAmount ?? (fee * 0.80);
      const admin = b.mediqueeAmount ?? (fee * 0.20);
      
      providerShare += prov;
      adminCommission += admin;

      const dateStr = b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 7) : 'Unknown'; // YYYY-MM
      if (!trendsMap[dateStr]) trendsMap[dateStr] = { gross: 0, admin: 0, provider: 0 };
      trendsMap[dateStr].gross += fee;
      trendsMap[dateStr].admin += admin;
      trendsMap[dateStr].provider += prov;

      return { prov, admin };
    };

    opBookings.forEach(b => {
      const fee = b.fee || 0;
      const { prov, admin } = processBooking(b, fee, opGross, opAdmin, opProv);
      opGross += fee; opProv += prov; opAdmin += admin;
    });

    labBookings.forEach(b => {
      const fee = b.totalAmount || 0;
      const { prov, admin } = processBooking(b, fee, labGross, labAdmin, labProv);
      labGross += fee; labProv += prov; labAdmin += admin;
    });

    nursingBookings.forEach(b => {
      const fee = b.totalAmount || 0;
      const { prov, admin } = processBooking(b, fee, nurseGross, nurseAdmin, nurseProv);
      nurseGross += fee; nurseProv += prov; nurseAdmin += admin;
    });
    
    const transactions = opBookings.length + labBookings.length + nursingBookings.length;
    const pendingSettlements = 0; // Not available in backend

    const revenueByService = [];
    if (opGross > 0) revenueByService.push({ name: 'OP Booking', admin: opAdmin, provider: opProv });
    if (labGross > 0) revenueByService.push({ name: 'Lab Tests', admin: labAdmin, provider: labProv });
    if (nurseGross > 0) revenueByService.push({ name: 'Home Nursing', admin: nurseAdmin, provider: nurseProv });

    const revenueTrend = Object.keys(trendsMap).sort().map(k => ({
      name: k,
      gross: trendsMap[k].gross,
      admin: trendsMap[k].admin,
      provider: trendsMap[k].provider
    }));

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
        revenueTrend,
        revenueByService,
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
      hospitalShare: h.hospitalShare,
      mediqueeCommission: 100 - h.hospitalShare,
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

export const updateHospitalRevenueShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId } = req.params;
    const { hospitalSharePercentage } = req.body;

    if (hospitalSharePercentage === undefined || hospitalSharePercentage < 0 || hospitalSharePercentage > 100) {
      return res.status(400).json({ success: false, message: 'Invalid hospital share percentage' });
    }

    const updated = await prisma.hospital.update({
      where: { id: hospitalId as string },
      data: { hospitalShare: hospitalSharePercentage },
    });

    res.json({ 
      success: true, 
      data: {
        hospitalId: updated.id,
        hospitalShare: updated.hospitalShare,
        mediqueeCommission: 100 - updated.hospitalShare
      }
    });
  } catch (error) {
    next(error);
  }
};
