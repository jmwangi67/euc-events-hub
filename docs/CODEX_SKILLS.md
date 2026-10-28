# EUC repository skills

The repository includes 20 skills in `.agents/skills/`: 19 selected from the previously prepared local collection, plus `euc-architecture`. These are development instructions and supporting reference data. They do not change application behavior or install application packages.

## Scope and selection

| Work                               | Skills                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| UI direction and review            | `web-craft`, `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`                  |
| React and TypeScript               | `vercel-react-best-practices`, `vercel-composition-patterns`, `typescript-best-practices` |
| Motion                             | `emil-design-eng`, `animate`, `animation-performance`, `review-animations`                |
| Browser verification               | `playwright`, `playwright-cli`                                                            |
| Engineering and documentation      | `architect`, `blast-radius`, `interrogate`, `tdd`, `technical-writing`                    |
| Local architectural mapping        | `euc-architecture`                                                                        |
| Approved future component adoption | `shadcn`                                                                                  |

Skills are selected by task relevance; availability does not require loading or executing every skill. Preserve EUC's approved architecture, compact calendar layout, IBM Plex Sans, semantic tokens and Eastern Time rules. UI/UX search results are advisory. They do not replace `docs/DESIGN_SYSTEM.md` or authorize new packages, a new design system, GSAP, shadcn, or Supabase.

The broader personal library, job-search, watermark and WordPress workflows are outside this repository's scope. UI/UX Pro Max supplies the requested design-intelligence option; a second taste library is not duplicated here.

Sources and captured upstream revisions are in [the source manifest](../.agents/skill-sources.json). Individual licenses, attribution, and existing upstream snapshots remain with their skills. [Third-party notices](../.agents/THIRD_PARTY_NOTICES.md) describe the terms and local adaptations. Captured star counts and update dates are provenance snapshots, not live repository statistics. No upstream refresh was performed for this PR.

## Codex Cloud compatibility

Checked against official documentation on October 28, 2026:

- Codex discovers repository skills under `.agents/skills/`; each definition has YAML `name` and `description`. See [Build skills](https://learn.chatgpt.com/docs/build-skills).
- Repository skills are available in cloud tasks. Personal skills from a local computer do not sync into cloud environments. See [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments).
- Legacy Codex environments support setup/maintenance scripts and separate agent-network settings. See [Codex Cloud (Legacy)](https://learn.chatgpt.com/docs/environments/cloud-environment). Follow the settings for the environment actually in use; a local install is not evidence that a cloud VM has the same tools.

These checks establish repository discovery and package compatibility. This PR was prepared on Windows; it does not claim an end-to-end run in the owner's Codex Cloud environment or change its settings. Official current Cloud documentation lists computer/browser use as a limitation. Check the selected host's capabilities before promising browser verification. Terminal Playwright requires a working browser runtime and Linux libraries; a skill alone supplies neither.

## Runtime requirements

| Capability                   | Requirement and verification                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instruction/reference skills | No additional runtime installation. Resolve references relative to the loaded `SKILL.md`. Local and repository skills with the same name can both appear; use the repository path when disambiguation is necessary.                                                                                                                                        |
| Application checks           | Use the existing `.nvmrc`, `package-lock.json`, npm scripts and CI workflow. Node must satisfy `package.json` (`>=22.13.0`).                                                                                                                                                                                                                               |
| UI/UX local search           | Python 3.10+ and bundled CSV files; no pip dependencies. Example from the repository root: `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "focus not obscured" --domain ux`.                                                                                                                                                                      |
| Graphify AST                 | Existing `graphifyy==0.9.92`, Python >=3.10, NetworkX, NumPy, RapidFuzz and tree-sitter grammars. No semantic/provider extras or API key. Exact versions installed locally were checked against public PyPI metadata: all 30 packages have universal or compatible CPython 3.12 Linux x86-64 wheels. This is a metadata check, not a cloud execution test. |
| Browser verification         | Prefer locked project `@playwright/test` and existing npm scripts. The optional `@playwright/cli` helper is separate and can fetch packages when invoked. Confirm browser/network availability first; do not install it automatically.                                                                                                                     |
| shadcn / animation examples  | Conditional reference material only. No shadcn configuration or GSAP dependency was added.                                                                                                                                                                                                                                                                 |

Graphify is already installed locally; no additional local installation is needed. On a cloud host where it is absent, first inspect Python, architecture, `graphify --help`, package/network policy and available tools. For a compatible Linux x86-64/Python 3.12 environment, an optional isolated setup is:

```bash
python3 -m venv work/graphify-venv
work/graphify-venv/bin/python -m pip install 'graphifyy==0.9.92'
work/graphify-venv/bin/graphify --help
```

Provision this during environment setup if package downloads are restricted during tasks. The top-level version is pinned; transitive packages are resolved by pip, so record the resulting versions. Do not use the unrelated npm package named `graphify`, install all extras, or configure a paid LLM provider. For other CPU/Python combinations, verify wheel support first. No installation in this example was executed for this PR.

## Architecture workflow and privacy

Use [the EUC architecture skill](../.agents/skills/euc-architecture/SKILL.md). The initial run is `graphify . --code-only`. `.graphifyignore` excludes private data, scratch output, installed dependencies and skill helper code. `/graphify-out/` is also gitignored. Neither an ignore file nor a code-only flag makes a pre-existing mixed graph safe: start with a clean output location.

Keep raw graphs, cache files, local paths, HTML and reports generated from private sources out of commits. This PR retains a [source-checked architectural review](reviews/GRAPHIFY_ARCHITECTURE.md), with no raw generated graph files or private dataset contents.
