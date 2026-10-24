"use client";
import { useEffect, useState, type RefObject } from "react";
/** FullCalendar row measurement stays inside the adapter boundary. */
export function useWeekLayout(
  surface: RefObject<HTMLDivElement | null>,
  active: boolean,
  rangeKey: string,
) {
  const [layout, setLayout] = useState({ header: 28, rows: [] as number[] });
  useEffect(() => {
    if (!active || !surface.current) return;
    const root = surface.current;
    const measure = () => {
      const rows = Array.from(
        root.querySelectorAll(".fc-daygrid-body > table > tbody > tr"),
      );
      if (!rows.length) return;
      const header =
        rows[0].getBoundingClientRect().top -
        root.getBoundingClientRect().top -
        root.clientTop;
      const heights = rows.map((row) => row.getBoundingClientRect().height);
      setLayout((current) =>
        Math.abs(current.header - header) < 0.1 &&
        current.rows.join() === heights.join()
          ? current
          : { header, rows: heights },
      );
    };
    const observer = new ResizeObserver(measure);
    const element = root.querySelector(".fc");
    if (element) observer.observe(element);
    root
      .querySelectorAll(".fc-daygrid-body > table > tbody > tr")
      .forEach((row) => observer.observe(row));
    measure();
    return () => observer.disconnect();
  }, [surface, active, rangeKey]);
  return layout;
}
