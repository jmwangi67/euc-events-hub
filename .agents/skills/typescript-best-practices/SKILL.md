---
name: typescript-best-practices
description: Design, implement or review TypeScript and TSX types, schemas, state models and application code.
license: See LICENSE
---

# Typescript Best Practices

Use the repository version and conventions. Parse untrusted data at boundaries and derive types from authoritative schemas. Model variants with discriminated unions, exhaust cases and avoid impossible optional-field combinations. Brand semantic primitives when confusing them has a real cost. Prefer inference and generic relationships over any or casts; avoid abstractions that obscure the caller.

## Codex integration

Use current Codex tools and model settings. Cursor/Claude tool names, model slugs, pstack-models.mdc, Bugbot and origin in the upstream reference are not requirements or installed integrations. Do not modify model configuration or switch providers to reproduce them. Use inherited model settings for permitted independent review; otherwise perform distinct passes sequentially and describe that limitation accurately. References to arena, swarm or poteto-mode describe methodology, not installed dependencies.

Stay within the authorized task. External messages, publishing, merging, deployment and destructive cleanup retain their normal authorization boundaries. Use connected sources where available, distinguish observation from inference, and do not treat a skill as permission for unrelated work.

## Supporting material

The detailed upstream method and references are retained in [UPSTREAM.md](UPSTREAM.md). Consult relevant technical sections as needed, using the Codex mapping above for host-specific steps.
