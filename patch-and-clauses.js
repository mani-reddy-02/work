const fs = require('fs');
let content = fs.readFileSync('backend/src/modules/admin/admin.controller.ts', 'utf8');

// Patch getHospitals
content = content.replace(/const whereClause: any = \{\};\s*if \(search\) \{\s*whereClause\.OR = \[[\s\S]*?\];\s*\}\s*if \(location && location !== 'all'\) \{\s*whereClause\.OR = \[\s*\.\.\.\(whereClause\.OR \|\| \[\]\),\s*\{ city: \{ equals: location as string, mode: 'insensitive' \} \},\s*\{ state: \{ equals: location as string, mode: 'insensitive' \} \}\s*\];\s*\}/, 
`const whereClause: any = { AND: [] };
    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { id: { contains: search as string, mode: 'insensitive' } },
          { city: { contains: search as string, mode: 'insensitive' } },
          { state: { contains: search as string, mode: 'insensitive' } },
        ]
      });
    }
    if (location && location !== 'all') {
      whereClause.AND.push({
        OR: [
          { city: { equals: location as string, mode: 'insensitive' } },
          { state: { equals: location as string, mode: 'insensitive' } }
        ]
      });
    }
    if (whereClause.AND.length === 0) delete whereClause.AND;`);

// Patch getUsers
content = content.replace(/const whereClause: any = \{\};/, 'const whereClause: any = { AND: [] };');

content = content.replace(/if \(specialization && specialization !== 'all'\) \{\s*whereClause\.OR = \[\s*\{ department: \{ name: \{ equals: specialization as string, mode: 'insensitive' \} \} \},\s*\{ doctorBookings: \{ some: \{ department: \{ name: \{ equals: specialization as string, mode: 'insensitive' \} \} \} \} \}\s*\];\s*\}/, 
`if (specialization && specialization !== 'all') {
      whereClause.AND.push({
        OR: [
          { department: { name: { equals: specialization as string, mode: 'insensitive' } } },
          { doctorBookings: { some: { department: { name: { equals: specialization as string, mode: 'insensitive' } } } } }
        ]
      });
    }`);

content = content.replace(/if \(search\) \{\s*whereClause\.OR = \[\s*\{ name: \{ contains: search as string, mode: 'insensitive' \} \},\s*\{ email: \{ contains: search as string, mode: 'insensitive' \} \},\s*\{ phone: \{ contains: search as string, mode: 'insensitive' \} \},\s*\{ id: \{ contains: search as string, mode: 'insensitive' \} \},\s*\];\s*\}/, 
`if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
          { id: { contains: search as string, mode: 'insensitive' } },
        ]
      });
    }
    if (whereClause.AND && whereClause.AND.length === 0) delete whereClause.AND;`);

fs.writeFileSync('backend/src/modules/admin/admin.controller.ts', content, 'utf8');
console.log('patched admin.controller.ts AND clauses');
