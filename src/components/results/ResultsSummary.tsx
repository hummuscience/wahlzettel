import type { ResultsData } from '../../types/results';
import { getPartyColor } from '../../data/partyColors';

interface ResultsSummaryProps {
  results: ResultsData;
  electionConfig: {
    partyColors: Record<string, string>;
    date: string;
    region: { gemeinde?: string; bezirk?: string; land: string };
  };
}

/** German thousands-separator formatter. */
function fmt(n: number | null | undefined): string {
  if (n == null) return '–';
  return n.toLocaleString('de-DE');
}

function fmtPercent(n: number | null | undefined): string {
  if (n == null) return '–';
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

function fmtDate(iso: string): string {
  // "2026-03-15" → "15. März 2026"
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Replaces the WalkthroughSection in post-election mode. Lists how the
 * percentages translated into seats, with party-coloured rows ranked by seat
 * count. Neutral civic-education tone. */
export function ResultsSummary({ results, electionConfig }: ResultsSummaryProps) {
  const place = electionConfig.region.gemeinde ?? electionConfig.region.bezirk ?? electionConfig.region.land;
  const partiesWithSeats = results.parties.filter(p => p.seats > 0);

  return (
    <section className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <h2 className="text-lg font-bold mb-1">{place} hat gewählt</h2>
      <p className="text-xs text-gray-500 mb-3">
        Wahltag {fmtDate(electionConfig.date)} · Stand {fmtDate(results.stand)}
      </p>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 mb-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <span className="text-gray-500">Wahlbeteiligung</span>
          <span className="text-right tabular-nums font-medium">{fmtPercent(results.totals.turnout)}</span>
          <span className="text-gray-500">Gültige Stimmzettel</span>
          <span className="text-right tabular-nums">{fmt(results.totals.validBallots)}</span>
          <span className="text-gray-500">Gültige Stimmen</span>
          <span className="text-right tabular-nums">{fmt(results.totals.validVotes)}</span>
          <span className="text-gray-500">Bewerber:innen</span>
          <span className="text-right tabular-nums">
            {fmt(results.totals.kandidatenInsgesamt)}
            {results.totals.frauenInsgesamt != null && (
              <span className="text-gray-400"> · {fmt(results.totals.frauenInsgesamt)} ♀</span>
            )}
          </span>
          {results.totals.ballotsWithListenkreuzPercent != null && (
            <>
              <span className="text-gray-500">Listenkreuz</span>
              <span className="text-right tabular-nums">{fmtPercent(results.totals.ballotsWithListenkreuzPercent)}</span>
            </>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-2">Sitze im {results.totalSeats}-köpfigen Parlament</h3>
      <ol className="space-y-1">
        {partiesWithSeats.map(p => {
          const color = getPartyColor(p.shortName, electionConfig.partyColors);
          return (
            <li
              key={p.shortName}
              className="bg-white rounded border border-gray-200 px-2 py-1.5 flex items-center gap-2"
            >
              <span className="w-2 h-7 rounded-sm shrink-0" style={{ backgroundColor: color }} aria-hidden />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{p.shortName}</div>
                <div className="text-[10px] text-gray-500 tabular-nums">{fmtPercent(p.percent)}</div>
              </div>
              <div className="text-right tabular-nums">
                <div className="text-sm font-bold">{p.seats}</div>
                <div className="text-[10px] text-gray-400 leading-none">Sitze</div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
