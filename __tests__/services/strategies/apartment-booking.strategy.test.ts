import { ApartmentBookingStrategy } from '@/services/booking/strategies/apartment-booking.strategy';
import { Booking } from '@entities/booking.entity';

describe('ApartmentBookingStrategy', () => {
  let strategy: ApartmentBookingStrategy;

  beforeEach(() => {
    strategy = new ApartmentBookingStrategy();
  });

  describe('canBook', () => {
    it('should allow booking when no existing bookings', async () => {
      const result = await strategy.canBook(new Date('2024-01-01'), new Date('2024-01-05'), []);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow booking when no overlaps exist', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
        },
        {
          id: 2,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-15'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-06'),
        new Date('2024-01-09'),
        existingBookings
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject booking when exact overlap exists', async () => {
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

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Apartment is already booked for these dates');
    });

    it('should reject booking when partial overlap exists (start overlaps)', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-10'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-01'),
        new Date('2024-01-07'),
        existingBookings
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Apartment is already booked for these dates');
    });

    it('should reject booking when partial overlap exists (end overlaps)', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-03'),
        new Date('2024-01-10'),
        existingBookings
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Apartment is already booked for these dates');
    });

    it('should reject booking when new booking contains existing booking', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-07'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-01'),
        new Date('2024-01-10'),
        existingBookings
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Apartment is already booked for these dates');
    });

    it('should allow booking when dates are adjacent (check-in on check-out day)', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-05'),
        new Date('2024-01-10'),
        existingBookings
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow booking when dates are adjacent (check-out on check-in day)', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-05'),
          endDate: new Date('2024-01-10'),
        },
      ] as Booking[];

      const result = await strategy.canBook(
        new Date('2024-01-01'),
        new Date('2024-01-05'),
        existingBookings
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should handle multiple existing bookings correctly', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
        },
        {
          id: 2,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-15'),
        },
        {
          id: 3,
          startDate: new Date('2024-01-20'),
          endDate: new Date('2024-01-25'),
        },
      ] as Booking[];

      // Should reject overlap with second booking
      const result = await strategy.canBook(
        new Date('2024-01-12'),
        new Date('2024-01-18'),
        existingBookings
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Apartment is already booked for these dates');
    });
  });
});
