import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getPublicLabTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, concern, laboratoryId, hospitalId, homeCollectionOnly } = req.query;
    const isHomeCollectionRequest = req.originalUrl.includes('home-sample-collection') || homeCollectionOnly === 'true';

    const whereClause: any = {
      hospitalOfferings: {
        some: {
          isActive: true,
          hospital: {
            verificationStatus: 'APPROVED'
          },
          ...(isHomeCollectionRequest ? { isHomeCollectionAvailable: true } : {}),
          ...(hospitalId ? { hospitalId: String(hospitalId) } : {}),
          ...(laboratoryId ? { hospitalId: String(laboratoryId) } : {})
        }
      }
    };

    if (search) {
      whereClause.name = { contains: String(search), mode: 'insensitive' };
    }

    if (category && category !== 'All Tests') {
      whereClause.department = { name: { equals: String(category), mode: 'insensitive' } };
    }

    let platformTests: any = [];
    try {
      platformTests = await prisma.platformLabTest.findMany({
        where: whereClause,
        include: {
          department: true,
          hospitalOfferings: {
            where: {
              isActive: true,
              hospital: {
                verificationStatus: 'APPROVED'
              },
              ...(isHomeCollectionRequest ? { isHomeCollectionAvailable: true } : {}),
              ...(hospitalId ? { hospitalId: String(hospitalId) } : {}),
              ...(laboratoryId ? { hospitalId: String(laboratoryId) } : {})
            }
          }
        }
      });
    } catch (e) {
      platformTests = [];
    }

    const formattedTests = platformTests.map((pt: any) => {
      const offerings = pt.hospitalOfferings || [];
      const minPrice = offerings.length > 0 ? offerings.reduce((min: number, o: any) => Math.min(min, o.price), Infinity) : Infinity;
      const minTat = offerings.length > 0 ? offerings.reduce((min: number, o: any) => Math.min(min, o.tatHours), Infinity) : Infinity;
      const anyHomeCollection = offerings.some((o: any) => o.isHomeCollectionAvailable);
      const finalPrice = minPrice === Infinity ? (pt.basePrice || 299) : minPrice;
      const finalTat = minTat === Infinity ? 24 : minTat;

      return {
        id: pt.id,
        name: pt.name,
        code: pt.code,
        category: pt.department?.name || 'Blood Tests',
        sampleType: pt.specimenType || 'Blood',
        sample: pt.specimenType || 'Blood',
        numericPrice: finalPrice,
        price: `₹${finalPrice}`,
        time: `${finalTat} Hours`,
        tat: `${finalTat} Hours`,
        parametersCount: 1, // Mock
        parameters: 1,
        description: pt.description || 'No description available',
        desc: pt.description || 'No description available',
        prep: pt.fastingRequired ? `Fasting for ${pt.fastingDurationHours || 8} hours` : 'No special preparation',
        preparation: pt.fastingRequired ? `Fasting for ${pt.fastingDurationHours || 8} hours` : 'No special preparation',
        concern: pt.department.name,
        healthConcern: pt.department.name,
        availableLabCount: offerings.length,
        homeCollectionAvailable: anyHomeCollection
      };
    });

    res.json({ success: true, data: formattedTests });
  } catch (error) {
    next(error);
  }
};

export const getPublicLabCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.platformLabDepartment.findMany({
      select: { name: true }
    });
    const names = ['All Tests', ...departments.map((d: any) => d.name)];
    res.json({ success: true, data: names });
  } catch (error) {
    next(error);
  }
};

export const getEligibleLaboratories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; 
    const { search, homeCollectionOnly } = req.query;
    const isHomeCollectionRequest = req.originalUrl.includes('home-sample-collection') || homeCollectionOnly === 'true';

    const offerings: any = await prisma.labTest.findMany({
      where: {
        platformTestId: String(id),
        isActive: true,
        hospital: {
          verificationStatus: 'APPROVED'
        },
        ...(isHomeCollectionRequest ? { isHomeCollectionAvailable: true } : {})
      },
      include: {
        hospital: true
      }
    });

    let labs = offerings.map((o: any) => ({
      id: o.hospital.id,
      name: o.hospital.name,
      businessType: o.hospital.businessType,
      facilityType: o.hospital.facilityType,
      logoUrl: o.hospital.logoUrl,
      contactPhone: o.hospital.contactPhone,
      contactEmail: o.hospital.contactEmail,
      location: o.hospital.city || 'Unknown',
      address: o.hospital.addressLine1 || 'Unknown',
      rating: 4.5,
      time: 'Open 24/7',
      price: o.price.toString(),
      numericPrice: o.price,
      homeCollectionAvailable: o.isHomeCollectionAvailable,
      homeCollectionFee: o.homeCollectionFee
    }));

    if (search) {
      const s = String(search).toLowerCase();
      labs = labs.filter((l: any) => l.name.toLowerCase().includes(s));
    }

    res.json({ success: true, data: labs });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoryAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { laboratoryId } = req.params;
    const dateStr = req.query.date as string | undefined; 

    const hospital = await prisma.hospital.findUnique({
      where: { id: String(laboratoryId) }
    });

    if (!hospital) {
      return res.status(404).json({ success: false, error: { message: 'Laboratory not found' } });
    }

    // Mock slots for now
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push({
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        date: d.toISOString().split('T')[0]
      });
    }

    const baseSlots = [
      { slot: '08:00 AM - 09:00 AM', available: true },
      { slot: '09:00 AM - 10:00 AM', available: true },
      { slot: '10:00 AM - 11:00 AM', available: true },
      { slot: '11:00 AM - 12:00 PM', available: true },
      { slot: '12:00 PM - 01:00 PM', available: true },
      { slot: '01:00 PM - 02:00 PM', available: true },
      { slot: '02:00 PM - 03:00 PM', available: true },
      { slot: '03:00 PM - 04:00 PM', available: true },
      { slot: '04:00 PM - 05:00 PM', available: true },
      { slot: '05:00 PM - 06:00 PM', available: true }
    ];

    const targetDateStr = dateStr || dates[0].date;
    const now = new Date();
    const isToday = targetDateStr === now.toISOString().split('T')[0];
    let currentKolkataTimeInMinutes = 0;
    
    if (isToday) {
      const kolkataTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).format(now);
      const [h, m] = kolkataTime.split(':').map(Number);
      currentKolkataTimeInMinutes = h * 60 + m;
    }

    // Fetch existing bookings for this hospital on the target date
    const targetDateObj = new Date(targetDateStr);
    const nextDay = new Date(targetDateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingBookings = await prisma.labBooking.findMany({
      where: {
        hospitalId: String(laboratoryId),
        collectionDate: {
          gte: targetDateObj,
          lt: nextDay,
        },
        status: { notIn: ['CANCELLED'] }
      },
      select: {
        collectionTimeSlot: true,
        bookingType: true
      }
    });

    // Count how many bookings exist for each slot (e.g. limit to 3 total bookings per slot, or 1 for HOME_COLLECTION)
    const slotCounts: Record<string, { total: number, home: number }> = {};
    for (const b of existingBookings) {
      if (b.collectionTimeSlot) {
        if (!slotCounts[b.collectionTimeSlot]) {
          slotCounts[b.collectionTimeSlot] = { total: 0, home: 0 };
        }
        slotCounts[b.collectionTimeSlot].total++;
        if (b.bookingType === 'HOME_COLLECTION') {
          slotCounts[b.collectionTimeSlot].home++;
        }
      }
    }

    const slots = baseSlots.map(s => {
      let isAvailable = true;

      // Filter by time if it's today
      if (isToday) {
        const match = s.slot.match(/(\d+):(\d+)\s+(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          const slotMinutes = h * 60 + m;
          if (slotMinutes <= currentKolkataTimeInMinutes) {
            isAvailable = false;
          }
        }
      }

      // Filter by existing bookings capacity (Assuming max 1 Home collection or max 5 total walk-ins)
      if (isAvailable && slotCounts[s.slot]) {
        // You can tweak this capacity. Let's say a slot is full if it has >= 3 bookings
        if (slotCounts[s.slot].total >= 3) {
          isAvailable = false;
        }
      }

      return {
        ...s,
        available: isAvailable
      };
    });

    res.json({
      success: true,
      data: {
        laboratoryId,
        laboratoryName: hospital.name,
        availableDates: dates,
        selectedDate: dateStr || dates[0].date,
        slots
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicLabTestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const pt: any = await prisma.platformLabTest.findUnique({
      where: { id: String(id) },
      include: {
        department: true,
        hospitalOfferings: {
          where: { isActive: true, hospital: { verificationStatus: 'APPROVED' } }
        }
      }
    });

    if (!pt) {
      return res.status(404).json({ success: false, error: { message: 'Test not found' } });
    }

    const offerings = pt.hospitalOfferings || [];
    const minPrice = offerings.reduce((min: number, o: any) => Math.min(min, o.price), Infinity);
    const minTat = offerings.reduce((min: number, o: any) => Math.min(min, o.tatHours), Infinity);
    const anyHomeCollection = offerings.some((o: any) => o.isHomeCollectionAvailable);

    const testDetail = {
      id: pt.id,
      name: pt.name,
      code: pt.code,
      category: pt.department.name,
      sampleType: pt.specimenType,
      sample: pt.specimenType,
      numericPrice: minPrice === Infinity ? 0 : minPrice,
      price: minPrice === Infinity ? '0' : minPrice.toString(),
      time: minTat === Infinity ? '24' : minTat.toString(),
      tat: minTat === Infinity ? '24 Hours' : `${minTat} Hours`,
      parametersCount: 1, // Mock
      parameters: 1,
      description: pt.description || 'No description available',
      desc: pt.description || 'No description available',
      prep: pt.fastingRequired ? `Fasting for ${pt.fastingDurationHours || 8} hours` : 'No special preparation',
      preparation: pt.fastingRequired ? `Fasting for ${pt.fastingDurationHours || 8} hours` : 'No special preparation',
      concern: pt.department.name,
      healthConcern: pt.department.name,
      availableLabCount: offerings.length,
      homeCollectionAvailable: anyHomeCollection
    };

    res.json({ success: true, data: testDetail });
  } catch (error) {
    next(error);
  }
};
