import { BookingStrategy, BookingValidationResult } from './booking-strategy.interface';
import { Booking } from '@entities/booking.entity';
import { Hotel } from '@entities/hotel.entity';

export class HotelBookingStrategy implements BookingStrategy {
  constructor(private hotel: Hotel) {}

  async canBook(
    startDate: Date,
    endDate: Date,
    existingBookings: Booking[]
  ): Promise<BookingValidationResult> {
    // Count how many rooms are already booked for overlapping dates
    const overlappingBookings = existingBookings.filter(booking =>
      this.datesOverlap(booking.startDate, booking.endDate, startDate, endDate)
    );

    const bookedRooms = overlappingBookings.length;
    const availableRooms = this.hotel.numberOfRooms - bookedRooms;
    const hasAvailability = availableRooms > 0;

    return {
      allowed: hasAvailability,
      reason: !hasAvailability
        ? `All ${this.hotel.numberOfRooms} rooms are booked for these dates`
        : undefined,
    };
  }

  private datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    // Two date ranges overlap if: start1 < end2 AND end1 > start2
    return start1 < end2 && end1 > start2;
  }
}
