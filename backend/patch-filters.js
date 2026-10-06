const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/modules/admin/admin.controller.ts');
const content = fs.readFileSync(targetFile, 'utf8');

const updatedFunc = `export const getPatientFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: {
        address: true,
        patientBookings: {
          select: {
            hospital: { select: { id: true, name: true } }
          }
        }
      }
    });

    const cities = new Set<string>();
    const hospitalsMap = new Map<string, string>();

    patients.forEach(p => {
      if (p.address) {
        const parts = p.address.split(',');
        let city = '';
        if (parts.length > 1) {
           city = parts[parts.length - 2].trim() || parts[0].trim();
        } else {
           city = p.address.trim();
        }
        if (city) cities.add(city);
      }
      p.patientBookings?.forEach((b: any) => {
        if (b.hospital) hospitalsMap.set(b.hospital.id, b.hospital.name);
      });
    });

    const hospitals = Array.from(hospitalsMap.entries()).map(([id, name]) => ({ id, name }));

    res.json({
      success: true,
      data: {
        cities: Array.from(cities).filter(Boolean).sort(),
        hospitals: hospitals.sort((a, b) => a.name.localeCompare(b.name))
      }
    });
  } catch (error) {
    next(error);
  }
};
`;

const regex = /export const getPatientFilters = async.*?catch \(error\) \{\s*next\(error\);\s*\}\s*\};\s*/s;
const newContent = content.replace(regex, updatedFunc + '\n');
fs.writeFileSync(targetFile, newContent);
console.log('Filters patched');
