import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { BusinessType, Role } from '@prisma/client';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET as string, { expiresIn: env.JWT_EXPIRES_IN as any });

    return {
      token,
      role: user.role,
    };
  }

  static async register(payload: any) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: payload.account.email },
          { phone: payload.account.phone }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(payload.account.password, 10);
    
    // We expect hospitalInfo to be populated as we are mimicking the frontend's specific flow
    const info = payload.hospitalInfo || payload.labInfo || {};
    const loc = payload.hospitalLocation || payload.labLocation || {};
    const services = payload.hospitalServices?.services || payload.labServices?.services || [];
    const depts = payload.hospitalDepartments?.departments || [];
    const customDepts = payload.hospitalDepartments?.customDepartments || [];
    const admin = payload.hospitalAdmin || payload.labAdmin || payload.account;
    const bType = payload.businessType.businessType === 'hospital' ? BusinessType.HOSPITAL : BusinessType.LABORATORY;

    // Create the transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Hospital
      const hospital = await tx.hospital.create({
        data: {
          name: info.hospitalName || info.labName || payload.account.name,
          businessType: bType,
          facilityType: info.hospitalType || info.labType,
          registrationNumber: info.registrationNumber,
          contactPhone: info.hospitalPhone || info.labPhone,
          contactEmail: info.hospitalEmail || info.labEmail,
          website: info.website,
          establishedYear: info.establishedYear,
          addressLine1: loc.address1,
          addressLine2: loc.address2,
          area: loc.area,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          pincode: loc.pincode,
          emergencyContact: loc.emergencyContact,
          services: services,
        }
      });

      // 2. Create Departments
      const deptData = depts.map((d: string) => ({ hospitalId: hospital.id, name: d }));
      const customDeptData = customDepts.map((d: any) => ({
        hospitalId: hospital.id,
        name: d.name,
        code: d.code,
        description: d.description
      }));

      if (deptData.length > 0 || customDeptData.length > 0) {
        await tx.department.createMany({
          data: [...deptData, ...customDeptData],
          skipDuplicates: true
        });
      }

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          name: admin.adminName || payload.account.name,
          email: payload.account.email, // using the core account email for login
          phone: payload.account.phone,
          passwordHash,
          role: Role.HOSPITAL_ADMIN,
          designation: admin.adminRole,
          hospitalId: hospital.id,
        }
      });

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

      return { user, hospital, token };
    });

    return result;
  }
}
