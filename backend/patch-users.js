const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/modules/admin/admin.controller.ts');
const content = fs.readFileSync(targetFile, 'utf8');

const updatedGetUsers = `export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, gender, ageMin, ageMax, city, hospitalId } = req.query;

    const whereClause: any = {};
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
      whereClause.patientBookings = {
        some: { hospitalId: hospitalId as string }
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};`;

const regex = /export const getUsers = async.*?catch \(error\) \{\s*next\(error\);\s*\}\s*\};\s*/s;
const newContent = content.replace(regex, updatedGetUsers + '\n');
fs.writeFileSync(targetFile, newContent);
console.log('patched users successfully');
