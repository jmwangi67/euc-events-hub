import type { z } from "zod";
export async function requestData<T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Data could not be loaded.");
  return schema.parse(await response.json());
}
