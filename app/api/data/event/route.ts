import { eventQuerySchema } from "../../../../lib/data/contracts";
import { readEvent } from "../../../../lib/server/data/queries";
import { queryResponse } from "../../../../lib/server/data/http";
export async function POST(request: Request) {
  return queryResponse(request, eventQuerySchema, readEvent);
}
