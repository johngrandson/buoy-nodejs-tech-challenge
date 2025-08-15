import { z } from 'zod';

export const ApartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  location: z.string().min(1),
  numberOfBedrooms: z.number().int().positive(),
  numberOfBathrooms: z.number().int().positive(),
  squareMeters: z.number().positive(),
  floor: z.number().int().optional(),
  hasElevator: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  type: z.literal('apartment').optional(), // Will be set automatically
});

export const ApartmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ApartmentInput = z.infer<typeof ApartmentSchema>;
