import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getPublicHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        businessType: true,
        facilityType: true,
        logoUrl: true,
        contactPhone: true,
        contactEmail: true,
        addressLine1: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        services: true,
        departments: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: hospitals });
  } catch (error) {
    next(error);
  }
};

export const getPublicDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        hospital: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

export const getPublicDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        active: true,
      },
      select: {
        id: true,
        name: true,
        designation: true,
        hospital: {
          select: { id: true, name: true, city: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

export const getLocationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const defaultRadiusKm = process.env.NEARBY_SEARCH_RADIUS_KM
      ? parseFloat(process.env.NEARBY_SEARCH_RADIUS_KM)
      : 25;

    res.json({
      success: true,
      data: {
        defaultRadiusKm,
        maxRadiusKm: 100,
        supportedLocalities: [
          { name: 'Near Uppal, Hyderabad', locality: 'Uppal', city: 'Hyderabad', state: 'Telangana', lat: 17.4018, lng: 78.5602 },
          { name: 'Jubilee Hills, Hyderabad', locality: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4325, lng: 78.4071 },
          { name: 'Banjara Hills, Hyderabad', locality: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4168, lng: 78.4485 },
          { name: 'Madhapur, Hyderabad', locality: 'Madhapur', city: 'Hyderabad', state: 'Telangana', lat: 17.4435, lng: 78.3772 },
          { name: 'Hitec City, Hyderabad', locality: 'Hitec City', city: 'Hyderabad', state: 'Telangana', lat: 17.4504, lng: 78.3808 },
          { name: 'Secunderabad', locality: 'MG Road', city: 'Secunderabad', state: 'Telangana', lat: 17.4399, lng: 78.4983 },
          { name: 'Gachibowli, Hyderabad', locality: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', lat: 17.4401, lng: 78.3489 },
          { name: 'Kukatpally, Hyderabad', locality: 'Kukatpally', city: 'Hyderabad', state: 'Telangana', lat: 17.4849, lng: 78.4138 },
          { name: 'Alur Road, Adoni', locality: 'Alur Road', city: 'Adoni', state: 'Andhra Pradesh', lat: 15.6150, lng: 77.2950 },
          { name: 'Narayanapuram, Adoni', locality: 'Narayanapuram', city: 'Adoni', state: 'Andhra Pradesh', lat: 15.6322, lng: 77.2728 },
          { name: 'Ramchandranagar, Mantralayam', locality: 'Ramchandranagar', city: 'Mantralayam', state: 'Andhra Pradesh', lat: 15.9388, lng: 77.4269 },
          { name: 'Tirupati, Andhra Pradesh', locality: 'Tirupati', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
          { name: 'Bengaluru, Karnataka', locality: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
          { name: 'Chennai, Tamil Nadu', locality: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
          { name: 'Kurnool, Andhra Pradesh', locality: 'Kurnool', city: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lng: 78.0373 }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};
