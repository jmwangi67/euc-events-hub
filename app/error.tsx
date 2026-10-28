"use client";

/** Also covers failed server-side reference reads; never renders internal errors. */
export default function PageDataError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="application-main">
      <p role="alert">Page data could not be loaded.</p>
      <button className="control" onClick={reset}>
        Retry page data
      </button>
    </main>
  );
}
