import { BookingValidationService } from '@/services/booking/booking-validation.service';
import { ApartmentBookingStrategy } from '@/services/booking/strategies/apartment-booking.strategy';
import { HotelBookingStrategy } from '@/services/booking/strategies/hotel-booking.strategy';
import { Booking } from '@entities/booking.entity';
import { Hotel } from '@entities/hotel.entity';
import { Apartment } from '@entities/apartment.entity';

describe('BookingValidationService', () => {
  let service: BookingValidationService;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new BookingValidationService(mockEm);
  });

  describe('validateBooking', () => {
    it('should validate apartment booking with no overlaps', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          accommodation: { id: 1 }
        }
      ] as Booking[];

      mockEm.find.mockResolvedValue(existingBookings);

      const result = await service.validateBooking(
        1,
        'apartment',
        new Date('2024-01-10'),
        new Date('2024-01-15')
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject apartment booking with overlaps', async () => {
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          accommodation: { id: 1 }
        }
      ] as Booking[];

      mockEm.find.mockResolvedValue(existingBookings);

      const result = await service.validateBooking(
        1,
        'apartment',
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Apartment is already booked for these dates');
    });

    it('should validate hotel booking with available rooms', async () => {
      const hotel = { id: 1, numberOfRooms: 3 } as Hotel;
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          accommodation: { id: 1 }
        }
      ] as Booking[];

      mockEm.find.mockResolvedValue(existingBookings);
      mockEm.findOne.mockResolvedValue(hotel);

      const result = await service.validateBooking(
        1,
        'hotel',
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject hotel booking when all rooms are booked', async () => {
      const hotel = { id: 1, numberOfRooms: 2 } as Hotel;
      const existingBookings = [
        {
          id: 1,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          accommodation: { id: 1 }
        },
        {
          id: 2,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          accommodation: { id: 1 }
        }
      ] as Booking[];

      mockEm.find.mockResolvedValue(existingBookings);
      mockEm.findOne.mockResolvedValue(hotel);

      const result = await service.validateBooking(
        1,
        'hotel',
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('All 2 rooms are booked for these dates');
    });

    it('should exclude current booking when updating', async () => {
      const existingBookings = [
        {
          id: 2,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          accommodation: { id: 1 }
        }
      ] as Booking[];

      mockEm.find.mockResolvedValue(existingBookings);

      const result = await service.validateBooking(
        1,
        'apartment',
        new Date('2024-01-10'),
        new Date('2024-01-20'),
        1 // exclude booking id 1
      );

      expect(result.allowed).toBe(false);
      expect(mockEm.find).toHaveBeenCalledWith(
        Booking,
        {
          accommodation: { id: 1 },
          id: { $ne: 1 }
        }
      );
    });
  });

  describe('determineAccommodationType', () => {
    it('should return hotel for hotel accommodation', async () => {
      const hotel = { id: 1, name: 'Test Hotel' } as Hotel;
      mockEm.findOne
        .mockResolvedValueOnce(hotel) // First call for hotel
        .mockResolvedValueOnce(null); // Second call for apartment

      const result = await service.determineAccommodationType(1);

      expect(result).toBe('hotel');
      expect(mockEm.findOne).toHaveBeenCalledWith(Hotel, { id: 1 });
    });

    it('should return apartment for apartment accommodation', async () => {
      const apartment = { id: 1, name: 'Test Apartment' } as Apartment;
      mockEm.findOne
        .mockResolvedValueOnce(null) // First call for hotel
        .mockResolvedValueOnce(apartment); // Second call for apartment

      const result = await service.determineAccommodationType(1);

      expect(result).toBe('apartment');
      expect(mockEm.findOne).toHaveBeenCalledWith(Hotel, { id: 1 });
      expect(mockEm.findOne).toHaveBeenCalledWith(Apartment, { id: 1 });
    });

    it('should throw error for unknown accommodation type', async () => {
      mockEm.findOne
        .mockResolvedValueOnce(null) // First call for hotel
        .mockResolvedValueOnce(null); // Second call for apartment

      await expect(service.determineAccommodationType(999))
        .rejects.toThrow('Accommodation not found or unsupported type');
    });
  });

  describe('getStrategy', () => {
    it('should throw error for hotel not found', async () => {
      mockEm.findOne.mockResolvedValue(null);

      const service = new BookingValidationService(mockEm);
      
      await expect(
        service.validateBooking(1, 'hotel', new Date(), new Date())
      ).rejects.toThrow('Hotel not found');
    });

    it('should throw error for unsupported accommodation type', async () => {
      await expect(
        service.validateBooking(1, 'unsupported' as any, new Date(), new Date())
      ).rejects.toThrow('Unsupported accommodation type: unsupported');
    });
  });
});