import { Booking } from '@entities/booking.entity';

export interface BookingValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface BookingStrategy {
  canBook(
    startDate: Date,
    endDate: Date,
    existingBookings: Booking[]
  ): Promise<BookingValidationResult>;
}
