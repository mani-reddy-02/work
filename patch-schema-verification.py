import re

filepath = 'backend/prisma/schema.prisma'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add to Hospital
hospital_block = """  // Revenue Sharing
  hospitalShare Float @default(80.0)

  // Verification
  verificationStatus String @default("PENDING")
  cancellationReason String?
  cancelledAt        DateTime?
  cancelledBy        String?

  createdAt DateTime @default(now())"""

content = content.replace("  // Revenue Sharing\n  hospitalShare Float @default(80.0)\n\n  createdAt DateTime @default(now())", hospital_block)

# Add to Lab
lab_block = """  licenseValidUntil     DateTime?

  // Verification
  verificationStatus String @default("PENDING")
  cancellationReason String?
  cancelledAt        DateTime?
  cancelledBy        String?

  createdAt DateTime @default(now())"""

content = content.replace("  licenseValidUntil     DateTime?\n\n  createdAt DateTime @default(now())", lab_block)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated schema.prisma successfully")
