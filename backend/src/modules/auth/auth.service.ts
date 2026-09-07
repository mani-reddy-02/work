import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { BusinessType, Role } from '@prisma/client';

// Maps the frontend UI role selector values to the authoritative database Role enum.
const UI_ROLE_TO_DB_ROLE: Record<string, Role> = {
  admin: Role.HOSPITAL_ADMIN,
  super_admin: Role.SUPER_ADMIN,
  doctor: Role.DOCTOR,
  nurse: Role.NURSE,
  receptionist: Role.RECEPTIONIST,
  lab: Role.LAB_ADMIN,
  patient: Role.PATIENT,
};

export class AuthService {
  static async login(identifier: string, password: string, selectedRole?: string) {
    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.active) {
      throw new Error('Account is deactivated');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // If a role was selected on the login UI, verify it matches the database role.
    if (selectedRole) {
      const expectedDbRole = UI_ROLE_TO_DB_ROLE[selectedRole.toLowerCase()];
      if (!expectedDbRole || expectedDbRole !== user.role) {
        throw new Error('Role mismatch');
      }
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET as string, { expiresIn: env.JWT_EXPIRES_IN as any });

    return {
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  static async registerPatient(payload: { name: string; email: string; phone: string; password: string }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: payload.email },
          { phone: payload.phone },
        ],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        passwordHash,
        role: Role.PATIENT,
      },
    });

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET as string, { expiresIn: env.JWT_EXPIRES_IN as any });

    return {
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  static async register(payload: any) {
    // If patient registration payload
    if (payload.name && payload.email && !payload.businessType) {
      return this.registerPatient(payload);
    }

    // Check if hospital admin user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: payload.account.email },
          { phone: payload.account.phone },
        ],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(payload.account.password, 10);
    
    const info = payload.hospitalInfo || payload.labInfo || {};
    const loc = payload.hospitalLocation || payload.labLocation || {};
    const services = payload.hospitalServices?.services || payload.labServices?.services || [];
    const depts = payload.hospitalDepartments?.departments || [];
    const customDepts = payload.hospitalDepartments?.customDepartments || [];
    const admin = payload.hospitalAdmin || payload.labAdmin || payload.account;
    const bType = payload.businessType.businessType === 'hospital' ? BusinessType.HOSPITAL : BusinessType.LABORATORY;

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
        },
      });

      // 2. Create Departments
      const deptData = depts.map((d: string) => ({ hospitalId: hospital.id, name: d }));
      const customDeptData = customDepts.map((d: any) => ({
        hospitalId: hospital.id,
        name: d.name,
        code: d.code,
        description: d.description,
      }));

      if (deptData.length > 0 || customDeptData.length > 0) {
        await tx.department.createMany({
          data: [...deptData, ...customDeptData],
          skipDuplicates: true,
        });
      }

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          name: admin.adminName || payload.account.name,
          email: payload.account.email,
          phone: payload.account.phone,
          passwordHash,
          role: Role.HOSPITAL_ADMIN,
          designation: admin.adminRole,
          hospitalId: hospital.id,
        },
      });

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

      return { user, hospital, token };
    });

    return result;
  }
}
