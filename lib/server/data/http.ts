import "server-only";
import type { z } from "zod";

/** Read-only POST avoids encoding structured filters in URLs. Never echoes inputs/errors. */
export async function queryResponse<T>(
  request: Request,
  schema: z.ZodType<T>,
  read: (query: T) => Promise<unknown>,
) {
  const headers = { "Cache-Control": "no-store" };
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid query." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return Response.json({ error: "Invalid query." }, { status: 400, headers });
  try {
    return Response.json(await read(parsed.data), { headers });
  } catch {
    return Response.json(
      { error: "Data unavailable." },
      { status: 500, headers },
    );
  }
}
