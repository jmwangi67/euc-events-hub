import { calendarQuerySchema } from "../../../../lib/data/contracts";
import { readCalendar } from "../../../../lib/server/data/queries";
import { queryResponse } from "../../../../lib/server/data/http";
export async function POST(request: Request) {
  return queryResponse(request, calendarQuerySchema, readCalendar);
}
