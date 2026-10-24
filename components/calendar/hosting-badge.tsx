import type { HostingIdentity } from "../../lib/domain/hosting";
/** Original generic paw geometry, not an official Penn State trademark. Replaceable artwork. */
function Paw() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="hosting-paw"
    >
      <ellipse cx="5" cy="7" rx="2.2" ry="3" transform="rotate(-25 5 7)" />
      <ellipse cx="10" cy="4.5" rx="2.1" ry="3" />
      <ellipse cx="15.5" cy="5" rx="2.1" ry="3" transform="rotate(15 15.5 5)" />
      <ellipse cx="20" cy="9" rx="2.1" ry="2.8" transform="rotate(30 20 9)" />
      <path d="M5.5 17c0-2.2 2.8-3.3 4.1-6 1.2-2.4 3.7-2.4 5 0 1.4 2.7 4 3.8 4 6 0 2.3-2.1 3.2-4.2 2.2-1.7-.8-2.8-.8-4.6 0-2.2 1-4.3.2-4.3-2.2Z" />
    </svg>
  );
}
export function HostingBadge({ identity }: { identity: HostingIdentity }) {
  if (!identity) return null;
  const co = identity === "co-hosted";
  return (
    <span
      className={`hosting-badge ${co ? "hosting-co" : "hosting-psu"}`}
      data-hosting={identity}
      aria-label={
        co
          ? "Co-hosted by a Penn State university unit and student organization"
          : "PSU Hosted — exclusively Penn State university units"
      }
    >
      <span className="hosting-icons">
        <Paw />
        {co && <Paw />}
      </span>
      <span>{co ? "Co-hosted" : "PSU Hosted"}</span>
    </span>
  );
}
