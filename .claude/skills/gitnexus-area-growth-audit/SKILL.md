---
name: gitnexus-area-growth-audit
description: "Skill for the Growth-audit area of portfolio-2025-front. 42 symbols across 6 files."
---

# Growth-audit

42 symbols | 6 files | Cohesion: 90%

## When to Use

- Working with code in `src/`
- Understanding how formatProgressStep, error, next work
- Modifying growth-audit-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/features/growth-audit/growth-audit.component.ts` | error, next, next, onError, onSuccess (+16) |
| `src/app/features/growth-audit/growth-audit-format.utils.ts` | formatProgressStep, buildSectionBadges, extractRecord, extractString, extractStringArray (+6) |
| `src/app/core/adapters/audit-request-http.adapter.ts` | stream, submit, getSummary |
| `src/app/core/ports/audit-request.port.ts` | stream, submit, getSummary |
| `src/app/features/growth-audit/growth-audit.component.spec.ts` | buildValidForm, soumettreEtDiffuser, remplirEtSoumettre |
| `src/testing/factories/audit-request.factory.ts` | buildAuditCreateResponse |

## Entry Points

Start here when exploring this area:

- **`formatProgressStep`** (Function) — `src/app/features/growth-audit/growth-audit-format.utils.ts:105`
- **`error`** (Function) — `src/app/features/growth-audit/growth-audit.component.ts:446`
- **`next`** (Function) — `src/app/features/growth-audit/growth-audit.component.ts:415`
- **`next`** (Function) — `src/app/features/growth-audit/growth-audit.component.ts:357`
- **`onError`** (Function) — `src/app/features/growth-audit/growth-audit.component.ts:305`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GrowthAuditComponent` | Class | `src/app/features/growth-audit/growth-audit.component.ts` | 65 |
| `formatProgressStep` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 105 |
| `error` | Function | `src/app/features/growth-audit/growth-audit.component.ts` | 446 |
| `next` | Function | `src/app/features/growth-audit/growth-audit.component.ts` | 415 |
| `next` | Function | `src/app/features/growth-audit/growth-audit.component.ts` | 357 |
| `onError` | Function | `src/app/features/growth-audit/growth-audit.component.ts` | 305 |
| `onSuccess` | Function | `src/app/features/growth-audit/growth-audit.component.ts` | 282 |
| `buildSectionBadges` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 87 |
| `extractRecord` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 71 |
| `extractString` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 78 |
| `extractStringArray` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 82 |
| `formatPhaseLabel` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 6 |
| `formatSectionLabel` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 39 |
| `formatSubTaskLabel` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 34 |
| `formatTaskLabel` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 20 |
| `buildAuditCreateResponse` | Function | `src/testing/factories/audit-request.factory.ts` | 10 |
| `error` | Function | `src/app/features/growth-audit/growth-audit.component.ts` | 358 |
| `formatSummaryText` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 125 |
| `sectionBadgeClass` | Function | `src/app/features/growth-audit/growth-audit-format.utils.ts` | 56 |
| `stream` | Method | `src/app/core/adapters/audit-request-http.adapter.ts` | 38 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Next → Stream` | intra_community | 3 |
| `Next → Stream` | intra_community | 3 |
| `Next → StopStream` | cross_community | 3 |
| `HandleStreamEvent → ExtractRecord` | cross_community | 3 |
| `HandleStreamEvent → ExtractString` | cross_community | 3 |
| `HandleStreamEvent → FormatPhaseLabel` | cross_community | 3 |
| `HandleStreamEvent → ResetAuditTimeline` | cross_community | 3 |
| `OnSuccess → Stream` | intra_community | 3 |
| `OnSuccess → Stream` | intra_community | 3 |
| `OnSuccess → StopStream` | cross_community | 3 |

## How to Explore

1. `context({name: "formatProgressStep"})` — see callers and callees
2. `query({search_query: "growth-audit"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
