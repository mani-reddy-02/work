import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { SpecimenType } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads/icons');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function processIcon(iconData: string | undefined): string | undefined {
  if (!iconData) return undefined;
  if (
    iconData.startsWith('/icons/') || 
    iconData.startsWith('/optimized/') || 
    iconData.startsWith('/uploads/') || 
    iconData.startsWith('http')
  ) {
    return iconData;
  }
  if (iconData.startsWith('data:image')) {
    const matches = iconData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return undefined;
    const fileBuffer = Buffer.from(matches[2], 'base64');
    const safeFileName = `${Date.now()}-icon.png`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/icons/${safeFileName}`;
  }
  if (!iconData.startsWith('/')) {
    return `/optimized/${iconData}`;
  }
  return iconData;
}

function generateCode(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }
  return words.map(w => w[0]).join('').substring(0, 5).toUpperCase();
}

/**
 * GET /api/v1/admin/lab-departments
 * List all lab departments with test counts, lab counts, pagination, and search/filter.
 */
export const getAdminLabDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { search, status } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'ALL') {
      whereClause.isActive = status === 'ACTIVE';
    }

    const total = await prisma.platformLabDepartment.count({ where: whereClause });

    const departments = await prisma.platformLabDepartment.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            tests: true,
            labs: true
          }
        },
        tests: {
          select: {
            id: true,
            isActive: true,
            _count: {
              select: {
                hospitalOfferings: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = departments.map(dept => {
      const activeTestCount = dept.tests.filter(t => t.isActive).length;
      const hospitalCount = dept.tests.reduce((acc, t) => acc + t._count.hospitalOfferings, 0);

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        description: dept.description,
        icon: dept.icon,
        isActive: dept.isActive,
        createdAt: dept.createdAt.toISOString(),
        testCount: dept._count.tests,
        activeTestCount,
        labCount: dept._count.labs,
        hospitalCount
      };
    });

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

/**
 * GET /api/v1/admin/lab-departments/:id
 * Retrieve lab department details along with its platform tests and linked labs.
 */
export const getAdminLabDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const department = await prisma.platformLabDepartment.findUnique({
      where: { id },
      include: {
        tests: {
          include: {
            _count: {
              select: {
                hospitalOfferings: true
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        labs: {
          include: {
            hospital: {
              select: { id: true, name: true, city: true }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: { message: 'Lab department not found' } });
    }

    const formattedTests = department.tests.map(t => ({
      id: t.id,
      code: t.code,
      name: t.name,
      departmentId: t.departmentId,
      specimenType: t.specimenType,
      fastingRequired: t.fastingRequired,
      fastingDurationHours: t.fastingDurationHours,
      canBeCollectedAtHome: t.canBeCollectedAtHome,
      defaultTatHours: t.defaultTatHours,
      description: t.description,
      icon: t.icon,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      hospitalOfferingsCount: t._count.hospitalOfferings
    }));

    const formattedLabs = department.labs.map(l => ({
      id: l.id,
      name: l.name,
      type: l.type,
      status: l.status,
      city: l.city,
      address: l.address,
      contactPhone: l.contactPhone,
      hospital: l.hospital
    }));

    res.json({
      success: true,
      data: {
        id: department.id,
        code: department.code,
        name: department.name,
        description: department.description,
        icon: department.icon,
        isActive: department.isActive,
        createdAt: department.createdAt.toISOString(),
        tests: formattedTests,
        labs: formattedLabs,
        testCount: formattedTests.length,
        labCount: formattedLabs.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/lab-departments
 * Create a new Platform Lab Department.
 */
export const createAdminLabDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, description, icon, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: { message: 'Lab department name is required' } });
    }

    const finalCode = (code && code.trim()) ? code.trim().toUpperCase() : generateCode(name);

    // Check duplicate name or code
    const existing = await prisma.platformLabDepartment.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: 'insensitive' } },
          { code: { equals: finalCode, mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ 
        success: false, 
        error: { message: existing.code.toUpperCase() === finalCode ? 'Lab department code already exists' : 'Lab department name already exists' } 
      });
    }

    const iconUrl = processIcon(icon);
    const department = await prisma.platformLabDepartment.create({
      data: {
        name: name.trim(),
        code: finalCode,
        description: description ? description.trim() : null,
        icon: iconUrl,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/lab-departments/:id
 * Update an existing Platform Lab Department.
 */
export const updateAdminLabDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, code, description, icon, isActive } = req.body;

    const department = await prisma.platformLabDepartment.findUnique({ where: { id } });
    if (!department) {
      return res.status(404).json({ success: false, error: { message: 'Lab department not found' } });
    }

    // Check code / name collision if changing
    if (code || name) {
      const collisions = await prisma.platformLabDepartment.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(name ? [{ name: { equals: name.trim(), mode: 'insensitive' as const } }] : []),
            ...(code ? [{ code: { equals: code.trim().toUpperCase(), mode: 'insensitive' as const } }] : [])
          ]
        }
      });
      if (collisions) {
        return res.status(409).json({ 
          success: false, 
          error: { message: 'Another department with this name or code already exists' } 
        });
      }
    }

    const updated = await prisma.platformLabDepartment.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(icon !== undefined ? { icon: processIcon(icon) } : {}),
        ...(isActive !== undefined ? { isActive } : {})
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/lab-departments/:id
 * Delete a Platform Lab Department.
 */
export const deleteAdminLabDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const department = await prisma.platformLabDepartment.findUnique({
      where: { id },
      include: {
        tests: {
          include: {
            _count: {
              select: { hospitalOfferings: true }
            }
          }
        },
        _count: {
          select: { labs: true }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: { message: 'Lab department not found' } });
    }

    // Check if tests have hospital offerings
    const totalHospitalOfferings = department.tests.reduce((acc, t) => acc + t._count.hospitalOfferings, 0);
    if (totalHospitalOfferings > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete department because its tests are currently offered by hospitals. Please deactivate the department or unlink the tests first.' }
      });
    }

    if (department._count.labs > 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Cannot delete department because ${department._count.labs} laboratories are assigned to it. Reassign laboratories first or deactivate.` }
      });
    }

    // Delete tests under this department first if any
    if (department.tests.length > 0) {
      await prisma.platformLabTest.deleteMany({
        where: { departmentId: id }
      });
    }

    await prisma.platformLabDepartment.delete({ where: { id } });

    res.json({ success: true, message: 'Lab department and its unassigned tests deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/lab-departments/:id/tests
 * Create a new Platform Lab Test under a specific lab department.
 */
export const createAdminLabTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.params.id as string;
    const {
      name,
      code,
      specimenType,
      fastingRequired,
      fastingDurationHours,
      canBeCollectedAtHome,
      defaultTatHours,
      description,
      icon,
      isActive
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: { message: 'Test name is required' } });
    }

    const dept = await prisma.platformLabDepartment.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return res.status(404).json({ success: false, error: { message: 'Lab department not found' } });
    }

    const finalCode = (code && code.trim()) ? code.trim().toUpperCase() : generateCode(name);

    // Check duplicate code globally or name within department
    const existing = await prisma.platformLabTest.findFirst({
      where: {
        OR: [
          { code: { equals: finalCode, mode: 'insensitive' } },
          { 
            departmentId,
            name: { equals: name.trim(), mode: 'insensitive' }
          }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { message: existing.code.toUpperCase() === finalCode ? 'A test with this code already exists' : 'A test with this name already exists in this department' }
      });
    }

    const validSpecimen = Object.values(SpecimenType).includes(specimenType) ? specimenType : SpecimenType.SERUM;

    const iconUrl = processIcon(icon);
    const test = await prisma.platformLabTest.create({
      data: {
        name: name.trim(),
        code: finalCode,
        departmentId,
        specimenType: validSpecimen,
        fastingRequired: Boolean(fastingRequired),
        fastingDurationHours: fastingDurationHours ? parseInt(fastingDurationHours) : null,
        canBeCollectedAtHome: canBeCollectedAtHome !== undefined ? Boolean(canBeCollectedAtHome) : true,
        defaultTatHours: defaultTatHours ? parseInt(defaultTatHours) : 24,
        description: description ? description.trim() : null,
        icon: iconUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/lab-tests/:testId
 * Update an existing Platform Lab Test.
 */
export const updateAdminLabTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testId = req.params.testId as string;
    const {
      name,
      code,
      departmentId,
      specimenType,
      fastingRequired,
      fastingDurationHours,
      canBeCollectedAtHome,
      defaultTatHours,
      description,
      icon,
      isActive
    } = req.body;

    const test = await prisma.platformLabTest.findUnique({ where: { id: testId } });
    if (!test) {
      return res.status(404).json({ success: false, error: { message: 'Lab test not found' } });
    }

    if (code && code.trim().toUpperCase() !== test.code) {
      const codeExists = await prisma.platformLabTest.findFirst({
        where: { id: { not: testId }, code: { equals: code.trim().toUpperCase(), mode: 'insensitive' } }
      });
      if (codeExists) {
        return res.status(409).json({ success: false, error: { message: 'Another test already has this code' } });
      }
    }

    let validSpecimen = undefined;
    if (specimenType && Object.values(SpecimenType).includes(specimenType)) {
      validSpecimen = specimenType;
    }

    const updated = await prisma.platformLabTest.update({
      where: { id: testId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(validSpecimen ? { specimenType: validSpecimen } : {}),
        ...(fastingRequired !== undefined ? { fastingRequired: Boolean(fastingRequired) } : {}),
        ...(fastingDurationHours !== undefined ? { fastingDurationHours: fastingDurationHours ? parseInt(fastingDurationHours) : null } : {}),
        ...(canBeCollectedAtHome !== undefined ? { canBeCollectedAtHome: Boolean(canBeCollectedAtHome) } : {}),
        ...(defaultTatHours !== undefined ? { defaultTatHours: parseInt(defaultTatHours) } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(icon !== undefined ? { icon: processIcon(icon) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/lab-tests/:testId
 * Delete a Platform Lab Test if it is not used in active hospital offerings or lab bookings.
 */
export const deleteAdminLabTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testId = req.params.testId as string;

    const test = await prisma.platformLabTest.findUnique({
      where: { id: testId },
      include: {
        _count: {
          select: {
            hospitalOfferings: true
          }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ success: false, error: { message: 'Lab test not found' } });
    }

    if (test._count.hospitalOfferings > 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Cannot delete test because it is offered by ${test._count.hospitalOfferings} hospital laboratories. Deactivate the test instead.` }
      });
    }

    await prisma.platformLabTest.delete({ where: { id: testId } });

    res.json({ success: true, message: 'Lab test deleted successfully' });
  } catch (error) {
    next(error);
  }
};
