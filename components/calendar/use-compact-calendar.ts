"use client";
import { useSyncExternalStore } from "react";
const subscribe = (listener: () => void) => {
  const media = window.matchMedia("(max-width: 1023px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
const snapshot = () => window.matchMedia("(max-width: 1023px)").matches;
const serverSnapshot = () => false;
export function useCompactCalendar() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
