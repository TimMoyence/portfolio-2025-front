<!-- DUPLICATION : ce bloc GitNexus est identique à celui dans AGENTS.md (même sous-projet).
     Conservé car potentiellement injecté/lu automatiquement par le hook PostToolUse de GitNexus.
     Source de vérité : AGENTS.md. Si mise à jour nécessaire, synchroniser les deux fichiers. -->
<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **portfolio-2025-front** (3511 symbols, 8126 relationships, 150 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "master"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/portfolio-2025-front/context` | Codebase overview, check index freshness |
| `gitnexus://repo/portfolio-2025-front/clusters` | All functional areas |
| `gitnexus://repo/portfolio-2025-front/processes` | All execution flows |
| `gitnexus://repo/portfolio-2025-front/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Scripts area (58 symbols) | `.claude/skills/generated/scripts/SKILL.md` |
| Work in the Ports area (53 symbols) | `.claude/skills/generated/ports/SKILL.md` |
| Work in the Services area (46 symbols) | `.claude/skills/generated/services/SKILL.md` |
| Work in the Growth-audit area (36 symbols) | `.claude/skills/generated/growth-audit/SKILL.md` |
| Work in the Components area (32 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Server area (23 symbols) | `.claude/skills/generated/server/SKILL.md` |
| Work in the Adapters area (19 symbols) | `.claude/skills/generated/adapters/SKILL.md` |
| Work in the Auth area (16 symbols) | `.claude/skills/generated/auth/SKILL.md` |
| Work in the Pages area (15 symbols) | `.claude/skills/generated/pages/SKILL.md` |
| Work in the Seo area (14 symbols) | `.claude/skills/generated/seo/SKILL.md` |
| Work in the Factories area (12 symbols) | `.claude/skills/generated/factories/SKILL.md` |
| Work in the Navbar area (11 symbols) | `.claude/skills/generated/navbar/SKILL.md` |
| Work in the Deck area (11 symbols) | `.claude/skills/generated/deck/SKILL.md` |
| Work in the Interactions area (10 symbols) | `.claude/skills/generated/interactions/SKILL.md` |
| Work in the Learning-tooltip area (9 symbols) | `.claude/skills/generated/learning-tooltip/SKILL.md` |
| Work in the Sebastian area (9 symbols) | `.claude/skills/generated/sebastian/SKILL.md` |
| Work in the Asili-background area (8 symbols) | `.claude/skills/generated/asili-background/SKILL.md` |
| Work in the Demos area (8 symbols) | `.claude/skills/generated/demos/SKILL.md` |
| Work in the Profile area (6 symbols) | `.claude/skills/generated/profile/SKILL.md` |
| Work in the Sun-arc area (6 symbols) | `.claude/skills/generated/sun-arc/SKILL.md` |

<!-- gitnexus:end -->
