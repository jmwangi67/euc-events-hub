import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { EventTypeIcon } from "./event-type-icon";
import { eventIconType } from "./planner-presentation";
import { externalEventSchema } from "../../lib/domain/external-events";
import { externalEvents } from "../../data/fixtures/planning-context";
import { eventSubtypeSchema } from "../../lib/domain/event-taxonomy";
it("selects the supplied mark only for explicit THON subtype metadata", () => {
  expect(eventSubtypeSchema.parse("thon")).toBe("thon");
  expect(eventIconType({ subtype: "thon" })).toBe("thon");
  expect(
    eventIconType({ externalEvent: { category: "thon", subtype: "thon" } }),
  ).toBe("thon");
  expect(eventIconType({ externalEvent: { category: "thon" } })).toBe("users");
  for (const title of ["THON fundraiser", "Community service", "Philanthropy"])
    expect(eventIconType({ title, eventType: "social-recreational" })).toBe(
      "celebration",
    );
});
it("renders four owner-supplied diamonds, decorative semantics and a replaceable generic fallback", () => {
  const render = (useThonMark: boolean) =>
    renderToStaticMarkup(
      createElement(EventTypeIcon, {
        props: { subtype: "thon" },
        large: true,
        useThonMark,
      }),
    );
  const mark = render(true);
  expect(mark.match(/<path /g)).toHaveLength(4);
  expect(mark).toContain('fill="currentColor"');
  expect(mark).toContain('aria-hidden="true"');
  expect(mark).toContain("thon-icon-large");
  expect(render(false)).toContain('data-event-icon="users"');
  expect(render(false)).not.toContain("thon-icon");
});
it("rejects a THON subtype on an external event classified as something else", () => {
  const original = externalEvents.find((e) => e.category === "thon")!;
  expect(original.subtype).toBe("thon");
  expect(() =>
    externalEventSchema.parse({ ...original, category: "homecoming" }),
  ).toThrow();
});
