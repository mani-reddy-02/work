const fs = require('fs');
const path = require('path');

const controllerFile = path.join(__dirname, 'src/modules/admin/admin-departments.controller.ts');
let content = fs.readFileSync(controllerFile, 'utf8');

const filtersMethod = `
export const getDepartmentFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    const diseases = await prisma.platformCondition.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
    
    res.json({
      success: true,
      data: {
        hospitals,
        diseases,
        doctors
      }
    });
  } catch (error) {
    next(error);
  }
};
`;

if (!content.includes('export const getDepartmentFilters')) {
  content = content + filtersMethod;
  fs.writeFileSync(controllerFile, content);
  
  // Now add to admin.routes.ts
  const routesFile = path.join(__dirname, 'src/modules/admin/admin.routes.ts');
  let routesContent = fs.readFileSync(routesFile, 'utf8');
  
  routesContent = routesContent.replace(
    'getAdminDepartments,',
    'getAdminDepartments,\n  getDepartmentFilters,'
  );
  routesContent = routesContent.replace(
    "router.get('/departments', getAdminDepartments);",
    "router.get('/departments', getAdminDepartments);\nrouter.get('/departments/filters', getDepartmentFilters);"
  );
  fs.writeFileSync(routesFile, routesContent);
  console.log('patched filters');
} else {
  console.log('already patched');
}
