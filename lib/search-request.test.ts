import { describe, expect, it } from "vitest";
import { classifySearchInput } from "./search-request";

describe("classifySearchInput", () => {
  it("routes obviously vague input to refinement", () => {
    expect(
      classifySearchInput({
        message: "sushi",
      }),
    ).toBe("needs_refinement_short_generic");
  });

  it("allows complete messages to execute directly", () => {
    expect(
      classifySearchInput({
        message: "cheap sushi near Angeles Pampanga that is open now",
        currentRequest: {
          location: "Angeles, Pampanga",
        },
      }),
    ).toBe("execute_directly");
  });
});

