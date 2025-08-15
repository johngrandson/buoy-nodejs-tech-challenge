import fastify, { FastifyInstance } from 'fastify';
import hotelRoutes from '@routes/hotel.routes';

describe('Hotel Routes', () => {
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
    } as any;

    app.decorate('em', mockEm);

    await app.register(hotelRoutes, { prefix: '/hotels' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /hotels', () => {
    it('should return all hotels with default pagination', async () => {
      const mockHotels = [
        {
          id: 1,
          name: 'Hotel 1',
          price: 100,
          location: 'City A',
          numberOfRooms: 50,
          starRating: 4,
        },
        {
          id: 2,
          name: 'Hotel 2',
          price: 150,
          location: 'City B',
          numberOfRooms: 100,
          starRating: 5,
        },
      ];

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockHotels, 2]);

      const response = await app.inject({
        method: 'GET',
        url: '/hotels',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockHotels,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should return hotels with custom pagination parameters', async () => {
      const mockHotels = [
        {
          id: 1,
          name: 'Hotel 1',
          price: 100,
          location: 'City A',
          numberOfRooms: 50,
          starRating: 4,
        },
      ];

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockHotels, 15]);

      const response = await app.inject({
        method: 'GET',
        url: '/hotels?page=2&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockHotels,
        pagination: {
          page: 2,
          limit: 5,
          total: 15,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        },
      });

      expect(app.em.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        {},
        {
          limit: 5,
          offset: 5,
        }
      );
    });

    it('should handle edge case with no hotels', async () => {
      (app.em.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const response = await app.inject({
        method: 'GET',
        url: '/hotels',
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
        url: '/hotels?page=0&limit=150',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /hotels/:id', () => {
    it('should return a hotel by id', async () => {
      const mockHotel = {
        id: 1,
        name: 'Hotel 1',
        price: 100,
        location: 'City A',
        numberOfRooms: 50,
        starRating: 4,
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(mockHotel);

      const response = await app.inject({
        method: 'GET',
        url: '/hotels/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockHotel);
    });

    it('should return 404 when hotel not found', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/hotels/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Hotel not found' });
    });
  });

  describe('POST /hotels', () => {
    it('should create a new hotel', async () => {
      const newHotel = {
        name: 'New Hotel',
        description: 'A new hotel',
        price: 200,
        location: 'New City',
        numberOfRooms: 75,
        starRating: 4,
        amenities: ['Pool', 'Gym'],
      };

      const createdHotel = { id: 3, ...newHotel };

      (app.em.create as jest.Mock).mockReturnValue(createdHotel);
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/hotels',
        payload: newHotel,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(createdHotel);
    });

    it('should return 400 for invalid data', async () => {
      const invalidHotel = {
        name: 'Invalid Hotel',
        // Missing required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: '/hotels',
        payload: invalidHotel,
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
