import { describe, it, expect, vi, beforeEach } from "vitest";
import { interpretMessage } from "./llm";

describe("interpretMessage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns error when response is not valid JSON", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "not json at all" } }] }),
    } as Response);

    const result = await interpretMessage("pizza in LA", "test-key");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toContain("JSON");
  });

  it("returns error when parsed object fails SearchParams validation", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"query":"","near":"LA"}' } }],
      }),
    } as Response);

    const result = await interpretMessage("pizza in LA", "test-key");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toBeDefined();
  });

  it("returns error when LLM returns uninterpretable", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: '{"uninterpretable":true,"reason":"off-topic"}' } },
        ],
      }),
    } as Response);

    const result = await interpretMessage("what is the weather", "test-key");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toBeDefined();
  });

  it("returns resolved params with default limit when valid", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"query":"pizza","near":"downtown LA"}',
            },
          },
        ],
      }),
    } as Response);

    const result = await interpretMessage("pizza in downtown LA", "test-key");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.query).toBe("pizza");
      expect(result.params.near).toBe("downtown LA");
      expect(result.params.limit).toBe(10);
    }
  });
});
