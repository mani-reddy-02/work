import re

controller_path = 'backend/src/modules/admin/admin.controller.ts'
with open(controller_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_functions = """
export const getPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { verificationStatus: 'PENDING', businessType: 'HOSPITAL' },
      orderBy: { createdAt: 'desc' }
    });
    
    // Also include Labs that are created as HOSPITAL businessType
    const standaloneLabs = await prisma.hospital.findMany({
      where: { verificationStatus: 'PENDING', businessType: 'LABORATORY' },
      orderBy: { createdAt: 'desc' }
    });

    const hospitalBasedLabs = await prisma.lab.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        hospital: {
          select: { id: true, name: true, city: true, state: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        hospitals,
        standaloneLabs,
        hospitalBasedLabs
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateVerificationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, type } = req.params; // type = 'hospital' | 'lab'
    const { status, cancellationReason } = req.body;

    if (!['APPROVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (status === 'CANCELLED' && !cancellationReason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is mandatory' });
    }

    let updatedRecord;

    if (type === 'hospital') {
      updatedRecord = await prisma.hospital.update({
        where: { id },
        data: {
          verificationStatus: status,
          cancellationReason: status === 'CANCELLED' ? cancellationReason : null,
          cancelledAt: status === 'CANCELLED' ? new Date() : null,
          cancelledBy: status === 'CANCELLED' ? req.user?.id : null
        }
      });
    } else if (type === 'lab') {
      updatedRecord = await prisma.lab.update({
        where: { id },
        data: {
          verificationStatus: status,
          cancellationReason: status === 'CANCELLED' ? cancellationReason : null,
          cancelledAt: status === 'CANCELLED' ? new Date() : null,
          cancelledBy: status === 'CANCELLED' ? req.user?.id : null
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    res.json({
      success: true,
      data: updatedRecord,
      message: `Successfully ${status.toLowerCase()} request`
    });
  } catch (error) {
    next(error);
  }
};
"""

content += new_functions

with open(controller_path, 'w', encoding='utf-8') as f:
    f.write(content)

routes_path = 'backend/src/modules/admin/admin.routes.ts'
with open(routes_path, 'r', encoding='utf-8') as f:
    routes_content = f.read()

# Replace the import
import_pattern = r'getPatientFilters } from \'\./admin\.controller\';'
routes_content = re.sub(import_pattern, "getPatientFilters, getPendingVerifications, updateVerificationStatus } from './admin.controller';", routes_content)

# Add the routes
routes_append = """
// Verifications
router.get('/verifications/pending', getPendingVerifications);
router.patch('/verifications/:type/:id', updateVerificationStatus);
"""

# Insert before export default router
export_pattern = r'export default router;'
routes_content = routes_content.replace(export_pattern, routes_append + "\n" + export_pattern)

with open(routes_path, 'w', encoding='utf-8') as f:
    f.write(routes_content)

print("Updated admin controllers and routes")
