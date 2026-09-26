import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import { sendNotification } from '../notifications/notifications.service';

// Generate unique human-readable booking number
const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MQ-HN-${timestamp}-${random}`;
};

/**
 * GET /api/v1/home-nursing/services
 * Returns active nursing services with search, category, and hospital filters.
 */
export const getNursingServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, hospitalId } = req.query;

    const where: any = { active: true };

    if (category && typeof category === 'string' && category !== 'All Services') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (hospitalId && typeof hospitalId === 'string') {
      where.offerings = {
        some: {
          hospitalId,
          available: true,
        },
      };
    }

    const services = await prisma.nursingService.findMany({
      where,
      include: {
        offerings: {
          where: { available: true },
          select: {
            id: true,
            hospitalId: true,
            price: true,
            duration: true,
            serviceArea: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = services.map((s) => {
      const prices = s.offerings.map((o) => o.price);
      const minPrice = prices.length > 0 ? Math.min(...prices) : s.basePrice;
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
        description: s.description,
        duration: s.duration,
        basePrice: s.basePrice,
        price: `₹${minPrice.toLocaleString('en-IN')}`,
        numericPrice: minPrice,
        requirements: s.requirements,
        iconUrl: s.iconUrl,
        availableProvidersCount: s.offerings.length,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/services/categories
 * Returns distinct categories of nursing services.
 */
export const getNursingCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const distinctCategories = await prisma.nursingService.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    const categories = ['All Services', ...distinctCategories.map((c) => c.category)];
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/services/:id
 * Returns single service details with all offering hospitals and prices.
 */
export const getNursingServiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const service = await prisma.nursingService.findUnique({
      where: { id },
      include: {
        offerings: {
          where: { available: true },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Nursing service not found' },
      });
    }

    // Fetch offering hospitals info
    const hospitalIds = service.offerings.map((o) => o.hospitalId);
    const hospitals = await prisma.hospital.findMany({
      where: { id: { in: hospitalIds } },
      select: {
        id: true,
        name: true,
        city: true,
        area: true,
        addressLine1: true,
        contactPhone: true,
        logoUrl: true,
      },
    });

    const hospitalMap = new Map(hospitals.map((h) => [h.id, h]));

    const providers = service.offerings.map((o) => {
      const h = hospitalMap.get(o.hospitalId);
      return {
        id: o.hospitalId,
        offeringId: o.id,
        hospitalName: h?.name || 'Registered Hospital',
        location: [h?.area, h?.city].filter(Boolean).join(', ') || 'Hyderabad',
        address: h?.addressLine1 || '',
        contactPhone: h?.contactPhone || '',
        logoUrl: h?.logoUrl || null,
        price: `₹${o.price.toLocaleString('en-IN')}`,
        numericPrice: o.price,
        duration: o.duration || service.duration,
        serviceArea: o.serviceArea || 'Standard Service Area',
      };
    });

    res.json({
      success: true,
      data: {
        id: service.id,
        name: service.name,
        code: service.code,
        category: service.category,
        description: service.description,
        duration: service.duration,
        basePrice: service.basePrice,
        requirements: service.requirements,
        iconUrl: service.iconUrl,
        providers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/services/:id/providers
 * Returns only valid hospitals offering the selected nursing service.
 */
export const getNursingServiceProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { search } = req.query;

    const offerings = await prisma.nursingServiceOffering.findMany({
      where: {
        serviceId: id,
        available: true,
      },
    });

    if (offerings.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const hospitalIds = offerings.map((o) => o.hospitalId);
    const whereHospital: any = { id: { in: hospitalIds } };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      whereHospital.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { area: { contains: q, mode: 'insensitive' } },
      ];
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereHospital,
      select: {
        id: true,
        name: true,
        city: true,
        area: true,
        addressLine1: true,
        contactPhone: true,
        logoUrl: true,
        users: {
          where: { role: Role.NURSE, active: true },
          select: {
            id: true,
            name: true,
            designation: true,
            avatar: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const offeringMap = new Map(offerings.map((o) => [o.hospitalId, o]));

    const result = hospitals.map((h) => {
      const offering = offeringMap.get(h.id);
      return {
        id: h.id,
        name: h.name,
        location: [h.area, h.city].filter(Boolean).join(', ') || 'Hyderabad',
        address: h.addressLine1 || '',
        contactPhone: h.contactPhone || '',
        logoUrl: h.logoUrl,
        rating: 4.8,
        registered: true,
        price: offering ? `₹${offering.price.toLocaleString('en-IN')}` : '₹1,200',
        numericPrice: offering ? offering.price : 1200,
        duration: offering?.duration || '12 / 24 Hours',
        serviceArea: offering?.serviceArea || 'Standard Service Area',
        nurses: h.users || [],
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/hospitals/:id/nurses
 * Returns active nurses for a given hospital.
 */
export const getHospitalNurses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const nurses = await prisma.user.findMany({
      where: {
        hospitalId: id,
        role: Role.NURSE,
        active: true,
      },
      select: {
        id: true,
        name: true,
        designation: true,
        avatar: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: nurses });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/services/:id/availability
 * Returns available time slots for a service and hospital on a given date.
 */
export const getNursingAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = req.params.id as string;
    const { hospitalId, date, nurseId } = req.query;

    if (!hospitalId || typeof hospitalId !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'hospitalId query parameter is required' },
      });
    }

    const service = await prisma.nursingService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Nursing service not found' },
      });
    }

    // Default target date
    const getCalendarDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getCalendarDateString(new Date());
    const targetDateStr = (date && typeof date === 'string') ? date : todayStr;

    const [year, month, day] = targetDateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    // Standard nursing time slots based on duration
    const isShift = service.duration.includes('12') || service.duration.includes('24');
    const standardSlots = isShift
      ? [
          'Day Shift (08:00 AM - 08:00 PM)',
          'Night Shift (08:00 PM - 08:00 AM)',
          '24-Hour Shift (08:00 AM - 08:00 AM Next Day)',
        ]
      : [
          '08:00 AM - 10:00 AM',
          '10:00 AM - 12:00 PM',
          '02:00 PM - 04:00 PM',
          '04:00 PM - 06:00 PM',
          '06:00 PM - 08:00 PM',
        ];

    // Find existing bookings on that date
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookingWhere: any = {
      hospitalId,
      serviceDate: {
        gte: selectedDate,
        lt: nextDay,
      },
      status: { notIn: ['CANCELLED'] },
    };

    if (nurseId && typeof nurseId === 'string') {
      bookingWhere.nurseId = nurseId;
    }

    const existingBookings = await prisma.homeNursingBooking.findMany({
      where: bookingWhere,
      select: { timeSlot: true, nurseId: true },
    });

    const bookedSlotsSet = new Set(existingBookings.map((b) => b.timeSlot));

    const serverTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const serverNow = new Date(serverTimeStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const serverTodayStr = `${serverNow.getFullYear()}-${pad(serverNow.getMonth() + 1)}-${pad(serverNow.getDate())}`;

    const slots = standardSlots.map((slot) => {
      let isExpired = false;
      if (targetDateStr === serverTodayStr) {
        const match = slot.match(/(\d+):(\d+)\s+(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          const slotMinutes = h * 60 + m;
          const currentMinutes = serverNow.getHours() * 60 + serverNow.getMinutes();
          if (slotMinutes <= currentMinutes) {
            isExpired = true;
          }
        }
      } else if (targetDateStr < serverTodayStr) {
        isExpired = true;
      }
      return {
        slot,
        available: !bookedSlotsSet.has(slot) && !isExpired,
      };
    });

    // Return next 5 selectable dates
    const dates: { label: string; date: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = getCalendarDateString(d);
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      dates.push({ label, date: dateStr });
    }

    res.json({
      success: true,
      data: {
        date: targetDateStr,
        availableDates: dates,
        slots,
        duration: service.duration,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/home-nursing/bookings
 * Authenticated JWT endpoint that validates offering, availability, and creates booking.
 */
export const createNursingBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const {
      serviceId,
      hospitalId,
      nurseId,
      patientName,
      patientPhone,
      patientEmail,
      patientAge,
      patientGender,
      serviceDate,
      timeSlot,
      address,
      city,
      pincode,
      notes,
      paymentMethod = 'CARD',
    } = req.body;

    // 1. Validate required fields
    if (!serviceId || !hospitalId || !patientName || !patientPhone || !serviceDate || !timeSlot || !address) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: serviceId, hospitalId, patientName, patientPhone, serviceDate, timeSlot, and address are required',
        },
      });
    }

    // 2. Validate Hospital exists
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Selected hospital was not found' },
      });
    }

    // 3. Validate Service and Offering
    const service = await prisma.nursingService.findUnique({ where: { id: serviceId } });
    if (!service || !service.active) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Nursing service not found or inactive' },
      });
    }

    const offering = await prisma.nursingServiceOffering.findUnique({
      where: {
        hospitalId_serviceId: {
          hospitalId,
          serviceId,
        },
      },
    });

    if (!offering || !offering.available) {
      return res.status(400).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'This service is not offered by the selected hospital' },
      });
    }

    // 4. Validate Nurse if provided
    if (nurseId) {
      const nurse = await prisma.user.findFirst({
        where: { id: nurseId, hospitalId, role: Role.NURSE, active: true },
      });
      if (!nurse) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_NURSE', message: 'Assigned nurse does not belong to the selected hospital' },
        });
      }
    }

    // 5. Parse and validate date
    const getCalendarDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dateStr = typeof serviceDate === 'string' ? serviceDate.split('T')[0] : '';
    const todayStr = getCalendarDateString(new Date());

    if (!dateStr || dateStr < todayStr) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Service date cannot be in the past' },
      });
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const bookingDay = new Date(y, m - 1, d, 0, 0, 0, 0);

    const trustedTotalAmount = offering.price;
    const bookingNumber = generateBookingNumber();

    // 5.5 Validate IST Time to prevent booking past slots today
    const serverTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const serverNow = new Date(serverTimeStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const serverTodayStr = `${serverNow.getFullYear()}-${pad(serverNow.getMonth() + 1)}-${pad(serverNow.getDate())}`;

    if (dateStr === serverTodayStr && timeSlot) {
       const match = timeSlot.match(/(\d+):(\d+)\s+(AM|PM)/i);
       if (match) {
         let h = parseInt(match[1], 10);
         const m = parseInt(match[2], 10);
         const ampm = match[3].toUpperCase();
         if (ampm === 'PM' && h !== 12) h += 12;
         if (ampm === 'AM' && h === 12) h = 0;
         const slotMinutes = h * 60 + m;
         const currentMinutes = serverNow.getHours() * 60 + serverNow.getMinutes();
         if (slotMinutes <= currentMinutes) {
           return res.status(400).json({
             success: false,
             error: { code: 'INVALID_TIME_SLOT', message: 'This time slot has already passed in IST time. Please select an upcoming slot.' }
           });
         }
       }
    }

    // 6. Execute in transaction to prevent race conditions and duplicate bookings
    const newBooking = await prisma.$transaction(async (tx) => {
      // Check for slot conflict
      const nextDay = new Date(bookingDay);
      nextDay.setDate(nextDay.getDate() + 1);

      const conflict = await tx.homeNursingBooking.findFirst({
        where: {
          hospitalId,
          serviceDate: {
            gte: bookingDay,
            lt: nextDay,
          },
          timeSlot,
          nurseId: nurseId || undefined,
          status: { notIn: ['CANCELLED'] },
        },
      });

      if (conflict) {
        throw new Error('SLOT_CONFLICT: The selected time slot is already booked. Please choose another slot.');
      }

      return await tx.homeNursingBooking.create({
        data: {
          bookingNumber,
          userId,
          hospitalId,
          serviceId,
          nurseId: nurseId || null,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          patientEmail: patientEmail ? patientEmail.trim() : null,
          patientAge: patientAge ? Number(patientAge) : null,
          patientGender: patientGender || null,
          serviceDate: bookingDay,
          timeSlot,
          duration: offering.duration || service.duration,
          address: address.trim(),
          city: city ? city.trim() : hospital.city || null,
          pincode: pincode ? pincode.trim() : null,
          notes: notes ? notes.trim() : null,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod,
          totalAmount: trustedTotalAmount,
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    // Fire notification to patient
    const displayDate = new Date(newBooking.serviceDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    sendNotification({
      hospitalId: null, // Patient notification
      userId: userId,
      title: 'Booking Confirmed',
      message: `Your Home Nursing service (${service.name}) is confirmed for ${displayDate} at ${newBooking.timeSlot}.`,
      type: 'BOOKING_CONFIRMED',
      metadata: { bookingId: newBooking.id, type: 'HOME_NURSING' }
    }).catch(console.error);

    // Fire notification to hospital
    sendNotification({
      hospitalId: newBooking.hospitalId,
      userId: newBooking.nurseId,
      title: 'New Home Nursing Booking',
      message: `Patient ${newBooking.patientName} booked ${service.name} for ${displayDate} at ${newBooking.timeSlot}.`,
      type: 'activity',
      metadata: { bookingId: newBooking.id, type: 'HOME_NURSING' }
    }).catch(console.error);

    res.status(201).json({
      success: true,
      data: {
        id: newBooking.id,
        bookingNumber: newBooking.bookingNumber,
        serviceName: service.name,
        hospitalName: hospital.name,
        date: newBooking.serviceDate.toISOString().split('T')[0],
        timeSlot: newBooking.timeSlot,
        duration: newBooking.duration,
        patientName: newBooking.patientName,
        address: newBooking.address,
        totalAmount: newBooking.totalAmount,
        status: newBooking.status,
        paymentStatus: newBooking.paymentStatus,
        createdAt: newBooking.createdAt,
      },
    });
  } catch (error: any) {
    if (error.message?.startsWith('SLOT_CONFLICT')) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: error.message.replace('SLOT_CONFLICT: ', '') },
      });
    }
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/bookings/my
 * Returns authenticated user's home nursing bookings.
 */
export const getMyNursingBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const bookings = await prisma.homeNursingBooking.findMany({
      where: { userId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            duration: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Populate hospital names and nurse names
    const hospitalIds = Array.from(new Set(bookings.map((b) => b.hospitalId)));
    const hospitals = await prisma.hospital.findMany({
      where: { id: { in: hospitalIds } },
      select: { id: true, name: true, city: true, addressLine1: true, contactPhone: true },
    });
    const hospitalMap = new Map(hospitals.map((h) => [h.id, h]));

    const nurseIds = bookings.map((b) => b.nurseId).filter(Boolean) as string[];
    const nurses = nurseIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: nurseIds } },
          select: { id: true, name: true, designation: true },
        })
      : [];
    const nurseMap = new Map(nurses.map((n) => [n.id, n]));

    const result = bookings.map((b) => {
      const h = hospitalMap.get(b.hospitalId);
      const n = b.nurseId ? nurseMap.get(b.nurseId) : null;
      return {
        id: b.id,
        bookingNumber: b.bookingNumber,
        serviceId: b.serviceId,
        serviceName: b.service.name,
        serviceCategory: b.service.category,
        hospitalId: b.hospitalId,
        hospitalName: h?.name || 'Registered Hospital',
        hospitalLocation: h?.city || 'Hyderabad',
        hospitalPhone: h?.contactPhone || '',
        nurseName: n ? n.name : 'Assigned Nurse',
        nurseDesignation: n ? n.designation : 'Certified Healthcare Nurse',
        patientName: b.patientName,
        patientPhone: b.patientPhone,
        patientEmail: b.patientEmail,
        patientAge: b.patientAge,
        patientGender: b.patientGender,
        date: b.serviceDate.toISOString().split('T')[0],
        timeSlot: b.timeSlot,
        duration: b.duration || b.service.duration,
        address: b.address,
        notes: b.notes,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        totalAmount: b.totalAmount,
        amount: `₹${b.totalAmount.toLocaleString('en-IN')}`,
        createdAt: b.createdAt.toISOString(),
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/bookings/:id
 * Returns single booking details; enforces strict user ownership.
 */
export const getNursingBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string;

    const booking = await prisma.homeNursingBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }],
      },
      include: {
        service: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Home nursing booking not found' },
      });
    }

    // Enforce ownership: user must be the booking creator unless SUPER_ADMIN
    if (booking.userId !== userId && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this booking' },
      });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: booking.hospitalId },
      select: { id: true, name: true, city: true, area: true, addressLine1: true, contactPhone: true, logoUrl: true },
    });

    const nurse = booking.nurseId
      ? await prisma.user.findUnique({
          where: { id: booking.nurseId },
          select: { id: true, name: true, designation: true, phone: true },
        })
      : null;

    res.json({
      success: true,
      data: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        serviceId: booking.serviceId,
        serviceName: booking.service.name,
        serviceDescription: booking.service.description,
        serviceCategory: booking.service.category,
        requirements: booking.service.requirements,
        hospitalId: booking.hospitalId,
        hospitalName: hospital?.name || 'Registered Hospital',
        hospitalAddress: hospital?.addressLine1 || '',
        hospitalLocation: [hospital?.area, hospital?.city].filter(Boolean).join(', ') || 'Hyderabad',
        hospitalPhone: hospital?.contactPhone || '',
        nurseName: nurse ? nurse.name : 'Assigned Nurse',
        nurseDesignation: nurse ? nurse.designation : 'Certified Healthcare Nurse',
        nursePhone: nurse?.phone || hospital?.contactPhone || '',
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        patientEmail: booking.patientEmail,
        patientAge: booking.patientAge,
        patientGender: booking.patientGender,
        date: booking.serviceDate.toISOString().split('T')[0],
        timeSlot: booking.timeSlot,
        duration: booking.duration || booking.service.duration,
        address: booking.address,
        city: booking.city,
        pincode: booking.pincode,
        notes: booking.notes,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        totalAmount: booking.totalAmount,
        amount: `₹${booking.totalAmount.toLocaleString('en-IN')}`,
        createdAt: booking.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/home-nursing/bookings/:id/cancel
 * Cancels booking if owned by user and in cancellable state.
 */
export const cancelNursingBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string;

    const booking = await prisma.homeNursingBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }],
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' },
      });
    }

    if (booking.userId !== userId && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You cannot cancel another user\'s booking' },
      });
    }

    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_CANCEL', message: `Booking in ${booking.status} state cannot be cancelled` },
      });
    }

    const updated = await prisma.homeNursingBooking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        bookingNumber: updated.bookingNumber,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        message: 'Home nursing booking has been cancelled successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/nurse/dashboard
 * Authenticated endpoint for nurses to get their dashboard data (stats, next visit, today's visits).
 */
export const getNurseDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nurseId = req.user?.id;
    if (!nurseId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    // Nurse profile
    const nurse = await prisma.user.findUnique({
      where: { id: nurseId },
      include: { hospital: true },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Nurse not found' },
      });
    }

    // Find all bookings assigned to this nurse
    const allAssigned = await prisma.homeNursingBooking.findMany({
      where: { nurseId },
      include: {
        service: true,
        hospital: true,
      },
      orderBy: [
        { serviceDate: 'asc' },
        { timeSlot: 'asc' },
      ],
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Helper to check if a date is today
    const isToday = (d: Date) => {
      const date = new Date(d);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    };

    // Calculate real stats from DB
    const visitsTodayList = allAssigned.filter(b => isToday(b.serviceDate) && b.status !== 'CANCELLED');
    const visitsToday = visitsTodayList.length;
    const inProgressList = allAssigned.filter(b => b.status === 'IN_PROGRESS');
    const inProgress = inProgressList.length;
    const completedList = allAssigned.filter(b => b.status === 'COMPLETED');
    const completed = completedList.length;
    
    // Upcoming: future visits (or today not yet completed/cancelled)
    const upcomingList = allAssigned.filter(b => 
      (new Date(b.serviceDate) >= startOfToday) && 
      ['CONFIRMED', 'ASSIGNED'].includes(b.status)
    );
    const upcoming = upcomingList.length;

    // Determine Next Visit
    // Priority: 1. Any currently in progress visit; 2. Earliest assigned visit today/upcoming
    let nextBooking: any = inProgressList[0] || upcomingList[0] || null;
    if (!nextBooking && visitsTodayList.length > 0) {
      nextBooking = visitsTodayList.find(b => b.status !== 'CANCELLED') || null;
    }

    const formatVisit = (b: any) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      name: b.patientName,
      patientPhone: b.patientPhone,
      patientEmail: b.patientEmail,
      service: b.service?.name || 'Home Nursing',
      serviceCategory: b.service?.category,
      time: b.timeSlot,
      date: b.serviceDate.toISOString().split('T')[0],
      address: b.address,
      city: b.city,
      pincode: b.pincode,
      notes: b.notes,
      status: b.status === 'IN_PROGRESS' ? 'In Progress' : b.status === 'COMPLETED' ? 'Completed' : 'Upcoming',
      rawStatus: b.status,
      duration: b.duration || b.service?.duration || 'Per Visit',
      totalAmount: b.totalAmount,
      distance: b.city ? `${b.city}` : 'Patient Home',
    });

    const formattedNextVisit = nextBooking ? formatVisit(nextBooking) : null;
    const formattedTodayVisits = visitsTodayList.map(formatVisit);

    res.json({
      success: true,
      data: {
        nurse: {
          id: nurse.id,
          name: nurse.name,
          email: nurse.email,
          hospitalName: nurse.hospital?.name || 'MediQuee Partner Hospital',
        },
        stats: {
          visitsToday,
          upcoming,
          inProgress,
          completed,
        },
        nextVisit: formattedNextVisit,
        todayVisits: formattedTodayVisits,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/nurse/visits
 * Fetches all visits for the nurse separated by upcoming and history tabs.
 */
export const getNurseVisits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nurseId = req.user?.id;
    if (!nurseId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { search, date } = req.query;

    const where: any = { nurseId };
    if (date && typeof date === 'string') {
      const [y, m, d] = date.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      where.serviceDate = { gte: start, lte: end };
    }

    const bookings = await prisma.homeNursingBooking.findMany({
      where,
      include: {
        service: true,
        hospital: true,
      },
      orderBy: [
        { serviceDate: 'asc' },
        { timeSlot: 'asc' },
      ],
    });

    const formatVisit = (b: any) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      name: b.patientName,
      patientPhone: b.patientPhone,
      patientEmail: b.patientEmail,
      service: b.service?.name || 'Home Nursing',
      serviceCategory: b.service?.category,
      time: b.timeSlot,
      date: b.serviceDate.toISOString().split('T')[0],
      address: b.address,
      city: b.city,
      pincode: b.pincode,
      notes: b.notes,
      status: b.status === 'IN_PROGRESS' ? 'In Progress' : b.status === 'COMPLETED' ? 'Completed' : b.status === 'CANCELLED' ? 'Cancelled' : 'Upcoming',
      rawStatus: b.status,
      duration: b.duration || b.service?.duration || 'Per Visit',
      totalAmount: b.totalAmount,
      distance: b.city ? `${b.city}` : 'Patient Home',
    });

    const formatted = bookings.map(formatVisit);

    // Apply search if provided
    const filtered = (search && typeof search === 'string' && search.trim())
      ? formatted.filter(v => 
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.service.toLowerCase().includes(search.toLowerCase()) ||
          v.address.toLowerCase().includes(search.toLowerCase())
        )
      : formatted;

    const upcoming = filtered.filter(v => ['Upcoming', 'In Progress', 'Assigned'].includes(v.status));
    const history = filtered.filter(v => ['Completed', 'Cancelled'].includes(v.status));

    res.json({
      success: true,
      data: {
        upcoming,
        history,
        all: filtered,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/home-nursing/nurse/visits/:id/status
 * Updates the visit status (e.g. IN_PROGRESS when nurse reaches home, COMPLETED when done).
 */
export const updateNurseVisitStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nurseId = req.user?.id;
    const id = req.params.id as string;
    const { status, notes } = req.body;

    if (!nurseId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!['IN_PROGRESS', 'COMPLETED', 'ASSIGNED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be IN_PROGRESS, COMPLETED, or ASSIGNED' },
      });
    }

    const booking = await prisma.homeNursingBooking.findFirst({
      where: {
        OR: [{ id: String(id) }, { bookingNumber: String(id) }],
      },
      include: {
        service: true,
        hospital: true,
        nurse: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Visit booking not found' },
      });
    }

    // Verify permission: nurse assigned or hospital admin
    if (booking.nurseId !== nurseId && req.user?.role !== Role.HOSPITAL_ADMIN && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not assigned to this home nursing visit' },
      });
    }

    const updated = await prisma.homeNursingBooking.update({
      where: { id: booking.id },
      data: {
        status,
        notes: notes ? (booking.notes ? `${booking.notes}\n${notes}` : notes) : booking.notes,
      },
      include: {
        service: true,
        hospital: true,
        nurse: true,
      },
    });

    // Send Real-Time Notifications
    const nurseName = updated.nurse?.name || 'Assigned Nurse';
    if (status === 'IN_PROGRESS') {
      // Notify patient
      await sendNotification({
        userId: updated.userId,
        hospitalId: updated.hospitalId,
        title: 'Nurse Reached - Service In Progress',
        message: `${nurseName} has arrived and started the ${updated.service.name} service.`,
        type: 'appointment',
        metadata: { bookingId: updated.id, status: 'IN_PROGRESS' },
      });
    } else if (status === 'COMPLETED') {
      // Notify patient that service is completed & request feedback
      await sendNotification({
        userId: updated.userId,
        hospitalId: updated.hospitalId,
        title: 'Home Nursing Service Completed',
        message: `Your ${updated.service.name} service with ${nurseName} has been completed successfully. We value your feedback!`,
        type: 'appointment',
        metadata: { bookingId: updated.id, status: 'COMPLETED' },
      });

      // Notify hospital
      await sendNotification({
        hospitalId: updated.hospitalId,
        title: 'Home Nursing Service Finished',
        message: `${nurseName} has successfully completed ${updated.service.name} for ${updated.patientName}.`,
        type: 'appointment',
        metadata: { bookingId: updated.id, status: 'COMPLETED' },
      });
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        bookingNumber: updated.bookingNumber,
        status: updated.status,
        patientName: updated.patientName,
        message: `Visit marked as ${status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/hospital/bookings
 * Authenticated endpoint for hospital to list all home nursing bookings and assign nurses.
 */
export const getHospitalNursingBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Hospital staff authentication required' },
      });
    }

    const { status, date, search } = req.query;
    const where: any = {};
    if (hospitalId) where.hospitalId = hospitalId;

    if (status && typeof status === 'string' && status !== 'ALL') {
      if (status === 'PENDING_ASSIGNMENT') {
        where.nurseId = null;
        where.status = { notIn: ['CANCELLED'] };
      } else {
        where.status = status;
      }
    }

    if (date && typeof date === 'string' && date !== 'all' && date !== 'upcoming') {
      const [y, m, d] = date.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      where.serviceDate = { gte: start, lte: end };
    } else if (date === 'upcoming') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      where.serviceDate = { gte: startOfToday };
      where.status = { notIn: ['CANCELLED', 'COMPLETED'] };
    }

    const bookings = await prisma.homeNursingBooking.findMany({
      where,
      include: {
        service: true,
        nurse: {
          select: { id: true, name: true, phone: true, email: true, avatar: true },
        },
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      orderBy: [
        { serviceDate: 'asc' },
        { timeSlot: 'asc' },
      ],
    });

    const mapped = bookings.map(b => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      mqId: `HN-${b.bookingNumber.split('-').slice(-2).join('-')}`,
      patientName: b.patientName,
      patientPhone: b.patientPhone,
      patientEmail: b.patientEmail,
      serviceName: b.service.name,
      serviceCategory: b.service.category,
      serviceDate: b.serviceDate.toISOString().split('T')[0],
      timeSlot: b.timeSlot,
      duration: b.duration,
      address: b.address,
      city: b.city,
      status: b.status,
      paymentStatus: b.paymentStatus,
      totalAmount: b.totalAmount,
      nurseId: b.nurseId,
      nurse: b.nurse,
      notes: b.notes,
      createdAt: b.createdAt,
    }));

    // Apply search if provided
    const filtered = (search && typeof search === 'string' && search.trim())
      ? mapped.filter(b => 
          b.patientName.toLowerCase().includes(search.toLowerCase()) ||
          b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
          b.serviceName.toLowerCase().includes(search.toLowerCase()) ||
          (b.nurse?.name && b.nurse.name.toLowerCase().includes(search.toLowerCase()))
        )
      : mapped;

    res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/home-nursing/hospital/bookings/:id/assign
 * Hospital accepts/arranges nurse: Assigns an active hospital nurse to the booking.
 */
export const assignNurseToBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const id = req.params.id as string;
    const { nurseId } = req.body;

    if (!hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Hospital staff authentication required' },
      });
    }

    if (!nurseId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'nurseId is required to assign a nurse' },
      });
    }

    // Validate nurse belongs to hospital and has NURSE role
    const nurse = await prisma.user.findFirst({
      where: {
        id: nurseId,
        ...(hospitalId ? { hospitalId } : {}),
        role: Role.NURSE,
        active: true,
      },
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Selected nurse not found or inactive in this hospital' },
      });
    }

    const booking = await prisma.homeNursingBooking.findFirst({
      where: {
        OR: [{ id: String(id) }, { bookingNumber: String(id) }],
        ...(hospitalId ? { hospitalId } : {}),
      },
      include: {
        service: true,
        hospital: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Home nursing booking not found' },
      });
    }

    const updated = await prisma.homeNursingBooking.update({
      where: { id: booking.id },
      data: {
        nurseId: nurse.id,
        status: 'ASSIGNED',
      },
      include: {
        service: true,
        nurse: true,
        hospital: true,
      },
    });

    // Notify Nurse
    await sendNotification({
      userId: nurse.id,
      hospitalId: updated.hospitalId,
      title: 'New Home Visit Assigned',
      message: `You have been assigned to ${updated.service.name} for ${updated.patientName} on ${updated.serviceDate.toISOString().split('T')[0]} (${updated.timeSlot}).`,
      type: 'appointment',
      metadata: { bookingId: updated.id, nurseId: nurse.id },
    });

    // Notify Patient
    await sendNotification({
      userId: updated.userId,
      hospitalId: updated.hospitalId,
      title: 'Nurse Assigned to Your Booking',
      message: `${nurse.name} has been assigned for your ${updated.service.name} on ${updated.serviceDate.toISOString().split('T')[0]}. Contact: ${nurse.phone || 'Available via App'}.`,
      type: 'appointment',
      metadata: { bookingId: updated.id, nurseId: nurse.id },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        bookingNumber: updated.bookingNumber,
        status: updated.status,
        nurse: {
          id: nurse.id,
          name: nurse.name,
          phone: nurse.phone,
          email: nurse.email,
        },
        message: `Nurse ${nurse.name} assigned successfully.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/home-nursing/hospital/nurses
 * List all active nurses belonging to the hospital.
 */
export const getHospitalNursesList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Hospital staff authentication required' },
      });
    }

    const nurses = await prisma.user.findMany({
      where: {
        ...(hospitalId ? { hospitalId } : {}),
        role: Role.NURSE,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        qualification: true,
        specialization: true,
        experienceYears: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: nurses,
    });
  } catch (error) {
    next(error);
  }
};
