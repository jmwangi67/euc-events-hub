"use client";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { requestData } from "./request";
type State<T> = { key: string | null; revision: number } & (
  { status: "loading" } | { status: "error" } | { status: "ready"; data: T }
);
/** Never exposes a previous query's data, even during the render before effect cleanup. */
export function useDataQuery<T>(
  query: { path: string; body: unknown } | null,
  schema: z.ZodType<T>,
) {
  const key = query ? JSON.stringify(query) : null;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<State<T>>({
    key: null,
    revision: 0,
    status: "loading",
  });
  useEffect(() => {
    if (!key) return;
    const { path, body } = JSON.parse(key) as { path: string; body: unknown };
    const controller = new AbortController();
    requestData(path, body, schema, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setState({ key, revision, status: "ready", data });
      },
      () => {
        if (!controller.signal.aborted)
          setState({ key, revision, status: "error" });
      },
    );
    return () => controller.abort();
  }, [key, revision, schema]);
  const current =
    state.key === key && state.revision === revision ? state : null;
  return {
    status: !key ? ("idle" as const) : (current?.status ?? "loading"),
    data: current?.status === "ready" ? current.data : undefined,
    retry: () => setRevision((value) => value + 1),
  };
}
