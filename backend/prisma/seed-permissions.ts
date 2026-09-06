import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  { key: 'dashboard.view', name: 'View Dashboard', description: 'Access the main dashboard', module: 'Dashboard' },
  
  { key: 'departments.view', name: 'View Departments', description: 'View list of departments', module: 'Departments' },
  { key: 'departments.create', name: 'Create Departments', description: 'Create new departments', module: 'Departments' },
  { key: 'departments.update', name: 'Update Departments', description: 'Edit existing departments', module: 'Departments' },
  { key: 'departments.delete', name: 'Delete Departments', description: 'Delete departments', module: 'Departments' },
  
  { key: 'staff.view', name: 'View Staff', description: 'View list of staff members', module: 'Staff' },
  { key: 'staff.create', name: 'Create Staff', description: 'Add new staff members', module: 'Staff' },
  { key: 'staff.update', name: 'Update Staff', description: 'Edit staff member details', module: 'Staff' },
  { key: 'staff.delete', name: 'Delete Staff', description: 'Deactivate staff members', module: 'Staff' },
  
  { key: 'labs.view', name: 'View Laboratory', description: 'View laboratory details', module: 'Laboratory' },
  { key: 'labs.create', name: 'Create Laboratory', description: 'Create laboratory records', module: 'Laboratory' },
  { key: 'labs.update', name: 'Update Laboratory', description: 'Edit laboratory details', module: 'Laboratory' },
  { key: 'labs.delete', name: 'Delete Laboratory', description: 'Delete laboratory details', module: 'Laboratory' },

  { key: 'permissions.view', name: 'View Permissions', description: 'View role permissions', module: 'Permissions' },
  { key: 'permissions.manage', name: 'Manage Permissions', description: 'Update role permissions', module: 'Permissions' },
];

async function main() {
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: perm,
      create: perm,
    });
  }
  console.log('Permissions seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
