import type { NextConfig } from "next";
// Preserve the repository-owned AGENTS.md when starting development.
const config: NextConfig = {
  agentRules: false,
  outputFileTracingExcludes: { "/*": ["./data/local/**/*"] },
  // Private dev review caches must never be mixed with production build output.
  distDir:
    process.env.NODE_ENV === "development" &&
    process.env.EUC_PRIVATE_EXAM_PREVIEW === "1"
      ? "data/local/exams/.next-preview"
      : ".next",
};
export default config;
