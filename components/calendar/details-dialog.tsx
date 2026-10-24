"use client";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  triggerId: string;
  title: string;
  titleId: string;
  label: string;
  describedBy?: string;
  children: ReactNode;
  onClose: () => void;
};
export function DetailsDialog({
  triggerId,
  title,
  titleId,
  label,
  describedBy,
  children,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const calendarRegion = previousFocus?.closest(".calendar-region");
    element.showModal();
    heading.current?.focus();
    return () => {
      element.close();
      // FullCalendar may replace the opener during a responsive view change.
      const trigger =
        previousFocus?.isConnected &&
        previousFocus.dataset.calendarEventId === triggerId
          ? previousFocus
          : (calendarRegion?.querySelector<HTMLElement>(
              `[data-calendar-event-id="${CSS.escape(triggerId)}"]`,
            ) ??
            document.querySelector<HTMLElement>(
              `[data-calendar-event-id="${CSS.escape(triggerId)}"]`,
            ));
      trigger?.focus();
    };
  }, [triggerId]);
  return (
    <dialog
      ref={dialog}
      className="event-dialog"
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onKeyDown={(key) => {
        if (key.key !== "Tab") return;
        const controls = Array.from(
          key.currentTarget.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
          ),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) return;
        if (!controls.includes(document.activeElement as HTMLElement)) {
          key.preventDefault();
          (key.shiftKey ? last : first).focus();
        } else if (key.shiftKey && document.activeElement === first) {
          key.preventDefault();
          last.focus();
        } else if (!key.shiftKey && document.activeElement === last) {
          key.preventDefault();
          first.focus();
        }
      }}
      onCancel={(cancel) => {
        // Native dismissal restores focus before its queued close notification.
        // Clear React's selection now, so immediate reactivation is not a no-op.
        cancel.preventDefault();
        onClose();
      }}
      onClose={(event) => {
        // Strict Mode can close/reopen during effect replay before the queued
        // close event arrives. That old notification must not dismiss the new dialog.
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const box = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom
        )
          onClose();
      }}
    >
      <div className="dialog-top">
        <span className="eyebrow">{label}</span>
        <button
          className="control"
          onClick={onClose}
          aria-label={`Close ${label.toLowerCase()}`}
        >
          Close ×
        </button>
      </div>
      <h2 id={titleId} ref={heading} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </dialog>
  );
}
