import fastify, { FastifyInstance } from 'fastify';
import nextAvailableDateRoutes from '@routes/next-available-date.routes';

describe('Next Available Date Routes', () => {
  let app: FastifyInstance;

  // Helper function to get future dates
  const getFutureDate = (daysFromNow: number = 1): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  };

  beforeEach(async () => {
    app = fastify();

    // Mock the entity manager
    const mockEm = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    app.decorate('em', mockEm);

    await app.register(nextAvailableDateRoutes, { prefix: '/accommodations' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /accommodations/:id/next-available-date', () => {
    it('should return next available date for hotel', async () => {
      const mockHotel = {
        id: 1,
        type: 'hotel',
        numberOfRooms: 3,
      };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockHotel) // accommodation lookup
        .mockResolvedValueOnce(mockHotel); // hotel details lookup

      (app.em.find as jest.Mock).mockResolvedValue([]); // no bookings

      const testDate = getFutureDate(1);

      const response = await app.inject({
        method: 'GET',
        url: `/accommodations/1/next-available-date?from=${testDate}`,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        accommodationId: 1,
        accommodationType: 'hotel',
        requestedDate: testDate,
        nextAvailableDate: testDate,
        isAvailableOnRequestedDate: true,
      });
    });

    it('should return next available date for apartment', async () => {
      const mockApartment = {
        id: 2,
        type: 'apartment',
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(mockApartment);
      (app.em.find as jest.Mock).mockResolvedValue([]); // no bookings

      const testDate = getFutureDate(1);

      const response = await app.inject({
        method: 'GET',
        url: `/accommodations/2/next-available-date?from=${testDate}`,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        accommodationId: 2,
        accommodationType: 'apartment',
        requestedDate: testDate,
        nextAvailableDate: testDate,
        isAvailableOnRequestedDate: true,
      });
    });

    it('should return 404 when accommodation not found', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const testDate = getFutureDate(1);

      const response = await app.inject({
        method: 'GET',
        url: `/accommodations/999/next-available-date?from=${testDate}`,
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Accommodation not found',
      });
    });

    it('should return 400 for invalid date format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/accommodations/1/next-available-date?from=invalid-date',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for date in the past', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/accommodations/1/next-available-date?from=2020-01-01',
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Date cannot be in the past',
      });
    });

    it('should return 400 when no available date found within limit', async () => {
      const mockHotel = {
        id: 1,
        type: 'hotel',
        numberOfRooms: 1,
      };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockHotel)
        .mockResolvedValueOnce(mockHotel);

      // Always return 1 booking to make hotel always full
      const mockBooking = {
        id: 1,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        guestName: 'Long Term Guest',
      };

      (app.em.find as jest.Mock).mockResolvedValue([mockBooking]);

      const testDate = getFutureDate(1);

      const response = await app.inject({
        method: 'GET',
        url: `/accommodations/1/next-available-date?from=${testDate}`,
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain('No available date found');
    });

    it('should validate required query parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/accommodations/1/next-available-date',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate accommodation ID parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/accommodations/invalid/next-available-date?from=2025-08-15',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return conflicting bookings when requested date is not available', async () => {
      const mockHotel = {
        id: 1,
        type: 'hotel',
        numberOfRooms: 1,
      };

      const testDate = getFutureDate(1);
      const testDate2 = getFutureDate(2);
      const testDate3 = getFutureDate(3);

      const mockBooking = {
        id: 1,
        startDate: new Date(testDate),
        endDate: new Date(testDate3),
        guestName: 'Guest 1',
      };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockHotel)
        .mockResolvedValueOnce(mockHotel);

      // First call (testDate): 1 booking = full
      // Second call (testDate2): 1 booking = full
      // Third call (testDate3): 0 bookings = available
      (app.em.find as jest.Mock)
        .mockResolvedValueOnce([mockBooking]) // testDate: conflict
        .mockResolvedValueOnce([mockBooking]) // testDate2: conflict
        .mockResolvedValueOnce([]) // testDate3: available
        .mockResolvedValueOnce([mockBooking]); // testDate conflicts

      const response = await app.inject({
        method: 'GET',
        url: `/accommodations/1/next-available-date?from=${testDate}`,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        accommodationId: 1,
        accommodationType: 'hotel',
        requestedDate: testDate,
        nextAvailableDate: testDate3,
        isAvailableOnRequestedDate: false,
        conflictingBookings: [
          {
            id: 1,
            startDate: testDate,
            endDate: testDate3,
            guestName: 'Guest 1',
          },
        ],
      });
    });

    it('should handle today as a valid date', async () => {
      const mockApartment = {
        id: 2,
        type: 'apartment',
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(mockApartment);
      (app.em.find as jest.Mock).mockResolvedValue([]);

      const testDate = getFutureDate(1); // Tomorrow
      
      const response = await app.inject({
        method: 'GET',
        url: `/accommodations/2/next-available-date?from=${testDate}`,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.requestedDate).toBe(testDate);
      expect(responseBody.isAvailableOnRequestedDate).toBe(true);
    });

    it('should handle hotel with multiple rooms and partial occupancy', async () => {
      const mockHotel = {
        id: 1,
        type: 'hotel',
        numberOfRooms: 5,
      };

      const testDate = getFutureDate(1);

      const mockBookings = [
        {
          id: 1,
          startDate: new Date(testDate),
          endDate: new Date(getFutureDate(3)),
          guestName: 'Guest 1',
        },
        {
          id: 2,
          startDate: new Date(testDate),
          endDate: new Date(getFutureDate(4)),
          guestName: 'Guest 2',
        },
      ];

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockHotel)
        .mockResolvedValueOnce(mockHotel);

      (app.em.find as jest.Mock).mockResolvedValue(mockBookings);

      const response = await app.inject({
        method: 'GET',
        url: `/accommodations/1/next-available-date?from=${testDate}`,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.isAvailableOnRequestedDate).toBe(true); // 2 bookings out of 5 rooms
      expect(responseBody.nextAvailableDate).toBe(testDate);
    });
  });
});