import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadPrivateExamPreview } from "../../../lib/server/private-exam-preview";
import { privateExamPreviewAllowed } from "../../../lib/exams/preview-policy";
import { reportedDates } from "../../../lib/exams/staging";
import { easternDate } from "../../../lib/time/eastern";
import { ExamReview } from "../../../components/planner/exam-review";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = {
  title: "Local academic exam review",
  robots: { index: false, follow: false },
};
export default async function ExamPreviewPage() {
  const requestHeaders = await headers();
  if (!privateExamPreviewAllowed(process.env, requestHeaders)) notFound();
  let preview;
  try {
    preview = await loadPrivateExamPreview(requestHeaders);
  } catch {
    return (
      <main className="application-main">
        <h1>Private exam preview unavailable</h1>
        <p role="alert">
          Check the local dataset setting and run the offline validator. No
          partial dataset was loaded.
        </p>
        <Link href="/planner">Return to fictional planner</Link>
      </main>
    );
  }
  if (!preview) notFound();
  const firstDate =
    preview.dataset.exams
      .flatMap((exam) =>
        exam.claims.flatMap((claim) => reportedDates(claim.timing)),
      )
      .sort()[0] ?? easternDate(new Date().toISOString());
  return (
    <main id="main" className="application-main">
      <ExamReview
        dataset={preview.dataset}
        synthetic={preview.synthetic}
        initialDate={firstDate}
      />
    </main>
  );
}
