import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getLabTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const concern = typeof req.query.concern === 'string' ? req.query.concern.trim() : '';
    const laboratoryId = typeof req.query.laboratoryId === 'string' ? req.query.laboratoryId.trim() : '';
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';

    const homeCollectionOnly = req.query.homeCollectionOnly === 'true';

    const whereClause: any = {
      active: true,
    };

    if (category && category !== 'All Tests') {
      whereClause.category = { equals: category, mode: 'insensitive' };
    }

    if (concern) {
      whereClause.healthConcern = { equals: concern, mode: 'insensitive' };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { healthConcern: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sampleType: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (laboratoryId) {
      whereClause.offerings = {
        some: {
          laboratoryId,
          active: true,
          ...(homeCollectionOnly ? { homeCollectionAvailable: true } : {}),
        },
      };
    } else if (hospitalId) {
      whereClause.offerings = {
        some: {
          laboratoryId: hospitalId,
          active: true,
          ...(homeCollectionOnly ? { homeCollectionAvailable: true } : {}),
        },
      };
    } else if (homeCollectionOnly) {
      whereClause.offerings = {
        some: {
          active: true,
          homeCollectionAvailable: true,
        },
      };
    }

    const tests = await prisma.labTest.findMany({
      where: whereClause,
      include: {
        offerings: {
          where: {
            active: true,
            ...(homeCollectionOnly ? { homeCollectionAvailable: true } : {}),
          },
          select: {
            id: true,
            laboratoryId: true,
            price: true,
            homeCollectionAvailable: true,
            homeCollectionFee: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = tests.map((t) => {
      // If a specific lab was queried, use that lab's offering price; otherwise use base price
      let effectivePrice = t.price;
      if (laboratoryId) {
        const offering = t.offerings.find((o) => o.laboratoryId === laboratoryId);
        if (offering) effectivePrice = offering.price;
      }

      const homeCollectionAvailable = t.offerings.some((o) => o.homeCollectionAvailable);
      const homeOfferings = t.offerings.filter((o) => o.homeCollectionAvailable);
      const homeCollectionFee = homeOfferings.length > 0
        ? Math.min(...homeOfferings.map((o) => o.homeCollectionFee))
        : 0;

      return {
        id: t.id,
        name: t.name,
        category: t.category,
        sampleType: t.sampleType || 'Blood',
        sample: t.sampleType || 'Blood',
        price: `₹${Math.round(effectivePrice)}`,
        numericPrice: effectivePrice,
        homeCollectionAvailable,
        homeCollectionFee,
        time: t.turnaroundTime || '12 Hours',
        tat: t.turnaroundTime || '12 Hours',
        parameters: t.parametersCount || 1,
        parametersCount: t.parametersCount || 1,
        desc: t.description || '',
        description: t.description || '',
        prep: t.preparation || 'No special preparation required.',
        preparation: t.preparation || 'No special preparation required.',
        concern: t.healthConcern || '',
        healthConcern: t.healthConcern || '',
        availableLabCount: t.offerings.length,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getTestCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tests = await prisma.labTest.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = ['All Tests', ...tests.map((t) => t.category).filter(Boolean)];
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getHealthConcerns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const homeCollectionOnly = req.query.homeCollectionOnly === 'true';
    
    let whereClause: any = { active: true, healthConcern: { not: null, notIn: [''] } };

    if (homeCollectionOnly) {
      whereClause.offerings = {
        some: {
          active: true,
          homeCollectionAvailable: true,
        },
      };
    }

    const tests = await prisma.labTest.findMany({
      where: whereClause,
      select: { healthConcern: true },
      distinct: ['healthConcern'],
    });

    const concerns = tests.map((t) => t.healthConcern).filter(Boolean);
    res.json({ success: true, data: concerns });
  } catch (error) {
    next(error);
  }
};

export const getLabTestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const test = await prisma.labTest.findUnique({
      where: { id },
      include: {
        offerings: {
          where: { active: true },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lab test not found' },
      });
    }

    // Fetch details of all laboratories offering this test
    const labIds = test.offerings.map((o) => o.laboratoryId);
    const labs = await prisma.hospital.findMany({
      where: { id: { in: labIds } },
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
      },
    });

    const labMap = new Map(labs.map((l) => [l.id, l]));

    const laboratories = test.offerings
      .map((o) => {
        const lab = labMap.get(o.laboratoryId);
        if (!lab) return null;
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
          price: `₹${Math.round(o.price)}`,
          numericPrice: o.price,
          homeCollectionAvailable: o.homeCollectionAvailable,
          homeCollectionFee: o.homeCollectionFee,
          time: test.turnaroundTime || 'Within 24 Hours',
          rating: 4.8,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        id: test.id,
        name: test.name,
        category: test.category,
        sampleType: test.sampleType || 'Blood',
        sample: test.sampleType || 'Blood',
        price: `₹${Math.round(test.price)}`,
        numericPrice: test.price,
        time: test.turnaroundTime || '12 Hours',
        tat: test.turnaroundTime || '12 Hours',
        parameters: test.parametersCount || 1,
        parametersCount: test.parametersCount || 1,
        desc: test.description || '',
        description: test.description || '',
        prep: test.preparation || 'No special preparation required.',
        preparation: test.preparation || 'No special preparation required.',
        concern: test.healthConcern || '',
        healthConcern: test.healthConcern || '',
        laboratories,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoriesForTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testId = req.params.id as string;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const homeCollectionOnly = req.query.homeCollectionOnly === 'true';

    const offerings = await prisma.laboratoryTestOffering.findMany({
      where: {
        testId,
        active: true,
        ...(homeCollectionOnly ? { homeCollectionAvailable: true } : {}),
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            turnaroundTime: true,
          },
        },
      },
    });

    if (offerings.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const labIds = offerings.map((o) => o.laboratoryId);
    const labs = await prisma.hospital.findMany({
      where: {
        id: { in: labIds },
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
        area: true,
        city: true,
        state: true,
        pincode: true,
        services: true,
      },
      orderBy: { name: 'asc' },
    });

    const offeringMap = new Map(offerings.map((o) => [o.laboratoryId, o]));

    const filteredLabs = labs.filter((lab) => {
      if (!search) return true;
      const combined = `${lab.name} ${lab.city || ''} ${lab.area || ''} ${lab.addressLine1 || ''}`.toLowerCase();
      return combined.includes(search);
    });

    const result = filteredLabs.map((lab) => {
      const offering = offeringMap.get(lab.id);
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
        price: offering ? `₹${Math.round(offering.price)}` : '₹499',
        numericPrice: offering ? offering.price : 499,
        homeCollectionAvailable: offering ? offering.homeCollectionAvailable : true,
        homeCollectionFee: offering ? offering.homeCollectionFee : 0,
        time: offering?.test?.turnaroundTime || 'Within 24 Hours',
        rating: 4.8,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoryAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const laboratoryId = req.params.id as string;
    const requestedDate = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    // Verify laboratory exists
    const lab = await prisma.hospital.findUnique({
      where: { id: laboratoryId },
      select: { id: true, name: true },
    });

    if (!lab) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Laboratory not found' },
      });
    }

    // Standard daily slots for diagnostics sample collection
    const standardSlots = [
      '07:00 AM',
      '08:00 AM',
      '09:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '02:00 PM',
      '03:00 PM',
      '04:00 PM',
      '05:00 PM',
    ];

    // Dates available: next 7 days
    const availableDates: { label: string; date: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      let label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      availableDates.push({ label, date: iso });
    }

    // Check bookings for target date to eliminate booked slots
    const targetDateStr = requestedDate || availableDates[0].date;
    const targetDate = new Date(targetDateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await prisma.labBooking.findMany({
      where: {
        laboratoryId,
        bookingDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
      select: { timeSlot: true },
    });

    const bookedSlotSet = new Set(booked.map((b) => b.timeSlot));
    const availableSlots = standardSlots.map((slot) => ({
      slot,
      available: !bookedSlotSet.has(slot),
    }));

    res.json({
      success: true,
      data: {
        laboratoryId,
        laboratoryName: lab.name,
        availableDates,
        selectedDate: targetDateStr,
        slots: availableSlots,
      },
    });
  } catch (error) {
    next(error);
  }
};
