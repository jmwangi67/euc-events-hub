import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { requestData } from "./request";
afterEach(() => vi.unstubAllGlobals());
describe("serialized client response validation", () => {
  it("rejects invalid serialized records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ count: "invalid" })),
    );
    await expect(
      requestData(
        "/api/data/calendar",
        {},
        z.object({ count: z.number() }),
        new AbortController().signal,
      ),
    ).rejects.toThrow();
  });
  it("rejects unsuccessful requests without exposing server diagnostic text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("private diagnostic", { status: 500 })),
    );
    await expect(
      requestData(
        "/api/data/calendar",
        {},
        z.object({}),
        new AbortController().signal,
      ),
    ).rejects.toThrow("Data could not be loaded.");
  });
  it("forwards cancellation and refuses an aborted fetch", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init: RequestInit) => {
        expect(init.signal).toBe(controller.signal);
        return Promise.reject(new DOMException("Aborted", "AbortError"));
      }),
    );
    await expect(
      requestData("/api/data/calendar", {}, z.object({}), controller.signal),
    ).rejects.toThrow("Aborted");
  });
});
