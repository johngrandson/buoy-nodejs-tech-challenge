import fastify, { FastifyInstance } from 'fastify';
import bookingRoutes from '@routes/booking.routes';

describe('Booking Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();

    // Mock the entity manager
    const mockEm = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      assign: jest.fn(),
      removeAndFlush: jest.fn(),
    } as any;

    app.decorate('em', mockEm);

    await app.register(bookingRoutes, { prefix: '/bookings' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /bookings', () => {
    it('should return all bookings with default pagination', async () => {
      const mockBookings = [
        {
          id: 1,
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          guestName: 'John Doe',
          accommodation: { id: 1, name: 'Test Accommodation' },
        },
        {
          id: 2,
          startDate: '2024-02-01',
          endDate: '2024-02-05',
          guestName: 'Jane Smith',
          accommodation: { id: 2, name: 'Another Accommodation' },
        },
      ];

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockBookings, 2]);

      const response = await app.inject({
        method: 'GET',
        url: '/bookings',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockBookings,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      expect(app.em.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        {},
        {
          limit: 10,
          offset: 0,
          populate: ['accommodation'],
        }
      );
    });

    it('should return bookings with custom pagination parameters', async () => {
      const mockBookings = [
        {
          id: 1,
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          guestName: 'John Doe',
          accommodation: { id: 1, name: 'Test Accommodation' },
        },
      ];

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockBookings, 15]);

      const response = await app.inject({
        method: 'GET',
        url: '/bookings?page=3&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockBookings,
        pagination: {
          page: 3,
          limit: 5,
          total: 15,
          totalPages: 3,
          hasNext: false,
          hasPrev: true,
        },
      });

      expect(app.em.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        {},
        {
          limit: 5,
          offset: 10,
          populate: ['accommodation'],
        }
      );
    });

    it('should handle edge case with no bookings', async () => {
      (app.em.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const response = await app.inject({
        method: 'GET',
        url: '/bookings',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should validate pagination parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/bookings?page=-1&limit=0',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return a booking by id', async () => {
      const mockBooking = {
        id: 1,
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        guestName: 'John Doe',
        accommodation: { id: 1, name: 'Test Accommodation' },
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(mockBooking);

      const response = await app.inject({
        method: 'GET',
        url: '/bookings/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockBooking);
      expect(app.em.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { id: 1 },
        { populate: ['accommodation'] }
      );
    });

    it('should return 404 when booking not found', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/bookings/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Booking not found' });
    });
  });

  describe('POST /bookings', () => {
    it('should create a new booking', async () => {
      const newBooking = {
        accommodationId: 1,
        startDate: '2024-03-01',
        endDate: '2024-03-05',
        guestName: 'Alice Johnson',
      };

      const mockAccommodation = { id: 1, name: 'Test Accommodation' };
      const createdBooking = {
        id: 3,
        ...newBooking,
        accommodation: mockAccommodation,
        startDate: '2024-03-01',
        endDate: '2024-03-05',
      };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAccommodation) // accommodation lookup
        .mockResolvedValueOnce({ id: 1, name: 'Test Hotel', numberOfRooms: 3 }) // hotel lookup
        .mockResolvedValueOnce({ id: 1, name: 'Test Hotel', numberOfRooms: 3 }); // hotel lookup for strategy

      (app.em.find as jest.Mock).mockResolvedValue([]); // no existing bookings
      (app.em.create as jest.Mock).mockReturnValue(createdBooking);
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: newBooking,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(createdBooking);
      expect(app.em.findOne).toHaveBeenCalledWith(expect.anything(), { id: 1 });
    });

    it('should return 400 for invalid accommodation ID', async () => {
      const newBooking = {
        accommodationId: 999,
        startDate: '2024-03-01',
        endDate: '2024-03-05',
        guestName: 'Alice Johnson',
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: newBooking,
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ message: 'Invalid accommodation ID' });
    });

    it('should return 400 for invalid data', async () => {
      const invalidBooking = {
        accommodationId: 1,
        // Missing required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: invalidBooking,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 for apartment booking conflict', async () => {
      const newBooking = {
        accommodationId: 1,
        startDate: '2024-03-01',
        endDate: '2024-03-05',
        guestName: 'Alice Johnson',
      };

      const mockAccommodation = { id: 1, name: 'Test Apartment' };
      const existingBookings = [
        {
          id: 2,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-05'),
          accommodation: { id: 1 },
        },
      ];

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAccommodation) // accommodation lookup
        .mockResolvedValueOnce(null) // hotel lookup (not found)
        .mockResolvedValueOnce({ id: 1, name: 'Test Apartment' }); // apartment lookup

      (app.em.find as jest.Mock).mockResolvedValue(existingBookings);

      const response = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: newBooking,
      });

      expect(response.statusCode).toBe(409);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.message).toBe('Booking conflict');
      expect(responseBody.reason).toBe('Apartment is already booked for these dates');
    });

    it('should return 409 for hotel booking when all rooms are booked', async () => {
      const newBooking = {
        accommodationId: 1,
        startDate: '2024-03-01',
        endDate: '2024-03-05',
        guestName: 'Alice Johnson',
      };

      const mockAccommodation = { id: 1, name: 'Test Hotel' };
      const mockHotel = { id: 1, name: 'Test Hotel', numberOfRooms: 2 };
      const existingBookings = [
        {
          id: 2,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-05'),
          accommodation: { id: 1 },
        },
        {
          id: 3,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-05'),
          accommodation: { id: 1 },
        },
      ];

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAccommodation) // accommodation lookup
        .mockResolvedValueOnce(mockHotel) // hotel lookup
        .mockResolvedValueOnce(mockHotel); // hotel lookup for strategy

      (app.em.find as jest.Mock).mockResolvedValue(existingBookings);

      const response = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: newBooking,
      });

      expect(response.statusCode).toBe(409);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.message).toBe('Booking conflict');
      expect(responseBody.reason).toBe('All 2 rooms are booked for these dates');
    });

    it('should allow hotel booking when rooms are available', async () => {
      const newBooking = {
        accommodationId: 1,
        startDate: '2024-03-01',
        endDate: '2024-03-05',
        guestName: 'Alice Johnson',
      };

      const mockAccommodation = { id: 1, name: 'Test Hotel' };
      const mockHotel = { id: 1, name: 'Test Hotel', numberOfRooms: 3 };
      const existingBookings = [
        {
          id: 2,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-05'),
          accommodation: { id: 1 },
        },
      ];

      const createdBooking = {
        id: 3,
        ...newBooking,
        accommodation: mockAccommodation,
        startDate: '2024-03-01T00:00:00.000Z',
        endDate: '2024-03-05T00:00:00.000Z',
      };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAccommodation) // accommodation lookup
        .mockResolvedValueOnce(mockHotel) // hotel lookup
        .mockResolvedValueOnce(mockHotel); // hotel lookup for strategy

      (app.em.find as jest.Mock).mockResolvedValue(existingBookings);
      (app.em.create as jest.Mock).mockReturnValue(createdBooking);
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/bookings',
        payload: newBooking,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(createdBooking);
    });
  });

  describe('PUT /bookings/:id', () => {
    it('should update a booking by id', async () => {
      const existingBooking = {
        id: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        guestName: 'John Doe',
        accommodation: { id: 1, name: 'Test Accommodation' },
      };

      const updateData = {
        accommodationId: 1,
        startDate: '2024-01-10',
        endDate: '2024-01-15',
        guestName: 'John Updated',
      };

      const mockAccommodation = { id: 1, name: 'Test Accommodation' };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingBooking) // booking lookup
        .mockResolvedValueOnce(mockAccommodation) // accommodation lookup
        .mockResolvedValueOnce({ id: 1, name: 'Test Hotel', numberOfRooms: 3 }) // hotel lookup
        .mockResolvedValueOnce({ id: 1, name: 'Test Hotel', numberOfRooms: 3 }); // hotel lookup for strategy

      (app.em.find as jest.Mock).mockResolvedValue([]); // no conflicting bookings
      (app.em.assign as jest.Mock).mockImplementation((entity, data) =>
        Object.assign(entity, data)
      );
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'PUT',
        url: '/bookings/1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(app.em.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { id: 1 },
        { populate: ['accommodation'] }
      );
      expect(app.em.findOne).toHaveBeenCalledWith(expect.anything(), { id: 1 });
      expect(app.em.assign).toHaveBeenCalledWith(existingBooking, {
        ...updateData,
        accommodation: mockAccommodation,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-15'),
      });
      expect(app.em.persistAndFlush).toHaveBeenCalledWith(existingBooking);
    });

    it('should return 404 when updating non-existent booking', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/bookings/999',
        payload: {
          accommodationId: 1,
          startDate: '2024-01-10',
          endDate: '2024-01-15',
          guestName: 'John Updated',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Booking not found' });
    });

    it('should return 400 for invalid accommodation ID during update', async () => {
      const existingBooking = {
        id: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        guestName: 'John Doe',
        accommodation: { id: 1, name: 'Test Accommodation' },
      };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingBooking) // First call for booking
        .mockResolvedValueOnce(null); // Second call for accommodation

      const response = await app.inject({
        method: 'PUT',
        url: '/bookings/1',
        payload: {
          accommodationId: 999,
          startDate: '2024-01-10',
          endDate: '2024-01-15',
          guestName: 'John Updated',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ message: 'Invalid accommodation ID' });
    });

    it('should return 400 for invalid update data', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/bookings/1',
        payload: {
          accommodationId: 1,
          // Invalid data
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 for apartment update booking conflict', async () => {
      const existingBooking = {
        id: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        guestName: 'John Doe',
        accommodation: { id: 1, name: 'Test Apartment' },
      };

      const updateData = {
        accommodationId: 1,
        startDate: '2024-01-10',
        endDate: '2024-01-15',
        guestName: 'John Updated',
      };

      const mockAccommodation = { id: 1, name: 'Test Apartment' };
      const conflictingBookings = [
        {
          id: 2,
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-15'),
          accommodation: { id: 1 },
        },
      ];

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingBooking) // booking lookup
        .mockResolvedValueOnce(mockAccommodation) // accommodation lookup
        .mockResolvedValueOnce(null) // hotel lookup (not found)
        .mockResolvedValueOnce({ id: 1, name: 'Test Apartment' }); // apartment lookup

      (app.em.find as jest.Mock).mockResolvedValue(conflictingBookings);

      const response = await app.inject({
        method: 'PUT',
        url: '/bookings/1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(409);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.message).toBe('Booking conflict');
      expect(responseBody.reason).toBe('Apartment is already booked for these dates');
    });

    it('should allow apartment update when excluding current booking', async () => {
      const existingBooking = {
        id: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        guestName: 'John Doe',
        accommodation: { id: 1, name: 'Test Apartment' },
      };

      const updateData = {
        accommodationId: 1,
        startDate: '2024-01-10',
        endDate: '2024-01-15',
        guestName: 'John Updated',
      };

      const mockAccommodation = { id: 1, name: 'Test Apartment' };

      (app.em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingBooking) // booking lookup
        .mockResolvedValueOnce(mockAccommodation) // accommodation lookup
        .mockResolvedValueOnce(null) // hotel lookup (not found)
        .mockResolvedValueOnce({ id: 1, name: 'Test Apartment' }); // apartment lookup

      (app.em.find as jest.Mock).mockResolvedValue([]); // no conflicting bookings after excluding current
      (app.em.assign as jest.Mock).mockImplementation((entity, data) =>
        Object.assign(entity, data)
      );
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'PUT',
        url: '/bookings/1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(app.em.find).toHaveBeenCalledWith(expect.anything(), {
        accommodation: { id: 1 },
        id: { $ne: 1 },
      });
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should delete a booking by id', async () => {
      const existingBooking = {
        id: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        guestName: 'John Doe',
        accommodation: { id: 1, name: 'Test Accommodation' },
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(existingBooking);
      (app.em.removeAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/bookings/1',
      });

      expect(response.statusCode).toBe(204);
      expect(app.em.findOne).toHaveBeenCalledWith(expect.anything(), { id: 1 });
      expect(app.em.removeAndFlush).toHaveBeenCalledWith(existingBooking);
    });

    it('should return 404 when deleting non-existent booking', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/bookings/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Booking not found' });
    });
  });
});
