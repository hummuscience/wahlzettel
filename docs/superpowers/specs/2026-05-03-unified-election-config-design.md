# Unified Election Config — Design Spec

**Date:** 2026-05-03
**Branch:** `unified-election-config`
**Goal:** Refactor the Wahlzettel app from a Süd-Kommunal-centric architecture into a multi-archetype platform that can express every German election type, on a single config schema, once and for all.

## Motivation

The app today supports three election types via one `ElectionConfig` interface and two ballot components:

- **Süd-Kommunal Kommunalwahl** (Hessen, Bayern) — the original target. Drives `BallotView`, `voteReducer`, `PartyPage`.
- **BW Landtagswahl** — bolted on with `type: 'landtagswahl'` and a separate `LandtagswahlBallot` component.

Berlin's elections (Sep 2026) don't fit either path:

- **Abgeordnetenhauswahl** — Bund-style 2-vote MMP. Closer to BW Landtag than Süd-Kommunal, but with 78 Wahlkreise and 12 Bezirkslisten, plus a single combined ballot (2025 reform).
- **Bezirksverordnetenversammlung (BVV)** — pure closed-list, one X per ballot. Has no analogue in the current code.

Adding Berlin alone would mean two more bolt-ons. With **9+ further elections** in the 2026/2027 horizon — Sachsen-Anhalt, Niedersachsen Kommunal, Mecklenburg-Vorpommern, Saarland, Schleswig-Holstein, NRW, Bremen, Niedersachsen, plus rolling Bürgermeister direct elections and Volksentscheide — the bolt-on approach collapses.

This refactor picks one schema and one architecture broad enough to cover **every German election type**, including those we won't model immediately.

## Scope

### In scope

- Replace `ElectionConfig` with a discriminated union over **`ballotKind`**.
- Introduce a **per-archetype module structure** under `src/archetypes/`. Each module owns its own ballot component, vote reducer, vote-state shape, share encoding, and Spickzettel print view.
- Migrate the **50 existing election configs** to the new schema in one mechanical pass.
- Implement Berlin's two archetypes (`mmp-2vote`, `closed-list`) end-to-end, including data files for the 20.09.2026 election.
- Stub the remaining 7 archetypes — define their config types and minimal Ballot components — so adding the next election only requires data, not architectural work.

### Out of scope

- Per-election candidate data for elections beyond Berlin (those are added election-by-election as their data sources publish).
- Sozialwahlen, Kirchenwahlen, Personalratswahlen — fragmented and out of audience.
- Bundespräsidentenwahl 30.01.2027 — Bundesversammlung, not a voter ballot.
- The user's pre-existing WIP (CandidateRow / PartyPage / PrintSpickzettel / types.ts) — those are separate from the refactor and live on the branch as inherited uncommitted state. The refactor will subsume them when it touches those files.

### Non-goals

- No backwards compatibility shim for the old config shape. The rename is mechanical, the data is authoritative, and a runtime adapter would only add complexity.
- No support for the Süd-Kommunal mechanics outside its own archetype. Other archetypes do not get to "borrow" Süd-Kommunal's reducer.

## The Ballot Archetypes

Ten archetypes cover every voter-ballot election in Germany:

| `ballotKind` | Mechanics | Election examples |
|---|---|---|
| `sued-kommunal` | N≈seats votes, kumulieren ≤3, panaschieren, striking, Listenkreuz | HE/BY/BW/RP Kommunal — current code |
| `ost-kommunal` | exactly 3 votes, kumulieren ≤3, panaschieren, optional Listenstimme | NI Kommunal + 5 Ost-Länder Kommunal |
| `mmp-2vote` | Erststimme + Zweitstimme on 1 ballot, closed list | Bundestag, BE Abgh, ST/MV/SH/NRW Landtag, BW Landtag (today) |
| `closed-list` | one X for one party list | BE BVV, SL Kommunal, Europawahl |
| `closed-list-direkt` | 1 X = Wahlkreis candidate + their party's list (combined) | NRW Kommunal, SL Landtag |
| `hamburg-2x5` | 2 ballots × 5 votes; red=Wahlkreis, yellow=Liste; full kumulieren+panaschieren | HH Bürgerschaft, HH Bezirk |
| `bremen-1x5` | 1 ballot × 5 votes; per-party block with list-cell + candidate rows | HB Bürgerschaft, Stadtbürgerschaft, Bremerhaven SVV, Beirat |
| `bayern-landtag` | Erst+Zweit, Zweitstimme = X for individual on open Wahlkreisliste; E+Z summed | BY Landtag (2028) |
| `single-candidate` | 1 X for 1 person, optional Stichwahl | Bürgermeister, OB, Landrat |
| `referendum` | Yes/No (optionally Gegenvorschlag) | Volksentscheide |

Initial implementation depth:

- **Implemented end-to-end (3):** `sued-kommunal` (migrated from existing code), `mmp-2vote` (existing BW Landtag generalised + Berlin Abgh added), `closed-list` (Berlin BVV).
- **Stubbed (7):** every other archetype gets its config type, a placeholder Ballot component that renders "Coming soon" with the ballot's expected layout sketched out, and a stub reducer. This locks in the schema commitment without requiring full UX work for elections that aren't on the immediate roadmap.

## Architecture

### File layout

```
src/
  archetypes/
    sued-kommunal/
      Ballot.tsx              moved from components/ballot/BallotView.tsx
      voteReducer.ts          moved from src/voteReducer.ts (current shape)
      types.ts                SuedKommunalConfig, SuedKommunalState
      dataSchema.ts           runtime validation of public/data/*.json
      share.ts                share-link encoding (current scheme)
      Spickzettel.tsx         moved from components/ballot/PrintSpickzettel.tsx
      WalkthroughSection.tsx  moved from current Walkthrough flow
    mmp-2vote/                Berlin Abgh, ST, MV, SH, NRW Landtag, BW Landtag
      Ballot.tsx              generalised LandtagswahlBallot
      voteReducer.ts
      types.ts
      dataSchema.ts
      share.ts
    closed-list/              Berlin BVV, Saarland Kommunal, Europawahl
      Ballot.tsx
      voteReducer.ts          (trivial: pick one party)
      types.ts
      dataSchema.ts
      share.ts
    ost-kommunal/             stub
    closed-list-direkt/       stub
    hamburg-2x5/              stub
    bremen-1x5/               stub
    bayern-landtag/           stub
    single-candidate/         stub
    referendum/               stub
    index.ts                  ARCHETYPES registry: ballotKind → module
  elections/
    {slug}/config.ts          unchanged location; type narrows to one union member
    registry.ts               unchanged shape; ELECTIONS list grows
  components/                 shared shell: Header, ElectionPicker, Footer, etc.
  ...
```

### Discriminated-union config

```ts
// src/elections/types.ts
export type ElectionConfig =
  | SuedKommunalConfig
  | OstKommunalConfig
  | Mmp2VoteConfig
  | ClosedListConfig
  | ClosedListDirektConfig
  | Hamburg2x5Config
  | Bremen1x5Config
  | BayernLandtagConfig
  | SingleCandidateConfig
  | ReferendumConfig;

interface ElectionBase {
  id: string;                  // 'frankfurt-stvv'
  slug: string;                // URL path segment
  shareTypeCode: number;       // existing 0..N for share links
  ballotKind: BallotKind;      // discriminator

  level: 'bund' | 'land' | 'kommunal' | 'sub-kommunal' | 'referendum';
  date: string;                // ISO yyyy-mm-dd
  region: { land: string; bezirk?: string; gemeinde?: string };

  themeColor: string;
  themeColorLight: string;
  themeColorDark: string;
  dataFile: string;
  partyColors: Record<string, string>;
  infoUrl?: string;
}

export interface SuedKommunalConfig extends ElectionBase {
  ballotKind: 'sued-kommunal';
  totalStimmen: number;                  // 93, 71, ...
  maxPerCandidate: 3;                    // currently always 3
  allowListVote: boolean;                // Listenkreuz
  allowMultipleListVotes: boolean;       // Bayern: multi Listenkreuz
  candidateNumbering?: 'list-prefix';    // Hessen pattern
  listenkreuzMode: 'cycling' | 'perCandidateOnce'; // HE vs BY mechanics
}

export interface Mmp2VoteConfig extends ElectionBase {
  ballotKind: 'mmp-2vote';
  threshold: 5 | 0;
  grundmandatsklausel: number | null;    // direct seats that bypass threshold
  seatMethod: 'dhondt' | 'hareNiemeyer' | 'sainteLague';
  minorityExempt?: boolean;              // SSW (SH), Sorben (BB)
  hasOverhang: boolean;                  // false for Bundestag post-2023
  combinedBallot: boolean;               // true since 2026 Berlin reform
}

export interface ClosedListConfig extends ElectionBase {
  ballotKind: 'closed-list';
  threshold: number;                     // 0, 3 (BE BVV), 5 (SL Landtag), 0 (EU since 2014)
  seatMethod: 'dhondt' | 'hareNiemeyer' | 'sainteLague';
  hasDirectMandate?: false;              // by definition
}

// The other seven follow the same pattern; full types in src/archetypes/*/types.ts
```

The base interface stays small. Mechanics live on each variant. Existing configs are valid `SuedKommunalConfig` after one mechanical rename (`type` → `ballotKind`, plus filling `level`, `date`, `region`, `listenkreuzMode`).

### Routing & dispatch

`src/archetypes/index.ts` exports a registry:

```ts
export interface ArchetypeModule {
  Ballot: ComponentType<BallotProps>;
  Spickzettel?: ComponentType<SpickzettelProps>;
  loadData(slug: string): Promise<unknown>; // returns archetype-specific shape
  initialState(config: ElectionConfig, data: unknown): VoteState;
  voteReducer(state: VoteState, action: VoteAction): VoteState;
  encodeShare(state: VoteState, config: ElectionConfig): string;
  decodeShare(s: string, config: ElectionConfig): VoteState;
}

export const ARCHETYPES: Record<BallotKind, () => Promise<ArchetypeModule>> = {
  'sued-kommunal':       () => import('./sued-kommunal'),
  'mmp-2vote':           () => import('./mmp-2vote'),
  'closed-list':         () => import('./closed-list'),
  'ost-kommunal':        () => import('./ost-kommunal'),
  'closed-list-direkt':  () => import('./closed-list-direkt'),
  'hamburg-2x5':         () => import('./hamburg-2x5'),
  'bremen-1x5':          () => import('./bremen-1x5'),
  'bayern-landtag':      () => import('./bayern-landtag'),
  'single-candidate':    () => import('./single-candidate'),
  'referendum':          () => import('./referendum'),
};
```

Each archetype folder's `index.ts` re-exports the `ArchetypeModule` shape; `Promise<ArchetypeModule>` is the dynamic-import return type.

`App.tsx` becomes a thin shell:

```tsx
const archetype = await ARCHETYPES[config.ballotKind]();
return (
  <ElectionProvider config={config}>
    <Shell>
      <archetype.Ballot config={config} data={data} state={state} dispatch={dispatch} />
    </Shell>
  </ElectionProvider>
);
```

The current switch in App.tsx for `type === 'landtagswahl'` collapses into the registry. Header, Footer, ElectionContext, CitizenshipChoice — unchanged. ElectionPicker grows: it currently lists Hessen cities, Bayern cities, and BW; it will gain Berlin (with a Bezirk picker for both Abgh's Bezirksliste choice and BVV) and any other elections we onboard. The walkthrough/tour stays Süd-Kommunal-only because its concepts (Kombinieren, Streichen, Listenkreuz) only apply there; other archetypes get a brief one-screen intro instead.

### State and reducers

Each archetype owns its own `VoteState`, `VoteAction`, and `voteReducer`. They never share. Examples:

- `sued-kommunal`: existing `{ candidateVotes, listSelections, totalStimmen }` shape — moved as-is.
- `mmp-2vote`: `{ wahlkreisId: number | null, erststimme: candidateId | null, zweitstimme: listNumber | null }`.
- `closed-list`: `{ choice: listNumber | null }`.
- `hamburg-2x5`: `{ wahlkreisBallot: { candidateVotes }, landeslisteBallot: { listVotes, candidateVotes } }`.
- `bremen-1x5`: `{ votes: Record<string, number>, total: ≤5 }` where keys are `${partyId}:list` or `${partyId}:${candidateId}`.
- `referendum`: `{ choice: 'yes' | 'no' | 'alternative' | null }`.

The `derived` summary (`totalStimmenUsed`, `isComplete`, etc.) is also archetype-specific. The Süd-Kommunal-flavoured `VoteStatusBar` becomes Süd-Kommunal-only; other archetypes provide their own status display where useful.

### Share-link encoding

Each archetype owns its own share-encoding scheme inside `share.ts`. The outer envelope (`?s=…`) and `shareTypeCode` are unchanged so existing share links keep working. New archetypes get fresh codes.

### Data files

`public/data/*.json` shapes diverge per archetype. Each archetype's `dataSchema.ts` validates at load time. Berlin's data:

- `public/data/berlin-abgh.json` — `{ wahlkreise: [...78], landeslisten: [...], bezirkslisten: { [bezirk]: [...] } }`
- `public/data/berlin-bvv-{bezirk}.json` — one file per Bezirk, `{ parties: [...] }`. Twelve files; the picker chooses which one to load by Bezirk.

## Migration & Phasing

The branch ships in three waves. Each wave is a coherent commit range that compiles and runs.

### Wave 1 — Core refactor + Süd-Kommunal in its new home

Mechanical rename of all 50 existing configs. Move BallotView/PartyPage/voteReducer into `src/archetypes/sued-kommunal/`. App.tsx routes via the registry. BW Landtagswahl moves to `src/archetypes/mmp-2vote/` and continues to work.

**Acceptance:** every existing election URL renders the same UI as before; share links still decode; tests pass.

### Wave 2 — Berlin (mmp-2vote consolidation + closed-list)

Generalise `mmp-2vote` so Berlin Abgh works (78 Wahlkreise, list selection between Bezirksliste and Landesliste, single combined ballot UI). Build `closed-list` archetype for BVV. Add candidate data for both. Add Berlin's 12 Bezirke to the picker.

**Acceptance:** user can pick Berlin → Bezirk → vote on Abgh + BVV; Spickzettel prints correctly.

### Wave 3 — Stub the remaining seven archetypes

Each gets a config type, a placeholder Ballot component sketching the planned layout, a stub reducer, an entry in `ARCHETYPES`. No data, no real UX. The schema is complete; future elections plug in.

**Acceptance:** TypeScript compiles with all 10 union members; ARCHETYPES registry has 10 entries; adding a new election of any kind is a data-only change.

## Testing Strategy

- **Unit:** each archetype's `voteReducer` gets test cases per state transition. Migrate any existing Süd-Kommunal tests from current locations unchanged. (If no tests exist today, this refactor is the right time to add at least the reducer tests; that addition is small and worth doing.)
- **Migration sanity:** for the 50 existing configs, manually load each in the dev server and confirm the ballot renders identically post-rename. No formal snapshot harness; the migration is mechanical.
- **Share links:** decode tests for every existing `shareTypeCode` (0..47) to confirm backward compatibility. Existing share URLs in the wild MUST keep decoding.
- **Berlin end-to-end:** manual smoke test of voter flow (select Bezirk → cast Abgh erst+zweit → cast BVV X → reach summary → print Spickzettel).

## Risks & open trade-offs

- **Walkthrough/tour is currently Süd-Kommunal-specific.** Other archetypes get a minimal intro for now; designing per-archetype walkthroughs is out of scope for this refactor.
- **Berlin BVV data is by Bezirk, not citywide** — twelve separate JSON files. Adds a Bezirk-picker step before the BVV ballot, similar to how Hessen picks a city.
- **Berlin Abgh combined-ballot reform (2025)** — voters now mark Erst- and Zweitstimme on one sheet rather than two. Ballot UX must reflect this. Confirmed against the FAQ and 2025 Landeswahlordnung amendment.
- **Spickzettel exists only for Süd-Kommunal today.** Other archetypes don't have one yet; we add it per archetype as needed.
- **The user's pre-existing WIP (CandidateRow / PartyPage / PrintSpickzettel / types.ts) is on this branch as uncommitted state.** It will be subsumed when those files move during Wave 1. If it represented unfinished work that should land separately on `main`, it should be committed there first; otherwise it merges naturally into Wave 1.

## Sources

- [Berlin Landeswahlgesetz](docs/berlin-research/landeswahlgesetz.pdf), [Landeswahlordnung 2025](docs/berlin-research/landeswahlordnung.pdf) (downloaded)
- [Berlin FAQ 20.09.2026](https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/fragen-und-antwortkatalog/artikel.1646712.php)
- [wahlrecht.de — landtage and kommunal indices](https://www.wahlrecht.de/) (research backbone)
- [Bundestag — Gegenüberstellung der Landeswahlgesetze (Georgii)](https://www.bundestag.de/resource/blob/491688/12792d20230953a8cec5caeb01002eb5/Gegenueberstellung-der-Landeswahlgesetze.pdf)
- Per-Land Wahlgesetze quoted in the research reports compiled 2026-05-03.
