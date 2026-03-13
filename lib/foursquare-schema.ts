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
    fsq_place_id: z.string().optional(),
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

const foursquareTipSchema = z
  .object({
    id: z.string().optional(),
    text: z.string(),
  })
  .passthrough();

export const foursquareTipsResponseSchema = z.array(foursquareTipSchema);

export type FoursquarePlaceSearchResponse = z.infer<
  typeof foursquarePlaceSearchResponseSchema
>;

export type FoursquarePlace = z.infer<typeof foursquarePlaceSchema>;
export type FoursquareTip = z.infer<typeof foursquareTipSchema>;

// ----- Photos API Schema -----
// See: https://docs.foursquare.com/fsq-developers-places/reference/photos-get

const foursquarePhotoSchema = z.object({
  id: z.string().optional(),
  created_at: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const foursquarePhotosResponseSchema = z.array(foursquarePhotoSchema);

export type FoursquarePhoto = z.infer<typeof foursquarePhotoSchema>;

// ----- Hours API Schema -----
// See: https://docs.foursquare.com/fsq-developers-places/reference/hours-get

const foursquareRegularHoursSchema = z.object({
  close: z.string().optional(),
  day: z.number().int().min(0).max(6).optional(), // 0=Sunday, 6=Saturday
  open: z.string().optional(),
});

const foursquareHoursSchema = z.object({
  regular: z.array(foursquareRegularHoursSchema).optional(),
  is_local_holiday: z.boolean().optional(),
});

export const foursquareHoursResponseSchema = foursquareHoursSchema;

export type FoursquareHours = z.infer<typeof foursquareHoursSchema>;
