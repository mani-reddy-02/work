import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import { VideoService } from '../video/video.service';
import { sendNotification } from '../notifications/notifications.service';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '30d';
    const serviceFilter = (req.query.service as string) || 'all';

    const customStartDate = req.query.startDate as string;
    const customEndDate = req.query.endDate as string;

    const now = new Date();
    let startDate = new Date();
    let endDate: Date | undefined = undefined;

    if (customStartDate && customEndDate) {
      if (customStartDate.includes('-')) {
        const [sy, sm, sd] = customStartDate.split('-').map(Number);
        startDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      } else {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
      }

      if (customEndDate.includes('-')) {
        const [ey, em, ed] = customEndDate.split('-').map(Number);
        endDate = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      } else {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (period === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '7d' || period === 'week' || period === 'this_week') {
      // Start of current week (Monday at 00:00:00) to end of week (Sunday at 23:59:59)
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month' || period === 'this_month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === '3m') {
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '6m') {
      startDate.setMonth(startDate.getMonth() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setFullYear(2000); // all time fallback
      startDate.setHours(0, 0, 0, 0);
      endDate = undefined;
    }

    // 1. Operational Counts (All-time distinct totals, not clipped by reporting date filter)
    // 1. Operational Counts (Optimized grouped queries to prevent pool exhaustion)
    const [userRoleCounts, activeDoctorsCount] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }).catch(() => []),
      prisma.user.count({ where: { role: Role.DOCTOR, active: true } }).catch(() => 0)
    ]);

    const roleMap: Record<string, number> = {};
    let totalUsers = 0;
    userRoleCounts.forEach(r => {
      roleMap[r.role] = r._count.id;
      totalUsers += r._count.id;
    });
    const totalPatients = roleMap[Role.PATIENT] || 0;
    const totalDoctors = roleMap[Role.DOCTOR] || 0;
    const totalNurses = roleMap[Role.NURSE] || 0;
    const totalReceptionists = roleMap[Role.RECEPTIONIST] || 0;
    const activeDoctors = activeDoctorsCount;

    // 2. Hospital & Lab grouped counts
    const [hospitalStatusCounts, labStatusCounts, totalDepartments] = await Promise.all([
      prisma.hospital.groupBy({ 
        by: ['verificationStatus'], 
        where: { businessType: 'HOSPITAL' },
        _count: { id: true } 
      }).catch(() => []),
      prisma.lab.groupBy({ by: ['verificationStatus'], _count: { id: true } }).catch(() => []),
      prisma.department.count().catch(() => 0),
    ]);

    let totalHospitals = 0;
    let verifiedHospitals = 0;
    let pendingHospitalVerifications = 0;
    hospitalStatusCounts.forEach(h => {
      totalHospitals += h._count.id;
      if (h.verificationStatus === 'APPROVED') verifiedHospitals += h._count.id;
      if (h.verificationStatus === 'PENDING') pendingHospitalVerifications += h._count.id;
    });

    let totalLabs = 0;
    let pendingLabVerifications = 0;
    labStatusCounts.forEach(l => {
      totalLabs += l._count.id;
      if (l.verificationStatus === 'PENDING') pendingLabVerifications += l._count.id;
    });

    // 3. Requests and Bookings counts
    const [
      pendingMarketingRequests,
      pendingCampRequests,
      allTimeOpBookings,
      allTimeVideoConsultations,
      labBookingTypeCounts,
      allTimeHomeNursingRequests,
      totalInsurances,
    ] = await Promise.all([
      prisma.marketingRequest.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.medicalCampRequest.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.oPBooking.count({
        where: {
          NOT: {
            OR: [
              { opType: 'Video Consultation' },
              { opType: 'VIDEO' },
              { videoConsultation: { isNot: null } }
            ]
          }
        }
      }).catch(() => 0),
      prisma.oPBooking.count({
        where: {
          OR: [
            { opType: 'Video Consultation' },
            { opType: 'VIDEO' },
            { videoConsultation: { isNot: null } }
          ]
        }
      }).catch(() => 0),
      prisma.labBooking.groupBy({ by: ['bookingType'], _count: { id: true } }).catch(() => []),
      prisma.homeNursingBooking.count().catch(() => 0),
      prisma.insurance.count().catch(() => 0),
    ]);

    let allTimeLabOrders = 0;
    let allTimeHomeSampleOrders = 0;
    labBookingTypeCounts.forEach(lb => {
      if (lb.bookingType === 'WALK_IN') allTimeLabOrders = lb._count.id;
      if (lb.bookingType === 'HOME_COLLECTION') allTimeHomeSampleOrders = lb._count.id;
    });

    const hospitalsForShares = await prisma.hospital.findMany({ select: { id: true, name: true, hospitalShare: true } });
    const hospitalMap = new Map(hospitalsForShares.map(h => [h.id, h]));

    // 2. Date-filtered Booking Queries for Analytics & Workflows
    const dateFilter: any = {};
    if (period !== 'all') {
      dateFilter.createdAt = { gte: startDate };
      if (endDate) {
        dateFilter.createdAt.lte = endDate;
      }
    }

    // OP Bookings query
    const opBookings = await prisma.oPBooking.findMany({
      where: serviceFilter === 'all' || serviceFilter === 'op' || serviceFilter === 'video' ? dateFilter : { id: 'none' },
      select: {
        id: true,
        fee: true,
        status: true,
        hospitalAmount: true,
        mediqueeAmount: true,
        createdAt: true,
        hospitalId: true,
        departmentId: true,
        doctorId: true,
        appointmentDate: true,
        opType: true,
        department: { select: { name: true } },
        doctor: { select: { name: true } },
        videoConsultation: {
          select: {
            id: true,
            status: true,
            durationSeconds: true,
            startedAt: true,
            endedAt: true,
          }
        }
      }
    });

    // Lab Bookings query (Both WALK_IN and HOME_COLLECTION)
    const labBookings = await prisma.labBooking.findMany({
      where: serviceFilter === 'all' || serviceFilter === 'lab' || serviceFilter === 'home_sample' ? dateFilter : { id: 'none' },
      select: {
        id: true,
        bookingType: true,
        status: true,
        totalAmount: true,
        homeCollectionFee: true,
        hospitalAmount: true,
        mediqueeAmount: true,
        createdAt: true,
        hospitalId: true,
        phlebotomistName: true,
        reportUrl: true,
        sampleCollectedAt: true,
      }
    });

    // Home Nursing Bookings query
    const nursingBookings = await prisma.homeNursingBooking.findMany({
      where: serviceFilter === 'all' || serviceFilter === 'home_nursing' ? dateFilter : { id: 'none' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        hospitalAmount: true,
        mediqueeAmount: true,
        createdAt: true,
        hospitalId: true,
        nurseId: true,
        serviceDate: true,
      }
    });

    // 3. Service Workflow Status Breakdown
    // OP Booking workflow (PENDING, WAITING, IN_CONSULTATION, COMPLETED, CANCELLED)
    const opStatusCounts: Record<string, number> = {
      PENDING: 0,
      WAITING: 0,
      IN_CONSULTATION: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    // Helper to determine if an OP booking is a Video Consultation
    const isVideoBooking = (b: any) =>
      b.opType === 'Video Consultation' || b.opType === 'VIDEO' || (b.videoConsultation !== null && b.videoConsultation !== undefined);

    const inPersonOpBookings = opBookings.filter(b => !isVideoBooking(b));
    const videoConsultationsList = opBookings.filter(b => isVideoBooking(b));

    // 1. In-Person OP Workflow
    let opTodayAppointments = 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const departmentBookingsMap: Record<string, number> = {};
    const doctorBookingsMap: Record<string, number> = {};

    inPersonOpBookings.forEach(b => {
      const st = b.status || 'WAITING';
      opStatusCounts[st] = (opStatusCounts[st] || 0) + 1;

      const apptDate = new Date(b.appointmentDate || b.createdAt);
      if (apptDate >= todayStart && apptDate <= todayEnd) {
        opTodayAppointments += 1;
      }

      const deptName = b.department?.name || 'General';
      departmentBookingsMap[deptName] = (departmentBookingsMap[deptName] || 0) + 1;

      const docName = b.doctor?.name ? `Dr. ${b.doctor.name.replace(/^Dr\.\s*/i, '')}` : 'General Physician';
      doctorBookingsMap[docName] = (doctorBookingsMap[docName] || 0) + 1;
    });

    const opTotal = inPersonOpBookings.length;
    const opCompleted = opStatusCounts['COMPLETED'] || 0;
    const opCancelled = opStatusCounts['CANCELLED'] || 0;
    const opCompletionRate = opTotal > 0 ? Number(((opCompleted / opTotal) * 100).toFixed(1)) : 0;
    const opCancellationRate = opTotal > 0 ? Number(((opCancelled / opTotal) * 100).toFixed(1)) : 0;

    // 2. Video Consultations Workflow
    const videoStatusCounts: Record<string, number> = {
      SCHEDULED: 0,
      WAITING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      FAILED: 0,
    };

    videoConsultationsList.forEach(v => {
      const rawStatus = v.videoConsultation?.status || v.status || 'SCHEDULED';
      let st = rawStatus.toUpperCase();
      if (st === 'IN_CONSULTATION') st = 'IN_PROGRESS';
      if (st === 'PENDING') st = 'WAITING';
      if (st === 'CONFIRMED') st = 'SCHEDULED';
      if (videoStatusCounts[st] === undefined) videoStatusCounts[st] = 0;
      videoStatusCounts[st] += 1;
    });

    const videoTotal = videoConsultationsList.length;
    const videoCompleted = videoStatusCounts['COMPLETED'] || 0;
    const videoCancelled = (videoStatusCounts['CANCELLED'] || 0) + (videoStatusCounts['FAILED'] || 0);
    const videoCompletionRate = videoTotal > 0 ? Number(((videoCompleted / videoTotal) * 100).toFixed(1)) : 0;
    const videoCancellationRate = videoTotal > 0 ? Number(((videoCancelled / videoTotal) * 100).toFixed(1)) : 0;

    // Lab Visit Workflow (WALK_IN)
    const labVisitOrders = labBookings.filter(b => b.bookingType === 'WALK_IN');
    const labVisitStatusCounts: Record<string, number> = {
      REQUESTED: 0,
      ASSIGNED: 0,
      SAMPLE_COLLECTED: 0,
      IN_LAB_PROCESSING: 0,
      REPORT_UPLOAD_PENDING: 0,
      REPORT_READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    labVisitOrders.forEach(b => {
      const st = b.status || 'REQUESTED';
      labVisitStatusCounts[st] = (labVisitStatusCounts[st] || 0) + 1;
    });
    const labVisitTotal = labVisitOrders.length;
    const labVisitCompleted = (labVisitStatusCounts['COMPLETED'] || 0) + (labVisitStatusCounts['REPORT_READY'] || 0);
    const labVisitCancelled = labVisitStatusCounts['CANCELLED'] || 0;
    const labVisitCompletionRate = labVisitTotal > 0 ? Number(((labVisitCompleted / labVisitTotal) * 100).toFixed(1)) : 0;
    const labVisitCancellationRate = labVisitTotal > 0 ? Number(((labVisitCancelled / labVisitTotal) * 100).toFixed(1)) : 0;

    // Home Sample Collection Workflow (HOME_COLLECTION)
    const homeSampleOrders = labBookings.filter(b => b.bookingType === 'HOME_COLLECTION');
    const homeSampleStatusCounts: Record<string, number> = {
      REQUESTED: 0,
      ASSIGNED: 0,
      SAMPLE_COLLECTED: 0,
      IN_LAB_PROCESSING: 0,
      REPORT_UPLOAD_PENDING: 0,
      REPORT_READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    homeSampleOrders.forEach(b => {
      const st = b.status || 'REQUESTED';
      homeSampleStatusCounts[st] = (homeSampleStatusCounts[st] || 0) + 1;
    });
    const homeSampleTotal = homeSampleOrders.length;
    const homeSampleCompleted = (homeSampleStatusCounts['COMPLETED'] || 0) + (homeSampleStatusCounts['REPORT_READY'] || 0);
    const homeSampleCancelled = homeSampleStatusCounts['CANCELLED'] || 0;
    const homeSampleCompletionRate = homeSampleTotal > 0 ? Number(((homeSampleCompleted / homeSampleTotal) * 100).toFixed(1)) : 0;
    const homeSampleCancellationRate = homeSampleTotal > 0 ? Number(((homeSampleCancelled / homeSampleTotal) * 100).toFixed(1)) : 0;

    // Home Nursing Workflow (CONFIRMED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
    const homeNursingStatusCounts: Record<string, number> = {
      CONFIRMED: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    nursingBookings.forEach(b => {
      const st = b.status || 'CONFIRMED';
      homeNursingStatusCounts[st] = (homeNursingStatusCounts[st] || 0) + 1;
    });
    const homeNursingTotal = nursingBookings.length;
    const homeNursingCompleted = homeNursingStatusCounts['COMPLETED'] || 0;
    const homeNursingCancelled = homeNursingStatusCounts['CANCELLED'] || 0;
    const homeNursingCompletionRate = homeNursingTotal > 0 ? Number(((homeNursingCompleted / homeNursingTotal) * 100).toFixed(1)) : 0;
    const homeNursingCancellationRate = homeNursingTotal > 0 ? Number(((homeNursingCancelled / homeNursingTotal) * 100).toFixed(1)) : 0;

    // 4. Financial Calculations & Reconciliation
    let grossRevenue = 0, adminCommission = 0, providerShare = 0;
    let opGross = 0, opAdmin = 0, opProv = 0;
    let videoGross = 0, videoAdmin = 0, videoProv = 0;
    let labVisitGross = 0, labVisitAdmin = 0, labVisitProv = 0;
    let homeSampleGross = 0, homeSampleAdmin = 0, homeSampleProv = 0;
    let nurseGross = 0, nurseAdmin = 0, nurseProv = 0;

    const trendsMap: Record<string, { gross: number, admin: number, provider: number }> = {};
    const hospitalRevMap: Record<string, { id: string, name: string, gross: number, admin: number, provider: number, transactions: number }> = {};

    const getFormatKey = (date: Date) => {
      if (period === 'today') return String(date.getHours()).padStart(2, '0') + ':00';
      if (['7d', 'week', 'this_week', '30d', 'month', 'this_month', 'custom'].includes(period)) return date.toISOString().slice(0, 10);
      return date.toISOString().slice(0, 7); // YYYY-MM
    };

    const processBooking = (b: any, fee: number) => {
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

    // Calculate OP and Video finance separately
    opBookings.forEach(b => {
      const fee = b.fee || 0;
      const { prov, admin } = processBooking(b, fee);
      if (isVideoBooking(b)) {
        videoGross += fee; videoProv += prov; videoAdmin += admin;
      } else {
        opGross += fee; opProv += prov; opAdmin += admin;
      }
    });

    // Calculate Lab Visit and Home Sample finance separately
    labBookings.forEach(b => {
      const fee = b.totalAmount || 0;
      const { prov, admin } = processBooking(b, fee);
      if (b.bookingType === 'HOME_COLLECTION') {
        homeSampleGross += fee; homeSampleProv += prov; homeSampleAdmin += admin;
      } else {
        labVisitGross += fee; labVisitProv += prov; labVisitAdmin += admin;
      }
    });

    // Calculate Nursing finance
    nursingBookings.forEach(b => {
      const fee = b.totalAmount || 0;
      const { prov, admin } = processBooking(b, fee);
      nurseGross += fee; nurseProv += prov; nurseAdmin += admin;
    });

    const transactions = opBookings.length + labBookings.length + nursingBookings.length;

    const revenueByService = [
      { name: 'OP Bookings', gross: opGross, admin: opAdmin, provider: opProv, transactions: inPersonOpBookings.length },
      { name: 'Video Consultations', gross: videoGross, admin: videoAdmin, provider: videoProv, transactions: videoConsultationsList.length },
      { name: 'Lab Visits', gross: labVisitGross, admin: labVisitAdmin, provider: labVisitProv, transactions: labVisitOrders.length },
      { name: 'Home Sample Collection', gross: homeSampleGross, admin: homeSampleAdmin, provider: homeSampleProv, transactions: homeSampleOrders.length },
      { name: 'Home Nursing', gross: nurseGross, admin: nurseAdmin, provider: nurseProv, transactions: nursingBookings.length },
    ];

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

    // Formatted department and doctor chart distributions
    const departmentDistribution = Object.entries(departmentBookingsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const doctorDistribution = Object.entries(doctorBookingsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 5. Actionable Pending Items
    const actionablePending = {
      hospitals: pendingHospitalVerifications,
      labs: pendingLabVerifications,
      marketingRequests: pendingMarketingRequests,
      campRequests: pendingCampRequests,
      opWaiting: opStatusCounts['WAITING'] || 0,
      labReportsPending: (labVisitStatusCounts['IN_LAB_PROCESSING'] || 0) + (homeSampleStatusCounts['IN_LAB_PROCESSING'] || 0),
      homeSampleRequested: homeSampleStatusCounts['REQUESTED'] || 0,
      homeNursingConfirmed: homeNursingStatusCounts['CONFIRMED'] || 0,
    };

    // 6. Recent Activities Feed across services
    const recentOP = await prisma.oPBooking.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        patientName: true,
        status: true,
        fee: true,
        createdAt: true,
        hospital: { select: { name: true } },
        videoConsultation: { select: { id: true } }
      }
    });

    const recentLabs = await prisma.labBooking.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookingType: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        hospital: { select: { name: true } },
        patient: { select: { name: true } }
      }
    });

    const recentNursing = await prisma.homeNursingBooking.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        patientName: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        hospital: { select: { name: true } }
      }
    });

    const recentActivity = [
      ...recentOP.map(o => ({
        id: o.id,
        service: o.videoConsultation ? 'Video Consultation' : 'OP Booking',
        title: `${o.videoConsultation ? 'Virtual Consult' : 'OP Booking'} for ${o.patientName}`,
        hospital: o.hospital?.name || 'Unknown',
        amount: o.fee,
        status: o.status,
        timestamp: o.createdAt,
        link: `/admin/op-bookings/${o.id}`,
      })),
      ...recentLabs.map(l => ({
        id: l.id,
        service: l.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Test',
        title: `${l.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Visit'} for ${l.patient?.name || 'Patient'}`,
        hospital: l.hospital?.name || 'Unknown',
        amount: l.totalAmount,
        status: l.status,
        timestamp: l.createdAt,
        link: l.bookingType === 'HOME_COLLECTION' ? `/admin/home-sample/${l.id}` : `/admin/lab-tests/${l.id}`,
      })),
      ...recentNursing.map(n => ({
        id: n.id,
        service: 'Home Nursing',
        title: `Home Nursing request for ${n.patientName}`,
        hospital: n.hospital?.name || 'Unknown',
        amount: n.totalAmount,
        status: n.status,
        timestamp: n.createdAt,
        link: `/admin/home-nursing/${n.id}`,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    res.json({
      success: true,
      data: {
        // Platform Overview Tiles
        overview: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalHospitals,
          totalDepartments,
          totalLabs,
          activeDoctors,
          verifiedHospitals,
          totalOpBookings: allTimeOpBookings,
          totalVideoConsultations: allTimeVideoConsultations,
          totalLabOrders: allTimeLabOrders,
          totalHomeSampleOrders: allTimeHomeSampleOrders,
          totalHomeNursingRequests: allTimeHomeNursingRequests,
          totalNurses,
          totalReceptionists,
          totalInsurances,
          pendingHospitalVerifications,
          pendingLabVerifications,
        },

        // Detailed Service Workflows
        services: {
          op: {
            total: opTotal,
            pending: (opStatusCounts['PENDING'] || 0) + (opStatusCounts['WAITING'] || 0),
            waiting: opStatusCounts['WAITING'] || 0,
            inConsultation: opStatusCounts['IN_CONSULTATION'] || 0,
            todayAppointments: opTodayAppointments,
            completed: opCompleted,
            cancelled: opCancelled,
            completionRate: opCompletionRate,
            cancellationRate: opCancellationRate,
            statusDistribution: Object.entries(opStatusCounts).filter(([_, count]) => count > 0).map(([status, count]) => ({ name: status, value: count })),
          },
          video: {
            isSupported: true,
            total: videoTotal,
            scheduled: videoStatusCounts['SCHEDULED'] || 0,
            waiting: videoStatusCounts['WAITING'] || 0,
            inProgress: videoStatusCounts['IN_PROGRESS'] || 0,
            completed: videoCompleted,
            cancelled: videoStatusCounts['CANCELLED'] || 0,
            failed: videoStatusCounts['FAILED'] || 0,
            completionRate: videoCompletionRate,
            cancellationRate: videoCancellationRate,
            statusDistribution: Object.entries(videoStatusCounts).filter(([_, count]) => count > 0).map(([status, count]) => ({ name: status, value: count })),
          },
          labVisit: {
            total: labVisitTotal,
            requested: labVisitStatusCounts['REQUESTED'] || 0,
            assigned: labVisitStatusCounts['ASSIGNED'] || 0,
            sampleCollected: labVisitStatusCounts['SAMPLE_COLLECTED'] || 0,
            inProcessing: labVisitStatusCounts['IN_LAB_PROCESSING'] || 0,
            reportUploadPending: labVisitStatusCounts['REPORT_UPLOAD_PENDING'] || 0,
            reportReady: labVisitStatusCounts['REPORT_READY'] || 0,
            completed: labVisitStatusCounts['COMPLETED'] || 0,
            cancelled: labVisitCancelled,
            completionRate: labVisitCompletionRate,
            cancellationRate: labVisitCancellationRate,
            statusDistribution: Object.entries(labVisitStatusCounts).filter(([_, count]) => count > 0).map(([status, count]) => ({ name: status, value: count })),
          },
          homeSample: {
            total: homeSampleTotal,
            requested: homeSampleStatusCounts['REQUESTED'] || 0,
            assigned: homeSampleStatusCounts['ASSIGNED'] || 0,
            sampleCollected: homeSampleStatusCounts['SAMPLE_COLLECTED'] || 0,
            inProcessing: homeSampleStatusCounts['IN_LAB_PROCESSING'] || 0,
            reportUploadPending: homeSampleStatusCounts['REPORT_UPLOAD_PENDING'] || 0,
            reportReady: homeSampleStatusCounts['REPORT_READY'] || 0,
            completed: homeSampleStatusCounts['COMPLETED'] || 0,
            cancelled: homeSampleCancelled,
            completionRate: homeSampleCompletionRate,
            cancellationRate: homeSampleCancellationRate,
            statusDistribution: Object.entries(homeSampleStatusCounts).filter(([_, count]) => count > 0).map(([status, count]) => ({ name: status, value: count })),
          },
          homeNursing: {
            total: homeNursingTotal,
            confirmed: homeNursingStatusCounts['CONFIRMED'] || 0,
            assigned: homeNursingStatusCounts['ASSIGNED'] || 0,
            inProgress: homeNursingStatusCounts['IN_PROGRESS'] || 0,
            completed: homeNursingCompleted,
            cancelled: homeNursingCancelled,
            completionRate: homeNursingCompletionRate,
            cancellationRate: homeNursingCancellationRate,
            statusDistribution: Object.entries(homeNursingStatusCounts).filter(([_, count]) => count > 0).map(([status, count]) => ({ name: status, value: count })),
          },
        },

        // Financial Metrics & Reconciliations
        financial: {
          grossRevenue,
          adminCommission,
          providerShare,
          transactions,
          pendingSettlements: 0,
          revenueTrend,
          revenueByService,
          revenueByHospital,
          topHospitals,
        },

        // Department and Doctor Charts
        departmentDistribution,
        doctorDistribution,

        // Actionable Pending Actions
        actionablePending,

        // Recent Activity Feed
        recentActivity,

        // Legacy compatibility mappings
        totalHospitals,
        totalPatients,
        totalDoctors,
        totalDepartments,
        activeDoctors,
        verifiedHospitals,
        pendingVerifications: pendingHospitalVerifications,
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
        appointmentStatuses: Object.entries(opStatusCounts).map(([k, v]) => ({ name: k, value: v })),
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
    const { search, location, verificationStatus, status } = req.query;

    const andConditions: any[] = [
      { businessType: 'HOSPITAL' }
    ];

    if (search && (search as string).trim() !== '') {
      const s = (search as string).trim();
      andConditions.push({
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { id: { contains: s, mode: 'insensitive' } },
          { city: { contains: s, mode: 'insensitive' } },
          { state: { contains: s, mode: 'insensitive' } },
          { area: { contains: s, mode: 'insensitive' } },
          { addressLine1: { contains: s, mode: 'insensitive' } },
          { contactPhone: { contains: s, mode: 'insensitive' } },
          { contactEmail: { contains: s, mode: 'insensitive' } },
          { registrationNumber: { contains: s, mode: 'insensitive' } },
        ]
      });
    }
    if (location && location !== 'all') {
      const loc = (location as string).trim();
      andConditions.push({
        OR: [
          { city: { equals: loc, mode: 'insensitive' } },
          { state: { equals: loc, mode: 'insensitive' } }
        ]
      });
    }
    if (verificationStatus && verificationStatus !== 'all') {
      const vStatus = (verificationStatus as string).toUpperCase();
      if (vStatus === 'APPROVED' || vStatus === 'VERIFIED') {
        andConditions.push({
          verificationStatus: { in: ['APPROVED', 'VERIFIED'] }
        });
      } else if (vStatus === 'PENDING') {
        andConditions.push({
          verificationStatus: { equals: 'PENDING', mode: 'insensitive' }
        });
      } else if (vStatus === 'CANCELLED' || vStatus === 'REJECTED') {
        andConditions.push({
          verificationStatus: { in: ['CANCELLED', 'REJECTED'] }
        });
      } else {
        andConditions.push({
          verificationStatus: { equals: verificationStatus as string, mode: 'insensitive' }
        });
      }
    }

    const whereClause: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [total, hospitals, totalHospitalsCount, approvedHospitalsCount, pendingHospitalsCount] = await Promise.all([
      prisma.hospital.count({ where: whereClause }),
      prisma.hospital.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { departments: true, users: true } },
          verifications: true,
        },
      }),
      prisma.hospital.count({ where: { businessType: 'HOSPITAL' } }),
      prisma.hospital.count({ where: { businessType: 'HOSPITAL', verificationStatus: { in: ['APPROVED', 'VERIFIED'] } } }),
      prisma.hospital.count({ where: { businessType: 'HOSPITAL', verificationStatus: 'PENDING' } })
    ]);

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
      verificationStatus: h.verificationStatus || (h.verifications.length > 0 ? 'APPROVED' : 'PENDING'),
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
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: {
        total: totalHospitalsCount,
        approved: approvedHospitalsCount,
        pending: pendingHospitalsCount
      }
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { role, gender, ageMin, ageMax, city, hospitalId, specialization, experienceMin, experienceMax, search, status, verificationStatus } = req.query;

    const whereClause: any = { AND: [] };
    if (role) whereClause.role = role;
    if (gender && gender !== 'all') whereClause.gender = { equals: gender as string, mode: 'insensitive' };
    if (city && city !== 'all') whereClause.address = { contains: city as string, mode: 'insensitive' };

    if (status && status !== 'all') {
      whereClause.active = (status === 'ACTIVE' || status === 'VERIFIED');
    }

    if (ageMin || ageMax) {
      const today = new Date();
      whereClause.dob = {};
      if (ageMin) {
        const minDate = new Date(today.getFullYear() - Number(ageMin), today.getMonth(), today.getDate());
        whereClause.dob.lte = minDate.toISOString().split('T')[0];
      }
      if (ageMax) {
        const maxDate = new Date(today.getFullYear() - Number(ageMax) - 1, today.getMonth(), today.getDate() + 1);
        whereClause.dob.gte = maxDate.toISOString().split('T')[0];
      }
    }

    if (hospitalId && hospitalId !== 'all') {
      if (role === 'DOCTOR') {
        whereClause.AND.push({
          OR: [
            { hospitalId: hospitalId as string },
            { doctorBookings: { some: { hospitalId: hospitalId as string } } }
          ]
        });
      } else if (role === 'NURSE') {
        whereClause.AND.push({
          OR: [
            { hospitalId: hospitalId as string },
            { assignedNursingBookings: { some: { hospitalId: hospitalId as string } } }
          ]
        });
      } else if (role === 'RECEPTIONIST') {
        whereClause.hospitalId = hospitalId as string;
      } else if (role === 'PATIENT') {
        whereClause.patientBookings = { some: { hospitalId: hospitalId as string } };
      } else {
        whereClause.hospitalId = hospitalId as string;
      }
    }

    if (specialization && specialization !== 'all') {
      whereClause.AND.push({
        OR: [
          { specialization: { contains: specialization as string, mode: 'insensitive' } },
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

    if (search && (search as string).trim() !== '') {
      const s = (search as string).trim();
      const searchOR: any[] = [
        { name: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { id: { contains: s, mode: 'insensitive' } },
        { address: { contains: s, mode: 'insensitive' } },
      ];
      if (role === 'DOCTOR' || role === 'NURSE' || role === 'RECEPTIONIST' || !role) {
        searchOR.push(
          { designation: { contains: s, mode: 'insensitive' } },
          { hospital: { name: { contains: s, mode: 'insensitive' } } },
          { department: { name: { contains: s, mode: 'insensitive' } } }
        );
      }
      if (role === 'DOCTOR' || role === 'NURSE') {
        searchOR.push(
          { specialization: { contains: s, mode: 'insensitive' } },
          { licenseNumber: { contains: s, mode: 'insensitive' } },
          { qualification: { contains: s, mode: 'insensitive' } }
        );
      }
      whereClause.AND.push({ OR: searchOR });
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
        licenseNumber: true,
        dob: true,
        gender: true,
        address: true,
        hospital: {
          select: { id: true, name: true, city: true, state: true },
        },
        department: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            patientBookings: true,
            assignedNursingBookings: true
          }
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
        designation: u.designation || (u.role === 'NURSE' ? 'Staff Nurse' : u.role === 'RECEPTIONIST' ? 'Front Desk / Receptionist' : 'N/A'),
        qualification: u.qualification || 'N/A',
        specialization: u.department?.name || u.specialization || u.designation || 'Not specified',
        experienceYears: u.experienceYears || 0,
        licenseNumber: u.licenseNumber || 'N/A',
        verificationStatus: u.active ? 'VERIFIED' : 'PENDING',
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        dob: u.dob,
        age: age,
        gender: u.gender || 'Not specified',
        address: u.address,
        city: extractCity,
        hospitalId: u.hospital?.id || null,
        hospitalCity: u.hospital?.city || 'N/A',
        hospitalState: u.hospital?.state || 'N/A',
        appointmentsCount: u._count?.patientBookings || 0,
        assignedNursingBookingsCount: (u as any)._count?.assignedNursingBookings || 0,
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
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
      const rawSearch = (req.query.search as string || '').trim();
      const search = rawSearch !== '' && rawSearch !== 'undefined' && rawSearch !== 'null' ? rawSearch : undefined;

      const parseAge = (val: any) => {
        if (!val || val === 'undefined' || val === 'null') return undefined;
        const num = parseInt(val);
        return isNaN(num) ? undefined : num;
      };
      const ageMin = parseAge(req.query.ageMin);
      const ageMax = parseAge(req.query.ageMax);

      const rawGender = (req.query.gender as string || '').trim();
      const gender = (rawGender && rawGender !== 'ALL' && rawGender !== 'undefined' && rawGender !== 'null') ? rawGender : undefined;

      const rawPlace = (req.query.place as string || '').trim();
      const place = (rawPlace && rawPlace !== 'ALL' && rawPlace !== 'undefined' && rawPlace !== 'null') ? rawPlace : undefined;

      const rawStatus = (req.query.status as string || '').trim();
      const status = (rawStatus && rawStatus !== 'ALL' && rawStatus !== 'undefined' && rawStatus !== 'null') ? rawStatus : undefined;

      const where: any = { AND: [] };

      if (search) {
        where.AND.push({
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { patientName: { contains: search, mode: 'insensitive' } },
            { patientPhone: { contains: search, mode: 'insensitive' } },
            { patientId: { contains: search, mode: 'insensitive' } },
            { patient: { name: { contains: search, mode: 'insensitive' } } },
            { patient: { phone: { contains: search, mode: 'insensitive' } } },
            { doctor: { name: { contains: search, mode: 'insensitive' } } },
            { doctorId: { contains: search, mode: 'insensitive' } },
            { hospital: { name: { contains: search, mode: 'insensitive' } } },
            { department: { name: { contains: search, mode: 'insensitive' } } },
          ]
        });
      }

      if (ageMin !== undefined || ageMax !== undefined) {
        const today = new Date();
        const dobCond: any = {};
        if (ageMin !== undefined && !isNaN(ageMin)) {
          dobCond.lte = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        }
        if (ageMax !== undefined && !isNaN(ageMax)) {
          dobCond.gte = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate() + 1).toISOString().split('T')[0];
        }
        
        const staticAgeCond: any = {};
        if (ageMin !== undefined && !isNaN(ageMin)) staticAgeCond.gte = ageMin;
        if (ageMax !== undefined && !isNaN(ageMax)) staticAgeCond.lte = ageMax;

        where.AND.push({
          OR: [
            { patientAge: staticAgeCond },
            { patient: { dob: dobCond } }
          ]
        });
      }

      if (gender) {
        where.AND.push({
          OR: [
            { patientGender: { equals: gender, mode: 'insensitive' } },
            { patient: { gender: { equals: gender, mode: 'insensitive' } } }
          ]
        });
      }

      if (place) {
        where.AND.push({
          OR: [
            { patient: { address: { contains: place, mode: 'insensitive' } } },
            { hospital: { city: { contains: place, mode: 'insensitive' } } },
            { hospital: { area: { contains: place, mode: 'insensitive' } } },
          ]
        });
      }

      if (status && status !== 'ALL') {
        const s = (status as string).toUpperCase();
        if (s === 'CONFIRMED') {
          where.status = { in: ['PENDING', 'WAITING'] };
        } else if (['PENDING', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'].includes(s)) {
          where.status = s as any;
        }
      }

      if (where.AND.length === 0) {
        delete where.AND;
      }

      const totalCount = await prisma.oPBooking.count({ where });

      const bookings = await prisma.oPBooking.findMany({
        where,
        orderBy: { appointmentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          doctor: { select: { id: true, name: true, specialization: true } },
          hospital: { select: { id: true, name: true, city: true } },
          patient: { select: { id: true, name: true, phone: true, address: true } },
          department: { select: { id: true, name: true } },
          videoConsultation: { select: { id: true, roomName: true, status: true, durationSeconds: true } }
        }
      });
  
      const formatted = bookings.map((b) => ({
        id: b.id,
        bookingId: b.id.substring(0, 8).toUpperCase(),
        patientName: b.patientName || b.patient?.name || 'Unknown',
        patientPhone: b.patient?.phone || 'N/A',
        doctorId: b.doctorId,
        doctorName: b.doctor?.name || 'Unknown',
        departmentId: b.departmentId,
        departmentName: b.department?.name || 'General',
        hospitalId: b.hospitalId,
        hospitalName: b.hospital?.name || 'Unknown',
        date: new Date(b.appointmentDate).toLocaleDateString(),
        appointmentDate: b.appointmentDate.toISOString(),
        time: b.timeSlot || b.slotTime || 'N/A',
        timeSlot: b.timeSlot || b.slotTime || 'N/A',
        status: b.status,
        fee: b.fee,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        patientAge: b.patientAge,
        patientGender: b.patientGender,
        place: b.patient?.address || b.hospital?.city || 'Unknown',
        hasVideo: Boolean(b.videoConsultation),
        videoConsultation: b.videoConsultation || null
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
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            facilityType: true,
            contactPhone: true,
            contactEmail: true,
            addressLine1: true,
            addressLine2: true,
            area: true,
            pincode: true,
            verificationStatus: true
          }
        },
        department: { select: { id: true, name: true, description: true } },
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
        assignedNursingBookings: {
          orderBy: { serviceDate: 'desc' },
          include: {
            hospital: { select: { id: true, name: true, city: true, state: true } },
            service: { select: { id: true, name: true, basePrice: true, duration: true } }
          }
        }
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
    const rawId = (req.params.id as string || '').trim();
    const cleanId = rawId.replace(/^OP-?/i, '');
    const { status, reason, notes } = req.body;
    
    const validStatuses = ['PENDING', 'WAITING', 'IN_CONSULTATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'CONFIRMED', 'ARRIVED', 'CALLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let normalizedStatus: string = status;
    if (status === 'IN_PROGRESS') {
      normalizedStatus = 'IN_CONSULTATION';
    } else if (status === 'CONFIRMED' || status === 'ARRIVED' || status === 'CALLED') {
      normalizedStatus = 'WAITING';
    } else if (status === 'NO_SHOW') {
      normalizedStatus = 'CANCELLED';
    }

    const existing = await prisma.oPBooking.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { id: { startsWith: cleanId } },
          { id: rawId }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Terminal state validation
    if (existing.status === 'COMPLETED' && normalizedStatus !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Cannot modify an already completed appointment' });
    }
    if (existing.status === 'CANCELLED' && normalizedStatus !== 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot modify a cancelled appointment' });
    }

    const updateData: any = { status: normalizedStatus };
    if (reason !== undefined) updateData.reason = reason;
    else if (notes !== undefined) updateData.reason = notes;

    const updated = await prisma.oPBooking.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        doctor: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
        hospital: { select: { id: true, name: true, contactPhone: true } }
      }
    });

    // Notify doctor & staff
    sendNotification({
      hospitalId: updated.hospitalId,
      userId: updated.doctorId,
      title: 'Appointment Status Changed',
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

    // Notify patient
    if (updated.patientId) {
      sendNotification({
        hospitalId: null,
        userId: updated.patientId,
        title: 'Appointment Status Updated',
        message: `Your appointment status has been updated to ${updated.status.replace(/_/g, ' ')}.`,
        type: 'appointment',
        metadata: {
          bookingId: updated.id,
          status: updated.status,
          targetRoles: ['PATIENT']
        },
        targetRoles: ['PATIENT']
      }).catch(console.error);
    }

    res.json({ 
      success: true, 
      data: {
        ...updated,
        updatedAt: updated.updatedAt
      }, 
      message: 'Status updated successfully' 
    });
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
      const normalizedType = (bookingType === 'LAB_VISIT' || bookingType === 'WALK_IN') ? 'WALK_IN' : bookingType;
      where.AND.push({ bookingType: normalizedType as any });
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
      } else if (s === 'PENDING' || s === 'REQUESTED') {
        where.AND.push({ status: 'REQUESTED' });
      } else if (s === 'SAMPLE_COLLECTION' || s === 'ASSIGNED') {
        where.AND.push({ status: 'ASSIGNED' });
      } else if (s === 'SAMPLE_COLLECTED') {
        where.AND.push({ status: 'SAMPLE_COLLECTED' });
      } else if (s === 'IN_PROGRESS' || s === 'LAB_PROCESSING' || s === 'IN_LAB_PROCESSING') {
        where.AND.push({ status: { in: ['SAMPLE_COLLECTED', 'IN_LAB_PROCESSING', 'REPORT_UPLOAD_PENDING'] } });
      } else if (s === 'REPORT_UPLOAD_PENDING') {
        where.AND.push({ status: 'REPORT_UPLOAD_PENDING' });
      } else if (s === 'CANCELLED') {
        where.AND.push({ status: 'CANCELLED' });
      } else {
        where.AND.push({ status: status as any });
      }
    }

    if (bookingType && bookingType !== 'ALL') {
      const normalizedType = (bookingType === 'LAB_VISIT' || bookingType === 'WALK_IN') ? 'WALK_IN' : bookingType;
      where.AND.push({ bookingType: normalizedType as any });
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
    let booking = await prisma.labBooking.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, phone: true, email: true, gender: true, dob: true, avatar: true } },
        hospital: { select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, addressLine1: true, addressLine2: true, businessType: true, hospitalShare: true } },
        items: {
          include: {
            labTest: {
              include: { platformTest: true }
            }
          }
        }
      }
    });

    if (!booking && id.length === 8) {
      booking = await prisma.labBooking.findFirst({
        where: { id: { startsWith: id, mode: 'insensitive' } },
        include: {
          patient: { select: { id: true, name: true, phone: true, email: true, gender: true, dob: true, avatar: true } },
          hospital: { select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, addressLine1: true, addressLine2: true, businessType: true, hospitalShare: true } },
          items: {
            include: {
              labTest: {
                include: { platformTest: true }
              }
            }
          }
        }
      });
    }

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

    // Authoritative dynamic financial & commission calculation
    // Always uses the laboratory's dynamic commission configuration (hospitalShare)
    const configuredLabShare = (booking.hospital?.hospitalShare !== undefined && booking.hospital?.hospitalShare !== null)
      ? Number(booking.hospital.hospitalShare)
      : (booking.hospitalSharePercentage !== null && booking.hospitalSharePercentage !== undefined ? Number(booking.hospitalSharePercentage) : 20);

    const labShareRate = configuredLabShare;
    const adminCommissionRate = 100 - labShareRate;

    const totalEligibleAmount = Number(booking.totalAmount) || 0;
    const labShareAmount = Math.round(((totalEligibleAmount * labShareRate) / 100) * 100) / 100;
    const adminCommissionAmount = Math.round(((totalEligibleAmount * adminCommissionRate) / 100) * 100) / 100;

    const financialBreakdown = {
      isConfigured: true,
      totalBookingAmount: totalEligibleAmount,
      homeCollectionFee: Number(booking.homeCollectionFee) || 0,
      adminCommission: adminCommissionAmount,
      adminCommissionRate,
      labShare: labShareAmount,
      labShareRate,
      testsTotal: booking.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    };

    res.json({
      success: true,
      data: {
        ...booking,
        orderId: booking.id.substring(0, 8).toUpperCase(),
        reports,
        hospitalAmount: labShareAmount,
        hospitalSharePercentage: labShareRate,
        mediqueeAmount: adminCommissionAmount,
        mediqueeCommissionPercentage: adminCommissionRate,
        financialBreakdown
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

      const status = req.query.status as string;
      const date = req.query.date as string;

      const andClauses: any[] = [];
      if (search && (search as string).trim() !== '') {
        const s = (search as string).trim();
        andClauses.push({
          OR: [
            { id: { contains: s, mode: 'insensitive' } },
            { bookingNumber: { contains: s, mode: 'insensitive' } },
            { patientName: { contains: s, mode: 'insensitive' } },
            { patientPhone: { contains: s, mode: 'insensitive' } },
            { user: { name: { contains: s, mode: 'insensitive' } } },
            { user: { phone: { contains: s, mode: 'insensitive' } } },
            { hospital: { name: { contains: s, mode: 'insensitive' } } },
            { nurse: { name: { contains: s, mode: 'insensitive' } } },
            { address: { contains: s, mode: 'insensitive' } },
            { city: { contains: s, mode: 'insensitive' } },
          ]
        });
      }

      if (status && status !== 'all' && status !== 'ALL') {
        andClauses.push({ status: status as any });
      }

      if (gender && gender !== 'all' && gender !== 'ALL') {
        andClauses.push({ patientGender: { equals: gender, mode: 'insensitive' } });
      }
      
      if (city && city !== 'all' && city !== 'ALL') {
        andClauses.push({ city: { contains: city, mode: 'insensitive' } });
      }
      
      if (ageMin || ageMax) {
        const ageCond: any = {};
        if (ageMin) ageCond.gte = Number(ageMin);
        if (ageMax) ageCond.lte = Number(ageMax);
        andClauses.push({ patientAge: ageCond });
      }

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        andClauses.push({ serviceDate: { gte: startOfDay, lte: endOfDay } });
      }

      const where: any = andClauses.length > 0 ? { AND: andClauses } : {};


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
export const getHomeNursingBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const booking = await prisma.homeNursingBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            dob: true,
            avatar: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            contactPhone: true,
            contactEmail: true,
            city: true,
            state: true,
            pincode: true,
            addressLine1: true,
            hospitalShare: true
          }
        },
        service: true,
        nurse: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            specialization: true,
            qualification: true,
            experienceYears: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Home nursing booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const updateHomeNursingBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, reason } = req.body;
    const validStatuses = ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status as any)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const booking = await prisma.homeNursingBooking.findFirst({
      where: { OR: [{ id }, { bookingNumber: id }] }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Home nursing booking not found' });
    }

    // Terminal status protection
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking is already in terminal state '${booking.status}' and cannot be modified.`
      });
    }

    // Admin direct status update is restricted: operational changes (ASSIGNED, IN_PROGRESS, COMPLETED)
    // belong to hospital partner and assigned nurse workflow.
    if (status !== 'CANCELLED' && req.user?.role === Role.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Direct status changes are restricted. Operational status transitions are managed by the assigned healthcare provider or hospital authority.'
      });
    }

    const updateData: any = { status };
    if (status === 'CANCELLED') {
      updateData.paymentStatus = 'REFUNDED';
      if (reason) {
        updateData.notes = booking.notes ? `${booking.notes}\n[Admin Cancellation Reason]: ${reason}` : `[Admin Cancellation Reason]: ${reason}`;
      }
    }

    const updated = await prisma.homeNursingBooking.update({
      where: { id: booking.id },
      data: updateData
    });

    res.json({ success: true, data: updated, message: 'Status updated successfully' });
  } catch (error) {
    next(error);
  }
};

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

export const getNurseFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nurses = await prisma.user.findMany({
      where: { role: Role.NURSE },
      select: {
        hospital: { select: { id: true, name: true } },
        assignedNursingBookings: {
          select: {
            hospital: { select: { id: true, name: true } }
          }
        }
      }
    });

    const hospitalsMap = new Map<string, string>();
    nurses.forEach(n => {
      if (n.hospital) hospitalsMap.set(n.hospital.id, n.hospital.name);
      n.assignedNursingBookings?.forEach((b: any) => {
        if (b.hospital) hospitalsMap.set(b.hospital.id, b.hospital.name);
      });
    });

    if (hospitalsMap.size === 0) {
      const allHospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
      allHospitals.forEach(h => hospitalsMap.set(h.id, h.name));
    }

    const hospitals = Array.from(hospitalsMap.entries()).map(([id, name]) => ({ id, name }));

    res.json({
      success: true,
      data: {
        hospitals: hospitals.sort((a, b) => a.name.localeCompare(b.name))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReceptionistFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recs = await prisma.user.findMany({
      where: { role: Role.RECEPTIONIST },
      select: {
        hospital: { select: { id: true, name: true } }
      }
    });

    const hospitalsMap = new Map<string, string>();
    recs.forEach(r => {
      if (r.hospital) hospitalsMap.set(r.hospital.id, r.hospital.name);
    });

    if (hospitalsMap.size === 0) {
      const allHospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
      allHospitals.forEach(h => hospitalsMap.set(h.id, h.name));
    }

    const hospitals = Array.from(hospitalsMap.entries()).map(([id, name]) => ({ id, name }));

    res.json({
      success: true,
      data: {
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

    const [approvedHospitalsCount, approvedLabsCount, totalPartnersCount] = await Promise.all([
      prisma.hospital.count({ where: { verificationStatus: 'APPROVED', businessType: 'HOSPITAL' } }),
      prisma.hospital.count({ where: { verificationStatus: 'APPROVED', businessType: 'LABORATORY' } }),
      prisma.hospital.count()
    ]);

    res.json({
      success: true,
      data: {
        hospitals,
        standaloneLabs,
        hospitalBasedLabs,
        stats: {
          pending: hospitals.length + standaloneLabs.length + hospitalBasedLabs.length,
          approvedHospitals: approvedHospitalsCount,
          approvedLabs: approvedLabsCount,
          totalPartners: totalPartnersCount
        }
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

/**
 * Get Paginated Video Consultations with Server-Side Filters & Real DB Stats
 */
export const getVideoConsultations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(20, parseInt(req.query.limit as string) || 20));
    const rawSearch = (req.query.search as string || '').trim();
    const search = rawSearch !== '' && rawSearch !== 'undefined' && rawSearch !== 'null' ? rawSearch : undefined;
    const rawStatus = (req.query.status as string || '').trim().toUpperCase();
    const status = (rawStatus && rawStatus !== 'ALL' && rawStatus !== 'UNDEFINED') ? rawStatus : undefined;

    // Base condition for all video consultations in the system
    const baseVideoCondition: any = {
      OR: [
        { opType: 'Video Consultation' },
        { opType: 'VIDEO' },
        { videoConsultation: { isNot: null } }
      ]
    };

    // Calculate real backend statistics across all video consultations
    const allVideoBookings = await prisma.oPBooking.findMany({
      where: baseVideoCondition,
      select: {
        id: true,
        status: true,
        videoConsultation: {
          select: { status: true }
        }
      }
    });

    const stats = {
      total: allVideoBookings.length,
      pending: allVideoBookings.filter(b => ['WAITING', 'PENDING'].includes(b.status)).length,
      scheduled: allVideoBookings.filter(b => ['CONFIRMED', 'SCHEDULED'].includes(b.status)).length,
      inProgress: allVideoBookings.filter(b => b.status === 'IN_CONSULTATION' || b.videoConsultation?.status === 'IN_PROGRESS').length,
      completed: allVideoBookings.filter(b => b.status === 'COMPLETED' || b.videoConsultation?.status === 'COMPLETED').length,
      cancelled: allVideoBookings.filter(b => ['CANCELLED', 'NO_SHOW', 'FAILED'].includes(b.status)).length,
    };

    // Build filter where clause
    const where: any = { AND: [baseVideoCondition] };

    if (search) {
      const cleanSearch = search.toUpperCase().startsWith('VC-') ? search.substring(3).trim() : search;
      where.AND.push({
        OR: [
          { id: { contains: cleanSearch, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          { patientPhone: { contains: search, mode: 'insensitive' } },
          { patient: { name: { contains: search, mode: 'insensitive' } } },
          { patient: { phone: { contains: search, mode: 'insensitive' } } },
          { doctor: { name: { contains: search, mode: 'insensitive' } } },
          { doctor: { specialization: { contains: search, mode: 'insensitive' } } },
          { department: { name: { contains: search, mode: 'insensitive' } } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } },
          { videoConsultation: { roomName: { contains: search, mode: 'insensitive' } } }
        ]
      });
    }

    if (status) {
      if (status === 'IN_PROGRESS') {
        where.AND.push({
          OR: [
            { status: 'IN_CONSULTATION' },
            { videoConsultation: { status: 'IN_PROGRESS' } }
          ]
        });
      } else if (status === 'PENDING') {
        where.AND.push({
          status: { in: ['WAITING', 'PENDING'] }
        });
      } else if (status === 'SCHEDULED' || status === 'CONFIRMED') {
        where.AND.push({
          status: { in: ['CONFIRMED', 'SCHEDULED'] }
        });
      } else if (status === 'CANCELLED') {
        where.AND.push({
          status: { in: ['CANCELLED', 'NO_SHOW'] }
        });
      } else {
        where.AND.push({ status });
      }
    }

    const totalCount = await prisma.oPBooking.count({ where });

    const records = await prisma.oPBooking.findMany({
      where,
      orderBy: { appointmentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        hospital: { select: { id: true, name: true, city: true } },
        patient: { select: { id: true, name: true, phone: true } },
        department: { select: { id: true, name: true } },
        videoConsultation: true,
      }
    });

    const config = VideoService.validateConfig();

    const formatted = records.map((b) => {
      const v = b.videoConsultation;
      let sessionStatus = 'SCHEDULED';
      if (v?.status) {
        sessionStatus = v.status;
      } else if (b.status === 'COMPLETED') {
        sessionStatus = 'COMPLETED';
      } else if (b.status === 'IN_CONSULTATION') {
        sessionStatus = 'IN_PROGRESS';
      } else if (b.status === 'CANCELLED') {
        sessionStatus = 'CANCELLED';
      } else if (b.status === 'WAITING' || b.status === 'PENDING') {
        sessionStatus = 'WAITING';
      }

      return {
        id: b.id,
        consultationId: `VC-${b.id.substring(0, 8).toUpperCase()}`,
        bookingId: b.id,
        patientName: b.patientName || b.patient?.name || 'Unknown',
        patientPhone: b.patientPhone || b.patient?.phone || 'N/A',
        patientAge: b.patientAge,
        patientGender: b.patientGender,
        doctorName: b.doctor?.name || 'Unknown',
        doctorSpecialization: b.doctor?.specialization || 'General Physician',
        hospitalName: b.hospital?.name || 'Unknown',
        hospitalCity: b.hospital?.city || 'Unknown',
        departmentName: b.department?.name || 'General Medicine',
        date: new Date(b.appointmentDate).toLocaleDateString(),
        timeSlot: b.timeSlot || b.slotTime || 'N/A',
        scheduledDateTime: `${new Date(b.appointmentDate).toLocaleDateString()} ${b.timeSlot || b.slotTime || ''}`.trim(),
        fee: b.fee,
        consultationStatus: b.status,
        sessionStatus,
        roomName: v?.roomName || null,
        durationSeconds: v?.durationSeconds || 0,
        formattedDuration: v ? VideoService.formatDuration(v.durationSeconds) : '00:00',
        startedAt: v?.startedAt ? v.startedAt.toISOString() : null,
        endedAt: v?.endedAt ? v.endedAt.toISOString() : null,
        patientJoinedAt: v?.patientJoinedAt ? v.patientJoinedAt.toISOString() : null,
        doctorJoinedAt: v?.doctorJoinedAt ? v.doctorJoinedAt.toISOString() : null,
        createdAt: b.createdAt.toISOString()
      };
    });

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      stats,
      providerConfig: {
        isConfigured: config.isConfigured,
        message: config.isConfigured 
          ? 'LiveKit Video Consultation Cloud is active.' 
          : (config.error || 'Video streaming infrastructure credentials are not configured in backend environment.')
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Video Consultation Details by ID
 */
export const getVideoConsultationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const booking = await prisma.oPBooking.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, specialization: true, phone: true, email: true, avatar: true } },
        hospital: { select: { id: true, name: true, city: true, addressLine1: true, contactPhone: true } },
        patient: { select: { id: true, name: true, phone: true, email: true, address: true, dob: true, gender: true } },
        department: { select: { id: true, name: true } },
        videoConsultation: true,
        vitals: true,
        prescription: true,
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Video consultation record not found' });
    }

    const config = VideoService.validateConfig();

    res.json({
      success: true,
      data: {
        id: booking.id,
        consultationId: `VC-${booking.id.substring(0, 8).toUpperCase()}`,
        bookingId: booking.id,
        patientName: booking.patientName || booking.patient?.name || 'Unknown',
        patientPhone: booking.patientPhone || booking.patient?.phone || 'N/A',
        patientEmail: booking.patient?.email || 'N/A',
        patientGender: booking.patientGender || booking.patient?.gender || 'N/A',
        patientAge: booking.patientAge,
        patientAddress: booking.patient?.address || 'N/A',
        doctorName: booking.doctor?.name || 'Unknown',
        doctorSpecialization: booking.doctor?.specialization || 'General Physician',
        doctorEmail: booking.doctor?.email || 'N/A',
        hospitalName: booking.hospital?.name || 'Unknown',
        hospitalCity: booking.hospital?.city || 'Unknown',
        hospitalAddress: booking.hospital?.addressLine1 || 'N/A',
        departmentName: booking.department?.name || 'General Medicine',
        appointmentDate: booking.appointmentDate.toISOString(),
        timeSlot: booking.timeSlot || booking.slotTime || 'N/A',
        fee: booking.fee,
        reason: booking.reason || 'General virtual consult',
        consultationStatus: booking.status,
        sessionStatus: booking.videoConsultation?.status || (booking.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED'),
        roomName: booking.videoConsultation?.roomName || null,
        durationSeconds: booking.videoConsultation?.durationSeconds || 0,
        formattedDuration: booking.videoConsultation ? VideoService.formatDuration(booking.videoConsultation.durationSeconds) : '00:00',
        startedAt: booking.videoConsultation?.startedAt || null,
        endedAt: booking.videoConsultation?.endedAt || null,
        patientJoinedAt: booking.videoConsultation?.patientJoinedAt || null,
        doctorJoinedAt: booking.videoConsultation?.doctorJoinedAt || null,
        vitals: booking.vitals || null,
        prescription: booking.prescription || null,
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        providerConfig: {
          isConfigured: config.isConfigured,
          message: config.isConfigured 
            ? 'LiveKit Video Consultation Cloud is active.' 
            : (config.error || 'LiveKit video streaming credentials not configured.')
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Video Consultation Status (following lifecycle)
 */
export const updateVideoConsultationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const allowedStatuses = ['WAITING', 'CONFIRMED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const updatedBooking = await prisma.oPBooking.update({
      where: { id },
      data: { status }
    });

    // If attached videoConsultation exists, sync its status
    const existingVc = await prisma.videoConsultation.findUnique({ where: { bookingId: id } });
    if (existingVc) {
      let vcStatus = 'SCHEDULED';
      if (status === 'IN_CONSULTATION') vcStatus = 'IN_PROGRESS';
      else if (status === 'COMPLETED') vcStatus = 'COMPLETED';
      else if (status === 'CANCELLED') vcStatus = 'CANCELLED';
      else if (status === 'WAITING') vcStatus = 'WAITING';

      await prisma.videoConsultation.update({
        where: { bookingId: id },
        data: { status: vcStatus }
      });
    }

    res.json({
      success: true,
      message: 'Video consultation status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};


