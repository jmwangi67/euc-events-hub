import type { Event } from "./models";
import type { ExternalEvent } from "./external-events";

type Source = Event["source"];

/** Verification values stay unchanged in records; only their presentation changes. */
export function verificationLabel(value: Source["verification"]): string {
  switch (value) {
    case "synthetic":
      return "Demo data — not verified";
    case "unverified":
      return "Unverified";
    case "verified":
      return "Source marked verified";
  }
}

/** Retain provenance while translating technical wording in legacy demo labels. */
export function sourceLabel(source: Source): string {
  return source.verification === "synthetic"
    ? source.label.replace(/\bsynthetic\b/gi, "Example")
    : source.label;
}

export function externalScopeLabel(scope: ExternalEvent["scope"]): string {
  return scope === "psu-wide"
    ? "PSU-wide"
    : scope === "national"
      ? "National"
      : "Local";
}

export function academicExamTitle(courseId: string): string {
  return `Academic Exam ${courseId}`;
}
