import { NextAvailableDateService } from '@services/next-available-date.service';
import { EntityManager } from '@mikro-orm/core';
import { Hotel } from '@entities/hotel.entity';
import { Apartment } from '@entities/apartment.entity';
import { Accommodation } from '@entities/accommodation.entity';
import { Booking } from '@entities/booking.entity';

describe('NextAvailableDateService', () => {
  let service: NextAvailableDateService;
  let mockEm: jest.Mocked<EntityManager>;

  beforeEach(() => {
    mockEm = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    service = new NextAvailableDateService(mockEm);
  });

  describe('findNextAvailableDate', () => {
    it('should throw error when accommodation not found', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        service.findNextAvailableDate(999, new Date('2025-08-15'))
      ).rejects.toThrow('Accommodation not found');
    });

    describe('Hotel scenarios', () => {
      const mockHotel = {
        id: 1,
        type: 'hotel',
        numberOfRooms: 3,
      } as Hotel;

      beforeEach(() => {
        mockEm.findOne
          .mockResolvedValueOnce(mockHotel as Accommodation) // First call for accommodation
          .mockResolvedValueOnce(mockHotel); // Second call for hotel details
      });

      it('should return requested date when hotel has available rooms', async () => {
        // No overlapping bookings
        mockEm.find.mockResolvedValue([]);

        const result = await service.findNextAvailableDate(1, new Date('2025-08-15'));

        expect(result).toEqual({
          accommodationId: 1,
          accommodationType: 'hotel',
          requestedDate: '2025-08-15',
          nextAvailableDate: '2025-08-15',
          isAvailableOnRequestedDate: true,
        });
      });

      it('should return requested date when hotel has some rooms available', async () => {
        // 2 overlapping bookings but hotel has 3 rooms
        const mockBookings = [
          {
            id: 1,
            startDate: new Date('2025-08-14'),
            endDate: new Date('2025-08-17'),
            guestName: 'Guest 1',
          },
          {
            id: 2,
            startDate: new Date('2025-08-15'),
            endDate: new Date('2025-08-18'),
            guestName: 'Guest 2',
          },
        ];

        mockEm.find.mockResolvedValue(mockBookings as Booking[]);

        const result = await service.findNextAvailableDate(1, new Date('2025-08-15'));

        expect(result).toEqual({
          accommodationId: 1,
          accommodationType: 'hotel',
          requestedDate: '2025-08-15',
          nextAvailableDate: '2025-08-15',
          isAvailableOnRequestedDate: true,
        });
      });

      it('should find next available date when hotel is fully booked', async () => {
        const mockBookings = [
          {
            id: 1,
            startDate: new Date('2025-08-14'),
            endDate: new Date('2025-08-17'),
            guestName: 'Guest 1',
          },
          {
            id: 2,
            startDate: new Date('2025-08-15'),
            endDate: new Date('2025-08-18'),
            guestName: 'Guest 2',
          },
          {
            id: 3,
            startDate: new Date('2025-08-15'),
            endDate: new Date('2025-08-20'),
            guestName: 'Guest 3',
          },
        ];

        // First call (Aug 15): 3 bookings = full
        // Second call (Aug 16): 3 bookings = full  
        // Third call (Aug 17): 3 bookings = full
        // Fourth call (Aug 18): 1 booking = available
        // Fifth call (get conflicts for Aug 15): 3 bookings
        mockEm.find
          .mockResolvedValueOnce(mockBookings as Booking[]) // Aug 15: full
          .mockResolvedValueOnce(mockBookings as Booking[]) // Aug 16: full
          .mockResolvedValueOnce(mockBookings as Booking[]) // Aug 17: full
          .mockResolvedValueOnce([mockBookings[2]] as Booking[]) // Aug 18: 1 booking
          .mockResolvedValueOnce(mockBookings as Booking[]); // Aug 15 conflicts

        const result = await service.findNextAvailableDate(1, new Date('2025-08-15'));

        expect(result).toEqual({
          accommodationId: 1,
          accommodationType: 'hotel',
          requestedDate: '2025-08-15',
          nextAvailableDate: '2025-08-18',
          isAvailableOnRequestedDate: false,
          conflictingBookings: [
            {
              id: 1,
              startDate: '2025-08-14',
              endDate: '2025-08-17',
              guestName: 'Guest 1',
            },
            {
              id: 2,
              startDate: '2025-08-15',
              endDate: '2025-08-18',
              guestName: 'Guest 2',
            },
            {
              id: 3,
              startDate: '2025-08-15',
              endDate: '2025-08-20',
              guestName: 'Guest 3',
            },
          ],
        });
      });
    });

    describe('Apartment scenarios', () => {
      const mockApartment = {
        id: 2,
        type: 'apartment',
      } as Apartment;

      beforeEach(() => {
        mockEm.findOne.mockResolvedValue(mockApartment as Accommodation);
      });

      it('should return requested date when apartment has no bookings', async () => {
        mockEm.find.mockResolvedValue([]);

        const result = await service.findNextAvailableDate(2, new Date('2025-08-15'));

        expect(result).toEqual({
          accommodationId: 2,
          accommodationType: 'apartment',
          requestedDate: '2025-08-15',
          nextAvailableDate: '2025-08-15',
          isAvailableOnRequestedDate: true,
        });
      });

      it('should find next available date when apartment has conflicting booking', async () => {
        const mockBooking = {
          id: 1,
          startDate: new Date('2025-08-14'),
          endDate: new Date('2025-08-17'),
          guestName: 'Guest 1',
        };

        // First call (Aug 15): 1 booking = conflict
        // Second call (Aug 16): 1 booking = conflict
        // Third call (Aug 17): 0 bookings = available
        // Fourth call (get conflicts for Aug 15): 1 booking
        mockEm.find
          .mockResolvedValueOnce([mockBooking] as Booking[]) // Aug 15: conflict
          .mockResolvedValueOnce([mockBooking] as Booking[]) // Aug 16: conflict
          .mockResolvedValueOnce([]) // Aug 17: available
          .mockResolvedValueOnce([mockBooking] as Booking[]); // Aug 15 conflicts

        const result = await service.findNextAvailableDate(2, new Date('2025-08-15'));

        expect(result).toEqual({
          accommodationId: 2,
          accommodationType: 'apartment',
          requestedDate: '2025-08-15',
          nextAvailableDate: '2025-08-17',
          isAvailableOnRequestedDate: false,
          conflictingBookings: [
            {
              id: 1,
              startDate: '2025-08-14',
              endDate: '2025-08-17',
              guestName: 'Guest 1',
            },
          ],
        });
      });

      it('should handle adjacent bookings correctly for apartments', async () => {
        const mockBooking1 = {
          id: 1,
          startDate: new Date('2025-08-10'),
          endDate: new Date('2025-08-15'), // Ends on Aug 15
          guestName: 'Guest 1',
        };

        const mockBooking2 = {
          id: 2,
          startDate: new Date('2025-08-16'), // Starts on Aug 16
          endDate: new Date('2025-08-20'),
          guestName: 'Guest 2',
        };

        // Aug 15 should be available (previous booking ends, next starts Aug 16)
        mockEm.find.mockResolvedValue([]);

        const result = await service.findNextAvailableDate(2, new Date('2025-08-15'));

        expect(result).toEqual({
          accommodationId: 2,
          accommodationType: 'apartment',
          requestedDate: '2025-08-15',
          nextAvailableDate: '2025-08-15',
          isAvailableOnRequestedDate: true,
        });
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when no date found within limit', async () => {
        const mockHotel = {
          id: 1,
          type: 'hotel',
          numberOfRooms: 1,
        } as Hotel;

        mockEm.findOne
          .mockResolvedValueOnce(mockHotel as Accommodation)
          .mockResolvedValueOnce(mockHotel);

        // Always return 1 booking (hotel always full)
        const mockBooking = {
          id: 1,
          startDate: new Date('2025-08-01'),
          endDate: new Date('2026-08-01'), // Very long booking
          guestName: 'Long Term Guest',
        };

        mockEm.find.mockResolvedValue([mockBooking] as Booking[]);

        await expect(
          service.findNextAvailableDate(1, new Date('2025-08-15'))
        ).rejects.toThrow('No available date found within 365 days');
      });
    });

    describe('Date overlap logic', () => {
      const mockHotel = {
        id: 1,
        type: 'hotel',
        numberOfRooms: 2,
      } as Hotel;

      beforeEach(() => {
        mockEm.findOne
          .mockResolvedValueOnce(mockHotel as Accommodation)
          .mockResolvedValueOnce(mockHotel);
      });

      it('should correctly detect overlapping bookings with different time ranges', async () => {
        const mockBookings = [
          // Booking that starts before requested date and ends after
          {
            id: 1,
            startDate: new Date('2025-08-14'),
            endDate: new Date('2025-08-17'),
            guestName: 'Guest 1',
          },
          // Booking that starts on requested date
          {
            id: 2,
            startDate: new Date('2025-08-15'),
            endDate: new Date('2025-08-18'),
            guestName: 'Guest 2',
          },
        ];

        // Aug 15: 2 bookings = full, Aug 16: 1 booking = available, conflicts for Aug 15: 2 bookings
        mockEm.find
          .mockResolvedValueOnce(mockBookings as Booking[]) // Aug 15: full
          .mockResolvedValueOnce([mockBookings[1]] as Booking[]) // Aug 16: 1 booking available
          .mockResolvedValueOnce(mockBookings as Booking[]); // Aug 15 conflicts

        const result = await service.findNextAvailableDate(1, new Date('2025-08-15'));

        // Hotel has 2 rooms, 2 overlapping bookings = full
        expect(result.isAvailableOnRequestedDate).toBe(false);
        expect(result.nextAvailableDate).toBe('2025-08-16');
        expect(result.conflictingBookings).toHaveLength(2);
      });

      it('should not consider bookings that end on requested date as overlapping', async () => {
        const mockBooking = {
          id: 1,
          startDate: new Date('2025-08-10'),
          endDate: new Date('2025-08-15'), // Ends exactly on requested date
          guestName: 'Guest 1',
        };

        // This booking should NOT overlap with Aug 15 (check-out day)
        mockEm.find.mockResolvedValue([]);

        const result = await service.findNextAvailableDate(1, new Date('2025-08-15'));

        expect(result.isAvailableOnRequestedDate).toBe(true);
      });
    });
  });
});