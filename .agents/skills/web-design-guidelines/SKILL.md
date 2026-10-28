---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
---

If current guidelines cannot be fetched, use references/guidelines-snapshot.md and disclose that it is a dated snapshot. Use existing project context to find the review files before asking the user.

## Codex integration

Resolve skill files relative to this loaded SKILL.md and run project commands in the user's actual project. Use available native tools and the project's package manager. Upstream Bash, WebFetch, Read and Edit examples describe operations: on Windows use PowerShell, Python, or available browser/connector tools.

The user's brief, project conventions and existing design system take priority over house-style defaults. Read supporting references only for the current concern. Automatic selection means context-sensitive use, not running every skill on every task.

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use an available web or browser tool to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
