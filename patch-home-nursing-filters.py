import re

filepath = 'backend/src/modules/admin/admin.controller.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const gender = req.query.gender as string;
      const ageMin = req.query.ageMin as string;
      const ageMax = req.query.ageMax as string;
      const city = req.query.city as string;

      const where: any = {};
      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { bookingNumber: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } },
          { nurse: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      if (gender && gender !== 'all') {
        where.patientGender = { equals: gender, mode: 'insensitive' };
      }
      
      if (city && city !== 'all') {
        where.city = { contains: city, mode: 'insensitive' };
      }
      
      if (ageMin || ageMax) {
        where.patientAge = {};
        if (ageMin) where.patientAge.gte = Number(ageMin);
        if (ageMax) where.patientAge.lte = Number(ageMax);
      }
"""

content = re.sub(
    r"      const page = parseInt\(req\.query\.page as string\) \|\| 1;\n      const limit = parseInt\(req\.query\.limit as string\) \|\| 20;\n      const search = req\.query\.search as string;\n\n      const where: any = \{\};\n      if \(search\) \{\n        where\.OR = \[\n          \{ id: \{ contains: search, mode: 'insensitive' \} \},\n          \{ bookingNumber: \{ contains: search, mode: 'insensitive' \} \},\n          \{ patientName: \{ contains: search, mode: 'insensitive' \} \},\n          \{ user: \{ name: \{ contains: search, mode: 'insensitive' \} \} \},\n          \{ hospital: \{ name: \{ contains: search, mode: 'insensitive' \} \} \},\n          \{ nurse: \{ name: \{ contains: search, mode: 'insensitive' \} \} \}\n        \];\n      \}",
    replacement,
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched admin.controller.ts for home nursing filters")
