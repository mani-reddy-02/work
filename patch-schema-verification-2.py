import re

filepath = 'backend/prisma/schema.prisma'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add to Hospital
hospital_pattern = r'    services            String\[\]\n    createdAt           DateTime               @default\(now\(\)\)'
hospital_replacement = """    services            String[]

    // Verification
    verificationStatus String @default("PENDING")
    cancellationReason String?
    cancelledAt        DateTime?
    cancelledBy        String?

    createdAt           DateTime               @default(now())"""
content = re.sub(hospital_pattern, hospital_replacement, content)

# Add to Lab
lab_pattern = r'    type                  String                 @default\("HOSPITAL_BASED"\)'
lab_replacement = """    type                  String                 @default("HOSPITAL_BASED")

    // Verification
    verificationStatus String @default("PENDING")
    cancellationReason String?
    cancelledAt        DateTime?
    cancelledBy        String?
"""
content = re.sub(lab_pattern, lab_replacement, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated schema.prisma with verification fields")
