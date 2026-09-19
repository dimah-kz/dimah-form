import { describe, expect, it } from "vitest";
import type { FormField } from "@dimah-form/react";

import { reviewValue } from "@/lib/review-value";

const labels = { yes: "Yes", no: "No", empty: "Not answered" };

function field(
  over: Partial<FormField> & Pick<FormField, "id" | "type">,
): FormField {
  return over;
}

describe("reviewValue", () => {
  it("localizes booleans and falls back to empty", () => {
    const ok = field({ id: "ok", type: "boolean" });
    expect(reviewValue(ok, true, labels)).toBe("Yes");
    expect(reviewValue(ok, false, labels)).toBe("No");
    expect(reviewValue(ok, null, labels)).toBe("Not answered");
  });

  it("uses option labels for select", () => {
    expect(
      reviewValue(
        field({
          id: "role",
          type: "select",
          options: [{ value: "eng", label: "Engineer" }],
        }),
        "eng",
        labels,
      ),
    ).toBe("Engineer");
  });
});
