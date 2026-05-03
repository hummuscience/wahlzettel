# Unified Election Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Wahlzettel app from a Süd-Kommunal-centric architecture into a multi-archetype platform that can express every German election type, on a discriminated-union config schema.

**Architecture:** A discriminated union `ElectionConfig` keyed by `ballotKind`. Each archetype lives in `src/archetypes/<kind>/` as a self-contained module exposing a `Ballot`, `voteReducer`, `share`, and (optionally) `Spickzettel`. `App.tsx` becomes a thin shell that mounts the right archetype module from a registry.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind v4, react-i18next, useReducer + useMemo for state. Adds Vitest for unit tests. Branch: `unified-election-config`.

**Phasing:** Three waves, each commits independently and leaves the app in a working state.

- **Wave 1**: Add Vitest, introduce the union schema, factor existing Süd-Kommunal logic into `src/archetypes/sued-kommunal/`, factor existing BW Landtagswahl into `src/archetypes/mmp-2vote/`. App.tsx routes through a registry. No new elections yet.
- **Wave 2**: Generalise `mmp-2vote` for Berlin Abgh (Bezirksliste vs Landesliste, 78 Wahlkreise, combined ballot). Build `closed-list` archetype for Berlin BVV (12 Bezirke, one-X-per-list). Add candidate data, Bezirk picker, Spickzettel.
- **Wave 3**: Stub the remaining 7 archetypes (`ost-kommunal`, `closed-list-direkt`, `hamburg-2x5`, `bremen-1x5`, `bayern-landtag`, `single-candidate`, `referendum`) with config types, placeholder Ballots, registry entries.

Spec: `docs/superpowers/specs/2026-05-03-unified-election-config-design.md`.

---

## Wave 1: Schema + Refactor Existing Archetypes

### Task 1.1: Add Vitest test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/archetypes/.gitkeep`

- [ ] **Step 1: Install Vitest as dev dependency**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: Add `test` and `test:ui` scripts to `package.json`**

In the `"scripts"` section, add:
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
```

- [ ] **Step 4: Create the archetypes directory marker**

```bash
mkdir -p src/archetypes && touch src/archetypes/.gitkeep
```

- [ ] **Step 5: Smoke-test that vitest runs (no tests yet, exits 0)**

Run: `npm test`
Expected: `No test files found` and exit code 0 (or similar — Vitest is permissive about empty runs).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/archetypes/.gitkeep
git commit -m "Add Vitest test infrastructure for archetype refactor"
```

---

### Task 1.2: Define `BallotKind` and the discriminated-union shell

This task lays down the *type-only* skeleton. No archetype logic yet — just the union members declared as empty interfaces extending `ElectionBase`. Subsequent tasks fill them in.

**Files:**
- Modify: `src/elections/types.ts` (rewrite)

- [ ] **Step 1: Replace `src/elections/types.ts` with the union shell**

Full new content (replaces the existing 27 lines):

```ts
// Discriminator for every supported ballot type.
export type BallotKind =
  | 'sued-kommunal'
  | 'ost-kommunal'
  | 'mmp-2vote'
  | 'closed-list'
  | 'closed-list-direkt'
  | 'hamburg-2x5'
  | 'bremen-1x5'
  | 'bayern-landtag'
  | 'single-candidate'
  | 'referendum';

export interface ElectionBase {
  id: string;
  slug: string;
  shareTypeCode: number;
  ballotKind: BallotKind;

  level: 'bund' | 'land' | 'kommunal' | 'sub-kommunal' | 'referendum';
  date: string;                  // ISO yyyy-mm-dd
  region: { land: string; bezirk?: string; gemeinde?: string };

  themeColor: string;
  themeColorLight: string;
  themeColorDark: string;
  dataFile: string;
  partyColors: Record<string, string>;
  infoUrl?: string;
}

// Süd-Kommunal: N≈seats votes, kumulieren ≤3, panaschieren, striking, Listenkreuz.
export interface SuedKommunalConfig extends ElectionBase {
  ballotKind: 'sued-kommunal';
  totalStimmen: number;
  maxPerCandidate: 3;
  allowListVote: boolean;
  allowMultipleListVotes: boolean;
  candidateNumbering?: 'list-prefix';
  listenkreuzMode: 'cycling' | 'perCandidateOnce';
}

// MMP 2-vote: Erststimme + Zweitstimme on a single combined ballot.
export interface Mmp2VoteConfig extends ElectionBase {
  ballotKind: 'mmp-2vote';
  threshold: number;             // 0 or 5
  grundmandatsklausel: number | null;
  seatMethod: 'dhondt' | 'hareNiemeyer' | 'sainteLague';
  minorityExempt?: boolean;
  hasOverhang: boolean;
  combinedBallot: boolean;       // true for Berlin 2026, also for Bund
  hasBezirkslisten: boolean;     // Berlin: yes; Bund: no (Landeslisten only)
}

// Closed list: one X for one party list. Trivial.
export interface ClosedListConfig extends ElectionBase {
  ballotKind: 'closed-list';
  threshold: number;
  seatMethod: 'dhondt' | 'hareNiemeyer' | 'sainteLague';
}

// Stubs for archetypes not implemented in Wave 1/2. Empty marker interfaces;
// fields filled in when implemented (Wave 3).
export interface OstKommunalConfig extends ElectionBase {
  ballotKind: 'ost-kommunal';
}
export interface ClosedListDirektConfig extends ElectionBase {
  ballotKind: 'closed-list-direkt';
}
export interface Hamburg2x5Config extends ElectionBase {
  ballotKind: 'hamburg-2x5';
}
export interface Bremen1x5Config extends ElectionBase {
  ballotKind: 'bremen-1x5';
}
export interface BayernLandtagConfig extends ElectionBase {
  ballotKind: 'bayern-landtag';
}
export interface SingleCandidateConfig extends ElectionBase {
  ballotKind: 'single-candidate';
}
export interface ReferendumConfig extends ElectionBase {
  ballotKind: 'referendum';
}

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
```

- [ ] **Step 2: Run `tsc -b` to verify no immediate type errors in the unchanged files**

Run: `npx tsc -b --noEmit`
Expected: Many errors in existing config files (`type` is no longer a field, `ballotKind` is missing, etc.) AND in App.tsx (`allowMultipleListVotes` access). These are EXPECTED — they will be fixed in Tasks 1.3 and 1.4. Do not commit yet; the build is broken.

- [ ] **Step 3: Defer commit**

This task does not commit on its own. Move on to Task 1.3 immediately; Tasks 1.2–1.4 ship as a single commit at the end of Task 1.4 because the codebase doesn't compile in between.

---

### Task 1.3: Migrate the 48 existing election configs to the new schema

For each config under `src/elections/<slug>/config.ts`, perform a mechanical rewrite. The fields required for `SuedKommunalConfig`:
- replace `type: 'kommunalwahl'` (if present) with `ballotKind: 'sued-kommunal'`
- replace `type: 'landtagswahl'` (only `bw-landtagswahl`) with `ballotKind: 'mmp-2vote'`
- add `level`, `date`, `region`, `listenkreuzMode`, `allowMultipleListVotes` (if missing)
- ensure `maxPerCandidate: 3` is the literal `3` (TS checks union compatibility)

**Files:**
- Modify: every `src/elections/*/config.ts` (48 files)

- [ ] **Step 1: Migrate Hessen STVV configs**

The Hessen STVV/KAV configs share a pattern. Use `frankfurt-stvv` as the canonical example.

Open `src/elections/frankfurt-stvv/config.ts` and replace its body with:

```ts
import type { SuedKommunalConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: SuedKommunalConfig = {
  id: 'frankfurt-stvv',
  slug: 'frankfurt-stvv',
  shareTypeCode: 0,
  ballotKind: 'sued-kommunal',

  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Frankfurt am Main' },

  totalStimmen: 93,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',

  themeColor: '#003870',
  themeColorLight: '#e8f0f8',
  themeColorDark: '#002650',

  dataFile: 'frankfurt-stvv.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://frankfurt.de/wahlen',
};

export default config;
```

- [ ] **Step 2: Apply the same pattern to every other Hessen STVV/KAV config**

For each of `bad-homburg-stvv`, `dadi-kreistag`, `darmstadt-stvv`, `darmstadt-kav`, `frankfurt-kav`, `fulda-stvv`, `fulda-kav`, `giessen-stvv`, `giessen-kav`, `hanau-stvv`, `hanau-kav`, `kassel-stvv`, `kassel-kav`, `marburg-stvv`, `marburg-kav`, `offenbach-stvv`, `offenbach-kav`, `ruesselsheim-stvv`, `ruesselsheim-kav`, `wetzlar-stvv`, `wiesbaden-stvv`, `wiesbaden-kav`:

- Change `import type { ElectionConfig }` to `import type { SuedKommunalConfig }`.
- Change the `: ElectionConfig` annotation to `: SuedKommunalConfig`.
- Add `ballotKind: 'sued-kommunal'`.
- Add `level: 'kommunal'`, `date: '2026-03-15'`, `region: { land: 'HE', gemeinde: '<city>' }`.
- Add `allowMultipleListVotes: false`, `candidateNumbering: 'list-prefix'`, `listenkreuzMode: 'cycling'`.
- Remove `type: 'kommunalwahl'` if present.

(`dadi-kreistag` is a Kreistag, not a city: use `region: { land: 'HE', bezirk: 'Darmstadt-Dieburg' }`.)

- [ ] **Step 3: Migrate the 24 Bayern Stadtrat configs**

For each of `amberg-stadtrat`, `aschaffenburg-stadtrat`, `augsburg-stadtrat`, `bamberg-stadtrat`, `bayreuth-stadtrat`, `coburg-stadtrat`, `erlangen-stadtrat`, `fuerth-stadtrat`, `hof-stadtrat`, `ingolstadt-stadtrat`, `kaufbeuren-stadtrat`, `kempten-stadtrat`, `landshut-stadtrat`, `memmingen-stadtrat`, `muenchen-stadtrat`, `nuernberg-stadtrat`, `passau-stadtrat`, `regensburg-stadtrat`, `rosenheim-stadtrat`, `schwabach-stadtrat`, `schweinfurt-stadtrat`, `straubing-stadtrat`, `weiden-stadtrat`, `wuerzburg-stadtrat`:

- Change to `SuedKommunalConfig`.
- `ballotKind: 'sued-kommunal'`.
- `level: 'kommunal'`, `date: '2026-03-08'`, `region: { land: 'BY', gemeinde: '<city>' }`.
- `allowMultipleListVotes: true` (already present in Bayern configs as a flag — keep as `true`).
- `listenkreuzMode: 'perCandidateOnce'`.
- Drop `candidateNumbering` (Bayern doesn't use list-prefix numbering).

- [ ] **Step 4: Migrate `bw-landtagswahl/config.ts`**

This is the one MMP existing config. Replace its body with:

```ts
import type { Mmp2VoteConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: Mmp2VoteConfig = {
  id: 'bw-landtagswahl',
  slug: 'bw-landtagswahl',
  shareTypeCode: 22,
  ballotKind: 'mmp-2vote',

  level: 'land',
  date: '2026-03-08',
  region: { land: 'BW' },

  threshold: 5,
  grundmandatsklausel: null,
  seatMethod: 'sainteLague',
  hasOverhang: true,
  combinedBallot: true,
  hasBezirkslisten: false,

  themeColor: '#d4a017',
  themeColorLight: '#fdf6e3',
  themeColorDark: '#8b6914',

  dataFile: 'bw-landtagswahl.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.landtagswahl-bw.de',
};

export default config;
```

- [ ] **Step 5: Verify TS compiles after the migration**

Run: `npx tsc -b --noEmit`
Expected: errors only in App.tsx, hooks, and components that still reference `electionConfig.type`, `electionConfig.allowMultipleListVotes`, etc. on the bare `ElectionConfig` union (need narrowing). These are addressed in Task 1.4. Configs themselves should now type-check cleanly.

If you see errors INSIDE any `config.ts`, fix the field set on that file (likely a missing required field) and re-run.

- [ ] **Step 6: Defer commit (still part of the 1.2-1.4 batch)**

---

### Task 1.4: Move existing logic into `src/archetypes/sued-kommunal/` and `src/archetypes/mmp-2vote/`

This is a structural move. We don't refactor the *behaviour* in this task — we just relocate the code so the file layout matches the spec. App.tsx still has its `type === 'landtagswahl'` branch; the archetype registry comes in Task 1.5.

**Files:**
- Create: `src/archetypes/sued-kommunal/index.ts`
- Create: `src/archetypes/sued-kommunal/types.ts`
- Create: `src/archetypes/sued-kommunal/voteReducer.ts`
- Create: `src/archetypes/sued-kommunal/share.ts`
- Create: `src/archetypes/sued-kommunal/Ballot.tsx`
- Create: `src/archetypes/sued-kommunal/Spickzettel.tsx`
- Create: `src/archetypes/mmp-2vote/index.ts`
- Create: `src/archetypes/mmp-2vote/types.ts`
- Create: `src/archetypes/mmp-2vote/voteReducer.ts`
- Create: `src/archetypes/mmp-2vote/share.ts`
- Create: `src/archetypes/mmp-2vote/Ballot.tsx`
- Modify: `src/App.tsx`
- Delete: `src/hooks/useVoteState.ts` (moved into sued-kommunal)
- Delete: `src/components/ballot/BallotView.tsx` (becomes sued-kommunal Ballot)
- Delete: `src/components/ballot/PrintSpickzettel.tsx` (moves to sued-kommunal Spickzettel)
- Delete: `src/components/ballot/LandtagswahlBallot.tsx` (becomes mmp-2vote Ballot)

- [ ] **Step 1: Move `useVoteState` into `src/archetypes/sued-kommunal/voteReducer.ts`**

```bash
mkdir -p src/archetypes/sued-kommunal src/archetypes/mmp-2vote
git mv src/hooks/useVoteState.ts src/archetypes/sued-kommunal/voteReducer.ts
```

The file's contents stay the same for now. Update its imports if any are now broken (paths change from `../types` to `../../types`).

- [ ] **Step 2: Create `src/archetypes/sued-kommunal/types.ts`**

```ts
// Re-export the config type from the central union and the existing vote-state
// shapes for ergonomics in this archetype.
export type { SuedKommunalConfig } from '../../elections/types';
export type {
  VoteState as SuedKommunalState,
  VoteAction as SuedKommunalAction,
  CandidateVote,
  ListSelection,
  DerivedVoteState,
} from '../../types';
```

- [ ] **Step 3: Move BallotView into the archetype**

```bash
git mv src/components/ballot/BallotView.tsx src/archetypes/sued-kommunal/Ballot.tsx
```

Update the file's import paths (e.g. `../../types` → `../../types`, `./PartyBookmarks` → `../../components/ballot/PartyBookmarks` since PartyBookmarks stays in the shared components folder).

Verify imports compile by reading the file and running `npx tsc -b --noEmit`.

- [ ] **Step 4: Move PrintSpickzettel into the archetype**

```bash
git mv src/components/ballot/PrintSpickzettel.tsx src/archetypes/sued-kommunal/Spickzettel.tsx
```

Update imports.

- [ ] **Step 5: Create `src/archetypes/sued-kommunal/share.ts`**

This file extracts the Süd-Kommunal-specific bits of `src/utils/shareState.ts`. Initially, it re-exports from the existing utility (the full extraction happens in Task 1.6).

```ts
// Pass-through to the existing share-encoding utility for now.
// Task 1.6 will move the implementation here.
export { encodeVoteState, decodeVoteState } from '../../utils/shareState';
```

- [ ] **Step 6: Create `src/archetypes/sued-kommunal/index.ts`**

```ts
export { Ballot } from './Ballot';
export { Spickzettel } from './Spickzettel';
export { useVoteState as useSuedKommunalState } from './voteReducer';
export { encodeVoteState, decodeVoteState } from './share';
export type {
  SuedKommunalConfig,
  SuedKommunalState,
  SuedKommunalAction,
  CandidateVote,
  ListSelection,
  DerivedVoteState,
} from './types';
```

- [ ] **Step 7: Move LandtagswahlBallot into mmp-2vote**

```bash
git mv src/components/ballot/LandtagswahlBallot.tsx src/archetypes/mmp-2vote/Ballot.tsx
```

Update imports inside the moved file.

- [ ] **Step 8: Create `src/archetypes/mmp-2vote/types.ts`**

```ts
export type { Mmp2VoteConfig } from '../../elections/types';

export interface Mmp2VoteState {
  selectedWahlkreis: number | null;
  erststimme: string | null;       // candidateId
  zweitstimme: number | null;      // listNumber
}

export type Mmp2VoteAction =
  | { type: 'SET_WAHLKREIS'; wahlkreis: number }
  | { type: 'SET_ERSTSTIMME'; candidateId: string | null }
  | { type: 'SET_ZWEITSTIMME'; listNumber: number | null }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; state: Mmp2VoteState };
```

- [ ] **Step 9: Create `src/archetypes/mmp-2vote/voteReducer.ts`**

The current `LandtagswahlBallot.tsx` keeps its state in component-local `useState`. Pull that out into a reducer here so the architecture matches the rest:

```ts
import { useReducer } from 'react';
import type { Mmp2VoteState, Mmp2VoteAction } from './types';

const initialState: Mmp2VoteState = {
  selectedWahlkreis: null,
  erststimme: null,
  zweitstimme: null,
};

function reducer(state: Mmp2VoteState, action: Mmp2VoteAction): Mmp2VoteState {
  switch (action.type) {
    case 'SET_WAHLKREIS':
      // Switching Wahlkreis clears any erststimme bound to the previous one.
      return { ...state, selectedWahlkreis: action.wahlkreis, erststimme: null };
    case 'SET_ERSTSTIMME':
      return { ...state, erststimme: action.candidateId };
    case 'SET_ZWEITSTIMME':
      return { ...state, zweitstimme: action.listNumber };
    case 'RESET':
      return initialState;
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

export function useMmp2VoteState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}

export { reducer as mmp2VoteReducer, initialState as mmp2VoteInitialState };
```

Note: in this task we ADD this reducer but don't yet wire it into `Ballot.tsx`. The Ballot still uses local `useState`. Wiring the reducer in is a follow-up in Task 2.2 (when generalising for Berlin); leaving the existing useState in place keeps Wave 1 a pure structural move.

- [ ] **Step 10: Create `src/archetypes/mmp-2vote/share.ts`**

Stub for now; mmp-2vote share encoding ships in Task 1.6:

```ts
import type { Mmp2VoteState } from './types';

export function encodeMmp2VoteState(_state: Mmp2VoteState): string {
  // TODO: implement in Task 1.6 alongside Süd-Kommunal share extraction.
  // For Wave 1, BW Landtagswahl ballots cannot be shared via URL.
  return '';
}

export function decodeMmp2VoteState(_serialized: string): Mmp2VoteState {
  return { selectedWahlkreis: null, erststimme: null, zweitstimme: null };
}
```

- [ ] **Step 11: Create `src/archetypes/mmp-2vote/index.ts`**

```ts
export { LandtagswahlBallot as Ballot } from './Ballot';
export {
  useMmp2VoteState,
  mmp2VoteReducer,
  mmp2VoteInitialState,
} from './voteReducer';
export { encodeMmp2VoteState, decodeMmp2VoteState } from './share';
export type { Mmp2VoteConfig, Mmp2VoteState, Mmp2VoteAction } from './types';
```

- [ ] **Step 12: Update `src/App.tsx` imports to point at the new locations**

In `src/App.tsx`, change these imports:
- `import { useVoteState } from './hooks/useVoteState';` → `import { useSuedKommunalState as useVoteState } from './archetypes/sued-kommunal';`
- `import { BallotView } from './components/ballot/BallotView';` → `import { Ballot as BallotView } from './archetypes/sued-kommunal';`
- `import { LandtagswahlBallot } from './components/ballot/LandtagswahlBallot';` → `import { Ballot as LandtagswahlBallot } from './archetypes/mmp-2vote';`
- `import { PrintSpickzettel } from './components/ballot/PrintSpickzettel';` → `import { Spickzettel as PrintSpickzettel } from './archetypes/sued-kommunal';`

The `electionConfig.type === 'landtagswahl'` check needs updating. Replace with:
```ts
if (electionConfig.ballotKind === 'mmp-2vote') {
```

The `electionConfig?.allowMultipleListVotes` access on line ~62 needs narrowing:
```ts
const allowMultipleListVotes =
  electionConfig?.ballotKind === 'sued-kommunal'
    ? electionConfig.allowMultipleListVotes
    : false;
const { state, derived, dispatch, isListVoteActive, getListAllocation, resetBallot } =
  useVoteState(electionData, allowMultipleListVotes);
```

- [ ] **Step 13: Run `npx tsc -b --noEmit` and fix any remaining errors**

Most likely culprits: any other access of `electionConfig.type` or fields specific to Süd-Kommunal across `src/components/`, `src/hooks/`, `src/utils/`. Narrow each access with `if (electionConfig.ballotKind === 'sued-kommunal') { ... }` before reading those fields.

Run the build: `npm run build`
Expected: clean compile.

- [ ] **Step 14: Smoke-test in the browser**

Run: `npm run dev`
Visit `http://localhost:5173/frankfurt-stvv` and confirm the ballot renders identically to before. Visit `http://localhost:5173/bw-landtagswahl` and confirm the Landtagswahl ballot renders.

- [ ] **Step 15: Commit Tasks 1.2–1.4 together**

```bash
git add -A
git commit -m "Introduce ballotKind union, migrate configs, move Süd-Kommunal and mmp-2vote into archetype modules"
```

---

### Task 1.5: Build the archetype registry and route App.tsx through it

**Files:**
- Create: `src/archetypes/index.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Define the `ArchetypeModule` shape and registry**

Create `src/archetypes/index.ts`:

```ts
import type { ComponentType } from 'react';
import type { BallotKind } from '../elections/types';

export interface ArchetypeModule {
  // Each archetype's Ballot accepts archetype-specific props; we don't try to
  // unify the prop shape because doing so erases TypeScript's narrowing.
  // Consumers narrow on `config.ballotKind` and pass the correct module.
  Ballot: ComponentType<unknown>;
  Spickzettel?: ComponentType<unknown>;
}

export const ARCHETYPES: Record<BallotKind, () => Promise<ArchetypeModule>> = {
  'sued-kommunal':       () => import('./sued-kommunal').then(m => ({ Ballot: m.Ballot, Spickzettel: m.Spickzettel })),
  'mmp-2vote':           () => import('./mmp-2vote').then(m => ({ Ballot: m.Ballot })),
  'closed-list':         () => import('./closed-list').then(m => ({ Ballot: m.Ballot })),
  'ost-kommunal':        () => import('./ost-kommunal').then(m => ({ Ballot: m.Ballot })),
  'closed-list-direkt':  () => import('./closed-list-direkt').then(m => ({ Ballot: m.Ballot })),
  'hamburg-2x5':         () => import('./hamburg-2x5').then(m => ({ Ballot: m.Ballot })),
  'bremen-1x5':          () => import('./bremen-1x5').then(m => ({ Ballot: m.Ballot })),
  'bayern-landtag':      () => import('./bayern-landtag').then(m => ({ Ballot: m.Ballot })),
  'single-candidate':    () => import('./single-candidate').then(m => ({ Ballot: m.Ballot })),
  'referendum':          () => import('./referendum').then(m => ({ Ballot: m.Ballot })),
};
```

This will fail to compile until the stubs in Task 3 exist. To keep Wave 1 working, comment out the entries for unstubbed archetypes; Task 3.x will uncomment and add them.

For Wave 1, the registry has only:
```ts
export const ARCHETYPES: Partial<Record<BallotKind, () => Promise<ArchetypeModule>>> = {
  'sued-kommunal':  () => import('./sued-kommunal').then(m => ({ Ballot: m.Ballot, Spickzettel: m.Spickzettel })),
  'mmp-2vote':      () => import('./mmp-2vote').then(m => ({ Ballot: m.Ballot })),
};
```

(Use `Partial<>` until Wave 3 fills in every entry; Task 3.x will tighten it.)

- [ ] **Step 2: Note that App.tsx routing through the registry is deferred**

App.tsx still has its explicit `if (electionConfig.ballotKind === 'mmp-2vote')` branch from Task 1.4. The registry exists, but routing through it is more disruptive than necessary in Wave 1 — adding it now would force every archetype's data-loading + state-management seam to be designed before we need them, and the Wave 1 acceptance criterion (existing elections still work) is already met.

Defer the App.tsx → registry collapse to **Wave 3**, after every archetype has been stubbed and the data-loading interface is clear.

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 4: Commit**

```bash
git add src/archetypes/index.ts
git commit -m "Add archetype registry skeleton (mounting deferred to Wave 3)"
```

---

### Task 1.6: Extract share-link encoding into the Süd-Kommunal archetype

**Files:**
- Modify: `src/archetypes/sued-kommunal/share.ts` (rewrite)
- Modify: `src/utils/shareState.ts` (becomes a thin dispatcher)
- Create: `src/archetypes/sued-kommunal/share.test.ts`

The current `src/utils/shareState.ts` knows about Süd-Kommunal's state shape. Move that knowledge into the archetype. The shared `shareState.ts` keeps the outer envelope (`#b=...` URL parsing, share-code lookup) and dispatches to the archetype module.

- [ ] **Step 1: Write a regression test for share-link decoding**

Create `src/archetypes/sued-kommunal/share.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { encodeVoteState, decodeVoteState } from './share';
import type { SuedKommunalState } from './types';

describe('Süd-Kommunal share encoding', () => {
  it('round-trips a candidate-only vote state', async () => {
    const state: SuedKommunalState = {
      candidateVotes: {
        'frankfurt-stvv-1-3': { candidateId: 'frankfurt-stvv-1-3', partyListNumber: 1, stimmen: 3 },
        'frankfurt-stvv-2-1': { candidateId: 'frankfurt-stvv-2-1', partyListNumber: 2, stimmen: 1 },
      },
      listSelections: {},
    };
    const encoded = encodeVoteState(state, 'frankfurt-stvv');
    const decoded = await decodeVoteState(encoded.replace(/^#b=/, ''), 'binary');
    expect(decoded.electionType).toBe('frankfurt-stvv');
    expect(decoded.state.candidateVotes).toEqual(state.candidateVotes);
  });

  it('round-trips a list selection with strikes', async () => {
    const state: SuedKommunalState = {
      candidateVotes: {},
      listSelections: {
        1: {
          partyListNumber: 1,
          isSelected: true,
          struckCandidateIds: ['frankfurt-stvv-1-5', 'frankfurt-stvv-1-7'],
        },
      },
    };
    const encoded = encodeVoteState(state, 'frankfurt-stvv');
    const decoded = await decodeVoteState(encoded.replace(/^#b=/, ''), 'binary');
    expect(decoded.state.listSelections[1].isSelected).toBe(true);
    expect(decoded.state.listSelections[1].struckCandidateIds).toEqual([
      'frankfurt-stvv-1-5',
      'frankfurt-stvv-1-7',
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it currently passes (since `share.ts` re-exports the existing utility)**

Run: `npm test`
Expected: PASS — the existing utility's behaviour is being exercised through the re-export.

- [ ] **Step 3: Move the encoding implementation from `utils/shareState.ts` into `archetypes/sued-kommunal/share.ts`**

Replace the whole content of `src/archetypes/sued-kommunal/share.ts` with the `toBinary`, `fromBinary`, `fromCompact`, `encodeVoteState`, and `decodeVoteState` implementations currently in `src/utils/shareState.ts` — keep the function signatures identical so consumers (App.tsx, ShareDialog) don't change.

(Read `src/utils/shareState.ts` end-to-end and copy the relevant code into the new file. The legacy `LEGACY_SLUG_MAP`/`LEGACY_REV` can stay in the archetype since they're Süd-Kommunal-shaped state.)

- [ ] **Step 4: Replace `src/utils/shareState.ts` with a thin facade**

```ts
// Thin facade preserved for callers (App.tsx, ShareDialog). All Süd-Kommunal
// share logic lives in src/archetypes/sued-kommunal/share.ts.
//
// Future archetypes that support shareable ballots add their own share.ts and
// extend this facade with archetype-aware dispatch (Wave 2/3).
export {
  encodeVoteState,
  decodeVoteState,
  type ElectionType,
} from '../archetypes/sued-kommunal/share';
```

- [ ] **Step 5: Run tests + build**

Run: `npm test`
Expected: 2 tests pass.

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 6: Commit**

```bash
git add src/archetypes/sued-kommunal/share.ts src/archetypes/sued-kommunal/share.test.ts src/utils/shareState.ts
git commit -m "Move share-link encoding into Süd-Kommunal archetype, add round-trip test"
```

---

### Task 1.7: Wave 1 acceptance smoke test

- [ ] **Step 1: Run a representative sample of existing elections in dev mode**

```bash
npm run dev
```

Open each in turn and confirm the ballot renders identically to pre-refactor:
- `http://localhost:5173/frankfurt-stvv`
- `http://localhost:5173/muenchen-stadtrat`
- `http://localhost:5173/bw-landtagswahl`

For each: cast a vote, verify the vote indicator updates, hit Reset, hit Share, copy the URL, paste into a fresh tab, confirm the state reloads.

- [ ] **Step 2: Run the production build**

```bash
npm run build
```

Expected: succeeds. Bundle size should be roughly unchanged.

- [ ] **Step 3: Run the test suite**

```bash
npm test
```

Expected: all green (2 tests).

- [ ] **Step 4: Commit nothing — this task is verification only**

If the smoke test fails, fix forward: identify the regression, write a test that catches it, fix, commit. The user's WIP from before the refactor (`CandidateRow.tsx`, `PartyPage.tsx`) may have been displaced in Task 1.4 — if those changes still need preserving, restore them on top of the relocated files now.

---

## Wave 2: Berlin Abgh + BVV

### Task 2.1: Add Berlin election entries and i18n scaffolding

**Files:**
- Create: `src/elections/berlin-abgh/config.ts`
- Create: `src/elections/berlin-abgh/parties.ts`
- Create: `src/elections/berlin-abgh/i18n/de.json`
- Create: `src/elections/berlin-abgh/i18n/en.json`
- Create: `src/elections/berlin-bvv-{bezirk}/config.ts` × 12
- Create: `src/elections/berlin-bvv-{bezirk}/parties.ts` × 12
- Modify: `src/elections/registry.ts` (add 13 new entries)
- Modify: `src/i18n.ts` (extend `loadElectionI18n` if needed)

The 12 Berlin Bezirke: Charlottenburg-Wilmersdorf, Friedrichshain-Kreuzberg, Lichtenberg, Marzahn-Hellersdorf, Mitte, Neukölln, Pankow, Reinickendorf, Spandau, Steglitz-Zehlendorf, Tempelhof-Schöneberg, Treptow-Köpenick.

- [ ] **Step 1: Create `berlin-abgh` config skeleton**

`src/elections/berlin-abgh/config.ts`:
```ts
import type { Mmp2VoteConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: Mmp2VoteConfig = {
  id: 'berlin-abgh',
  slug: 'berlin-abgh',
  shareTypeCode: 48,
  ballotKind: 'mmp-2vote',

  level: 'land',
  date: '2026-09-20',
  region: { land: 'BE' },

  threshold: 5,
  grundmandatsklausel: 1,           // 1 direct mandate bypasses 5%
  seatMethod: 'hareNiemeyer',
  hasOverhang: true,
  combinedBallot: true,             // 2025 reform: single ballot sheet
  hasBezirkslisten: true,           // 12 Bezirkslisten + 1 Landesliste

  themeColor: '#e30613',            // Berlin red
  themeColorLight: '#fde7e8',
  themeColorDark: '#a3050d',

  dataFile: 'berlin-abgh.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/',
};

export default config;
```

`src/elections/berlin-abgh/parties.ts`:
```ts
// Per-election overrides for Berlin party colors. Empty until candidate data
// is in; falls back to the global PARTY_COLORS in src/data/partyColors.ts.
export const PARTY_COLORS: Record<string, string> = {};
```

- [ ] **Step 2: Create i18n stubs for Berlin Abgh**

`src/elections/berlin-abgh/i18n/de.json`:
```json
{
  "ballotTitle": "Stimmzettel zur Wahl zum Abgeordnetenhaus von Berlin",
  "electionDateValue": "20. September 2026",
  "electionName": "Wahl zum 20. Abgeordnetenhaus von Berlin",
  "electionShort": "Berlin · Abgeordnetenhaus 2026"
}
```

`src/elections/berlin-abgh/i18n/en.json`:
```json
{
  "ballotTitle": "Ballot for the Berlin House of Representatives election",
  "electionDateValue": "20 September 2026",
  "electionName": "Election to the 20th Berlin House of Representatives",
  "electionShort": "Berlin · House of Representatives 2026"
}
```

- [ ] **Step 3: Generate the 12 BVV configs**

Each Bezirk gets a folder `src/elections/berlin-bvv-<bezirk-slug>/` with `config.ts` and `parties.ts`. Use kebab-case slugs without umlauts (e.g. `friedrichshain-kreuzberg`, `tempelhof-schoeneberg`).

Template for `src/elections/berlin-bvv-mitte/config.ts`:
```ts
import type { ClosedListConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ClosedListConfig = {
  id: 'berlin-bvv-mitte',
  slug: 'berlin-bvv-mitte',
  shareTypeCode: 49,                // 49..60 for the 12 Bezirke
  ballotKind: 'closed-list',

  level: 'sub-kommunal',
  date: '2026-09-20',
  region: { land: 'BE', bezirk: 'Mitte' },

  threshold: 3,                     // BVV-specific
  seatMethod: 'dhondt',

  themeColor: '#e30613',
  themeColorLight: '#fde7e8',
  themeColorDark: '#a3050d',

  dataFile: 'berlin-bvv-mitte.json',
  partyColors: PARTY_COLORS,
  infoUrl: 'https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/',
};

export default config;
```

Each `parties.ts` is `export const PARTY_COLORS: Record<string, string> = {};`.

The 12 slugs and their `shareTypeCode` allocation:

| Bezirk | slug | shareTypeCode |
|---|---|---|
| Mitte | `berlin-bvv-mitte` | 49 |
| Friedrichshain-Kreuzberg | `berlin-bvv-friedrichshain-kreuzberg` | 50 |
| Pankow | `berlin-bvv-pankow` | 51 |
| Charlottenburg-Wilmersdorf | `berlin-bvv-charlottenburg-wilmersdorf` | 52 |
| Spandau | `berlin-bvv-spandau` | 53 |
| Steglitz-Zehlendorf | `berlin-bvv-steglitz-zehlendorf` | 54 |
| Tempelhof-Schöneberg | `berlin-bvv-tempelhof-schoeneberg` | 55 |
| Neukölln | `berlin-bvv-neukoelln` | 56 |
| Treptow-Köpenick | `berlin-bvv-treptow-koepenick` | 57 |
| Marzahn-Hellersdorf | `berlin-bvv-marzahn-hellersdorf` | 58 |
| Lichtenberg | `berlin-bvv-lichtenberg` | 59 |
| Reinickendorf | `berlin-bvv-reinickendorf` | 60 |

Generate all 12 files with the template above, varying `id`, `slug`, `shareTypeCode`, `region.bezirk`, and `dataFile`.

- [ ] **Step 4: Register all 13 new entries in `src/elections/registry.ts`**

Append to the `ELECTIONS` array:
```ts
  { slug: 'berlin-abgh', shareTypeCode: 48,
    load: () => import('./berlin-abgh/config').then(m => m.default) },
  { slug: 'berlin-bvv-mitte', shareTypeCode: 49,
    load: () => import('./berlin-bvv-mitte/config').then(m => m.default) },
  // ... entries for the remaining 11 Bezirke in the order above
```

- [ ] **Step 5: Verify TS compiles**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 6: Commit**

```bash
git add src/elections/berlin-abgh src/elections/berlin-bvv-* src/elections/registry.ts
git commit -m "Add Berlin Abgh + 12 BVV election configs (data files pending)"
```

---

### Task 2.2: Generalise the `mmp-2vote` Ballot for Berlin

The current `mmp-2vote` Ballot was BW Landtagswahl-only. Berlin adds: 78 Wahlkreise (vs ~70 for BW), Bezirksliste *or* Landesliste choice for Zweitstimme, and a single combined ballot layout.

**Files:**
- Modify: `src/archetypes/mmp-2vote/Ballot.tsx`
- Modify: `src/archetypes/mmp-2vote/types.ts`
- Modify: `src/archetypes/mmp-2vote/voteReducer.ts`
- Create: `src/archetypes/mmp-2vote/dataSchema.ts`
- Create: `src/archetypes/mmp-2vote/voteReducer.test.ts`

- [ ] **Step 1: Update the data schema to support Bezirkslisten**

Create `src/archetypes/mmp-2vote/dataSchema.ts`:

```ts
export interface Mmp2VoteCandidate {
  id: string;
  party: string;
  lastName: string;
  firstName: string;
  profession: string;
  birthYear?: number;
}

export interface Mmp2VoteWahlkreis {
  number: number;
  name: string;
  bezirk?: string;                  // Berlin only: which Bezirk this WK belongs to
  candidates: Mmp2VoteCandidate[];
}

export interface Mmp2VoteListe {
  listNumber: number;
  shortName: string;
  fullName: string;
  type: 'landesliste' | 'bezirksliste';
  bezirk?: string;                  // for bezirksliste
  candidates: { position: number; lastName: string; firstName: string; profession: string }[];
}

export interface Mmp2VoteData {
  election: string;
  type: string;
  name: string;
  date: string;
  wahlkreise: Mmp2VoteWahlkreis[];
  listen: Mmp2VoteListe[];          // landesliste(n) + bezirkslisten if config.hasBezirkslisten
}
```

- [ ] **Step 2: Extend `Mmp2VoteState` to track which Liste type the voter chose**

Modify `src/archetypes/mmp-2vote/types.ts` — replace the `Mmp2VoteState` definition with:

```ts
export interface Mmp2VoteState {
  selectedWahlkreis: number | null;
  erststimme: string | null;        // candidateId
  zweitstimme: { listType: 'landesliste' | 'bezirksliste'; listNumber: number } | null;
}

export type Mmp2VoteAction =
  | { type: 'SET_WAHLKREIS'; wahlkreis: number }
  | { type: 'SET_ERSTSTIMME'; candidateId: string | null }
  | { type: 'SET_ZWEITSTIMME'; listType: 'landesliste' | 'bezirksliste'; listNumber: number }
  | { type: 'CLEAR_ZWEITSTIMME' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; state: Mmp2VoteState };
```

- [ ] **Step 3: Write reducer tests for the new state shape**

Create `src/archetypes/mmp-2vote/voteReducer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mmp2VoteReducer, mmp2VoteInitialState } from './voteReducer';

describe('mmp-2vote reducer', () => {
  it('sets a Wahlkreis and clears any prior Erststimme', () => {
    const s = mmp2VoteReducer(
      { ...mmp2VoteInitialState, selectedWahlkreis: 12, erststimme: 'cand-1' },
      { type: 'SET_WAHLKREIS', wahlkreis: 13 },
    );
    expect(s.selectedWahlkreis).toBe(13);
    expect(s.erststimme).toBeNull();
  });

  it('records a Bezirksliste Zweitstimme', () => {
    const s = mmp2VoteReducer(mmp2VoteInitialState, {
      type: 'SET_ZWEITSTIMME',
      listType: 'bezirksliste',
      listNumber: 3,
    });
    expect(s.zweitstimme).toEqual({ listType: 'bezirksliste', listNumber: 3 });
  });

  it('CLEAR_ZWEITSTIMME removes the choice', () => {
    const s = mmp2VoteReducer(
      { ...mmp2VoteInitialState, zweitstimme: { listType: 'landesliste', listNumber: 1 } },
      { type: 'CLEAR_ZWEITSTIMME' },
    );
    expect(s.zweitstimme).toBeNull();
  });

  it('RESET returns to initial', () => {
    const s = mmp2VoteReducer(
      { selectedWahlkreis: 5, erststimme: 'x', zweitstimme: { listType: 'landesliste', listNumber: 2 } },
      { type: 'RESET' },
    );
    expect(s).toEqual(mmp2VoteInitialState);
  });
});
```

- [ ] **Step 4: Run tests to confirm they fail (CLEAR_ZWEITSTIMME isn't implemented yet)**

Run: `npm test`
Expected: 4 tests, several FAIL (unhandled actions, wrong shape).

- [ ] **Step 5: Update the reducer to match the new state shape**

Replace the `reducer` function body in `src/archetypes/mmp-2vote/voteReducer.ts`:

```ts
function reducer(state: Mmp2VoteState, action: Mmp2VoteAction): Mmp2VoteState {
  switch (action.type) {
    case 'SET_WAHLKREIS':
      return { ...state, selectedWahlkreis: action.wahlkreis, erststimme: null };
    case 'SET_ERSTSTIMME':
      return { ...state, erststimme: action.candidateId };
    case 'SET_ZWEITSTIMME':
      return { ...state, zweitstimme: { listType: action.listType, listNumber: action.listNumber } };
    case 'CLEAR_ZWEITSTIMME':
      return { ...state, zweitstimme: null };
    case 'RESET':
      return initialState;
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}
```

- [ ] **Step 6: Run tests, expect all green**

Run: `npm test`
Expected: 6 tests pass (2 share + 4 reducer).

- [ ] **Step 7: Refactor `src/archetypes/mmp-2vote/Ballot.tsx` to drive Berlin's combined ballot**

Open `src/archetypes/mmp-2vote/Ballot.tsx`. The current file is the BW Landtagswahl component built on local `useState`. Make these specific edits:

**7a. Change the import block to add the reducer hook and the new types:**

```ts
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useElection } from '../../elections/ElectionContext';
import { useMmp2VoteState } from './voteReducer';
import type { Mmp2VoteConfig } from './types';
import type { Mmp2VoteData, Mmp2VoteWahlkreis, Mmp2VoteListe } from './dataSchema';
```

Remove the local interface declarations (`WahlkreisCandidate`, `Wahlkreis`, `Landesliste`, `LandtagswahlData`) — they're now in `dataSchema.ts`.

**7b. Change the component signature and replace local state with the reducer:**

Replace:
```tsx
export function LandtagswahlBallot({ data }: LandtagswahlBallotProps) {
  // ...
  const [selectedWahlkreis, setSelectedWahlkreis] = useState<number | null>(null);
  const [wahlkreisSearch, setWahlkreisSearch] = useState('');
  const [erststimme, setErststimme] = useState<string | null>(null);
  const [zweitstimme, setZweitstimme] = useState<number | null>(null);
```

with:
```tsx
export function Ballot({ config, data }: { config: Mmp2VoteConfig; data: Mmp2VoteData }) {
  const { t } = useTranslation('election');
  const { state, dispatch } = useMmp2VoteState();
  const { selectedWahlkreis, erststimme, zweitstimme } = state;
  const [wahlkreisSearch, setWahlkreisSearch] = useState('');
  const [zweitstimmeTab, setZweitstimmeTab] = useState<'bezirksliste' | 'landesliste'>(
    config.hasBezirkslisten ? 'bezirksliste' : 'landesliste',
  );
```

**7c. Wherever the old code calls `setSelectedWahlkreis(n)`, replace with `dispatch({ type: 'SET_WAHLKREIS', wahlkreis: n })`.**

Wherever it calls `setErststimme(id)`, replace with `dispatch({ type: 'SET_ERSTSTIMME', candidateId: id })`.

Wherever it calls `setZweitstimme(n)`, replace with `dispatch({ type: 'SET_ZWEITSTIMME', listType: zweitstimmeTab, listNumber: n })`.

**7d. Update the Zweitstimme column to handle the bezirksliste tab.**

Find the JSX block that renders `data.landeslisten.map(...)`. Replace the data source with:

```tsx
const visibleListen: Mmp2VoteListe[] = useMemo(() => {
  if (!config.hasBezirkslisten) {
    return data.listen.filter(l => l.type === 'landesliste');
  }
  if (zweitstimmeTab === 'landesliste') {
    return data.listen.filter(l => l.type === 'landesliste');
  }
  // Bezirksliste tab: show only those for the Wahlkreis's Bezirk
  const wk = data.wahlkreise.find(w => w.number === selectedWahlkreis);
  if (!wk?.bezirk) return [];
  return data.listen.filter(l => l.type === 'bezirksliste' && l.bezirk === wk.bezirk);
}, [config.hasBezirkslisten, data, zweitstimmeTab, selectedWahlkreis]);
```

Then render `visibleListen.map(...)` instead of `data.landeslisten.map(...)`.

**7e. Add the Bezirksliste / Landesliste tab strip above the list when `config.hasBezirkslisten`:**

```tsx
{config.hasBezirkslisten && (
  <div className="flex border-b mb-2">
    <button
      className={`flex-1 py-2 ${zweitstimmeTab === 'bezirksliste' ? 'border-b-2 border-current font-medium' : 'text-gray-500'}`}
      onClick={() => setZweitstimmeTab('bezirksliste')}
    >
      Bezirksliste
    </button>
    <button
      className={`flex-1 py-2 ${zweitstimmeTab === 'landesliste' ? 'border-b-2 border-current font-medium' : 'text-gray-500'}`}
      onClick={() => setZweitstimmeTab('landesliste')}
    >
      Landesliste
    </button>
  </div>
)}
```

**7f. Update the existing `voteSummary` `useMemo` to read from the reducer's nested zweitstimme:**

```tsx
const voteSummary = useMemo(() => {
  const wahlkreis = data.wahlkreise.find(w => w.number === selectedWahlkreis) ?? null;
  const erstCandidate = wahlkreis?.candidates.find(c => c.id === erststimme) ?? null;
  const zweitListe = zweitstimme
    ? data.listen.find(
        l => l.listNumber === zweitstimme.listNumber && l.type === zweitstimme.listType,
      ) ?? null
    : null;
  return { wahlkreis, erstCandidate, zweitListe };
}, [data, selectedWahlkreis, erststimme, zweitstimme]);
```

**7g. Add `bothVotesUsed` based on the new shape:**

```tsx
const bothVotesUsed = erststimme !== null && zweitstimme !== null;
```

(unchanged from before — just confirming the rename is consistent).

- [ ] **Step 8: Update `src/archetypes/mmp-2vote/index.ts` exports**

```ts
export { Ballot } from './Ballot';
export { useMmp2VoteState, mmp2VoteReducer, mmp2VoteInitialState } from './voteReducer';
export type { Mmp2VoteConfig, Mmp2VoteState, Mmp2VoteAction } from './types';
export type { Mmp2VoteData, Mmp2VoteCandidate, Mmp2VoteWahlkreis, Mmp2VoteListe } from './dataSchema';
```

- [ ] **Step 9: Update App.tsx to pass `config` to the Ballot**

In the `electionConfig.ballotKind === 'mmp-2vote'` branch, change:
```tsx
<LandtagswahlBallot data={landtagswahlData} />
```
to:
```tsx
<LandtagswahlBallot config={electionConfig} data={landtagswahlData} />
```

- [ ] **Step 10: Run tests + build**

Run: `npm test && npm run build`
Expected: green.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Generalise mmp-2vote ballot for Berlin: Bezirksliste/Landesliste choice, reducer-driven state"
```

---

### Task 2.3: Build the `closed-list` archetype for Berlin BVV

**Files:**
- Create: `src/archetypes/closed-list/index.ts`
- Create: `src/archetypes/closed-list/types.ts`
- Create: `src/archetypes/closed-list/voteReducer.ts`
- Create: `src/archetypes/closed-list/voteReducer.test.ts`
- Create: `src/archetypes/closed-list/Ballot.tsx`
- Create: `src/archetypes/closed-list/dataSchema.ts`
- Modify: `src/App.tsx` (add `closed-list` route branch)

- [ ] **Step 1: Create the data schema**

`src/archetypes/closed-list/dataSchema.ts`:
```ts
export interface ClosedListParty {
  listNumber: number;
  shortName: string;
  fullName: string;
  candidates: { position: number; lastName: string; firstName: string; profession: string }[];
}

export interface ClosedListData {
  election: string;
  name: string;
  date: string;
  parties: ClosedListParty[];
}
```

- [ ] **Step 2: Create types**

`src/archetypes/closed-list/types.ts`:
```ts
export type { ClosedListConfig } from '../../elections/types';

export interface ClosedListState {
  choice: number | null;            // listNumber, or null for "no vote yet"
}

export type ClosedListAction =
  | { type: 'SET_CHOICE'; listNumber: number }
  | { type: 'CLEAR' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; state: ClosedListState };
```

- [ ] **Step 3: Write reducer tests**

`src/archetypes/closed-list/voteReducer.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { closedListReducer, closedListInitialState } from './voteReducer';

describe('closed-list reducer', () => {
  it('starts with no choice', () => {
    expect(closedListInitialState.choice).toBeNull();
  });

  it('SET_CHOICE replaces any prior choice', () => {
    const s1 = closedListReducer(closedListInitialState, { type: 'SET_CHOICE', listNumber: 1 });
    expect(s1.choice).toBe(1);
    const s2 = closedListReducer(s1, { type: 'SET_CHOICE', listNumber: 4 });
    expect(s2.choice).toBe(4);
  });

  it('CLEAR removes the choice', () => {
    const s = closedListReducer({ choice: 3 }, { type: 'CLEAR' });
    expect(s.choice).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests, expect failure (no reducer yet)**

Run: `npm test`
Expected: tests fail at module import (`Cannot find module './voteReducer'`).

- [ ] **Step 5: Implement the reducer**

`src/archetypes/closed-list/voteReducer.ts`:
```ts
import { useReducer } from 'react';
import type { ClosedListState, ClosedListAction } from './types';

const initialState: ClosedListState = { choice: null };

function reducer(state: ClosedListState, action: ClosedListAction): ClosedListState {
  switch (action.type) {
    case 'SET_CHOICE':
      return { choice: action.listNumber };
    case 'CLEAR':
      return { choice: null };
    case 'RESET':
      return initialState;
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

export function useClosedListState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}

export {
  reducer as closedListReducer,
  initialState as closedListInitialState,
};
```

- [ ] **Step 6: Run tests, expect green**

Run: `npm test`
Expected: 9 tests pass.

- [ ] **Step 7: Build the Ballot component**

`src/archetypes/closed-list/Ballot.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { useClosedListState } from './voteReducer';
import type { ClosedListConfig } from './types';
import type { ClosedListData } from './dataSchema';
import { getPartyColor } from '../../data/partyColors';

interface BallotProps {
  config: ClosedListConfig;
  data: ClosedListData;
}

export function Ballot({ config, data }: BallotProps) {
  const { t } = useTranslation('election');
  const { state, dispatch } = useClosedListState();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold">{t('ballotTitle', { defaultValue: data.name })}</h1>
        <p className="text-sm text-gray-500">{t('electionDateValue', { defaultValue: data.date })}</p>
      </header>

      <p className="text-sm text-gray-700 mb-4">
        {t('closedListInstructions', {
          defaultValue: 'Sie haben eine Stimme. Bitte wählen Sie eine Partei.',
        })}
      </p>

      <ol className="space-y-2">
        {data.parties.map(party => {
          const isChosen = state.choice === party.listNumber;
          const color = getPartyColor(party.shortName, config.partyColors);
          return (
            <li key={party.listNumber}>
              <button
                onClick={() =>
                  isChosen
                    ? dispatch({ type: 'CLEAR' })
                    : dispatch({ type: 'SET_CHOICE', listNumber: party.listNumber })
                }
                className={`w-full flex items-center gap-4 px-4 py-3 border rounded-md text-left transition ${
                  isChosen ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'
                }`}
                style={isChosen ? { borderColor: color, ringColor: color } : { borderColor: '#d1d5db' }}
              >
                <span className="w-6 h-6 border-2 rounded flex items-center justify-center" style={{ borderColor: color }}>
                  {isChosen ? <span className="block w-3 h-3" style={{ backgroundColor: color }} /> : null}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{party.shortName}</div>
                  <div className="text-xs text-gray-500">{party.fullName}</div>
                </div>
                <span className="text-xs text-gray-400">Liste {party.listNumber}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 text-center">
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-sm text-gray-500 underline"
        >
          {t('reset', { defaultValue: 'Zurücksetzen' })}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Wire up `index.ts`**

`src/archetypes/closed-list/index.ts`:
```ts
export { Ballot } from './Ballot';
export { useClosedListState, closedListReducer, closedListInitialState } from './voteReducer';
export type { ClosedListConfig, ClosedListState, ClosedListAction } from './types';
export type { ClosedListData, ClosedListParty } from './dataSchema';
```

- [ ] **Step 9: Add the `closed-list` branch in App.tsx**

After the existing `mmp-2vote` branch in `src/App.tsx`, add:
```tsx
if (electionConfig.ballotKind === 'closed-list') {
  if (!closedListData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Lade Kandidatendaten...</p>
      </div>
    );
  }
  return (
    <ElectionProvider config={electionConfig}>
      <div className="min-h-screen flex flex-col">
        <Header onSwitchBallot={handleSwitchBallot} />
        <main className="flex-1">
          <ClosedListBallot config={electionConfig} data={closedListData} />
        </main>
        <Footer />
      </div>
    </ElectionProvider>
  );
}
```

Add the imports at the top:
```ts
import { Ballot as ClosedListBallot } from './archetypes/closed-list';
import type { ClosedListData } from './archetypes/closed-list';
```

Add the state:
```ts
const [closedListData, setClosedListData] = useState<ClosedListData | null>(null);
```

And in the data-loading effect (the same one that currently sets `landtagswahlData`), branch on `ballotKind` to load into the right state slot. The existing pattern reads `electionConfig.dataFile` and fetches `/data/${dataFile}` — keep that pattern; just route the parsed JSON to the right setter.

- [ ] **Step 10: Add a basic data file so the BVV ballots have something to render**

Create `public/data/berlin-bvv-mitte.json` (the others can stay missing until real data is collected; the picker hides un-data-having BVVs in Task 2.4 step 5):

```json
{
  "election": "berlin-bvv-mitte",
  "name": "Bezirksverordnetenversammlung Mitte",
  "date": "2026-09-20",
  "parties": [
    { "listNumber": 1, "shortName": "PLACEHOLDER", "fullName": "Platzhalter — Kandidatendaten folgen", "candidates": [] }
  ]
}
```

This stub lets the closed-list Ballot render without errors during development. Real candidate data is collected in Task 2.5.

- [ ] **Step 11: Run tests + build + smoke**

Run: `npm test && npm run build`
Expected: green.

Run: `npm run dev` and visit `http://localhost:5173/berlin-bvv-mitte`. Expected: ballot renders with the placeholder party and the X-toggle works.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Add closed-list archetype with Ballot, reducer, tests; wire Berlin BVV Mitte placeholder"
```

---

### Task 2.4: Add Berlin to ElectionPicker (with Bezirk picker for BVV)

**Files:**
- Modify: `src/components/ElectionPicker.tsx`

The current picker shows Hessen cities, Bayern cities, and BW. Add a "Berlin" entry that, when clicked, opens a sub-picker with two options ("Abgeordnetenhaus" → `berlin-abgh`) and ("BVV" → asks which Bezirk).

- [ ] **Step 1: Inspect current ElectionPicker structure**

Read `src/components/ElectionPicker.tsx` end-to-end. Note the existing pattern for the BW entry (likely a single click → `onChoose('bw-landtagswahl')`). Identify where to add a Berlin tile.

- [ ] **Step 2: Add a Berlin tile and a Bezirk sub-picker**

The current ElectionPicker uses a panel-based selection (read the file end-to-end first to confirm). Add a `BERLIN_BEZIRKE` constant near the top of the file:

```ts
const BERLIN_BEZIRKE: { name: string; slug: string }[] = [
  { name: 'Mitte', slug: 'berlin-bvv-mitte' },
  { name: 'Friedrichshain-Kreuzberg', slug: 'berlin-bvv-friedrichshain-kreuzberg' },
  { name: 'Pankow', slug: 'berlin-bvv-pankow' },
  { name: 'Charlottenburg-Wilmersdorf', slug: 'berlin-bvv-charlottenburg-wilmersdorf' },
  { name: 'Spandau', slug: 'berlin-bvv-spandau' },
  { name: 'Steglitz-Zehlendorf', slug: 'berlin-bvv-steglitz-zehlendorf' },
  { name: 'Tempelhof-Schöneberg', slug: 'berlin-bvv-tempelhof-schoeneberg' },
  { name: 'Neukölln', slug: 'berlin-bvv-neukoelln' },
  { name: 'Treptow-Köpenick', slug: 'berlin-bvv-treptow-koepenick' },
  { name: 'Marzahn-Hellersdorf', slug: 'berlin-bvv-marzahn-hellersdorf' },
  { name: 'Lichtenberg', slug: 'berlin-bvv-lichtenberg' },
  { name: 'Reinickendorf', slug: 'berlin-bvv-reinickendorf' },
];
```

Add a Berlin section to the picker (mirror the existing Bayern/Hessen section structure). Two top-level buttons inside the Berlin section:

```tsx
<section className="mb-8">
  <h2 className="text-lg font-semibold mb-3">Berlin</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <button
      onClick={() => onChoose('berlin-abgh')}
      className="px-4 py-3 border rounded-md text-left hover:bg-gray-50"
    >
      <div className="font-medium">Abgeordnetenhaus von Berlin</div>
      <div className="text-xs text-gray-500">Landeswahl · 20.09.2026</div>
    </button>
    <button
      onClick={() => setShowBvvBezirke(s => !s)}
      className="px-4 py-3 border rounded-md text-left hover:bg-gray-50"
    >
      <div className="font-medium">Bezirksverordnetenversammlung (BVV)</div>
      <div className="text-xs text-gray-500">12 Bezirke · 20.09.2026</div>
    </button>
  </div>
  {showBvvBezirke && (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2 border-l-2 border-gray-200">
      {BERLIN_BEZIRKE.map(b => (
        <button
          key={b.slug}
          onClick={() => onChoose(b.slug)}
          className="px-3 py-2 text-sm border rounded hover:bg-gray-50 text-left"
        >
          {b.name}
        </button>
      ))}
    </div>
  )}
</section>
```

Add the toggle state at the top of the component:
```ts
const [showBvvBezirke, setShowBvvBezirke] = useState(false);
```

- [ ] **Step 3: Verify in the dev server**

Run: `npm run dev`. Visit `http://localhost:5173/`. Click Berlin → Bezirksverordnetenversammlung → Mitte. Expect to land on `/berlin-bvv-mitte`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ElectionPicker.tsx
git commit -m "Add Berlin to ElectionPicker with Abgh and 12-Bezirk BVV sub-picker"
```

---

### Task 2.5: Collect Berlin candidate data

**Files:**
- Create: `public/data/berlin-abgh.json`
- Create: `public/data/berlin-bvv-<bezirk>.json` × 12 (replacing the Mitte stub)
- Optional: `scripts/parse-berlin-amtsblatt.py` if a parser is needed

The candidate lists are published by the Berlin Landeswahlleiterin after 24 July 2026 (Landeslisten) and 22 July 2026 (Bezirkslisten and Wahlkreisvorschläge). For development before then, keep the stubs from Task 2.3 step 10.

When real data is published:

- [ ] **Step 1: Locate the published Stimmzettel / Amtliche Bekanntmachungen on `wahlen-berlin.de`**

Verify the document format. The existing project has `scripts/parse-amtsblatt.py` (pdfplumber) for Hessen/Bayern PDFs. Berlin's may need a separate parser — start by checking whether their publication is HTML (machine-readable) or PDF.

- [ ] **Step 2: Either adapt the existing parser or write a Berlin-specific one**

If HTML: a small fetch + DOM-parse script. If PDF: extend `scripts/parse-amtsblatt.py` with a Berlin handler.

Output two file shapes:
- `public/data/berlin-abgh.json` matching `Mmp2VoteData`: 78 wahlkreise + 12 bezirkslisten + 1 landesliste per party.
- `public/data/berlin-bvv-<bezirk>.json` × 12 matching `ClosedListData`.

- [ ] **Step 3: Validate the generated JSON against the schemas**

Add a runtime validation pass at the start of each parsing run that asserts the output matches `Mmp2VoteData`/`ClosedListData`. (Use `zod` or hand-rolled checks; the project doesn't have zod installed, so a simple structural check is fine.)

- [ ] **Step 4: Smoke-test in the app**

Visit each Berlin slug; confirm candidates render.

- [ ] **Step 5: Commit**

```bash
git add public/data/berlin-abgh.json public/data/berlin-bvv-*.json scripts/
git commit -m "Add Berlin Abgh + BVV candidate data (Stand: <date>)"
```

(Until candidates are published, this task is parked. The architecture is complete; only data is missing.)

---

### Task 2.6: Wave 2 acceptance smoke test

- [ ] **Step 1: Run `npm test && npm run build && npm run dev`**

Expected: tests green, build clean, dev server up.

- [ ] **Step 2: Walk the Berlin flows**

- Pick Berlin → Abgeordnetenhaus → confirm 78 Wahlkreise + Bezirksliste/Landesliste tabs render.
- Pick Berlin → BVV → Mitte → confirm one-X-per-party UX.
- Cast a vote on each, verify the visible state updates, hit Reset.

If real data isn't in yet, the placeholder party shape from Task 2.3 step 10 is enough to verify the flow.

- [ ] **Step 3: Verify no regression on existing elections**

Visit `http://localhost:5173/frankfurt-stvv`, `/muenchen-stadtrat`, `/bw-landtagswahl`. Confirm each renders and votes record.

- [ ] **Step 4: Verification only — no commit**

---

## Wave 3: Stub the remaining 7 archetypes

Each stub follows an identical pattern: create the folder, types, minimal Ballot, minimal reducer (or none), and `index.ts`, then add to the `ARCHETYPES` registry. None of these get real data or polished UX in this wave — the goal is type-completeness so future elections plug in via data only.

The pattern is **the same for all seven**. Apply it to each in turn. The seven kinds are:
- `ost-kommunal`
- `closed-list-direkt`
- `hamburg-2x5`
- `bremen-1x5`
- `bayern-landtag`
- `single-candidate`
- `referendum`

### Task 3.1: Stub a single archetype (template task — repeat 7 times)

Replace `<KIND>` with the archetype name (e.g. `ost-kommunal`) and `<KindCamel>` with the PascalCase form (e.g. `OstKommunal`).

**Files per archetype:**
- Create: `src/archetypes/<KIND>/index.ts`
- Create: `src/archetypes/<KIND>/types.ts`
- Create: `src/archetypes/<KIND>/Ballot.tsx`

- [ ] **Step 1: Create types**

`src/archetypes/<KIND>/types.ts`:
```ts
export type { <KindCamel>Config } from '../../elections/types';
```

- [ ] **Step 2: Create the placeholder Ballot**

`src/archetypes/<KIND>/Ballot.tsx`:
```tsx
import type { <KindCamel>Config } from './types';

interface BallotProps {
  config: <KindCamel>Config;
}

export function Ballot({ config }: BallotProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <h1 className="text-xl font-bold mb-2">{config.id}</h1>
      <p className="text-gray-600">
        Diese Wahl ({config.ballotKind}) ist im System hinterlegt, aber der Stimmzettel ist
        noch nicht implementiert.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Geplant für: {config.date} · {config.region.land}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create `index.ts`**

`src/archetypes/<KIND>/index.ts`:
```ts
export { Ballot } from './Ballot';
export type { <KindCamel>Config } from './types';
```

- [ ] **Step 4: Tighten the registry**

In `src/archetypes/index.ts`, uncomment / add the entry for `<KIND>`. Once all seven are present, change `Partial<Record<...>>` to `Record<...>` (full coverage).

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 6: Commit each archetype as its own commit**

```bash
git add src/archetypes/<KIND> src/archetypes/index.ts
git commit -m "Stub <KIND> archetype"
```

### Task 3.2: Apply Task 3.1 to all seven archetypes

Repeat Task 3.1 for each of:
- `ost-kommunal`
- `closed-list-direkt`
- `hamburg-2x5`
- `bremen-1x5`
- `bayern-landtag`
- `single-candidate`
- `referendum`

After all seven, the `ARCHETYPES` registry should be a complete `Record<BallotKind, ...>`.

### Task 3.3: Collapse App.tsx routing into the registry

Now that every archetype has at least a stub Ballot, replace the explicit per-archetype `if` branches in `src/App.tsx` with a single registry lookup.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/archetypes/index.ts`

- [ ] **Step 1: Refine the `ArchetypeModule` interface so each archetype's Ballot props are typed**

Each archetype's Ballot has different props (some take `data`, some don't; some take `config`). The registry can't know all of them statically — but it can hand back a fully-typed module that App.tsx then uses with explicit narrowing. So the registry stays loose at the entry-point boundary, and the *caller* (App.tsx) does the narrowing.

Update `src/archetypes/index.ts`:
```ts
import type { ComponentType } from 'react';
import type { BallotKind } from '../elections/types';

export type ArchetypeImporter = () => Promise<{ Ballot: ComponentType<any>; Spickzettel?: ComponentType<any> }>;

export const ARCHETYPES: Record<BallotKind, ArchetypeImporter> = {
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

`any` on the Ballot ComponentType is intentional — the registry is the runtime mounting point; type-safety happens at the call site where we know the concrete config.

- [ ] **Step 2: In App.tsx, lazy-mount via the registry for archetypes the App doesn't have a custom branch for**

Keep the existing explicit branches for Süd-Kommunal, mmp-2vote, and closed-list — those need their own data-loading and state-wiring. For every OTHER archetype (the 7 stubs), add a fallback:

```tsx
// After the closed-list branch, before the Süd-Kommunal default render:
if (
  electionConfig.ballotKind !== 'sued-kommunal' &&
  electionConfig.ballotKind !== 'mmp-2vote' &&
  electionConfig.ballotKind !== 'closed-list'
) {
  return (
    <ElectionProvider config={electionConfig}>
      <div className="min-h-screen flex flex-col">
        <Header onSwitchBallot={handleSwitchBallot} />
        <main className="flex-1">
          <LazyArchetypeMount config={electionConfig} />
        </main>
        <Footer />
      </div>
    </ElectionProvider>
  );
}
```

Where `LazyArchetypeMount` is a small helper:

```tsx
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import type { ElectionConfig } from './elections/types';
import { ARCHETYPES } from './archetypes';

function LazyArchetypeMount({ config }: { config: ElectionConfig }) {
  const [Comp, setComp] = useState<ComponentType<{ config: ElectionConfig }> | null>(null);
  useEffect(() => {
    let live = true;
    ARCHETYPES[config.ballotKind]().then(m => { if (live) setComp(() => m.Ballot); });
    return () => { live = false; };
  }, [config.ballotKind]);
  if (!Comp) return <div className="p-12 text-center text-gray-500">Lade…</div>;
  return <Comp config={config} />;
}
```

Add this helper inside `src/App.tsx` (or extract to its own file if preferred).

- [ ] **Step 3: Verify build + manual smoke**

Run: `npm run build`
Expected: clean compile.

Run: `npm run dev`. Add a test entry to `src/elections/registry.ts` for one of the stub archetypes (e.g. a fake `test-referendum` config) and visit it; expect the placeholder Ballot to render.

Remove the test entry before committing.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/archetypes/index.ts
git commit -m "Collapse App.tsx archetype routing into registry, mount stubs lazily"
```

---

### Task 3.4: Wave 3 acceptance test

- [ ] **Step 1: Verify type-completeness**

Run: `npm run build`. Expected: clean.

Verify by reading: `src/archetypes/index.ts` exports `ARCHETYPES` as a `Record<BallotKind, ...>` (no `Partial`). All 10 entries present.

- [ ] **Step 2: Verify all existing flows still work**

- `frankfurt-stvv`, `muenchen-stadtrat`, `bw-landtagswahl` — render and accept votes.
- `berlin-abgh`, `berlin-bvv-mitte` — render (with placeholder data, if real data isn't yet collected).

- [ ] **Step 3: Confirm test suite green**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Final commit only if anything was missed**

If steps 1–3 reveal no issues, no commit. Otherwise, fix forward and commit per fix.

---

## Final Verification

- [ ] **Spec coverage:** every section of `docs/superpowers/specs/2026-05-03-unified-election-config-design.md` is implemented or explicitly deferred (Task 2.5 candidate data deferred until Berlin publishes).
- [ ] **`npm test`** green.
- [ ] **`npm run build`** clean.
- [ ] **Manual smoke:** Hessen, Bayern, BW Landtag, Berlin Abgh, Berlin BVV Mitte all render and accept votes.
- [ ] **Share links:** old shareTypeCodes (0–47) decode correctly. New ones (48–60) for Berlin work.
- [ ] **Documentation:** the spec doc and this plan both committed.

---

## Notes for the implementer

- **Test discipline:** Vitest tests live next to the code they test (`Foo.test.ts` next to `Foo.ts`). Run `npm test` between every code change.
- **Frequent commits:** the granularity in this plan reflects deliberate commit boundaries. Don't squash. Each commit should leave the build clean.
- **The user has pre-existing WIP** on this branch (changes to `CandidateRow.tsx`, `PartyPage.tsx`, `PrintSpickzettel.tsx`, `types.ts`). These were inherited from the workspace at branch creation. As Task 1.4 moves those files, take care to preserve the WIP changes — don't blindly overwrite. Read each file's current state before replacing.
- **The Berlin BVV Bezirk slugs use ASCII-only kebab-case** (no umlauts, e.g. `tempelhof-schoeneberg`, not `tempelhof-schöneberg`).
- **`shareTypeCode` allocation:** existing 0–47 must not be changed (back-compat). Berlin Abgh = 48; BVV bezirke = 49–60. Future archetypes start at 61.
- **i18n files for Berlin** are minimal stubs (Task 2.1 step 2). Expand them with the same keys as existing election i18n folders as the Berlin UX matures.
