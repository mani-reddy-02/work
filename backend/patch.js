const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/modules/admin/admin.controller.ts');
const content = fs.readFileSync(targetFile, 'utf8');

const updatedGetStats = `export const getStats = async (req: Request, res: Response, next: NextFunction) => {
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

    const [
      totalHospitals,
      totalUsers,
      totalPatients,
      totalDoctors,
      totalDepartments,
      activeDoctors,
      verifiedHospitals,
      pendingVerifications,
      hospitalsForShares
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.PATIENT } }),
      prisma.user.count({ where: { role: Role.DOCTOR } }),
      prisma.department.count(),
      prisma.user.count({ where: { role: Role.DOCTOR, active: true } }),
      prisma.hospital.count({ where: { verifications: { some: {} } } }),
      prisma.hospitalVerification.count(),
      prisma.hospital.findMany({ select: { id: true, name: true, hospitalShare: true } })
    ]);

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
};`;

const regex = /export const getStats = async.*?catch \(error\) \{\s*next\(error\);\s*\}\s*\};\s*/s;
const newContent = content.replace(regex, updatedGetStats + '\n');
fs.writeFileSync(targetFile, newContent);
console.log('patched successfully');
