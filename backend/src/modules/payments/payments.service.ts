import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { BookingStatus, LabBookingStatus } from '@prisma/client';
import { getRazorpayClient, isRazorpayConfigured } from './razorpay.client';

export type ServiceType = 
  | 'OP_BOOKING' 
  | 'VIDEO_CONSULTATION' 
  | 'LAB_BOOKING' 
  | 'HOME_SAMPLE' 
  | 'HOME_NURSING';

export interface CreateOrderParams {
  serviceType: ServiceType;
  bookingId: string;
  userId: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
  serviceType: ServiceType;
  bookingId: string;
  userId?: string;
}

export class PaymentsService {
  /**
   * 1. Calculates the exact, authoritative payable amount in INR from the database
   * Never trusts client-supplied amounts.
   */
  static async calculateAuthoritativeAmount(serviceType: ServiceType, bookingId: string): Promise<{
    amountInINR: number;
    amountInPaise: number;
    hospitalId?: string;
    description: string;
  }> {
    let amountInINR = 0;
    let hospitalId: string | undefined;
    let description = '';

    switch (serviceType) {
      case 'OP_BOOKING': {
        const booking = await prisma.oPBooking.findUnique({
          where: { id: bookingId },
          include: { doctor: true, hospital: true }
        });
        if (!booking) throw new Error(`OP appointment #${bookingId} not found`);
        amountInINR = booking.fee > 0 ? booking.fee : (booking.doctor.consultationFee || 500);
        hospitalId = booking.hospitalId;
        description = `OP Consultation - Dr. ${booking.doctor.name} at ${booking.hospital.name}`;
        break;
      }

      case 'VIDEO_CONSULTATION': {
        const booking = await prisma.oPBooking.findUnique({
          where: { id: bookingId },
          include: { doctor: true, hospital: true }
        });
        if (!booking) throw new Error(`Video consultation #${bookingId} not found`);
        amountInINR = booking.fee > 0 ? booking.fee : (booking.doctor.consultationFee || 500);
        hospitalId = booking.hospitalId;
        description = `Telemedicine Video Consultation - Dr. ${booking.doctor.name}`;
        break;
      }

      case 'LAB_BOOKING':
      case 'HOME_SAMPLE': {
        const booking = await prisma.labBooking.findUnique({
          where: { id: bookingId },
          include: { items: true, hospital: true }
        });
        if (!booking) throw new Error(`Lab booking #${bookingId} not found`);
        
        if (booking.totalAmount > 0) {
          amountInINR = booking.totalAmount;
        } else {
          const itemsTotal = booking.items.reduce((sum, item) => sum + item.price, 0);
          amountInINR = itemsTotal + (booking.homeCollectionFee || 0);
        }
        hospitalId = booking.hospitalId;
        description = serviceType === 'HOME_SAMPLE'
          ? `Home Sample Diagnostic Collection (${booking.items.length} tests) - ${booking.hospital.name}`
          : `Diagnostic Lab Tests (${booking.items.length} tests) - ${booking.hospital.name}`;
        break;
      }

      case 'HOME_NURSING': {
        const booking = await prisma.homeNursingBooking.findUnique({
          where: { id: bookingId },
          include: { service: true, hospital: true }
        });
        if (!booking) throw new Error(`Home nursing booking #${bookingId} not found`);
        amountInINR = booking.totalAmount > 0 ? booking.totalAmount : (booking.service?.basePrice || 0);
        hospitalId = booking.hospitalId;
        description = `Home Nursing Care - ${booking.service?.name || 'Care Package'} (${booking.duration || 'Session'})`;
        break;
      }

      default:
        throw new Error(`Unsupported service type: ${serviceType}`);
    }

    if (amountInINR <= 0) {
      throw new Error(`Calculated payable amount must be greater than zero for booking #${bookingId}`);
    }

    const amountInPaise = Math.round(amountInINR * 100);

    return {
      amountInINR,
      amountInPaise,
      hospitalId,
      description
    };
  }

  /**
   * 2. Creates a Razorpay Order server-side with independent price calculation
   */
  static async createOrder(params: CreateOrderParams) {
    if (!isRazorpayConfigured()) {
      throw new Error('Razorpay payment gateway is not configured on this server.');
    }

    const { serviceType, bookingId, userId, notes = {} } = params;

    // Independently calculate exact amount from DB
    const { amountInINR, amountInPaise, hospitalId, description } = 
      await this.calculateAuthoritativeAmount(serviceType, bookingId);

    const razorpay = getRazorpayClient();
    const shortServiceCode = serviceType.replace('_BOOKING', '').slice(0, 4).toLowerCase();
    const receiptId = `rcpt_${shortServiceCode}_${bookingId.replace(/-/g, '').slice(0, 12)}_${Date.now().toString().slice(-4)}`;

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        serviceType,
        bookingId,
        userId,
        hospitalId: hospitalId || '',
        ...notes
      }
    });

    // Save transaction in database
    const transaction = await prisma.paymentTransaction.upsert({
      where: { orderId: rzpOrder.id },
      create: {
        orderId: rzpOrder.id,
        serviceType,
        bookingId,
        userId,
        amount: amountInINR,
        amountInPaise,
        currency: 'INR',
        status: 'CREATED',
        receipt: receiptId,
        metadata: {
          description,
          hospitalId,
          ...notes
        }
      },
      update: {
        amount: amountInINR,
        amountInPaise,
        status: 'CREATED',
        receipt: receiptId
      }
    });

    return {
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      amountInINR,
      currency: rzpOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
      serviceType,
      bookingId,
      description,
      receipt: receiptId
    };
  }

  /**
   * 3. Verifies Razorpay payment cryptographic signature using timingSafeEqual
   */
  static verifySignature(orderId: string, paymentId: string, signature: string, customSecret?: string): boolean {
    const secret = (customSecret || env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET)?.trim();
    if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured on server.');

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'utf-8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  /**
   * 4. Confirms the booking atomically in Prisma upon valid payment
   */
  static async confirmBookingAfterPayment(
    serviceType: ServiceType, 
    bookingId: string, 
    paymentDetails: { paymentId?: string; orderId?: string; method?: string; amount?: number }
  ) {
    const { paymentId, orderId, method } = paymentDetails;

    switch (serviceType) {
      case 'OP_BOOKING':
      case 'VIDEO_CONSULTATION': {
        const updated = await prisma.oPBooking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.WAITING,
          }
        });

        // If it's a video consultation, ensure room is ready
        if (serviceType === 'VIDEO_CONSULTATION' || updated.opType === 'Video Consultation') {
          const roomName = `room-${updated.id}`;
          await prisma.videoConsultation.upsert({
            where: { bookingId: updated.id },
            create: {
              bookingId: updated.id,
              roomName,
              status: 'SCHEDULED',
              scheduledDate: updated.appointmentDate
            },
            update: {
              status: 'SCHEDULED'
            }
          });
        }
        return updated;
      }

      case 'LAB_BOOKING':
      case 'HOME_SAMPLE': {
        return await prisma.labBooking.update({
          where: { id: bookingId },
          data: {
            status: LabBookingStatus.REQUESTED
          }
        });
      }

      case 'HOME_NURSING': {
        return await prisma.homeNursingBooking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentMethod: method || 'RAZORPAY'
          }
        });
      }

      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }
  }

  /**
   * 5. Verifies and finalizes a payment from standard checkout callback
   */
  static async verifyPayment(params: VerifyPaymentParams) {
    const { orderId, paymentId, signature, serviceType, bookingId, userId } = params;

    // Cryptographic signature verification
    const isValid = this.verifySignature(orderId, paymentId, signature);
    if (!isValid) {
      // Record failed transaction attempt
      await prisma.paymentTransaction.updateMany({
        where: { orderId },
        data: {
          status: 'FAILED',
          failureReason: 'Cryptographic signature mismatch'
        }
      });
      throw new Error('Invalid payment signature. Verification failed.');
    }

    // Update transaction to PAID
    const transaction = await prisma.paymentTransaction.update({
      where: { orderId },
      data: {
        paymentId,
        signature,
        status: 'PAID',
        method: 'RAZORPAY_CHECKOUT'
      }
    });

    // Confirm booking
    const confirmedBooking = await this.confirmBookingAfterPayment(serviceType, bookingId, {
      paymentId,
      orderId,
      method: 'RAZORPAY_CHECKOUT',
      amount: transaction.amount
    });

    return {
      success: true,
      transaction,
      booking: confirmedBooking
    };
  }

  /**
   * 6. Webhook verification using RAZORPAY_WEBHOOK_SECRET and raw request body
   */
  static verifyWebhookSignature(rawBody: string, signature: string, customSecret?: string): boolean {
    const secret = (customSecret || env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET)?.trim();
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured on server.');

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'utf-8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  /**
   * 7. Webhook Handler with idempotency
   */
  static async processWebhookEvent(rawBody: string, signature: string, eventId?: string) {
    // 1. Cryptographic validation of webhook payload
    const isValid = this.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // 2. Idempotency check with eventId
    if (eventId) {
      const existing = await prisma.paymentWebhookLog.findUnique({
        where: { eventId }
      });
      if (existing) {
        console.log(`[RazorpayWebhook] Duplicate event ${eventId} (${event}) skipped.`);
        return { status: 'duplicate_skipped' };
      }

      await prisma.paymentWebhookLog.create({
        data: {
          eventId,
          event,
          payload,
          processed: false
        }
      });
    }

    // 3. Process supported events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      const method = paymentEntity?.method || 'WEBHOOK';

      if (orderId) {
        const transaction = await prisma.paymentTransaction.findUnique({
          where: { orderId }
        });

        if (transaction && transaction.status !== 'PAID') {
          await prisma.paymentTransaction.update({
            where: { orderId },
            data: {
              paymentId: paymentId || transaction.paymentId,
              status: 'PAID',
              method
            }
          });

          await this.confirmBookingAfterPayment(
            transaction.serviceType as ServiceType,
            transaction.bookingId,
            { paymentId, orderId, method, amount: transaction.amount }
          );

          console.log(`[RazorpayWebhook] Successfully confirmed booking #${transaction.bookingId} (${transaction.serviceType}) via ${event}`);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const reason = paymentEntity?.error_description || 'Payment failed';

      if (orderId) {
        await prisma.paymentTransaction.updateMany({
          where: { orderId },
          data: {
            status: 'FAILED',
            failureReason: reason
          }
        });
      }
    }

    // Mark webhook log as processed
    if (eventId) {
      await prisma.paymentWebhookLog.update({
        where: { eventId },
        data: { processed: true }
      });
    }

    return { status: 'processed', event };
  }
}
