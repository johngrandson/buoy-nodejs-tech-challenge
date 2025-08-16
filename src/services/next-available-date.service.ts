import { EntityManager } from '@mikro-orm/core';
import { Accommodation } from '@entities/accommodation.entity';
import { Hotel } from '@entities/hotel.entity';
import { Apartment } from '@entities/apartment.entity';
import { Booking } from '@entities/booking.entity';

export interface NextAvailableDateResult {
  accommodationId: number;
  accommodationType: 'hotel' | 'apartment';
  requestedDate: string;
  nextAvailableDate: string;
  isAvailableOnRequestedDate: boolean;
  conflictingBookings?: {
    id: number;
    startDate: string;
    endDate: string;
    guestName: string;
  }[];
}

export class NextAvailableDateService {
  constructor(private em: EntityManager) {}

  async findNextAvailableDate(
    accommodationId: number,
    fromDate: Date
  ): Promise<NextAvailableDateResult> {
    const accommodation = await this.em.findOne(Accommodation, { id: accommodationId });

    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    const requestedDateStr = fromDate.toISOString().split('T')[0];

    if (accommodation.type === 'hotel') {
      return this.findNextAvailableDateForHotel(accommodation as Hotel, fromDate, requestedDateStr);
    } else {
      return this.findNextAvailableDateForApartment(
        accommodation as Apartment,
        fromDate,
        requestedDateStr
      );
    }
  }

  private async findNextAvailableDateForHotel(
    hotel: Hotel,
    fromDate: Date,
    requestedDateStr: string
  ): Promise<NextAvailableDateResult> {
    let currentDate = new Date(fromDate);
    const maxDaysToCheck = 365; // Limit search to 1 year
    let daysChecked = 0;

    while (daysChecked < maxDaysToCheck) {
      const { available, conflictingBookings } = await this.checkHotelAvailability(
        hotel.id,
        currentDate,
        hotel.numberOfRooms
      );

      if (available) {
        const nextAvailableDateStr = currentDate.toISOString().split('T')[0];
        const isAvailableOnRequestedDate = nextAvailableDateStr === requestedDateStr;

        // If the requested date is not available, get conflicting bookings for the requested date
        let requestedDateConflicts = undefined;
        if (!isAvailableOnRequestedDate) {
          const { conflictingBookings: requestedConflicts } = await this.checkHotelAvailability(
            hotel.id,
            fromDate,
            hotel.numberOfRooms
          );
          requestedDateConflicts = requestedConflicts;
        }

        return {
          accommodationId: hotel.id,
          accommodationType: 'hotel',
          requestedDate: requestedDateStr,
          nextAvailableDate: nextAvailableDateStr,
          isAvailableOnRequestedDate,
          conflictingBookings: isAvailableOnRequestedDate ? undefined : requestedDateConflicts,
        };
      }

      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }

    throw new Error(`No available date found within ${maxDaysToCheck} days`);
  }

  private async findNextAvailableDateForApartment(
    apartment: Apartment,
    fromDate: Date,
    requestedDateStr: string
  ): Promise<NextAvailableDateResult> {
    let currentDate = new Date(fromDate);
    const maxDaysToCheck = 365; // Limit search to 1 year
    let daysChecked = 0;

    while (daysChecked < maxDaysToCheck) {
      const { available, conflictingBookings } = await this.checkApartmentAvailability(
        apartment.id,
        currentDate
      );

      if (available) {
        const nextAvailableDateStr = currentDate.toISOString().split('T')[0];
        const isAvailableOnRequestedDate = nextAvailableDateStr === requestedDateStr;

        // If the requested date is not available, get conflicting bookings for the requested date
        let requestedDateConflicts = undefined;
        if (!isAvailableOnRequestedDate) {
          const { conflictingBookings: requestedConflicts } = await this.checkApartmentAvailability(
            apartment.id,
            fromDate
          );
          requestedDateConflicts = requestedConflicts;
        }

        return {
          accommodationId: apartment.id,
          accommodationType: 'apartment',
          requestedDate: requestedDateStr,
          nextAvailableDate: nextAvailableDateStr,
          isAvailableOnRequestedDate,
          conflictingBookings: isAvailableOnRequestedDate ? undefined : requestedDateConflicts,
        };
      }

      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }

    throw new Error(`No available date found within ${maxDaysToCheck} days`);
  }

  private async checkHotelAvailability(
    hotelId: number,
    date: Date,
    totalRooms: number
  ): Promise<{
    available: boolean;
    conflictingBookings: { id: number; startDate: string; endDate: string; guestName: string }[];
  }> {
    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    // Find bookings that overlap with the requested date
    // Using same logic as booking validation: start < nextDay && end > requestedDate
    const overlappingBookings = await this.em.find(Booking, {
      accommodation: { id: hotelId },
      startDate: { $lt: nextDay },
      endDate: { $gt: requestedDate },
    });

    const conflictingBookings = (overlappingBookings || []).map(booking => ({
      id: booking.id,
      startDate: booking.startDate.toISOString().split('T')[0],
      endDate: booking.endDate.toISOString().split('T')[0],
      guestName: booking.guestName,
    }));

    const bookedRooms = (overlappingBookings || []).length;
    const availableRooms = totalRooms - bookedRooms;

    return {
      available: availableRooms > 0,
      conflictingBookings,
    };
  }

  private async checkApartmentAvailability(
    apartmentId: number,
    date: Date
  ): Promise<{
    available: boolean;
    conflictingBookings: { id: number; startDate: string; endDate: string; guestName: string }[];
  }> {
    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    // Find bookings that overlap with the requested date
    // For apartments, any overlap means unavailable
    // Using same logic as booking validation: start < nextDay && end > requestedDate
    const overlappingBookings = await this.em.find(Booking, {
      accommodation: { id: apartmentId },
      startDate: { $lt: nextDay },
      endDate: { $gt: requestedDate },
    });

    const conflictingBookings = (overlappingBookings || []).map(booking => ({
      id: booking.id,
      startDate: booking.startDate.toISOString().split('T')[0],
      endDate: booking.endDate.toISOString().split('T')[0],
      guestName: booking.guestName,
    }));

    return {
      available: (overlappingBookings || []).length === 0,
      conflictingBookings,
    };
  }
}
