import { useMemo } from 'react';
import type { ResultsData, ResultsParty } from '../../types/results';
import { getPartyColor } from '../../data/partyColors';

interface ResultsCoalitionsPanelProps {
  results: ResultsData;
  partyColors: Record<string, string>;
}

interface Coalition {
  name: string;
  parties: ResultsParty[];
  seats: number;
  hasMajority: boolean;
}

/** Mögliche Koalitionen — ports the handoff's CoalitionsPanel.
 *
 * Coalitions are auto-computed: every 2- or 3-party combination among the
 * top seat-winners that clears majority, sorted by seat-count desc, and
 * truncated to a small number to stay legible. The top 1-2 entries also
 * include the largest "junior partner" that gets a single-party majority
 * not over the line — flagged visually with `−N` instead of "✓ MEHRHEIT".
 */
export function ResultsCoalitionsPanel({
  results,
  partyColors,
}: ResultsCoalitionsPanelProps) {
  const totalSeats = results.totalSeats;
  const majority = Math.ceil(totalSeats / 2);

  const coalitions = useMemo(
    () => computeCoalitions(results.parties, majority),
    [results.parties, majority],
  );

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-3.5 pt-3 pb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-bold m-0">Mögliche Koalitionen</h2>
        <span
          className="text-[10px] text-gray-400 tracking-wider"
          style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
        >
          MEHRHEIT AB {majority}
        </span>
      </div>
      {coalitions.length === 0 && (
        <p className="px-3.5 py-3 text-xs text-gray-400">
          Keine Koalitionsoptionen darstellbar.
        </p>
      )}
      {coalitions.map((c, i) => {
        const remainder = totalSeats - c.seats;
        return (
          <div
            key={i}
            className="px-3.5 py-2.5 grid grid-cols-[1fr_auto] gap-2.5 items-center border-t border-gray-100"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-900">{c.name}</div>
              <div className="flex gap-0.5 mt-1.5">
                {c.parties.map(p => (
                  <div
                    key={p.shortName}
                    className="h-2 rounded-sm"
                    style={{
                      flex: p.seats,
                      backgroundColor: getPartyColor(p.shortName, partyColors),
                    }}
                    title={`${p.shortName} ${p.seats}`}
                  />
                ))}
                {remainder > 0 && (
                  <div
                    className="h-2 rounded-sm bg-gray-100"
                    style={{ flex: remainder }}
                  />
                )}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {c.parties.map(p => p.shortName).join(' · ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold tabular-nums text-gray-900">
                {c.seats}
              </div>
              <div
                className={`text-[9px] font-bold tracking-wider mt-0.5 ${
                  c.hasMajority ? 'text-emerald-700' : 'text-gray-400'
                }`}
                style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
              >
                {c.hasMajority ? '✓ MEHRHEIT' : `−${majority - c.seats}`}
              </div>
            </div>
          </div>
        );
      })}
      <p
        className="m-0 px-3.5 py-2.5 border-t border-gray-100 text-[10px] text-gray-400 leading-snug"
        style={{ background: '#fafafa' }}
      >
        Eine Mehrheit ergibt sich rechnerisch. Die Bildung einer Koalition liegt
        bei den gewählten Fraktionen.
      </p>
    </section>
  );
}

/** Generate plausible coalitions from the seatful parties:
 *  - All 2-party combinations whose total ≥ majority (top by total)
 *  - All 3-party combinations whose total ≥ majority (top by total, deduped)
 *  Cap the list to a small number so the panel stays legible. */
function computeCoalitions(
  parties: ResultsParty[],
  majority: number,
): Coalition[] {
  // Only consider parties with seats; ignore lists that didn't make it in.
  const seatful = parties.filter(p => p.seats > 0).sort((a, b) => b.seats - a.seats);
  if (seatful.length < 2) return [];

  type Tuple = ResultsParty[];
  const combos: Tuple[] = [];

  // Pairs
  for (let i = 0; i < seatful.length; i++) {
    for (let j = i + 1; j < seatful.length; j++) {
      const seats = seatful[i].seats + seatful[j].seats;
      if (seats >= majority) {
        combos.push([seatful[i], seatful[j]]);
      }
    }
  }

  // Triples
  for (let i = 0; i < seatful.length; i++) {
    for (let j = i + 1; j < seatful.length; j++) {
      for (let k = j + 1; k < seatful.length; k++) {
        const seats = seatful[i].seats + seatful[j].seats + seatful[k].seats;
        if (seats >= majority) {
          combos.push([seatful[i], seatful[j], seatful[k]]);
        }
      }
    }
  }

  // Score: prefer (a) clearing majority by smallest margin (tighter coalition
  // is less wasteful) and (b) fewer parties (simpler). Then drop dominated
  // duplicates: if a 3-party combo's first 2 already have majority, prefer
  // the 2-party version.
  const scored = combos
    .map(parties => {
      const seats = parties.reduce((s, p) => s + p.seats, 0);
      return {
        parties,
        seats,
        margin: seats - majority,
        size: parties.length,
      };
    })
    .filter(c => {
      // Drop triples where the top two parties already form a majority — that
      // strictly-smaller coalition is already in the pair list.
      if (c.size === 3 && c.parties[0].seats + c.parties[1].seats >= majority) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.size - b.size || a.margin - b.margin)
    .slice(0, 5);

  return scored.map(c => ({
    name: nameFor(c.parties),
    parties: c.parties,
    seats: c.seats,
    hasMajority: c.seats >= majority,
  }));
}

/** Build a human-readable Koalition name from its parties. Falls back to a
 * "·"-joined party-short list when no traditional German label fits.
 *
 * Common Hessen patterns: Schwarz-Rot, Schwarz-Grün, Schwarz-Gelb, Ampel
 * (Rot-Grün-Gelb), Rot-Grün, Jamaika (Schwarz-Grün-Gelb), Kenia
 * (Schwarz-Rot-Grün), Deutschland (Schwarz-Rot-Gelb).
 */
function nameFor(parties: ResultsParty[]): string {
  const names = parties.map(p => p.shortName).sort().join('|');
  const KNOWN: Record<string, string> = {
    'CDU|GRÜNE': 'Schwarz–Grün',
    'CDU|SPD': 'Schwarz–Rot',
    'CDU|FDP': 'Schwarz–Gelb',
    'GRÜNE|SPD': 'Rot–Grün',
    'CDU|GRÜNE|SPD': 'Kenia',
    'CDU|FDP|SPD': 'Deutschland',
    'CDU|FDP|GRÜNE': 'Jamaika',
    'FDP|GRÜNE|SPD': 'Ampel',
    'Die Linke|GRÜNE|SPD': 'Rot–Rot–Grün',
  };
  return KNOWN[names] ?? parties.map(p => p.shortName).join(' + ');
}
