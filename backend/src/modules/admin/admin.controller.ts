import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '30d';
    const serviceFilter = (req.query.service as string) || 'all';

    const now = new Date();
    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '3m') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === '6m') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (period === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate.setFullYear(2000); // all time fallback
    }

    const totalHospitals = await prisma.hospital.count();
    const totalUsers = await prisma.user.count();
    const totalPatients = await prisma.user.count({ where: { role: Role.PATIENT } });
    const totalDoctors = await prisma.user.count({ where: { role: Role.DOCTOR } });
    const totalDepartments = await prisma.department.count();
    const activeDoctors = await prisma.user.count({ where: { role: Role.DOCTOR, active: true } });
    const verifiedHospitals = await prisma.hospital.count({ where: { verifications: { some: {} } } });
    const pendingVerifications = await prisma.hospitalVerification.count();
    const hospitalsForShares = await prisma.hospital.findMany({ select: { id: true, name: true, hospitalShare: true } });

    const hospitalMap = new Map(hospitalsForShares.map(h => [h.id, h]));

    // Fetch transactions based on dates
    const dateFilter = period !== 'all' ? { createdAt: { gte: startDate } } : {};
    
    let opBookings: any[] = [];
    let labBookings: any[] = [];
    let nursingBookings: any[] = [];

    if (serviceFilter === 'all' || serviceFilter === 'op') {
      opBookings = await prisma.oPBooking.findMany({
        where: dateFilter,
        select: { fee: true, status: true, hospitalAmount: true, mediqueeAmount: true, createdAt: true, hospitalId: true, appointmentDate: true }
      });
    }

    if (serviceFilter === 'all' || serviceFilter === 'lab') {
      labBookings = await prisma.labBooking.findMany({
        where: dateFilter,
        select: { totalAmount: true, status: true, hospitalAmount: true, mediqueeAmount: true, createdAt: true, hospitalId: true }
      });
    }

    if (serviceFilter === 'all' || serviceFilter === 'home_nursing') {
      nursingBookings = await prisma.homeNursingBooking.findMany({
        where: dateFilter,
        select: { totalAmount: true, status: true, hospitalAmount: true, mediqueeAmount: true, createdAt: true, hospitalId: true }
      });
    }

    let grossRevenue = 0, adminCommission = 0, providerShare = 0;
    let opGross = 0, opAdmin = 0, opProv = 0;
    let labGross = 0, labAdmin = 0, labProv = 0;
    let nurseGross = 0, nurseAdmin = 0, nurseProv = 0;

    const trendsMap: Record<string, { gross: number, admin: number, provider: number }> = {};
    const hospitalRevMap: Record<string, { id: string, name: string, gross: number, admin: number, provider: number, transactions: number }> = {};
    const appointmentStatusMap: Record<string, number> = {};

    const getFormatKey = (date: Date) => {
      if (period === 'today') return date.getHours() + ':00';
      if (['7d', '30d'].includes(period)) return date.toISOString().slice(0, 10);
      return date.toISOString().slice(0, 7); // YYYY-MM
    };

    const processBooking = (b: any, fee: number, typeGross: number, typeAdmin: number, typeProv: number) => {
      grossRevenue += fee;
      
      const hosp = hospitalMap.get(b.hospitalId);
      const hShare = hosp?.hospitalShare ?? 80;
      
      const prov = b.hospitalAmount ?? (fee * (hShare / 100));
      const admin = b.mediqueeAmount ?? (fee * ((100 - hShare) / 100));
      
      providerShare += prov;
      adminCommission += admin;

      const dateStr = b.createdAt ? getFormatKey(new Date(b.createdAt)) : 'Unknown';
      if (!trendsMap[dateStr]) trendsMap[dateStr] = { gross: 0, admin: 0, provider: 0 };
      trendsMap[dateStr].gross += fee;
      trendsMap[dateStr].admin += admin;
      trendsMap[dateStr].provider += prov;

      if (hosp) {
        if (!hospitalRevMap[hosp.id]) {
          hospitalRevMap[hosp.id] = { id: hosp.id, name: hosp.name, gross: 0, admin: 0, provider: 0, transactions: 0 };
        }
        hospitalRevMap[hosp.id].gross += fee;
        hospitalRevMap[hosp.id].admin += admin;
        hospitalRevMap[hosp.id].provider += prov;
        hospitalRevMap[hosp.id].transactions += 1;
      }

      return { prov, admin };
    };

    opBookings.forEach(b => {
      const fee = b.fee || 0;
      const { prov, admin } = processBooking(b, fee, opGross, opAdmin, opProv);
      opGross += fee; opProv += prov; opAdmin += admin;
      appointmentStatusMap[b.status] = (appointmentStatusMap[b.status] || 0) + 1;
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

    const revenueByService = [];
    if (opGross > 0) revenueByService.push({ name: 'OP Booking', gross: opGross, admin: opAdmin, provider: opProv, transactions: opBookings.length });
    if (labGross > 0) revenueByService.push({ name: 'Lab Tests', gross: labGross, admin: labAdmin, provider: labProv, transactions: labBookings.length });
    if (nurseGross > 0) revenueByService.push({ name: 'Home Nursing', gross: nurseGross, admin: nurseAdmin, provider: nurseProv, transactions: nursingBookings.length });
    
    if (revenueByService.length === 0) {
       revenueByService.push({ name: 'OP Booking', gross: 0, admin: 0, provider: 0, transactions: 0 });
    }

    const revenueTrend = Object.keys(trendsMap).sort().map(k => ({
      name: k,
      gross: trendsMap[k].gross,
      admin: trendsMap[k].admin,
      provider: trendsMap[k].provider
    }));

    const topHospitals = Object.values(hospitalRevMap)
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 10);
      
    const revenueByHospital = Object.values(hospitalRevMap).sort((a, b) => b.gross - a.gross);

    const appointmentStatuses = Object.keys(appointmentStatusMap).map(k => ({
      name: k,
      value: appointmentStatusMap[k]
    }));

    res.json({
      success: true,
      data: {
        totalHospitals,
        totalPatients,
        totalDoctors,
        totalDepartments,
        activeDoctors,
        verifiedHospitals,
        pendingVerifications,
        totalAppointments: opBookings.length,
        grossRevenue,
        adminCommission,
        providerShare,
        transactions,
        pendingSettlements: 0,
        revenueTrend,
        revenueByService,
        revenueByHospital,
        topHospitals,
        appointmentStatuses,
        appointmentTrend: revenueTrend.map(r => ({ name: r.name, count: opBookings.filter(b => getFormatKey(new Date(b.createdAt)) === r.name).length }))
      },
    });
  } catch (error) {
    next(error);
  }
};
export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { search, location } = req.query;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { id: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { state: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (location && location !== 'all') {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { city: { equals: location as string, mode: 'insensitive' } },
        { state: { equals: location as string, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.hospital.count({ where: whereClause });

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { departments: true, users: true } },
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
      verificationStatus: h.verificationStatus || (h.verifications.length > 0 ? 'VERIFIED' : 'PENDING'),
      status: 'ACTIVE',
      departmentCount: h._count.departments,
      doctorCount: h._count.users,
      services: h.services,
      hospitalShare: h.hospitalShare,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const createHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const newHospital = await prisma.hospital.create({
      data: {
        name: data.name,
        businessType: data.businessType || 'HOSPITAL',
        facilityType: data.facilityType || 'GENERAL',
        registrationNumber: data.registrationNumber || '',
        contactEmail: data.email,
        contactPhone: data.phone,
        addressLine1: data.address,
        city: data.city,
        state: data.state,
        services: data.services || [],
        hospitalShare: 80
      }
    });
    res.json({ success: true, data: newHospital });
  } catch (error) {
    next(error);
  }
};

export const updateHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedHospital = await prisma.hospital.update({
      where: { id: id as string },
      data: {
        name: data.name,
        businessType: data.businessType,
        facilityType: data.facilityType,
        registrationNumber: data.registrationNumber,
        contactEmail: data.email,
        contactPhone: data.phone,
        addressLine1: data.address,
        city: data.city,
        state: data.state,
        services: data.services
      }
    });
    res.json({ success: true, data: updatedHospital });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, gender, ageMin, ageMax, city, hospitalId, search, specialization, experienceMin, experienceMax } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const whereClause: any = { AND: [] };
    if (role) whereClause.role = role;
    if (gender && gender !== 'all') whereClause.gender = { equals: gender as string, mode: 'insensitive' };
    if (city && city !== 'all') whereClause.address = { contains: city as string, mode: 'insensitive' };

    if (ageMin || ageMax) {
      const today = new Date();
      if (ageMin) {
        const minDate = new Date(today.getFullYear() - Number(ageMin), today.getMonth(), today.getDate());
        whereClause.dob = { ...whereClause.dob, lte: minDate.toISOString() };
      }
      if (ageMax) {
        const maxDate = new Date(today.getFullYear() - Number(ageMax) - 1, today.getMonth(), today.getDate() + 1);
        whereClause.dob = { ...whereClause.dob, gt: maxDate.toISOString() };
      }
    }

    
    if (hospitalId && hospitalId !== 'all') {
      if (role === 'DOCTOR') {
        whereClause.doctorBookings = { some: { hospitalId: hospitalId as string } };
      } else {
        whereClause.patientBookings = { some: { hospitalId: hospitalId as string } };
      }
    }

    if (specialization && specialization !== 'all') {
      whereClause.AND.push({
        OR: [
          { department: { name: { equals: specialization as string, mode: 'insensitive' } } },
          { doctorBookings: { some: { department: { name: { equals: specialization as string, mode: 'insensitive' } } } } }
        ]
      });
    }
    
    if (experienceMin || experienceMax) {
      whereClause.experienceYears = {};
      if (experienceMin) whereClause.experienceYears.gte = Number(experienceMin);
      if (experienceMax) whereClause.experienceYears.lte = Number(experienceMax);
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
          { id: { contains: search as string, mode: 'insensitive' } },
        ]
      });
    }
    if (whereClause.AND && whereClause.AND.length === 0) delete whereClause.AND;

    const total = await prisma.user.count({ where: whereClause });

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
        dob: true,
        gender: true,
        address: true,
        hospital: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        _count: {
          select: { patientBookings: true }
        },
        patientBookings: {
          select: {
            hospital: { select: { id: true, name: true } }
          }
        }
      },
    });

    const formatted = users.map((u) => {
      // Find unique hospitals from bookings for patients
      const hospitalSet = new Map();
      u.patientBookings?.forEach((b: any) => {
        if (b.hospital) hospitalSet.set(b.hospital.id, b.hospital);
      });
      const hospitals = Array.from(hospitalSet.values());
      const primaryHospital = hospitals.length > 0 ? hospitals[0].name : 'N/A';
      
      let age = null;
      if (u.dob) {
        const birthDate = new Date(u.dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
      
      // Extract city from address if possible
      let extractCity = 'N/A';
      if (u.address) {
        const parts = u.address.split(',');
        if (parts.length > 1) {
           extractCity = parts[parts.length - 2].trim() || parts[0].trim();
        } else {
           extractCity = u.address.trim();
        }
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || 'N/A',
        role: u.role,
        status: u.active ? 'ACTIVE' : 'INACTIVE',
        hospitalName: u.role === 'PATIENT' ? primaryHospital : (u.hospital?.name || 'N/A'),
        departmentName: u.department?.name || 'N/A',
        qualification: u.qualification || 'N/A',
        specialization: u.department?.name || u.specialization || u.designation || 'Not specified',
        experienceYears: u.experienceYears || 0,
        verificationStatus: u.active ? 'VERIFIED' : 'PENDING',
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        dob: u.dob,
        age: age,
        gender: u.gender || 'Not specified',
        address: u.address,
        city: extractCity,
        appointmentsCount: u._count?.patientBookings || 0,
        hospitals: hospitals
      };
    });

    res.json({ 
      success: true, 
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const ageMin = req.query.ageMin ? parseInt(req.query.ageMin as string) : undefined;
      const ageMax = req.query.ageMax ? parseInt(req.query.ageMax as string) : undefined;
      const gender = req.query.gender as string;
      const place = req.query.place as string;
      const status = req.query.status as string;

            const where: any = { AND: [] };

      if (search) {
        where.AND.push({
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { patientName: { contains: search, mode: 'insensitive' } },
            { patientId: { contains: search, mode: 'insensitive' } },
            { doctor: { name: { contains: search, mode: 'insensitive' } } },
            { doctorId: { contains: search, mode: 'insensitive' } },
            { hospital: { name: { contains: search, mode: 'insensitive' } } },
          ]
        });
      }

      if (ageMin !== undefined || ageMax !== undefined) {
        const today = new Date();
        const dobCond: any = {};
        if (ageMin !== undefined) {
          dobCond.lte = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate()).toISOString();
        }
        if (ageMax !== undefined) {
          dobCond.gt = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate() + 1).toISOString();
        }
        
        const staticAgeCond: any = {};
        if (ageMin !== undefined) staticAgeCond.gte = ageMin;
        if (ageMax !== undefined) staticAgeCond.lte = ageMax;

        where.AND.push({
          OR: [
            { patientAge: staticAgeCond },
            { patient: { dob: dobCond } }
          ]
        });
      }

      if (gender && gender !== 'ALL') {
        where.AND.push({
          OR: [
            { patientGender: { equals: gender, mode: 'insensitive' } },
            { patient: { gender: { equals: gender, mode: 'insensitive' } } }
          ]
        });
      }

      if (place && place !== 'ALL') {
        where.AND.push({
          patient: { address: { contains: place, mode: 'insensitive' } }
        });
      }

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (where.AND.length === 0) {
        delete where.AND;
      }

      const totalCount = await prisma.oPBooking.count({ where });

      const bookings = await prisma.oPBooking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          doctor: { select: { name: true } },
          hospital: { select: { name: true } },
          patient: { select: { name: true, address: true } },
          department: { select: { name: true } }
        }
      });
  
      const formatted = bookings.map((b) => ({
        id: b.id,
        bookingId: b.id.substring(0, 8).toUpperCase(),
        patientName: b.patientName || b.patient?.name || 'Unknown',
        doctorName: b.doctor?.name || 'Unknown',
        departmentName: b.department?.name || 'Unknown',
        hospitalName: b.hospital?.name || 'Unknown',
        date: new Date(b.appointmentDate).toLocaleDateString(),
        time: b.timeSlot || b.slotTime || 'N/A',
        status: b.status,
        fee: b.fee,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        patientAge: b.patientAge,
        patientGender: b.patientGender,
        place: b.patient?.address || 'Unknown'
      }));
  
      res.json({ 
        success: true, 
        data: formatted,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
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

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        hospital: { select: { id: true, name: true, city: true, state: true } },
        department: { select: { id: true, name: true } },
        patientBookings: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            doctor: { select: { id: true, name: true } },
            hospital: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          }
        },
        doctorBookings: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            patient: { select: { id: true, name: true, email: true, phone: true } },
            hospital: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          }
        },
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getHospitalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, role: true, specialization: true, active: true, experienceYears: true, departmentId: true, department: { select: { name: true } } } },
        departments: { select: { id: true, name: true, description: true } },
        opBookings: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            patient: { select: { id: true, name: true } },
            doctor: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          }
        },
        verifications: true,
      }
    });

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    res.json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const booking = await prisma.oPBooking.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, phone: true, email: true, gender: true, dob: true, avatar: true } },
        doctor: { select: { id: true, name: true, specialization: true, experienceYears: true, avatar: true } },
        hospital: { select: { id: true, name: true, contactPhone: true, city: true, addressLine1: true } },
        department: { select: { id: true, name: true } },
        vitals: true,
        prescription: true,
        labOrders: { include: { test: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    // Validate status transition (simple validation for now)
    const validStatuses = ['PENDING', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'CONFIRMED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updated = await prisma.oPBooking.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, data: updated, message: 'Status updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getLabOrdersAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId, bookingType, date, search } = req.query;
    const where: any = { AND: [] };

    if (hospitalId && hospitalId !== 'ALL') {
      where.AND.push({ hospitalId: hospitalId as string });
    }
    if (bookingType && bookingType !== 'ALL') {
      where.AND.push({ bookingType: bookingType as any });
    }
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      where.AND.push({ createdAt: { gte: startOfDay, lte: endOfDay } });
    }
    if (search) {
      where.AND.push({
        OR: [
          { id: { contains: search as string, mode: 'insensitive' } },
          { patient: { name: { contains: search as string, mode: 'insensitive' } } },
          { hospital: { name: { contains: search as string, mode: 'insensitive' } } },
          { items: { some: { labTest: { platformTest: { name: { contains: search as string, mode: 'insensitive' } } } } } }
        ]
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [
      totalOrders,
      pending,
      sampleCollection,
      sampleCollected,
      labProcessing,
      reportUploadPending,
      completed,
      cancelled
    ] = await Promise.all([
      prisma.labBooking.count({ where }),
      prisma.labBooking.count({ where: { ...where, status: 'REQUESTED' } }),
      prisma.labBooking.count({ where: { ...where, status: 'ASSIGNED' } }),
      prisma.labBooking.count({ where: { ...where, status: 'SAMPLE_COLLECTED' } }),
      prisma.labBooking.count({ where: { ...where, status: 'IN_LAB_PROCESSING' } }),
      prisma.labBooking.count({ where: { ...where, status: 'REPORT_UPLOAD_PENDING' } }),
      prisma.labBooking.count({ where: { ...where, status: { in: ['REPORT_READY', 'COMPLETED'] } } }),
      prisma.labBooking.count({ where: { ...where, status: 'CANCELLED' } })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pending,
        sampleCollection,
        sampleCollected,
        labProcessing,
        reportUploadPending,
        completed,
        cancelled
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLabBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const bookingType = req.query.bookingType as string;
    const hospitalId = req.query.hospitalId as string;
    const date = req.query.date as string;
    const gender = req.query.gender as string;
    const place = req.query.place as string;

    const where: any = { AND: [] };

    if (search) {
      where.AND.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { patient: { name: { contains: search, mode: 'insensitive' } } },
          { patient: { phone: { contains: search, mode: 'insensitive' } } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } },
          { items: { some: { labTest: { platformTest: { name: { contains: search, mode: 'insensitive' } } } } } }
        ]
      });
    }

    if (status && status !== 'ALL') {
      const s = status.toUpperCase();
      if (s === 'COMPLETED' || s === 'REPORT_READY') {
        where.AND.push({ status: { in: ['REPORT_READY', 'COMPLETED'] } });
      } else if (s === 'PENDING') {
        where.AND.push({ status: 'REQUESTED' });
      } else if (s === 'SAMPLE_COLLECTION' || s === 'ASSIGNED') {
        where.AND.push({ status: 'ASSIGNED' });
      } else if (s === 'SAMPLE_COLLECTED') {
        where.AND.push({ status: 'SAMPLE_COLLECTED' });
      } else if (s === 'LAB_PROCESSING' || s === 'IN_LAB_PROCESSING') {
        where.AND.push({ status: 'IN_LAB_PROCESSING' });
      } else if (s === 'REPORT_UPLOAD_PENDING') {
        where.AND.push({ status: 'REPORT_UPLOAD_PENDING' });
      } else if (s === 'CANCELLED') {
        where.AND.push({ status: 'CANCELLED' });
      } else {
        where.AND.push({ status: status as any });
      }
    }

    if (bookingType && bookingType !== 'ALL') {
      where.AND.push({ bookingType: bookingType as any });
    }

    if (hospitalId && hospitalId !== 'ALL') {
      where.AND.push({ hospitalId });
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.AND.push({ createdAt: { gte: startOfDay, lte: endOfDay } });
    }

    if (gender && gender !== 'ALL') {
      where.AND.push({ patient: { gender: { equals: gender, mode: 'insensitive' } } });
    }

    if (place && place !== 'ALL') {
      where.AND.push({
        OR: [
          { collectionAddress: { contains: place, mode: 'insensitive' } },
          { patient: { address: { contains: place, mode: 'insensitive' } } },
          { hospital: { city: { contains: place, mode: 'insensitive' } } }
        ]
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const totalCount = await prisma.labBooking.count({ where });

    const bookings = await prisma.labBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        patient: { select: { id: true, name: true, phone: true, email: true, gender: true, dob: true } },
        hospital: { select: { id: true, name: true, city: true, businessType: true, contactPhone: true } },
        items: {
          include: {
            labTest: {
              include: {
                platformTest: { select: { id: true, name: true, code: true, specimenType: true, canBeCollectedAtHome: true } }
              }
            }
          }
        }
      }
    });

    const formatStatusLabel = (st: string) => {
      switch (st) {
        case 'REQUESTED': return 'Pending';
        case 'ASSIGNED': return 'Sample Collection Scheduled';
        case 'SAMPLE_COLLECTED': return 'Sample Collected';
        case 'IN_LAB_PROCESSING': return 'Lab Processing';
        case 'REPORT_UPLOAD_PENDING': return 'Report Upload Pending';
        case 'REPORT_READY':
        case 'COMPLETED': return 'Completed';
        case 'CANCELLED': return 'Cancelled';
        default: return st;
      }
    };

    const formatted = bookings.map((b, idx) => ({
      sno: ((page - 1) * limit) + idx + 1,
      id: b.id.substring(0, 8).toUpperCase(),
      rawId: b.id,
      patientId: b.patientId,
      patientName: b.patient?.name || 'Unknown Patient',
      patientPhone: b.patient?.phone || '',
      patientEmail: b.patient?.email || '',
      patientGender: b.patient?.gender || '',
      patientDob: b.patient?.dob || '',
      hospitalId: b.hospitalId,
      labName: b.hospital?.name || 'Unknown Lab',
      hospitalName: b.hospital?.name || 'Unknown Lab',
      labCity: b.hospital?.city || '',
      bookingType: b.bookingType,
      collectionMethod: b.bookingType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit',
      collectionAddress: b.collectionAddress,
      collectionDate: b.collectionDate,
      collectionTimeSlot: b.collectionTimeSlot,
      sampleCollectedAt: b.sampleCollectedAt,
      phlebotomistName: b.phlebotomistName,
      phlebotomistPhone: b.phlebotomistPhone,
      status: b.status,
      statusLabel: formatStatusLabel(b.status),
      testCount: b.items.length,
      testNames: b.items.map(i => i.labTest?.platformTest?.name || 'Diagnostic Test').join(', '),
      tests: b.items.map(i => ({
        id: i.id,
        testId: i.labTestId,
        name: i.labTest?.platformTest?.name || 'Diagnostic Test',
        code: i.labTest?.platformTest?.code,
        price: i.price,
        specimenType: i.labTest?.platformTest?.specimenType,
        tatHours: i.labTest?.tatHours
      })),
      totalAmount: b.totalAmount,
      homeCollectionFee: b.homeCollectionFee,
      reportUrl: b.reportUrl,
      hasReport: !!b.reportUrl,
      reportStatus: b.reportUrl ? 'Uploaded' : (['REPORT_READY', 'COMPLETED'].includes(b.status) ? 'Ready' : 'Pending'),
      cancellationReason: b.cancellationReason,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      date: new Date(b.createdAt).toLocaleDateString(),
      time: new Date(b.createdAt).toLocaleTimeString(),
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLabBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const booking = await prisma.labBooking.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, phone: true, email: true, gender: true, dob: true, avatar: true } },
        hospital: { select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, addressLine1: true, addressLine2: true, businessType: true } },
        items: {
          include: {
            labTest: {
              include: { platformTest: true }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Lab booking not found' });
    }

    // Also look up reports uploaded for this patient
    const reports = await prisma.patientReport.findMany({
      where: {
        userId: booking.patientId,
        OR: [
          { fileUrl: booking.reportUrl || '' },
          { summary: { contains: booking.id.substring(0, 8).toUpperCase() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        ...booking,
        orderId: booking.id.substring(0, 8).toUpperCase(),
        reports
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateLabBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, cancellationReason, phlebotomistName, phlebotomistPhone, collectionDate, collectionTimeSlot } = req.body;
    
    const validStatuses = [
      'REQUESTED',
      'ASSIGNED',
      'SAMPLE_COLLECTED',
      'IN_LAB_PROCESSING',
      'REPORT_UPLOAD_PENDING',
      'REPORT_READY',
      'COMPLETED',
      'CANCELLED'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const booking = await prisma.labBooking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Lab booking not found' });
    }

    // Business transition validation
    const current = booking.status;
    const isTerminal = ['CANCELLED', 'COMPLETED'].includes(current) || (current === 'REPORT_READY' && booking.reportUrl);

    if (isTerminal && status !== current) {
      return res.status(400).json({
        success: false,
        message: `Order is already in terminal state '${current}' and cannot be altered.`
      });
    }

    // Validate lifecycle progression
    if (status === 'CANCELLED') {
      if (!cancellationReason && !req.body.reason) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation reason is required to cancel an order.'
        });
      }
    } else if (current === 'REQUESTED' && !['ASSIGNED', 'SAMPLE_COLLECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: Pending orders can only move to Sample Collection Scheduled, Sample Collected, or Cancelled.`
      });
    } else if (current === 'ASSIGNED' && !['SAMPLE_COLLECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: Scheduled orders must have samples collected before proceeding.`
      });
    } else if (current === 'SAMPLE_COLLECTED' && !['IN_LAB_PROCESSING', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: Collected samples must enter Lab Processing next.`
      });
    } else if (current === 'IN_LAB_PROCESSING' && !['REPORT_UPLOAD_PENDING', 'REPORT_READY', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from Lab Processing.`
      });
    }

    const updateData: any = { status };
    if (status === 'CANCELLED') {
      updateData.cancellationReason = cancellationReason || req.body.reason;
    }
    if (status === 'ASSIGNED') {
      if (phlebotomistName) updateData.phlebotomistName = phlebotomistName;
      if (phlebotomistPhone) updateData.phlebotomistPhone = phlebotomistPhone;
      if (collectionDate) updateData.collectionDate = new Date(collectionDate);
      if (collectionTimeSlot) updateData.collectionTimeSlot = collectionTimeSlot;
    }
    if (status === 'SAMPLE_COLLECTED') {
      updateData.sampleCollectedAt = req.body.sampleCollectedAt ? new Date(req.body.sampleCollectedAt) : new Date();
    }

    const updated = await prisma.labBooking.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        hospital: { select: { id: true, name: true } }
      }
    });

    res.json({
      success: true,
      data: updated,
      message: `Order status updated to ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const uploadLabReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { fileData, fileName } = req.body;
    
    if (!fileData || !fileName) {
      return res.status(400).json({ success: false, message: 'File data and file name are required' });
    }

    const booking = await prisma.labBooking.findUnique({
      where: { id },
      include: { patient: true, hospital: true, items: { include: { labTest: { include: { platformTest: true } } } } }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Lab booking not found' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot upload report for a cancelled order' });
    }

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid file data format. Expected base64 data URI.' });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    
    // Check max file size (10 MB)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 10MB.' });
    }

    const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fs = require('fs');
    const path = require('path');
    const UPLOADS_DIR = path.join(process.cwd(), 'uploads/reports');
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, fileBuffer);

    const relativeUrl = `/uploads/reports/${safeFileName}`;
    const testNames = booking.items.map(i => i.labTest?.platformTest?.name || 'Diagnostic Test').join(', ');

    const newReport = await prisma.patientReport.create({
      data: {
        userId: booking.patientId,
        title: `Lab Report - ${testNames}`,
        hospital: booking.hospital.name,
        date: new Date().toISOString().split('T')[0],
        fileUrl: relativeUrl,
        summary: `Lab report for order ${booking.id.substring(0,8).toUpperCase()}`,
        status: 'Ready',
      },
    });

    const updatedBooking = await prisma.labBooking.update({
      where: { id },
      data: {
        reportUrl: relativeUrl,
        status: 'REPORT_READY'
      }
    });

    res.status(201).json({
      success: true,
      data: {
        report: newReport,
        booking: updatedBooking,
        reportUrl: relativeUrl
      },
      message: 'Report uploaded and order updated to Completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getHomeNursingBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const gender = req.query.gender as string;
      const ageMin = req.query.ageMin as string;
      const ageMax = req.query.ageMax as string;
      const city = req.query.city as string;

      const where: any = {};
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { bookingNumber: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } },
          { nurse: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      if (gender && gender !== 'all') {
        where.patientGender = { equals: gender, mode: 'insensitive' };
      }
      
      if (city && city !== 'all') {
        where.city = { contains: city, mode: 'insensitive' };
      }
      
      if (ageMin || ageMax) {
        where.patientAge = {};
        if (ageMin) where.patientAge.gte = Number(ageMin);
        if (ageMax) where.patientAge.lte = Number(ageMax);
      }


      const totalCount = await prisma.homeNursingBooking.count({ where });

      const bookings = await prisma.homeNursingBooking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true } },
          hospital: { select: { name: true } },
          service: { select: { name: true } },
          nurse: { select: { name: true } }
        }
      });

      const formatted = bookings.map((b) => ({
        id: b.bookingNumber || b.id.substring(0, 8).toUpperCase(),
        rawId: b.id,
        patientName: b.patientName || b.user?.name || 'Unknown',
        hospitalName: b.hospital?.name || 'Unknown',
        serviceName: b.service?.name || 'Unknown',
        nurseName: b.nurse?.name || 'Unassigned',
        duration: b.duration || 'N/A',
        status: b.status,
        totalAmount: b.totalAmount,
        date: new Date(b.serviceDate).toLocaleDateString(),
        time: b.timeSlot,
      }));

      res.json({
        success: true,
        data: formatted,
        pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) }
      });
    } catch (error) {
      next(error);
    }
  };
export const getHomeNursingBookingById = async (req: Request, res: Response, next: NextFunction) => { try { const id = req.params.id as string; const booking = await prisma.homeNursingBooking.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, phone: true, email: true, gender: true, dob: true, avatar: true } }, hospital: { select: { id: true, name: true, contactPhone: true, city: true, addressLine1: true } }, service: true, nurse: { select: { id: true, name: true, phone: true, specialization: true } } } }); if (!booking) { return res.status(404).json({ success: false, message: 'Home nursing booking not found' }); } res.json({ success: true, data: booking }); } catch (error) { next(error); } };
export const updateHomeNursingBookingStatus = async (req: Request, res: Response, next: NextFunction) => { try { const id = req.params.id as string; const { status } = req.body; const validStatuses = ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']; if (!validStatuses.includes(status as any)) { return res.status(400).json({ success: false, message: 'Invalid status' }); } const updated = await prisma.homeNursingBooking.update({ where: { id }, data: { status: status as any } }); res.json({ success: true, data: updated, message: 'Status updated successfully' }); } catch (error) { next(error); } };

export const getPatientFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: {
        address: true,
        patientBookings: {
          select: {
            hospital: { select: { id: true, name: true } }
          }
        }
      }
    });

    const cities = new Set<string>();
    const hospitalsMap = new Map<string, string>();

    patients.forEach(p => {
      if (p.address) {
        const parts = p.address.split(',');
        let city = '';
        if (parts.length > 1) {
           city = parts[parts.length - 2].trim() || parts[0].trim();
        } else {
           city = p.address.trim();
        }
        if (city) cities.add(city);
      }
      p.patientBookings?.forEach((b: any) => {
        if (b.hospital) hospitalsMap.set(b.hospital.id, b.hospital.name);
      });
    });

    const hospitals = Array.from(hospitalsMap.entries()).map(([id, name]) => ({ id, name }));

    res.json({
      success: true,
      data: {
        cities: Array.from(cities).filter(Boolean).sort(),
        hospitals: hospitals.sort((a, b) => a.name.localeCompare(b.name))
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { verificationStatus: 'PENDING', businessType: 'HOSPITAL' },
      orderBy: { createdAt: 'desc' }
    });
    
    // Also include Labs that are created as HOSPITAL businessType
    const standaloneLabs = await prisma.hospital.findMany({
      where: { verificationStatus: 'PENDING', businessType: 'LABORATORY' },
      orderBy: { createdAt: 'desc' }
    });

    const hospitalBasedLabsRaw = await prisma.lab.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        hospital: {
          select: { id: true, name: true, city: true, state: true, hospitalShare: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const hospitalBasedLabs = hospitalBasedLabsRaw.map(lab => ({
      ...lab,
      hospitalShare: lab.hospital?.hospitalShare ?? null
    }));

    res.json({
      success: true,
      data: {
        hospitals,
        standaloneLabs,
        hospitalBasedLabs
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateVerificationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, type } = req.params; // type = 'hospital' | 'lab'
    const { status, cancellationReason, hospitalSharePercentage } = req.body;

    if (!['APPROVED', 'CANCELLED', 'CONFIGURED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (status === 'CANCELLED' && !cancellationReason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is mandatory' });
    }

    // Validate commission percentage if provided
    if (hospitalSharePercentage !== undefined) {
      const shareNum = Number(hospitalSharePercentage);
      if (isNaN(shareNum) || shareNum < 0 || shareNum > 100) {
        return res.status(400).json({ success: false, message: 'Commission percentages must be between 0% and 100% and total 100%.' });
      }
    }

    let updatedRecord;

    if (type === 'hospital') {
      const updateData: any = {};
      if (['APPROVED', 'CANCELLED'].includes(status)) {
        updateData.verificationStatus = String(status);
        if (status === 'CANCELLED') {
          updateData.cancellationReason = String(cancellationReason);
          updateData.cancelledAt = new Date();
          updateData.cancelledBy = req.user?.id || null;
        }
      }
      if (hospitalSharePercentage !== undefined) {
        updateData.hospitalShare = Number(hospitalSharePercentage);
      }

      updatedRecord = await prisma.hospital.update({
        where: { id: String(id) },
        data: updateData
      });
    } else if (type === 'lab') {
      try {
        const updateData: any = {};
        if (['APPROVED', 'CANCELLED'].includes(status)) {
          updateData.verificationStatus = String(status);
          if (status === 'CANCELLED') {
            updateData.cancellationReason = String(cancellationReason);
            updateData.cancelledAt = new Date();
            updateData.cancelledBy = req.user?.id || null;
          }
        }
        // If hospital-based lab, also update associated hospital's share or standalone lab's share
        updatedRecord = await prisma.lab.update({
          where: { id: String(id) },
          data: updateData,
          include: { hospital: true }
        });

        if (hospitalSharePercentage !== undefined && updatedRecord.hospitalId) {
          await prisma.hospital.update({
            where: { id: updatedRecord.hospitalId },
            data: { hospitalShare: Number(hospitalSharePercentage) }
          });
        }
      } catch (err: any) {
        if (err.code === 'P2025') {
          // Standalone lab stored in hospital table
          const updateData: any = {};
          if (['APPROVED', 'CANCELLED'].includes(status)) {
            updateData.verificationStatus = String(status);
            if (status === 'CANCELLED') {
              updateData.cancellationReason = String(cancellationReason);
              updateData.cancelledAt = new Date();
              updateData.cancelledBy = req.user?.id || null;
            }
          }
          if (hospitalSharePercentage !== undefined) {
            updateData.hospitalShare = Number(hospitalSharePercentage);
          }

          updatedRecord = await prisma.hospital.update({
            where: { id: String(id) },
            data: updateData
          });
        } else {
          throw err;
        }
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    res.json({
      success: true,
      data: updatedRecord,
      message: `Successfully ${status.toLowerCase()} request`
    });
  } catch (error) {
    next(error);
  }
};
// touch


