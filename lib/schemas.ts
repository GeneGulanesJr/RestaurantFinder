import { z } from "zod";

// ----- 2.1 SearchParams (LLM output) -----

const priceSchema = z.enum(["1", "2", "3", "4"]);

export const searchParamsSchema = z.object({
  query: z.string().min(1),
  near: z.string().min(1),
  open_now: z.boolean().optional(),
  price: priceSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
  uninterpretable: z.literal(true).optional(),
  reason: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// Normalized SearchParams with default limit (for internal use after validation)
export type SearchParamsResolved = SearchParams & { limit: number };

export function resolveSearchParams(parsed: SearchParams): SearchParamsResolved {
  return {
    ...parsed,
    limit: parsed.limit ?? 10,
  };
}

// ----- 2.2 Restaurant result and API response -----

export const restaurantResultSchema = z.object({
  name: z.string(),
  address: z.string(),
  category: z.string(),
  rating: z.number().optional(),
  price: z.union([z.number().int().min(1).max(4), priceSchema]).optional(),
  open_now: z.boolean().optional(),
  distance_meters: z.number().optional(),
  description: z.string().optional(),
  why_best: z.string().optional(),
  photos: z.array(z.string()).optional(), // Photo URLs
  hours: z.string().optional(), // Formatted hours string
});

export type RestaurantResult = z.infer<typeof restaurantResultSchema>;

export const executeSuccessResponseSchema = z.object({
  results: z.array(restaurantResultSchema),
  interpreted: searchParamsSchema,
});

export type ExecuteSuccessResponse = z.infer<typeof executeSuccessResponseSchema>;
