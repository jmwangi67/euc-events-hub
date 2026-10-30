import { planningQuerySchema } from "../../../../lib/data/contracts";
import { readPlanningContext } from "../../../../lib/server/data/queries";
import { queryResponse } from "../../../../lib/server/data/http";
export async function POST(request: Request) {
  return queryResponse(request, planningQuerySchema, readPlanningContext);
}
