const fs = require('fs');
const content = fs.readFileSync('backend/src/modules/admin/admin.controller.ts', 'utf8');

const regex = /export const getUsers = async \\(req: Request, res: Response, next: NextFunction\\) => \\{[\\s\\S]*?res\\.json\\(\\{ success: true, data: \\{ users: formatted, pagination.*\\} \\}\\);[\\s\\S]*?\\} catch \\(error\\) \\{[\\s\\S]*?\\}[\\s\\S]*?\\};/m;

const replacement = \export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
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
            { id: { contains: search as string, mode: 'insensitive' } }
          ]
        });
      }

      if (whereClause.AND.length === 0) {
        delete whereClause.AND;
      }
  
      const totalCount = await prisma.user.count({ where: whereClause });
  
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
        
        let extractCity = 'N/A';
        if (u.address) {
          const parts = u.address.split(',');
          if (parts.length > 1) extractCity = parts[parts.length - 2].trim() || parts[0].trim();
          else extractCity = u.address.trim();
        }
  
        return {
          id: u.id,
          name: u.name,
          email: u.email || 'N/A',
          phone: u.phone || 'N/A',
          role: u.role,
          active: u.active,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          dob: u.dob,
          age: age,
          gender: u.gender || 'Unknown',
          address: u.address || 'N/A',
          city: extractCity,
          qualification: u.qualification || 'N/A',
          specialization: u.specialization || (u.department?.name) || 'General',
          experienceYears: u.experienceYears,
          hospital: u.role === 'DOCTOR' ? (u.hospital?.name || 'N/A') : primaryHospital,
          totalVisits: u._count?.patientBookings || 0
        };
      });
  
      res.json({ success: true, data: { users: formatted, pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) } } });
    } catch (error) {
      next(error);
    }
  };\;

let newContent = content.replace(regex, replacement);
fs.writeFileSync('backend/src/modules/admin/admin.controller.ts', newContent, 'utf8');
console.log('patched getUsers logic');

