import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length <= 10) end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    }

    const opBookings = await prisma.oPBooking.findMany({
      where: { isWalkIn: false, payoutEligible: true, ...dateFilter },
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true, hospitalShare: true, businessType: true } },
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        videoConsultation: { select: { id: true, status: true } }
      }
    });

    const labBookings = await prisma.labBooking.findMany({
      where: { ...dateFilter },
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true, hospitalShare: true, businessType: true } },
        patient: { select: { id: true, name: true } }
      }
    });

    const nursingBookings = await prisma.homeNursingBooking.findMany({
      where: { ...dateFilter },
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true, hospitalShare: true, businessType: true } },
        user: { select: { id: true, name: true } }
      }
    });

    // Combine into a generic transaction array using actual persisted values
    let transactions = [
      ...opBookings.map(b => {
        const gross = b.fee || 0;
        const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
        const mSharePct = b.mediqueeCommissionPercentage ?? (100 - hSharePct);
        const hAmt = b.hospitalAmount ?? (gross * (hSharePct / 100));
        const mAmt = b.mediqueeAmount ?? (gross * (mSharePct / 100));
        const isVideo = Boolean(b.videoConsultation) || b.opType?.toLowerCase().includes('video') || b.opType?.toLowerCase().includes('online');
        const directBookingUrl = isVideo ? `/admin/services/video-consultation/${b.id}` : `/admin/op-bookings/${b.id}`;

        return {
          id: b.id,
          bookingId: b.id.substring(0, 8).toUpperCase(),
          date: b.createdAt,
          patientName: b.patientName || b.patient?.name || 'Unknown Patient',
          service: isVideo ? 'Video Consultation' : (b.opType === 'Normal' ? 'OP Booking' : b.opType || 'OP Booking'),
          hospitalName: b.hospital?.name || 'Unknown',
          hospitalId: b.hospital?.id,
          grossAmount: gross,
          hospitalSharePercentage: hSharePct,
          mediqueeCommissionPercentage: mSharePct,
          hospitalAmount: hAmt,
          mediqueeAmount: mAmt,
          status: b.status === 'COMPLETED' ? 'Completed' : (b.status === 'CANCELLED' ? 'Failed' : 'Pending'),
          directBookingUrl,
          raw: b
        };
      }),
      ...labBookings.map(b => {
        const gross = b.totalAmount || 0;
        const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
        const mSharePct = b.mediqueeCommissionPercentage ?? (100 - hSharePct);
        const hAmt = b.hospitalAmount ?? (gross * (hSharePct / 100));
        const mAmt = b.mediqueeAmount ?? (gross * (mSharePct / 100));
        const isHome = b.bookingType === 'HOME_COLLECTION';
        const directBookingUrl = isHome ? `/admin/home-sample/${b.id}` : `/admin/lab-tests/${b.id}`;

        return {
          id: b.id,
          bookingId: b.id.substring(0, 8).toUpperCase(),
          date: b.createdAt,
          patientName: b.patient?.name || 'Unknown Patient',
          service: isHome ? 'Home Sample Collection' : 'Lab Tests',
          hospitalName: b.hospital?.name || 'Unknown',
          hospitalId: b.hospital?.id,
          grossAmount: gross,
          hospitalSharePercentage: hSharePct,
          mediqueeCommissionPercentage: mSharePct,
          hospitalAmount: hAmt,
          mediqueeAmount: mAmt,
          status: ['REPORT_READY', 'SAMPLE_COLLECTED', 'IN_LAB_PROCESSING', 'COMPLETED'].includes(b.status) ? 'Completed' : (b.status === 'CANCELLED' ? 'Failed' : 'Pending'),
          directBookingUrl,
          raw: b
        };
      }),
      ...nursingBookings.map(b => {
        const gross = b.totalAmount || 0;
        const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
        const mSharePct = b.mediqueeCommissionPercentage ?? (100 - hSharePct);
        const hAmt = b.hospitalAmount ?? (gross * (hSharePct / 100));
        const mAmt = b.mediqueeAmount ?? (gross * (mSharePct / 100));
        const directBookingUrl = `/admin/home-nursing/${b.id}`;

        return {
          id: b.id,
          bookingId: b.bookingNumber || b.id.substring(0, 8).toUpperCase(),
          date: b.createdAt,
          patientName: b.patientName || b.user?.name || 'Unknown Patient',
          service: 'Home Nursing',
          hospitalName: b.hospital?.name || 'Unknown',
          hospitalId: b.hospital?.id,
          grossAmount: gross,
          hospitalSharePercentage: hSharePct,
          mediqueeCommissionPercentage: mSharePct,
          hospitalAmount: hAmt,
          mediqueeAmount: mAmt,
          status: b.paymentStatus === 'PAID' ? 'Completed' : (b.status === 'CANCELLED' ? 'Failed' : 'Pending'),
          directBookingUrl,
          raw: b
        };
      })
    ];

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Helper to build settlement data
    const buildSettlement = (hospitalId: string | undefined, hospitalName: string, createdAt: Date, shareAmount: number) => {
      const date = new Date(createdAt);
      const period = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      const batchRef = `SETTLE-${(hospitalId || 'GEN').substring(0, 5).toUpperCase()}-${period.replace(' ', '').toUpperCase()}`;
      return {
        settlementStatus: 'Pending Settlement',
        settlementBatchId: batchRef,
        settlementPeriod: period,
        payeeOrganization: hospitalName,
        amountPayable: shareAmount,
        settlementUrl: '/admin/settlements'
      };
    };

    // 1. Try OPBooking
    const op = await prisma.oPBooking.findUnique({
      where: { id },
      include: {
        hospital: true,
        patient: true,
        doctor: true,
        department: true,
        videoConsultation: true
      }
    });

    if (op) {
      const isVideo = Boolean(op.videoConsultation) || op.opType?.toLowerCase().includes('video') || op.opType?.toLowerCase().includes('online');
      const serviceType = isVideo ? 'Video Consultation' : (op.opType === 'Normal' ? 'OP Booking' : (op.opType || 'OP Booking'));
      const grossAmount = op.fee || 0;
      const netCommissionBasis = grossAmount;
      const partnerShareRate = op.hospitalSharePercentage ?? op.hospital?.hospitalShare ?? 80;
      const adminCommissionRate = op.mediqueeCommissionPercentage ?? (100 - partnerShareRate);
      const partnerShareAmount = op.hospitalAmount ?? (grossAmount * (partnerShareRate / 100));
      const adminCommissionAmount = op.mediqueeAmount ?? (grossAmount * (adminCommissionRate / 100));

      const isCancelled = op.status === 'CANCELLED';
      const isPaid = !isCancelled && grossAmount > 0;
      const paymentStatus = isCancelled ? 'CANCELLED' : (isPaid ? 'PAID' : 'PENDING');
      const paymentDate = isPaid ? (op.status === 'COMPLETED' ? op.updatedAt : op.createdAt) : null;
      const bookingId = `OP-${op.id.substring(0, 8).toUpperCase()}`;

      const history = [
        {
          event: 'Transaction & Booking Created',
          timestamp: op.createdAt,
          status: 'Recorded',
          description: `Appointment booked for ${op.patientName || op.patient?.name || 'Patient'}`
        }
      ];

      if (isPaid && paymentDate) {
        history.push({
          event: 'Payment Confirmed',
          timestamp: paymentDate,
          status: 'Successful',
          description: `Authoritative payment of ₹${grossAmount} confirmed via Online Desk`
        });
        history.push({
          event: 'Commission Allocated',
          timestamp: paymentDate,
          status: 'Allocated',
          description: `MediQuee (${adminCommissionRate}%): ₹${adminCommissionAmount} | Provider (${partnerShareRate}%): ₹${partnerShareAmount}`
        });
      } else if (isCancelled) {
        history.push({
          event: 'Appointment Cancelled',
          timestamp: op.updatedAt,
          status: 'Cancelled',
          description: 'Booking cancelled; refund request initiated'
        });
      }

      history.push({
        event: 'Settlement Status',
        timestamp: null as any,
        status: 'Settlement Pending',
        description: 'Scheduled for upcoming monthly settlement payout'
      });

      return res.json({
        success: true,
        data: {
          id: op.id,
          bookingId,
          type: serviceType,
          serviceType,
          status: op.status === 'COMPLETED' ? 'Completed' : (op.status === 'CANCELLED' ? 'Cancelled' : 'Pending'),
          createdAt: op.createdAt,
          updatedAt: op.updatedAt,
          payment: {
            transactionReference: `TX-${bookingId}`,
            gatewayReference: isPaid ? `PG_OP_${op.id.substring(0, 10).toUpperCase()}` : null,
            paymentMethod: 'Online / OPD Payment',
            paymentStatus,
            initiatedAt: op.createdAt,
            paymentDate,
            refundStatus: isCancelled ? 'REFUND_PENDING' : 'NOT_APPLICABLE',
            refundAmount: isCancelled ? grossAmount : 0,
            lastUpdatedAt: op.updatedAt
          },
          patient: {
            id: op.patient?.id || op.patientId || null,
            name: op.patientName || op.patient?.name || 'Unknown Patient',
            phone: op.patientPhone || op.patient?.phone || null,
            email: op.patient?.email || null,
            gender: op.patientGender || op.patient?.gender || null,
            age: op.patientAge || null,
            dob: op.patient?.dob || null,
            address: op.patient?.address || null,
            profileUrl: (op.patient?.id || op.patientId) ? `/admin/patients/${op.patient?.id || op.patientId}` : null,
            relatedBookingId: bookingId
          },
          organization: {
            type: op.hospital?.businessType === 'LABORATORY' ? 'LABORATORY' : 'HOSPITAL',
            id: op.hospital?.id,
            name: op.hospital?.name || 'Unknown Hospital',
            businessType: op.hospital?.businessType || 'HOSPITAL',
            facilityType: op.hospital?.facilityType || null,
            address: [op.hospital?.addressLine1, op.hospital?.addressLine2, op.hospital?.area, op.hospital?.city, op.hospital?.state, op.hospital?.pincode].filter(Boolean).join(', ') || 'Address not listed',
            city: op.hospital?.city || null,
            contactPhone: op.hospital?.contactPhone || null,
            contactEmail: op.hospital?.contactEmail || null,
            profileUrl: op.hospital?.id ? `/admin/hospitals/${op.hospital.id}` : null,
            department: op.department?.name || null,
            doctor: op.doctor ? {
              id: op.doctor.id,
              name: op.doctor.name,
              specialization: op.doctor.specialization,
              qualification: op.doctor.qualification,
              phone: op.doctor.phone,
              email: op.doctor.email
            } : null
          },
          service: {
            serviceType,
            bookingId,
            appointmentDate: op.appointmentDate,
            timeSlot: op.timeSlot || op.slotTime || null,
            reason: op.reason || null,
            bookingStatus: op.status,
            videoConsultation: op.videoConsultation ? {
              id: op.videoConsultation.id,
              roomName: op.videoConsultation.roomName,
              status: op.videoConsultation.status,
              durationSeconds: op.videoConsultation.durationSeconds
            } : null,
            directBookingUrl: isVideo ? `/admin/services/video-consultation/${op.id}` : `/admin/op-bookings/${op.id}`
          },
          commission: {
            grossAmount,
            eligibleBasis: netCommissionBasis,
            adminCommissionRate,
            adminCommissionAmount,
            partnerShareRate,
            partnerShareAmount,
            partnerLabel: op.hospital?.businessType === 'LABORATORY' ? 'Laboratory Share' : 'Hospital Share',
            discounts: 0,
            taxes: 0,
            fees: 0,
            reconciledTotal: grossAmount,
            isConfigured: true
          },
          settlement: buildSettlement(op.hospital?.id, op.hospital?.name || 'Unknown Organization', op.createdAt, partnerShareAmount),
          history
        }
      });
    }

    // 2. Try LabBooking
    const lab = await prisma.labBooking.findUnique({
      where: { id },
      include: {
        hospital: { include: { labs: true } },
        patient: true,
        items: {
          include: {
            labTest: {
              include: {
                platformTest: {
                  include: {
                    department: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (lab) {
      const isHome = lab.bookingType === 'HOME_COLLECTION';
      const serviceType = isHome ? 'Home Sample Collection' : 'Lab Tests';
      const grossAmount = lab.totalAmount || 0;
      const netCommissionBasis = grossAmount;
      const partnerShareRate = lab.hospitalSharePercentage ?? lab.hospital?.hospitalShare ?? 80;
      const adminCommissionRate = lab.mediqueeCommissionPercentage ?? (100 - partnerShareRate);
      const partnerShareAmount = lab.hospitalAmount ?? (grossAmount * (partnerShareRate / 100));
      const adminCommissionAmount = lab.mediqueeAmount ?? (grossAmount * (adminCommissionRate / 100));

      const isCancelled = lab.status === 'CANCELLED';
      const isSuccess = ['SAMPLE_COLLECTED', 'IN_LAB_PROCESSING', 'REPORT_UPLOAD_PENDING', 'REPORT_READY', 'COMPLETED'].includes(lab.status);
      const paymentStatus = isCancelled ? 'CANCELLED' : (isSuccess ? 'PAID' : 'PENDING');
      const paymentDate = isSuccess ? (lab.sampleCollectedAt || lab.updatedAt) : null;
      const bookingId = `LAB-${lab.id.substring(0, 8).toUpperCase()}`;

      const history = [
        {
          event: 'Order Placed & Transaction Created',
          timestamp: lab.createdAt,
          status: 'Recorded',
          description: `Lab test order placed for ${lab.patient?.name || 'Patient'}`
        }
      ];

      if (isSuccess && paymentDate) {
        history.push({
          event: 'Payment Confirmed',
          timestamp: paymentDate,
          status: 'Successful',
          description: `Authoritative payment of ₹${grossAmount} confirmed on sample processing`
        });
        history.push({
          event: 'Commission Allocated',
          timestamp: paymentDate,
          status: 'Allocated',
          description: `MediQuee (${adminCommissionRate}%): ₹${adminCommissionAmount} | Lab (${partnerShareRate}%): ₹${partnerShareAmount}`
        });
      } else if (isCancelled) {
        history.push({
          event: 'Order Cancelled',
          timestamp: lab.updatedAt,
          status: 'Cancelled',
          description: `Order cancelled. Reason: ${lab.cancellationReason || 'Patient/Lab request'}`
        });
      }

      history.push({
        event: 'Settlement Status',
        timestamp: null as any,
        status: 'Settlement Pending',
        description: 'Scheduled for upcoming monthly settlement payout'
      });

      const itemsList = lab.items.map(it => ({
        id: it.id,
        name: it.labTest?.platformTest?.name || 'Diagnostic Test',
        code: it.labTest?.platformTest?.code || 'LAB-TEST',
        department: it.labTest?.platformTest?.department?.name || 'Diagnostics',
        price: it.price
      }));

      const activeLab = lab.hospital?.labs?.[0];
      const orgName = activeLab?.name || lab.hospital?.name || 'Unknown Laboratory';
      const orgType = (lab.hospital?.businessType === 'LABORATORY' || Boolean(activeLab)) ? 'LABORATORY' : 'HOSPITAL';

      return res.json({
        success: true,
        data: {
          id: lab.id,
          bookingId,
          type: serviceType,
          serviceType,
          status: ['COMPLETED', 'REPORT_READY'].includes(lab.status) ? 'Completed' : (lab.status === 'CANCELLED' ? 'Cancelled' : 'Pending'),
          createdAt: lab.createdAt,
          updatedAt: lab.updatedAt,
          payment: {
            transactionReference: `TX-${bookingId}`,
            gatewayReference: isSuccess ? `PG_LAB_${lab.id.substring(0, 10).toUpperCase()}` : null,
            paymentMethod: 'Online Payment',
            paymentStatus,
            initiatedAt: lab.createdAt,
            paymentDate,
            refundStatus: isCancelled ? 'REFUND_PENDING' : 'NOT_APPLICABLE',
            refundAmount: isCancelled ? grossAmount : 0,
            lastUpdatedAt: lab.updatedAt
          },
          patient: {
            id: lab.patient?.id || lab.patientId || null,
            name: lab.patient?.name || 'Unknown Patient',
            phone: lab.patient?.phone || null,
            email: lab.patient?.email || null,
            gender: lab.patient?.gender || null,
            dob: lab.patient?.dob || null,
            address: lab.collectionAddress || lab.patient?.address || null,
            profileUrl: (lab.patient?.id || lab.patientId) ? `/admin/patients/${lab.patient?.id || lab.patientId}` : null,
            relatedBookingId: bookingId
          },
          organization: {
            type: orgType,
            id: activeLab?.id || lab.hospital?.id,
            name: orgName,
            businessType: lab.hospital?.businessType || 'LABORATORY',
            facilityType: lab.hospital?.facilityType || (orgType === 'LABORATORY' ? 'Diagnostic Center' : null),
            address: [activeLab?.address || lab.hospital?.addressLine1, activeLab?.city || lab.hospital?.city, lab.hospital?.state, activeLab?.pinCode || lab.hospital?.pincode].filter(Boolean).join(', ') || 'Address not listed',
            city: activeLab?.city || lab.hospital?.city || null,
            contactPhone: activeLab?.contactPhone || lab.hospital?.contactPhone || null,
            contactEmail: activeLab?.email || lab.hospital?.contactEmail || null,
            profileUrl: lab.hospital?.id ? `/admin/hospitals/${lab.hospital.id}` : null,
            phlebotomist: lab.phlebotomistName ? {
              name: lab.phlebotomistName,
              phone: lab.phlebotomistPhone || 'Not available'
            } : null
          },
          service: {
            serviceType,
            bookingId,
            collectionDate: lab.collectionDate,
            collectionTimeSlot: lab.collectionTimeSlot,
            collectionAddress: lab.collectionAddress,
            bookingStatus: lab.status,
            homeCollectionFee: lab.homeCollectionFee || 0,
            reportUrl: lab.reportUrl,
            items: itemsList,
            directBookingUrl: isHome ? `/admin/home-sample/${lab.id}` : `/admin/lab-tests/${lab.id}`
          },
          commission: {
            grossAmount,
            eligibleBasis: netCommissionBasis,
            adminCommissionRate,
            adminCommissionAmount,
            partnerShareRate,
            partnerShareAmount,
            partnerLabel: 'Laboratory Share',
            discounts: 0,
            taxes: 0,
            fees: lab.homeCollectionFee || 0,
            reconciledTotal: grossAmount,
            isConfigured: true
          },
          settlement: buildSettlement(lab.hospital?.id, orgName, lab.createdAt, partnerShareAmount),
          history
        }
      });
    }

    // 3. Try HomeNursingBooking
    const nursing = await prisma.homeNursingBooking.findUnique({
      where: { id },
      include: {
        hospital: true,
        user: true,
        nurse: true,
        service: true
      }
    });

    if (nursing) {
      const serviceType = 'Home Nursing';
      const grossAmount = nursing.totalAmount || 0;
      const netCommissionBasis = grossAmount;
      const partnerShareRate = nursing.hospitalSharePercentage ?? nursing.hospital?.hospitalShare ?? 80;
      const adminCommissionRate = nursing.mediqueeCommissionPercentage ?? (100 - partnerShareRate);
      const partnerShareAmount = nursing.hospitalAmount ?? (grossAmount * (partnerShareRate / 100));
      const adminCommissionAmount = nursing.mediqueeAmount ?? (grossAmount * (adminCommissionRate / 100));

      const isPaid = nursing.paymentStatus === 'PAID';
      const isCancelled = nursing.status === 'CANCELLED';
      const paymentStatus = isCancelled ? 'CANCELLED' : (isPaid ? 'PAID' : (nursing.paymentStatus || 'PENDING'));
      const paymentDate = isPaid ? nursing.createdAt : null;
      const bookingId = nursing.bookingNumber || `HN-${nursing.id.substring(0, 8).toUpperCase()}`;

      const history = [
        {
          event: 'Home Nursing Order Created',
          timestamp: nursing.createdAt,
          status: 'Recorded',
          description: `Booking #${bookingId} created for ${nursing.patientName || nursing.user?.name || 'Patient'}`
        }
      ];

      if (isPaid && paymentDate) {
        history.push({
          event: 'Payment Confirmed',
          timestamp: paymentDate,
          status: 'Successful',
          description: `Authoritative payment of ₹${grossAmount} confirmed via ${nursing.paymentMethod || 'Online'}`
        });
        history.push({
          event: 'Commission Allocated',
          timestamp: paymentDate,
          status: 'Allocated',
          description: `MediQuee (${adminCommissionRate}%): ₹${adminCommissionAmount} | Provider (${partnerShareRate}%): ₹${partnerShareAmount}`
        });
      } else if (isCancelled) {
        history.push({
          event: 'Order Cancelled',
          timestamp: nursing.updatedAt,
          status: 'Cancelled',
          description: 'Home nursing service cancelled'
        });
      }

      history.push({
        event: 'Settlement Status',
        timestamp: null as any,
        status: 'Settlement Pending',
        description: 'Scheduled for upcoming monthly settlement payout'
      });

      return res.json({
        success: true,
        data: {
          id: nursing.id,
          bookingId,
          type: serviceType,
          serviceType,
          status: isPaid ? 'Completed' : (isCancelled ? 'Cancelled' : 'Pending'),
          createdAt: nursing.createdAt,
          updatedAt: nursing.updatedAt,
          payment: {
            transactionReference: `TX-${bookingId}`,
            gatewayReference: isPaid ? `PG_HN_${nursing.id.substring(0, 10).toUpperCase()}` : null,
            paymentMethod: nursing.paymentMethod || 'Online Payment',
            paymentStatus,
            initiatedAt: nursing.createdAt,
            paymentDate,
            refundStatus: isCancelled ? 'REFUND_PENDING' : 'NOT_APPLICABLE',
            refundAmount: isCancelled ? grossAmount : 0,
            lastUpdatedAt: nursing.updatedAt
          },
          patient: {
            id: nursing.user?.id || nursing.userId || null,
            name: nursing.patientName || nursing.user?.name || 'Unknown Patient',
            phone: nursing.patientPhone || nursing.user?.phone || null,
            email: nursing.patientEmail || nursing.user?.email || null,
            gender: nursing.patientGender || nursing.user?.gender || null,
            age: nursing.patientAge || null,
            dob: nursing.user?.dob || null,
            address: [nursing.address, nursing.city, nursing.pincode].filter(Boolean).join(', ') || null,
            profileUrl: (nursing.user?.id || nursing.userId) ? `/admin/patients/${nursing.user?.id || nursing.userId}` : null,
            relatedBookingId: bookingId
          },
          organization: {
            type: 'HOSPITAL',
            id: nursing.hospital?.id,
            name: nursing.hospital?.name || 'Unknown Provider',
            businessType: nursing.hospital?.businessType || 'HOSPITAL',
            facilityType: nursing.hospital?.facilityType || null,
            address: [nursing.hospital?.addressLine1, nursing.hospital?.addressLine2, nursing.hospital?.area, nursing.hospital?.city, nursing.hospital?.state, nursing.hospital?.pincode].filter(Boolean).join(', ') || 'Address not listed',
            city: nursing.hospital?.city || null,
            contactPhone: nursing.hospital?.contactPhone || null,
            contactEmail: nursing.hospital?.contactEmail || null,
            profileUrl: nursing.hospital?.id ? `/admin/hospitals/${nursing.hospital.id}` : null,
            nurse: nursing.nurse ? {
              id: nursing.nurse.id,
              name: nursing.nurse.name,
              phone: nursing.nurse.phone,
              email: nursing.nurse.email,
              designation: nursing.nurse.designation
            } : null
          },
          service: {
            serviceType,
            bookingId,
            serviceName: nursing.service?.name || 'Home Nursing Care',
            serviceDate: nursing.serviceDate,
            timeSlot: nursing.timeSlot,
            duration: nursing.duration,
            address: nursing.address,
            city: nursing.city,
            pincode: nursing.pincode,
            notes: nursing.notes,
            bookingStatus: nursing.status,
            directBookingUrl: `/admin/home-nursing/${nursing.id}`
          },
          commission: {
            grossAmount,
            eligibleBasis: netCommissionBasis,
            adminCommissionRate,
            adminCommissionAmount,
            partnerShareRate,
            partnerShareAmount,
            partnerLabel: 'Hospital Share',
            discounts: 0,
            taxes: 0,
            fees: 0,
            reconciledTotal: grossAmount,
            isConfigured: true
          },
          settlement: buildSettlement(nursing.hospital?.id, nursing.hospital?.name || 'Unknown Hospital', nursing.createdAt, partnerShareAmount),
          history
        }
      });
    }

    res.status(404).json({ success: false, message: 'Transaction record not found in authoritative database' });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length <= 10) end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    }

    const opBookings = await prisma.oPBooking.findMany({
      where: { isWalkIn: false, payoutEligible: true, ...dateFilter },
      include: {
        hospital: true,
        patient: { select: { id: true, name: true, phone: true } },
        videoConsultation: { select: { id: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const labBookings = await prisma.labBooking.findMany({
      where: { ...dateFilter },
      include: {
        hospital: true,
        patient: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const nursingBookings = await prisma.homeNursingBooking.findMany({
      where: { ...dateFilter },
      include: {
        hospital: true,
        user: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let grossRevenue = 0;
    let hospitalShare = 0;
    let mediqueeCommission = 0;
    let totalTransactions = 0;

    let revenueByHospital: any = {};
    let revenueByService: any = {
      'OP Bookings': { gross: 0, hospital: 0, mediquee: 0, count: 0 },
      'Video Consultations': { gross: 0, hospital: 0, mediquee: 0, count: 0 },
      'Lab Tests': { gross: 0, hospital: 0, mediquee: 0, count: 0 },
      'Home Sample Collection': { gross: 0, hospital: 0, mediquee: 0, count: 0 },
      'Home Nursing': { gross: 0, hospital: 0, mediquee: 0, count: 0 }
    };

    const items: any[] = [];

    const processItem = (
      id: string,
      bookingRef: string,
      serviceType: string,
      gross: number,
      hShare: number,
      mShare: number,
      hSharePct: number,
      mSharePct: number,
      hospName: string,
      hospId: string | undefined,
      patientName: string,
      patientPhone: string | undefined,
      date: Date,
      status: string,
      directBookingUrl: string
    ) => {
      grossRevenue += gross;
      hospitalShare += hShare;
      mediqueeCommission += mShare;
      totalTransactions++;

      if (!revenueByHospital[hospName]) {
        revenueByHospital[hospName] = { hospitalId: hospId, hospitalName: hospName, gross: 0, hospital: 0, mediquee: 0, count: 0 };
      }
      revenueByHospital[hospName].gross += gross;
      revenueByHospital[hospName].hospital += hShare;
      revenueByHospital[hospName].mediquee += mShare;
      revenueByHospital[hospName].count++;

      if (!revenueByService[serviceType]) {
        revenueByService[serviceType] = { gross: 0, hospital: 0, mediquee: 0, count: 0 };
      }
      revenueByService[serviceType].gross += gross;
      revenueByService[serviceType].hospital += hShare;
      revenueByService[serviceType].mediquee += mShare;
      revenueByService[serviceType].count++;

      items.push({
        id,
        bookingId: bookingRef,
        serviceType,
        hospitalName: hospName,
        hospitalId: hospId,
        patientName,
        patientPhone,
        grossAmount: gross,
        hospitalAmount: hShare,
        hospitalSharePercentage: hSharePct,
        mediqueeAmount: mShare,
        mediqueeCommissionPercentage: mSharePct,
        date,
        status,
        settlementStatus: 'Pending Settlement',
        directBookingUrl
      });
    };

    opBookings.forEach(b => {
      const gross = b.fee || 0;
      const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
      const mSharePct = b.mediqueeCommissionPercentage ?? (100 - hSharePct);
      const hShare = b.hospitalAmount ?? (gross * (hSharePct / 100));
      const mShare = b.mediqueeAmount ?? (gross * (mSharePct / 100));
      const isVideo = Boolean(b.videoConsultation) || b.opType?.toLowerCase().includes('video') || b.opType?.toLowerCase().includes('online');
      const sType = isVideo ? 'Video Consultations' : 'OP Bookings';
      const directUrl = isVideo ? `/admin/services/video-consultation/${b.id}` : `/admin/op-bookings/${b.id}`;
      const status = b.status === 'COMPLETED' ? 'Completed' : (b.status === 'CANCELLED' ? 'Failed' : 'Pending');
      processItem(
        b.id,
        b.id.substring(0, 8).toUpperCase(),
        sType,
        gross,
        hShare,
        mShare,
        hSharePct,
        mSharePct,
        b.hospital?.name || 'Unknown Hospital',
        b.hospital?.id,
        b.patientName || b.patient?.name || 'Patient',
        b.patientPhone || b.patient?.phone || undefined,
        b.createdAt,
        status,
        directUrl
      );
    });

    labBookings.forEach(b => {
      const gross = b.totalAmount || 0;
      const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
      const mSharePct = b.mediqueeCommissionPercentage ?? (100 - hSharePct);
      const hShare = b.hospitalAmount ?? (gross * (hSharePct / 100));
      const mShare = b.mediqueeAmount ?? (gross * (mSharePct / 100));
      const isHome = b.bookingType === 'HOME_COLLECTION';
      const sType = isHome ? 'Home Sample Collection' : 'Lab Tests';
      const directUrl = isHome ? `/admin/home-sample/${b.id}` : `/admin/lab-tests/${b.id}`;
      const status = ['REPORT_READY', 'SAMPLE_COLLECTED', 'IN_LAB_PROCESSING', 'COMPLETED'].includes(b.status) ? 'Completed' : (b.status === 'CANCELLED' ? 'Failed' : 'Pending');
      processItem(
        b.id,
        b.id.substring(0, 8).toUpperCase(),
        sType,
        gross,
        hShare,
        mShare,
        hSharePct,
        mSharePct,
        b.hospital?.name || 'Unknown Lab',
        b.hospital?.id,
        b.patient?.name || 'Patient',
        b.patient?.phone || undefined,
        b.createdAt,
        status,
        directUrl
      );
    });

    nursingBookings.forEach(b => {
      const gross = b.totalAmount || 0;
      const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
      const mSharePct = b.mediqueeCommissionPercentage ?? (100 - hSharePct);
      const hShare = b.hospitalAmount ?? (gross * (hSharePct / 100));
      const mShare = b.mediqueeAmount ?? (gross * (mSharePct / 100));
      const directUrl = `/admin/home-nursing/${b.id}`;
      const status = b.paymentStatus === 'PAID' ? 'Completed' : (b.status === 'CANCELLED' ? 'Failed' : 'Pending');
      processItem(
        b.id,
        b.bookingNumber || b.id.substring(0, 8).toUpperCase(),
        'Home Nursing',
        gross,
        hShare,
        mShare,
        hSharePct,
        mSharePct,
        b.hospital?.name || 'Unknown Provider',
        b.hospital?.id,
        b.patientName || b.user?.name || 'Patient',
        b.patientPhone || b.user?.phone || undefined,
        b.createdAt,
        status,
        directUrl
      );
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: {
        kpis: {
          grossRevenue,
          hospitalShare,
          mediqueeCommission,
          totalTransactions,
          averageTransaction: totalTransactions ? (grossRevenue / totalTransactions) : 0
        },
        revenueByHospital: Object.values(revenueByHospital).sort((a: any, b: any) => b.gross - a.gross),
        revenueByService: Object.entries(revenueByService).map(([name, data]: any) => ({ name, ...data })),
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opBookings = await prisma.oPBooking.findMany({ where: { isWalkIn: false, payoutEligible: true }, include: { hospital: true }});
    const labBookings = await prisma.labBooking.findMany({ include: { hospital: true }});
    const nursingBookings = await prisma.homeNursingBooking.findMany({ include: { hospital: true }});
    
    let settlementsMap: any = {};

    const addBookingToSettlements = (b: any, gross: number, hShare: number) => {
      const date = new Date(b.createdAt);
      const period = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      const hospitalId = b.hospitalId || 'unknown';
      const key = `${hospitalId}-${period}`;

      if (!settlementsMap[key]) {
        settlementsMap[key] = {
          id: `SETTLE-${b.hospitalId?.substring(0, 5).toUpperCase()}-${period.replace(' ', '').toUpperCase()}`,
          hospitalId: b.hospitalId,
          hospitalName: b.hospital?.name || 'Unknown',
          period,
          transactionCount: 0,
          grossRevenue: 0,
          hospitalAmount: 0,
          status: 'PENDING',
          createdDate: new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString(),
        };
      }
      
      settlementsMap[key].transactionCount++;
      settlementsMap[key].grossRevenue += gross;
      settlementsMap[key].hospitalAmount += hShare;
    };

    opBookings.forEach(b => {
      const gross = b.fee || 0;
      const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
      const hShare = b.hospitalAmount ?? (gross * (hSharePct / 100));
      addBookingToSettlements(b, gross, hShare);
    });

    labBookings.forEach(b => {
      const gross = b.totalAmount || 0;
      const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
      const hShare = b.hospitalAmount ?? (gross * (hSharePct / 100));
      addBookingToSettlements(b, gross, hShare);
    });

    nursingBookings.forEach(b => {
      const gross = b.totalAmount || 0;
      const hSharePct = b.hospitalSharePercentage ?? b.hospital?.hospitalShare ?? 80;
      const hShare = b.hospitalAmount ?? (gross * (hSharePct / 100));
      addBookingToSettlements(b, gross, hShare);
    });

    res.json({ success: true, data: Object.values(settlementsMap) });
  } catch (error) {
    next(error);
  }
};
