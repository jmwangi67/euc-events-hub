---
name: tdd
description: Use for requested TDD or regression tests, or a bug with an obvious cheap local behavior test.
license: See LICENSE
---

# Tdd

Write a focused failing test of the observable bug. Verify that it fails for the intended reason, make the smallest useful fix, then run targeted tests and appropriate project checks. Refactor after green. Avoid source-text or implementation-mirroring tests. Use live verification when the only test path is expensive or unclear.

## Codex integration

Use current Codex tools and model settings. Cursor/Claude tool names, model slugs, pstack-models.mdc, Bugbot and origin in the upstream reference are not requirements or installed integrations. Do not modify model configuration or switch providers to reproduce them. Use inherited model settings for permitted independent review; otherwise perform distinct passes sequentially and describe that limitation accurately. References to arena, swarm or poteto-mode describe methodology, not installed dependencies.

Stay within the authorized task. External messages, publishing, merging, deployment and destructive cleanup retain their normal authorization boundaries. Use connected sources where available, distinguish observation from inference, and do not treat a skill as permission for unrelated work.

## Supporting material

The detailed upstream method and references are retained in [UPSTREAM.md](UPSTREAM.md). Consult relevant technical sections as needed, using the Codex mapping above for host-specific steps.
