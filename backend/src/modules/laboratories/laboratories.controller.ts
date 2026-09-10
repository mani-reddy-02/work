import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { BusinessType } from '@prisma/client';

export const getLaboratories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';

    const whereClause: any = {
      OR: [
        { businessType: BusinessType.LABORATORY },
        { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
      ]
    };

    if (hospitalId) {
      whereClause.id = hospitalId;
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { area: { contains: search, mode: 'insensitive' } },
            { addressLine1: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    if (location) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { city: { contains: location, mode: 'insensitive' } },
            { area: { contains: location, mode: 'insensitive' } },
            { state: { contains: location, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const labs = await prisma.hospital.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        businessType: true,
        facilityType: true,
        logoUrl: true,
        contactPhone: true,
        contactEmail: true,
        addressLine1: true,
        addressLine2: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        services: true
      },
      orderBy: { name: 'asc' }
    });

    const labIds = labs.map(l => l.id);

    // Fetch minimum test prices and test counts for each lab
    const offerings = await prisma.laboratoryTestOffering.findMany({
      where: {
        laboratoryId: { in: labIds },
        active: true,
      },
      select: {
        laboratoryId: true,
        price: true,
      }
    });

    const labStatsMap = new Map<string, { minPrice: number; count: number }>();
    for (const o of offerings) {
      const existing = labStatsMap.get(o.laboratoryId);
      if (!existing) {
        labStatsMap.set(o.laboratoryId, { minPrice: o.price, count: 1 });
      } else {
        existing.count += 1;
        if (o.price < existing.minPrice) existing.minPrice = o.price;
      }
    }

    const formatted = labs.map(lab => {
      const stats = labStatsMap.get(lab.id);
      const minPrice = stats?.minPrice ? `₹${Math.round(stats.minPrice)}` : '₹149';

      return {
        id: lab.id,
        name: lab.name,
        businessType: lab.businessType,
        facilityType: lab.facilityType,
        logoUrl: lab.logoUrl,
        contactPhone: lab.contactPhone,
        contactEmail: lab.contactEmail,
        addressLine1: lab.addressLine1,
        area: lab.area,
        city: lab.city,
        state: lab.state,
        pincode: lab.pincode,
        location: [lab.area, lab.city, lab.state].filter(Boolean).join(', ') || lab.city || 'India',
        address: [lab.addressLine1, lab.area, lab.city].filter(Boolean).join(', ') || lab.city || 'India',
        services: lab.services,
        rating: 4.8,
        time: 'Within 24 Hours',
        price: minPrice,
        testCount: stats?.count || 0
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const lab = await prisma.hospital.findFirst({
      where: {
        id,
        OR: [
          { businessType: BusinessType.LABORATORY },
          { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
        ]
      },
      select: {
        id: true,
        name: true,
        businessType: true,
        facilityType: true,
        logoUrl: true,
        contactPhone: true,
        contactEmail: true,
        addressLine1: true,
        addressLine2: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        services: true
      }
    });

    if (!lab) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Laboratory not found' }
      });
    }

    // Get offerings for this lab
    const offerings = await prisma.laboratoryTestOffering.findMany({
      where: { laboratoryId: id, active: true },
      include: {
        test: true
      },
      orderBy: { test: { name: 'asc' } }
    });

    const minPrice = offerings.length > 0 
      ? Math.min(...offerings.map(o => o.price))
      : 149;

    res.json({
      success: true,
      data: {
        id: lab.id,
        name: lab.name,
        businessType: lab.businessType,
        facilityType: lab.facilityType,
        logoUrl: lab.logoUrl,
        contactPhone: lab.contactPhone,
        contactEmail: lab.contactEmail,
        addressLine1: lab.addressLine1,
        area: lab.area,
        city: lab.city,
        state: lab.state,
        pincode: lab.pincode,
        location: [lab.area, lab.city, lab.state].filter(Boolean).join(', ') || lab.city || 'India',
        address: [lab.addressLine1, lab.area, lab.city].filter(Boolean).join(', ') || lab.city || 'India',
        services: lab.services,
        rating: 4.8,
        time: 'Within 24 Hours',
        price: `₹${Math.round(minPrice)}`,
        availableTestsCount: offerings.length,
        tests: offerings.map(o => ({
          id: o.test.id,
          name: o.test.name,
          category: o.test.category,
          sampleType: o.test.sampleType,
          price: `₹${Math.round(o.price)}`,
          numericPrice: o.price,
          time: o.test.turnaroundTime || '12 Hours',
          homeCollectionAvailable: o.homeCollectionAvailable,
          homeCollectionFee: o.homeCollectionFee,
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoryTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const offerings = await prisma.laboratoryTestOffering.findMany({
      where: { laboratoryId: id, active: true },
      include: {
        test: true
      },
      orderBy: { test: { name: 'asc' } }
    });

    const tests = offerings.map(o => ({
      id: o.test.id,
      name: o.test.name,
      category: o.test.category,
      sampleType: o.test.sampleType || 'Blood',
      sample: o.test.sampleType || 'Blood',
      price: `₹${Math.round(o.price)}`,
      numericPrice: o.price,
      time: o.test.turnaroundTime || '12 Hours',
      tat: o.test.turnaroundTime || '12 Hours',
      parameters: o.test.parametersCount || 1,
      parametersCount: o.test.parametersCount || 1,
      desc: o.test.description || '',
      prep: o.test.preparation || 'No special preparation required.',
      homeCollectionAvailable: o.homeCollectionAvailable,
      homeCollectionFee: o.homeCollectionFee,
    }));

    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};
