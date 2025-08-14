import fastify, { FastifyInstance } from 'fastify';
import apartmentRoutes from '@routes/apartment.routes';

describe('Apartment Routes', () => {
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

    await app.register(apartmentRoutes, { prefix: '/apartments' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /apartments', () => {
    it('should return all apartments', async () => {
      const mockApartments = [
        {
          id: 1,
          name: 'Apartment 1',
          price: 80,
          location: 'District A',
          numberOfBedrooms: 2,
          numberOfBathrooms: 1,
          squareMeters: 65,
        },
        {
          id: 2,
          name: 'Apartment 2',
          price: 120,
          location: 'District B',
          numberOfBedrooms: 3,
          numberOfBathrooms: 2,
          squareMeters: 95,
        },
      ];

      (app.em.find as jest.Mock).mockResolvedValue(mockApartments);

      const response = await app.inject({
        method: 'GET',
        url: '/apartments',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockApartments);
    });
  });

  describe('GET /apartments/:id', () => {
    it('should return an apartment by id', async () => {
      const mockApartment = {
        id: 1,
        name: 'Apartment 1',
        price: 80,
        location: 'District A',
        numberOfBedrooms: 2,
        numberOfBathrooms: 1,
        squareMeters: 65,
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(mockApartment);

      const response = await app.inject({
        method: 'GET',
        url: '/apartments/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockApartment);
    });

    it('should return 404 when apartment not found', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/apartments/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Apartment not found' });
    });
  });

  describe('POST /apartments', () => {
    it('should create a new apartment', async () => {
      const newApartment = {
        name: 'New Apartment',
        description: 'A beautiful apartment',
        price: 150,
        location: 'Downtown',
        numberOfBedrooms: 2,
        numberOfBathrooms: 2,
        squareMeters: 85,
        floor: 3,
        hasElevator: true,
        amenities: ['WiFi', 'Parking'],
      };

      const createdApartment = { id: 3, ...newApartment };

      (app.em.create as jest.Mock).mockReturnValue(createdApartment);
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/apartments',
        payload: newApartment,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(createdApartment);
    });

    it('should return 400 for invalid data', async () => {
      const invalidApartment = {
        name: 'Invalid Apartment',
        // Missing required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: '/apartments',
        payload: invalidApartment,
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
