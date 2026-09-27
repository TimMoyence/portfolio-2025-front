---
name: gitnexus-area-deck
description: "Skill for the Deck area of portfolio-2025-front. 31 symbols across 6 files."
---

# Deck

31 symbols | 6 files | Cohesion: 87%

## When to Use

- Working with code in `src/`
- Understanding how onScroll, onHashChange, goTo work
- Modifying deck-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/shared/slides/deck/slide-deck.component.ts` | onScroll, avecLesSections, defilerVersLaVoisine, handleKeyboard, scrollToSibling (+12) |
| `src/app/shared/slides/deck/fullscreen.adapter.ts` | enter, exit, isBrowser, isFullscreen, loadSwiperElement |
| `src/cours/runtime/core/deck.ts` | goTo, next, previous |
| `src/app/shared/slides/deck/slide-deck.service.ts` | next, previous, step |
| `src/app/shared/slides/deck/slide-deck.component.spec.ts` | monterLeDeck, monterLeDeckDeDemonstration |
| `src/testing/factories/slide-deck.factory.ts` | buildSlideDeckConfig |

## Entry Points

Start here when exploring this area:

- **`onScroll`** (Function) — `src/app/shared/slides/deck/slide-deck.component.ts:187`
- **`onHashChange`** (Function) — `src/app/shared/slides/deck/slide-deck.component.ts:146`
- **`goTo`** (Function) — `src/cours/runtime/core/deck.ts:54`
- **`next`** (Function) — `src/cours/runtime/core/deck.ts:66`
- **`previous`** (Function) — `src/cours/runtime/core/deck.ts:67`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `onScroll` | Function | `src/app/shared/slides/deck/slide-deck.component.ts` | 187 |
| `onHashChange` | Function | `src/app/shared/slides/deck/slide-deck.component.ts` | 146 |
| `goTo` | Function | `src/cours/runtime/core/deck.ts` | 54 |
| `next` | Function | `src/cours/runtime/core/deck.ts` | 66 |
| `previous` | Function | `src/cours/runtime/core/deck.ts` | 67 |
| `buildSlideDeckConfig` | Function | `src/testing/factories/slide-deck.factory.ts` | 2 |
| `avecLesSections` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 206 |
| `defilerVersLaVoisine` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 313 |
| `handleKeyboard` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 272 |
| `scrollToSibling` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 309 |
| `suivreLaSectionAuMilieu` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 218 |
| `syncCurrentFromScroll` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 214 |
| `toggleFullscreen` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 245 |
| `enter` | Method | `src/app/shared/slides/deck/fullscreen.adapter.ts` | 12 |
| `exit` | Method | `src/app/shared/slides/deck/fullscreen.adapter.ts` | 26 |
| `isBrowser` | Method | `src/app/shared/slides/deck/fullscreen.adapter.ts` | 8 |
| `isFullscreen` | Method | `src/app/shared/slides/deck/fullscreen.adapter.ts` | 40 |
| `loadSwiperElement` | Method | `src/app/shared/slides/deck/fullscreen.adapter.ts` | 47 |
| `bootstrapInitialSlide` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 125 |
| `requestedHashId` | Method | `src/app/shared/slides/deck/slide-deck.component.ts` | 158 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnScroll → DansLesBornes` | cross_community | 6 |
| `NgAfterViewInit → DansLesBornes` | cross_community | 6 |
| `OnScroll → Notifier` | cross_community | 5 |
| `NgAfterViewInit → Notifier` | cross_community | 5 |
| `OnHashChange → DansLesBornes` | cross_community | 5 |
| `OnScroll → DeckRef` | intra_community | 4 |
| `HandleKeyboard → DeckRef` | intra_community | 4 |
| `OnHashChange → Notifier` | cross_community | 4 |
| `NgAfterViewInit → DeckRef` | cross_community | 4 |
| `SynchroniserDepuisSwiper → DansLesBornes` | cross_community | 4 |

## How to Explore

1. `context({name: "onScroll"})` — see callers and callees
2. `query({search_query: "deck"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
