const fs = require('fs');
const path = require('path');

const routesFile = path.join(__dirname, 'src/modules/admin/admin.routes.ts');
const controllerFile = path.join(__dirname, 'src/modules/admin/admin.controller.ts');

let routesContent = fs.readFileSync(routesFile, 'utf8');

if (!routesContent.includes('createHospital')) {
  routesContent = routesContent.replace(
    /import {([^}]+)getHospitals([^}]+)} from '\.\/admin\.controller';/,
    "import {$1getHospitals, createHospital, updateHospital$2} from './admin.controller';"
  );
  routesContent = routesContent.replace(
    /router\.get\('\/hospitals',\s*getHospitals\);/,
    "router.get('/hospitals', getHospitals);\nrouter.post('/hospitals', createHospital);\nrouter.patch('/hospitals/:id', updateHospital);"
  );
  fs.writeFileSync(routesFile, routesContent);
}

let controllerContent = fs.readFileSync(controllerFile, 'utf8');

// Replace getHospitals
const getHospitalsRegex = /export const getHospitals = async \(req: Request, res: Response, next: NextFunction\) => \{[\s\S]*?res\.json\(\{ success: true, data: formatted \}\);\n  \} catch \(error\) \{\n    next\(error\);\n  \}\n\};/g;

const getHospitalsReplacement = `export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
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
      // Allow location to match city or state
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
        _count: {
          select: {
            departments: true,
            users: true,
          },
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
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }));

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
        hospitalShare: 80, // default
        authUserId: req.user?.id || 'admin'
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
      where: { id },
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
`;

controllerContent = controllerContent.replace(getHospitalsRegex, getHospitalsReplacement);
fs.writeFileSync(controllerFile, controllerContent);
console.log('Successfully patched hospitals endpoints.');
