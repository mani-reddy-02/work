const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const regex = /model Lab \{[\s\S]*?@@map\("hospital_labs"\)\s*\}/m;

const replacement = `model Lab {
  id         String    @id @default(uuid())
  type       String    @default("HOSPITAL_BASED")
  hospitalId String?
  hospital   Hospital? @relation(fields: [hospitalId], references: [id], onDelete: Cascade)

  platformDepartmentId String?
  platformDepartment   PlatformLabDepartment? @relation(fields: [platformDepartmentId], references: [id])

  name                  String
  contactPhone          String?
  email                 String?
  address               String?
  city                  String?
  state                 String?
  pinCode               String?
  description           String?
  status                String    @default("Active")
  
  labLicenseNumber      String?
  labLicenseDocumentUrl String?
  licenseValidUntil     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("hospital_labs")
}`;

content = content.replace(regex, replacement);
fs.writeFileSync('backend/prisma/schema.prisma', content, 'utf8');
console.log('patched schema.prisma');
