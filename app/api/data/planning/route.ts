import { planningQuerySchema } from "../../../../lib/data/contracts";
import { readPlanningContext } from "../../../../lib/server/data/queries";
import { browserFixturesEnabled } from "../../../../lib/server/data/browser-fixtures";
import { queryResponse } from "../../../../lib/server/data/http";
export async function POST(request: Request) {
  const read = browserFixturesEnabled()
    ? (await import("../../../../lib/server/data/browser-fixture-queries"))
        .readPlanningContext
    : readPlanningContext;
  return queryResponse(request, planningQuerySchema, read);
}
