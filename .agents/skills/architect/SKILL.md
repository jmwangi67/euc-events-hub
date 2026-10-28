---
name: architect
description: Design caller usage, types, interfaces and module ownership before a substantial feature or refactor.
license: See LICENSE
---

# Architect

Ground the design in current callers and runtime flow. Sketch caller usage first, then types, signatures and ownership. Compare structurally different designs when the choice is consequential. Use the design-red-flags reference, implement the chosen shape, and revisit it if the same workaround recurs. Proceed with reversible implementation unless the user requested a design checkpoint.

## Codex integration

Use current Codex tools and model settings. Cursor/Claude tool names, model slugs, pstack-models.mdc, Bugbot and origin in the upstream reference are not requirements or installed integrations. Do not modify model configuration or switch providers to reproduce them. Use inherited model settings for permitted independent review; otherwise perform distinct passes sequentially and describe that limitation accurately. References to arena, swarm or poteto-mode describe methodology, not installed dependencies.

Stay within the authorized task. External messages, publishing, merging, deployment and destructive cleanup retain their normal authorization boundaries. Use connected sources where available, distinguish observation from inference, and do not treat a skill as permission for unrelated work.

## Supporting material

The detailed upstream method and references are retained in [UPSTREAM.md](UPSTREAM.md). Consult relevant technical sections as needed, using the Codex mapping above for host-specific steps.
