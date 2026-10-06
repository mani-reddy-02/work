const fs = require('fs');
const content = fs.readFileSync('backend/src/modules/admin/admin.controller.ts', 'utf8');

const labBookingsReplacement = `export const getLabBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const where: any = {};
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { patient: { name: { contains: search, mode: 'insensitive' } } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const totalCount = await prisma.labBooking.count({ where });

      const bookings = await prisma.labBooking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { select: { name: true } },
          hospital: { select: { name: true } },
          items: {
            include: {
              labTest: {
                include: { platformTest: { select: { name: true } } }
              }
            }
          }
        }
      });

      const formatted = bookings.map((b) => ({
        id: b.id.substring(0, 8).toUpperCase(),
        rawId: b.id,
        patientName: b.patient?.name || 'Unknown',
        hospitalName: b.hospital?.name || 'Unknown',
        bookingType: b.bookingType,
        status: b.status,
        testCount: b.items.length,
        testNames: b.items.map(i => i.labTest.platformTest.name).join(', '),
        totalAmount: b.totalAmount,
        date: new Date(b.createdAt).toLocaleDateString(),
      }));

      res.json({
        success: true,
        data: formatted,
        pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) }
      });
    } catch (error) {
      next(error);
    }
  };`;

const homeNursingReplacement = `export const getHomeNursingBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

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
  };`;

let newContent = content.replace(/export const getLabBookings = async \(req: Request, res: Response, next: NextFunction\) => \{[\s\S]*?\} catch \(error\) \{ next\(error\); \} \};/, labBookingsReplacement);
newContent = newContent.replace(/export const getHomeNursingBookings = async \(req: Request, res: Response, next: NextFunction\) => \{[\s\S]*?\} catch \(error\) \{ next\(error\); \} \};/, homeNursingReplacement);

fs.writeFileSync('backend/src/modules/admin/admin.controller.ts', newContent, 'utf8');
console.log('patched backend controllers for lab & home nursing');
