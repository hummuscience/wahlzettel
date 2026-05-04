// Match a candidate from the ballot data file (with separate firstName/lastName
// fields) against the results data file (which uses "Lastname, Firstname"
// strings, sometimes with title prefixes or parenthetical suffixes).
//
// The matcher normalises curly apostrophes, drops parenthetical suffixes like
// "(Künstlern.: Bäppi La Belle)", and uses an exact name-key lookup. We do
// NOT do fuzzy matching — silent near-misses are worse than a clean miss.
//
// Verified: 93/93 elected Frankfurt candidates match.

import type { ResultsCandidate, ResultsParty } from '../types/results';

/** Normalise a name string for matching: strip diacritic-curly quotes,
 * collapse internal whitespace, drop parenthetical suffixes.
 */
function normalise(s: string): string {
  return s
    // Curly to straight apostrophes
    .replace(/[‘’ʼ]/g, "'")
    // Curly to straight double quotes (defensive — not seen yet)
    .replace(/[“”]/g, '"')
    // Drop "(...)" suffixes — Bäppi La Belle case
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    // Collapse whitespace
    .replace(/\s+/g, ' ');
}

/** Build a "Lastname, Firstname" key from data-file fields, applying the
 * same normalisation we use on the results-file side.
 */
export function candidateKey(lastName: string, firstName: string): string {
  return normalise(`${lastName}, ${firstName}`);
}

/** Build a per-party lookup: candidateKey → ResultsCandidate. */
export function indexResultsParty(party: ResultsParty): Map<string, ResultsCandidate> {
  const map = new Map<string, ResultsCandidate>();
  for (const c of party.elected) {
    map.set(normalise(c.name), c);
  }
  return map;
}

/** Look up a candidate's actual Stimmen, or null if not elected. */
export function lookupCandidate(
  index: Map<string, ResultsCandidate>,
  lastName: string,
  firstName: string,
): ResultsCandidate | null {
  return index.get(candidateKey(lastName, firstName)) ?? null;
}
