import { z } from 'zod';

export const nextAvailableDateParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const nextAvailableDateQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const nextAvailableDateResponseSchema = z.object({
  accommodationId: z.number(),
  accommodationType: z.enum(['hotel', 'apartment']),
  requestedDate: z.string(),
  nextAvailableDate: z.string(),
  isAvailableOnRequestedDate: z.boolean(),
  conflictingBookings: z
    .array(
      z.object({
        id: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        guestName: z.string(),
      })
    )
    .optional(),
});

export type NextAvailableDateParams = z.infer<typeof nextAvailableDateParamsSchema>;
export type NextAvailableDateQuery = z.infer<typeof nextAvailableDateQuerySchema>;
export type NextAvailableDateResponse = z.infer<typeof nextAvailableDateResponseSchema>;
