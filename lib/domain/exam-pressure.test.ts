import { describe, expect, it } from "vitest";
import { examSchema, type Exam } from "./models";
import { ALL_LEVELS } from "./planning-audience";
import {
  preparationSaturday,
  examPreparation,
  combinedExamPreparation,
  combinePreparation,
  easternCivilCoordinate,
} from "./exam-pressure";
import { resolveEasternLocal } from "../time/eastern-local";
const audience = { majorIds: ["che"], academicLevels: ALL_LEVELS };
function exam(date: string, id = date): Extract<Exam, { timeKnown: true }> {
  return examSchema.options[1].parse({
    id,
    courseId: "Synthetic course",
    termId: "example",
    date,
    timeKnown: true,
    start: resolveEasternLocal(date, "09:00"),
    end: resolveEasternLocal(date, "10:00"),
    sectionScope: [],
    relevantMajorIds: ["che", "me"],
    typicalAcademicLevels: ["first", "second"],
    source: { label: "Synthetic model scenario", verification: "synthetic" },
  });
}
const at = (date: string, time = "12:00") => resolveEasternLocal(date, time);
const value = (record: Exam, date: string, time?: string) =>
  examPreparation(record, at(date, time), audience).value!;
describe("Saturday-anchored candidate preparation model", () => {
  it.each([
    ["2026-10-19", "2026-10-17"],
    ["2026-10-21", "2026-10-17"],
    ["2026-10-23", "2026-10-17"],
    ["2026-10-24", "2026-10-17"],
    ["2026-10-18", "2026-10-17"],
  ])("anchors %s on strictly preceding Saturday %s", (date, start) =>
    expect(preparationSaturday(date)).toBe(start),
  );
  it("assigns no contribution before Saturday and a contribution at onset", () => {
    expect(value(exam("2026-10-19"), "2026-10-16", "23:59")).toBe(0);
    expect(value(exam("2026-10-19"), "2026-10-17", "00:00")).toBeGreaterThan(0);
  });
  it("gives Monday substantially more weekend pressure than Wednesday or Friday", () => {
    for (const date of ["2026-10-17", "2026-10-18"]) {
      const [mon, wed, fri] = ["2026-10-19", "2026-10-21", "2026-10-23"].map(
        (d) => value(exam(d), date),
      );
      expect(mon).toBeGreaterThan(wed * 2);
      expect(wed).toBeGreaterThan(fri * 2);
    }
  });
  it("builds nonlinearly with especially high night-before and exam-morning values", () => {
    const record = exam("2026-10-23");
    expect(value(record, "2026-10-22", "22:00")).toBeGreaterThan(8.5);
    expect(value(record, "2026-10-23", "08:59")).toBeGreaterThan(9.9);
    const differences = ["2026-10-17", "2026-10-18", "2026-10-19"].map((d) =>
      value(record, d),
    );
    expect(differences[2] - differences[1]).toBeGreaterThan(
      differences[1] - differences[0],
    );
  });
  it("transitions at the real start instant and contributes zero after end", () => {
    const record = exam("2026-10-19");
    expect(examPreparation(record, record.start, audience)).toMatchObject({
      value: 0,
      state: "direct-constraint",
    });
    expect(examPreparation(record, record.end, audience)).toMatchObject({
      value: 0,
      state: "outside-window",
    });
    expect(value(record, "2026-10-20")).toBe(0);
  });
  it("retains unknown-hour uncertainty instead of choosing an exam time", () => {
    const record = examSchema.parse({
      ...exam("2026-10-21"),
      timeKnown: false,
      start: undefined,
      end: undefined,
    });
    const prior = examPreparation(record, at("2026-10-20"), audience);
    expect(prior.value).toBeNull();
    expect(prior.range[1]).toBeGreaterThan(prior.range[0]);
    expect(examPreparation(record, at(record.date), audience)).toMatchObject({
      value: null,
      range: [0, 10],
      state: "date-uncertain",
    });
    expect(value(record, "2026-10-22")).toBe(0);
  });
  it("changes model strength by typical level without excluding out-of-sequence students", () => {
    const record = exam("2026-10-21");
    const typical = examPreparation(record, at("2026-10-20"), {
      majorIds: ["che"],
      academicLevels: ["first"],
    }).value!;
    const atypical = examPreparation(record, at("2026-10-20"), {
      majorIds: ["che"],
      academicLevels: ["fifth-plus"],
    }).value!;
    expect(atypical).toBeCloseTo(typical * 0.65);
    expect(atypical).toBeGreaterThan(0);
    expect(
      examPreparation(record, at("2026-10-20"), { majorIds: ["bme"] }).value,
    ).toBe(0);
  });
  it.each(["2026-03-09", "2026-11-02"])(
    "uses Eastern day units over DST before %s",
    (date) => {
      const record = exam(date);
      expect(Number.isFinite(value(record, date, "08:00"))).toBe(true);
      expect(value(record, date, "08:00")).toBeGreaterThan(9);
    },
  );
  it("remains monotonic through the repeated fall hour", () => {
    const record = exam("2026-11-02");
    const first = examPreparation(
      record,
      "2026-11-01T01:30:00-04:00",
      audience,
    ).value!;
    const second = examPreparation(
      record,
      "2026-11-01T01:30:00-05:00",
      audience,
    ).value!;
    expect(second).toBeGreaterThan(first);
    expect(
      easternCivilCoordinate("2026-11-02T00:00:00-05:00") -
        easternCivilCoordinate("2026-11-01T00:00:00-04:00"),
    ).toBe(1);
  });
  it("keeps preparation ended during overnight exam direct intervals", () => {
    const record = examSchema.parse({
      ...exam("2026-10-19"),
      start: at("2026-10-19", "23:30"),
      end: at("2026-10-20", "00:30"),
    });
    expect(
      examPreparation(record, at("2026-10-20", "00:15"), audience).state,
    ).toBe("direct-constraint");
  });
  it("validates finite parameters", () => {
    expect(() =>
      examPreparation(exam("2026-10-19"), at("2026-10-18"), audience, {
        decay: -1,
        exponent: 1.35,
      }),
    ).toThrow();
  });
});
describe("bounded diminishing returns", () => {
  it("preserves one contribution and grows toward the bound", () => {
    expect(combinePreparation([4])).toBeCloseTo(4);
    expect(combinePreparation([4, 4])).toBeCloseTo(6.4);
    expect(combinePreparation(Array(100).fill(8))).toBeLessThanOrEqual(10);
    expect(combinePreparation([])).toBe(0);
    expect(combinePreparation([10, 5])).toBe(10);
  });
  it("deduplicates exam records before combining contributions", () => {
    const record = exam("2026-10-21");
    const instant = at("2026-10-20");
    expect(
      combinedExamPreparation([record, record], instant, audience).range,
    ).toEqual(combinedExamPreparation([record], instant, audience).range);
    expect(
      combinedExamPreparation(
        [record, { ...record, id: "distinct" }],
        instant,
        audience,
      ).range[0],
    ).toBeGreaterThan(value(record, "2026-10-20"));
  });
  it.each([NaN, Infinity, -1, 11])("rejects invalid contribution %s", (value) =>
    expect(() => combinePreparation([value])).toThrow(),
  );
});

it.each([
  ["2026-10-17", [4.96, 1.54, 0.38]],
  ["2026-10-18", [7.78, 2.87, 0.78]],
  ["2026-10-19", [0, 4.96, 1.54]],
  ["2026-10-20", [0, 7.78, 2.87]],
  ["2026-10-21", [0, 0, 4.96]],
  ["2026-10-22", [0, 0, 7.78]],
  ["2026-10-23", [0, 0, 0]],
])("matches documented noon examples on %s", (date, expected) => {
  ["2026-10-19", "2026-10-21", "2026-10-23"].forEach((examDate, index) =>
    expect(value(exam(examDate), date)).toBeCloseTo(expected[index], 2),
  );
});
