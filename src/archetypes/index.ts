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
