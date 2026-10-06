const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/admin/admin-departments.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

const getAdminDepartmentsReplacement = `export const getAdminDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { search, hospitalId, diseaseId, doctorId, status } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.name = { contains: search as string, mode: 'insensitive' };
    }
    if (hospitalId && hospitalId !== 'all') {
      whereClause.departments = { some: { hospitalId: hospitalId as string } };
    }
    if (diseaseId && diseaseId !== 'all') {
      whereClause.conditions = { some: { id: diseaseId as string } };
    }
    if (doctorId && doctorId !== 'all') {
      whereClause.departments = { some: { users: { some: { id: doctorId as string } } } };
    }
    // Note: status is not in PlatformSpecialty, so we ignore or map if it existed

    const total = await prisma.platformSpecialty.count({ where: whereClause });

    const specialties = await prisma.platformSpecialty.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            conditions: true,
            departments: true,
          }
        },
        departments: {
          include: {
            _count: {
              select: {
                users: {
                  where: { role: Role.DOCTOR, active: true }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = specialties.map(s => {
      const doctorCount = s.departments.reduce((acc, d) => acc + d._count.users, 0);
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        diseaseCount: s._count.conditions,
        hospitalCount: s._count.departments,
        doctorCount,
        status: 'ACTIVE',
        createdAt: s.createdAt.toISOString(),
      };
    });

    res.json({ 
      success: true, 
      data: formatted,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};
`;

const parts = content.split('export const getAdminDepartmentById =');
const parts0 = parts[0].split('export const getAdminDepartments = ');

content = parts0[0] + getAdminDepartmentsReplacement + '\nexport const getAdminDepartmentById =' + parts[1];

fs.writeFileSync(filePath, content);
console.log('patched');
