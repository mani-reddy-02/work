import fs from 'fs';

const controllerPath = 'backend/src/modules/hospital-requests/hospital-requests.controller.ts';
let controller = fs.readFileSync(controllerPath, 'utf8');

const activeEndpoint = `

export const getActiveCampRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const camps = await prisma.medicalCampRequest.findMany({
      where: {
        status: { in: ['PENDING', 'REVIEWING', 'APPROVED'] }
      },
      include: {
        hospital: {
          select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, state: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: camps });
  } catch (error) {
    next(error);
  }
};

export const getCampRequestsHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [camps, total] = await Promise.all([
      prisma.medicalCampRequest.findMany({
        where: {
          status: { in: ['COMPLETED', 'REJECTED'] }
        },
        include: {
          hospital: {
            select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, state: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medicalCampRequest.count({
        where: {
          status: { in: ['COMPLETED', 'REJECTED'] }
        }
      })
    ]);

    res.json({
      success: true,
      data: camps,
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
`;

if (!controller.includes('getActiveCampRequests')) {
  controller += activeEndpoint;
  fs.writeFileSync(controllerPath, controller, 'utf8');
}

const adminRoutesPath = 'backend/src/modules/admin/admin.routes.ts';
let adminRoutes = fs.readFileSync(adminRoutesPath, 'utf8');

if (!adminRoutes.includes('getActiveCampRequests')) {
  adminRoutes = adminRoutes.replace(
    /import \{\s*getAllHospitalRequests,\s*updateRequestStatus\s*\} from '\.\.\/hospital-requests\/hospital-requests\.controller';/g,
    `import { 
  getAllHospitalRequests, 
  updateRequestStatus,
  getActiveCampRequests,
  getCampRequestsHistory
} from '../hospital-requests/hospital-requests.controller';`
  );
  
  adminRoutes = adminRoutes.replace(
    'router.get(\'/hospital-requests\', getAllHospitalRequests);',
    `router.get('/hospital-requests', getAllHospitalRequests);
router.get('/camp-requests/active', getActiveCampRequests);
router.get('/camp-requests/history', getCampRequestsHistory);`
  );
  fs.writeFileSync(adminRoutesPath, adminRoutes, 'utf8');
}
console.log('Backend API added');
