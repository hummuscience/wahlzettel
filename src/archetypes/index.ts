import type { ComponentType } from 'react';
import type { BallotKind } from '../elections/types';

/**
 * Each archetype's Ballot accepts archetype-specific props; we don't try to
 * unify the prop shape because doing so erases TypeScript's narrowing.
 * Consumers narrow on `config.ballotKind` and pass the correct module.
 */
export interface ArchetypeModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Ballot: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Spickzettel?: ComponentType<any>;
}

/**
 * Registry of ballot-archetype dynamic imports. `Partial<>` until Wave 3 fills
 * in entries for every archetype; subsequent waves tighten this to a full
 * `Record<BallotKind, ...>`.
 */
export const ARCHETYPES: Partial<Record<BallotKind, () => Promise<ArchetypeModule>>> = {
  'sued-kommunal': () =>
    import('./sued-kommunal').then(m => ({ Ballot: m.Ballot, Spickzettel: m.Spickzettel })),
  'mmp-2vote': () => import('./mmp-2vote').then(m => ({ Ballot: m.Ballot })),
};
