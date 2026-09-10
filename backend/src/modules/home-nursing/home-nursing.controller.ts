import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

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

    const slots = standardSlots.map((slot) => ({
      slot,
      available: !bookedSlotsSet.has(slot),
    }));

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
    });

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
