import type { ReactNode } from "react";
export function SelectionDropdown({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="selection-dropdown">
      <summary>
        <strong>{title}</strong>
        <span>{summary}</span>
      </summary>
      <div className="selection-options">{children}</div>
    </details>
  );
}
