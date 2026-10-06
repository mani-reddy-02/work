const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../backend/src/modules/admin/admin.controller.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const \{ role, gender, ageMin, ageMax, city, hospitalId, search \} = req\.query;/,
  `const { role, gender, ageMin, ageMax, city, hospitalId, search, specialization, experienceMin, experienceMax } = req.query;`
);

const filterInjection = `
    if (hospitalId && hospitalId !== 'all') {
      if (role === 'DOCTOR') {
        whereClause.doctorBookings = { some: { hospitalId: hospitalId as string } };
      } else {
        whereClause.patientBookings = { some: { hospitalId: hospitalId as string } };
      }
    }

    if (specialization && specialization !== 'all') {
      whereClause.OR = [
        { department: { name: { equals: specialization as string, mode: 'insensitive' } } },
        { doctorBookings: { some: { department: { name: { equals: specialization as string, mode: 'insensitive' } } } } }
      ];
    }
    
    if (experienceMin || experienceMax) {
      whereClause.experienceYears = {};
      if (experienceMin) whereClause.experienceYears.gte = Number(experienceMin);
      if (experienceMax) whereClause.experienceYears.lte = Number(experienceMax);
    }
`;

content = content.replace(
  /if \(hospitalId && hospitalId !== 'all'\) \{[\s\S]*?\}\s*\}/,
  filterInjection
);

fs.writeFileSync(file, content);
console.log('Controller updated successfully.');
