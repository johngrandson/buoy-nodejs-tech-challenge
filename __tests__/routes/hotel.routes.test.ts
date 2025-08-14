import fastify, { FastifyInstance } from 'fastify';
import hotelRoutes from '@routes/hotel.routes';

describe('Hotel Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();

    // Mock the entity manager
    const mockEm = {
      find: jest.fn(),
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
    it('should return all hotels', async () => {
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

      (app.em.find as jest.Mock).mockResolvedValue(mockHotels);

      const response = await app.inject({
        method: 'GET',
        url: '/hotels',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockHotels);
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
