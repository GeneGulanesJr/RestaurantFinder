# Foursquare Place Search — Request/response contract

Single reference for what we send to Foursquare and what we expect back. All responses MUST be parsed as JSON and validated before mapping to our internal result shape.

---

## What we send

- **API**: Foursquare Places API — **Place Search**  
  - Reference: https://docs.foursquare.com/fsq-developers-places/reference/place-search

- **Method**: `GET`

- **Base URL**: `https://api.foursquare.com/v3/places/search` (or current API version from Foursquare docs). Document the base URL and API version in the README (and in code if configurable).

- **Headers**:
  - `Authorization: <FOURSQUARE_API_KEY>`
  - `Accept: application/json`

- **Query parameters** (from validated SearchParams):
  - `query`: search term (e.g. cuisine or “restaurant”)
  - `near`: location string (e.g. “downtown Los Angeles”)
  - `open_now`: `true` when user asked for “open now” (if supported by API)
  - `limit`: max results (default 10)
  - Add any other required/supported params per Foursquare docs (e.g. `categories` for restaurants if required)

- **Body**: None (GET).

- **Timeout**: Use a single timeout for the request (e.g. 10–15 seconds); document the value in README or code. On timeout → 502.

---

## What we expect

- **Content type**: Response body MUST be **JSON**. Non-JSON or parse failure → treat as upstream error (502).

- **Success (200)**:  
  A JSON object that matches the Foursquare Place Search response shape (or a minimal schema we define for the fields we use). At minimum we expect:
  - A top-level array or object containing **results** (e.g. `results` array of place objects).
  - Each place object can contain (names may differ; map from Foursquare field names): name, location/address, category/categories, rating, price level, open_now / hours, distance, etc.

- **Validation**: After parsing JSON, validate the response (e.g. with a Zod schema for the raw Foursquare response or a minimal “places list” shape). If validation fails → 502, do not return partial or unvalidated data.

- **Non-200 or timeout**: Treat as upstream error → 502, body `{ "error": "Upstream API error" }`.

---

## Internal mapping (after validation)

From the validated raw response, map to our **restaurant result** shape:

- `name` (string)
- `address` (string, or empty if not provided)
- `category` (string)
- `rating` (optional number)
- `price` (optional 1–4)
- `open_now` (optional boolean)
- `distance_meters` (optional number)

Only include fields that exist and pass validation; do not expose raw or unchecked fields.

---

## Summary

| Aspect     | Send                                                    | Expect                                                                 |
|-----------|----------------------------------------------------------|------------------------------------------------------------------------|
| Request   | GET Place Search; headers + query from SearchParams     | —                                                                      |
| Response  | —                                                        | JSON only; parse then validate with Foursquare response schema (Zod)  |
| On error  | —                                                        | 502, no Foursquare data to client                                      |
