import re
import os

filepath = 'backend/src/modules/laboratories/laboratories.controller.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace query params extraction
content = content.replace(
    "const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';",
    "const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';\n    const type = req.query.type as string;\n    const page = parseInt(req.query.page as string) || 1;\n    const limit = parseInt(req.query.limit as string) || 20;"
)

# Replace whereClause initialization
content = content.replace(
"""    const whereClause: any = {
      OR: [
        { businessType: BusinessType.LABORATORY },
        { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
      ]
    };""",
"""    const whereClause: any = {};
    if (type === 'STANDALONE') {
      whereClause.businessType = BusinessType.LABORATORY;
    } else if (type === 'HOSPITAL_BASED') {
      whereClause.businessType = { not: BusinessType.LABORATORY };
      whereClause.services = { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] };
    } else {
      whereClause.OR = [
        { businessType: BusinessType.LABORATORY },
        { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
      ];
    }"""
)

# Add pagination skip/take
content = content.replace(
    "const labs = await prisma.hospital.findMany({",
    "const totalCount = await prisma.hospital.count({ where: whereClause });\n    const labs = await prisma.hospital.findMany({\n      skip: (page - 1) * limit,\n      take: limit,"
)

# Replace final return to include pagination metadata
# Find the exact return statement structure
content = content.replace(
"""    res.status(200).json({
      success: true,
      data: formatted
    });""",
"""    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });"""
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched laboratories.controller.ts")
