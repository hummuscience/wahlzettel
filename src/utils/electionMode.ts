// Pre/post-election mode predicate.
//
// "post" means the election day has passed AND results data is loaded.
// Switching to post mode swaps the surrounding context: the left panel goes
// from "how to vote" to "Frankfurt hat gewählt" and the right panel from
// practical voting info to a seats visualisation.

import type { ElectionConfig } from '../elections/types';
import type { ResultsData } from '../types/results';

export type ElectionMode = 'pre' | 'post';

/** Return 'post' when today is strictly after the election date AND we have
 * results data loaded. Otherwise 'pre'.
 *
 * `now` is injectable for testing. Default is the actual current date at
 * call time, normalised to UTC midnight to make the comparison stable
 * across timezones.
 */
export function getElectionMode(
  config: ElectionConfig,
  results: ResultsData | null | undefined,
  now: Date = new Date(),
): ElectionMode {
  if (!results) return 'pre';
  // config.date is "YYYY-MM-DD" — interpret as the END of that day.
  // Election day itself shows "pre" mode (vote-day guidance still relevant).
  // The day after, switch to "post".
  const electionDay = new Date(`${config.date}T23:59:59Z`);
  if (now.getTime() <= electionDay.getTime()) return 'pre';
  return 'post';
}
