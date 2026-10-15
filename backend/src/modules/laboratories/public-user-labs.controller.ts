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

    const packages = await prisma.labPackage.findMany({
      where: {
        status: 'Active',
        hospital: { verificationStatus: 'APPROVED' },
        ...(hospitalId ? { hospitalId: String(hospitalId) } : {}),
        ...(laboratoryId ? { hospitalId: String(laboratoryId) } : {})
      },
      include: { hospital: true }
    });

    const allHospitalTests = await prisma.labTest.findMany({
      where: { isActive: true },
      include: { platformTest: true }
    });

    const formattedPackages = [];
    for (const pkg of packages) {
      const hospitalTests = allHospitalTests.filter((lt: any) => lt.hospitalId === pkg.hospitalId);
      
      let homeCollectionAvailable = true;
      for (const testName of pkg.tests) {
         const matchedTest = hospitalTests.find((lt: any) => lt.platformTest.name === testName);
         if (!matchedTest || !matchedTest.isHomeCollectionAvailable) {
            homeCollectionAvailable = false;
            break;
         }
      }

      if (isHomeCollectionRequest && !homeCollectionAvailable) {
        continue;
      }

      formattedPackages.push({
        id: pkg.id,
        name: pkg.name,
        code: `PKG-${pkg.id.substring(0, 4).toUpperCase()}`,
        category: 'Package',
        sampleType: 'Multiple',
        sample: 'Multiple',
        numericPrice: (hospitalId || laboratoryId) ? pkg.packagePrice : 0,
        price: (hospitalId || laboratoryId) ? `₹${pkg.packagePrice}` : 'Select Provider',
        time: '24',
        tat: '24 Hours',
        parametersCount: pkg.tests.length,
        parameters: pkg.tests.length,
        description: `Tests included: ${pkg.tests.join(', ')}`,
        desc: `Tests included: ${pkg.tests.join(', ')}`,
        prep: 'Consult laboratory',
        preparation: 'Consult laboratory',
        concern: 'General',
        healthConcern: 'General',
        availableLabCount: 1,
        homeCollectionAvailable,
        isPackage: true
      });
    }

    let allResults = [...formattedTests, ...formattedPackages];
    
    if (search) {
      const s = String(search).toLowerCase();
      allResults = allResults.filter((t: any) => t.name.toLowerCase().includes(s));
    }
    if (category && category !== 'All Tests') {
      const c = String(category).toLowerCase();
      allResults = allResults.filter((t: any) => t.category.toLowerCase() === c);
    }

    res.json({ success: true, data: allResults });
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

    const pkg = await prisma.labPackage.findUnique({
      where: { id: String(id), status: 'Active' },
      include: { hospital: true }
    });

    if (pkg) {
      const allHospitalTests = await prisma.labTest.findMany({
        where: { hospitalId: pkg.hospitalId, isActive: true },
        include: { platformTest: true }
      });

      let homeCollectionAvailable = true;
      for (const testName of pkg.tests) {
         const matchedTest = allHospitalTests.find((lt: any) => lt.platformTest.name === testName);
         if (!matchedTest || !matchedTest.isHomeCollectionAvailable) {
            homeCollectionAvailable = false;
            break;
         }
      }

      if (isHomeCollectionRequest && !homeCollectionAvailable) {
        return res.json({ success: true, data: [] });
      }

      const lab = {
        id: pkg.hospital.id,
        name: pkg.hospital.name,
        businessType: pkg.hospital.businessType,
        facilityType: pkg.hospital.facilityType,
        logoUrl: pkg.hospital.logoUrl,
        contactPhone: pkg.hospital.contactPhone,
        contactEmail: pkg.hospital.contactEmail,
        location: pkg.hospital.city || 'Unknown',
        address: pkg.hospital.addressLine1 || 'Unknown',
        rating: 4.5,
        time: 'Open 24/7',
        price: pkg.packagePrice.toString(),
        numericPrice: pkg.packagePrice,
        homeCollectionAvailable,
        homeCollectionFee: 0 // Packages don't explicitly store fee; assumes free or included
      };
      return res.json({ success: true, data: [lab] });
    }

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

    const lab = await prisma.lab.findFirst({
      where: { hospitalId: String(laboratoryId) },
      include: { schedules: true }
    });

    // Generate all dates in the 7-day booking horizon regardless of individual date availability
    const dates = [];
    const now = new Date();
    const kolkataDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const [kYear, kMonth, kDay] = kolkataDateStr.split('-').map(Number);
    const todayDate = new Date(kYear, kMonth - 1, kDay);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() + dayOffset);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (dayOffset === 0) label = 'Today';
      else if (dayOffset === 1) label = 'Tomorrow';

      dates.push({
        label,
        date: isoDate
      });
    }

    const targetDateStr = dateStr || (dates.length > 0 ? dates[0].date : kolkataDateStr);
    const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
    const targetDateObj = new Date(tYear, tMonth - 1, tDay);
    const dayName = targetDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    let baseSlots: { slot: string, available: boolean }[] = [];

    const schedule = lab?.schedules?.find(s => s.dayOfWeek.toLowerCase() === dayName.toLowerCase());

    if (schedule && schedule.isAvailable) {
      let currentMinutes = 0;
      const [startH, startM] = (schedule.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (schedule.endTime || '17:00').split(':').map(Number);
      
      currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const duration = schedule.slotDurationMinutes || 60;
      
      while (currentMinutes + duration <= endMinutes) {
        const startHour = Math.floor(currentMinutes / 60);
        const startMin = currentMinutes % 60;
        const startAmpm = startHour >= 12 ? 'PM' : 'AM';
        const displayStartH = startHour % 12 === 0 ? 12 : startHour % 12;

        const nextMinutes = currentMinutes + duration;
        const endHour = Math.floor(nextMinutes / 60);
        const endMin = nextMinutes % 60;
        const endAmpm = endHour >= 12 ? 'PM' : 'AM';
        const displayEndH = endHour % 12 === 0 ? 12 : endHour % 12;

        const timeStr = `${displayStartH.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')} ${startAmpm} - ${displayEndH.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')} ${endAmpm}`;
        baseSlots.push({ slot: timeStr, available: true });
        
        currentMinutes += duration;
      }
    }
    const isToday = targetDateStr === kolkataDateStr;
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
    const startOfTargetDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfTargetDate = new Date(`${targetDateStr}T23:59:59.999Z`);

    const existingBookings = await prisma.labBooking.findMany({
      where: {
        hospitalId: String(laboratoryId),
        collectionDate: {
          gte: startOfTargetDate,
          lte: endOfTargetDate,
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

      // Filter by existing bookings capacity (Assuming max 1 booking per slot)
      if (isAvailable && slotCounts[s.slot]) {
        if (slotCounts[s.slot].total >= 1) {
          isAvailable = false;
        }
      }

      return {
        ...s,
        available: isAvailable
      };
    }).filter(s => s.available);

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

    const pkg = await prisma.labPackage.findUnique({
      where: { id: String(id), status: 'Active' },
      include: { hospital: true }
    });

    if (pkg) {
      const allHospitalTests = await prisma.labTest.findMany({
        where: { hospitalId: pkg.hospitalId, isActive: true },
        include: { platformTest: true }
      });

      let homeCollectionAvailable = true;
      for (const testName of pkg.tests) {
         const matchedTest = allHospitalTests.find((lt: any) => lt.platformTest.name === testName);
         if (!matchedTest || !matchedTest.isHomeCollectionAvailable) {
            homeCollectionAvailable = false;
            break;
         }
      }

      const testDetail = {
        id: pkg.id,
        name: pkg.name,
        code: `PKG-${pkg.id.substring(0, 4).toUpperCase()}`,
        category: 'Package',
        sampleType: 'Multiple',
        sample: 'Multiple',
        numericPrice: 0,
        price: 'Select Provider',
        time: '24',
        tat: '24 Hours',
        parametersCount: pkg.tests.length,
        parameters: pkg.tests.length,
        description: `Tests included: ${pkg.tests.join(', ')}`,
        desc: `Tests included: ${pkg.tests.join(', ')}`,
        prep: 'Consult laboratory',
        preparation: 'Consult laboratory',
        concern: 'General',
        healthConcern: 'General',
        availableLabCount: 1,
        homeCollectionAvailable,
        isPackage: true
      };
      return res.json({ success: true, data: testDetail });
    }
    
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
