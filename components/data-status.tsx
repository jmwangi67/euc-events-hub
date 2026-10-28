"use client";
export function DataStatus({
  status,
  retry,
  label,
}: {
  status: string;
  retry: () => void;
  label: string;
}) {
  if (status === "ready" || status === "idle") return null;
  return status === "error" ? (
    <p role="alert">
      Unable to load {label}.{" "}
      <button className="text-button" onClick={retry}>
        Retry {label}
      </button>
    </p>
  ) : (
    <p role="status">Loading {label}…</p>
  );
}
