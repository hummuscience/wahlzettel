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
