import type { NextConfig } from "next";
// Preserve the repository-owned AGENTS.md when starting development.
const config: NextConfig = { agentRules: false };
export default config;
