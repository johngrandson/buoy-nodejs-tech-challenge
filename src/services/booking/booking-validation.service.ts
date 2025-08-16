import { EntityManager } from '@mikro-orm/core';
import { Booking } from '@entities/booking.entity';
import { Hotel } from '@entities/hotel.entity';
import { Accommodation } from '@entities/accommodation.entity';
import { BookingStrategy, BookingValidationResult } from './strategies/booking-strategy.interface';
import { ApartmentBookingStrategy } from './strategies/apartment-booking.strategy';
import { HotelBookingStrategy } from './strategies/hotel-booking.strategy';

export type AccommodationType = 'hotel' | 'apartment';

export class BookingValidationService {
  constructor(private em: EntityManager) {}

  async validateBooking(
    accommodationId: number,
    accommodationType: AccommodationType,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: number
  ): Promise<BookingValidationResult> {
    const existingBookings = await this.getExistingBookings(accommodationId, excludeBookingId);
    const strategy = await this.getStrategy(accommodationType, accommodationId);

    return strategy.canBook(startDate, endDate, existingBookings);
  }

  private async getExistingBookings(
    accommodationId: number,
    excludeBookingId?: number
  ): Promise<Booking[]> {
    const conditions: Record<string, unknown> = {
      accommodation: { id: accommodationId },
    };

    if (excludeBookingId) {
      conditions.id = { $ne: excludeBookingId };
    }

    return this.em.find(Booking, conditions);
  }

  private async getStrategy(
    accommodationType: AccommodationType,
    accommodationId: number
  ): Promise<BookingStrategy> {
    switch (accommodationType) {
      case 'apartment':
        return new ApartmentBookingStrategy();

      case 'hotel':
        const hotel = await this.em.findOne(Hotel, { id: accommodationId });
        if (!hotel) {
          throw new Error('Hotel not found');
        }
        return new HotelBookingStrategy(hotel);

      default:
        throw new Error(`Unsupported accommodation type: ${accommodationType}`);
    }
  }

  async determineAccommodationType(accommodationId: number): Promise<AccommodationType> {
    // Now we can directly query the accommodation and check its type
    const accommodation = await this.em.findOne(Accommodation, { id: accommodationId });

    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    return accommodation.type;
  }
}
