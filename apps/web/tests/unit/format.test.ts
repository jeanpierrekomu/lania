import { describe, expect, it } from "vitest";

import { relativeDay } from "@/lib/format";

describe("relativeDay (zona America/Lima)", () => {
  const now = new Date("2026-11-02T20:00:00Z"); // 15:00 en Lima
  it.each([
    ["2026-11-02T23:00:00Z", "hoy"],
    ["2026-11-03T15:00:00Z", "mañana"],
    ["2026-11-03T04:30:00Z", "hoy"], // 23:30 del 2 en Lima, aunque en UTC ya sea día 3
    ["2026-11-05T15:00:00Z", "en 3 días"],
    ["2026-11-01T15:00:00Z", "vencido"],
  ])("%s → %s", (iso, expected) => {
    expect(relativeDay(iso, now)).toBe(expected);
  });
});
