import { events, exams, majors, organizations } from "../data/fixtures";

export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="mb-3 text-sm font-medium text-primary">
        Milestone 1A · Application foundation
      </p>
      <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-brand-navy sm:text-4xl">
        A shared foundation for engineering events.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground-muted">
        EUC Events Hub is running. This development preview establishes the data
        models, audience relevance, and Eastern Time behavior for the upcoming
        student calendar.
      </p>
      <section
        aria-labelledby="status-heading"
        className="mt-9 border-l-4 border-brand-blue bg-surface px-5 py-5"
      >
        <h2 id="status-heading" className="text-lg font-semibold">
          Synthetic data only
        </h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-foreground-muted">
          Every example event, organization, and exam is fictional. These
          records are development samples and must not be used to plan real
          activities.
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4 text-sm">
          {[
            ["Example events", events.length],
            ["Example organizations", organizations.length],
            ["Major models", majors.length],
            ["Example exams", exams.length],
          ].map(([label, count]) => (
            <div key={label}>
              <dt className="text-foreground-muted">{label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-brand-navy">
                {count}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="next-heading" className="mt-9">
        <h2 id="next-heading" className="text-xl font-semibold text-brand-navy">
          What comes next
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-foreground-muted">
          The student calendar and its event filters are planned for Milestone
          1B. Organization planning follows in Milestone 1C. Event and exam
          times will display in Eastern Time (EST or EDT).
        </p>
      </section>
    </main>
  );
}
