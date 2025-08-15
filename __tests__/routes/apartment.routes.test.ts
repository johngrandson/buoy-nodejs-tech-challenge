import fastify, { FastifyInstance } from 'fastify';
import apartmentRoutes from '@routes/apartment.routes';

describe('Apartment Routes', () => {
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

    await app.register(apartmentRoutes, { prefix: '/apartments' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /apartments', () => {
    it('should return all apartments with default pagination', async () => {
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

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockApartments, 2]);

      const response = await app.inject({
        method: 'GET',
        url: '/apartments',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockApartments,
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

    it('should return apartments with custom pagination parameters', async () => {
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
      ];

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockApartments, 12]);

      const response = await app.inject({
        method: 'GET',
        url: '/apartments?page=3&limit=4',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockApartments,
        pagination: {
          page: 3,
          limit: 4,
          total: 12,
          totalPages: 3,
          hasNext: false,
          hasPrev: true,
        },
      });

      expect(app.em.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        {},
        {
          limit: 4,
          offset: 8,
        }
      );
    });

    it('should handle edge case with no apartments', async () => {
      (app.em.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const response = await app.inject({
        method: 'GET',
        url: '/apartments',
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
        url: '/apartments?page=-1&limit=0',
      });

      expect(response.statusCode).toBe(400);
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

  describe('PUT /apartments/:id', () => {
    it('should update an apartment by id', async () => {
      const existingApartment = {
        id: 1,
        name: 'Old Apartment',
        price: 80,
        location: 'Old District',
        numberOfBedrooms: 2,
        numberOfBathrooms: 1,
        squareMeters: 65,
      };

      const updateData = {
        name: 'Updated Apartment',
        description: 'An updated apartment',
        price: 120,
        location: 'Updated District',
        numberOfBedrooms: 3,
        numberOfBathrooms: 2,
        squareMeters: 100,
        floor: 5,
        hasElevator: true,
        amenities: ['WiFi', 'Parking', 'Balcony'],
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(existingApartment);
      (app.em.assign as jest.Mock).mockImplementation((entity, data) => Object.assign(entity, data));
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'PUT',
        url: '/apartments/1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(app.em.findOne).toHaveBeenCalledWith(expect.anything(), { id: 1 });
      expect(app.em.assign).toHaveBeenCalledWith(existingApartment, updateData);
      expect(app.em.persistAndFlush).toHaveBeenCalledWith(existingApartment);
    });

    it('should return 404 when updating non-existent apartment', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/apartments/999',
        payload: {
          name: 'Updated Apartment',
          price: 120,
          location: 'Updated District',
          numberOfBedrooms: 3,
          numberOfBathrooms: 2,
          squareMeters: 100,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Apartment not found' });
    });

    it('should return 400 for invalid update data', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/apartments/1',
        payload: {
          name: '',
          // Invalid data
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /apartments/:id', () => {
    it('should delete an apartment by id', async () => {
      const existingApartment = {
        id: 1,
        name: 'Apartment to Delete',
        price: 80,
        location: 'District',
        numberOfBedrooms: 2,
        numberOfBathrooms: 1,
        squareMeters: 65,
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(existingApartment);
      (app.em.removeAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/apartments/1',
      });

      expect(response.statusCode).toBe(204);
      expect(app.em.findOne).toHaveBeenCalledWith(expect.anything(), { id: 1 });
      expect(app.em.removeAndFlush).toHaveBeenCalledWith(existingApartment);
    });

    it('should return 404 when deleting non-existent apartment', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/apartments/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Apartment not found' });
    });
  });
});
