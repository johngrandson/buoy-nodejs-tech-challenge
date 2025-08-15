import { z } from 'zod';

export const HotelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  location: z.string().min(1),
  numberOfRooms: z.number().int().positive(),
  starRating: z.number().int().min(1).max(5),
  amenities: z.array(z.string()).optional(),
  type: z.literal('hotel').optional(), // Will be set automatically
});

export const HotelParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type HotelInput = z.infer<typeof HotelSchema>;
