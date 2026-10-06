const fs = require('fs');
let content = fs.readFileSync('backend/src/modules/admin/admin.controller.ts', 'utf8');

const replacement = `      const where: any = { AND: [] };

      if (search) {
        where.AND.push({
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { patientName: { contains: search, mode: 'insensitive' } },
            { patientId: { contains: search, mode: 'insensitive' } },
            { doctor: { name: { contains: search, mode: 'insensitive' } } },
            { doctorId: { contains: search, mode: 'insensitive' } },
            { hospital: { name: { contains: search, mode: 'insensitive' } } },
          ]
        });
      }

      if (ageMin !== undefined || ageMax !== undefined) {
        const today = new Date();
        const dobCond: any = {};
        if (ageMin !== undefined) {
          dobCond.lte = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate()).toISOString();
        }
        if (ageMax !== undefined) {
          dobCond.gt = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate() + 1).toISOString();
        }
        
        const staticAgeCond: any = {};
        if (ageMin !== undefined) staticAgeCond.gte = ageMin;
        if (ageMax !== undefined) staticAgeCond.lte = ageMax;

        where.AND.push({
          OR: [
            { patientAge: staticAgeCond },
            { patient: { dob: dobCond } }
          ]
        });
      }

      if (gender && gender !== 'ALL') {
        where.AND.push({
          OR: [
            { patientGender: { equals: gender, mode: 'insensitive' } },
            { patient: { gender: { equals: gender, mode: 'insensitive' } } }
          ]
        });
      }

      if (place && place !== 'ALL') {
        where.AND.push({
          patient: { address: { contains: place, mode: 'insensitive' } }
        });
      }

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (where.AND.length === 0) {
        delete where.AND;
      }`;

const regex = /const where: any = \{\};[\s\S]*?if \(status && status !== 'ALL'\) \{\s*where\.status = status;\s*\}/m;
content = content.replace(regex, replacement);

fs.writeFileSync('backend/src/modules/admin/admin.controller.ts', content, 'utf8');
console.log('patched getAppointments logic for age and gender');
