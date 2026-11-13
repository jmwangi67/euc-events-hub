import "server-only";

export function browserFixturesEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.EUC_BROWSER_FIXTURES === "1"
  );
}
