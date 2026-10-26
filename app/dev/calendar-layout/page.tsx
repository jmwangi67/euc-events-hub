import { notFound } from "next/navigation";
import { CalendarLayoutPreview } from "./preview";
export const dynamic = "force-dynamic";
export default function CalendarLayoutPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <CalendarLayoutPreview />;
}
