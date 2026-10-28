---
name: blast-radius
description: Investigate what a code or configuration change could break outside its immediate diff.
license: See LICENSE
---

# Blast Radius

Trace affected callers, invariants, ownership, serialized formats and runtime entry points. Identify the assumption that makes the change safe and test that assumption with real behavior. Separate affected paths, paths verified safe and unresolved risks. Propose concrete verification for the most important boundary.

## Codex integration

Use current Codex tools and model settings. Cursor/Claude tool names, model slugs, pstack-models.mdc, Bugbot and origin in the upstream reference are not requirements or installed integrations. Do not modify model configuration or switch providers to reproduce them. Use inherited model settings for permitted independent review; otherwise perform distinct passes sequentially and describe that limitation accurately. References to arena, swarm or poteto-mode describe methodology, not installed dependencies.

Stay within the authorized task. External messages, publishing, merging, deployment and destructive cleanup retain their normal authorization boundaries. Use connected sources where available, distinguish observation from inference, and do not treat a skill as permission for unrelated work.

## Supporting material

The detailed upstream method and references are retained in [UPSTREAM.md](UPSTREAM.md). Consult relevant technical sections as needed, using the Codex mapping above for host-specific steps.
