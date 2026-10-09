import fs from 'fs';

const controllerPath = 'backend/src/modules/hospital-requests/hospital-requests.controller.ts';
let controller = fs.readFileSync(controllerPath, 'utf8');

// 1. Add getActiveCampRequests and getCampRequestsHistory
const newEndpoints = `
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

    const [histories, total] = await Promise.all([
      prisma.medicalCampRequestHistory.findMany({
        where: {
          status: { in: ['COMPLETED', 'REJECTED'] }
        },
        include: {
          request: {
            include: {
              hospital: {
                select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, state: true },
              }
            }
          }
        },
        orderBy: { actionAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medicalCampRequestHistory.count({
        where: {
          status: { in: ['COMPLETED', 'REJECTED'] }
        }
      })
    ]);

    const camps = histories.map(h => ({
      ...h.request,
      status: h.status,
      updatedAt: h.actionAt,
      notes: h.cancellationReason || h.notes || h.request.notes
    }));

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
  controller += newEndpoints;
}

// 2. Replace updateRequestStatus
const updateRegex = /export const updateRequestStatus = async[\s\S]*?res\.json\(\{ success: true, data: updated \}\);\s*\} catch \(error\) \{\s*next\(error\);\s*\}\s*\};/;
const newUpdateFn = `export const updateRequestStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const type = String(req.params.type);
    const { status, notes } = req.body;

    let updated: any;
    if (type === 'camp') {
      const existing = await prisma.medicalCampRequest.findUnique({ where: { id } });
      
      updated = await prisma.medicalCampRequest.update({
        where: { id },
        data: { status: status as any, ...(notes ? { notes: notes as string } : {}) },
        include: { hospital: { select: { id: true, name: true } } },
      });

      if (existing) {
        await prisma.medicalCampRequestHistory.create({
          data: {
            requestId: id,
            requestType: 'CAMP',
            status: status as any,
            previousStatus: existing.status,
            actionBy: req.user?.id || 'Admin',
            cancellationReason: status === 'REJECTED' || status === 'CANCELLED' ? notes : null,
            notes: notes
          }
        });
      }
    } else {
      updated = await prisma.marketingRequest.update({
        where: { id },
        data: { status: status as any, ...(notes ? { notes: notes as string } : {}) },
        include: { hospital: { select: { id: true, name: true } } },
      });
    }

    // Notify hospital of status update
    await sendNotification({
      hospitalId: updated.hospitalId,
      title: \`Request \${status}: \${type === 'camp' ? 'Medical Camp' : 'Service Request'}\`,
      message: \`Your \${type === 'camp' ? 'medical camp request' : 'enquiry'} has been updated to "\${status}" by MediQuee Admin.\`,
      type: status === 'APPROVED' ? 'success' : 'activity',
      metadata: { requestId: id, status, type },
    });

    // Notify doctor directly if this request was submitted by a doctor
    if (updated.doctorId) {
      await sendNotification({
        hospitalId: updated.hospitalId,
        userId: updated.doctorId,
        title: \`Marketing Request \${status}\`,
        message: \`Your marketing enquiry for "\${updated.campaignType}" has been updated to "\${status}" by MediQuee Admin.\`,
        type: status === 'APPROVED' ? 'success' : 'activity',
        metadata: { requestId: id, status, type },
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};`;

controller = controller.replace(updateRegex, newUpdateFn);

fs.writeFileSync(controllerPath, controller, 'utf8');
console.log('Fixed backend controller!');
