const fs = require('fs');
let content = fs.readFileSync('src/modules/admin/admin-departments.controller.ts', 'utf8');

// Add processIcon and path/fs imports if not present
if (!content.includes('processIcon')) {
  content = content.replace(
    "import { Role } from '@prisma/client';", 
    "import { Role } from '@prisma/client';\nimport path from 'path';\nimport fs from 'fs';\n\nconst UPLOADS_DIR = path.join(__dirname, '../../../../uploads/icons');\nif (!fs.existsSync(UPLOADS_DIR)) {\n  fs.mkdirSync(UPLOADS_DIR, { recursive: true });\n}\n\nfunction processIcon(iconData: string | undefined): string | undefined {\n  if (!iconData) return undefined;\n  if (iconData.startsWith('/icons/')) return iconData;\n  if (iconData.startsWith('data:image')) {\n    const matches = iconData.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);\n    if (!matches || matches.length !== 3) return undefined;\n    const fileBuffer = Buffer.from(matches[2], 'base64');\n    const safeFileName = `${Date.now()}-icon.png`;\n    const filePath = path.join(UPLOADS_DIR, safeFileName);\n    fs.writeFileSync(filePath, fileBuffer);\n    return `/uploads/icons/${safeFileName}`;\n  }\n  return iconData;\n}\n"
  );
}

// Update getAdminDepartments mapping to include icon and isActive
content = content.replace(/hospitalCount: s\._count\.departments,/g, 'hospitalCount: s._count.departments,\n        icon: s.icon,\n        isActive: s.isActive,');

// Update getAdminDepartmentById response to include icon and isActive
content = content.replace(/diseaseCount: specialty\.conditions\.length,/g, 'icon: specialty.icon,\n        isActive: specialty.isActive,\n        diseaseCount: specialty.conditions.length,');

// Update createAdminDisease to processIcon and pass isActive
content = content.replace(/const \{ name, description, icon \} = req\.body;/g, 'const { name, description, icon, isActive } = req.body;');
content = content.replace(/const condition = await prisma\.platformCondition\.create\(\{\n\s+data: \{/g, 'const iconUrl = processIcon(icon);\n    const condition = await prisma.platformCondition.create({\n      data: {\n        isActive: isActive !== undefined ? isActive : true,\n        icon: iconUrl,');
content = content.replace(/icon: icon \? icon\.trim\(\) : null,/g, ''); // remove old icon mapping from createAdminDisease

// Update updateAdminDisease to processIcon and pass isActive
content = content.replace(/const \{ name, description, isActive, icon \} = req\.body; \/\/ isActive might not exist on schema yet/g, 'const { name, description, isActive, icon } = req.body;');
content = content.replace(/\.\.\.\(icon !== undefined \? \{ icon: icon \? icon\.trim\(\) : null \} : \{\}\)/g, '...(icon !== undefined ? { icon: processIcon(icon) } : {}),\n        ...(isActive !== undefined ? { isActive } : {})');

// Update createAdminDepartment to handle icon and isActive
content = content.replace(/const \{ name, description \} = req\.body;/g, 'const { name, description, icon, isActive } = req.body;');
content = content.replace(/const specialty = await prisma\.platformSpecialty\.create\(\{\n\s+data: \{/g, 'const iconUrl = processIcon(icon);\n    const specialty = await prisma.platformSpecialty.create({\n      data: {\n        icon: iconUrl,\n        isActive: isActive !== undefined ? isActive : true,');

// Update updateAdminDepartment to handle icon and isActive
content = content.replace(/const \{ name, description \} = req\.body;/g, 'const { name, description, icon, isActive } = req.body;');
content = content.replace(/\.\.\.\(description !== undefined \? \{ description: description \? description\.trim\(\) : null \} : \{\}\)/g, '...(description !== undefined ? { description: description ? description.trim() : null } : {}),\n        ...(icon !== undefined ? { icon: processIcon(icon) } : {}),\n        ...(isActive !== undefined ? { isActive } : {})');

fs.writeFileSync('src/modules/admin/admin-departments.controller.ts', content);
