import { BookingStrategy, BookingValidationResult } from './booking-strategy.interface';
import { Booking } from '@entities/booking.entity';

export class ApartmentBookingStrategy implements BookingStrategy {
  async canBook(
    startDate: Date,
    endDate: Date,
    existingBookings: Booking[]
  ): Promise<BookingValidationResult> {
    // Check if any existing booking overlaps with the requested dates
    const hasOverlap = existingBookings.some(booking =>
      this.datesOverlap(booking.startDate, booking.endDate, startDate, endDate)
    );

    return {
      allowed: !hasOverlap,
      reason: hasOverlap ? 'Apartment is already booked for these dates' : undefined,
    };
  }

  private datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    // Two date ranges overlap if: start1 < end2 AND end1 > start2
    return start1 < end2 && end1 > start2;
  }
}
