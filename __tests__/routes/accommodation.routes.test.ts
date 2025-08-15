import fastify, { FastifyInstance } from 'fastify';
import accommodationRoutes from '@routes/accommodation.routes';

describe('Accommodation Routes', () => {
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

    await app.register(accommodationRoutes, { prefix: '/accommodations' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /accommodations', () => {
    it('should return all accommodations with default pagination', async () => {
      const mockAccommodations = [
        {
          id: 1,
          name: 'Accommodation 1',
          price: 100,
          location: 'Location A',
        },
        {
          id: 2,
          name: 'Accommodation 2',
          price: 150,
          location: 'Location B',
        },
      ];

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockAccommodations, 2]);

      const response = await app.inject({
        method: 'GET',
        url: '/accommodations',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockAccommodations,
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

    it('should return accommodations with custom pagination parameters', async () => {
      const mockAccommodations = [
        {
          id: 1,
          name: 'Accommodation 1',
          price: 100,
          location: 'Location A',
        },
      ];

      (app.em.findAndCount as jest.Mock).mockResolvedValue([mockAccommodations, 10]);

      const response = await app.inject({
        method: 'GET',
        url: '/accommodations?page=2&limit=3',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toEqual({
        data: mockAccommodations,
        pagination: {
          page: 2,
          limit: 3,
          total: 10,
          totalPages: 4,
          hasNext: true,
          hasPrev: true,
        },
      });

      expect(app.em.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        {},
        {
          limit: 3,
          offset: 3,
        }
      );
    });

    it('should handle edge case with no accommodations', async () => {
      (app.em.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const response = await app.inject({
        method: 'GET',
        url: '/accommodations',
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
        url: '/accommodations?page=0&limit=150',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /accommodations/:id', () => {
    it('should return an accommodation by id', async () => {
      const mockAccommodation = {
        id: 1,
        name: 'Accommodation 1',
        price: 100,
        location: 'Location A',
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(mockAccommodation);

      const response = await app.inject({
        method: 'GET',
        url: '/accommodations/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockAccommodation);
    });

    it('should return 404 when accommodation not found', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/accommodations/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Accommodation not found' });
    });
  });

  describe('POST /accommodations', () => {
    it('should create a new accommodation', async () => {
      const newAccommodation = {
        name: 'New Accommodation',
        description: 'A beautiful accommodation',
        price: 200,
        location: 'New Location',
      };

      const createdAccommodation = { id: 3, ...newAccommodation };

      (app.em.create as jest.Mock).mockReturnValue(createdAccommodation);
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/accommodations',
        payload: newAccommodation,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(createdAccommodation);
    });

    it('should return 400 for invalid data', async () => {
      const invalidAccommodation = {
        name: 'Invalid Accommodation',
        // Missing required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: '/accommodations',
        payload: invalidAccommodation,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /accommodations/:id', () => {
    it('should update an accommodation by id', async () => {
      const existingAccommodation = {
        id: 1,
        name: 'Old Accommodation',
        price: 100,
        location: 'Old Location',
      };

      const updateData = {
        name: 'Updated Accommodation',
        description: 'An updated accommodation',
        price: 150,
        location: 'Updated Location',
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(existingAccommodation);
      (app.em.assign as jest.Mock).mockImplementation((entity, data) => Object.assign(entity, data));
      (app.em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'PUT',
        url: '/accommodations/1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(app.em.findOne).toHaveBeenCalledWith(expect.anything(), { id: 1 });
      expect(app.em.assign).toHaveBeenCalledWith(existingAccommodation, updateData);
      expect(app.em.persistAndFlush).toHaveBeenCalledWith(existingAccommodation);
    });

    it('should return 404 when updating non-existent accommodation', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/accommodations/999',
        payload: {
          name: 'Updated Accommodation',
          price: 150,
          location: 'Updated Location',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Accommodation not found' });
    });

    it('should return 400 for invalid update data', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/accommodations/1',
        payload: {
          name: '',
          // Invalid data
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /accommodations/:id', () => {
    it('should delete an accommodation by id', async () => {
      const existingAccommodation = {
        id: 1,
        name: 'Accommodation to Delete',
        price: 100,
        location: 'Location',
      };

      (app.em.findOne as jest.Mock).mockResolvedValue(existingAccommodation);
      (app.em.removeAndFlush as jest.Mock).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/accommodations/1',
      });

      expect(response.statusCode).toBe(204);
      expect(app.em.findOne).toHaveBeenCalledWith(expect.anything(), { id: 1 });
      expect(app.em.removeAndFlush).toHaveBeenCalledWith(existingAccommodation);
    });

    it('should return 404 when deleting non-existent accommodation', async () => {
      (app.em.findOne as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/accommodations/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ message: 'Accommodation not found' });
    });
  });
});