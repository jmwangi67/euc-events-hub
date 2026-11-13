import { eventQuerySchema } from "../../../../lib/data/contracts";
import { readEvent } from "../../../../lib/server/data/queries";
import { browserFixturesEnabled } from "../../../../lib/server/data/browser-fixtures";
import { queryResponse } from "../../../../lib/server/data/http";
export async function POST(request: Request) {
  const read = browserFixturesEnabled()
    ? (await import("../../../../lib/server/data/browser-fixture-queries"))
        .readEvent
    : readEvent;
  return queryResponse(request, eventQuerySchema, read);
}
