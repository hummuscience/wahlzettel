import type { ComponentType } from 'react';
import type { BallotKind } from '../elections/types';

/**
 * Each archetype's Ballot accepts archetype-specific props. The registry
 * is the runtime mounting boundary; type-safety happens at the call site
 * where the caller has the concrete config and can narrow it.
 */
export type ArchetypeImporter = () => Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Ballot: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Spickzettel?: ComponentType<any>;
}>;

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
