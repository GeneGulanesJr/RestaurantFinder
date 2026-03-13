import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPlaces } from "./foursquare";

describe("searchPlaces", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns ok: false when response is not JSON", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => "not json",
    } as Response);

    const result = await searchPlaces(
      { query: "pizza", near: "LA", limit: 10 },
      "test-key"
    );
    expect(result.ok).toBe(false);
  });

  it("returns ok: false when response fails schema validation", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '{"data":[]}',
    } as Response);

    const result = await searchPlaces(
      { query: "pizza", near: "LA", limit: 10 },
      "test-key"
    );
    expect(result.ok).toBe(false);
  });

  it("returns mapped results when response is valid", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          results: [
            {
              name: "Pizza Place",
              location: { formatted_address: "123 Main St" },
              categories: [{ name: "Pizza" }],
              distance: 500,
            },
          ],
        }),
    } as Response);

    const result = await searchPlaces(
      { query: "pizza", near: "LA", limit: 10 },
      "test-key"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe("Pizza Place");
      expect(result.results[0].address).toBe("123 Main St");
      expect(result.results[0].category).toBe("Pizza");
      expect(result.results[0].distance_meters).toBe(500);
    }
  });
});
