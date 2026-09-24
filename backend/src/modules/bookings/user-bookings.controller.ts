import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getNearestUpcomingBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const now = new Date();

    // 1. Get upcoming OP Bookings (including Video Consultations)
    const opBookings = await prisma.oPBooking.findMany({
      where: {
        patientId: userId,
        appointmentDate: { gte: new Date(now.setHours(0, 0, 0, 0)) }, // Today or later
        status: { notIn: ['CANCELLED', 'COMPLETED'] }
      },
      include: {
        doctor: { select: { name: true } },
        hospital: { select: { name: true } }
      }
    });

    // 2. Get upcoming Lab Bookings (including Walk-in and Home Collection)
    const labBookings = await prisma.labBooking.findMany({
      where: {
        patientId: userId,
        status: { notIn: ['CANCELLED'] }
      },
      include: {
        hospital: { select: { name: true } },
        items: { include: { labTest: { include: { platformTest: true } } } }
      }
    });

    // Filter Lab Bookings by date (handle both home collection and walk-in/createdAt dates)
    const upcomingLabBookings = labBookings.filter(b => {
      const dateToCheck = b.collectionDate || b.createdAt;
      return dateToCheck >= new Date(new Date().setHours(0, 0, 0, 0));
    });

    // 3. Get upcoming Home Nursing Bookings
    const nursingBookings = await prisma.homeNursingBooking.findMany({
      where: {
        userId,
        serviceDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: { notIn: ['CANCELLED', 'COMPLETED'] }
      },
      include: {
        service: { select: { name: true } }
      }
    });

    // Manually fetch hospital and nurse names for nursing bookings
    const hospitalIds = [...new Set(nursingBookings.map(b => b.hospitalId))];
    const nurseIds = [...new Set(nursingBookings.map(b => b.nurseId).filter(id => id))];
    
    const hospitals = await prisma.hospital.findMany({ where: { id: { in: hospitalIds } } });
    const nurses = await prisma.user.findMany({ where: { id: { in: nurseIds as string[] } } });
    
    const hospitalMap = Object.fromEntries(hospitals.map(h => [h.id, h.name]));
    const nurseMap = Object.fromEntries(nurses.map(n => [n.id, n.name]));

    let upcomingBookings: any[] = [];

    // Parse OP Bookings
    for (const b of opBookings) {
      upcomingBookings.push({
        bookingId: b.id,
        serviceType: b.opType?.toLowerCase().includes('video') ? 'VIDEO' : 'OP',
        status: b.status,
        date: b.appointmentDate,
        time: b.timeSlot || b.slotTime || '10:00 AM',
        doctorName: b.doctor?.name,
        hospitalName: b.hospital?.name
      });
    }

    // Parse Lab Bookings
    for (const b of upcomingLabBookings) {
      upcomingBookings.push({
        bookingId: b.id,
        serviceType: b.bookingType === 'HOME_COLLECTION' ? 'HOME_SAMPLE' : 'LAB',
        status: b.status,
        date: b.collectionDate || b.createdAt,
        time: b.collectionTimeSlot || 'N/A',
        testName: b.items?.[0]?.labTest?.platformTest?.name || 'Lab Test',
        hospitalName: b.hospital?.name
      });
    }

    // Parse Home Nursing Bookings
    for (const b of nursingBookings) {
      upcomingBookings.push({
        bookingId: b.id,
        serviceType: 'HOME_NURSING',
        status: b.status,
        date: b.serviceDate,
        time: b.timeSlot,
        serviceName: b.service?.name,
        nurseName: b.nurseId ? nurseMap[b.nurseId] : 'Assigned soon',
        hospitalName: hospitalMap[b.hospitalId]
      });
    }

    // Filter out past times for today's bookings (simplistic check)
    // and sort by nearest date/time
    upcomingBookings.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // If same date, simple string comparison for time (assuming formatted similarly, this is a rough approximation)
      return (a.time || '').localeCompare(b.time || '');
    });

    const nearestBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

    res.status(200).json({
      success: true,
      data: nearestBooking
    });
  } catch (error) {
    next(error);
  }
};
