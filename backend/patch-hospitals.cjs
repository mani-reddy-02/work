const fs = require('fs');
const path = require('path');

const controllerFile = path.join(__dirname, 'src/modules/admin/admin.controller.ts');
let content = fs.readFileSync(controllerFile, 'utf8');

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
        hospitalShare: 80,
        authUserId: 'admin'
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

// we will split by "export const getHospitals = " and "export const getUsers = "
const parts1 = content.split('export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {');
const parts2 = parts1[1].split('export const getUsers = async (req: Request, res: Response, next: NextFunction) => {');

content = parts1[0] + getHospitalsReplacement + '\nexport const getUsers = async (req: Request, res: Response, next: NextFunction) => {' + parts2[1];

fs.writeFileSync(controllerFile, content);
console.log('done');
