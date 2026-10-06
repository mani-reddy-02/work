const fs = require('fs');
let content = fs.readFileSync('backend/src/modules/admin/admin.controller.ts', 'utf8');

const regex = /export const getLabBookings = async \(req: Request, res: Response, next: NextFunction\) => \{[\s\S]*?res\.json\(\{\s*success: true,\s*data: formatted,[\s\S]*?\}\);\s*\} catch \(error\) \{\s*next\(error\);\s*\}\s*\};/m;

const replacement = `export const getLabBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const ageMin = req.query.ageMin ? parseInt(req.query.ageMin as string) : undefined;
      const ageMax = req.query.ageMax ? parseInt(req.query.ageMax as string) : undefined;
      const gender = req.query.gender as string;
      const place = req.query.place as string;
      const status = req.query.status as string;
      const bookingType = req.query.bookingType as string;

      const where: any = { AND: [] };

      if (search) {
        where.AND.push({
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { patient: { name: { contains: search, mode: 'insensitive' } } },
            { hospital: { name: { contains: search, mode: 'insensitive' } } },
            { items: { some: { labTest: { platformTest: { name: { contains: search, mode: 'insensitive' } } } } } }
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
        
        where.AND.push({ patient: { dob: dobCond } });
      }

      if (gender && gender !== 'ALL') {
        where.AND.push({ patient: { gender: { equals: gender, mode: 'insensitive' } } });
      }

      if (place && place !== 'ALL') {
        where.AND.push({
          patient: { address: { contains: place, mode: 'insensitive' } }
        });
      }

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (bookingType && bookingType !== 'ALL') {
        where.bookingType = bookingType;
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
        time: new Date(b.createdAt).toLocaleTimeString(),
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

content = content.replace(regex, replacement);
fs.writeFileSync('backend/src/modules/admin/admin.controller.ts', content, 'utf8');
console.log('patched getLabBookings');
