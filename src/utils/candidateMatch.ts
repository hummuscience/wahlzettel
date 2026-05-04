// Look up a candidate's actual citywide Stimmen against the results data.
//
// The results JSON uses position-based identification (party listNumber +
// candidate position), which is the canonical key in the votemanager open-data
// CSV. Same key the ballot data file uses. So joining is a pure (listNumber,
// position) lookup — no name reconciliation needed.

import type { ResultsCandidate, ResultsParty } from '../types/results';

/** Build a per-party position → ResultsCandidate index. */
export function indexResultsParty(party: ResultsParty): Map<number, ResultsCandidate> {
  const map = new Map<number, ResultsCandidate>();
  for (const c of party.candidates) {
    map.set(c.position, c);
  }
  return map;
}

/** Look up a candidate's results by ballot position. Returns null when no
 * results entry exists for that position (e.g. position outside the
 * results-data range). The result's `stimmen` may itself be null when the
 * position has no vote tally (see ResultsCandidate.stimmen). */
export function lookupCandidate(
  index: Map<number, ResultsCandidate>,
  position: number,
): ResultsCandidate | null {
  return index.get(position) ?? null;
}
