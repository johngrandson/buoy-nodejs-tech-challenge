import { HotelBookingStrategy } from '@/services/booking/strategies/hotel-booking.strategy';
import { Hotel } from '@entities/hotel.entity';
import { Booking } from '@entities/booking.entity';

describe('HotelBookingStrategy', () => {
  let strategy: HotelBookingStrategy;
  let mockHotel: Hotel;

  beforeEach(() => {
    mockHotel = {
      id: 1,
      name: 'Test Hotel',
      numberOfRooms: 3,
    } as Hotel;
    strategy = new HotelBookingStrategy(mockHotel);
  });

  describe('canBook', () => {
    it('should allow booking when no existing bookings', async () => {
      const result = await strategy.canBook(new Date('2024-01-01'), new Date('2024-01-05'), []);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow booking when rooms are available', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        },
        {
          id: 2,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-05'),
        new Date('2024-01-15'),
        existingBookings
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject booking when all rooms are booked', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        },
        {
          id: 2,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        },
        {
          id: 3,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-05'),
        new Date('2024-01-15'),
        existingBookings
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('All 3 rooms are booked for these dates');
    });

    it('should only count overlapping bookings', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'), // No overlap
        },
        {
          id: 2,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-15'), // Overlaps
        },
        {
          id: 3,
          startDate: new Date('2024-01-20'),
          endDate: new Date('2024-01-25'), // No overlap
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-12'),
        new Date('2024-01-18'),
        existingBookings
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should handle adjacent dates correctly (no overlap)', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
        },
        {
          id: 2,
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-10'),
        },
        {
          id: 3,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-15'),
        },
      ] as Booking[];

      // New booking from Jan 15 to Jan 20 - should not overlap with any
      const result = await strategy.canBook(
        new Date('2024-01-15'),
        new Date('2024-01-20'),
        existingBookings
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should handle exact date match as overlap', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-01'),
        new Date('2024-01-10'),
        existingBookings
      );

      expect(result.allowed).toBe(true); // Still 2 rooms available
      expect(result.reason).toBeUndefined();
    });

    it('should work with single room hotel', async () => {
      const singleRoomHotel = {
        id: 2,
        name: 'Small Hotel',
        numberOfRooms: 1,
      } as Hotel;
      const singleRoomStrategy = new HotelBookingStrategy(singleRoomHotel);

      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        },
      ] as Booking[];

      const result = await singleRoomStrategy.canBook(
        new Date('2024-01-05'),
        new Date('2024-01-15'),
        existingBookings
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('All 1 rooms are booked for these dates');
    });

    it('should handle partial overlaps correctly', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-08'),
        },
        {
          id: 2,
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-12'),
        },
      ] as Booking[];

      // New booking from Jan 3 to Jan 10 overlaps with both existing bookings
      const result = await strategy.canBook(
        new Date('2024-01-03'),
        new Date('2024-01-10'),
        existingBookings
      );

      expect(result.allowed).toBe(true); // 2 overlapping + 1 new = 3 rooms total (all used but allowed)
      expect(result.reason).toBeUndefined();
    });

    it('should reject when overlapping bookings exceed room capacity', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-08'),
        },
        {
          id: 2,
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-12'),
        },
        {
          id: 3,
          startDate: new Date('2024-01-07'),
          endDate: new Date('2024-01-14'),
        },
      ] as Booking[];

      // All 3 rooms are booked, new booking should be rejected
      const result = await strategy.canBook(
        new Date('2024-01-06'),
        new Date('2024-01-10'),
        existingBookings
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('All 3 rooms are booked for these dates');
    });
  });
});
