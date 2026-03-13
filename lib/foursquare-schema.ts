import { z } from "zod";

/**
 * Zod schema for raw Foursquare Place Search response (v3).
 * Validates the response before mapping to our restaurant result shape.
 * See: https://docs.foursquare.com/fsq-developers-places/reference/place-search
 */

const foursquareCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
});

const foursquareLocationSchema = z
  .object({
    formatted_address: z.string().optional(),
    address: z.string().optional(),
    locality: z.string().optional(),
    region: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough();

const foursquarePlaceSchema = z
  .object({
    fsq_id: z.string().optional(),
    name: z.string(),
    location: foursquareLocationSchema.optional(),
    categories: z.array(foursquareCategorySchema).optional(),
    distance: z.number().optional(),
    closed_bucket: z
      .enum(["VeryLikelyOpen", "LikelyOpen", "VeryLikelyClosed", "LikelyClosed"])
      .optional(),
    price: z.number().int().min(1).max(4).optional(),
    rating: z.number().optional(),
  })
  .passthrough();

export const foursquarePlaceSearchResponseSchema = z.object({
  results: z.array(foursquarePlaceSchema),
});

export type FoursquarePlaceSearchResponse = z.infer<
  typeof foursquarePlaceSearchResponseSchema
>;

export type FoursquarePlace = z.infer<typeof foursquarePlaceSchema>;
