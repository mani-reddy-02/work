const fs = require('fs');
const content = fs.readFileSync('backend/src/modules/admin/admin.controller.ts', 'utf8');
const replacement = `export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const ageMin = req.query.ageMin ? parseInt(req.query.ageMin as string) : undefined;
      const ageMax = req.query.ageMax ? parseInt(req.query.ageMax as string) : undefined;
      const gender = req.query.gender as string;
      const place = req.query.place as string;
      const status = req.query.status as string;

      const where: any = {};

      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          { patientId: { contains: search, mode: 'insensitive' } },
          { doctor: { name: { contains: search, mode: 'insensitive' } } },
          { doctorId: { contains: search, mode: 'insensitive' } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (ageMin !== undefined || ageMax !== undefined) {
        where.patientAge = {};
        if (ageMin !== undefined) where.patientAge.gte = ageMin;
        if (ageMax !== undefined) where.patientAge.lte = ageMax;
      }

      if (gender && gender !== 'ALL') {
        where.patientGender = { equals: gender, mode: 'insensitive' };
      }

      if (place && place !== 'ALL') {
        where.patient = { address: { contains: place, mode: 'insensitive' } };
      }

      if (status && status !== 'ALL') {
        where.status = status;
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
  };`;

const newContent = content.replace(/export const getAppointments = async \(req: Request, res: Response, next: NextFunction\) => \{[\s\S]*?res\.json\(\{ success: true, data: formatted \}\);\s*\} catch \(error\) \{\s*next\(error\);\s*\}\s*\};/g, replacement);

fs.writeFileSync('backend/src/modules/admin/admin.controller.ts', newContent, 'utf8');
console.log('patched getAppointments');
