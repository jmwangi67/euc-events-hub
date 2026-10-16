import { describe, expect, it } from "vitest";
import { easternLocalCandidates, resolveEasternLocal } from "./eastern-local";

describe("Eastern local proposal input", () => {
  it.each([
    ["2026-01-15", "12:00", "2026-01-15T17:00:00.000Z"],
    ["2026-07-15", "12:00", "2026-07-15T16:00:00.000Z"],
    ["2026-03-08", "01:59", "2026-03-08T06:59:00.000Z"],
    ["2026-03-08", "03:00", "2026-03-08T07:00:00.000Z"],
    ["2026-10-27", "00:30", "2026-10-27T04:30:00.000Z"],
  ])("resolves %s %s using IANA rules", (date, time, instant) =>
    expect(resolveEasternLocal(date, time)).toBe(instant),
  );
  it("rejects nonexistent spring clocks rather than shifting them", () => {
    expect(easternLocalCandidates("2026-03-08", "02:30")).toEqual([]);
    expect(() => resolveEasternLocal("2026-03-08", "02:30")).toThrow(
      /does not exist/,
    );
  });
  it("requires an explicit choice for repeated fall clocks", () => {
    expect(easternLocalCandidates("2026-11-01", "01:30")).toEqual([
      "2026-11-01T05:30:00.000Z",
      "2026-11-01T06:30:00.000Z",
    ]);
    expect(() => resolveEasternLocal("2026-11-01", "01:30")).toThrow(
      /occurs twice/,
    );
    expect(resolveEasternLocal("2026-11-01", "01:30", "first")).toBe(
      "2026-11-01T05:30:00.000Z",
    );
    expect(resolveEasternLocal("2026-11-01", "01:30", "second")).toBe(
      "2026-11-01T06:30:00.000Z",
    );
  });
  it.each([
    ["2026-02-30", "12:00"],
    ["2026-10-20", "24:00"],
    ["2026-10-20", "1:00"],
    ["", "12:00"],
  ])("rejects invalid %s %s", (date, time) =>
    expect(() => easternLocalCandidates(date, time)).toThrow(
      /valid date and time/,
    ),
  );
});
