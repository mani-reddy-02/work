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
          { name: 'Madanapalle, Andhra Pradesh', locality: 'Madanapalle', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5560, lng: 78.5010 },
          { name: 'BT College, Madanapalle', locality: 'BT College', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5510, lng: 78.5030 },
          { name: 'Neerugattuvaripalli, Madanapalle', locality: 'Neerugattuvaripalli', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5620, lng: 78.4980 },
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

export const reverseGeocode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lng required' });
    }

    // 1. Check if close to verified platform localities (< 6 km)
    const platformLocalities = [
      { name: 'Madanapalle, Andhra Pradesh', locality: 'Madanapalle', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5560, lng: 78.5010 },
      { name: 'BT College, Madanapalle', locality: 'BT College', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5510, lng: 78.5030 },
      { name: 'Neerugattuvaripalli, Madanapalle', locality: 'Neerugattuvaripalli', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5620, lng: 78.4980 },
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
      { name: 'Tirupati, Andhra Pradesh', locality: 'Tirupati', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 }
    ];

    for (const loc of platformLocalities) {
      const dLat = ((loc.lat - lat) * Math.PI) / 180;
      const dLon = ((loc.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((loc.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = 6371 * c;

      if (dist <= 6) {
        return res.json({
          success: true,
          data: {
            label: loc.name.startsWith('Near') ? loc.name : `Near ${loc.name}`,
            city: loc.city,
            locality: loc.locality,
            state: loc.state
          }
        });
      }
    }

    // 2. Query Nominatim via backend (supported with proper User-Agent)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MediQuee-Platform/1.0 (contact@mediquee.com)'
          }
        }
      );

      if (response.ok) {
        const data = await response.json() as any;
        if (data && data.address) {
          const addr = data.address;
          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.quarter ||
            addr.village ||
            addr.town ||
            addr.county ||
            '';
          const city = addr.city || addr.town || addr.county || addr.state_district || 'Hyderabad';
          const state = addr.state || '';
          const label = locality && locality !== city
            ? `Near ${locality}, ${city}`
            : `Near ${city}${state ? `, ${state}` : ''}`;

          return res.json({
            success: true,
            data: { label, city, locality, state }
          });
        }
      }
    } catch {
      // Fallback
    }

    res.json({
      success: true,
      data: {
        label: 'Location Detected',
        city: null,
        locality: null,
        state: null
      }
    });
  } catch (error) {
    next(error);
  }
};
